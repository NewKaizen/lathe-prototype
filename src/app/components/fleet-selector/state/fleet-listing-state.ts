import { computed, signal, Signal } from '@angular/core';
import { LatheData, LatheStatus } from '../../../core/models/fleet.model';
import { normalizeSearch } from '../../../core/lib/text';
import { FilterStatus } from '../views/fleet-listing-view/fleet-listing-view';
const STATUS_ORDER: Record<LatheStatus, number> = { critical: 0, warning: 1, maintenance: 2, operational: 3 };
const PAGE_SIZE = 12;
function sortLathes(lathes: LatheData[]): LatheData[] {
    return [...lathes].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.id.localeCompare(b.id));
}

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

/** Filtering, grouping and pagination belong to the fleet listing domain. */
export function createFleetListingState(
    lathes: Signal<LatheData[]>,
    page: Signal<number>,
    urgentAlerts: Signal<LatheData[]>,
) {
    const search = signal('');
    const filter = signal<FilterStatus>('all');
    const collapsedSectors = signal<Set<string>>(new Set());
    const filtered = computed(() => {
        const s = normalizeSearch(search());
        const f = filter();
        return lathes().filter((l) => {
            const matchSearch =
                normalizeSearch(l.name).includes(s) ||
                normalizeSearch(l.id).includes(s) ||
                normalizeSearch(l.model).includes(s) ||
                normalizeSearch(l.sector).includes(s);
            const matchFilter = f === 'all' || l.status === f;
            return matchSearch && matchFilter;
        });
    });
    const grouped = computed(() => groupBySector(filtered()));
    const flatSorted = computed(() => sortLathes(filtered()));
    const isFiltering = computed(() => search().trim() !== '' || filter() !== 'all');
    const isSearching = computed(() => search().trim() !== '');
    const urgentAlertsFiltered = computed(() => {
        const s = normalizeSearch(search());
        if (!s) return urgentAlerts();
        return urgentAlerts().filter(
            (l) =>
                normalizeSearch(l.name).includes(s) ||
                normalizeSearch(l.id).includes(s) ||
                normalizeSearch(l.model).includes(s) ||
                normalizeSearch(l.sector).includes(s),
        );
    });
    const sectorCount = computed(() => new Set(lathes().map((l) => l.sector)).size);
    const totalPages = computed(() => Math.max(1, Math.ceil(filtered().length / PAGE_SIZE)));
    const currentPage = computed(() => Math.min(Math.max(1, page()), totalPages()));
    const paginatedFlatSorted = computed(() => {
        const all = flatSorted();
        const start = (currentPage() - 1) * PAGE_SIZE;
        return all.slice(start, start + PAGE_SIZE);
    });
    const plantSectors = computed(() => groupBySector(filtered()));
    const allCollapsed = computed(() => {
        const g = grouped();
        return g.length > 0 && g.every(([s]) => collapsedSectors().has(s));
    });
    function toggleSector(sector: string): void {
        const next = new Set(collapsedSectors());
        next.has(sector) ? next.delete(sector) : next.add(sector);
        collapsedSectors.set(next);
    }
    function toggleAllSectors(): void {
        collapsedSectors.set(allCollapsed() ? new Set() : new Set(grouped().map(([s]) => s)));
    }
    return {
        search,
        filter,
        collapsedSectors,
        filtered,
        grouped,
        flatSorted,
        isFiltering,
        isSearching,
        urgentAlertsFiltered,
        sectorCount,
        totalPages,
        currentPage,
        paginatedFlatSorted,
        plantSectors,
        allCollapsed,
        toggleSector,
        toggleAllSectors,
    };
}
