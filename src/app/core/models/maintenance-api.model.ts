import { MaintenanceData, MaintenanceType, ScheduledMaintenance } from './fleet.model';

/** Transport contracts shared with lathe-digital-twin MaintenanceService. */
export interface CreateMaintenanceRequest {
    machine_id: string;
    type: MaintenanceType;
    date: string;
    time: string;
    technician: string;
    notes?: string;
}

export interface MaintenanceResponse extends CreateMaintenanceRequest {
    id: string;
    scheduled_at: string;
    status: 'scheduled' | 'completed' | 'cancelled';
}

export function toMaintenanceRequest(data: MaintenanceData): CreateMaintenanceRequest {
    const { machineId, ...fields } = data;
    return { ...fields, machine_id: machineId };
}

export function toScheduledMaintenance(record: MaintenanceResponse): ScheduledMaintenance {
    const { machine_id, scheduled_at, ...fields } = record;
    return { ...fields, machineId: machine_id, scheduledAt: scheduled_at, notes: record.notes ?? '' };
}
