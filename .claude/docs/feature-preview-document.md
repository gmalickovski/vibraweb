# Feature: Preview e Geração do Documento Numerológico

**Arquivos principais:**
- `src/pages/PreviewPage.tsx` — renderiza o preview na tela
- `src/lib/document-builder.ts` — converte `NumerologyMap` em blocos estruturados
- `src/lib/print-document.ts` — gera o HTML para impressão/PDF
- `src/components/app/DocumentBlock.tsx` — renderiza cada tipo de bloco

---

## Estrutura de Blocos (document-builder.ts)

O documento é construído como uma árvore de `DocumentBlock[]`. Cada bloco tem um `type` e pode ter `children`.

### Blocos de nível superior (ordem padrão em `block-order.ts`):

| Bloco | ID externo | ID interno | Conteúdo |
|-------|-----------|------------|----------|
| Capa | `capa` | `bloco-capa` | Cover — sempre 1ª página, não reordenável |
| Orientação | `orientacao` | `bloco-orientacao` | Texto de abertura |
| Importante | `importante` | `bloco-importante` | Como ler o mapa |
| Os Seus Números | `os_seus_numeros` | `bloco-numeros` | Resumo de todos os números |
| Personalidade | `personalidade` | `bloco-personalidade` | Motivação, Impressão, Expressão, Talento Oculto, Psíquico |
| Propósito de Vida | `proposito_vida` | `bloco-proposito-vida` | Dia Natalício, Destino, Missão, Aptidões |
| Aspectos Cármicos | `karma_desafios` | `bloco-karma-desafios` | Lições, Débitos, Tendências Ocultas, Resposta Subconsciente |
| Ciclos de Vida, Desafios e Momentos Decisivos | `ciclos_vida` | `bloco-ciclos-vida` | Intro geral + definições das 3 categorias + 3 ciclos |
| Previsões Temporais | `previsoes_tempo` | `bloco-previsoes-tempo` | Ano Pessoal, Meses Pessoais, Dia Pessoal |
| Relacionamentos | `relacionamentos` | `bloco-relacionamentos` | Harmonia Conjugal |
| Triângulo da Vida e Arcanos | `triangulo` | `bloco-triangulo` | Pirâmide, Arcano Regente/Vigente, todos os Arcanos |
| Conclusão | `conclusao` | `bloco-conclusao` | Fecha o relatório |

> **Nota**: o id externo `karma_desafios` foi mantido por compatibilidade com `block_order` salvo nos perfis, mas o rótulo exibido é **"Aspectos Cármicos"** (Desafios não faz parte deste grupo — aparecem embutidos nos Ciclos de Vida).

### Estrutura interna do bloco de Ciclos (espelha o documento de referência NumWeb):
1. `section-heading` — título + intro geral (`estatico_def_ciclos_intro`)
2. `cycles-intro` — definições gerais de **Ciclos de Vida**, **Desafios** e **Momentos Decisivos** (`estatico_def_ciclo`, `estatico_def_desafio`, `estatico_def_momento_decisivo`), cada uma com subtítulo próprio e nota "Importante" — sempre ANTES da sequência cronológica
3. `cycles-entry` ×3 — os ciclos em ordem, todos com a mesma estrutura interna (Regente do Ciclo → Desafio → Momento(s) Decisivo(s))

O heading e o `cycles-intro` são fixos no topo da seção — `applyBlockOrder` só reordena/oculta os filhos `ciclo_1/2/3`.

### Regras de diagramação:
- **Cada grupo de nível superior** tem `pageBreakBefore: true` — começa numa nova página
- **Dentro de cada bloco**: itens fluem naturalmente; CSS `break-inside: avoid` evita cortes a meio de um item
- **Páginas automáticas**: Conforme textos são adicionados no Supabase, blocos condicionais aparecem automaticamente (ex.: `licoesCarmicas.length > 0` → bloco de Lições)

