/** Páginas e ações pesquisáveis pela busca interna (app-command-search). */

export interface CommandPage {
    /** Corresponde a um id de FleetView em fleet-selector.ts. */
    id: string;
    label: string;
    icon: string;
    keywords: string[];
    hint: string;
}

export interface CommandAction {
    id: string;
    label: string;
    icon: string;
    keywords: string[];
    hint: string;
}

export const COMMAND_PAGES: CommandPage[] = [
    { id: 'home', label: 'Início', icon: 'home', keywords: ['home', 'painel', 'visão geral'], hint: ':início' },
    { id: 'fleet', label: 'Frota', icon: 'layout-grid', keywords: ['tornos', 'máquinas', 'grade'], hint: ':frota' },
    {
        id: 'alerts',
        label: 'Alertas',
        icon: 'alert-triangle',
        keywords: ['crítico', 'atenção', 'avisos'],
        hint: ':alertas',
    },
    {
        id: 'maintenance',
        label: 'Manutenções',
        icon: 'calendar',
        keywords: ['agendar', 'preventiva', 'corretiva'],
        hint: ':manutenções',
    },
    {
        id: 'overview',
        label: 'Resumo',
        icon: 'bar-chart-3',
        keywords: ['estatísticas', 'indicadores'],
        hint: ':resumo',
    },
    { id: 'plant', label: 'Planta D', icon: 'factory', keywords: ['mapa', 'setores', 'linhas'], hint: ':planta' },
    {
        id: 'energy',
        label: 'Energia & Custos',
        icon: 'zap',
        keywords: ['consumo', 'kwh', 'custo', 'gasto'],
        hint: ':energia',
    },
    {
        id: 'reports',
        label: 'Relatórios',
        icon: 'file-text',
        keywords: ['documentos', 'exportar', 'processos'],
        hint: ':relatórios',
    },
    {
        id: 'tips',
        label: 'Dicas & Boas Práticas',
        icon: 'lightbulb',
        keywords: ['ajuda', 'economia', 'como usar'],
        hint: ':dicas',
    },
    {
        id: 'commands',
        label: 'Central de Comandos',
        icon: 'search',
        keywords: ['atalhos', 'sintaxe', 'ajuda', 'busca'],
        hint: ':comandos',
    },
];

export const COMMAND_ACTIONS: CommandAction[] = [
    {
        id: 'open-settings',
        label: 'Abrir configurações',
        icon: 'settings-2',
        keywords: ['ajustes', 'preferências', 'fonte', 'acessibilidade'],
        hint: '>configurações',
    },
    {
        id: 'logout',
        label: 'Sair da conta',
        icon: 'log-out',
        keywords: ['logout', 'sair', 'encerrar sessão'],
        hint: '>sair',
    },
    {
        id: 'toggle-sidebar',
        label: 'Recolher / expandir sidebar',
        icon: 'panel-left-close',
        keywords: ['menu', 'lateral', 'colapsar'],
        hint: '>sidebar',
    },
    {
        id: 'layout-grid',
        label: 'Frota: layout em grade',
        icon: 'layout-grid',
        keywords: ['cards', 'visual'],
        hint: '>layout grade',
    },
    {
        id: 'layout-list',
        label: 'Frota: layout em lista',
        icon: 'list',
        keywords: ['tabela', 'densa'],
        hint: '>layout lista',
    },
    {
        id: 'layout-grouped',
        label: 'Frota: layout agrupado por linha',
        icon: 'layers',
        keywords: ['setor', 'linha de produção'],
        hint: '>layout agrupado',
    },
    {
        id: 'filter-critical',
        label: 'Frota: filtrar só críticos',
        icon: 'alert-triangle',
        keywords: ['filtro', 'crítico'],
        hint: '>filtrar críticos',
    },
    {
        id: 'report-efficiency',
        label: 'Ver relatório de eficiência',
        icon: 'file-text',
        keywords: ['eficiência', 'desempenho', 'ranking'],
        hint: '>relatório eficiência',
    },
    {
        id: 'report-maintenance',
        label: 'Ver relatório de manutenções',
        icon: 'file-text',
        keywords: ['manutenção', 'agenda'],
        hint: '>relatório manutenção',
    },
    {
        id: 'report-alerts',
        label: 'Ver relatório de alertas',
        icon: 'file-text',
        keywords: ['alerta', 'crítico'],
        hint: '>relatório alertas',
    },
];
