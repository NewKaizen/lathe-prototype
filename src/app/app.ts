import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { FleetService } from './core/services/fleet.service';
import { ToastService } from './core/services/toast.service';
import { AuthUser, LatheData, MaintenanceData, ScheduledMaintenance } from './core/models/fleet.model';
import { maintenanceHistoryFor } from './core/data/maintenance-data';
import { formatISODate, parseISODateLocal, typeLabel } from './core/lib/format';
import { anomalyScore, scoreHeadline } from './core/lib/status';

import { LoginScreen } from './components/login-screen/login-screen';
import { FleetSelector } from './components/fleet-selector/fleet-selector';
import { MachineSidebar, MachineView } from './components/machine-sidebar/machine-sidebar';
import { LatheDashboard } from './components/lathe-dashboard/lathe-dashboard';
import { LatheCharts } from './components/lathe-charts/lathe-charts';
import { DigitalTwin } from './components/digital-twin/digital-twin';
import { MaintenanceScheduler } from './components/maintenance-scheduler/maintenance-scheduler';
import { UserSettingsModal } from './components/user-settings-modal/user-settings-modal';
import { NotificationsBell } from './components/notifications-panel/notifications-panel';
import { ToastContainer } from './shared/toast/toast-container';
import { ConfirmButton } from './shared/confirm-button/confirm-button';
import { Icon } from './shared/icon/icon';

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        LoginScreen,
        FleetSelector,
        MachineSidebar,
        LatheDashboard,
        LatheCharts,
        DigitalTwin,
        MaintenanceScheduler,
        UserSettingsModal,
        NotificationsBell,
        ToastContainer,
        Icon,
        ConfirmButton,
    ],
    templateUrl: './app.html',
})
export class App {
    protected auth = inject(AuthService);
    protected fleetService = inject(FleetService);
    private toast = inject(ToastService);
    private router = inject(Router);
    private previousLatheId: string | null = null;

    protected view = signal<MachineView | string>('dashboard');
    protected sidebarCollapsed = signal(false);
    protected twinMode = signal<'3d' | 'camera'>('3d');
    protected isSchedulerOpen = signal(false);
    protected isSettingsOpen = signal(false);
    protected scheduledMaintenances = signal<ScheduledMaintenance[]>([]);

    protected fleet = this.fleetService.fleet;
    protected tick = this.fleetService.tick;

    protected selectedLathe = computed<LatheData | null>(() => {
        const id = this.fleetService.selectedLatheId();
        return this.fleet().find((l) => l.id === id) ?? null;
    });

    protected latheMaintenance = computed(() => {
        const id = this.selectedLathe()?.id;
        return this.scheduledMaintenances().filter((m) => m.machineId === id && m.status === 'scheduled');
    });

    protected latheMaintenanceResolved = computed(() => {
        const id = this.selectedLathe()?.id;
        return this.scheduledMaintenances().filter((m) => m.machineId === id && m.status !== 'scheduled');
    });

    protected latheHistory = computed(() => {
        const id = this.selectedLathe()?.id;
        return id ? this.fleetService.historyFor(id) : undefined;
    });

    protected isTwin = computed(() => this.view() === 'digital-twin');
    protected anomaly = computed(() => {
        const l = this.selectedLathe();
        return l ? anomalyScore(l.status, l.vibration) : 0;
    });
    protected headline = computed(() => scoreHeadline(this.selectedLathe()?.efficiency ?? 0));
    protected viewTitle = computed(() =>
        this.view() === 'dashboard' ? 'Monitor' : this.view() === 'graphs' ? 'Análise Gráfica' : 'Manutenção',
    );

    protected maintenanceHistory = computed(() =>
        this.selectedLathe() ? maintenanceHistoryFor(this.selectedLathe()!) : [],
    );
    protected typeLabel = typeLabel;

