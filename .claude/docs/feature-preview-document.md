# Feature: Preview e Geração do Documento Numerológico

**Arquivos principais:**
- `src/pages/PreviewPage.tsx` — renderiza o preview na tela
- `src/lib/document-builder.ts` — converte `NumerologyMap` em blocos estruturados
- `src/lib/print-document.ts` — gera o HTML para impressão/PDF
- `src/components/app/DocumentBlock.tsx` — renderiza cada tipo de bloco

---

## Estrutura de Blocos (document-builder.ts)

O documento é construído como uma árvore de `DocumentBlock[]`. Cada bloco tem um `type` e pode ter `children`.

### Blocos de nível superior (5 grandes seções):

| Bloco | ID | Conteúdo | Nova Página |
|-------|----|----------|-------------|
| 1. Capa e Apresentação | `bloco-1` | Cover, Orientação, Resumo "Os Seus Números" | Não (é o início) |
| 2. A Essência | `bloco-2` | Motivação, Impressão, Expressão, Talento Oculto, Aptidões | Sim (`pageBreakBefore: true`) |
| 3. O Caminho e os Desafios | `bloco-3` | Dia Natalício, Número Psíquico, Destino, Missão, Lições, Débitos, Tendências, Resposta Subconsciente | Sim |
| 4. Ciclos de Tempo | `bloco-4` | Ciclos de Vida, Desafios, Momentos Decisivos, Ano/Mês/Dia Pessoal | Sim |
| 5. Relacionamentos e Cabalística | `bloco-5` | Harmonia Conjugal, Triângulo da Vida | Sim |

### Regras de diagramação:
- **Bloco 1 sub-blocos**: Orientação flui; Resumo tem `pageBreakBefore: true` (nova página)
- **Blocos 2–5**: Todos têm `pageBreakBefore: true` — cada grande seção começa numa nova página
- **Dentro de cada bloco**: itens fluem naturalmente; CSS `break-inside: avoid` evita cortes a meio de um item
- **Páginas automáticas**: Conforme textos são adicionados no Supabase, blocos condicionais aparecem automaticamente (ex.: `licoesCarmicas.length > 0` → bloco de Lições; `desafios` presente → bloco de Desafios)

### Tipos de bloco (`BlockType`):
- `group` — container que agrupa filhos (define o contexto de nova página)
- `cover` — capa do documento
- `orientation` — texto estático de orientação (Supabase: `estatico_orientacao`, `estatico_importante`)
- `summary-list` — tabela "Os Seus Números" com todos os valores calculados
- `section-heading` — título de seção com linha decorativa
- `number-entry` — número grande + título + texto de definição (Supabase) + interpretação
- `list-entry` — lista de números (Lições Cármicas, Débitos, Desafios, Momentos)
- `timeline-entry` — grade de meses pessoais
- `cycles-entry` — 3 ciclos de vida com período
- `conjugal-entry` — tabela de harmonia conjugal
- `triangulo-entry` — Triângulo da Vida com arcanos

---

## Textos do Supabase

### Textos estáticos (repetem em todos os documentos)
Buscados via `fetchInterpretation(1, chave)`:

| Chave | Uso |
|-------|-----|
| `estatico_orientacao` | Texto de orientação inicial (página 2) |
| `estatico_importante` | Texto "Importante" (página 2) |
| `estatico_importante_resumo` | Texto abaixo do resumo de números (página 3) |
| `estatico_def_motivacao` | Definição do que é Motivação |
| `estatico_def_impressao` | Definição do que é Impressão |
| `estatico_def_expressao` | Definição do que é Expressão |
| `estatico_def_talento_oculto` | Definição do que é Talento Oculto |
| `estatico_def_aptidoes` | Definição das Aptidões Profissionais |
| `estatico_def_psiquico` | Definição do Número Psíquico |
| `estatico_def_destino` | Definição do Destino |
| `estatico_def_missao` | Definição da Missão |

### Textos variáveis (por número)
Buscados via `fetchInterpretation(numero, tipo)`:

| Tipo | Exemplo |
|------|---------|
| `pessoal_motivacao` | Interpretação do número de Motivação |
| `pessoal_impressao` | Interpretação do número de Impressão |
| `pessoal_expressao` | Interpretação do número de Expressão |
| `pessoal_talentoOculto` | Interpretação do Talento Oculto |
| `pessoal_aptidoes` | Interpretação das Aptidões |
| `pessoal_psiquico` | Interpretação do Número Psíquico |
| `pessoal_destino` | Interpretação do Destino |
| `pessoal_missao` | Interpretação da Missão |
| `pessoal_ano_pessoal` | Interpretação do Ano Pessoal |
| `pessoal_resposta_subconsciente` | Interpretação da Resposta Subconsciente |

---

## Renderização na Tela (PreviewPage.tsx)

### Abordagem: seções flexíveis
**NÃO** usa páginas A4 de altura fixa para o conteúdo. Usa `.content-section`:
- `min-height: 297mm` — parece uma página A4 mas **cresce com o conteúdo**
- `overflow: visible` — texto nunca é cortado
- `position: relative` — header/footer ficam ancorados absolutamente dentro da seção
- Header: `position: absolute; top: 8mm` — sempre no topo da seção
- Footer: `position: absolute; bottom: 8mm` — sempre no fundo da seção

A **capa** (`.a4-page.doc-cover`) mantém `height: 297mm; overflow: hidden` — é a única com altura fixa.

### Paginação lógica (`splitIntoPages`)
A função `splitIntoPages()` agrupa os blocos filhos em arrays de "página":
- Cada bloco com `pageBreakBefore: true` inicia uma nova entrada no array
- Cada entrada → uma `content-section` na tela

---

## Impressão / PDF (print-document.ts)

Captura o HTML do `.preview-scroll` e injeta num popup de impressão com CSS próprio.

### CSS chave para impressão:
- `@page { size: A4; margin: 0; }` — sem margens automáticas do browser
- `.content-section { page-break-before: always; break-before: page; }` — cada bloco inicia nova página A4
- `.a4-page.doc-cover { height: 297mm; overflow: hidden; page-break-after: always; }` — capa fixa
- `div[style*="grid-template-columns: 72px"] { break-inside: avoid; }` — número-entry não é cortado
- Header/Footer: `position: absolute` relativo à seção — aparecem no início/fim de cada seção

---

## Adicionando Conteúdo Novo (futuro)

Para adicionar uma nova seção ou sub-bloco ao documento:
1. Adicionar o texto no Supabase (tabela `interpretacoes`, tipo `estatico_def_*` ou `pessoal_*`)
2. Adicionar a chave em `INTERP_KEYS` em `PreviewPage.tsx` se for variável por número
3. Adicionar o bloco em `document-builder.ts` (função `buildDocumentBlocks`)
4. O `DocumentBlockRenderer` em `DocumentBlock.tsx` já sabe renderizar os tipos existentes
5. Para novo tipo de bloco: adicionar case em `DocumentBlock.tsx` e tipo em `BlockType`

Blocos condicionais (que só aparecem se o dado existir) são criados automaticamente — ex.: se `map.licoesCarmicas.length > 0`, o bloco de Lições Cármicas é incluído.
