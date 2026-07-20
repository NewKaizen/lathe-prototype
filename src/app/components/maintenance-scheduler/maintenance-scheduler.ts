import { ChangeDetectionStrategy, Component, HostListener, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/icon/icon';
import { MaintenanceData, MaintenanceType } from '../../core/models/fleet.model';
import { ToastService } from '../../core/services/toast.service';

export interface SchedulerMachine {
    id: string;
    name: string;
    type: string;
}

@Component({
    selector: 'app-maintenance-scheduler',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Icon],
    templateUrl: './maintenance-scheduler.html',
})
export class MaintenanceScheduler {
    readonly machine = input<SchedulerMachine | null>(null);
    readonly isOpen = input.required<boolean>();
    readonly close = output<void>();
    readonly schedule = output<MaintenanceData>();

    private toast = inject(ToastService);

    protected type = signal<MaintenanceType>('preventive');
    protected date = signal('');
    protected time = signal('');
    protected technician = signal('');
    protected notes = signal('');

    protected onSubmit(): void {
        const m = this.machine();
        if (!m || !this.date() || !this.time() || !this.technician()) {
            this.toast.error('Preencha os campos obrigatórios', 'Data, horário e técnico são necessários.');
            return;
        }

        this.schedule.emit({
            machineId: m.id,
            type: this.type(),
            date: this.date(),
            time: this.time(),
            technician: this.technician(),
            notes: this.notes(),
        });

        this.type.set('preventive');
        this.date.set('');
        this.time.set('');
        this.technician.set('');
        this.notes.set('');
        this.close.emit();
    }

    @HostListener('document:keydown.escape')
    onEsc(): void {
        if (this.isOpen()) this.close.emit();
    }
}
