import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LatheData } from '../../../../core/models/fleet.model';
import { STATUS_META } from '../../../../core/lib/status';
import { ENERGY_ASSUMPTIONS, FleetEnergyEstimate, MachineEnergyEstimate } from '../../../../core/lib/energy';
import { Icon } from '../../../../shared/icon/icon';

@Component({
    selector: 'app-fleet-cost-detail-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-cost-detail-view.html',
})
export class FleetCostDetailView {
    readonly lathe = input.required<LatheData>();
    readonly estimate = input.required<MachineEnergyEstimate>();
    readonly energy = input.required<FleetEnergyEstimate>();

    readonly back = output<void>();

    protected STATUS_META = STATUS_META;
    protected assumptions = ENERGY_ASSUMPTIONS;

    protected rank = computed(() => this.energy().perMachine.findIndex((m) => m.id === this.lathe().id) + 1);
    protected totalMachines = computed(() => this.energy().perMachine.length);

    protected fleetAvgCost = computed(() => this.energy().totalCost / (this.totalMachines() || 1));
    protected fleetAvgKwh = computed(() => this.energy().totalKwh / (this.totalMachines() || 1));

    protected costDiffPct = computed(() => {
        const avg = this.fleetAvgCost();
        if (avg <= 0) return 0;
        return Math.round(((this.estimate().cost - avg) / avg) * 100);
    });

    protected costPerHour = computed(() => {
        const hours = this.lathe().hoursWorked;
        return hours > 0 ? this.estimate().cost / hours : 0;
    });

    protected barPct = computed(() => {
        const max = Math.max(this.estimate().cost, this.fleetAvgCost()) || 1;
        return {
            machine: Math.round((this.estimate().cost / max) * 100),
            fleet: Math.round((this.fleetAvgCost() / max) * 100),
        };
    });

    protected fmtKwh(n: number): string {
        return Math.round(n).toLocaleString('pt-BR');
    }

    protected fmtCost(n: number): string {
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
    }

    protected fmtCostPrecise(n: number): string {
        return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });
    }
}
