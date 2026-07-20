import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { LatheData, LatheStatus } from '../../../../core/models/fleet.model';
import { STATUS_META } from '../../../../core/lib/status';
import { ToastService } from '../../../../core/services/toast.service';
import { Icon } from '../../../../shared/icon/icon';
import { FleetOverviewSummary } from '../fleet-overview-view/fleet-overview-view';

export type ReportKey = 'efficiency' | 'maintenance' | 'alerts';

export const REPORT_META: Record<ReportKey, { title: string; icon: string; description: string }> = {
    efficiency: {
        title: 'Relatório de Eficiência da Frota',
        icon: 'trending-up',
        description: 'Ranking completo de eficiência operacional, máquina a máquina, com distribuição por status.',
    },
    maintenance: {
        title: 'Relatório de Manutenções',
        icon: 'calendar',
        description: 'Janela de manutenção de cada torno — última intervenção, próxima prevista e horas acumuladas.',
    },
    alerts: {
        title: 'Relatório de Alertas',
        icon: 'alert-triangle',
        description: 'Máquinas em atenção ou crítico agora, com as leituras de sensor que motivaram o alerta.',
    },
};

const STATUS_ORDER: LatheStatus[] = ['critical', 'warning', 'maintenance', 'operational'];

@Component({
    selector: 'app-fleet-report-detail-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-report-detail-view.html',
})
export class FleetReportDetailView {
    readonly reportKey = input.required<ReportKey>();
    readonly lathes = input.required<LatheData[]>();
    readonly overview = input.required<FleetOverviewSummary>();
    readonly counts = input.required<Record<LatheStatus, number>>();
    readonly urgentAlerts = input.required<LatheData[]>();
    readonly maintenanceSorted = input.required<LatheData[]>();
    readonly maintenanceDueSoon = input.required<number>();

    readonly back = output<void>();

    private toast = inject(ToastService);

    protected STATUS_META = STATUS_META;
    protected statusOrder = STATUS_ORDER;

    protected meta = computed(() => REPORT_META[this.reportKey()]);
    protected generatedAt = computed(() =>
        new Date().toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' }),
    );

    protected efficiencyRanked = computed(() => [...this.lathes()].sort((a, b) => b.efficiency - a.efficiency));

    /** Estado de exportação — mostra "Gerando..." e bloqueia o botão durante o delay simulado. */
    protected isExporting = signal(false);

    /** Exporta CSV client-side com BOM UTF-8. O delay de ~700ms é intencional. PDF via backend é pendência futura. */
    protected exportCsv(): void {
        if (this.isExporting()) return;
        this.isExporting.set(true);

        setTimeout(() => {
            const key = this.reportKey();
            const rows = this.buildRows(key);
            const bom = '\uFEFF'; // UTF-8 BOM para Excel reconhecer corretamente
            const csv =
                bom + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10);
            const filename = `relatorio-${key}-${date}.csv`;

            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.isExporting.set(false);
            this.toast.success('Relatório exportado', filename);
        }, 700);
    }

    private buildRows(key: ReportKey): (string | number)[][] {
        switch (key) {
            case 'efficiency': {
                const header = ['Posição', 'Máquina', 'Modelo', 'Linha', 'Eficiência (%)', 'Status'];
                const data = this.efficiencyRanked().map((l, i) => [
                    i + 1,
                    l.name,
                    l.model,
                    l.sector,
                    l.efficiency,
                    STATUS_META[l.status].label,
                ]);
                return [header, ...data];
            }
            case 'maintenance': {
                const header = [
                    'Máquina',
                    'Modelo',
                    'Linha',
                    'Última Manutenção',
                    'Próxima Manutenção',
                    'Horas Trabalhadas',
                    'Status',
                ];
                const data = this.maintenanceSorted().map((l) => [
                    l.name,
                    l.model,
                    l.sector,
                    l.lastMaintenance,
                    l.nextMaintenance,
                    l.hoursWorked,
                    STATUS_META[l.status].label,
                ]);
                return [header, ...data];
            }
            case 'alerts': {
                const header = [
                    'Máquina',
                    'Modelo',
                    'Linha',
                    'Temperatura (°C)',
                    'Vibração (mm/s)',
                    'Eficiência (%)',
                    'Status',
                ];
                const data = this.urgentAlerts().map((l) => [
                    l.name,
                    l.model,
                    l.sector,
                    l.temperature,
                    l.vibration.toFixed(1),
                    l.efficiency,
                    STATUS_META[l.status].label,
                ]);
                return [header, ...data];
            }
        }
    }
}
