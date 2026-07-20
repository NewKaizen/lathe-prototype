import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LatheData } from '../../core/models/fleet.model';
import { STATUS_META } from '../../core/lib/status';
import { Icon } from '../../shared/icon/icon';

export type MachineView = 'digital-twin' | 'dashboard' | 'graphs' | 'maintenance';

const NAV_ITEMS: { id: MachineView; label: string; mobileLabel: string; icon: string }[] = [
    { id: 'digital-twin', label: 'Gêmeo 3D', mobileLabel: 'Gêmeo', icon: 'box' },
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Monitor', icon: 'layout-grid' },
    { id: 'graphs', label: 'Gráficos', mobileLabel: 'Gráficos', icon: 'bar-chart-3' },
    { id: 'maintenance', label: 'Manutenção', mobileLabel: 'Manut.', icon: 'calendar' },
];

const HEALTH_BY_STATUS: Record<string, string> = {
    operational: 'Normal',
    warning: 'Atenção',
    critical: 'Alerta',
    maintenance: 'Parado',
};

@Component({
    selector: 'app-machine-sidebar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './machine-sidebar.html',
})
export class MachineSidebar {
    readonly lathe = input.required<LatheData>();
    readonly view = input.required<string>();
    readonly tick = input<number>(0);
    readonly isCollapsed = input<boolean>(false);
    readonly userName = input<string>('Administrador');

    readonly viewChange = output<MachineView>();
    readonly back = output<void>();
    readonly toggleCollapse = output<void>();
    readonly openSettings = output<void>();
    readonly logout = output<void>();

    protected navItems = NAV_ITEMS;

    protected meta = computed(() => STATUS_META[this.lathe().status]);
    // MOCK: ping derivado do tick da simulação local — substituir por latência real do BaseSocketService.
    protected pingMs = computed(() => 10 + ((this.tick() * 7) % 9));
    protected healthLabel = computed(() => HEALTH_BY_STATUS[this.lathe().status]);
}