### Tipos de bloco (`BlockType`):
- `group` — container que agrupa filhos (define o contexto de nova página)
- `cover` — capa do documento
- `orientation` / `importante` / `conclusion` — textos estáticos
- `summary-list` — tabela "Os Seus Números" com todos os valores calculados
- `section-heading` — título de seção com linha decorativa + intro opcional
- `number-entry` — número grande + título + texto de definição (Supabase) + interpretação
- `multi-number-entry` / `list-entry` — listas de números (Lições Cármicas, Débitos, Tendências)
- `timeline-entry` — grade de meses pessoais (título usa o mesmo estilo h2 dos demais blocos: 15px, uppercase, weight 800)
- `cycles-intro` — definições gerais de Ciclos/Desafios/Momentos Decisivos, antes dos ciclos
- `cycles-entry` — 1 ciclo de vida com período + desafio + momento(s) decisivo(s) embutidos
- `dia-pessoal-entry` — dia pessoal de hoje + guia de referência (1-9/11/22)
- `conjugal-entry` — tabela de harmonia conjugal
- `triangulo-piramide` / `triangulo-arcano-regente` / `triangulo-arcano-vigente` / `triangulo-arcanos-lista` — Triângulo da Vida e arcanos

---

## Formatação de texto (editor = fonte da verdade)

Todo texto vindo do Supabase é renderizado por `Markdown.tsx` (`MarkdownParagraphs`), que suporta:
- Parágrafos (linha em branco separa) e quebra de linha simples
- `**negrito**`, `*itálico*`, `__sublinhado__` — **aninháveis** entre si (`parseInlineAst`, parser recursivo; ex.: `**_texto_**` vira negrito+itálico)
- Alinhamento por marcador no início do parágrafo (`[centro]`, `[direita]`, `[esquerda]`, `[justificado]`)
- **Subtítulo H4**: parágrafo iniciado por `#### ` vira `<h4>` — único nível permitido, para não competir com os títulos h2/h3 do template. Espaçamento generoso antes/depois (`margin: 20px 0 10px`, 2026-07-18) para separar visualmente do texto ao redor, igual Word/Google Docs
- **Listas** (2026-07-18): bloco onde TODA linha começa com `- ` vira `<ul>`, ou TODA linha começa com `N. ` (qualquer número — sempre renumera 1,2,3… na renderização) vira `<ol>` — bloco misto (só algumas linhas com marcador) fica como parágrafo normal, mesma regra do Word. Recuo lateral + respiro vertical padrão de lista (`margin: 10px 0; padding-left: 20px`, cada item `margin-bottom: 4px`) — a marcação herda `style` (cor/fonte) de quem chama `MarkdownParagraphs`, então sai automaticamente na cor/fonte do template escolhido

**Regra (2026-07-16)**: o template NÃO impõe mais `font-style: italic` em nenhum texto do banco (introduções, definições, bloqueios, "Desafio" dos arcanos). A formatação vem exclusivamente dos marcadores markdown escritos no editor — se o consultor não usar itálico no texto, o documento sai sem itálico.

### `MarkdownEditor.tsx` — editor WYSIWYG (2026-07-17)

A caixa de texto é um `<div contentEditable>` (não mais `<textarea>`): o consultor NUNCA vê os marcadores brutos — negrito aparece em negrito, não `**negrito**`. Por baixo continua guardando/entregando markdown puro via `value`/`onChange` (mesmo formato que `Markdown.tsx` lê no preview e no PDF), então o resultado no editor é garantidamente idêntico ao documento gerado (o preview e o PDF reaproveitam a mesma árvore de parsing).

