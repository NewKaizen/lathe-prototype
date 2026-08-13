import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { FleetService } from './core/services/fleet.service';
import { ToastService } from './core/services/toast.service';
import { AuthUser, LatheData } from './core/models/fleet.model';

import { LoginScreen } from './components/login-screen/login-screen';
import { FleetSelector } from './components/fleet-selector/fleet-selector';
import { ToastContainer } from './shared/toast/toast-container';
import { Icon } from './shared/icon/icon';
import { FleetCommandsView } from './components/fleet-selector/views/fleet-commands-view/fleet-commands-view';

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [LoginScreen, FleetSelector, ToastContainer, Icon, FleetCommandsView],
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

    protected latheHistory = computed(() => {
        const id = this.selectedLathe()?.id;
        return id ? this.fleetService.historyFor(id) : undefined;
    });

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
    }

    protected onSelectLathe(lathe: LatheData): void {
        this.fleetService.selectedLatheId.set(lathe.id);
        this.view.set('dashboard');
    }

    protected onBackToFleet(): void {
        this.fleetService.selectedLatheId.set(null);
    }
}
