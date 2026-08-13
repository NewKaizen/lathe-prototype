import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    LatheData,
    LatheStatus,
    MaintenanceData,
    ScheduledMaintenance,
    TelemetryHistory,
} from '../../core/models/fleet.model';
import { STATUS_META } from '../../core/lib/status';
import { parseDMY, formatISODate, parseISODateLocal, typeLabel } from '../../core/lib/format';
import { estimateFleetEnergy } from '../../core/lib/energy';
import { normalizeSearch } from '../../core/lib/text';
import { maintenanceHistoryFor } from '../../core/data/maintenance-data';
import { FleetLayoutMode, SettingsService } from '../../core/services/settings.service';
import { FleetService } from '../../core/services/fleet.service';
import { ToastService } from '../../core/services/toast.service';
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

/** Nav principal — máx. 5 itens (Fase 2.2). "Resumo" foi absorvido por "Início"
 *  (app-fleet-home-view já embute app-fleet-overview-view) e "Energia & Custos"
 *  virou uma aba dentro de "Relatórios". */
type FleetView = 'home' | 'fleet' | 'maintenance' | 'reports' | 'compare' | 'report-detail' | 'cost-detail';

/** Alvos de navegação "legados", ainda referenciados por sub-componentes e pela busca interna —
 *  goTo() os traduz para a view + aba correspondente da nova estrutura unificada (Fase 2.1). */
type NavTarget = FleetView | 'alerts' | 'plant' | 'overview' | 'energy';

type FleetTab = 'listagem' | 'alertas' | 'planta';
type ReportsTab = 'relatorios' | 'energia';

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

const STATUS_ORDER: Record<LatheStatus, number> = { critical: 0, warning: 1, maintenance: 2, operational: 3 };

/** Altura fixa da topbar — usada pra encostar a sidebar embaixo dela, em vez de atrás.
 *  Corresponde a py-4 (32px) + input h-14 (56px) + borda (1px). */
const TOPBAR_HEIGHT_PX = 89;

/** Fase 3.1: tamanho de página da listagem — só se aplica aos modos grade/lista
 *  (o modo agrupado por linha já segmenta naturalmente, sem paginar). */
const PAGE_SIZE = 12;

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

