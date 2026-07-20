import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'dismissedAlertIds';

/**
 * IDs de alertas dispensados pelo usuário. Alertas são derivados da telemetria ao vivo,
 * portanto dispensar suprime apenas a instância atual — pode reaparecer em nova ocorrência.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStateService {
    readonly dismissedIds = signal<Set<string>>(new Set(this.loadFromStorage()));

    private loadFromStorage(): string[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? (JSON.parse(raw) as string[]) : [];
        } catch {
            return [];
        }
    }

    private persist(ids: Set<string>): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    }

    isDismissed(id: string): boolean {
        return this.dismissedIds().has(id);
    }

    dismiss(id: string): void {
        const next = new Set(this.dismissedIds());
        next.add(id);
        this.dismissedIds.set(next);
        this.persist(next);
    }

    dismissAll(ids: string[]): void {
        const next = new Set(this.dismissedIds());
        for (const id of ids) next.add(id);
        this.dismissedIds.set(next);
        this.persist(next);
    }
}
