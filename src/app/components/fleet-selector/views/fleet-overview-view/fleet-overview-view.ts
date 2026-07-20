import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LatheData, LatheStatus } from '../../../../core/models/fleet.model';
import { STATUS_META } from '../../../../core/lib/status';
import { Icon } from '../../../../shared/icon/icon';

export interface FleetOverviewSummary {
    avgEfficiency: number;
    avgTemp: number;
    totalHours: string;
    topPerformers: LatheData[];
}

const STATUS_ORDER: LatheStatus[] = ['critical', 'warning', 'maintenance', 'operational'];

@Component({
    selector: 'app-fleet-overview-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-overview-view.html',
})
export class FleetOverviewView {
    readonly overview = input.required<FleetOverviewSummary>();
    readonly counts = input.required<Record<LatheStatus, number>>();
    readonly totalCount = input.required<number>();

    readonly select = output<LatheData>();

    protected statusOrder = STATUS_ORDER;
    protected STATUS_META = STATUS_META;
}
