import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../../../shared/icon/icon';

interface TipCategory {
    icon: string;
    accent: string;
    title: string;
    tips: string[];
}

const TIP_CATEGORIES: TipCategory[] = [
    {
        icon: 'zap',
        accent: 'var(--status-yellow)',
        title: 'Redução de custo de energia',
        tips: [
            'Evite deixar um torno ligado sem processo agendado — horas ociosas pesam no custo estimado da aba Energia & Custos.',
            'Trate alertas de vibração/temperatura assim que aparecem: atrito fora da faixa aumenta o consumo do motor além do normal.',
            'Agrupe processos por linha de produção (Planta D) para reduzir o tempo de troca de ferramenta entre máquinas.',
        ],
    },
    {
        icon: 'shield-check',
        accent: 'var(--status-green)',
        title: 'Boas práticas de manutenção',
        tips: [
            'Máquinas em "Atenção" por mais de 48h tendem a evoluir para "Crítico" — priorize alertas amarelos, não só vermelhos.',
            'Registre toda intervenção em Manutenções > Agendar, mesmo as rápidas — o histórico ajuda a prever falhas recorrentes.',
            'Compare o índice de anomalia do dashboard da máquina com a vibração bruta antes de abrir uma ordem de serviço.',
        ],
    },
    {
        icon: 'settings-2',
        accent: 'var(--status-blue)',
        title: 'Aproveite melhor o sistema',
        tips: [
            'Troque entre Grade, Lista e Agrupado no topo da Frota conforme a tarefa: Lista ajuda em auditorias rápidas.',
            'Em Configurações > Acessibilidade, ative "Só críticos" nas notificações para reduzir ruído em turnos com muitas máquinas.',
            'Abra o Gêmeo 3D de uma máquina em alerta para acompanhar variações de vibração e temperatura em tempo real.',
        ],
    },
];

@Component({
    selector: 'app-fleet-tips-view',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [Icon],
    templateUrl: './fleet-tips-view.html',
})
export class FleetTipsView {
    protected categories = TIP_CATEGORIES;
}
