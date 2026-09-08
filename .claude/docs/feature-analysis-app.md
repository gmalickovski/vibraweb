# SaaS Workspace App

**Pages**: `src/pages/AppPage.tsx`, `src/pages/LoginPage.tsx`  
**Components**: `src/components/app/`

## Screens

1. **Login** (`LoginPage`) — Neon Auth com email/senha. Left: brand panel. Right: form.
2. **Workspace** (`AppPage`) — split-screen: Sidebar + TopBar + InputPanel + OutputPanel.
3. **Análises Salvas** (`SavedAnalyses`) — lista de análises do usuário com Abrir/Excluir.

## Analysis Tabs

| Tab | Inputs | Calc function |
|-----|--------|---------------|
| `pessoal` | Nome, DOB, Nome Social | `calcPessoal` |
| `bebe` | Nome Bebê, Sobrenome, DOB + 2 variações | `calcBebe` |
| `empresa` | Razão Social, Fantasia, Fundação, Sócio | `calcEmpresa` |
| `previsoes` | Nome, DOB, Ano de Referência | `calcPrevisoes` |

## NumerologyMap exibido — Layout do OutputPanel (2026-07-18)

As seções seguem **exatamente os 7 grupos de nível superior de "Blocos"**
(`block-order.ts` / `BLOCK_DEFS`) — mesma organização e nomes que o consultor
vê em `/app/blocos` e no documento gerado. Cabeçalho de seção: marcador em
gradiente + rótulo uppercase + linha fina (componente `Section`).

1. **Personalidade** — 5 NumberCards flex (min 90/max 200, órfãos centralizados): Motivação · Impressão · Expressão · Talento Oculto · Número Psíquico
2. **Propósito de Vida** — grid 4: Dia Natalício · Destino · Missão · Aptidões Profissionais (valor = número de Expressão)
3. **Aspectos Cármicos** — flex-wrap condicional: Lições Cármicas · Débitos Cármicos · Tendências Ocultas (GroupCards com CircleNumbers) · Resposta Subconsciente (NumberCard)
4. **Ciclos de Vida, Desafios e Momentos Decisivos** — 3 sub-linhas de `MiniTile` (número + rótulo + período): Ciclos ×3 · Desafios ×3 · Momentos ×4
5. **Previsões Temporais** — Ano Pessoal + Dia Pessoal (NumberCards empilhados) ao lado da grade de Meses Pessoais; abaixo, Dias Favoráveis (GroupCard — mudou de "Relacionamentos e Cabalística" pra cá, seguindo a posição real no documento)
6. **Relacionamentos** — Harmonia Conjugal (4 GroupCards: Vibra/Atrai/Oposto/Passivo) + Números Harmônicos
7. **Triângulo da Vida e Arcanos** — Arcano Regente · Sequência de Arcanos · Arcano Atual

### Modal de edição de texto por análise (2026-07-18)

Clicar em qualquer número **abre uma janela modal flutuante** por cima da
grade (não troca mais a tela nem abre painel lateral):
- Header: chip do número (cor do accent do card) + título da interpretação + sub "Ajuste vale só para esta análise" + badge "Texto Personalizado Ativo" (quando há override) + botão ✕.
- Corpo: o **mesmo `MarkdownEditor` compartilhado** do editor global (Personalizar Textos) — mesma barra de formatação fixa no topo da caixa, mesmos recursos (negrito/itálico/sublinhado/título/listas/alinhamento).
- Rodapé dinâmico idêntico ao de CustomTexts: Restaurar Padrão (só com override salvo) · Limpar/Salvar (só com edição pendente).
- **Salvar grava apenas no `text_overrides` DESTA análise** (`onTextOverrideChange` → `analyses.text_overrides`) — nunca toca o texto padrão global (`user_interpretations`), verificado por SQL.
- Backdrop: clique fora fecha SÓ sem edição pendente (com rascunho não salvo, força escolha explícita). Mobile: modal em tela cheia; a barra de formatação mobile (fixa no rodapé da tela, zIndex 400) fica por cima do modal (zIndex 300).

### Restauração em camadas + histórico de versões (2026-07-19)

Cascata do texto efetivo de um campo: **override da análise → [sistema
forçado] → texto global do consultor → padrão do sistema** (resolvida em um
único lugar: `resolveInterpretation`, lib/neon.ts — usada pelo modal e
pelo preview/PDF). Modelo combina camadas do VS Code/CSS com revisões do
WordPress/Notion:

- **Cada Salvar empilha a versão anterior** no histórico do campo (dentro do
  próprio JSONB `text_overrides`, cap `TEXT_OVERRIDE_VERSION_CAP = 10`),
  com data/hora. Único escritor: `handleTextOverrideChange` (AppPage.tsx),
  modos `'save' | 'global' | 'sistema'`.
- **Menu "Restaurar"** (substitui o botão único): lista as *Versões
  anteriores* (data + prévia; clique restaura — a atual vai pro histórico,
  restauração 100% não-destrutiva, por isso sem diálogo de confirmação) +
  dois destinos de cascata: *Usar meu texto global* e *Usar padrão do
  sistema* (grava o marcador `sistema: true` — o "revert" do CSS: pula a
  camada global só nesta análise; badge "Padrão do Sistema (fixado)" no
  header). Destino em que o campo já está aparece desabilitado com tag
  "atual".
- **Shape do valor** em `text_overrides[numero][tipo]`: string (legado) ou
  `{ texto, data, sistema?, versoes?: [{texto, data}] }` — NUNCA usar
  truthiness no entry cru (objeto é sempre truthy); ler via helpers
  `overrideTexto/overrideSistema/overrideVersoes` (lib/neon.ts).

## Baby Comparison

Quando `bebeNome2` ou `bebeNome3` estão preenchidos, `BabyComparison` exibe 3 cards lado a lado com Destino + Expressão + Motivação de cada opção.

## Fluxo de dados

```
InputPanel → AnalysisData (estado em AppPage)
                 ↓
OutputPanel → useMemo(calc...) → NumberCards + BabyComparison + ReportPreview
                                                                      ↓
                                                       fetchInterpretation() → Neon Data API
```

## Salvar análise

Botão "Salvar" no OutputPanel (`/app/novo`) → `saveAnalysis()` → `analyses` table → abre `SaveSuccessModal` com duas ações:
- **"Editar Mapa Salvo"**: navega para `/app/salvos` com o mapa recém-salvo já carregado no painel.
- **"Iniciar Nova Análise"**: limpa o formulário e fecha o modal.

O botão "Prévia do Documento" **não aparece** em `/app/novo`. Aparece apenas em `/app/salvos` quando um mapa está carregado (`savedMode=true`).

## Estado vazio do OutputPanel

Quando não há nome nem data de nascimento preenchidos (`!hasData`), o OutputPanel exibe apenas um placeholder orientando o usuário. Seções e cards são ocultados para não poluir a tela.

## Perfil do consultor

`fetchUserProfile()` no mount do `AppPage` → `consultant_name` e `consultant_contact` passados para `TopBar` e `ReportPreview`.

## Report Preview

Textos interpretativos buscados do banco (`interpretacoes`) via `fetchInterpretation(numero, tipo)` para:
- Destino (título + texto completo)
- Expressão, Motivação, Impressão (título curto via tooltip)

## Segurança

- Nenhuma credential admin no frontend.
- Toda escrita/leitura de dados do usuário passa por RLS.
- Credenciais privadas reservadas para Neon Functions (PDF/DOCX/pagamentos/uploads).
