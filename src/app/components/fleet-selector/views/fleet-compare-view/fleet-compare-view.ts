import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { LatheData } from '../../../../core/models/fleet.model';
import { STATUS_META } from '../../../../core/lib/status';
import { svgPath, seededSeries } from '../../../../core/lib/sparkline';
import { normalizeSearch } from '../../../../core/lib/text';
import { Icon } from '../../../../shared/icon/icon';

/** Métricas exibidas na tabela comparativa, em ordem de apresentação. */
const COMPARE_METRICS: {
    key: keyof LatheData;
    label: string;
    unit: string;
    icon: string;
    lowerIsBetter: boolean;
    /** Função de formatação do valor para exibição. */
    fmt?: (v: number) => string;
    /** Min/max para a sparkline. */
    sparkRange: { min: number; max: number };
    /** Chave no histórico de telemetria (TelemetryHistory), se disponível. */
    historyKey?: 'rpm' | 'temperature' | 'vibration' | 'efficiency' | 'noise';
}[] = [
    {
        key: 'rpm',
        label: 'Rotação (RPM)',
        unit: 'rpm',
        icon: 'gauge',
        lowerIsBetter: false,
        sparkRange: { min: 0, max: 2000 },
        historyKey: 'rpm',
    },
    {
        key: 'temperature',
        label: 'Temperatura',
        unit: '°C',
        icon: 'thermometer',
        lowerIsBetter: true,
        fmt: (v) => v.toFixed(0),
        sparkRange: { min: 20, max: 100 },
        historyKey: 'temperature',
    },
    {
        key: 'vibration',
        label: 'Vibração',
        unit: 'mm/s',
        icon: 'activity',
        lowerIsBetter: true,
        fmt: (v) => v.toFixed(1),
        sparkRange: { min: 0, max: 8 },
        historyKey: 'vibration',
    },
    {
        key: 'noise',
        label: 'Ruído',
        unit: 'dB',
        icon: 'volume-2',
        lowerIsBetter: true,
        fmt: (v) => v.toFixed(1),
        sparkRange: { min: 60, max: 100 },
        historyKey: 'noise',
    },
    {
        key: 'efficiency',
        label: 'Eficiência',
        unit: '%',
        icon: 'zap',
        lowerIsBetter: false,
        sparkRange: { min: 0, max: 100 },
        historyKey: 'efficiency',
    },
    {
        key: 'hoursWorked',
        label: 'Horas Trabalhadas',
        unit: 'h',
        icon: 'clock',
        lowerIsBetter: false,
        fmt: (v) => v.toLocaleString('pt-BR'),
        sparkRange: { min: 0, max: 10000 },
    },
];

const MAX_COMPARE = 4;

@Component({
    selector: 'app-fleet-compare-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-compare-view.html',
})
export class FleetCompareView {
    /** Todas as máquinas disponíveis para seleção. */
    readonly lathes = input.required<LatheData[]>();

    /** Emitido quando o usuário clica em "Ver detalhes" de uma máquina. */
    readonly select = output<LatheData>();

    protected STATUS_META = STATUS_META;
    protected metrics = COMPARE_METRICS;
    protected maxCompare = MAX_COMPARE;

    /** IDs das máquinas selecionadas para comparação (máx. MAX_COMPARE) — a ordem do array
     *  é a ordem das colunas da tabela comparativa abaixo. */
    protected selectedIds = signal<string[]>([]);
    /** Texto de busca no picker. */
    protected pickerSearch = signal('');

    /** Máquinas selecionadas para comparação, na ordem de adição. */
    protected selectedLathes = computed(() =>
        this.selectedIds()
            .map((id) => this.lathes().find((l) => l.id === id))
            .filter((l): l is LatheData => !!l),
    );

    /** Máquinas disponíveis para adicionar (não selecionadas, filtradas pela busca). */
    protected availableLathes = computed(() => {
        const ids = new Set(this.selectedIds());
        const q = normalizeSearch(this.pickerSearch());
        return this.lathes().filter(
            (l) => !ids.has(l.id) && (normalizeSearch(l.name).includes(q) || normalizeSearch(l.id).includes(q)),
        );
    });

    protected canAdd = computed(() => this.selectedIds().length < MAX_COMPARE);
    protected hasEnough = computed(() => this.selectedIds().length >= 2);

    protected addLathe(id: string): void {
        if (!this.canAdd() || this.selectedIds().includes(id)) return;
        this.selectedIds.update((ids) => [...ids, id]);
    }

    protected removeLathe(id: string): void {
        this.selectedIds.update((ids) => ids.filter((x) => x !== id));
    }

    /** Valor numérico de uma métrica para uma máquina. */
    protected metricValue(lathe: LatheData, metric: (typeof COMPARE_METRICS)[number]): number {
        return (lathe[metric.key] as number) ?? 0;
    }

    /** Formata um valor numérico de métrica para exibição. */
    protected fmtValue(lathe: LatheData, metric: (typeof COMPARE_METRICS)[number]): string {
        const v = this.metricValue(lathe, metric);
        return metric.fmt ? metric.fmt(v) : String(v);
    }

    /**
     * Determina qual máquina tem o melhor valor numa linha de métrica.
     * Retorna o índice no array selectedLathes(), ou null se empate/1 máquina.
     */
    protected bestIndex(metric: (typeof COMPARE_METRICS)[number]): number | null {
        const lathes = this.selectedLathes();
        if (lathes.length < 2) return null;
        const values = lathes.map((l) => this.metricValue(l, metric));
        const best = metric.lowerIsBetter ? Math.min(...values) : Math.max(...values);
        const idx = values.indexOf(best);
        // Só destaca se houver diferença real
        if (values.filter((v) => v === best).length === lathes.length) return null;
        return idx;
    }

    /** Classe de texto de destaque para a célula melhor. */
    protected bestTextClass(metric: (typeof COMPARE_METRICS)[number], index: number): string {
        if (this.bestIndex(metric) === index) {
            return metric.lowerIsBetter ? 'text-[var(--status-green)]' : 'text-[var(--status-green)]';
        }
        return 'text-foreground';
    }

    /** Classe de bg leve para a célula melhor. */
    protected bestBgClass(metric: (typeof COMPARE_METRICS)[number], index: number): string {
        if (this.bestIndex(metric) === index) return 'bg-[var(--status-green)]/5';
        return '';
    }

    /** Sparkline SVG para um histórico de série. */
    protected sparklinePath(lathe: LatheData, metric: (typeof COMPARE_METRICS)[number]): string {
        // Usa seededSeries como fallback quando o histórico real não está disponível
        const series = seededSeries(
            lathe.id + (metric.historyKey ?? metric.key),
            this.metricValue(lathe, metric),
            this.metricValue(lathe, metric) * 0.05,
            20,
        );
        return svgPath(series, metric.sparkRange.min, metric.sparkRange.max, 60, 20);
    }

    /** Cor da sparkline baseada no status da máquina. */
    protected sparkColor(lathe: LatheData): string {
        return STATUS_META[lathe.status].cssVar;
    }
}
