import { LatheData } from '../models/fleet.model';

// MOCK: estimativa baseada em potência/tarifa fixas. Substituir por leitura real de medidor de energia.
export const ENERGY_ASSUMPTIONS = {
    /** Potência média assumida por torno convencional em operação (kW). */
    avgPowerKw: 7.5,
    /** Tarifa industrial média assumida (R$/kWh). */
    tariffPerKwh: 0.75,
};

export interface MachineEnergyEstimate {
    id: string;
    name: string;
    model: string;
    sector: string;
    kwh: number;
    cost: number;
}

export interface FleetEnergyEstimate {
    perMachine: MachineEnergyEstimate[];
    totalKwh: number;
    totalCost: number;
}

/** Estimativa aproximada de consumo/custo de energia a partir de horas trabalhadas (MOCK). */
export function estimateFleetEnergy(lathes: LatheData[]): FleetEnergyEstimate {
    const perMachine = lathes
        .map((l) => {
            const kwh = l.hoursWorked * ENERGY_ASSUMPTIONS.avgPowerKw;
            return {
                id: l.id,
                name: l.name,
                model: l.model,
                sector: l.sector,
                kwh,
                cost: kwh * ENERGY_ASSUMPTIONS.tariffPerKwh,
            };
        })
        .sort((a, b) => b.cost - a.cost);

    const totalKwh = perMachine.reduce((sum, m) => sum + m.kwh, 0);
    const totalCost = perMachine.reduce((sum, m) => sum + m.cost, 0);

    return { perMachine, totalKwh, totalCost };
}
