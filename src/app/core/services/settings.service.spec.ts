import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
    let service: SettingsService;

    beforeEach(() => {
        localStorage.clear();
        document.documentElement.style.fontSize = '';
        document.documentElement.classList.remove('reduce-motion');
        TestBed.configureTestingModule({});
        service = TestBed.inject(SettingsService);
    });

    it('defaults to sensible values', () => {
        expect(service.fontSize()).toBe('default');
        expect(service.fontFamily()).toBe('default');
        expect(service.emailNotifications()).toBe(true);
        expect(service.fleetLayoutMode()).toBe('grouped');
        expect(service.notificationFilter()).toBe('all');
        expect(service.reduceMotion()).toBe(false);
    });

    it('persists and applies font size', () => {
        service.setFontSize('large');
        expect(service.fontSize()).toBe('large');
        expect(document.documentElement.style.fontSize).toBe('18px');
        expect(localStorage.getItem('fontSize')).toBe('large');
    });

    it('persists fleet layout mode', () => {
        service.setFleetLayoutMode('grid');
        expect(service.fleetLayoutMode()).toBe('grid');
        expect(localStorage.getItem('fleetLayoutMode')).toBe('grid');
    });

    it('persists notification filter', () => {
        service.setNotificationFilter('critical-only');
        expect(service.notificationFilter()).toBe('critical-only');
        expect(localStorage.getItem('notificationFilter')).toBe('critical-only');
    });

    it('toggles the reduce-motion class on the document root', () => {
        service.setReduceMotion(true);
        expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
        service.setReduceMotion(false);
        expect(document.documentElement.classList.contains('reduce-motion')).toBe(false);
    });

    it('reloads persisted preferences on construction', () => {
        service.setFleetLayoutMode('list');
        service.setReduceMotion(true);

        const fresh = new SettingsService();
        expect(fresh.fleetLayoutMode()).toBe('list');
        expect(fresh.reduceMotion()).toBe(true);
    });
});
