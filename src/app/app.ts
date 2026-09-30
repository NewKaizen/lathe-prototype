import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    HostListener,
    computed,
    effect,
    inject,
    signal,
} from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { FleetService } from './core/services/fleet.service';
import { ToastService } from './core/services/toast.service';
import { AuthUser, LatheData } from './core/models/fleet.model';
import { DEFAULT_FLEET_NAV, FleetNav, fleetNavFromQuery, fleetNavToQuery } from './core/models/fleet-nav';

import { LoginScreen } from './components/login-screen/login-screen';
import { FleetSelector } from './components/fleet-selector/fleet-selector';
import { ToastContainer } from './shared/toast/toast-container';
import { Icon } from './shared/icon/icon';
import { FleetCommandsView } from './components/fleet-selector/views/fleet-commands-view/fleet-commands-view';
import { PageSkeleton } from './shared/page-skeleton/page-skeleton';

const MACHINE_VIEWS = new Set(['digital-twin', 'dashboard', 'graphs', 'maintenance']);

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LoginScreen, FleetSelector, ToastContainer, Icon, FleetCommandsView, PageSkeleton],
    templateUrl: './app.html',
})
export class App {
    protected auth = inject(AuthService);
    protected fleetService = inject(FleetService);
    private toast = inject(ToastService);
    private router = inject(Router);
    private previousLatheId: string | null = null;

    /** Aba ativa da subpágina de monitor da máquina (Gêmeo 3D/Dashboard/Gráficos/Manutenção) —
     *  vive aqui (não em FleetSelector nem no componente de detalhe) porque é sincronizada com
     *  a URL (`?view=`) em syncStateFromUrl/syncUrlFromState. */
    protected view = signal<string>('dashboard');
    protected fleetNav = signal<FleetNav>(DEFAULT_FLEET_NAV);
    protected isOnline = signal(typeof navigator === 'undefined' || navigator.onLine);
    protected systemError = signal<string | null>(null);
    protected showPageSkeleton = signal(false);
    protected showLogoutLoading = signal(false);
    private routeLoadingTimer: number | null = null;
    private loginLoadingTimer: number | null = null;
    private loginLoadingUntil = 0;
    private logoutLoadingTimer: number | null = null;
    private logoutLoadingUntil = 0;
    private routeLoading = false;
    /** Fase 2.3: painel global de Ajuda — substitui "Central de Comandos"/"Dicas" como itens de nav. */
    protected isHelpOpen = signal(false);
    /** Fase 3.1: vive aqui (não em FleetSelector) porque FleetSelector é destruído ao
     *  selecionar uma máquina — precisa sobreviver pra "voltar" preservar a página. */
    protected fleetPage = signal(1);

    protected fleet = this.fleetService.fleet;
    protected tick = this.fleetService.tick;

    protected selectedLathe = computed<LatheData | null>(() => {
        const id = this.fleetService.selectedLatheId();
        return this.fleet().find((l) => l.id === id) ?? null;
    });

    protected notFoundLatheId = computed(() => {
        const id = this.fleetService.selectedLatheId();
        return id !== null && this.selectedLathe() === null ? id : null;
    });

    protected latheHistory = computed(() => {
        const id = this.selectedLathe()?.id;
        return id ? this.fleetService.historyFor(id) : undefined;
    });

