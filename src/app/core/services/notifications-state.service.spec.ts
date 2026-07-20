import { TestBed } from '@angular/core/testing';
import { NotificationsStateService } from './notifications-state.service';

describe('NotificationsStateService', () => {
    let service: NotificationsStateService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(NotificationsStateService);
    });

    it('starts with nothing dismissed', () => {
        expect(service.isDismissed('TC-01-critical')).toBe(false);
    });

    it('marks a single alert as dismissed', () => {
        service.dismiss('TC-01-critical');
        expect(service.isDismissed('TC-01-critical')).toBe(true);
        expect(service.isDismissed('TC-02-critical')).toBe(false);
    });

    it('marks multiple alerts as dismissed at once', () => {
        service.dismissAll(['TC-01-critical', 'TC-02-warning']);
        expect(service.isDismissed('TC-01-critical')).toBe(true);
        expect(service.isDismissed('TC-02-warning')).toBe(true);
    });

    it('persists dismissed ids across service instances (localStorage)', () => {
        service.dismiss('TC-05-overdue');

        const fresh = new NotificationsStateService();
        expect(fresh.isDismissed('TC-05-overdue')).toBe(true);
    });
});
