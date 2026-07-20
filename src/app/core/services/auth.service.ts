import { Injectable, signal } from '@angular/core';
import { AuthUser } from '../models/fleet.model';

/** Credenciais de demonstração, expostas para o botão "Preencher" da tela de login. */
// MOCK: credenciais fixas + login simulado (sem backend). Antes de qualquer ambiente que não
// seja demonstração local, condicionar a um flag de ambiente e substituir por autenticação real.
export const DEMO_CREDENTIALS = { username: 'admin', password: 'admin123' };

const CREDENTIALS = {
    ...DEMO_CREDENTIALS,
    name: 'Administrador',
    role: 'Administrador do Sistema',
};

@Injectable({ providedIn: 'root' })
export class AuthService {
    readonly user = signal<AuthUser | null>(null);

    /** Simula uma chamada de autenticação (delay de rede). */
    async login(username: string, password: string): Promise<AuthUser | null> {
        await new Promise((r) => setTimeout(r, 700));
        if (username.trim().toLowerCase() === CREDENTIALS.username && password === CREDENTIALS.password) {
            const user: AuthUser = { name: CREDENTIALS.name, role: CREDENTIALS.role };
            this.user.set(user);
            return user;
        }
        return null;
    }

    logout(): void {
        this.user.set(null);
    }
}
