# SaaS Workspace App

**Pages**: `src/pages/AppPage.tsx`, `src/pages/LoginPage.tsx`  
**Components**: `src/components/app/`

## Screens

1. **Login** (`LoginPage`) — Supabase email+password auth. Left: brand panel. Right: form.
2. **Workspace** (`AppPage`) — split-screen: Sidebar + TopBar + InputPanel + OutputPanel.
3. **Análises Salvas** (`SavedAnalyses`) — lista de análises do usuário com Abrir/Excluir.

## Analysis Tabs

| Tab | Inputs | Calc function |
|-----|--------|---------------|
| `pessoal` | Nome, DOB, Nome Social | `calcPessoal` |
| `bebe` | Nome Bebê, Sobrenome, DOB + 2 variações | `calcBebe` |
| `empresa` | Razão Social, Fantasia, Fundação, Sócio | `calcEmpresa` |
| `previsoes` | Nome, DOB, Ano de Referência | `calcPrevisoes` |

## NumerologyMap exibido — Layout do OutputPanel

### A Essência (Traços de Personalidade)
5 cards flex (min 90px, max 200px, `justifyContent: center` → órfãos centralizados):
Motivação · Impressão · Expressão · Talento Oculto · Aptidões Profissionais

### O Caminho e os Desafios
- **Linha 1** (2 cards, grid 1fr 1fr): Destino · Missão
- **Linha 2** (3 cards, grid 1fr 1fr 1fr): Dia Natalício · Número Psíquico · Resposta Subconsciente
- **Linha 3** (condicional): Lições Cármicas · Débitos Cármicos · Tendências Ocultas

### Ciclos de Tempo (Previsões) — seção condicional
Ciclos de Vida · Desafios · Momentos Decisivos · Ano Pessoal / Mês / Dia · Meses Pessoais

### Relacionamentos e Cabalística — seção condicional
Harmonia Conjugal · Triângulo da Vida · **Dias e Números Harmônicos** (subtítulo próprio)

## Baby Comparison

Quando `bebeNome2` ou `bebeNome3` estão preenchidos, `BabyComparison` exibe 3 cards lado a lado com Destino + Expressão + Motivação de cada opção.

## Fluxo de dados

```
InputPanel → AnalysisData (estado em AppPage)
                 ↓
OutputPanel → useMemo(calc...) → NumberCards + BabyComparison + ReportPreview
                                                                      ↓
                                                       fetchInterpretation() → Supabase
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
- Service role key reservada para Edge Functions (PDF/DOCX/pagamentos).
