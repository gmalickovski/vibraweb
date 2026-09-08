# Arquitetura de Agentes e Subagentes

Este documento descreve os subagentes configurados em `.claude/agents/` para o desenvolvimento do Vibraweb, seus modelos e responsabilidades.

## Subagentes

| Agente | Modelo | Responsabilidade |
|--------|--------|-------------------|
| `frontend-ui` | sonnet | Páginas, componentes, layouts, fluxos e estilo em `frontend/src/**`. Segue obrigatoriamente as diretrizes de UI/UX. |
| `backend-neon` | opus | Neon Postgres, RLS, Auth, Data API, Object Storage, Functions e schema. Função de maior risco — decisões de segurança de dados. |
| `numerology-engine` | opus | Lógica de cálculo numerológico (`frontend/src/lib/`) — algoritmo Caldaico, ciclos, arcanos cabalísticos. Erros afetam a corretude do produto entregue ao cliente. |
| `docs-writer` | haiku | Cria/atualiza `.claude/docs/feature-<nome>.md` conforme a regra obrigatória de documentação. Tarefa leve e formulaica. |
| `build-qa` | haiku | Roda `npm run build` no frontend e reporta erros, conforme a regra obrigatória de testes. Tarefa leve, somente leitura + um comando. |

Critério de escolha de modelo: tarefas leves/formulaicas usam **haiku**; tarefas de UI/fluxo de trabalho padrão usam **sonnet**; tarefas de alto risco (segurança de dados, matemática do produto) usam **opus**.

## Diretrizes de UI/UX (fonte de verdade do frontend)

Os 4 documentos abaixo, em `.claude/context/ui-guidelines/`, são a base obrigatória que o agente `frontend-ui` (e qualquer agente que toque em UI) deve consultar antes de criar ou alterar qualquer página, componente ou fluxo:

- `diretrizes-ux-v2.md` — heurísticas de usabilidade (Nielsen/Norman), leis cognitivas (Fitts, Hick, Miller), arquitetura de telas por contexto.
- `diretrizes-ui.md` — design tokens, modo escuro, convenções de nomenclatura (base universal).
- `diretrizes-ui-mobile.md` — áreas de toque, safe areas, navegação mobile (iOS/Android/Flutter).
- `diretrizes-ui-web-v2.md` — breakpoints Tailwind, padrões de código React/TypeScript (principal para este projeto web).

Essas cópias vivem no repositório (versionadas) em vez de depender de arquivos locais fora do projeto, para que qualquer sessão/agente/máquina tenha acesso a elas.

## Como usar

Peça pelo nome do agente (ex: "use o agente frontend-ui para criar a página X") ou deixe o roteamento automático via as descrições em cada `.claude/agents/*.md`, que indicam quando cada um deve ser usado proativamente.
