import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { LatheData, LatheStatus } from '../../core/models/fleet.model';
import { STATUS_META } from '../../core/lib/status';
import { parseDMY } from '../../core/lib/format';
import { estimateFleetEnergy } from '../../core/lib/energy';
import { FleetLayoutMode, SettingsService } from '../../core/services/settings.service';
import { UserSettingsModal } from '../user-settings-modal/user-settings-modal';
import { Icon } from '../../shared/icon/icon';
import { CommandSearch, CommandSearchSelection } from '../../shared/command-search/command-search';
import { FleetHomeView, FleetQuickAccessTarget } from './views/fleet-home-view/fleet-home-view';
import { FleetListingView, FilterStatus } from './views/fleet-listing-view/fleet-listing-view';
import { FleetAlertsView } from './views/fleet-alerts-view/fleet-alerts-view';
import { FleetMaintenanceView } from './views/fleet-maintenance-view/fleet-maintenance-view';
import { FleetOverviewView } from './views/fleet-overview-view/fleet-overview-view';
import { FleetPlantView } from './views/fleet-plant-view/fleet-plant-view';
import { FleetEnergyView } from './views/fleet-energy-view/fleet-energy-view';
import { FleetReportsView } from './views/fleet-reports-view/fleet-reports-view';
import { FleetTipsView } from './views/fleet-tips-view/fleet-tips-view';
import { FleetCommandsView } from './views/fleet-commands-view/fleet-commands-view';
import {
    FleetReportDetailView,
    ReportKey,
    REPORT_META,
} from './views/fleet-report-detail-view/fleet-report-detail-view';
import { FleetCostDetailView } from './views/fleet-cost-detail-view/fleet-cost-detail-view';
import { FleetCompareView } from './views/fleet-compare-view/fleet-compare-view';

type FleetView =
    | 'home'
    | 'fleet'
    | 'alerts'
    | 'maintenance'
    | 'overview'
    | 'plant'
    | 'energy'
    | 'reports'
    | 'tips'
    | 'commands'
    | 'report-detail'
    | 'cost-detail'
    | 'compare';

/** Página-pai de cada view "de documento" — usado para destaque de nav e breadcrumb. */
const VIEW_PARENT: Partial<Record<FleetView, FleetView>> = {
    'report-detail': 'reports',
    'cost-detail': 'energy',
};

/** Subconjunto curado para a barra inferior mobile (espaço limitado a 5 ícones).
 *  O 6º slot é o botão "Mais" que abre a sheet com NAV_GROUPS completo (Fase F). */
const MOBILE_NAV_ITEMS: { id: FleetView; label: string; icon: string }[] = [
    { id: 'home', label: 'Início', icon: 'home' },
    { id: 'fleet', label: 'Frota', icon: 'layout-grid' },
    { id: 'alerts', label: 'Alertas', icon: 'alert-triangle' },
    { id: 'maintenance', label: 'Manutenções', icon: 'calendar' },
    { id: 'energy', label: 'Energia', icon: 'zap' },
];

const STATUS_ORDER: Record<LatheStatus, number> = { critical: 0, warning: 1, maintenance: 2, operational: 3 };

function sortLathes(lathes: LatheData[]): LatheData[] {
    return [...lathes].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.id.localeCompare(b.id));
}

/** Nav única, sempre visível — agrupada por tema em vez de escondida atrás de abas. */
const NAV_GROUPS: { title: string; items: { id: FleetView; label: string; icon: string }[] }[] = [
    {
        title: 'Visão Geral',
        items: [
            { id: 'home', label: 'Início', icon: 'home' },
            { id: 'overview', label: 'Resumo', icon: 'bar-chart-3' },
        ],
    },
    {
        title: 'Frota',
        items: [
            { id: 'fleet', label: 'Frota', icon: 'layout-grid' },
            { id: 'alerts', label: 'Alertas', icon: 'alert-triangle' },
            { id: 'maintenance', label: 'Manutenções', icon: 'calendar' },
            { id: 'plant', label: 'Planta D', icon: 'factory' },
            { id: 'compare', label: 'Comparar Máquinas', icon: 'git-compare-arrows' },
        ],
    },
    {
        title: 'Análise',
        items: [
            { id: 'energy', label: 'Energia & Custos', icon: 'zap' },
            { id: 'reports', label: 'Relatórios', icon: 'file-text' },
        ],
    },
    {
        title: 'Ajuda',
        items: [
            { id: 'tips', label: 'Dicas & Boas Práticas', icon: 'lightbulb' },
            { id: 'commands', label: 'Central de Comandos', icon: 'search' },
        ],
    },
];

const VIEW_TITLES: Record<FleetView, string> = {
    home: 'Início',
    fleet: 'Frota',
    alerts: 'Alertas',
    maintenance: 'Manutenções',
    overview: 'Resumo',
    plant: 'Planta D',
    energy: 'Energia & Custos',
    reports: 'Relatórios',
    tips: 'Dicas & Boas Práticas',
    commands: 'Central de Comandos',
    'report-detail': 'Relatório',
    'cost-detail': 'Custo da Máquina',
    compare: 'Comparação de Máquinas',
};

