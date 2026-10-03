import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
    id: number;
    variant: ToastVariant;
    title: string;
    description?: string;
    refreshVersion: number;
}

let nextId = 1;
const TOAST_DURATION_MS = 3000;

@Injectable({ providedIn: 'root' })
export class ToastService {
    readonly toasts = signal<ToastItem[]>([]);
    private readonly dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();

    private push(variant: ToastVariant, title: string, description?: string): void {
        const isSameToast = (item: ToastItem): boolean =>
            item.variant === variant && item.title === title && item.description === description;
        const existing = this.toasts().find(isSameToast);

        if (existing) {
            this.toasts.update((list) => {
                let keptExisting = false;
                return list
                    .filter((item) => {
                        if (!isSameToast(item)) return true;
                        if (item.id === existing.id && !keptExisting) {
                            keptExisting = true;
                            return true;
                        }
                        return false;
                    })
                    .map((item) =>
                        item.id === existing.id ? { ...item, refreshVersion: item.refreshVersion + 1 } : item,
                    );
            });
            this.scheduleDismiss(existing.id);
            return;
        }

        const item: ToastItem = { id: nextId++, variant, title, description, refreshVersion: 0 };
        this.toasts.update((list) => [...list, item]);
        this.scheduleDismiss(item.id);
    }

    private scheduleDismiss(id: number): void {
        const current = this.dismissTimers.get(id);
        if (current !== undefined) clearTimeout(current);
        this.dismissTimers.set(
            id,
            setTimeout(() => this.dismiss(id), TOAST_DURATION_MS),
        );
    }

    success(title: string, description?: string): void {
        this.push('success', title, description);
    }

    warning(title: string, description?: string): void {
        this.push('warning', title, description);
    }

    error(title: string, description?: string): void {
        this.push('error', title, description);
    }

    info(title: string, description?: string): void {
        this.push('info', title, description);
    }

    dismiss(id: number): void {
        const timer = this.dismissTimers.get(id);
        if (timer !== undefined) clearTimeout(timer);
        this.dismissTimers.delete(id);
        this.toasts.update((list) => list.filter((t) => t.id !== id));
    }
}
