import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { LatheData, TelemetryHistory } from '../../core/models/fleet.model';
import { seededSeries, svgPath } from '../../core/lib/sparkline';
import { Icon } from '../../shared/icon/icon';

interface ChartSpec {
    title: string;
    icon: string;
    color: string;
    current: number;
    unit: string;
    limit: number;
    limitLabel: string;
    series: number[];
    path: string;
    limitY: number;
    fillId: string;
}

const WIDTH = 100;
const HEIGHT = 40;

@Component({
    selector: 'app-lathe-charts',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './lathe-charts.html',
})
export class LatheCharts {
    readonly latheData = input.required<LatheData>();
    readonly history = input<TelemetryHistory | undefined>(undefined);

    protected hoverIndex = signal<number | null>(null);

    private rpmSeries = computed(
        () =>
            this.history()?.rpm ??
            seededSeries(this.latheData().id + 'rpm', this.latheData().rpm, this.latheData().rpm * 0.12, 30),
    );
    private tempSeries = computed(
        () =>
            this.history()?.temperature ??
            seededSeries(this.latheData().id + 'tmp', this.latheData().temperature, 6, 30),
    );
    private vibSeries = computed(
        () =>
            this.history()?.vibration ?? seededSeries(this.latheData().id + 'vib', this.latheData().vibration, 0.8, 30),
    );
    private noiseSeries = computed(
        () => this.history()?.noise ?? seededSeries(this.latheData().id + 'noise', this.latheData().noise, 1.5, 30),
    );

    protected charts = computed<ChartSpec[]>(() => {
        const l = this.latheData();

        const rpmMax = Math.max(l.maxRpm || 1000, 10);
        const tempMax = Math.max(l.temperature * 1.5, 100);
        const vibMax = Math.max(l.vibration * 2, 6);
        const noiseMax = Math.max(l.noise * 1.3, 100);

        return [
            {
                title: 'Rotação',
                icon: 'activity',
                color: 'var(--status-blue)',
                current: l.rpm,
                unit: 'RPM',
                limit: l.maxRpm,
                limitLabel: 'Limite máx.',
                series: this.rpmSeries(),
                path: svgPath(this.rpmSeries(), 0, rpmMax, WIDTH, HEIGHT),
                limitY: HEIGHT - (l.maxRpm / rpmMax) * HEIGHT,
                fillId: 'rpmGrad',
            },
            {
                title: 'Temperatura',
                icon: 'thermometer',
                color: 'var(--status-red)',
                current: l.temperature,
                unit: '°C',
                limit: 75,
                limitLabel: 'Limite térmico',
                series: this.tempSeries(),
                path: svgPath(this.tempSeries(), 0, tempMax, WIDTH, HEIGHT),
                limitY: HEIGHT - (75 / tempMax) * HEIGHT,
                fillId: 'tempGrad',
            },
            {
                title: 'Vibração',
                icon: 'zap',
                color: 'var(--status-yellow)',
                current: l.vibration,
                unit: 'mm/s',
                limit: 5,
                limitLabel: 'Limite seguro',
                series: this.vibSeries(),
                path: svgPath(this.vibSeries(), 0, vibMax, WIDTH, HEIGHT),
                limitY: HEIGHT - (5 / vibMax) * HEIGHT,
                fillId: 'vibGrad',
            },
            {
                title: 'Ruído',
                icon: 'volume-2',
                color: 'var(--status-blue)',
                current: l.noise,
                unit: 'dB',
                limit: 85,
                limitLabel: 'Limite de conforto',
                series: this.noiseSeries(),
                path: svgPath(this.noiseSeries(), 0, noiseMax, WIDTH, HEIGHT),
                limitY: HEIGHT - (85 / noiseMax) * HEIGHT,
                fillId: 'noiseGrad',
            },
        ];
    });

    protected onMove(e: MouseEvent, svg: Element, series: number[]): void {
        const rect = svg.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        const idx = Math.round(ratio * (series.length - 1));
        this.hoverIndex.set(Math.max(0, Math.min(series.length - 1, idx)));
    }

    protected onLeave(): void {
        this.hoverIndex.set(null);
    }

    protected hoverValue(series: number[]): number | null {
        const idx = this.hoverIndex();
        return idx === null ? null : series[idx];
    }

    protected hoverX(series: number[]): number {
        const idx = this.hoverIndex() ?? 0;
        return series.length < 2 ? 0 : (idx / (series.length - 1)) * WIDTH;
    }
}