- **Digitar markdown ao vivo**: fechar um marcador (`**x**`, `*x*`, `_x_`, `__x__`) e digitar mais UM caractere depois (espaço, pontuação, letra) converte na hora pro elemento formatado — mesmo padrão de Notion/Slack. O caractere extra existe de propósito: sem ele, `*itálico*` disparava antes do usuário completar `**negrito**` com o segundo asterisco (mesmo problema entre `_itálico_` e `__sublinhado__`) — ver comentário de `tryAutoFormat`.
- **Colar texto** com marcadores markdown (ex.: copiado de outro lugar) converte a formatação inline na hora (`onPaste`).
- **Barra de formatação**: negrito, itálico, sublinhado, título (único nível — fonte levemente maior via `em`, tamanho não regulável), lista com marcadores, lista numerada e alinhamento (esquerda/centro/direita/justificado).
  - **Listas** (2026-07-18, `toggleList`): botões usam `document.execCommand('insertUnorderedList'|'insertOrderedList')` — igual bold/italic, sem lógica própria de DOM. CSS de espaçamento (`ensureListCss`, mesmo padrão de injeção de `<style>` usado em `TabBar.tsx`) aplicado uma vez via classe `vw-md-editable` no container, cobrindo tanto listas geradas pelo editor quanto as que o `execCommand` cria direto no DOM. Estado ativo do botão via `document.queryCommandState('insertUnorderedList'|'insertOrderedList')`.
  - **Bug do Chrome com listas** (2026-07-18): `execCommand('insertOrderedList'/'insertUnorderedList')` numa seleção que cobre vários `<p>` (cada um com `style` inline) às vezes aninha o `<ul>/<ol>` resultante DENTRO de um dos `<p>` originais, em vez de substituí-los — `htmlToMarkdown` detecta esse caso (`findWrappedList`: bloco cujo único filho relevante é uma lista, sem texto sobrando fora dela) e serializa a lista normalmente, ignorando o wrapper. Sem esse tratamento a lista seria salva como texto simples com os marcadores literais.
  - **Título e negrito são independentes** (2026-07-18): criar um título aplica negrito ao bloco inteiro por padrão (pré-definido — "título" já nasce em negrito), mas é um `<b>` real dentro do conteúdo, não uma imposição do CSS do bloco — o consultor pode clicar em Negrito de novo pra desligar só essa propriedade, mantendo a fonte maior (o único traço realmente fixo da ferramenta). Ver `toggleHeading` — ao criar o título, seleciona o bloco inteiro e aplica `execCommand('bold')` se ainda não estiver totalmente em negrito. `blockStyleAttr`/`Markdown.tsx` neutralizam explicitamente o negrito nativo do `<h4>` (`font-weight:400`) pra o negrito vir só do marcador de verdade.
  - **Indicadores de estado ativo** (2026-07-18, `activeFormats`/`updateActiveFormats`): os botões Negrito/Itálico/Sublinhado/Título/Alinhamento acendem (fundo e ícone dourados) quando a propriedade correspondente já está presente na seleção atual — ou no que vai ser digitado a seguir, com o cursor colapsado. Usa `document.queryCommandState('bold'|'italic'|'underline')`, a API nativa feita exatamente pra isso (mesmo mecanismo por trás do Word/Google Docs/Notion); título e alinhamento são checados inspecionando o bloco atual (`getBlockElement`), que não têm um `queryCommandState` equivalente.
  - **Desktop** (2026-07-18, substituiu a barra flutuante sobre a seleção): barra **fixa no header da caixa de texto** — sempre visível, colada no topo da caixa como um cabeçalho (mesmo modelo de Word/Google Docs). Emenda visual: cantos de baixo da barra retos + sem borda inferior própria; a caixa de texto abaixo perde os cantos de cima (`borderTopLeftRadius/RightRadius: 0`). Sem lógica de posicionamento/flip — os indicadores de estado ativo continuam via `selectionchange` + `queryCommandState`.
  - **Formatar antes de escrever** (2026-07-18): atalhos `Ctrl/Cmd+B/I/U` (`handleKeyDown`) funcionam com o cursor colapsado (nada selecionado) — comportamento nativo do `execCommand` em contentEditable: liga um "estado de digitação" e os próximos caracteres já saem formatados, até apertar de novo pra desligar. Mesmo padrão do Word/Google Docs/Notion; não precisa de lógica própria, só expor o atalho (o navegador não faz esse bind sozinho numa `<div contentEditable>` comum).
  - **Mobile**: barra fixa colada no rodapé da TELA (`position:fixed; bottom:0`, também via portal), não mais acima da caixa de texto — ocupa a mesma faixa onde a navegação inferior do app fica (que some atrás do modal em tela cheia enquanto edita). Rola na horizontal (`overflowX:auto; flexWrap:nowrap`) se os botões não couberem na largura da tela. Monta/desmonta junto do próprio `MarkdownEditor` (que só existe enquanto a tela/modal de edição está aberta).
- Implementado com `document.execCommand` (bold/italic/underline/formatBlock/justify*/insertText) — API depreciada na spec mas plenamente suportada em todos os Chromium atuais; escolhida porque já resolve toda a complexidade de Range/Selection (dividir/unir nós ao (des)aplicar formatação parcial, estado de digitação pendente) sem reimplementar à mão.
- `markdownToHtml`/`htmlToMarkdown` (dentro do próprio arquivo) fazem a ponte HTML ↔ markdown, reaproveitando os parsers de `Markdown.tsx` (`parseInlineAst`, `parseMarkdownBlocks`, `ALIGN_TOKEN_BY_VALUE`) — uma única fonte de verdade do formato em ambas as direções.
- **Modo foco do editor** (2026-07-18, `focusMode` em CustomTexts.tsx, desktop): botão sutil no canto direito do header do painel de edição, ícone dinâmico Expandir/Recolher (`ExpandIcon`/`CollapseIcon` — cantos abrindo/fechando, mesmo par de players de vídeo/VS Code). Ao ativar, o painel esquerdo (grade/listas) colapsa a 0 de largura com fade sutil (transição em `flex` + `opacity`; o fade de 0.2s termina antes do colapso de 0.3s pra esconder o reflow do conteúdo) e o editor passa a ocupar a largura inteira — sidebar e header principal do app continuam visíveis. Clicar de novo desfaz com a animação inversa. O painel esquerdo continua MONTADO (só colapsado), então aba ativa, seleção e scroll são preservados ao voltar.

