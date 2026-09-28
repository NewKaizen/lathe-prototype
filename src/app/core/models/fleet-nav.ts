export type FleetView = 'home' | 'fleet' | 'maintenance' | 'reports' | 'compare' | 'report-detail' | 'cost-detail';
export type FleetTab = 'listagem' | 'alertas' | 'planta';
export type ReportsTab = 'relatorios' | 'energia';
export type ReportKey = 'efficiency' | 'maintenance' | 'alerts';

export interface FleetNav {
    view: FleetView;
    tab: FleetTab;
    reportsTab: ReportsTab;
    reportKey: ReportKey | null;
    costMachineId: string | null;
}

export const DEFAULT_FLEET_NAV: FleetNav = {
    view: 'home',
    tab: 'listagem',
    reportsTab: 'relatorios',
    reportKey: null,
    costMachineId: null,
};

const VIEWS: FleetView[] = ['home', 'fleet', 'maintenance', 'reports', 'compare', 'report-detail', 'cost-detail'];
const TABS: FleetTab[] = ['listagem', 'alertas', 'planta'];
const REPORTS_TABS: ReportsTab[] = ['relatorios', 'energia'];
const REPORT_KEYS: ReportKey[] = ['efficiency', 'maintenance', 'alerts'];

function pick<T extends string>(raw: string | null, allowed: T[], fallback: T): T {
    return raw && (allowed as string[]).includes(raw) ? (raw as T) : fallback;
}

export function fleetNavToQuery(nav: FleetNav): string {
    const params = new URLSearchParams();
    params.set('v', nav.view);
    if (nav.view === 'fleet') params.set('t', nav.tab);
    if (nav.view === 'reports') params.set('t', nav.reportsTab);
    if (nav.view === 'report-detail' && nav.reportKey) params.set('r', nav.reportKey);
    if (nav.view === 'cost-detail' && nav.costMachineId) params.set('m', nav.costMachineId);
    return params.toString();
}

export function fleetNavFromQuery(query: string, current: FleetNav = DEFAULT_FLEET_NAV): FleetNav {
    const params = new URLSearchParams(query);
    const view = pick(params.get('v'), VIEWS, DEFAULT_FLEET_NAV.view);
    const next: FleetNav = {
        view,
        tab: view === 'fleet' ? pick(params.get('t'), TABS, current.tab) : current.tab,
        reportsTab: view === 'reports' ? pick(params.get('t'), REPORTS_TABS, current.reportsTab) : current.reportsTab,
        reportKey: view === 'report-detail' ? pick(params.get('r'), REPORT_KEYS, 'efficiency') : current.reportKey,
        costMachineId: view === 'cost-detail' ? params.get('m') : current.costMachineId,
    };
    if (next.view === 'cost-detail' && !next.costMachineId) next.view = 'reports';
    return next;
}
