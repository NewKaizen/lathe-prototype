import { Injectable, signal } from '@angular/core';

export type FontSize = 'small' | 'default' | 'large';
export type FontFamily = 'default' | 'dyslexia';
export type FleetLayoutMode = 'grouped' | 'grid' | 'list';
export type NotificationFilter = 'all' | 'critical-only';

@Injectable({ providedIn: 'root' })
export class SettingsService {
    readonly fontSize = signal<FontSize>('default');
    readonly fontFamily = signal<FontFamily>('default');
    readonly emailNotifications = signal<boolean>(true);
    readonly fleetLayoutMode = signal<FleetLayoutMode>('grouped');
    readonly notificationFilter = signal<NotificationFilter>('all');
    readonly reduceMotion = signal<boolean>(false);

    constructor() {
        const savedSize = localStorage.getItem('fontSize') as FontSize | null;
        const savedFont = localStorage.getItem('fontFamily') as FontFamily | null;
        const savedEmailNotifications = localStorage.getItem('emailNotifications');
        const savedLayoutMode = localStorage.getItem('fleetLayoutMode') as FleetLayoutMode | null;
        const savedNotificationFilter = localStorage.getItem('notificationFilter') as NotificationFilter | null;
        const savedReduceMotion = localStorage.getItem('reduceMotion');

        if (savedSize) this.setFontSize(savedSize);
        if (savedFont) this.setFontFamily(savedFont);
        if (savedEmailNotifications !== null) this.emailNotifications.set(savedEmailNotifications === 'true');
        if (savedLayoutMode) this.fleetLayoutMode.set(savedLayoutMode);
        if (savedNotificationFilter) this.notificationFilter.set(savedNotificationFilter);
        if (savedReduceMotion !== null) this.setReduceMotion(savedReduceMotion === 'true');
    }

    setEmailNotifications(enabled: boolean): void {
        this.emailNotifications.set(enabled);
        localStorage.setItem('emailNotifications', String(enabled));
    }

    setFontSize(size: FontSize): void {
        this.fontSize.set(size);
        localStorage.setItem('fontSize', size);
        const sizeValue = size === 'small' ? '14px' : size === 'large' ? '18px' : '16px';
        document.documentElement.style.fontSize = sizeValue;
    }

    setFontFamily(font: FontFamily): void {
        this.fontFamily.set(font);
        localStorage.setItem('fontFamily', font);
        if (font === 'dyslexia') {
            // Atkinson Hyperlegible (styles/fonts.css); Comic Sans MS é fallback de emergência.
            document.documentElement.style.setProperty(
                '--font-sans',
                "'Atkinson Hyperlegible', 'Comic Sans MS', sans-serif",
            );
            document.documentElement.style.setProperty(
                '--font-display',
                "'Atkinson Hyperlegible', 'Comic Sans MS', sans-serif",
            );
        } else {
            document.documentElement.style.removeProperty('--font-sans');
            document.documentElement.style.removeProperty('--font-display');
        }
    }

    setFleetLayoutMode(mode: FleetLayoutMode): void {
        this.fleetLayoutMode.set(mode);
        localStorage.setItem('fleetLayoutMode', mode);
    }

    setNotificationFilter(filter: NotificationFilter): void {
        this.notificationFilter.set(filter);
        localStorage.setItem('notificationFilter', filter);
    }

    setReduceMotion(enabled: boolean): void {
        this.reduceMotion.set(enabled);
        localStorage.setItem('reduceMotion', String(enabled));
        document.documentElement.classList.toggle('reduce-motion', enabled);
    }
}
