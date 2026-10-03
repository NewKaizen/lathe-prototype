# Alinhamento com o frontend definitivo

Referência: `Gemeo/dev-ml/frontend`, consultado em 03/10/2026, e os documentos ADR 047, ADR 048 e “Alinhamento do Protótipo com o Frontend” fornecidos nesta tarefa. As ADRs fornecidas têm status **Proposed**; esta implementação demonstra sua adoção no protótipo, sem alterar esse status no projeto definitivo.

## Responsabilidades

| Parte do protótipo                 | Responsabilidade                                                  | Correspondência no frontend                   |
| ---------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| `FleetSelector`                    | Composição, navegação, seleção, eventos e abertura de modais      | Página `Fleet` e shell `Main`                 |
| `state/fleet-listing-state.ts`     | Busca, filtro, ordenação, grupos, paginação e setores recolhidos  | Projeções locais de `FilterTable`             |
| `state/fleet-insights.ts`          | Indicadores, alertas, energia, prazos e históricos de comparação  | Estado derivado das páginas e painéis         |
| `state/fleet-maintenance-state.ts` | Leitura por máquina e coordenação dos comandos de manutenção      | `MaintenanceScheduler` + `MaintenanceService` |
| `core/services/fleet.service.ts`   | Estado dono da telemetria simulada; sinal público somente leitura | `LatheStateService` + `LatheWsService`        |
| Componentes `views/*`              | Apresentação com `input` e eventos com `output`                   | Componentes de Frota, painel e comparação     |

As factories recebem sinais e retornam projeções reativas. Podem ser usadas junto ao componente correspondente no frontend sem depender do shell de navegação do protótipo. Nenhum componente filho consulta o estado privado de um irmão. A paginação continua pertencendo ao shell de rota para sobreviver à seleção de máquina.

## ADR 047 — interações

Adicionada a dependência `@angular/aria` 22.1.5, compatível com Angular 22, sem introduzir um tema visual.

| Interação             | Implementação / avaliação                                                                                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frota e Relatórios    | `Tabs`, `TabList`, `Tab`, `TabPanel`, `TabContent`; seleção segue o foco; evento sincroniza a URL existente                                                                                                                |
| Máquina               | Mesmas diretivas; seleção explícita por Enter/Espaço, evitando iniciar o 3D apenas ao percorrer as abas                                                                                                                    |
| Configurações         | Mesmas diretivas, seleção segue o foco                                                                                                                                                                                     |
| Busca com sugestões   | `Combobox`, popup, widget, `Listbox`, `Option`; foco permanece no campo e resultado ativo é associado por ID                                                                                                               |
| Perfil                | `Menu`, `MenuTrigger`, `MenuItem`, `MenuContent`; foco, setas e Escape geridos pelo Angular Aria                                                                                                                           |
| Modos de visualização | `Toolbar`, `ToolbarWidgetGroup` com seleção única e `ToolbarWidget` para navegação e ativação dos botões; a preferência continua no `SettingsService`                                                                      |
| Grupos por linha      | Disclosures independentes com botões nativos e `aria-expanded`; expansão compartilhada e abertura forçada durante a filtragem continuam explícitas. Uma futura conversão para `Accordion` deve preservar essas duas regras |
| Seleção de máquina    | Botões e tabela permanecem controles nativos de ação. Não se aplica `Listbox` à frota inteira: ativar abre o detalhe, em vez de selecionar uma opção de formulário                                                         |
| Hierarquia            | Sem necessidade atual de `Tree`; planta/linha é agrupamento de apresentação                                                                                                                                                |

Os painéis inativos usam `hidden` além do estado `inert` gerido pelo Aria. As classes visuais, textos, cores e dimensões existentes foram mantidos. O conteúdo das abas segue montagem/desmontagem por `ngTabContent`; o gêmeo 3D continua carregado com `@defer`.

## ADR 048 — leitura assíncrona

O piloto é a leitura de agendamentos por máquina em `fleet-maintenance-state.ts`:

