import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LatheData, SensorConfig, TelemetryHistory } from '../../core/models/fleet.model';
import { STATUS_META, anomalyScore, scoreLabel } from '../../core/lib/status';
import { seededSeries, svgPath } from '../../core/lib/sparkline';
import {
    mockOperationalState,
    OPERATIONAL_MODE_LABEL,
    OPERATIONAL_HEALTH_LABEL,
} from '../../core/data/operational-state.mock';
import { Icon } from '../../shared/icon/icon';

interface SensorCardData {
    icon: string;
    label: string;
    unit: string;
    caption: string;
    value: string | number;
    alert: boolean;
    alertColor: string;
    okColor?: string;
    path: string;
}

function bounds(values: number[], padRatio = 0.25): [number, number] {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max((max - min) * padRatio, 0.5);
    return [min - pad, max + pad];
}

@Component({
    selector: 'app-lathe-dashboard',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './lathe-dashboard.html',
})
export class LatheDashboard {
    readonly latheData = input.required<LatheData>();
    readonly history = input<TelemetryHistory | undefined>(undefined);

    protected meta = computed(() => STATUS_META[this.latheData().status]);
    protected eff = computed(() => this.latheData().efficiency);
    protected aScore = computed(() => anomalyScore(this.latheData().status, this.latheData().vibration));
    protected scoreLabel = computed(() => scoreLabel(this.eff()));
    protected scoreTagClass = computed(() => {
        const eff = this.eff();
        return eff >= 80 ? 'tag tag-green' : eff >= 55 ? 'tag tag-yellow' : 'tag tag-red';
    });
    protected dots = computed(() => Array.from({ length: 20 }, (_, i) => i < Math.round(this.eff() / 5)));

    private seed = computed(() => this.latheData().id);

    private rpmSeries = computed(
        () =>
            this.history()?.rpm ?? seededSeries(this.seed() + 'rpm', this.latheData().rpm, this.latheData().rpm * 0.12),
    );
    private vibSeries = computed(
        () => this.history()?.vibration ?? seededSeries(this.seed() + 'vib', this.latheData().vibration, 1.2),
    );
    private tempSeries = computed(
        () => this.history()?.temperature ?? seededSeries(this.seed() + 'tmp', this.latheData().temperature, 4),
    );
    private effSeries = computed(() => this.history()?.efficiency ?? seededSeries(this.seed() + 'eff', this.eff(), 5));
    private noiseSeries = computed(
        () => this.history()?.noise ?? seededSeries(this.seed() + 'noise', this.latheData().noise, 1.5),
    );

    protected anomalyBars = computed(() => {
        const tail = this.vibSeries().slice(-14);
        return tail.map((v) => Math.round(Math.min(95, Math.max(8, (v / 8) * 100))));
    });

    protected sensorCards = computed<SensorCardData[]>(() => {
        const l = this.latheData();
        const [rpmMin, rpmMax] = bounds(this.rpmSeries());
        const [vibMin, vibMax] = bounds(this.vibSeries());
        const [tempMin, tempMax] = bounds(this.tempSeries());
        const [noiseMin, noiseMax] = bounds(this.noiseSeries());

        const rpmLow = l.rpm < l.maxRpm * 0.25 && l.status !== 'maintenance';
        const vibHigh = l.vibration > 4;
        const tempHigh = l.temperature > 70;
        const noiseHigh = l.noise > 85;
        const eff = this.eff();

        return [
            {
                icon: 'activity',
                label: 'RPM',
                unit: 'rpm',
                caption: 'Rotação do Eixo',
                value: l.rpm,
                alert: rpmLow,
                alertColor: 'var(--status-red)',
                path: svgPath(this.rpmSeries(), rpmMin, rpmMax),
            },
            {
                icon: 'radio',
                label: 'Vibração',
                unit: 'mm/s',
                caption: 'Vibração Estrutural',
                value: l.vibration.toFixed(1),
                alert: vibHigh,
                alertColor: 'var(--status-yellow)',
                path: svgPath(this.vibSeries(), vibMin, vibMax),
            },
            {
                icon: 'thermometer',
                label: 'Temp.',
                unit: '°C',
                caption: 'Temp. Mancal',
                value: l.temperature,
                alert: tempHigh,
                alertColor: 'var(--status-red)',
                path: svgPath(this.tempSeries(), tempMin, tempMax),
            },
            {
                icon: 'volume-2',
                label: 'Ruído',
                unit: 'dB',
                caption: 'Ruído Estrutural',
                value: l.noise.toFixed(1),
                alert: noiseHigh,
                alertColor: 'var(--status-yellow)',
                path: svgPath(this.noiseSeries(), noiseMin, noiseMax),
            },
            {
                icon: 'trending-up',
                label: 'OEE',
                unit: '%',
                caption: 'Eficiência',
                value: eff,
                alert: eff < 55,
                alertColor: 'var(--status-red)',
                okColor: eff >= 55 ? `var(--status-${eff >= 85 ? 'green' : 'yellow'})` : undefined,
                path: svgPath(this.effSeries(), 0, 100),
            },
        ];
    });

    protected hoursWorkedFormatted = computed(() => this.latheData().hoursWorked.toLocaleString('pt-BR'));

    protected operationalState = computed(() => mockOperationalState(this.latheData()));
    protected modeLabel = OPERATIONAL_MODE_LABEL;
    protected healthLabel = OPERATIONAL_HEALTH_LABEL;

    protected colorFor(c: SensorCardData): string {
        return c.alert ? c.alertColor : (c.okColor ?? 'color-mix(in srgb, var(--foreground) 55%, transparent)');
    }

    protected sensorIcon(type: SensorConfig['type']): string {
        const icons: Record<SensorConfig['type'], string> = {
            rpm: 'gauge',
            vibration: 'radio',
            temperature: 'thermometer',
            pressure: 'activity',
            level: 'activity',
            position: 'activity',
        };
        return icons[type];
    }

    protected strokeFor(c: SensorCardData): string {
        return c.alert ? c.alertColor : 'var(--muted-foreground)';
    }
}
