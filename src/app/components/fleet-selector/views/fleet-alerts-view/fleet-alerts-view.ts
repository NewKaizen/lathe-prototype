import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LatheData } from '../../../../core/models/fleet.model';
import { STATUS_META, efficiencyText } from '../../../../core/lib/status';
import { Icon } from '../../../../shared/icon/icon';

@Component({
    selector: 'app-fleet-alerts-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-alerts-view.html',
})
export class FleetAlertsView {
    readonly urgentAlerts = input.required<LatheData[]>();

    readonly select = output<LatheData>();

    protected STATUS_META = STATUS_META;
    protected efficiencyText = efficiencyText;
}
