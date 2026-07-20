import { Routes } from '@angular/router';
import { RouteShell } from './shared/route-shell/route-shell';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'login' },
    { path: 'login', component: RouteShell },
    { path: 'frota', component: RouteShell, canActivate: [authGuard] },
    { path: 'maquina/:id', component: RouteShell, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' },
];
