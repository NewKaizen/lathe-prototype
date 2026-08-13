import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LatheStatus } from '../../../../core/models/fleet.model';
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
}
