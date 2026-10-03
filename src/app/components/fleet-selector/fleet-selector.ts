import { Toolbar, ToolbarWidget, ToolbarWidgetGroup } from '@angular/aria/toolbar';
import { Menu, MenuItem, MenuTrigger, MenuContent } from '@angular/aria/menu';
import { createFleetMaintenanceState } from './state/fleet-maintenance-state';
import { Tabs, TabList, Tab, TabPanel, TabContent } from '@angular/aria/tabs';
import { createFleetListingState } from './state/fleet-listing-state';
import { createFleetInsights } from './state/fleet-insights';
import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    computed,
    effect,
    inject,
    input,
    output,
    signal,
    viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LatheData, LatheStatus, MaintenanceData, TelemetryHistory } from '../../core/models/fleet.model';
import { STATUS_META } from '../../core/lib/status';
import { FleetLayoutMode, SettingsService } from '../../core/services/settings.service';
import { FleetService } from '../../core/services/fleet.service';
import { UserSettingsModal } from '../user-settings-modal/user-settings-modal';
import { MaintenanceScheduler } from '../maintenance-scheduler/maintenance-scheduler';
import { Icon } from '../../shared/icon/icon';
import { CommandSearch, CommandSearchSelection } from '../../shared/command-search/command-search';
import { FleetHomeView } from './views/fleet-home-view/fleet-home-view';
import { FleetListingView, FilterStatus } from './views/fleet-listing-view/fleet-listing-view';
import { FleetAlertsView } from './views/fleet-alerts-view/fleet-alerts-view';
import { FleetMaintenanceView } from './views/fleet-maintenance-view/fleet-maintenance-view';
import { FleetPlantView } from './views/fleet-plant-view/fleet-plant-view';
import { FleetEnergyView } from './views/fleet-energy-view/fleet-energy-view';
import { FleetReportsView } from './views/fleet-reports-view/fleet-reports-view';
import { FleetReportDetailView, ReportKey } from './views/fleet-report-detail-view/fleet-report-detail-view';
import { FleetCostDetailView } from './views/fleet-cost-detail-view/fleet-cost-detail-view';
import { FleetCompareView } from './views/fleet-compare-view/fleet-compare-view';
import { FleetMachineDetailView } from './views/fleet-machine-detail-view/fleet-machine-detail-view';
import { NotificationsBell } from '../notifications-panel/notifications-panel';
import { DEFAULT_FLEET_NAV, FleetNav, FleetTab, FleetView } from '../../core/models/fleet-nav';

/** Nav principal — máx. 5 itens (Fase 2.2). "Resumo" foi absorvido por "Início"
 *  (app-fleet-home-view já embute app-fleet-overview-view) e "Energia & Custos"
 *  virou uma aba dentro de "Relatórios". */
/** Alvos de navegação "legados", ainda referenciados por sub-componentes e pela busca interna —
 *  goTo() os traduz para a view + aba correspondente da nova estrutura unificada (Fase 2.1). */
type NavTarget = FleetView | 'alerts' | 'plant' | 'overview' | 'energy';

/** Página-pai de cada view "de documento" — usado para destaque de nav e breadcrumb. */
const VIEW_PARENT: Partial<Record<FleetView, FleetView>> = {
    'report-detail': 'reports',
    'cost-detail': 'reports',
};

/** Nav única — teto de 5 itens (Fase 2.2), sem agrupamento por seção (não sobra conteúdo
 *  suficiente por grupo depois da fusão da Fase 2.1). Mesma lista serve desktop e mobile. */
const NAV_ITEMS: { id: FleetView; label: string; icon: string }[] = [
    { id: 'home', label: 'Início', icon: 'home' },
    { id: 'fleet', label: 'Frota', icon: 'layout-grid' },
    { id: 'maintenance', label: 'Manutenções', icon: 'calendar' },
    { id: 'reports', label: 'Relatórios', icon: 'file-text' },
    { id: 'compare', label: 'Comparar Máquinas', icon: 'git-compare-arrows' },
];

