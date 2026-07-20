import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../shared/icon/icon';
import { AuthUser } from '../../core/models/fleet.model';
import { AuthService, DEMO_CREDENTIALS } from '../../core/services/auth.service';

@Component({
    selector: 'app-login-screen',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [FormsModule, Icon],
    templateUrl: './login-screen.html',
})
export class LoginScreen {
    private auth = inject(AuthService);

    readonly login = output<AuthUser>();

    protected username = signal('');
    protected password = signal('');
    protected showPassword = signal(false);
    protected error = signal('');
    protected loading = signal(false);
    protected shake = signal(false);
    protected showDemoAccess = signal(false);

    protected async onSubmit(): Promise<void> {
        this.error.set('');
        this.loading.set(true);

        const user = await this.auth.login(this.username(), this.password());

        if (user) {
            this.login.emit(user);
            return;
        }

        this.loading.set(false);
        this.error.set('Usuário ou senha incorretos.');
        this.shake.set(true);
        setTimeout(() => this.shake.set(false), 500);
    }

    protected fillCredentials(): void {
        this.username.set(DEMO_CREDENTIALS.username);
        this.password.set(DEMO_CREDENTIALS.password);
        this.error.set('');
    }
}
