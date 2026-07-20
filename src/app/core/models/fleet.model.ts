export interface SensorConfig {
    id: string;
    code: string;
    type: 'temperature' | 'vibration' | 'level' | 'position' | 'rpm' | 'pressure';
    name: string;
    unit: string;
    minValue?: number;
    maxValue?: number;
    location?: string;
}

export type LatheStatus = 'operational' | 'warning' | 'critical' | 'maintenance';

// MOCK: contrato provisório. O backend real envia dados para 1 máquina (sem `id`); este modelo
// simula 16 máquinas com `id` no frontend. Alinhar nomes de campo e origem do `id` com o backend.
export interface LatheData {
    id: string;
    name: string;
    model: string;
    /** Linha de produção (agrupamento no estilo ISA-95: planta > linha > máquina). */
    sector: string;
    status: LatheStatus;
    rpm: number;
    maxRpm: number;
    temperature: number;
    vibration: number;
    noise: number;
    efficiency: number;
    lastMaintenance: string;
    nextMaintenance: string;
    hoursWorked: number;
    currentProcess?: string;
    sensors?: SensorConfig[];
}

export interface AuthUser {
    name: string;
    role: string;
}

export type MaintenanceType = 'preventive' | 'predictive' | 'corrective';

export interface MaintenanceData {
    machineId: string;
    type: MaintenanceType;
    date: string; // ISO YYYY-MM-DD
    time: string;
    technician: string;
    notes: string;
}

export interface ScheduledMaintenance extends MaintenanceData {
    id: string;
    scheduledAt: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

export interface MaintenanceRecord {
    date: string; // DD/MM/YYYY
    type: 'Preventiva' | 'Preditiva' | 'Corretiva';
    tech: string;
    status: 'Concluída';
}

export interface TelemetryHistory {
    rpm: number[];
    temperature: number[];
    vibration: number[];
    efficiency: number[];
    noise: number[];
}
