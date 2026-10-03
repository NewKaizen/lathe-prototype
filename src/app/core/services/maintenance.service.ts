import { Injectable, signal } from '@angular/core';
import { defer, of } from 'rxjs';
import { CreateMaintenanceRequest, MaintenanceResponse } from '../models/maintenance-api.model';

/** In-memory adapter. Replace method bodies with the definitive frontend's HTTP service. */
@Injectable({ providedIn: 'root' })
export class MaintenanceService {
    private readonly records = signal<MaintenanceResponse[]>([]);
    private readonly _revision = signal(0);
    readonly revision = this._revision.asReadonly();

    list(machineId: string) {
        return defer(() => of(this.records().filter((record) => record.machine_id === machineId)));
    }

    listAllMaintenance() {
        return defer(() => of([...this.records()]));
    }

    create(request: CreateMaintenanceRequest) {
        return defer(() => {
            const record: MaintenanceResponse = {
                ...request,
                id: `mnt-${crypto.randomUUID()}`,
                scheduled_at: new Date().toISOString(),
                status: 'scheduled',
            };
            this.records.update((records) => [...records, record]);
            this._revision.update((revision) => revision + 1);
            return of(record);
        });
    }

    updateStatus(id: string, status: 'completed' | 'cancelled') {
        return defer(() => {
            const previous = this.records().find((record) => record.id === id);
            if (!previous) throw new Error('Manutenção não encontrada');
            const updated = { ...previous, status };
            this.records.update((records) => records.map((record) => (record.id === id ? updated : record)));
            this._revision.update((revision) => revision + 1);
            return of(updated);
        });
    }
}
