import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { LATHES_FLEET } from '../../../core/data/fleet-data';
import { LatheData } from '../../../core/models/fleet.model';
import {
    MaintenanceResponse,
    toMaintenanceRequest,
    toScheduledMaintenance,
} from '../../../core/models/maintenance-api.model';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { createFleetInsights } from './fleet-insights';
import { createFleetListingState } from './fleet-listing-state';
import { createFleetMaintenanceState } from './fleet-maintenance-state';

describe('Fleet feature read models', () => {
    it('filters, orders and clamps pages without changing the source fleet', () => {
        const source = signal([...LATHES_FLEET]);
        const page = signal(99);
        const insights = createFleetInsights(source, signal(0), () => undefined);
        const listing = createFleetListingState(source, page, insights.urgentAlerts);
        expect(listing.currentPage()).toBe(2);
        expect(listing.paginatedFlatSorted()).toHaveLength(4);
        listing.filter.set('critical');
        expect(listing.currentPage()).toBe(1);
        expect(listing.filtered().every((lathe) => lathe.status === 'critical')).toBe(true);
        listing.search.set('não existe');
        expect(listing.totalPages()).toBe(1);
        expect(listing.paginatedFlatSorted()).toEqual([]);
        expect(source()).toEqual(LATHES_FLEET);
    });

    it('shares search across alerts and plant, and updates projections with live data', () => {
        const source = signal([...LATHES_FLEET]);
        const insights = createFleetInsights(source, signal(0), () => undefined);
        const listing = createFleetListingState(source, signal(1), insights.urgentAlerts);
        listing.search.set('linha 1');
        expect(listing.plantSectors().map(([sector]) => sector)).toEqual(['Linha 1']);
        expect(listing.urgentAlertsFiltered().every((lathe) => lathe.sector === 'Linha 1')).toBe(true);
        source.set([]);
        expect(insights.overview().avgEfficiency).toBe(0);
        expect(insights.alertCount()).toBe(0);
        expect(listing.plantSectors()).toEqual([]);
    });

    it('toggles sectors immutably and refreshes history on the telemetry tick', () => {
        const source = signal([...LATHES_FLEET]);
        const tick = signal(0);
        let efficiency = [20];
        const insights = createFleetInsights(source, tick, () => ({
            rpm: [],
            temperature: [],
            vibration: [],
            noise: [],
            efficiency,
        }));
        const listing = createFleetListingState(source, signal(1), insights.urgentAlerts);
        const before = listing.collapsedSectors();
        listing.toggleAllSectors();
        expect(listing.allCollapsed()).toBe(true);
        expect(before.size).toBe(0);
        listing.toggleSector('Linha 1');
        expect(listing.allCollapsed()).toBe(false);
        expect(insights.fleetEfficiencyTrend()).toEqual([20]);
        efficiency = [30];
        tick.update((value) => value + 1);
        expect(insights.fleetEfficiencyTrend()).toEqual([30]);
    });
});

describe('Maintenance read resource and explicit commands', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('uses the frontend transport names with lossless presentation adapters', () => {
        const data = {
            machineId: 'TC-01',
            type: 'preventive' as const,
            date: '2026-12-01',
            time: '10:00',
            technician: 'Demo',
            notes: '',
        };
        const payload = toMaintenanceRequest(data);
        expect(payload.machine_id).toBe('TC-01');
        expect(payload).not.toHaveProperty('machineId');
        const record = { ...payload, id: 'm1', scheduled_at: '2026-10-03T12:00:00Z', status: 'scheduled' as const };
        expect(toScheduledMaintenance(record)).toEqual({
            ...data,
            id: 'm1',
            scheduledAt: record.scheduled_at,
            status: 'scheduled',
        });
    });

    it('persists schedules through machine changes and reloads after explicit status updates', () => {
        const selected = signal<LatheData | null>(LATHES_FLEET[0]);
        const state = TestBed.runInInjectionContext(() => createFleetMaintenanceState(selected));
        TestBed.tick();
        state.schedule({
            machineId: selected()!.id,
            type: 'preventive',
            date: '2099-12-01',
            time: '10:00',
            technician: 'Demo',
            notes: '',
        });
        TestBed.tick();
        expect(state.scheduled()).toHaveLength(1);
        const id = state.scheduled()[0].id;
        selected.set(LATHES_FLEET[1]);
        TestBed.tick();
        expect(state.scheduled()).toEqual([]);
        selected.set(LATHES_FLEET[0]);
        TestBed.tick();
        expect(state.scheduled()[0].id).toBe(id);
        state.updateStatus(id, 'completed');
        TestBed.tick();
        expect(state.scheduled()).toEqual([]);
        expect(state.resolved()[0].status).toBe('completed');
    });

    it('does not reload maintenance for every telemetry object update', () => {
        const repository = TestBed.inject(MaintenanceService);
        const list = vi.spyOn(repository, 'list');
        const selected = signal<LatheData | null>(LATHES_FLEET[0]);
        TestBed.runInInjectionContext(() => createFleetMaintenanceState(selected));
        TestBed.tick();
        selected.set({ ...selected()!, rpm: 1234 });
        TestBed.tick();
        expect(list).toHaveBeenCalledTimes(1);
    });

    it('cancels stale reads when the selected machine changes', async () => {
        const first = new Subject<MaintenanceResponse[]>();
        const second = new Subject<MaintenanceResponse[]>();
        const repository = TestBed.inject(MaintenanceService);
        vi.spyOn(repository, 'list').mockImplementation((id) => (id === LATHES_FLEET[0].id ? first : second));
        const selected = signal<LatheData | null>(LATHES_FLEET[0]);
        const state = TestBed.runInInjectionContext(() => createFleetMaintenanceState(selected));
        TestBed.tick();
        expect(first.observed).toBe(true);
        selected.set(LATHES_FLEET[1]);
        TestBed.tick();
        expect(first.observed).toBe(false);
        second.next([]);
        await TestBed.inject(ApplicationRef).whenStable();
        TestBed.tick();
        expect(state.isLoading()).toBe(false);
        expect(state.scheduled()).toEqual([]);
    });
});
