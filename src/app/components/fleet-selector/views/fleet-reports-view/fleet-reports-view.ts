import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LatheData, LatheStatus } from '../../../../core/models/fleet.model';
import { Icon } from '../../../../shared/icon/icon';
import { FleetOverviewSummary } from '../fleet-overview-view/fleet-overview-view';
import { ReportKey } from '../fleet-report-detail-view/fleet-report-detail-view';

export type FleetReportsNavTarget = 'alerts' | 'maintenance' | 'overview';

@Component({
    selector: 'app-fleet-reports-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-reports-view.html',
})
export class FleetReportsView {
    readonly overview = input.required<FleetOverviewSummary>();
    readonly counts = input.required<Record<LatheStatus, number>>();
    readonly totalCount = input.required<number>();
    readonly alertCount = input.required<number>();
    readonly maintenanceDueSoon = input.required<number>();
    readonly processesInProgress = input.required<LatheData[]>();

    readonly select = output<LatheData>();
    readonly navigate = output<FleetReportsNavTarget>();
    readonly openReport = output<ReportKey>();
}
