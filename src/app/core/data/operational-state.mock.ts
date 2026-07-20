import { LatheData, LatheStatus } from '../models/fleet.model';

/** Estado operacional derivado do status da máquina. Substituir quando o backend implementar o contrato real. */
export type MockOperationalMode = 'producao' | 'manutencao' | 'alarme';
export type MockOperationalHealth = 'normal' | 'atencao' | 'critico';

export interface MockOperationalState {
    modoOperacao: MockOperationalMode;
    estadoSaude: MockOperationalHealth;
    flagsAtivas: string[];
}

const MODE_BY_STATUS: Record<LatheStatus, MockOperationalMode> = {
    operational: 'producao',
    warning: 'producao',
    critical: 'alarme',
    maintenance: 'manutencao',
};

const HEALTH_BY_STATUS: Record<LatheStatus, MockOperationalHealth> = {
    operational: 'normal',
    warning: 'atencao',
    critical: 'critico',
    maintenance: 'atencao',
};

export const OPERATIONAL_MODE_LABEL: Record<MockOperationalMode, string> = {
    producao: 'Produção',
    manutencao: 'Manutenção',
    alarme: 'Alarme',
};

export const OPERATIONAL_HEALTH_LABEL: Record<MockOperationalHealth, string> = {
    normal: 'Normal',
    atencao: 'Atenção',
    critico: 'Crítico',
};

export function mockOperationalState(lathe: LatheData): MockOperationalState {
    const flagsAtivas: string[] = [];
    if (lathe.vibration > 4) flagsAtivas.push('Vibração alta');
    if (lathe.temperature > 70) flagsAtivas.push('Temperatura alta');
    if (lathe.efficiency < 55) flagsAtivas.push('Eficiência baixa');

    return {
        modoOperacao: MODE_BY_STATUS[lathe.status],
        estadoSaude: HEALTH_BY_STATUS[lathe.status],
        flagsAtivas,
    };
}
