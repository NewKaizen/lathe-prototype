import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { Icon } from '../icon/icon';

@Component({
    selector: 'app-toast-container',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    template: `
        <div class="fixed top-[105px] right-5 z-[100] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2.5rem)]">
            @for (t of toast.toasts(); track t.id) {
                <div
                    class="bg-card border border-border border-l-[3px] px-4 py-3 flex items-start gap-3 animate-fade-in-up"
                    [style.border-left-color]="colorOf(t.variant)"
                    role="status"
                >
                    <app-icon
                        [name]="iconOf(t.variant)"
                        [size]="16"
                        [style.color]="colorOf(t.variant)"
                        class="shrink-0 mt-0.5"
                    />
                    <div class="flex-1 min-w-0">
                        <p class="text-[13px] font-semibold text-foreground leading-snug">{{ t.title }}</p>
                        @if (t.description) {
                            <p class="text-[12px] text-muted-foreground mt-0.5">{{ t.description }}</p>
                        }
                    </div>
                    <button
                        type="button"
                        (click)="toast.dismiss(t.id)"
                        class="text-muted-foreground/60 hover:text-foreground transition-colors shrink-0"
                        aria-label="Fechar"
                    >
                        <app-icon name="x" [size]="14" />
                    </button>
                </div>
            }
        </div>
    `,
})
export class ToastContainer {
    protected toast = inject(ToastService);

    protected iconOf(variant: string): string {
        if (variant === 'success') return 'check-circle-2';
        if (variant === 'warning' || variant === 'error') return 'alert-triangle';
        return 'activity';
    }

    protected colorOf(variant: string): string {
        if (variant === 'success') return 'var(--status-green)';
        if (variant === 'warning') return 'var(--status-yellow)';
        if (variant === 'error') return 'var(--status-red)';
        return 'var(--status-blue)';
    }
}
