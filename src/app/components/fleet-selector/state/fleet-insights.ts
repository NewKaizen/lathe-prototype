import { computed, Signal } from '@angular/core';
import { LatheData, TelemetryHistory } from '../../../core/models/fleet.model';
import { parseDMY } from '../../../core/lib/format';
import { estimateFleetEnergy } from '../../../core/lib/energy';

/** Shared report, energy, maintenance and comparison projections. No navigation or writes. */
export function createFleetInsights(
    lathes: Signal<LatheData[]>,
    tick: Signal<number>,
    historyFor: (id: string) => TelemetryHistory | undefined,
) {
    const counts = computed(() => {
        const l = lathes();
        return {
            operational: l.filter((x) => x.status === 'operational').length,
            warning: l.filter((x) => x.status === 'warning').length,
            critical: l.filter((x) => x.status === 'critical').length,
            maintenance: l.filter((x) => x.status === 'maintenance').length,
        };
    });
    const alertCount = computed(() => counts().warning + counts().critical);
    const urgentAlerts = computed(() =>
        lathes()
            .filter((l) => l.status === 'critical' || l.status === 'warning')
            .sort((a, b) => (a.status === 'critical' ? -1 : 1) - (b.status === 'critical' ? -1 : 1)),
    );
    const maintenanceSorted = computed(() =>
        [...lathes()].sort((a, b) => parseDMY(a.nextMaintenance).getTime() - parseDMY(b.nextMaintenance).getTime()),
    );
    const maintenanceDueSoon = computed(() => {
        const now = new Date();
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return lathes().filter((l) => {
            const due = parseDMY(l.nextMaintenance);
            return due.getTime() >= now.getTime() && due.getTime() <= in7Days.getTime();
        }).length;
    });
    const processesInProgress = computed(() => lathes().filter((l) => !!l.currentProcess));
    const energyEstimate = computed(() => estimateFleetEnergy(lathes()));
    const overview = computed(() => {
        const l = lathes();
        const avgEfficiency = Math.round(l.reduce((s, x) => s + x.efficiency, 0) / (l.length || 1));
        const avgTemp = Math.round(l.reduce((s, x) => s + x.temperature, 0) / (l.length || 1));
        const totalHours = l.reduce((s, x) => s + x.hoursWorked, 0);
        const topPerformers = [...l].sort((a, b) => b.efficiency - a.efficiency).slice(0, 3);
        return { avgEfficiency, avgTemp, totalHours: totalHours.toLocaleString('pt-BR'), topPerformers };
    });
    const fleetEfficiencyTrend = computed(() => {
        tick();
        const histories = lathes()
            .map((lathe) => historyFor(lathe.id)?.efficiency ?? [])
            .filter((series) => series.length > 0);
        if (!histories.length) return [];
        const length = Math.min(24, ...histories.map((series) => series.length));
        return Array.from({ length }, (_, index) =>
            Math.round(
                histories.reduce((sum, series) => sum + series[series.length - length + index], 0) / histories.length,
            ),
        );
    });
    const compareHistories = computed(() => {
        tick();
        return Object.fromEntries(lathes().map((lathe) => [lathe.id, historyFor(lathe.id)]));
    });
    return {
        counts,
        alertCount,
        urgentAlerts,
        maintenanceSorted,
        maintenanceDueSoon,
        processesInProgress,
        energyEstimate,
        overview,
        fleetEfficiencyTrend,
        compareHistories,
    };
}
