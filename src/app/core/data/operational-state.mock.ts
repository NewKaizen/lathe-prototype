import { LatheData, LatheStatus } from '../models/fleet.model';

/** Estado operacional derivado do status da máquina. Substituir quando o backend implementar o contrato real. */
export type MockOperationalMode = 'producao' | 'manutencao' | 'alarme';
export type MockOperationalHealth = 'normal' | 'atencao' | 'critico';
export type MockOperationalSeverity = 'baixa' | 'media' | 'alta' | 'critica';

export interface MockOperationalState {
    modoOperacao: MockOperationalMode;
    estadoSaude: MockOperationalHealth;
    gravidade: MockOperationalSeverity;
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

const SEVERITY_BY_STATUS: Record<LatheStatus, MockOperationalSeverity> = {
    operational: 'baixa',
    warning: 'media',
    critical: 'critica',
    maintenance: 'baixa',
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

export const OPERATIONAL_SEVERITY_LABEL: Record<MockOperationalSeverity, string> = {
    baixa: 'Baixa',
    media: 'Média',
    alta: 'Alta',
    critica: 'Crítica',
};

export const OPERATIONAL_SEVERITY_TAG: Record<MockOperationalSeverity, string> = {
    baixa: 'tag tag-green',
    media: 'tag tag-yellow',
    alta: 'tag tag-yellow',
    critica: 'tag tag-red',
};

export function mockOperationalState(lathe: LatheData): MockOperationalState {
    const flagsAtivas: string[] = [];
    if (lathe.vibration > 4) flagsAtivas.push('Vibração alta');
    if (lathe.temperature > 70) flagsAtivas.push('Temperatura alta');
    if (lathe.efficiency < 55) flagsAtivas.push('Eficiência baixa');

    // Garante ao menos uma flag visível sempre que o status já sinaliza atenção/crítico,
    // mesmo quando nenhum limiar individual foi ultrapassado.
    if (flagsAtivas.length === 0 && lathe.status === 'warning') {
        flagsAtivas.push('Parâmetros fora do padrão');
    }
    if (flagsAtivas.length === 0 && lathe.status === 'critical') {
        flagsAtivas.push('Inspeção imediata recomendada');
    }

    return {
        modoOperacao: MODE_BY_STATUS[lathe.status],
        estadoSaude: HEALTH_BY_STATUS[lathe.status],
        gravidade: SEVERITY_BY_STATUS[lathe.status],
        flagsAtivas,
    };
}
