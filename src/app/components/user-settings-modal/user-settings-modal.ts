import { Tabs, TabList, Tab, TabPanel, TabContent } from '@angular/aria/tabs';
import {
    ChangeDetectionStrategy,
    Component,
    HostListener,
    computed,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { FontFamily, FontSize, NotificationFilter, SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { Icon } from '../../shared/icon/icon';

@Component({
    selector: 'app-user-settings-modal',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Tabs, TabList, Tab, TabPanel, TabContent, Icon],
    templateUrl: './user-settings-modal.html',
})
export class UserSettingsModal {
    readonly isOpen = input.required<boolean>();
    readonly userName = input.required<string>();
    readonly close = output<void>();

    protected settings = inject(SettingsService);
    private auth = inject(AuthService);

    protected activeTab = signal<string | undefined>('accessibility');
    protected fontSizes: FontSize[] = ['small', 'default', 'large'];
    protected userRole = computed(() => this.auth.user()?.role ?? '');

    protected setFontSize(s: FontSize): void {
        this.settings.setFontSize(s);
    }

    protected setFontFamily(f: FontFamily): void {
        this.settings.setFontFamily(f);
    }

    protected toggleEmailNotifications(): void {
        this.settings.setEmailNotifications(!this.settings.emailNotifications());
    }

    protected setNotificationFilter(filter: NotificationFilter): void {
        this.settings.setNotificationFilter(filter);
    }

    protected toggleReduceMotion(): void {
        this.settings.setReduceMotion(!this.settings.reduceMotion());
    }

    @HostListener('document:keydown.escape')
    onEsc(): void {
        if (this.isOpen()) this.close.emit();
    }
}
