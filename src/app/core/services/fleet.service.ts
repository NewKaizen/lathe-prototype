import { Injectable, signal } from '@angular/core';
import { LatheData, TelemetryHistory } from '../models/fleet.model';
import { LATHES_FLEET } from '../data/fleet-data';
import { computeHealthScore, deriveStatus } from '../lib/status';
import { seededSeries } from '../lib/sparkline';
import { ToastService } from './toast.service';

// MOCK: telemetria simulada via setInterval. Substituir por BaseSocketService.messages$ quando o WebSocket real estiver disponível.

const TICK_MS = 1000;
const HISTORY_CAP = 30;
const TOAST_COOLDOWN_MS = 12_000;
const ANOMALY_CHANCE_SELECTED = 0.01;
const ANOMALY_CHANCE_OTHERS = 0.0015;

interface Baseline {
    rpm: number;
    temperature: number;
    vibration: number;
    efficiency: number;
}
interface LiveValues {
    rpm: number;
    temperature: number;
    vibration: number;
    efficiency: number;
}
interface AnomalyState {
    active: boolean;
    cyclesLeft: number;
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

/** Ruído (dB) estimado a partir da vibração — mesma correlação usada para semear a frota mock. */
function noiseFor(vibration: number): number {
    return vibration <= 0 ? 0 : Math.round((68 + vibration * 3.2) * 10) / 10;
}

@Injectable({ providedIn: 'root' })
export class FleetService {
    private readonly _fleet = signal<LatheData[]>(LATHES_FLEET);
    readonly fleet = this._fleet.asReadonly();
    readonly tick = signal(0);
    readonly selectedLatheId = signal<string | null>(null);

    private readonly history = new Map<string, TelemetryHistory>();
    private readonly baselines = new Map<string, Baseline>();
    private readonly live = new Map<string, LiveValues>();
    private readonly anomalies = new Map<string, AnomalyState>();
    private lastToast = 0;
    private intervalId: ReturnType<typeof setInterval> | null = null;

    constructor(private toast: ToastService) {}

    updateNextMaintenance(machineId: string, date: string): void {
        this._fleet.update((fleet) =>
            fleet.map((lathe) => (lathe.id === machineId ? { ...lathe, nextMaintenance: date } : lathe)),
        );
    }

    historyFor(id: string): TelemetryHistory | undefined {
        return this.history.get(id);
    }