/** Altura fixa da topbar — usada pra encostar a sidebar embaixo dela, em vez de atrás.
 *  Corresponde a py-4 (32px) + input h-14 (56px) + borda (1px). */
const TOPBAR_HEIGHT_PX = 89;

const FLEET_TABS: { id: FleetTab; label: string }[] = [
    { id: 'listagem', label: 'Listagem' },
    { id: 'alertas', label: 'Alertas' },
    { id: 'planta', label: 'Planta D' },
];

const STATUS_FILTERS: FilterStatus[] = ['all', 'operational', 'warning', 'critical', 'maintenance'];

const LAYOUT_MODES: { id: FleetLayoutMode; label: string; icon: string }[] = [
    { id: 'grouped', label: 'Agrupado por linha', icon: 'layers' },
    { id: 'grid', label: 'Cards', icon: 'layout-grid' },
    { id: 'list', label: 'Lista', icon: 'list' },
];

const VIEW_TITLES: Record<FleetView, string> = {
    home: 'Início',
    fleet: 'Frota',
    maintenance: 'Manutenções',
    reports: 'Relatórios',
    'report-detail': 'Relatório',
    'cost-detail': 'Custo da Máquina',
    compare: 'Comparação de Máquinas',
};

const VIEW_SUBTITLES: Partial<Record<FleetView, string>> = {
    reports: 'Indicadores, processos em andamento, energia e relatórios individuais.',
    compare: 'Compare até 4 tornos lado a lado em métricas operacionais.',
};

@Component({
    selector: 'app-fleet-selector',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        Toolbar,
        ToolbarWidget,
        ToolbarWidgetGroup,
        Menu,
        MenuItem,
        MenuTrigger,
        MenuContent,
        Tabs,
        TabList,
        Tab,
        TabPanel,
        TabContent,
        FormsModule,
        UserSettingsModal,
        Icon,
        CommandSearch,
        FleetHomeView,
        FleetListingView,
        FleetAlertsView,
        FleetMaintenanceView,
        FleetPlantView,
        FleetEnergyView,
        FleetReportsView,
        FleetReportDetailView,
        FleetCostDetailView,
        FleetCompareView,
        FleetMachineDetailView,
        NotificationsBell,
        MaintenanceScheduler,
    ],
    templateUrl: './fleet-selector.html',
})
export class FleetSelector {
    readonly lathes = input.required<LatheData[]>();
    readonly userName = input<string>('Administrador');

    readonly select = output<LatheData>();
    readonly selectForMaintenance = output<LatheData>();
    readonly nav = input<FleetNav>(DEFAULT_FLEET_NAV);
    readonly navChange = output<FleetNav>();
    readonly logout = output<void>();
    /** Abre o painel global de Ajuda (renderizado em app.html, fora do escopo desta view). */
    readonly openHelp = output<void>();
    /** Listing page is owned by the route shell, preserving it across machine selection. */
    readonly page = input<number>(1);
    readonly pageChange = output<number>();

    /** Máquina selecionada (estado dono do app-root, sincronizado com a URL /maquina/:id) —
     *  quando presente, o conteúdo principal vira a subpágina de monitor da máquina. */
    readonly selectedLathe = input<LatheData | null>(null);
    readonly latheHistory = input<TelemetryHistory | undefined>(undefined);
    readonly tick = input<number>(0);
    readonly machineTab = input<string>('dashboard');
    readonly machineTabChange = output<string>();
    readonly deselect = output<void>();

    private settings = inject(SettingsService);
    private fleetService = inject(FleetService);
    protected readonly insights = createFleetInsights(this.lathes, this.tick, (id) => this.fleetService.historyFor(id));
    protected readonly listing = createFleetListingState(this.lathes, this.page, this.insights.urgentAlerts);

