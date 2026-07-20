import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FleetService } from './fleet.service';

describe('FleetService', () => {
    let service: FleetService;

    beforeEach(() => {
        vi.useFakeTimers();
        TestBed.configureTestingModule({});
        service = TestBed.inject(FleetService);
    });

    afterEach(() => {
        service.stop();
        vi.useRealTimers();
    });

    it('seeds the fleet from mock data and starts with tick 0', () => {
        expect(service.fleet().length).toBe(16);
        expect(service.tick()).toBe(0);
    });

    it('has no telemetry history before the simulation starts', () => {
        expect(service.historyFor('TC-01')).toBeUndefined();
    });

    it('advances the tick counter and seeds history once started', () => {
        service.start();
        vi.advanceTimersByTime(1000);

        expect(service.tick()).toBe(1);
        expect(service.historyFor('TC-01')).toBeDefined();
    });

    it('stops advancing once stop() is called', () => {
        service.start();
        vi.advanceTimersByTime(1000);
        const tickAfterOneStep = service.tick();

        service.stop();
        vi.advanceTimersByTime(5000);

        expect(service.tick()).toBe(tickAfterOneStep);
    });

    it('does not restart an already-running interval (double start is a no-op)', () => {
        service.start();
        service.start();
        vi.advanceTimersByTime(1000);

        expect(service.tick()).toBe(1);
    });

    it('leaves machines under maintenance with unchanged values', () => {
        service.start();
        const before = service.fleet().find((l) => l.status === 'maintenance');
        expect(before).toBeDefined();

        vi.advanceTimersByTime(5000);

        const after = service.fleet().find((l) => l.id === before!.id);
        expect(after).toEqual(before);
    });

    it('keeps simulated values within sane bounds after many ticks', () => {
        service.start();
        vi.advanceTimersByTime(30_000);

        for (const l of service.fleet()) {
            expect(l.rpm).toBeGreaterThanOrEqual(0);
            expect(l.temperature).toBeGreaterThanOrEqual(0);
            expect(l.vibration).toBeGreaterThanOrEqual(0);
            expect(l.efficiency).toBeGreaterThanOrEqual(0);
            expect(l.efficiency).toBeLessThanOrEqual(100);
            expect(['operational', 'warning', 'critical', 'maintenance']).toContain(l.status);
            expect(Number.isNaN(l.rpm)).toBe(false);
        }
    });
});