    // MOCK: substituir o setInterval por subscribe em BaseSocketService.messages$ quando o WebSocket real estiver disponível.
    start(): void {
        if (this.intervalId) return;
        this.intervalId = setInterval(() => this.tickOnce(), TICK_MS);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private ensureSeeded(l: LatheData): void {
        if (this.baselines.has(l.id)) return;
        this.baselines.set(l.id, {
            rpm: l.rpm,
            temperature: l.temperature,
            vibration: l.vibration,
            efficiency: l.efficiency,
        });
        this.live.set(l.id, {
            rpm: l.rpm,
            temperature: l.temperature,
            vibration: l.vibration,
            efficiency: l.efficiency,
        });
        this.history.set(l.id, {
            rpm: seededSeries(l.id + 'rpm', l.rpm, Math.max(4, l.rpm * 0.015), HISTORY_CAP).map(Math.round),
            temperature: seededSeries(l.id + 'tmp', l.temperature, 1.2, HISTORY_CAP).map(
                (v) => Math.round(v * 10) / 10,
            ),
            vibration: seededSeries(l.id + 'vib', l.vibration, 0.25, HISTORY_CAP).map((v) =>
                Math.max(0, Math.round(v * 10) / 10),
            ),
            efficiency: seededSeries(l.id + 'eff', l.efficiency, 1.5, HISTORY_CAP).map((v) =>
                clamp(Math.round(v), 0, 100),
            ),
            noise: seededSeries(l.id + 'noise', l.noise, 1.5, HISTORY_CAP).map((v) =>
                Math.max(0, Math.round(v * 10) / 10),
            ),
        });
    }

    private pushHistory(id: string, v: LiveValues): void {
        const h = this.history.get(id);
        if (!h) return;
        h.rpm = [...h.rpm.slice(-(HISTORY_CAP - 1)), Math.round(v.rpm)];
        h.temperature = [...h.temperature.slice(-(HISTORY_CAP - 1)), Math.round(v.temperature * 10) / 10];
        h.vibration = [...h.vibration.slice(-(HISTORY_CAP - 1)), Math.round(v.vibration * 10) / 10];
        h.efficiency = [...h.efficiency.slice(-(HISTORY_CAP - 1)), clamp(Math.round(v.efficiency), 0, 100)];
        h.noise = [...h.noise.slice(-(HISTORY_CAP - 1)), noiseFor(v.vibration)];
    }

    private maybeToast(fn: () => void): void {
        const now = Date.now();
        if (now - this.lastToast < TOAST_COOLDOWN_MS) return;
        this.lastToast = now;
        fn();
    }

    private tickOnce(): void {
        const selected = this.selectedLatheId();
        const next = this.fleet().map((l) => {
            this.ensureSeeded(l);
            const b = this.baselines.get(l.id)!;

            if (l.status === 'maintenance' || b.rpm === 0) {
                this.pushHistory(l.id, {
                    rpm: l.rpm,
                    temperature: l.temperature,
                    vibration: l.vibration,
                    efficiency: l.efficiency,
                });
                return l;
            }

            const live = this.live.get(l.id)!;
            let a = this.anomalies.get(l.id) ?? { active: false, cyclesLeft: 0 };

            const chance = l.id === selected ? ANOMALY_CHANCE_SELECTED : ANOMALY_CHANCE_OTHERS;
            if (!a.active && Math.random() < chance) {
                a = { active: true, cyclesLeft: 8 + Math.floor(Math.random() * 5) };
                this.maybeToast(() =>
                    this.toast.warning('Pico de vibração detectado', `${l.name} · anomalia em curso`),
                );
            }

            if (a.active) {
                live.rpm = Math.max(b.rpm * 0.55, live.rpm - b.rpm * (0.02 + Math.random() * 0.03));
                live.temperature = Math.min(92, live.temperature + Math.random() * 1.8);
                live.vibration = Math.min(8, live.vibration + Math.random() * 0.7);
                a.cyclesLeft--;
                if (a.cyclesLeft <= 0) {
                    a = { active: false, cyclesLeft: 0 };
                    if (l.id === selected) {
                        this.maybeToast(() => this.toast.success('Telemetria normalizada', l.name));
                    }
                }
            } else {
                live.rpm += (b.rpm - live.rpm) * 0.15 + (Math.random() - 0.5) * b.rpm * 0.01;
                live.temperature += (b.temperature - live.temperature) * 0.08 + (Math.random() - 0.5) * 0.8;
                live.vibration = Math.max(
                    0.2,
                    live.vibration + (b.vibration - live.vibration) * 0.15 + (Math.random() - 0.5) * 0.3,
                );
            }
            this.anomalies.set(l.id, a);

            const health = computeHealthScore(live.temperature, live.vibration, live.rpm, b.rpm);
            const targetEff = (health + b.efficiency) / 2;
            live.efficiency += (targetEff - live.efficiency) * 0.3;

            this.pushHistory(l.id, live);

            const efficiency = clamp(Math.round(live.efficiency), 0, 100);
            return {
                ...l,
                rpm: Math.round(live.rpm),
                temperature: Math.round(live.temperature),
                vibration: Math.round(live.vibration * 10) / 10,
                noise: noiseFor(live.vibration),
                efficiency,
                status: deriveStatus(efficiency, live.vibration),
            };
        });

        this._fleet.set(next);
        this.tick.update((t) => t + 1);
    }
}
