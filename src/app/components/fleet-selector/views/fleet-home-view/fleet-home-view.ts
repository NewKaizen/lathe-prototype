import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LatheStatus } from '../../../../core/models/fleet.model';
import { STATUS_META } from '../../../../core/lib/status';
import { FleetOverviewSummary, FleetOverviewView } from '../fleet-overview-view/fleet-overview-view';

@Component({
    selector: 'app-fleet-home-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FleetOverviewView],
    templateUrl: './fleet-home-view.html',
})
export class FleetHomeView {
    readonly overview = input.required<FleetOverviewSummary>();
    readonly counts = input.required<Record<LatheStatus, number>>();
    readonly totalCount = input.required<number>();
    readonly healthTrend = input<number[]>([]);

    readonly navigate = output<'reports' | 'fleet'>();
    readonly filterStatus = output<LatheStatus>();

    protected readonly statusOrder: LatheStatus[] = ['critical', 'warning', 'maintenance', 'operational'];
    protected readonly STATUS_META = STATUS_META;

    protected healthTrendPath = computed(() => {
        const values = this.healthTrend();
        if (values.length < 2) return 'M 0 30 L 100 30';
        const min = Math.min(...values) - 2;
        const range = Math.max(1, Math.max(...values) - min + 2);
        return values
            .map((value, index) => {
                const x = (index / (values.length - 1)) * 100;
                const y = 34 - ((value - min) / range) * 28;
                return `${index ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' ');
    });

    protected statusDonut = computed(() => {
        const total = this.totalCount();
        if (!total) return 'conic-gradient(var(--border) 0% 100%)';
        const counts = this.counts();
        const critical = (counts.critical / total) * 100;
        const warning = critical + (counts.warning / total) * 100;
        const maintenance = warning + (counts.maintenance / total) * 100;
        return `conic-gradient(var(--status-red) 0% ${critical}%, var(--status-yellow) ${critical}% ${warning}%, var(--status-purple) ${warning}% ${maintenance}%, var(--status-green) ${maintenance}% 100%)`;
    });
}