    constructor() {
        // Sincroniza URL -> signals (suporte a refresh, navegador e links diretos).
        const routerEventsSub = this.router.events
            .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
            .subscribe((e) => this.syncStateFromUrl(e.urlAfterRedirects));
        inject(DestroyRef).onDestroy(() => routerEventsSub.unsubscribe());

        // Sincroniza signals -> URL (signals sao a fonte de verdade; URL reflete).
        effect(() => {
            this.syncUrlFromState(this.auth.user(), this.fleetService.selectedLatheId(), this.view());
        });
    }

    private syncStateFromUrl(url: string): void {
        const [path, query] = url.split('?');
        const segments = path.split('/').filter(Boolean);

        if (segments[0] === 'maquina' && segments[1]) {
            const id = decodeURIComponent(segments[1]);
            if (this.fleetService.selectedLatheId() !== id) {
                this.fleetService.selectedLatheId.set(id);
            }
            const viewParam = new URLSearchParams(query ?? '').get('view');
            if (viewParam && this.view() !== viewParam) {
                this.view.set(viewParam);
            }
        } else if (segments[0] === 'frota' && this.fleetService.selectedLatheId() !== null) {
            this.fleetService.selectedLatheId.set(null);
        }
    }

    private syncUrlFromState(user: AuthUser | null, latheId: string | null, currentView: string): void {
        const target = !user ? '/login' : latheId ? `/maquina/${latheId}?view=${currentView}` : '/frota';
        if (this.router.url === target) return;

        const isSameMachine = latheId !== null && latheId === this.previousLatheId;
        this.previousLatheId = latheId;
        this.router.navigateByUrl(target, { replaceUrl: isSameMachine });
    }

    protected onLogin(user: { name: string; role: string }): void {
        this.toast.success(`Bem-vindo, ${user.name}!`, user.role);
        this.fleetService.start();
    }

    protected onLogout(): void {
        this.fleetService.stop();
        this.auth.logout();
        this.fleetService.selectedLatheId.set(null);
        this.view.set('dashboard');
    }

    protected onSelectLathe(lathe: LatheData): void {
        this.fleetService.selectedLatheId.set(lathe.id);
        this.view.set('dashboard');
    }

    protected onBackToFleet(): void {
        this.fleetService.selectedLatheId.set(null);
    }

    protected onScheduleSubmit(data: MaintenanceData): void {
        const entry: ScheduledMaintenance = {
            ...data,
            id: `mnt-${Date.now()}`,
            scheduledAt: new Date().toISOString(),
            status: 'scheduled',
        };
        const updated = [...this.scheduledMaintenances(), entry];
        this.scheduledMaintenances.set(updated);

        const latheDates = updated.filter((m) => m.machineId === data.machineId).map((m) => m.date);
        const nearest = this.nearestUpcomingDate(latheDates);
        if (nearest) {
            this.fleetService.fleet.update((f) =>
                f.map((l) => (l.id === data.machineId ? { ...l, nextMaintenance: nearest } : l)),
            );
        }

        const lathe = this.selectedLathe();
        this.toast.success(
            'Manutenção agendada!',
            `${lathe?.name} · ${formatISODate(data.date)} às ${data.time} · ${typeLabel[data.type] ?? data.type}`,
        );
    }

    protected updateMaintenanceStatus(id: string, status: 'completed' | 'cancelled'): void {
        this.scheduledMaintenances.update((list) => list.map((m) => (m.id === id ? { ...m, status } : m)));
        this.toast.info(status === 'completed' ? 'Manutenção concluída' : 'Manutenção cancelada');
    }

    private nearestUpcomingDate(dates: string[]): string | null {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const future = dates
            .map((d) => ({ raw: d, parsed: parseISODateLocal(d) }))
            .filter((x) => x.parsed && x.parsed >= today)
            .sort((a, b) => a.parsed!.getTime() - b.parsed!.getTime());
        return future.length > 0 ? formatISODate(future[0].raw) : null;
    }
}
