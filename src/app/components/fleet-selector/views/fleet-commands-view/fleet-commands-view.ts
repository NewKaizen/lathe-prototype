import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMMAND_ACTIONS, COMMAND_PAGES } from '../../../../core/lib/commands';
import { Icon } from '../../../../shared/icon/icon';

interface SyntaxRule {
    symbol: string;
    title: string;
    description: string;
    example: string;
}

const SYNTAX_RULES: SyntaxRule[] = [
    {
        symbol: ':',
        title: 'Ir para uma página',
        description: 'Navega direto para uma seção do sistema (Frota, Alertas, Energia...).',
        example: ':relatórios',
    },
    {
        symbol: '>',
        title: 'Executar uma ação',
        description: 'Roda um comando: abrir configurações, trocar layout, sair da conta...',
        example: '>layout lista',
    },
    {
        symbol: '<',
        title: 'Ir para um torno',
        description: 'Pula direto para o monitor ao vivo de uma máquina pelo nome ou ID.',
        example: '<TC-07',
    },
];

@Component({
    selector: 'app-fleet-commands-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-commands-view.html',
})
export class FleetCommandsView {
    protected syntaxRules = SYNTAX_RULES;
    protected pages = COMMAND_PAGES;
    protected actions = COMMAND_ACTIONS;
}
