import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LatheData, LatheStatus } from '../../../../core/models/fleet.model';
import { Icon } from '../../../../shared/icon/icon';
import { FleetOverviewSummary, FleetOverviewView } from '../fleet-overview-view/fleet-overview-view';

export type FleetQuickAccessTarget = 'fleet' | 'alerts' | 'maintenance';

@Component({
    selector: 'app-fleet-home-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon, FleetOverviewView],
    templateUrl: './fleet-home-view.html',
})
export class FleetHomeView {
    readonly overview = input.required<FleetOverviewSummary>();
    readonly counts = input.required<Record<LatheStatus, number>>();
    readonly totalCount = input.required<number>();
    readonly alertCount = input.required<number>();

    readonly select = output<LatheData>();
    readonly navigate = output<FleetQuickAccessTarget>();
}
