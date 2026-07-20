# Lathe Digital Twin: Frontend

Interface web do **Gêmeo Digital do Torno Convencional**, projeto integrador desenvolvido no SENAI Limeira. O sistema monitora em tempo real a telemetria de tornos industriais (RPM, temperatura, vibração, ruído e eficiência), exibe um gêmeo 3D interativo e centraliza o agendamento de manutenções preventivas.

> **Estado atual:** protótipo visual funcional com telemetria simulada. A conexão WebSocket/MQTT com o backend real está pronta para ser conectada. Veja a seção [Integração com o Backend](#integração-com-o-backend).

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Angular 22 (Standalone Components, Signals) |
| Renderização 3D | Babylon.js 9 |
| Estilização | Tailwind CSS 4 |
| Testes | Vitest |
| Linting / Formatação | ESLint + Prettier |
| CI de commits | Husky + lint-staged |
| Container | Docker (multi-stage) + Nginx |

---

## Funcionalidades

**Visão de frota**
- Painel geral com cards de todas as máquinas, agrupamentos por linha de produção e visualização em lista, grade e planta
- Aba de alertas com histórico de anomalias detectadas
- Aba de manutenções com calendário de próximas intervenções
- Aba de energia com estimativa de consumo e custo por máquina
- Aba de relatórios com exportação de CSV compatível com Excel

**Painel individual da máquina**
- Dashboard com gauges de RPM, temperatura, vibração, ruído e eficiência
- Gráficos históricos com sparklines e linhas de tendência
- Gêmeo digital 3D interativo (Babylon.js) e placeholder para feed de câmera
- Agendamento e acompanhamento de manutenções preventivas

**Geral**
- Sistema de notificações com feed de alertas e badge de não lidas
- Configurações de usuário (tema, unidades, preferências de notificação)
- Busca por comando (atalho de teclado)
- Autenticação local com suporte a modo demo
- Rotas com guards, sincronização de estado via URL (suporte a refresh e histórico do navegador)

---

## Primeiros Passos

### Pré-requisitos

- Node.js >= 22
- npm >= 11

### Instalação e execução local

```bash
# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm start
```

Acesse `http://localhost:4200`.

**Credenciais de demonstração:** `admin` / `admin123`

### Execução via Docker

```bash
docker build -t lathe-digital-twin .
docker run -p 8080:80 lathe-digital-twin
```

Acesse `http://localhost:8080`.

---

## Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm start` | Servidor de desenvolvimento com hot-reload |
| `npm run build` | Build de produção (saída em `dist/`) |
| `npm test` | Executa os testes unitários com Vitest |
| `npm run lint` | Análise estática com ESLint |
| `npm run watch` | Build em modo watch para desenvolvimento |

---

## Estrutura do Projeto

```
src/
  app/
    components/       # Componentes de página e features
      digital-twin/       # Gêmeo 3D (Babylon.js) e placeholder de câmera
      fleet-selector/     # Visão de frota com todas as abas
      lathe-dashboard/    # Dashboard de telemetria da máquina
      lathe-charts/       # Gráficos históricos
      login-screen/       # Autenticação
      machine-sidebar/    # Sidebar da máquina com navegação entre views
      maintenance-scheduler/  # Modal de agendamento de manutenção
      notifications-panel/    # Painel de notificações e bell
      user-settings-modal/    # Configurações do usuário
    core/
      data/           # Dados mock da frota e histórico de manutenções
      guards/         # Guards de rota (auth)
      lib/            # Utilitários: status, sparkline, energia, formatação
      models/         # Interfaces TypeScript (LatheData, etc.)
      services/       # AuthService, FleetService, ToastService, SettingsService
    shared/           # Componentes reutilizáveis (Icon, Toast, ConfirmButton, etc.)
```

---

## Design & Identidade Visual

A interface deste projeto foi projetada seguindo as diretrizes e a filosofia de design da **IBM** e do **Carbon Design System**, adaptando princípios do modernismo industrial para a telemetria do gêmeo digital.

### Referências e Inspiração
- **Modernismo e Funcionalismo:** Inspirado no lema clássico da IBM *"Good design is good business"* (Thomas J. Watson Jr.) e nas contribuições de pioneiros como **Eliot Noyes**, **Paul Rand** e o casal **Eames**, o design prioriza a utilidade, a clareza e a eliminação do supérfluo, tratando a interface como uma ponte limpa entre o operador e a máquina.
- **A Tipografia IBM Plex:** Utiliza-se a tipografia oficial de código aberto da IBM. A Plex mescla cantos retos geométricos (representando a precisão da engenharia) com curvas humanistas (representando a ergonomia e a interação humana).
- **O Grid 2x:** A estrutura espacial de margens, paddings, tamanhos de componentes e disposição de painéis segue uma grade matemática rigorosa baseada em múltiplos de 2 (2px, 4px, 8px, 16px, 32px...), garantindo ritmo visual e consistência em telas de diferentes resoluções.

### Decisões de Design (Carbon Design System)
- **Alta Densidade de Informação:** Adaptado para ambientes de fábrica, o layout organiza grandes volumes de telemetria analítica (RPM, vibração, etc.) por meio de painéis densos, porém legíveis, inspirados em ferramentas industriais da IBM.
- **Acessibilidade (A11y):** Foco nas diretrizes de contraste e navegação por teclado para garantir a operabilidade no chão de fábrica.
- **Temas Industriais:** Uso de paletas de cores estruturadas em escalas de cinza e azuis frios (o clássico tom *Big Blue* da IBM), com acentos cromáticos quentes (laranja/vermelho) dedicados exclusivamente a alertas de anomalias ou status crítico.

---

## Integração com o Backend

A telemetria atual é totalmente simulada em `FleetService` via `setInterval`. Para conectar ao backend real:

1. **Substituir** o gerador sintético em `fleet.service.ts` por um `subscribe` em `BaseSocketService.messages$` (já implementado na branch `develop` em `src/app/main/core/services/base-socket-service.ts`).
2. **Remover** os métodos `start()`, `stop()` e `tickOnce()` e os buffers de simulação (`baselines`, `live`, `anomalies`).
3. **Autenticação:** substituir as credenciais fixas em `auth.service.ts` por chamada ao endpoint real (ou SSO). O bloco de demo pode ser mantido condicionado a uma flag de ambiente.
4. **Contrato de dados:** alinhar os campos de `LatheData` com o schema do backend Go (`SensorReading`), definindo a origem do `id`, o padrão de nomenclatura (camelCase vs. snake_case) e a estratégia de escalonamento de 1 máquina real para N máquinas no frontend.

Todos os pontos de substituição estão marcados com comentários `// MOCK:` no código-fonte:

```bash
grep -rn "MOCK:" src/
```

---

## Equipe

Projeto integrador SENAI Limeira, turma 2026.

- **Frontend:** Victor Hugo Camargo
- **Backend:** Kayque Costa, João Gonçalez
- **ML / Dados / Design:** Joel Neto
- **Tech Lead / Infra:** João Gonçalez

---

## Licença

Repositório privado. Todos os direitos reservados.
