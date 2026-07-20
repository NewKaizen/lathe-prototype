import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Placeholder de rota. O app inteiro é renderizado por `App` via signals
 * (não há `<router-outlet>`) — as rotas existem só para sincronizar a URL
 * (voltar/avançar, refresh, links compartilháveis), então nenhuma rota
 * realmente instancia este componente visualmente.
 */
@Component({
    selector: 'app-route-shell',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '',
})
export class RouteShell {}