const VIEW_SUBTITLES: Partial<Record<FleetView, string>> = {
    energy: 'Estimativa de consumo e custo de energia da frota.',
    reports: 'Indicadores, processos em andamento e relatórios individuais.',
    tips: 'Boas práticas para reduzir custos e aproveitar melhor o sistema.',
    commands: 'Sintaxe da busca interna — páginas, ações e tornos.',
    compare: 'Compare até 4 tornos lado a lado em métricas operacionais.',
};

function groupBySector(lathes: LatheData[]): [string, LatheData[]][] {
    const map = new Map<string, LatheData[]>();
    for (const l of lathes) {
        const key = l.sector || 'Sem linha';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(l);
    }
    const collator = new Intl.Collator('pt-BR', { numeric: true });
    return [...map.entries()]
        .map<[string, LatheData[]]>(([sector, group]) => [sector, sortLathes(group)])
        .sort((a, b) => collator.compare(a[0], b[0]));
}

@Component({
    selector: 'app-fleet-selector',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        UserSettingsModal,
        Icon,
        CommandSearch,
        FleetHomeView,
        FleetListingView,
        FleetAlertsView,
        FleetMaintenanceView,
        FleetOverviewView,
        FleetPlantView,
        FleetEnergyView,
        FleetReportsView,
        FleetTipsView,
        FleetCommandsView,
        FleetReportDetailView,
        FleetCostDetailView,
        FleetCompareView,
    ],
    templateUrl: './fleet-selector.html',
})
export class FleetSelector {
    readonly lathes = input.required<LatheData[]>();
    readonly userName = input<string>('Administrador');

    readonly select = output<LatheData>();
    readonly logout = output<void>();

    private settings = inject(SettingsService);

    protected fleetView = signal<FleetView>('home');
    protected search = signal('');
    protected filter = signal<FilterStatus>('all');
    protected isSettingsOpen = signal(false);
    protected isSidebarCollapsed = signal(false);
    protected collapsedSectors = signal<Set<string>>(new Set());
    protected layoutMode = this.settings.fleetLayoutMode;

    protected selectedReportKey = signal<ReportKey | null>(null);
    protected selectedCostMachineId = signal<string | null>(null);

    /** Fase F: controla a abertura da sheet "Mais" no nav inferior mobile. */
    protected isMobileMoreOpen = signal(false);

    protected navGroups = NAV_GROUPS;
    protected mobileNavItems = MOBILE_NAV_ITEMS;
    protected viewTitles = VIEW_TITLES;
    protected viewSubtitles = VIEW_SUBTITLES;
    protected STATUS_META = STATUS_META;
    protected statusOrder: LatheStatus[] = ['critical', 'warning', 'maintenance', 'operational'];

    protected filtered = computed(() => {
        const s = this.search().toLowerCase();
        const f = this.filter();
        return this.lathes().filter((l) => {
            const matchSearch =
                l.name.toLowerCase().includes(s) || l.id.toLowerCase().includes(s) || l.model.toLowerCase().includes(s);
            const matchFilter = f === 'all' || l.status === f;
            return matchSearch && matchFilter;
        });
    });

    protected grouped = computed(() => groupBySector(this.filtered()));
    protected flatSorted = computed(() => sortLathes(this.filtered()));
    protected isFiltering = computed(() => this.search().trim() !== '' || this.filter() !== 'all');

    /** Planta D — mapa esquemático por setor (não depende de busca/filtro da Frota). */
    protected plantSectors = computed(() => groupBySector(this.lathes()));

    protected setLayoutMode(mode: FleetLayoutMode): void {
        this.settings.setFleetLayoutMode(mode);
    }

    /** Roteador único de navegação interna — usado pela sidebar, atalhos, busca e "voltar". */
    protected goTo(view: FleetView | FleetQuickAccessTarget): void {
        this.fleetView.set(view as FleetView);
        // Fechar sheet "Mais" ao navegar
        this.isMobileMoreOpen.set(false);
    }

    /** Item de nav que deve aparecer ativo — páginas de documento contam como parte de
     *  Relatórios/Energia (seu grupo pai) para fins de destaque visual. */
    protected activeNavId = computed<FleetView>(() => VIEW_PARENT[this.fleetView()] ?? this.fleetView());

    /** Trilha de navegação exibida no topo de toda página, sempre visível. */
    protected breadcrumb = computed<{ label: string; view: FleetView | null }[]>(() => {
        const v = this.fleetView();
        if (v === 'home') return [{ label: 'Início', view: null }];

        const crumbs: { label: string; view: FleetView | null }[] = [{ label: 'Início', view: 'home' }];
        const parent = VIEW_PARENT[v];
        if (parent) {
            crumbs.push({ label: VIEW_TITLES[parent], view: parent });
            const reportKey = this.selectedReportKey();
            const costMachine = this.selectedCostMachine();
            const leaf =
                v === 'report-detail' && reportKey
                    ? REPORT_META[reportKey].title
                    : v === 'cost-detail' && costMachine
                      ? costMachine.name
                      : VIEW_TITLES[v];
            crumbs.push({ label: leaf, view: null });
        } else {
            crumbs.push({ label: VIEW_TITLES[v], view: null });
        }
        return crumbs;
    });

