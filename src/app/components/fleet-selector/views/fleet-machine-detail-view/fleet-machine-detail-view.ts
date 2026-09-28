import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import {
    LatheData,
    MaintenanceRecord,
    ScheduledMaintenance,
    TelemetryHistory,
} from '../../../../core/models/fleet.model';
import { STATUS_META, anomalyScore, scoreHeadline } from '../../../../core/lib/status';
import { typeLabel } from '../../../../core/lib/format';
import { Icon } from '../../../../shared/icon/icon';
import { ConfirmButton } from '../../../../shared/confirm-button/confirm-button';
import { DigitalTwin } from '../../../digital-twin/digital-twin';
import { LatheDashboard } from '../../../lathe-dashboard/lathe-dashboard';
import { LatheCharts } from '../../../lathe-charts/lathe-charts';

export type MachineTab = 'digital-twin' | 'dashboard' | 'graphs' | 'maintenance';

const NAV_ITEMS: { id: MachineTab; label: string; icon: string }[] = [
    { id: 'digital-twin', label: 'Gêmeo 3D', icon: 'box' },
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-grid' },
    { id: 'graphs', label: 'Gráficos', icon: 'bar-chart-3' },
    { id: 'maintenance', label: 'Manutenção', icon: 'calendar' },
];

/** Ícone e cor por tipo, para identificar cada registro na linha do tempo. */
const MAINTENANCE_TYPE_META: Record<MaintenanceRecord['type'], { icon: string; bg: string }> = {
    Preventiva: { icon: 'shield-check', bg: 'bg-[var(--status-blue)]' },
    Preditiva: { icon: 'activity', bg: 'bg-[var(--status-purple)]' },
    Corretiva: { icon: 'alert-triangle', bg: 'bg-[var(--status-red)]' },
};

@Component({
    selector: 'app-fleet-machine-detail-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon, ConfirmButton, DigitalTwin, LatheDashboard, LatheCharts],
    templateUrl: './fleet-machine-detail-view.html',
})
export class FleetMachineDetailView {
    readonly lathe = input.required<LatheData>();
    readonly history = input<TelemetryHistory | undefined>(undefined);
    readonly tick = input<number>(0);
    readonly activeTab = input<string>('dashboard');
    readonly scheduledActive = input.required<ScheduledMaintenance[]>();
    readonly scheduledResolved = input.required<ScheduledMaintenance[]>();
    readonly maintenanceHistory = input.required<MaintenanceRecord[]>();

    readonly activeTabChange = output<string>();
    readonly back = output<void>();
    readonly openScheduler = output<void>();
    readonly updateStatus = output<{ id: string; status: 'completed' | 'cancelled' }>();

    protected navItems = NAV_ITEMS;
    protected STATUS_META = STATUS_META;
    protected typeLabel = typeLabel;

    protected twinMode = signal<'3d' | 'camera'>('3d');

    protected meta = computed(() => STATUS_META[this.lathe().status]);
    protected anomaly = computed(() => anomalyScore(this.lathe().status, this.lathe().vibration));
    protected headline = computed(() => scoreHeadline(this.lathe().efficiency));

    protected maintenanceTypeMeta(type: MaintenanceRecord['type']) {
        return MAINTENANCE_TYPE_META[type];
    }
}