    constructor() {
        this.syncStateFromUrl(window.location.pathname + window.location.search);
        // Sincroniza URL -> signals (suporte a refresh, navegador e links diretos).
        const routerEventsSub = this.router.events.subscribe((event) => {
            if (event instanceof NavigationStart) {
                this.startRouteLoading();
            } else if (event instanceof NavigationEnd) {
                this.finishRouteLoading();
                this.syncStateFromUrl(event.urlAfterRedirects);
            } else if (event instanceof NavigationCancel) {
                this.finishRouteLoading();
            } else if (event instanceof NavigationError) {
                this.finishRouteLoading();
                this.systemError.set('Não foi possível abrir esta página. Tente novamente.');
            }
        });
        inject(DestroyRef).onDestroy(() => {
            routerEventsSub.unsubscribe();
            this.finishRouteLoading();
            if (this.loginLoadingTimer !== null) window.clearTimeout(this.loginLoadingTimer);
            if (this.logoutLoadingTimer !== null) window.clearTimeout(this.logoutLoadingTimer);
        });

        // Sincroniza signals -> URL (signals sao a fonte de verdade; URL reflete).
        effect(() => {
            this.syncUrlFromState(this.auth.user(), this.fleetService.selectedLatheId(), this.view(), this.fleetNav());
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
            const nextView = viewParam && MACHINE_VIEWS.has(viewParam) ? viewParam : 'dashboard';
            if (this.view() !== nextView) {
                this.view.set(nextView);
            }
        } else if (segments[0] === 'frota') {
            if (this.fleetService.selectedLatheId() !== null) this.fleetService.selectedLatheId.set(null);
            const next = fleetNavFromQuery(query ?? '', this.fleetNav());
            if (fleetNavToQuery(next) !== fleetNavToQuery(this.fleetNav())) this.fleetNav.set(next);
        }
    }

    private startRouteLoading(): void {
        if (this.routeLoadingTimer !== null) window.clearTimeout(this.routeLoadingTimer);
        this.routeLoading = true;
        if (this.loginLoadingUntil > Date.now()) {
            this.showPageSkeleton.set(true);
            return;
        }
        this.routeLoadingTimer = window.setTimeout(() => this.showPageSkeleton.set(true), 250);
    }

    private finishRouteLoading(): void {
        if (this.routeLoadingTimer !== null) window.clearTimeout(this.routeLoadingTimer);
        this.routeLoadingTimer = null;
        this.routeLoading = false;
        this.finishLogoutLoading();
        const remainingLoginLoading = this.loginLoadingUntil - Date.now();
        if (remainingLoginLoading > 0) {
            this.showPageSkeleton.set(true);
            this.scheduleLoginLoadingFinish(remainingLoginLoading);
            return;
        }
        this.loginLoadingUntil = 0;
        this.showPageSkeleton.set(false);
    }

    private scheduleLoginLoadingFinish(delay: number): void {
        if (this.loginLoadingTimer !== null) window.clearTimeout(this.loginLoadingTimer);
        this.loginLoadingTimer = window.setTimeout(() => {
            this.loginLoadingTimer = null;
            if (this.routeLoading) return;
            this.loginLoadingUntil = 0;
            this.showPageSkeleton.set(false);
        }, delay);
    }

    private scheduleLogoutLoadingFinish(delay: number): void {
        if (this.logoutLoadingTimer !== null) window.clearTimeout(this.logoutLoadingTimer);
        this.logoutLoadingTimer = window.setTimeout(() => {
            this.logoutLoadingTimer = null;
            this.finishLogoutLoading();
        }, delay);
    }

    private finishLogoutLoading(): void {
        if (!this.logoutLoadingUntil || this.routeLoading) return;
        const remaining = this.logoutLoadingUntil - Date.now();
        if (remaining > 0) {
            this.scheduleLogoutLoadingFinish(remaining);
            return;
        }
        this.logoutLoadingUntil = 0;
        this.showLogoutLoading.set(false);
    }

    @HostListener('window:online')
    protected onOnline(): void {
        this.isOnline.set(true);
    }

    @HostListener('window:offline')
    protected onOffline(): void {
        this.isOnline.set(false);
    }

    @HostListener('window:error', ['$event'])
    protected onWindowError(event: ErrorEvent): void {
        if (event instanceof ErrorEvent && event.message) {
            this.systemError.set('Ocorreu um erro inesperado. Recarregue a página para continuar.');
        }
    }

    @HostListener('window:unhandledrejection')
    protected onUnhandledRejection(): void {
        this.systemError.set('Uma operação falhou inesperadamente. Tente recarregar a página.');
    }

    protected retrySystem(): void {
        if (!this.isOnline()) return;
        window.location.reload();
    }

    protected closeSystemError(): void {
        this.systemError.set(null);
    }

    private syncUrlFromState(user: AuthUser | null, latheId: string | null, currentView: string, nav: FleetNav): void {
        const target = !user
            ? '/login'
            : latheId
              ? `/maquina/${latheId}?view=${currentView}`
              : `/frota?${fleetNavToQuery(nav)}`;
        if (this.router.url === target) return;

        const isSameMachine = latheId !== null && latheId === this.previousLatheId;
        this.previousLatheId = latheId;
        this.router.navigateByUrl(target, { replaceUrl: isSameMachine });
    }

    protected onLogin(user: { name: string; role: string }): void {
        this.loginLoadingUntil = Date.now() + 850;
        this.showPageSkeleton.set(true);
        this.scheduleLoginLoadingFinish(850);
        this.toast.success(`Bem-vindo, ${user.name}!`, user.role);
        this.fleetService.start();
    }

    protected onLogout(): void {
        this.logoutLoadingUntil = Date.now() + 1000;
        this.showLogoutLoading.set(true);
        this.scheduleLogoutLoadingFinish(1000);
        this.fleetService.stop();
        this.auth.logout();
        this.fleetService.selectedLatheId.set(null);
        this.fleetNav.set(DEFAULT_FLEET_NAV);
    }

    protected onSelectLathe(lathe: LatheData, tab: string = 'dashboard'): void {
        this.fleetService.selectedLatheId.set(lathe.id);
        this.view.set(tab);
    }

    protected onBackToFleet(): void {
        this.fleetService.selectedLatheId.set(null);
    }
}