O "Desafio" dos arcanos (regente, vigente e lista) é um parágrafo simples com prefixo em negrito — não usa mais card destacado.

## Textos do Supabase

### Bloqueios do Triângulo (sequências 111–999)
Textos de cada sequência de bloqueio vivem no banco: tipo `pessoal_bloqueio`, numero = a própria sequência (111, 222, … 999) — migration 032 (o check de `numero` foi ampliado para 0–999). Editáveis em **Textos → Débitos, Dias e Bloqueios**. O `BLOQUEIOS_MAP` de `numerology.ts` permanece só como fallback quando o texto não existe no banco.

### Textos de ausência (migration 033)
Quando o mapa não tem Débitos Cármicos ou não tem Bloqueios no Triângulo, o documento NÃO omite a seção — mostra o texto de ausência correspondente:
- `estatico_sem_debitos` (numero=1) — renderizado pelo `multi-number-entry` de Débitos quando `items` está vazio
- `estatico_sem_bloqueios` (numero=1) — renderizado pelo `triangulo-piramide` quando não há bloqueios detectados

Editáveis em **Textos → Débitos, Dias e Bloqueios** (lista abaixo da grade).

### Instruções de cálculo (migration 033, aba "Instruções")
Textos que ensinam o cliente a calcular sozinho — mapeados do documento de referência NumWeb ("Para calcular o Ano Pessoal…", "…o Mês Pessoal", "…o Dia Pessoal"):
- `estatico_instrucao_ano_pessoal` → `number-entry` do Ano Pessoal
- `estatico_instrucao_mes_pessoal` → `timeline-entry` dos Meses Pessoais
- `estatico_instrucao_dia_pessoal` → `dia-pessoal-entry` (substitui a frase fixa do "Guia de Dias Pessoais"; a frase antiga fica de fallback)

Renderizados pelo componente `InstructionCallout` (DocumentBlock.tsx): caixa com borda tracejada na cor de destaque + selo com ícone de calculadora "Instrução — calcule você mesmo" — design distinto das introduções de categoria, sinalizando visualmente que é um passo a passo.

### Dias Favoráveis (migrations 033/034)
Um texto por dia do mês: tipo `pessoal_dia_favoravel`, numero = o próprio dia (1–31), segundo a vibração cabalística do dia reduzido (10→1, 12→3, …; 11/22/29 preservam os mestres 11/22/11). O cálculo de quais dias são favoráveis (`calcDiasFavoraveis`, numerology.ts, tabela DIAS_BASICOS por dia+mês de nascimento) confere com o documento de referência (ex.: nascimento 6/10 → 3, 6, 12, 15, 21, 24, 30). Na aba de Textos o título do editor é "Dia N".

**Sub-bloco no documento** (`dias-favoraveis-entry`, id interno `dias-favoraveis`, id externo `dias_favoraveis`): último filho do grupo **Previsões Temporais** — mesma ordem do documento de referência (Ano → Mês → Dia Pessoal → Dias Favoráveis), reordenável/ocultável em Blocos. Renderiza: definição (`estatico_def_dias_favoraveis`) → instrução (`estatico_instrucao_dias_favoraveis` — os dias são FIXOS, calculados do dia+mês de nascimento, e repetem-se em TODOS os meses do ano) → chips "Dia N" → texto da vibração de cada dia favorável da pessoa. Só aparece se `map.diasFavoraveis` não for vazio.

### Introduções de grupo (migrations 028/031/035/036)
Todo grupo de nível superior abre com uma introdução curta (2–3 linhas) logo abaixo do título, via `introTexto` do `section-heading` — editável em Textos → Introduções de Categoria:
`estatico_def_personalidade_intro` · `estatico_def_proposito_vida_intro` · `estatico_def_aspectos_carmicos_intro` · `estatico_def_ciclos_intro` · `estatico_def_previsoes_intro` · `estatico_def_relacionamentos_intro` · `estatico_def_triangulo_intro`