    /** Id (não o objeto) da máquina selecionada — o objeto `selectedLathe()` muda de referência
     *  a cada tick de telemetria (o array `fleet` é substituído), mas um `computed` só notifica
     *  os efeitos quando o VALOR de saída muda de fato, então isso não rerroda o efeito de
     *  scroll abaixo a cada tick. Ler `selectedLathe()?.id` direto no efeito não teria esse
     *  filtro — o efeito rerrodaria a cada tick e brigaria com o scroll manual do usuário. */
    private selectedLatheId = computed(() => this.selectedLathe()?.id ?? null);

    constructor() {
        // Toda navegação que troca de "página" dentro da Frota deve abrir no topo — sem isso a
        // posição de scroll da tela anterior vaza para o novo conteúdo.
        effect(() => {
            this.fleetView();
            this.fleetTab();
            this.reportsTab();
            this.machineTab();
            this.selectedLatheId();
            // O scroll real da página acontece no documento (html/body), não em #scrollRoot —
            // ver comentário na topbar fixa sobre esse mesmo detalhe.
            window.scrollTo({ top: 0 });
        });
    }

    protected fleetView = computed(() => this.nav().view);
    protected fleetTab = computed(() => this.nav().tab);
    protected fleetTabs = FLEET_TABS;
    protected statusFilters = STATUS_FILTERS;
    protected layoutModes = LAYOUT_MODES;
    protected reportsTab = computed(() => this.nav().reportsTab);
    protected isSettingsOpen = signal(false);
    /** Popover de perfil na topbar de Relatórios (Configurações/Sair) — substitui os ícones que
     *  saíram do rodapé da sidebar nesse layout. */
    private readonly profileTrigger = viewChild(MenuTrigger);
    protected readonly isProfileMenuOpen = computed(() => this.profileTrigger()?.expanded() ?? false);
    protected isSidebarCollapsed = signal(false);
    protected layoutMode = this.settings.fleetLayoutMode;

    protected selectedReportKey = computed(() => this.nav().reportKey);
    protected selectedCostMachineId = computed(() => this.nav().costMachineId);

    /** Topbar fixa (logo + busca central + notificações/perfil) — layout inspirado na
     *  Descomplica, agora padrão em todo o app (não mais exclusivo de Relatórios). */
    protected topbarHeightPx = TOPBAR_HEIGHT_PX;

    protected navItems = NAV_ITEMS;
    protected viewTitles = VIEW_TITLES;
    protected viewSubtitles = VIEW_SUBTITLES;
    protected STATUS_META = STATUS_META;
    protected statusOrder: LatheStatus[] = ['critical', 'warning', 'maintenance', 'operational'];

    private emitNav(patch: Partial<FleetNav>): void {
        this.navChange.emit({ ...this.nav(), ...patch });
    }

    protected showFleetTab(tab: string | undefined): void {
        if (!this.fleetTabs.some((item) => item.id === tab)) return;
        this.emitNav({ view: 'fleet', tab: tab as FleetTab });
    }

    protected onLayoutSelection(values: string[]): void {
        const mode = values[0];
        if (mode === 'grouped' || mode === 'grid' || mode === 'list') this.setLayoutMode(mode);
    }

    protected setLayoutMode(mode: FleetLayoutMode): void {
        this.settings.setFleetLayoutMode(mode);
    }

    protected onSearchChange(value: string): void {
        this.listing.search.set(value);
        this.pageChange.emit(1);
    }

    protected onFilterChange(value: FilterStatus): void {
        this.listing.filter.set(value);
        this.pageChange.emit(1);
    }

    protected onPageChange(page: number): void {
        this.pageChange.emit(page);
        // O scroll real da página acontece no documento (html/body), não em #scrollRoot — ver
        // comentário na topbar fixa sobre esse mesmo detalhe.
        window.scrollTo({ top: 0 });
    }

    protected clearListingFilters(): void {
        this.onSearchChange('');
        this.onFilterChange('all');
    }

