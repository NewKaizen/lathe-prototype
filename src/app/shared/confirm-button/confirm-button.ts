import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

/**
 * Botão de confirmação em 2 passos — padrão Carbon para ações destrutivas/irreversíveis.
 *
 * Comportamento:
 *   1º clique → estado "armado": cor de alerta, texto muda para `confirmLabel`.
 *               Reverte automaticamente após `armTimeoutMs` (padrão: 4000ms).
 *   2º clique  → emite `confirmed` e retorna ao estado normal.
 *
 * Design: sem modal, sem glass — só troca de estado do próprio botão.
 * Consistente com Carbon (sem sombra decorativa, sem backdrop-filter).
 */
@Component({
    selector: 'app-confirm-button',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './confirm-button.html',
})
export class ConfirmButton {
    /** Rótulo exibido no estado normal. */
    readonly label = input<string>('Confirmar');
    /** Rótulo exibido no estado armado (aguardando 2º clique). */
    readonly confirmLabel = input<string>('Confirmar?');
    /** Janela em ms para o 2º clique antes de reverter automaticamente. */
    readonly armTimeoutMs = input<number>(4000);
    /** Emitido no 2º clique, dentro da janela de confirmação. */
    readonly confirmed = output<void>();

    protected armed = signal(false);
    private _timer: ReturnType<typeof setTimeout> | null = null;

    protected onClick(): void {
        if (!this.armed()) {
            // 1º clique: armar
            this.armed.set(true);
            this._timer = setTimeout(() => this.armed.set(false), this.armTimeoutMs());
        } else {
            // 2º clique: confirmar
            if (this._timer) {
                clearTimeout(this._timer);
                this._timer = null;
            }
            this.armed.set(false);
            this.confirmed.emit();
        }
    }
}
