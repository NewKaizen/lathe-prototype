import { DEFAULT_FLEET_NAV, fleetNavFromQuery, fleetNavToQuery } from './fleet-nav';

describe('fleet navigation URL state', () => {
    it('round-trips an internal fleet tab', () => {
        const nav = { ...DEFAULT_FLEET_NAV, view: 'fleet' as const, tab: 'alertas' as const };
        expect(fleetNavToQuery(nav)).toBe('v=fleet&t=alertas');
        expect(fleetNavFromQuery('?v=fleet&t=alertas')).toEqual(nav);
    });

    it('keeps the selected reports subtab in a shareable URL', () => {
        const nav = { ...DEFAULT_FLEET_NAV, view: 'reports' as const, reportsTab: 'energia' as const };
        expect(fleetNavFromQuery(fleetNavToQuery(nav))).toEqual(nav);
    });

    it('falls back safely from unknown pages and tabs', () => {
        expect(fleetNavFromQuery('?v=unknown&t=unknown')).toEqual(DEFAULT_FLEET_NAV);
        expect(fleetNavFromQuery('?v=cost-detail')).toEqual({ ...DEFAULT_FLEET_NAV, view: 'reports' });
    });
});