    /** Roteador único de navegação interna — usado pela sidebar, atalhos, busca e "voltar".
     *  Alvos legados ("alerts"/"plant"/"energy"/"overview") são traduzidos para a view + aba
     *  correspondente da estrutura unificada da Fase 2.1, preservando os destinos que os
     *  sub-componentes (home, reports, busca interna) já emitem. */
    protected goTo(target: NavTarget): void {
        // A seleção antiga não pode continuar cobrindo a página escolhida no menu.
        if (this.selectedLathe()) this.deselect.emit();
        switch (target) {
            case 'alerts':
                this.emitNav({ view: 'fleet', tab: 'alertas' });
                break;
            case 'plant':
                this.emitNav({ view: 'fleet', tab: 'planta' });
                break;
            case 'overview':
                this.emitNav({ view: 'home' });
                break;
            case 'energy':
                this.emitNav({ view: 'reports', reportsTab: 'energia' });
                break;
            case 'fleet':
                this.emitNav({ view: 'fleet', tab: 'listagem' });
                break;
            case 'maintenance':
                this.emitNav({ view: 'maintenance' });
                break;
            case 'reports':
                this.emitNav({ view: 'reports', reportsTab: 'relatorios' });
                break;
            default:
                this.emitNav({ view: target });
        }
    }

    /** Item de nav que deve aparecer ativo — páginas de documento contam como parte de
     *  Relatórios (seu grupo pai) para fins de destaque visual. */
    protected activeNavId = computed<FleetView>(() => VIEW_PARENT[this.fleetView()] ?? this.fleetView());

    protected openReportDetail(key: ReportKey): void {
        if (this.selectedLathe()) this.deselect.emit();
        this.emitNav({ view: 'report-detail', reportKey: key });
    }

    protected openCostDetail(latheId: string): void {
        if (this.selectedLathe()) this.deselect.emit();
        this.emitNav({ view: 'cost-detail', costMachineId: latheId });
    }

    protected showReportsTab(tab: string | undefined): void {
        if (tab !== 'relatorios' && tab !== 'energia') return;
        this.emitNav({ view: 'reports', reportsTab: tab });
    }

    protected goToStatus(status: LatheStatus): void {
        this.listing.filter.set(status);
        this.pageChange.emit(1);
        this.emitNav({ view: 'fleet', tab: 'listagem' });
    }

    @HostListener('document:keydown.escape')
    protected onEscapeKey(): void {
        if (this.isSchedulerOpen() || this.isSettingsOpen() || this.isProfileMenuOpen()) return;
        if (this.selectedLathe()) this.deselect.emit();
    }

    protected selectedCostMachine = computed(() => this.lathes().find((l) => l.id === this.selectedCostMachineId()));
    protected selectedCostEstimate = computed(() =>
        this.insights.energyEstimate().perMachine.find((m) => m.id === this.selectedCostMachineId()),
    );

    /** Trata a seleção vinda da busca interna (app-command-search): página, ação ou torno. */
    protected onProfileAction(action: string): void {
        if (action === 'settings') this.isSettingsOpen.set(true);
        if (action === 'logout') this.logout.emit();
    }

    protected onCommandSelect(selection: CommandSearchSelection): void {
        if (selection.kind === 'page') {
            this.goTo(selection.target as NavTarget);
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
                this.listing.filter.set('critical');
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
            case 'open-help':
                this.openHelp.emit();
                break;
        }
    }

    protected toggleSector(sector: string): void {
        this.listing.toggleSector(sector);
    }
    protected toggleAllSectors(): void {
        this.listing.toggleAllSectors();
    }

    private readonly maintenance = createFleetMaintenanceState(this.selectedLathe);
    protected readonly isSchedulerOpen = signal(false);
    protected readonly latheMaintenance = this.maintenance.scheduled;
    protected readonly latheMaintenanceResolved = this.maintenance.resolved;
    protected readonly maintenanceHistoryForSelected = this.maintenance.history;

    protected onScheduleSubmit(data: MaintenanceData): void {
        this.maintenance.schedule(data);
    }

    protected updateMaintenanceStatus(id: string, status: 'completed' | 'cancelled'): void {
        this.maintenance.updateStatus(id, status);
    }
}
