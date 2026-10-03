import { computed, DestroyRef, effect, inject, Signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { maintenanceHistoryFor } from '../../../core/data/maintenance-data';
import { formatISODate, parseISODateLocal, typeLabel } from '../../../core/lib/format';
import { LatheData, MaintenanceData } from '../../../core/models/fleet.model';
import { toMaintenanceRequest, toScheduledMaintenance } from '../../../core/models/maintenance-api.model';
import { FleetService } from '../../../core/services/fleet.service';
import { MaintenanceService } from '../../../core/services/maintenance.service';
import { ToastService } from '../../../core/services/toast.service';

/** Call in an injection context. Reads use rxResource; commands remain explicit subscriptions. */
export function createFleetMaintenanceState(selectedLathe: Signal<LatheData | null>) {
    const repository = inject(MaintenanceService);
    const fleet = inject(FleetService);
    const toast = inject(ToastService);
    // Capture lifecycle at construction, not from an event handler's injection context.
    const destroyRef = inject(DestroyRef);
    const selectedMachineId = computed(() => selectedLathe()?.id);
    const records = rxResource({
        params: () => {
            const machineId = selectedMachineId();
            return machineId ? { machineId, revision: repository.revision() } : undefined;
        },
        stream: ({ params }) => repository.list(params.machineId),
        defaultValue: [],
    });
    effect(() => {
        if (records.error()) toast.error('Não foi possível carregar as manutenções', 'Tente novamente mais tarde.');
    });
    const maintenance = computed(() => (records.hasValue() ? records.value() : []).map(toScheduledMaintenance));
    const scheduled = computed(() => maintenance().filter((record) => record.status === 'scheduled'));
    const resolved = computed(() => maintenance().filter((record) => record.status !== 'scheduled'));
    const history = computed(() => (selectedLathe() ? maintenanceHistoryFor(selectedLathe()!) : []));

    function schedule(data: MaintenanceData): void {
        const name = selectedLathe()?.name ?? data.machineId;
        repository
            .create(toMaintenanceRequest(data))
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe({
                next: () => {
                    repository
                        .list(data.machineId)
                        .pipe(takeUntilDestroyed(destroyRef))
                        .subscribe((records) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const future = records
                                .filter((record) => record.status === 'scheduled')
                                .map((record) => ({ raw: record.date, parsed: parseISODateLocal(record.date) }))
                                .filter((entry) => entry.parsed && entry.parsed >= today)
                                .sort((a, b) => a.parsed!.getTime() - b.parsed!.getTime());
                            if (future.length)
                                fleet.updateNextMaintenance(data.machineId, formatISODate(future[0].raw));
                        });
                    toast.success(
                        'Manutenção agendada!',
                        `${name} · ${formatISODate(data.date)} às ${data.time} · ${typeLabel[data.type]}`,
                    );
                },
                error: () => toast.error('Não foi possível agendar a manutenção', 'Tente novamente mais tarde.'),
            });
    }

    function updateStatus(id: string, status: 'completed' | 'cancelled'): void {
        repository
            .updateStatus(id, status)
            .pipe(takeUntilDestroyed(destroyRef))
            .subscribe({
                next: () => toast.info(status === 'completed' ? 'Manutenção concluída' : 'Manutenção cancelada'),
                error: () => toast.error('Não foi possível atualizar a manutenção', 'Tente novamente mais tarde.'),
            });
    }

    return {
        scheduled,
        resolved,
        history,
        isLoading: records.isLoading,
        error: records.error,
        reload: () => records.reload(),
        schedule,
        updateStatus,
    };
}