- `rxResource` usa `MaintenanceService.list(machineId)`, um Observable compatível com a assinatura do frontend.
- Os parâmetros dependem do **ID** da máquina e da revisão dos registros. Atualizar RPM/temperatura não refaz essa leitura.
- Trocar de máquina cancela uma leitura anterior; comandos incrementam a revisão e invalidam a leitura atual.
- Estados `isLoading`, `error` e `reload` ficam disponíveis no contrato. Falhas de leitura geram o toast existente.
- Criar e atualizar status são métodos explícitos do serviço, com subscriptions vinculadas ao `DestroyRef`.
- Login, telemetria contínua, cálculos síncronos e comandos não usam Resource APIs.

O serviço é um **adapter em memória**, com leituras finitas por `defer/of`. Não está conectado a uma API. Para integrar, substituir seus corpos pelos `HttpClient.get/post/patch` já existentes no frontend. Se esse Observable continuar compondo a camada de serviços, manter `rxResource`; para GET direto e simples, avaliar `httpResource` conforme a ADR 048.

## Contratos de manutenção

`maintenance-api.model.ts` define o formato de transporte equivalente ao frontend:

- criação: `machine_id`, `type`, `date`, `time`, `technician`, `notes?`;
- resposta: campos de criação + `id`, `scheduled_at`, `status`;
- `toMaintenanceRequest` e `toScheduledMaintenance` convertem explicitamente `machineId`/`scheduledAt` usados pelos componentes atuais.

O serviço oferece `list`, `listAllMaintenance`, `create` e `updateStatus`. Os agendamentos sobrevivem à navegação entre máquinas e à recriação do componente dentro da mesma execução da aplicação; continuam sem persistência após recarregar a página.

## Limites para a transferência

1. **Modelo de máquina:** o protótipo ainda usa `LatheData` plano; o frontend usa `ILatheModel` com `latheServices`, `operationalState` e manutenção. Adaptar explicitamente `temperature` → `latheServices.temp`, preservando ausência de telemetria. Não substituir ausência por zero nem converter `efficiency` em `healthScore`: não são métricas equivalentes.
2. **Rotas:** o protótipo usa `/frota` e `/maquina/:id`; o frontend usa a raiz e query parameters `machine`, `tab`, `returnTo`. Transferir os eventos de seleção/retorno para `navigateToLathePanel`; não copiar as URLs literalmente.
3. **Autenticação:** demonstração local continua mock. Os guards, papéis, cookies, interceptor e login HTTP do frontend continuam sendo a implementação definitiva.
4. **Energia, processos, históricos e anomalias:** permanecem simulações/estimativas. Precisam de contratos e fontes reais antes da integração.
5. **Infraestrutura:** não foram copiados Docker, Nginx, PWA ou configuração de ambiente; pertencem ao frontend definitivo e têm ciclo de publicação próprio.
6. **Acessibilidade:** validação de teclado e associações acessíveis não substitui um teste com leitor de tela. Esse teste ainda deve ser feito no MVP.

## Verificação

Executar `npm test -- --watch=false`, `npm run lint` e `npm run build` no protótipo. Os testes de `fleet-state.spec.ts` cobrem filtros, paginação, ordenação sem mutar a fonte, agrupamento, atualização de histórico, adapters, manutenção entre máquinas e cancelamento de leituras antigas.

O ESLint usa `endOfLine: 'auto'`, como no frontend definitivo, para validar checkout Windows sem reformatação global de CRLF.

Resultados locais em 03/10/2026: 68 testes em 10 arquivos passaram; lint e build de produção passaram. O build emitiu aviso de orçamento inicial: 677,96 kB para limite de aviso de 500 kB. O orçamento não foi aumentado para ocultar esse aviso.

No navegador foram conferidos navegação das abas por setas, seleção da busca por teclado, menu de perfil com Escape e seleção dos modos de visualização por teclado. A aparência foi inspecionada mantendo as classes, estilos e assets existentes. O frontend definitivo não recebeu alterações nesta tarefa; commit e publicação não foram executados.

Fontes de API: [Angular Aria Tabs](https://angular.dev/guide/aria/tabs) e [Resource APIs](https://angular.dev/guide/signals/resource). A documentação do pacote instalado foi consultada para os contratos de Tabs, Combobox, Listbox, Menu e Toolbar.
