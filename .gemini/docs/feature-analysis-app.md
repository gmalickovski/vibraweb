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

## NumerologyMap exibido

Campos mostrados no `OutputPanel`:

**Cards (4×2 grid)**: Destino, Expressão, Motivação, Impressão, Missão, Talento Oculto, Psíquico, Ano Pessoal.

**Chips**: Débitos Cármicos, Lições Cármicas.

**Desafios**: Desafio 1, Desafio 2, Desafio Principal.

**Ciclos de Vida**: 3 ciclos com regente e período.

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

Botão "Salvar" no TopBar → `saveAnalysis()` → `analyses` table (RLS: somente usuário autenticado).

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
