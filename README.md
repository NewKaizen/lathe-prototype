# Lathe Digital Twin — Frontend

Interface web do **Gemeo Digital do Torno Convencional**, projeto integrador desenvolvido no SENAI Limeira. O sistema monitora em tempo real a telemetria de tornos industriais (RPM, temperatura, vibracao, ruido e eficiencia), exibe um gemeo 3D interativo e centraliza o agendamento de manutencoes preventivas.

> **Estado atual:** prototipo visual funcional com telemetria simulada. A conexao WebSocket/MQTT com o backend real esta pronta para ser plugada — veja a secao [Integracao com o Backend](#integracao-com-o-backend).

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework | Angular 22 (Standalone Components, Signals) |
| Renderizacao 3D | Babylon.js 9 |
| Estilizacao | Tailwind CSS 4 |
| Testes | Vitest |
| Linting/Formatacao | ESLint + Prettier |
| CI de commits | Husky + lint-staged |
| Container | Docker (multi-stage) + Nginx |

---

## Funcionalidades

**Visao de frota**
- Painel geral com cards de todas as maquinas, agrupamentos por linha de producao e visualizacao em lista, grade e planta
- Aba de alertas com historico de anomalias detectadas
- Aba de manutencoes com calendario de proximas intervencoes
- Aba de energia com estimativa de consumo e custo por maquina
- Aba de relatorios com exportacao de CSV compativel com Excel

**Painel individual da maquina**
- Dashboard com gauges de RPM, temperatura, vibracao, ruido e eficiencia
- Graficos historicos com sparklines e linhas de tendencia
- Gemeo digital 3D interativo (Babylon.js) e placeholder para feed de camera
- Agendamento e acompanhamento de manutencoes preventivas

**Geral**
- Sistema de notificacoes com feed de alertas e badge de nao lidas
- Configuracoes de usuario (tema, unidades, preferencias de notificacao)
- Busca por comando (atalho de teclado)
- Autenticacao local com suporte a modo demo
- Rotas com guards, sincronizacao de estado via URL (suporte a refresh e historico do navegador)

---

## Primeiros passos

### Pre-requisitos

- Node.js >= 22
- npm >= 11

### Instalacao e execucao local

```bash
# Instale as dependencias
npm install

# Inicie o servidor de desenvolvimento
npm start
```

Acesse `http://localhost:4200`.

**Credenciais de demonstracao:** `admin` / `admin123`

### Execucao via Docker

```bash
docker build -t lathe-digital-twin .
docker run -p 8080:80 lathe-digital-twin
```

Acesse `http://localhost:8080`.

---

## Scripts disponiveis

| Comando | Descricao |
|---|---|
| `npm start` | Servidor de desenvolvimento com hot-reload |
| `npm run build` | Build de producao (saida em `dist/`) |
| `npm test` | Executa os testes unitarios com Vitest |
| `npm run lint` | Analise estatica com ESLint |
| `npm run watch` | Build em modo watch para desenvolvimento |

---

## Estrutura do projeto

```
src/
  app/
    components/       # Componentes de pagina e features
      digital-twin/       # Gemeo 3D (Babylon.js) e placeholder de camera
      fleet-selector/     # Visao de frota com todas as abas
      lathe-dashboard/    # Dashboard de telemetria da maquina
      lathe-charts/       # Graficos historicos
      login-screen/       # Autenticacao
      machine-sidebar/    # Sidebar da maquina com navegacao entre views
      maintenance-scheduler/  # Modal de agendamento de manutencao
      notifications-panel/    # Painel de notificacoes e bell
      user-settings-modal/    # Configuracoes do usuario
    core/
      data/           # Dados mock da frota e historico de manutencoes
      guards/         # Guards de rota (auth)
      lib/            # Utilitarios: status, sparkline, energia, formatacao
      models/         # Interfaces TypeScript (LatheData, etc.)
      services/       # AuthService, FleetService, ToastService, SettingsService
    shared/           # Componentes reutilizaveis (Icon, Toast, ConfirmButton, etc.)
```

---

## Integracao com o Backend

A telemetria atual e totalmente simulada em `FleetService` via `setInterval`. Para conectar ao backend real:

1. **Substituir** o gerador sintetico em `fleet.service.ts` por um `subscribe` em `BaseSocketService.messages$` (ja implementado na branch `develop` em `src/app/main/core/services/base-socket-service.ts`).
2. **Remover** os metodos `start()`, `stop()` e `tickOnce()` e os buffers de simulacao (`baselines`, `live`, `anomalies`).
3. **Autenticacao:** substituir as credenciais fixas em `auth.service.ts` por chamada ao endpoint real (ou SSO). O bloco de demo pode ser mantido condicionado a uma flag de ambiente.
4. **Contrato de dados:** alinhar os campos de `LatheData` com o schema do backend Go (`SensorReading`), definindo a origem do `id`, o padrao de nomenclatura (camelCase vs. snake_case) e a estrategia de escalonamento de 1 maquina real para N maquinas no frontend.

Todos os pontos de substituicao estao marcados com comentarios `// MOCK:` no codigo-fonte:

```bash
grep -rn "MOCK:" src/
```

---

## Time

Projeto integrador SENAI Limeira — turma 2026.

---

## Licenca

Repositorio privado. Todos os direitos reservados.
