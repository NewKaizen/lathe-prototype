import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { FleetService } from './core/services/fleet.service';

describe('App', () => {
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [App],
            providers: [provideRouter(routes)],
        }).compileComponents();
    });

    it('should create the app', () => {
        const fixture = TestBed.createComponent(App);
        const app = fixture.componentInstance;
        expect(app).toBeTruthy();
    });

    it('mirrors login/machine-selection/logout in the URL', async () => {
        const fixture = TestBed.createComponent(App);
        const router = TestBed.inject(Router);
        const auth = TestBed.inject(AuthService);
        const fleetService = TestBed.inject(FleetService);

        fixture.detectChanges();
        TestBed.flushEffects();
        await fixture.whenStable();
        expect(router.url).toBe('/login');

        auth.user.set({ name: 'Administrador', role: 'Administrador do Sistema' });
        TestBed.flushEffects();
        await fixture.whenStable();
        expect(router.url).toBe('/frota?v=home');

        fleetService.selectedLatheId.set('TC-01');
        TestBed.flushEffects();
        await fixture.whenStable();
        expect(router.url).toBe('/maquina/TC-01?view=dashboard');

        auth.logout();
        TestBed.flushEffects();
        await fixture.whenStable();
        expect(router.url).toBe('/login');
    });

    it('shows the page loading skeleton immediately after a successful login', () => {
        const fixture = TestBed.createComponent(App);
        const fleetService = TestBed.inject(FleetService);
        vi.spyOn(fleetService, 'start').mockImplementation(() => undefined);

        const app = fixture.componentInstance as unknown as {
            onLogin: (user: { name: string; role: string }) => void;
        };
        app.onLogin({ name: 'Administrador', role: 'Administrador do Sistema' });
        fixture.detectChanges();

        expect(fixture.nativeElement.querySelector('app-page-skeleton')).not.toBeNull();
    });

    it('shows a centered exit spinner and message while logging out', () => {
        const fixture = TestBed.createComponent(App);
        const fleetService = TestBed.inject(FleetService);
        vi.spyOn(fleetService, 'stop').mockImplementation(() => undefined);

        const app = fixture.componentInstance as unknown as { onLogout: () => void };
        app.onLogout();
        fixture.detectChanges();

        const feedback = fixture.nativeElement.querySelector('[aria-label="Saindo da conta"]');
        expect(feedback).not.toBeNull();
        expect(feedback.textContent).toContain('Saindo...');
        expect(feedback.querySelector('.animate-spin')).not.toBeNull();
    });
});