    protected openReportDetail(key: ReportKey): void {
        this.selectedReportKey.set(key);
        this.goTo('report-detail');
    }

    protected openCostDetail(latheId: string): void {
        this.selectedCostMachineId.set(latheId);
        this.goTo('cost-detail');
    }

    protected selectedCostMachine = computed(() => this.lathes().find((l) => l.id === this.selectedCostMachineId()));
    protected selectedCostEstimate = computed(() =>
        this.energyEstimate().perMachine.find((m) => m.id === this.selectedCostMachineId()),
    );

    /** Trata a seleção vinda da busca interna (app-command-search): página, ação ou torno. */
    protected onCommandSelect(selection: CommandSearchSelection): void {
        if (selection.kind === 'page') {
            this.goTo(selection.target as FleetView);
        } else if (selection.kind === 'machine') {
            const lathe = this.lathes().find((l) => l.id === selection.latheId);
            if (lathe) this.select.emit(lathe);
        } else if (selection.kind === 'action') {
            this.runAction(selection.id);
        }
    }

    private runAction(id: string): void {
        switch (id) {
            case 'open-settings':
                this.isSettingsOpen.set(true);
                break;
            case 'logout':
                this.logout.emit();
                break;
            case 'toggle-sidebar':
                this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
                break;
            case 'layout-grid':
                this.setLayoutMode('grid');
                this.goTo('fleet');
                break;
            case 'layout-list':
                this.setLayoutMode('list');
                this.goTo('fleet');
                break;
            case 'layout-grouped':
                this.setLayoutMode('grouped');
                this.goTo('fleet');
                break;
            case 'filter-critical':
                this.filter.set('critical');
                this.goTo('fleet');
                break;
            case 'report-efficiency':
                this.openReportDetail('efficiency');
                break;
            case 'report-maintenance':
                this.openReportDetail('maintenance');
                break;
            case 'report-alerts':
                this.openReportDetail('alerts');
                break;
        }
    }

    protected allCollapsed = computed(() => {
        const g = this.grouped();
        return g.length > 0 && g.every(([s]) => this.collapsedSectors().has(s));
    });

    protected counts = computed(() => {
        const l = this.lathes();
        return {
            operational: l.filter((x) => x.status === 'operational').length,
            warning: l.filter((x) => x.status === 'warning').length,
            critical: l.filter((x) => x.status === 'critical').length,
            maintenance: l.filter((x) => x.status === 'maintenance').length,
        };
    });

    protected alertCount = computed(() => this.counts().warning + this.counts().critical);

    protected urgentAlerts = computed(() =>
        this.lathes()
            .filter((l) => l.status === 'critical' || l.status === 'warning')
            .sort((a, b) => (a.status === 'critical' ? -1 : 1) - (b.status === 'critical' ? -1 : 1)),
    );

    protected maintenanceSorted = computed(() =>
        [...this.lathes()].sort(
            (a, b) => parseDMY(a.nextMaintenance).getTime() - parseDMY(b.nextMaintenance).getTime(),
        ),
    );

    protected maintenanceDueSoon = computed(() => {
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return this.lathes().filter((l) => {
            const due = parseDMY(l.nextMaintenance);
            return due.getTime() >= now.getTime() && due.getTime() <= in7Days.getTime();
        }).length;
    });

    protected processesInProgress = computed(() => this.lathes().filter((l) => !!l.currentProcess));

    protected energyEstimate = computed(() => estimateFleetEnergy(this.lathes()));

    protected overview = computed(() => {
        const l = this.lathes();
        const operational = l.filter((x) => x.status === 'operational');
        const avgEfficiency = Math.round(operational.reduce((s, x) => s + x.efficiency, 0) / (operational.length || 1));
        const avgTemp = Math.round(l.reduce((s, x) => s + x.temperature, 0) / (l.length || 1));
        const totalHours = l.reduce((s, x) => s + x.hoursWorked, 0);
        const topPerformers = [...l].sort((a, b) => b.efficiency - a.efficiency).slice(0, 3);
        return { avgEfficiency, avgTemp, totalHours: totalHours.toLocaleString('pt-BR'), topPerformers };
    });

    protected toggleSector(sector: string): void {
        const next = new Set(this.collapsedSectors());
        next.has(sector) ? next.delete(sector) : next.add(sector);
        this.collapsedSectors.set(next);
    }

    protected toggleAllSectors(): void {
        this.collapsedSectors.set(this.allCollapsed() ? new Set() : new Set(this.grouped().map(([s]) => s)));
    }

    /** Fase F: fecha a sheet "Mais" ao pressionar ESC (mesmo padrão do maintenance-scheduler). */
    @HostListener('document:keydown.escape')
    onEsc(): void {
        if (this.isMobileMoreOpen()) this.isMobileMoreOpen.set(false);
    }
}
