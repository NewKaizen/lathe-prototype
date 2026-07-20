import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
    let auth: AuthService;
    let router: Router;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        auth = TestBed.inject(AuthService);
        router = TestBed.inject(Router);
    });

    function runGuard() {
        return TestBed.runInInjectionContext(() => authGuard({} as never, { url: '/frota' } as never));
    }

    it('allows navigation when a user is authenticated', () => {
        auth.user.set({ name: 'Administrador', role: 'Administrador do Sistema' });
        expect(runGuard()).toBe(true);
    });

    it('redirects to /login when there is no authenticated user', () => {
        auth.user.set(null);
        const result = runGuard();
        expect(result).toBeInstanceOf(UrlTree);
        expect(router.serializeUrl(result as UrlTree)).toBe('/login');
    });
});
