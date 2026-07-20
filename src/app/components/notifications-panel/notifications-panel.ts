import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    HostListener,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { LatheData } from '../../core/models/fleet.model';
import { STATUS_META } from '../../core/lib/status';
import { daysUntilDMY } from '../../core/lib/format';
import { NotificationsStateService } from '../../core/services/notifications-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { Icon } from '../../shared/icon/icon';

type AlertKind = 'critical' | 'warning' | 'overdue' | 'upcoming';

interface DerivedAlert {
    id: string;
    kind: AlertKind;
    lathe: LatheData;
    title: string;
    detail: string;
    cssVar: string;
}

const KIND_ORDER: Record<AlertKind, number> = { critical: 0, overdue: 1, warning: 2, upcoming: 3 };

function deriveAlerts(lathes: LatheData[]): DerivedAlert[] {
    const alerts: DerivedAlert[] = [];
    for (const l of lathes) {
        if (l.status === 'critical') {
            alerts.push({
                id: `${l.id}-critical`,
                kind: 'critical',
                lathe: l,
                title: `${l.name} em estado crítico`,
                detail: `Vibração ${l.vibration.toFixed(1)} mm/s · ${l.temperature}°C`,
                cssVar: STATUS_META.critical.cssVar,
            });
        } else if (l.status === 'warning') {
            alerts.push({
                id: `${l.id}-warning`,
                kind: 'warning',
                lathe: l,
                title: `${l.name} requer atenção`,
                detail: `Eficiência ${l.efficiency}% · vibração ${l.vibration.toFixed(1)} mm/s`,
                cssVar: STATUS_META.warning.cssVar,
            });
        }
        if (l.nextMaintenance && l.nextMaintenance !== '—') {
            const diff = daysUntilDMY(l.nextMaintenance);
            if (diff < 0) {
                alerts.push({
                    id: `${l.id}-overdue`,
                    kind: 'overdue',
                    lathe: l,
                    title: `Manutenção de ${l.name} atrasada`,
                    detail: `Vencida há ${Math.abs(diff)} dia${Math.abs(diff) !== 1 ? 's' : ''} (${l.nextMaintenance})`,
                    cssVar: STATUS_META.critical.cssVar,
                });
            } else if (diff <= 7 && l.status !== 'maintenance') {
                alerts.push({
                    id: `${l.id}-upcoming`,
                    kind: 'upcoming',
                    lathe: l,
                    title: `Manutenção de ${l.name} em breve`,
                    detail:
                        diff === 0
                            ? 'Prevista para hoje'
                            : `Em ${diff} dia${diff !== 1 ? 's' : ''} (${l.nextMaintenance})`,
                    cssVar: STATUS_META.maintenance.cssVar,
                });
            }
        }
    }
    return alerts.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
}

@Component({
    selector: 'app-notifications-bell',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon, NgTemplateOutlet],
    templateUrl: './notifications-panel.html',
})
export class NotificationsBell {
    readonly lathes = input.required<LatheData[]>();
    readonly selectLathe = output<LatheData>();

    protected open = signal(false);
    private host = inject(ElementRef<HTMLElement>);
    protected notificationsState = inject(NotificationsStateService);
    private settings = inject(SettingsService);

    protected allAlerts = computed(() => deriveAlerts(this.lathes()));
    protected alerts = computed(() =>
        this.allAlerts()
            .filter((a) => !this.notificationsState.isDismissed(a.id))
            .filter((a) => this.settings.notificationFilter() === 'all' || a.kind === 'critical'),
    );
    protected urgentCount = computed(() => this.alerts().filter((a) => a.kind !== 'upcoming').length);

    /** Alertas de operação: telemetria/anomalia — natureza técnica e urgente. */
    protected operationAlerts = computed(() =>
        this.alerts().filter((a) => a.kind === 'critical' || a.kind === 'warning'),
    );
    /** Manutenções pendentes: agendamento administrativo — atrasado ou próximo. */
    protected maintenanceAlerts = computed(() =>
        this.alerts().filter((a) => a.kind === 'overdue' || a.kind === 'upcoming'),
    );

    protected iconOf(kind: AlertKind): string {
        return kind === 'upcoming' || kind === 'overdue' ? 'calendar' : 'alert-triangle';
    }

    protected toggle(): void {
        this.open.set(!this.open());
    }

    protected select(a: DerivedAlert): void {
        this.open.set(false);
        this.selectLathe.emit(a.lathe);
    }

    protected dismiss(a: DerivedAlert, event: MouseEvent): void {
        event.stopPropagation();
        this.notificationsState.dismiss(a.id);
    }

    protected dismissAll(): void {
        this.notificationsState.dismissAll(this.alerts().map((a) => a.id));
    }

    @HostListener('document:mousedown', ['$event'])
    onDocClick(e: MouseEvent): void {
        if (this.open() && !this.host.nativeElement.contains(e.target as Node)) this.open.set(false);
    }

    @HostListener('document:keydown.escape')
    onEsc(): void {
        this.open.set(false);
    }
}
