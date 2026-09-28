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
});
