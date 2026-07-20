import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LatheData } from '../../../../core/models/fleet.model';
import { STATUS_META } from '../../../../core/lib/status';
import { daysUntilDMY } from '../../../../core/lib/format';
import { Icon } from '../../../../shared/icon/icon';

@Component({
    selector: 'app-fleet-maintenance-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-maintenance-view.html',
})
export class FleetMaintenanceView {
    readonly maintenanceSorted = input.required<LatheData[]>();

    readonly select = output<LatheData>();

    protected STATUS_META = STATUS_META;

    protected diffFor(nextMaintenance: string): number {
        return daysUntilDMY(nextMaintenance);
    }

    protected maintenanceColor(nextMaintenance: string): string {
        const diff = this.diffFor(nextMaintenance);
        if (diff < 0) return 'var(--status-red)';
        if (diff <= 7) return 'var(--status-yellow)';
        return 'var(--foreground)';
    }
}
