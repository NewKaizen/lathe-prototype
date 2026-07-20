import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
    id: number;
    variant: ToastVariant;
    title: string;
    description?: string;
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class ToastService {
    readonly toasts = signal<ToastItem[]>([]);

    private push(variant: ToastVariant, title: string, description?: string): void {
        const item: ToastItem = { id: nextId++, variant, title, description };
        this.toasts.update((list) => [...list, item]);
        setTimeout(() => this.dismiss(item.id), 4500);
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
        this.toasts.update((list) => list.filter((t) => t.id !== id));
    }
}