function sortLathes(lathes: LatheData[]): LatheData[] {
    return [...lathes].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.id.localeCompare(b.id));
}

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
    readonly logout = output<void>();
    /** Abre o painel global de Ajuda (renderizado em app.html, fora do escopo desta view). */
    readonly openHelp = output<void>();
    /** Fase 3.1: página da listagem sobe para o app-root, que sobrevive à seleção de uma
     *  máquina — FleetSelector é destruído nesse momento (@if em app.html), então o estado
     *  não pode viver só aqui se precisa ser preservado ao voltar. */
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
    private toast = inject(ToastService);
    private fleetService = inject(FleetService);

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

    protected fleetView = signal<FleetView>('home');
    protected fleetTab = signal<FleetTab>('listagem');
    protected fleetTabs = FLEET_TABS;
    protected statusFilters = STATUS_FILTERS;
    protected layoutModes = LAYOUT_MODES;
    protected reportsTab = signal<ReportsTab>('relatorios');
    protected search = signal('');
    protected filter = signal<FilterStatus>('all');
    protected isSettingsOpen = signal(false);
    /** Popover de perfil na topbar de Relatórios (Configurações/Sair) — substitui os ícones que
     *  saíram do rodapé da sidebar nesse layout. */
    protected isProfileMenuOpen = signal(false);
    protected isSidebarCollapsed = signal(false);
    protected collapsedSectors = signal<Set<string>>(new Set());
    protected layoutMode = this.settings.fleetLayoutMode;

    protected selectedReportKey = signal<ReportKey | null>(null);
    protected selectedCostMachineId = signal<string | null>(null);

    /** Topbar fixa (logo + busca central + notificações/perfil) — layout inspirado na
     *  Descomplica, agora padrão em todo o app (não mais exclusivo de Relatórios). */
    protected topbarHeightPx = TOPBAR_HEIGHT_PX;

    protected navItems = NAV_ITEMS;
    protected viewTitles = VIEW_TITLES;
    protected viewSubtitles = VIEW_SUBTITLES;
    protected STATUS_META = STATUS_META;
    protected statusOrder: LatheStatus[] = ['critical', 'warning', 'maintenance', 'operational'];

    protected filtered = computed(() => {
        const s = normalizeSearch(this.search());
        const f = this.filter();
        return this.lathes().filter((l) => {
            const matchSearch =
                normalizeSearch(l.name).includes(s) ||
                normalizeSearch(l.id).includes(s) ||
                normalizeSearch(l.model).includes(s) ||
                normalizeSearch(l.sector).includes(s);
            const matchFilter = f === 'all' || l.status === f;
            return matchSearch && matchFilter;
        });
    });

    protected grouped = computed(() => groupBySector(this.filtered()));
    protected flatSorted = computed(() => sortLathes(this.filtered()));
    protected isFiltering = computed(() => this.search().trim() !== '' || this.filter() !== 'all');
    protected isSearching = computed(() => this.search().trim() !== '');

    /** Fase 2.1 (redesenho): a busca compartilhada da Frota também filtra Alertas e Planta D —
     *  antes cada aba era um mini-app isolado sem contexto compartilhado com as outras. */
    protected urgentAlertsFiltered = computed(() => {
        const s = normalizeSearch(this.search());
        if (!s) return this.urgentAlerts();
        return this.urgentAlerts().filter(
            (l) =>
                normalizeSearch(l.name).includes(s) ||
                normalizeSearch(l.id).includes(s) ||
                normalizeSearch(l.model).includes(s) ||
                normalizeSearch(l.sector).includes(s),
        );
    });

    protected sectorCount = computed(() => new Set(this.lathes().map((l) => l.sector)).size);

    protected showFleetTab(tab: FleetTab): void {
        this.fleetTab.set(tab);
    }

    /** Fase 3.1: paginação (12/página) — só usada nos modos grade/lista de fleet-listing-view. */
    protected totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
    protected currentPage = computed(() => Math.min(Math.max(1, this.page()), this.totalPages()));
    protected paginatedFlatSorted = computed(() => {
        const all = this.flatSorted();
        const start = (this.currentPage() - 1) * PAGE_SIZE;
        return all.slice(start, start + PAGE_SIZE);
    });

    /** Planta D — mapa esquemático por setor. Fase 2.1 (redesenho): agora respeita a mesma busca
     *  compartilhada da Frota, em vez de ignorá-la como um mini-app isolado. */
    protected plantSectors = computed(() => groupBySector(this.filtered()));

    protected setLayoutMode(mode: FleetLayoutMode): void {
        this.settings.setFleetLayoutMode(mode);
    }

    protected onSearchChange(value: string): void {
        this.search.set(value);
        this.pageChange.emit(1);
    }

    protected onFilterChange(value: FilterStatus): void {
        this.filter.set(value);
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
        switch (target) {
            case 'alerts':
                this.fleetTab.set('alertas');
                this.fleetView.set('fleet');
                break;
            case 'plant':
                this.fleetTab.set('planta');
                this.fleetView.set('fleet');
                break;
            case 'overview':
                this.fleetView.set('home');
                break;
            case 'energy':
                this.reportsTab.set('energia');
                this.fleetView.set('reports');
                break;
            case 'fleet':
                this.fleetTab.set('listagem');
                this.fleetView.set('fleet');
                break;
            case 'reports':
                this.reportsTab.set('relatorios');
                this.fleetView.set('reports');
                break;
            default:
                this.fleetView.set(target);
        }
    }

    /** Item de nav que deve aparecer ativo — páginas de documento contam como parte de
     *  Relatórios (seu grupo pai) para fins de destaque visual. */
    protected activeNavId = computed<FleetView>(() => VIEW_PARENT[this.fleetView()] ?? this.fleetView());

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
            case 'open-help':
                this.openHelp.emit();
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

    // --- Subpágina de detalhe de máquina (Fase F) -------------------------------------------
    // Vive aqui, não no componente de detalhe: ele é recriado a cada seleção/deseleção, mas os
    // agendamentos de manutenção precisam sobreviver enquanto o usuário navega pela Frota.

    protected isSchedulerOpen = signal(false);
    protected scheduledMaintenances = signal<ScheduledMaintenance[]>([]);
    protected typeLabel = typeLabel;

    protected latheMaintenance = computed(() => {
        const id = this.selectedLathe()?.id;
        return this.scheduledMaintenances().filter((m) => m.machineId === id && m.status === 'scheduled');
    });

    protected latheMaintenanceResolved = computed(() => {
        const id = this.selectedLathe()?.id;
        return this.scheduledMaintenances().filter((m) => m.machineId === id && m.status !== 'scheduled');
    });

    protected maintenanceHistoryForSelected = computed(() =>
        this.selectedLathe() ? maintenanceHistoryFor(this.selectedLathe()!) : [],
    );

    protected onScheduleSubmit(data: MaintenanceData): void {
        const entry: ScheduledMaintenance = {
            ...data,
            id: `mnt-${Date.now()}`,
            scheduledAt: new Date().toISOString(),
            status: 'scheduled',
        };
        const updated = [...this.scheduledMaintenances(), entry];
        this.scheduledMaintenances.set(updated);

        const latheDates = updated.filter((m) => m.machineId === data.machineId).map((m) => m.date);
        const nearest = this.nearestUpcomingDate(latheDates);
        if (nearest) {
            this.fleetService.fleet.update((f) =>
                f.map((l) => (l.id === data.machineId ? { ...l, nextMaintenance: nearest } : l)),
            );
        }

        const lathe = this.selectedLathe();
        this.toast.success(
            'Manutenção agendada!',
            `${lathe?.name} · ${formatISODate(data.date)} às ${data.time} · ${typeLabel[data.type] ?? data.type}`,
        );
    }

    protected updateMaintenanceStatus(id: string, status: 'completed' | 'cancelled'): void {
        this.scheduledMaintenances.update((list) => list.map((m) => (m.id === id ? { ...m, status } : m)));
        this.toast.info(status === 'completed' ? 'Manutenção concluída' : 'Manutenção cancelada');
    }

    private nearestUpcomingDate(dates: string[]): string | null {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const future = dates
            .map((d) => ({ raw: d, parsed: parseISODateLocal(d) }))
            .filter((x) => x.parsed && x.parsed >= today)
            .sort((a, b) => a.parsed!.getTime() - b.parsed!.getTime());
        return future.length > 0 ? formatISODate(future[0].raw) : null;
    }
}
