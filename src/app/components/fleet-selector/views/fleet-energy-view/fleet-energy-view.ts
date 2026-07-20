import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LatheData } from '../../../../core/models/fleet.model';
import { FleetEnergyEstimate, ENERGY_ASSUMPTIONS } from '../../../../core/lib/energy';
import { Icon } from '../../../../shared/icon/icon';

@Component({
    selector: 'app-fleet-energy-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-energy-view.html',
})
export class FleetEnergyView {
    readonly energy = input.required<FleetEnergyEstimate>();
    readonly lathes = input.required<LatheData[]>();

    readonly openCost = output<string>();

    protected assumptions = ENERGY_ASSUMPTIONS;

    protected fmtKwh(n: number): string {
        return Math.round(n).toLocaleString('pt-BR');
    }

    protected fmtCost(n: number): string {
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    }

    protected fmtTariff(n: number): string {
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
    }
}