**Regra de linguagem**: textos voltados ao cliente NUNCA usam jargão interno como "bloco" ("Este bloco reúne…") — falar em "parte do mapa", "a seguir", etc. (migration 035 corrigiu o único caso).

### Fora de escopo
As seções "Apelido" e "Assinatura" do PDF de referência NÃO entram no Vibraweb — harmonização de nome é responsabilidade do projeto Nome Magnético. O Vibraweb é exclusivamente o mapa numerológico cabalístico completo (uso direto ou revenda white-label).

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

### Numeração de páginas (ABNT NBR 14724, 2026-07-18)
Seguindo a norma ABNT para documentos com capa e sumário:
- **Capa**: NÃO é contada NEM numerada
- **Índice** (futuro): será contado mas NÃO numerado
- **Conteúdo** (da 1ª seção em diante): numerado em arábicos (1, 2, 3…)
- O número aparece no **canto inferior direito** do rodapé, como campo fixo separado dos dados dinâmicos do consultor

`PageFooter` (DocumentChrome.tsx) aceita `pageNumber?: number | null`:
- `pageNumber={null}` → sem número (capa, futuro índice)
- `pageNumber={N}` → exibe "Página N" à direita, separado por bordinha

`DocumentPreviewStack.tsx` calcula: `pageNumber={pageIdx + 1}` para cada content-section.

### Paginação lógica (`splitIntoPages`)
A função `splitIntoPages()` agrupa os blocos filhos em arrays de "página":
- Cada bloco com `pageBreakBefore: true` inicia uma nova entrada no array
- Cada entrada → uma `content-section` na tela

---

## Impressão / PDF (print-document.ts)

Captura o HTML do `.preview-scroll`, **remove os headers/footers por seção** (que são `position: absolute` e não se repetem ao imprimir), e injeta num popup de impressão com:

### Abordagem: position:fixed + @page margins (2026-07-18)
O sistema anterior usava headers/footers em `position: absolute` dentro de cada `.content-section` — quando o browser dividia uma seção longa em múltiplas páginas A4, header e footer só apareciam na primeira "fatia". A nova abordagem:

1. **`position: fixed` header/footer** a nível do `<body>` — no CSS Paged Media, `position: fixed` se repete automaticamente em TODA página impressa (comportamento padronizado em Chromium)
2. **`@page` com margens reais** que reservam espaço físico para os elementos fixos:
   - `@page { size: A4; margin: 28mm 12mm 22mm 12mm; }`
   - `@page :first { margin: 0; }` — capa sem margem/header/footer
3. **CSS `counter(page)`** para numeração automática no footer fixo
4. **Conteúdo "desembrulhado"**: `.content-section` perde padding e min-height (o `@page` margins cuida do espaçamento); `break-before: page` é preservado para novas páginas por seção
5. **`break-inside: avoid`** nos number-entry (grid 72px) e sub-blocos para evitar cortes

### CSS chave para impressão:
- `@page { size: A4; margin: 28mm 12mm 22mm 12mm; }` — margens reais reservam espaço para header/footer fixos
- `@page :first { margin: 0; }` — capa ocupa A4 inteiro, sem header/footer
- `.print-header { position: fixed; top: 0; }` — header repetido em toda página
- `.print-footer { position: fixed; bottom: 0; }` — footer repetido em toda página
- `.print-page-number .page-num::after { content: counter(page); }` — numeração automática
- `.content-section { page-break-before: always; padding: 0; }` — nova página por seção, sem padding próprio
- `div[style*="grid-template-columns: 72px"] { break-inside: avoid; }` — number-entry não é cortado

---

## Adicionando Conteúdo Novo (futuro)

Para adicionar uma nova seção ou sub-bloco ao documento:
1. Adicionar o texto no Supabase (tabela `interpretacoes`, tipo `estatico_def_*` ou `pessoal_*`)
2. Adicionar a chave em `INTERP_KEYS` em `PreviewPage.tsx` se for variável por número
3. Adicionar o bloco em `document-builder.ts` (função `buildDocumentBlocks`)
4. O `DocumentBlockRenderer` em `DocumentBlock.tsx` já sabe renderizar os tipos existentes
5. Para novo tipo de bloco: adicionar case em `DocumentBlock.tsx` e tipo em `BlockType`

Blocos condicionais (que só aparecem se o dado existir) são criados automaticamente — ex.: se `map.licoesCarmicas.length > 0`, o bloco de Lições Cármicas é incluído.
