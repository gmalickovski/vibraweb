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
- **Páginas automáticas**: Conforme textos são adicionados no Neon Postgres, blocos condicionais aparecem automaticamente (ex.: `licoesCarmicas.length > 0` → bloco de Lições)

### Tipos de bloco (`BlockType`):
- `group` — container que agrupa filhos (define o contexto de nova página)
- `cover` — capa do documento
- `orientation` / `importante` / `conclusion` — textos estáticos
- `summary-list` — tabela "Os Seus Números" com todos os valores calculados
- `section-heading` — título de seção com linha decorativa + intro opcional
- `number-entry` — número grande + título + texto de definição do banco + interpretação
- `multi-number-entry` / `list-entry` — listas de números (Lições Cármicas, Débitos, Tendências)
- `timeline-entry` — grade de meses pessoais (título usa o mesmo estilo h2 dos demais blocos: 15px, uppercase, weight 800)
- `cycles-intro` — definições gerais de Ciclos/Desafios/Momentos Decisivos, antes dos ciclos
- `cycles-entry` — 1 ciclo de vida com período + desafio + momento(s) decisivo(s) embutidos
- `dia-pessoal-entry` — dia pessoal de hoje + guia de referência (1-9/11/22)
- `conjugal-entry` — tabela de harmonia conjugal
- `triangulo-piramide` / `triangulo-arcano-regente` / `triangulo-arcano-vigente` / `triangulo-arcanos-lista` — Triângulo da Vida e arcanos

---

## Formatação de texto (editor = fonte da verdade)

Todo texto vindo do Neon Postgres é renderizado por `Markdown.tsx` (`MarkdownParagraphs`), que suporta:
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

### Hierarquia de 5 Níveis de Título e Tamanhos Padrão (2026-07-30)
Padronização dos tamanhos de fonte de referência por nível de título no motor de renderização do documento:
1. **H1 (Título Principal do Bloco/Capa)**: `20pt` — tag `<h1>` com `theme.h1FontSize` (`20pt` padrão). `margin: '28px 0 16px'` (0 no topo de páginas novas).
2. **H2 (Título de Subbloco / Seção)**: `18pt` — tag `<h2>` com `theme.h2FontSize` (`18pt` padrão). `margin: '28px 0 10px'`.
3. **H3 (Subtítulo no Subbloco)**: `16pt` — tag `<h3>` com `theme.h3FontSize` (`16pt` padrão). `margin: '20px 0 8px'`.
4. **H4 (Subtítulo Nível 4)**: `14pt` — tag `<h4>` com `theme.h4FontSize` (`14pt` padrão). `margin: '16px 0 6px'`.
5. **Nível 5 / H5 (Texto Destaque / Inline Entry)**: Mesmo tamanho de fonte e família dos parágrafos (`theme.bodyFontSize` `11pt` padrão e `theme.bodyFont`), utilizando a **Cor Secundária Global (`theme.secondaryColor`)** para o prefixo em negrito embutido na primeira linha.

> **Regra de Espaçamento Typographic UI/UX (Princípio da Proximidade da Gestalt)**:
> Todo título possui espaçamento superior (`marginTop`) significativamente maior do que o espaçamento inferior (`marginBottom`). Isso garante separação clara em relação aos parágrafos/conteúdos da seção anterior e agrupamento visual coeso com o texto que ele introduz.

**Sistema de 4 Cores Globais + 2 Fontes Globais**:
- **Cor Principal (`primaryColor`)**: Afeta H1, H2, H3, H4, barra de divisórias, círculos dos arcanos atuais, o **Logo Texto da Capa** e o **Nome do Cliente na Capa**.
- **Cor Secundária (`secondaryColor`)**: Afeta fundos translúcidos de introduções (`blockquote`), citações, círculos de arcanos passados na Linha do Tempo, os títulos/prefixos de destaque H5 (Inline Entry) e o **Título do Produto na Capa (ex: Mapa Numerológico Pessoal)**.
- **Cor de Destaque (`accentColor`)**: Afeta badges numéricos (72px), pílulas de destaque e círculos de arcanos futuros.
- **Cor das Fontes (`bodyColor`)**: Afeta o corpo do texto, parágrafos, inline entries (H5) e números da pirâmide.
- **Fonte dos Títulos (`globalTitleFont`)**: Define a fonte padrão de toda a hierarquia H1–H4 com cascata automática.
- **Fonte dos Parágrafos (`globalBodyFont`)**: Define a fonte padrão de todo o texto de corpo e leitura.

**Regra de Caixa Alta / Baixa por Estilo**:
- **Estilo Texto Puro** (`theme.plainTextMode === true`): Todos os títulos usam escrita padrão com iniciais maiúsculas (Title/Sentence Case estilo científico, sem `textTransform: 'uppercase'`). A Linha do Tempo dos Arcanos exibe o texto explicativo acima e a sequência de esferas/legenda (conteúdo numerológico essencial) logo abaixo sem o container pesado em volta. Os cards de 72px de Arcano Regente e Vigente são exibidos sem o badge quadrado, em tipografia sóbria com H2. `number-entry variant:'plain'` (arcanos individuais) também sem badge, apenas título H4 + texto.
- **Estilo Vibraweb** (`theme.plainTextMode === false`): Mantém todos os elementos gráficos e cartões de destaque totalmente ativos (cartões de Meses Pessoais, pílulas de Dias Favoráveis, caixas de Arcano Regente/Vigente com badge de 72px e a caixa estilizada da Linha do Tempo dos Arcanos com o parágrafo explicativo destacado acima e as esferas/legenda). `number-entry variant:'plain'` (arcanos individuais) exibe badge de 72px quando `value` está definido (grid 72px + 1fr). Títulos em caixa alta (`textTransform: 'uppercase'`).

## Textos do Neon Postgres

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

### Dia Natalício (migration 037, 2026-07-19)
Tipo `pessoal_dia_natalicio`, numero = o dia CRU de nascimento (`calcDiaNatalicio`, numerology.ts) — **1 a 31**, não os números reduzidos 0-9/11/22 da grade principal de Números. Morava por engano na grade principal (`CATEGORIES`/`NUMBERS` em CustomTexts.tsx), que só tem colunas 0-9/11/22 — quem nascia num dia composto (10, 12-21, 23-31) simplesmente não tinha como editar/ver o texto, e o padrão do sistema nem existia pra esses 20 dias (só 1-9/11/22 estavam seedados). Migration 037 seedou os 20 textos faltantes; a linha "Dia Natalício" foi movida pra aba **Textos → Débitos, Dias e Bloqueios** (mesmo padrão de Dias Favoráveis: `extraRowTitle` mostra "Dia Natalício N", não "— Número N").

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

### Sumário (Índice) — TOC automático (2026-07-30)

Uma página de Sumário (Índice) é automaticamente inserida entre a capa e o primeiro bloco de conteúdo, tanto no preview quanto no PDF.

**Conformidade ABNT NBR 14724**:
- Página de Sumário é **contada mas NÃO numerada** (mesmo que a capa, recebe `pageNumber={null}`)
- Páginas de conteúdo continuam começando em 1

**Arquitetura**:
- `document-builder.ts`: `TocEntry[]` interface, `SECTION_ANCHOR_MAP` (mapeia IDs externos de blocos → id do primeiro elemento DOM renderizado), e `buildTocEntries(config, blockPageMap)` que constrói a árvore de entries filtrando blocos visíveis e buscando números de página
- `DocumentBlock.tsx`: cada bloco com potencial âncora recebe `id={block.id}` (seção, número-entry, cycle-header, arcanos, etc.)
- `DocumentPreviewStack.tsx`: aceita `tocEntries` e renderiza página de Sumário com `TocPageContent` entre capa e conteúdo
- `PreviewPage.tsx`: computa `tocEntries` via `useMemo` após `pages` estar pronto; `pageCount` incluí página de Sumário

**Hierarquia**: Sumário espelha a ordem e condições de visibilidade de `BlockOrderConfig` (nível 1 = seções, nível 2 = subsections). Blocos ocultos ou condicionais (ex.: Lições Cármicas quando vazias) são automaticamente omitidos porque seus ids não aparecem em `blockPageMap`.

**Links PDF**: cada entrada de Sumário é um `<a href="#anchor-id">` que, quando impresso via Chromium, se torna um link interno clicável no PDF — números no Sumário batem exatamente com os rodapés porque TOC é construído APÓS paginação estar completa.

### Paginação por MEDIÇÃO REAL de DOM (2026-07-19, substitui a heurística)

A tentativa original de estimar a altura de cada bloco por uma heurística de
texto (canvas `measureText` + contagem de linhas, calibrada em uma rodada
anterior) nunca bateu 100% com o CSS real de cada tipo de bloco — padding de
blockquote, grid número+texto lado a lado em vez de empilhado, gaps entre
parágrafos — e o erro de alguns mm por bloco se acumulava até um bloco
inteiro (ex.: "Débitos Cármicos" de 1 item) ser estimado perto do teto da
página quando na verdade media ~90mm reais, empurrando o próximo bloco
inteiro pra uma página nova que sobrava quase vazia. Substituído por
**medição real**: antes de paginar, cada bloco é renderizado FORA DA TELA
(mesmo componente `DocumentBlockRenderer` do render final, mesma largura de
coluna 186mm, mesma fonte) e sua altura de verdade é lida via
`getBoundingClientRect()` — ver `measure-document.tsx`
(`measureBlockHeights`). `splitIntoPages(blocks, realHeights)` usa essa
medição pra decidir se um bloco INTEIRO cabe; a heurística de texto
(`estimateBlockHeight`/`calcMarkdownHeightMM`) continua servindo só de: (1)
fallback pros blocos SEM medição (as duas metades resultantes de um split,
que são blocos novos criados DEPOIS da medição rodar), e (2) único cálculo
pros previews de amostra (Blocos/Templates, `DocumentPreviewStack` sem a
prop `pages`), onde o custo assíncrono da medição real não compensa pra um
mockup.

**Fluxo em `PreviewPage.tsx`**: `blocks`/`theme` memoizados (`useMemo`) →
`useEffect([blocks, theme])` roda `flattenDocumentBlocks` +
`measureBlockHeights` (assíncrono) → `setPages(splitIntoPages(blocks,
realHeights))`. A tela mostra "Montando documento..." até `pages` existir.
`DocumentOrganizerView`/`DocumentPreviewStack` recebem essa prop `pages` já
pronta (opcional — sem ela, cai no cálculo heurístico local, usado pelos
previews de amostra).

**Armadilha de medição encontrada e corrigida**: `getBoundingClientRect()`
NUNCA inclui margem — e a `marginBottom` inline do elemento raiz que
`DocumentBlockRenderer` devolve (24-36px, conforme o tipo) COLABA através do
wrapper de medição (vazio, sem padding/borda) e "escapa" da leitura. No
render real os blocos são irmãos diretos (sem wrapper isolando cada um), e
essa margem É espaço vertical de verdade entre um bloco e o próximo — sem
somá-la de volta explicitamente (`getComputedStyle(child).marginBottom`), o
código subestimava cada bloco, deixando caber MAIS conteúdo por página do
que o real permite (overflow, conteúdo cortado pelo `overflow:hidden`).

**Fluxo contínuo + quebras forçadas** (únicas exceções): capa em página
própria (fora do fluxo); Orientação+Importante dividem a 1ª página de
conteúdo; **"Os Seus Números"** é o único grupo com `pageBreakBefore: true`
— sempre abre página nova. Fora essas exceções, o conteúdo flui contínuo —
um bloco começa onde o anterior terminou.

**Split de blocos longos** (`splitBlock`, ponto de corte ainda heurístico —
a decisão de "cabe inteiro?" é real, mas o PONTO de corte dentro de um bloco
longo é aproximado por parágrafo/item, com uma margem de segurança de 8mm —
ver histórico de calibração abaixo): `number-entry` (parágrafos → sentenças),
`multi-number-entry`, `timeline-entry`, `dia-pessoal-entry`,
`dias-favoraveis-entry`, `triangulo-arcanos-lista`, `triangulo-piramide`
(bloqueios), `cycles-intro` (as 3 definições gerais de Ciclos/Desafios/
Momentos). Todos os baseados em lista usam o helper `findSplitIndex(baseOverhead,
itemHeights[], availableMM)`: diferente da versão antiga (repetida em cada
branch, com um bug de "força pelo menos 1 item mesmo que ele sozinho já
estoure o espaço"), `findSplitIndex` retorna 0 se nem o primeiro item cabe.

**Split "só cabeçalho"** (2026-07-19, `canHeaderOnlySplit`): `findSplitIndex`
retornando 0 não significa mais "não dá pra dividir aqui" — significa "não
cabe nenhum ITEM aqui". O cabeçalho + definição + instrução (que não
dependem de item nenhum) ainda cabem sozinhos na página atual sempre que:
(1) não é já uma continuação, (2) o cabeçalho em si cabe no espaço, e (3) há
algo de fato pra mostrar. Relatado ao vivo (print do Guilherme): a página
com "Dia Pessoal" acabando sobrava ~65% em branco porque o bloco inteiro de
"Dias Favoráveis" (cabeçalho+definição+instrução+31 chips+textos dos dias
favoráveis) não cabia ali e migrava inteiro pra página nova — mesmo o
cabeçalho+definição sozinhos já preenchendo boa parte do espaço livre.
Corrigido: agora o cabeçalho+definição+instrução renderizam na página com
espaço sobrando, e só os itens (chips+textos) continuam na página seguinte
— verificado ao vivo (`DIAS FAVORÁVEIS DO MÊS` + definição + instrução na
página 19, chips + textos dos dias na página 20, contínuo com o próximo
grupo "Relacionamentos" logo depois, sem quebra vazia).

**Calibração das margens de segurança** (2026-07-19): a margem de 15mm
original (ver commit anterior) foi criada como band-aid pra um bug que já
foi corrigido na raiz (`findSplitIndex` forçando item demais) — testada em
4mm, reintroduziu overflow numa combinação de 2 blocos ATÔMICOS (sem split
disponível, ex.: `multi-number-entry` mostrando só o texto de ausência
"O seu mapa não apresenta Débitos Cármicos") que encostavam bem no limite
do orçamento. Acomodado em duas margens menores e mais específicas:
`SPLIT_SAFETY_MARGIN_MM = 8` (orçamento passado pra dentro de `splitBlock`)
e `WHOLE_BLOCK_MARGIN_MM = 3` (na checagem "bloco inteiro cabe?", mesmo com
altura real medida — soma de duas medições reais independentes não é
garantida 100% aditiva por arredondamento/timing de fonte). **Limitação
conhecida**: `cycles-entry`, `conjugal-entry` e os cards de arcano
regente/vigente continuam indivisíveis (sem split nem header-only) — com
textos MUITO longos nesses campos específicos o bloco entra inteiro numa
página e pode, em tese, estourar; não observado em testes com textos de
tamanho normal.

**Resultado medido** (análise de teste, 25 páginas de conteúdo):
preenchimento de 53-98% (maioria 70-94%), **zero overflow** — contra ~55%
médio e overflow em 8 de 23 páginas antes da medição real entrar em cena.

**Split "só cabeçalho" faltando em `number-entry`** (2026-07-19, relatado ao
vivo por Guilherme com print do preview: página de "Personalidade" terminava
com bastante espaço em branco e "Expressão" — cabeçalho, definição E texto —
começava inteira na página seguinte). Causa: `canHeaderOnlySplit` já existia
e já era usado por `multi-number-entry`/`timeline-entry`/`dia-pessoal-entry`/
`dias-favoraveis-entry`/`triangulo-arcanos-lista`, mas o branch de
`number-entry` em `splitBlock` nunca tinha o equivalente — só tentava dividir
o TEXTO (parágrafo/sentença) e, se não sobrava nem 12mm pra texto, desistia e
empurrava o bloco INTEIRO (número + título + definição + instrução, que
cabiam sozinhos) pra página nova. A prop `isHeaderOnly` já existia em
`DocumentBlock.tsx` (`case 'number-entry'`) desde o commit que introduziu
`isContinuation`, mas nunca era setada por lugar nenhum — código morto.
Corrigido: novo ramo em `splitBlock` (`number-entry`) replica o padrão de
`canHeaderOnlySplit` — cabeçalho (número+título+definição+instrução) fica na
página atual com `texto: ''` + `deferredText: true` (flag nova, evita o
`DocumentBlockRenderer` mostrar o `emptyFallback` "Consulte um numerólogo..."
por engano), texto INTEIRO vai pra um bloco de continuação (`isContinuation`,
mesmo mecanismo de sempre). `isHeaderOnly` continua sem uso — não fazia parte
deste fix (o cabeçalho completo com definição já resolve o caso reportado).

**Dois bugs adicionais no mesmo relato** (2026-07-19, segundo print ao vivo:
página fechava com espaço em branco visível E o parágrafo que continuava na
página seguinte aparecia sem a mesma formatação):
1. `splitTextAtHeight` só cortava por PARÁGRAFO inteiro quando ≥1 parágrafo
   cabia — mesmo sobrando 1-2 linhas de espaço de verdade, o parágrafo
   seguinte inteiro era todo adiado pra continuação, deixando a página de
   cima com folga visível. Corrigido: antes do corte seco, tenta preencher o
   espaço restante (`availableMM - cumH`) dividindo por SENTENÇA o próximo
   parágrafo (mesma técnica que já existia só pro caso "nem 1 parágrafo
   cabe" — agora cascata pros dois casos).
2. O render de continuação (`isContinuation`, `number-entry`,
   `DocumentBlock.tsx`) usava um `<div>` simples, largura cheia — enquanto o
   texto normal (mesmo bloco, na página anterior) fica dentro do grid
   `72px número | 1fr texto`, recuado sob a coluna do texto. Resultado: o
   MESMO parágrafo mudava de recuo ao atravessar a quebra de página — o
   "sem a mesma formatação" relatado. Corrigido: continuação usa o mesmo
   grid (`72px` vazio + `1fr` texto), mantendo a coluna idêntica — páginas
   visualmente coladas, como pedido.

---

## Estado atual e problema em aberto (2026-07-19, continuação — sessão de investigação ao vivo)

**Isto substitui/atualiza a seção anterior "Paginação por MEDIÇÃO REAL de DOM" no que for
contraditório** — o texto acima descreve o estado de um commit anterior no
mesmo dia; esta seção documenta tudo que mudou DEPOIS, verificado ao vivo
inspecionando o DOM real do preview rodando (`localhost:5173`, Chrome, via
ferramentas de automação de navegador), não só lendo código.

### O que mudou desde a seção anterior

1. **`.content-section` agora é altura FIXA** (`height: 297mm; max-height: 297mm;
   overflow: hidden`), não mais `min-height`/`overflow: visible` — cada seção
   é literalmente 1 página impressa, o JS garante que o conteúdo cabe antes
   de renderizar (ver `DocumentPreviewStack.tsx`).
2. **`splitIntoPagesReal`** (`measure-document.tsx`) substituiu o uso direto
   de `splitIntoPages` no preview real (`PreviewPage.tsx`): mede via DOM real
   não só os blocos ORIGINAIS (como a versão anterior já fazia), mas também
   CADA PEDAÇO criado por um split (`-part2`, `-part3`…), assim que ele é
   criado — cache por id, nunca remede o mesmo bloco duas vezes. Isso fechou
   uma classe de bug onde uma SEQUÊNCIA de splits na mesma página (ex.:
   Motivação divide → Impressão divide → Expressão divide) acumulava erro de
   heurística a cada divisão subsequente.
3. **`splitAtItemBoundary`** (novo helper genérico, `document-builder.ts`):
   centraliza a lógica "quantos itens inteiros cabem + tenta cortar por LINHA
   o item-fronteira antes de deferir o resto" — usada por `cycles-intro`,
   `dia-pessoal-entry`, `dias-favoraveis-entry` e `conjugal-entry`. Existe
   pra parar de duplicar a mesma lógica (com o mesmo risco de divergir) toda
   vez que um novo tipo de bloco precisa da mesma capacidade.
4. **Fallback GENÉRICO no fim de `splitBlock`** (pedido explícito do
   Guilherme, 2026-07-19: "o limite deveria ser padrão pra um grupo geral de
   blocos... aplicar em todos e selecionar os específicos onde não se
   aplica"): antes, cada tipo de bloco só ganhava corte por linha se alguém
   escrevesse um `if (block.type === ...)` dedicado — qualquer tipo
   esquecido ficava 100% atômico por padrão (foi o que aconteceu com
   `conjugal-entry`/`triangulo-piramide`, que pulavam inteiros pra página
   nova mesmo sobrando espaço). Agora existe um branch final que roda pra
   QUALQUER bloco não coberto por um branch específico, e tenta cortar por
   linha se o bloco tiver um campo `texto` e/ou `definicaoTexto` simples.
   **Exceção explícita**: `orientation`, `importante`, `summary-list`,
   `summary-table`, `conclusion` ficam de fora do fallback — são as páginas
   de introdução/fechamento com comportamento fixo (pedido do Guilherme).
5. **`conjugal-entry` (Harmonia Conjugal)** ganhou split de verdade pela
   primeira vez: achata os 4 grupos (Vibra com/Atrai/Oposto/Passivo) numa
   lista única de "linhas" (número + texto), usa `splitAtItemBoundary`.
   Confirmado ao vivo: reduziu o gap da seção "Relacionamentos" de ~172mm
   pra 0 (não aparece mais na lista de gaps grandes).
6. **`triangulo-piramide` foi reavaliado, não corrigido**: a pirâmide visual
   (grade de números formando o triângulo) é um elemento estrutural, análogo
   a um "card" — não deveria ser cortada mesmo (mesma exceção que já valia
   pra `summary-list`/`summary-table`). O gap que sobra antes dela (quando
   ela não cabe inteira e pula pra página nova) é esperado, não é bug.

### Metodologia nova: inspeção ao vivo do DOM real, não só leitura de código

A partir de hoje, sempre que uma hipótese sobre "quanto espaço sobra" ou "por
que não coube" precisar ser confirmada, o caminho é medir o DOM real
rodando, não só ler as constantes no código-fonte. Dois cuidados
importantes descobertos:

- **O preview roda com `zoom: 75%`** (`.zoom-wrapper { transform:
  scale(0.75) }`, controle do usuário na barra de ferramentas) — qualquer
  `getBoundingClientRect()` lido diretamente do DOM visível vem ESCALADO;
  pra converter pra mm reais é preciso **dividir por 0.75 também**, não só
  por `PX_PER_MM` (96/25.4). Confirmado matematicamente: 157.2mm "aparentes"
  ÷ 0.75 = 209.6mm reais, batendo exatamente com uma medição fora do
  `.zoom-wrapper`.
- **A distância "última linha de conteúdo → rodapé" medida por SOMA das
  alturas de cada bloco (cada um lido isoladamente + sua própria
  `marginBottom`) SUBESTIMA o gap real** em relação à medição DIRETA (`rect`
  do rodapé `.top` menos `rect` do último bloco `.bottom`) — a diferença
  observada foi de até ~14mm num caso real. A medição DIRETA é a fonte da
  verdade; a soma por bloco serve só de aproximação rápida.

### Problema em aberto: o corte por SENTENÇA ainda desperdiça espaço em alguns casos

**Confirmado ao vivo, 2026-07-19** (print do Guilherme, seção "Motivação"):
depois de um parágrafo caber inteiro + uma sentença parcial do próximo
parágrafo, a página fechava com **43.7mm reais** de sobra (medição direta,
corrigida por zoom) — e a PRÓXIMA sentença do mesmo parágrafo (curta,
caberia tranquilamente) não entrava, texto inteiro adiado pra página
seguinte.

**Hipótese testada e REFUTADA**: a função `splitTextAtHeight`
(`document-builder.ts`) mede cada sentença ISOLADAMENTE
(`countWrappedLines(sentença)`) e SOMA as alturas — isso arredonda cada
sentença pro número de linhas dela sozinha, como se cada uma sempre
começasse numa linha nova, quando na verdade sentenças dentro do mesmo
parágrafo dividem linha de verdade (a última linha de uma sentença continua
com o início da próxima). Tentei corrigir medindo o texto ACUMULADO
(sentenças 0..s juntas, uma wrap só) em vez da soma — **essa correção foi
testada ao vivo e teve efeito NEGATIVO**: o total de páginas do documento de
teste piorou (29→30) e o gap que eu queria fechar aumentou (43.7mm→166.7mm)
em vez de diminuir. **Revertido** — o código hoje está de volta à versão que
soma por sentença isolada (mais conservadora, mas sem essa regressão nova).

**Conclusão**: a causa raiz do desperdício de ~40mm no caso "Motivação" NÃO
é (só) a forma de somar sentenças — precisa de mais investigação isolada
antes de mexer de novo, porque a função `splitTextAtHeight` hoje é usada
por QUASE TODOS os tipos de bloco (via o fallback genérico do item 4 acima),
então qualquer ajuste nela afeta o documento inteiro de uma vez — um efeito
colateral em um lugar pode aparecer como melhora num bloco e piora em
outro, dificultando isolar por teste manual no navegador.

### Pesquisa: como ferramentas profissionais de paginação fazem isso

Pesquisa feita em 2026-07-19 (sob pedido do Guilherme) sobre como sistemas
confiáveis de paginação HTML→impressão resolvem exatamente esse tipo de
problema:

**A diferença arquitetural central**: este projeto pré-calcula alturas por
HEURÍSTICA (`canvas.measureText` simulando quebra de linha) ANTES de
renderizar, decide o corte, e só DEPOIS renderiza o resultado final. Todas
as ferramentas de referência pesquisadas fazem o INVERSO: renderizam o
conteúdo COMPLETO primeiro (fluxo contínuo, sem corte), e usam o motor de
layout do PRÓPRIO NAVEGADOR (ou um motor equivalente) pra detectar
overflow real e só então fatiar — nunca "adivinham" quantas linhas um texto
vai ocupar.

- **[Paged.js](https://github.com/pagedjs/pagedjs/)** ([como funciona](https://pagedjs.org/en/documentation/4-how-paged.js-works/)):
  polyfill open-source (MIT) do padrão CSS Paged Media. Algoritmo: renderiza
  o conteúdo inteiro numa `Layout` de teste, verifica overflow REAL da caixa
  da página, move o conteúdo que estourou pra uma nova "page box", e repete
  até acabar o conteúdo — usando suporte NATIVO do navegador pra
  `break-before`/`break-after`/`widows`/`orphans` em vez de heurística
  própria (`BreakToken` — ver [devdocs](https://pagedjs.org/devdocs/BreakToken.html)).
  Suporta cabeçalho/rodapé por página (running elements), numeração via
  `counter(page)`, e é a base de vários produtos comerciais de geração de
  PDF a partir de HTML.
- **[CSS Paged Media / CSS Fragmentation Module](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Paged_media)**
  ([guia completo](https://doppio.sh/guide/css-page-breaks)): o padrão W3C
  nativo (`break-inside: avoid`, `break-before`/`break-after`, `orphans`,
  `widows`) — suportado parcialmente pelos navegadores modernos na hora de
  imprimir/gerar PDF (`window.print()`, ou Puppeteer/Playwright
  `page.pdf()`). Cobre bem "não cortar este bloco" e "deixe pelo menos N
  linhas de um parágrafo de cada lado do corte" — mas cabeçalho/rodapé por
  página via `@page` margin boxes tem suporte fraco/inconsistente no Chrome,
  que é provavelmente por isso que este projeto NÃO usa impressão nativa e
  construiu paginação própria.
- **Técnica pra achar o ponto de corte EXATO dentro de um parágrafo**: em vez
  de simular quebra de linha com `canvas.measureText` (abordagem heurística
  usada aqui), a técnica usada por ferramentas reais é `Range.getClientRects()`
  ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Range/getClientRects))
  no texto JÁ RENDERIZADO: cada `DOMRect` retornado corresponde a UMA LINHA
  visual de verdade (não uma aproximação) — dá pra expandir um `Range`
  caractere a caractere (ou por bisseção) até o número de rects aumentar,
  encontrando a quebra de linha REAL sem nenhuma suposição sobre largura de
  fonte/kerning. Esse projeto já usa uma técnica parecida (renderização fora
  da tela + `getBoundingClientRect()`) pra medir a altura de blocos INTEIROS
  (`measureBlockHeights`) — mas ainda NÃO pro ponto de corte DENTRO de um
  parágrafo, que continua 100% heurístico (`countWrappedLines`).

**Caminho recomendado (não implementado ainda — fica registrado pra próxima
rodada)**: trocar `countWrappedLines`/`splitTextAtHeight` por uma versão que
renderiza o parágrafo candidato fora da tela (mesma técnica de
`measureBlockHeights`) e usa `Range.getClientRects()` pra achar a linha
exata onde o texto ultrapassa o espaço disponível, em vez de simular a
quebra por `canvas.measureText`. Isso eliminaria de vez essa classe de bug
(a medição deixa de ser uma ESTIMATIVA e passa a ser a MESMA conta que o
navegador já faz pra desenhar o texto), ao custo de precisar ser assíncrono
(como `measureBlockHeights` já é) em vez de síncrono. Dado que
`splitTextAtHeight` hoje é chamado de dentro de `splitBlock` (síncrono, usado
tanto pelo preview quanto pelos previews de amostra), essa troca é uma
mudança de arquitetura, não um ajuste pontual — motivo pelo qual não foi
tentada ainda nesta sessão.

## RESOLVIDO (2026-07-23): corte por medição real + orçamento de página correto

O "problema em aberto" acima (corte que desperdiça espaço, texto cortado no
lugar errado, continuação desalinhada, blocos inteiros pulando de página) foi
atacado na raiz. Três causas, três correções:

### 1. Orçamento de página estava 21mm menor que a folha real
`MAX_PAGE_HEIGHT_MM` era **240**, mas a área ÚTIL de uma `.content-section` é
**261mm** (297 − 22mm padding-top − 14mm padding-bottom; o wrapper interno em
`DocumentPreviewStack` tem `height:100%` dessa caixa). Como o empacotamento já
usa medição REAL de DOM, um orçamento menor que a folha só cria uma faixa fixa
de ~21mm em branco no fim de TODA página — era a maior fonte do "espaço gigante
sobrando". Corrigido para **261mm**; a margem de segurança contra arredondamento
sub-pixel/fonte virou `PAGE_SAFETY_MM = 2` em `measure-document.tsx` (orçamento
efetivo 259mm), em vez de embutida no valor base.
> Correção de um diagnóstico anterior: 240 NÃO era "o valor calibrado que
> funcionava" — era a causa do espaço em branco. Aquela calibração servia à
> heurística `estimateBlockHeight`, que a medição real substituiu.

### 2. Ponto de corte agora é MEDIDO, não estimado (o caminho recomendado, implementado)
`splitBlock(block, availableMM, measure?)` (document-builder.ts) ganhou um 3º
parâmetro `measure: MeasureFn` = altura REAL (mm) de um bloco candidato. Quando
presente (documento real via `measure-document.tsx`), o corte é decidido por
`splitBlockMeasured`:
- **Texto (`number-entry`)**: corta por PALAVRA (`wordCutOffsets`/`sliceTextByWords`,
  preservando parágrafos `\n\n` e formatação markdown). O nº de palavras da parte
  1 vem de `measuredMaxFit` (**busca binária** que renderiza o candidato e mede —
  a altura cresce monotonicamente com as palavras, então a busca é exata). Guarda
  `markerBalanced` evita cortar dentro de `**negrito**`/`__sublinhado__`.
- **Listas** (`multi-number-entry`, `timeline-entry`, `dia-pessoal-entry`,
  `triangulo-arcanos-lista`): `splitItemsMeasured` acha por medição quantos itens
  inteiros cabem, mesma lógica de continuação de antes.
- **`triangulo-piramide`**: corte de 2 vias (pirâmide | bloqueios) decidido por
  medição.
- **"Só cabeçalho"** (`number-entry`, `deferredText`): quando nenhum pedaço útil
  de texto cabe mas o número+título+definição cabem, eles ficam na página atual e
  o texto inteiro migra pra continuação — resolve a folga da "imagem 2" (bloco
  seguinte pulando inteiro). `DocumentBlock.tsx` esconde o `emptyFallback` quando
  `deferredText`.

Sem `measure` (previews de AMOSTRA em Blocos/Templates), cai em
`splitBlockHeuristic` (a antiga contagem de caracteres) — mockups não precisam de
precisão de PDF.

### 3. Regra padrão para TODOS os blocos + exceções explícitas
`ATOMIC_BLOCK_TYPES` (document-builder.ts) é a lista ÚNICA de tipos que NÃO se
cortam (capa, `summary-list`/`summary-table`, `section-heading`, `orientation`/
`importante`/`conclusion`, `cycles-entry`, `conjugal-entry`, cards de arcano
regente/vigente). Todo tipo fora dela é cortável por padrão. Para tornar um tipo
hoje-atômico cortável, remova-o daqui e garanta o `isContinuation` no render — é o
ponto único das "exceções pontuais".

### 4. Continuação alinhada + medir só depois da fonte carregar
- `number-entry` `isContinuation` agora renderiza o texto restante DENTRO do mesmo
  grid `72px | 1fr` (célula esquerda vazia), mantendo o recuo da coluna de texto —
  fim do "muda de formatação ao virar a página" (imagem 1).
- `useMeasuredPages` (measure-document.tsx) espera `document.fonts.ready` antes de
  medir — se medisse com a fonte de fallback, TODA a paginação sairia com alturas
  erradas (mesma proteção que `print-document.ts` já tinha).

**Fidelidade PDF**: inalterada — `printDocument` continua clonando o
`.preview-scroll` já paginado; como a paginação do preview agora está correta, o
PDF herda isso 1:1.

### Refinamentos da mesma sessão (2026-07-23) — verificados ao vivo pelo Guilherme

Depois do primeiro corte medido, o preview real revelou 4 ajustes, todos feitos:

1. **Recuperar a margem inferior no ajuste de corte** (`measureSingleBlock(...,
   excludeTrailingMargin)`): a `marginBottom` de um pedaço que termina a página é
   espaço morto (fica embaixo da última linha, encostando no rodapé). Contá-la
   fazia o corte parar ~2 linhas cedo — parecia corte "por parágrafo". Agora a
   medição de AJUSTE (só a do fim de página, via `measureMM`) desconta essa
   margem; a medição de espaço ENTRE blocos continua contando-a.

2. **Corte da PRÓPRIA introdução/definição** (number-entry, 3 níveis em
   `splitBlockMeasured`): (1) corta o CORPO por linha; (2) "só cabeçalho" (número
   + título + definição ficam, corpo migra, flag `deferredText`); (3) quando a
   definição é alta demais pra caber junto do número, corta a DEFINIÇÃO por linha
   (título + começo da intro ficam, flags `defHeadOnly`/`hideDefLabel`; resto da
   intro + número + corpo continuam). Resolve o caso "Missão → Aptidões" onde o
   bloco inteiro pulava deixando meia página vazia.

3. **Cada BLOCO-PAI começa em página nova** (regra pedida): todo grupo de nível
   superior (Orientação, Os Seus Números sozinha, Personalidade… até Conclusão)
   recebe `pageBreakBefore: true` — feito centralizado no `return` de
   `buildDocumentBlocks` (`.map(... b.id !== 'bloco-capa' ...)`), exceto a Capa.
   Os FILHOS dentro de cada pai seguem o fluxo de texto normal (começam na nova
   página e só quebram pra próxima quando falta espaço). Isso, por construção,
   elimina os gaps de fim-de-seção onde um novo capítulo começava no pé de uma
   página. Vale nos 2 paginadores (medido e heurístico) via `flattenDocumentBlocks`.

4. **Mesmo motor de paginação em TODOS os previews**: `BlocosPage` (/app/blocos)
   e `BrandPage` (/app/marca) usavam `splitIntoPages` (heurística). Passaram a
   usar `useMeasuredPages(blocks, theme)` e a receber a prop `pages` já medida —
   agora o preview de amostra (nome fictício), o preview de template e o preview
   FINAL do cliente paginam de forma idêntica. (Exigiu içar `theme`/`blocks`/
   hook acima do early return de loading pra respeitar as regras de hooks.)

5. **Espaçamento entre blocos unificado** (`DOC_GAP` em `DocumentBlock.tsx`):
   antes cada tipo tinha a sua margem (24/28/32/36), gerando incoerência de
   respiro entre os textos. Agora TODO bloco de nível superior usa `DOC_GAP`
   (28) — fonte única, trocar lá muda o ritmo do documento inteiro. Continuações
   de bloco cortado mantêm gaps menores próprios (é o mesmo bloco atravessando a
   página). Espaçamentos INTERNOS de cada bloco (grid número+texto, borda de
   cabeçalho de ciclo, etc.) não são o gap entre blocos e ficaram como estavam.

6. **Fim da PERDA de texto (corte que "some")** — o mais grave. Blocos altos SEM
   caminho de corte eram empacotados inteiros e, ao passar de uma página, o
   `overflow:hidden` da `.content-section` cortava o excedente e o texto
   simplesmente DESAPARECIA (não continuava na página seguinte). O caso mais
   crítico era **Dias Favoráveis** (até 31 textos de dia ⇒ quase sempre > 1
   página, e sem branch de split ⇒ recorte silencioso). Corrigido dando corte
   medido a `dias-favoraveis-entry` e `cycles-intro`, e adicionando o guard
   `isContinuation` nos renders de `timeline-entry` e `dias-favoraveis-entry` (a
   continuação mostra só os itens que faltavam — sem repetir título, grade,
   chips ou definição). `dia-pessoal-entry` e `triangulo-arcanos-lista` já
   cortavam por item e continuam limpos.

7. **Limitações conhecidas (próximo passo de aproveitamento de espaço)**:
   `cycles-entry` (um ciclo inteiro — vários cards internos condicionais por
   índice, o mais complexo de dividir) e os cards de arcano regente/vigente ainda
   são atômicos (`ATOMIC_BLOCK_TYPES`). Se um passar de uma página, ou não couber
   sob o título do grupo, pula inteiro e pode deixar gap. `conjugal-entry` DEIXOU
   de ser atômico (ver ponto 11). Falta ainda um "só-cabeçalho" GENÉRICO pros
   blocos-lista de grade/chips/círculos (timeline/dias-favoraveis/arcanos-lista):
   quando o cabeçalho não cabe no resto da página, o bloco pula inteiro (o
   `number-entry` e agora o `conjugal-entry` já têm esse "só-cabeçalho").

11. **Perda de texto por arredondamento de linha + Harmonia Conjugal
    (2026-07-23, continuação)**:
    - `PAGE_SAFETY_MM` subiu de 2 → **8mm**. A altura MEDIDA sai um pouco menor
      que a RENDERIZADA porque o navegador arredonda cada caixa de linha pra
      pixel inteiro e isso ACUMULA — invisível num number-entry, mas ~1 card num
      bloco-lista de 11-12 itens (Dia Pessoal, Meses, Dias Favoráveis, Arcanos),
      fazendo o bloco "caber" por medição, ser empacotado inteiro e ter o ÚLTIMO
      item SUMINDO no overflow. Com 8mm de folga, o bloco encostando no limite é
      DIVIDIDO (resto vai pra continuação) em vez de cortado.
    - **Detector de overflow** em `DocumentPreviewStack` (`.doc-content-flow` +
      `useEffect`): loga no console `[vibraweb-pagination] conteúdo cortando…`
      com a página e os px de estouro. Fonte da verdade pra ajustar a folga.
    - `conjugal-entry` virou divisível: corta pelos 4 grupos (Vibra/Atrai/Oposto/
      Passivo) com "só-cabeçalho" (k=0) — resolve a intro de Relacionamentos
      sozinha numa folha em branco. `isContinuation` no render esconde o
      cabeçalho na continuação.

12. **Medição UNIFICADA (isolada) + corte por linha na fronteira de seção**
    (2026-07-23, continuação): a decisão "cabe inteiro?" parou de usar a medição
    em LOTE (`measureBlockHeights`, removida) e passou a usar a MESMA medição
    isolada por bloco (`measureSingleBlock`, memoizada) que o corte já usava.
    Antes eram dois caminhos de medição; qualquer divergência fazia um bloco-
    lista "caber" por engano e sumir o último card (Meses/Dia Pessoal). Agora a
    conta de caber e a de cortar são idênticas. Além disso, `cycles-intro`
    passou a cortar a seção-FRONTEIRA por LINHA (subtítulo + começo ficam na
    página, resto continua sem repetir o subtítulo via `hideFirstLabel`) —
    "Momentos Decisivos" começa na folha anterior em vez de pular inteiro
    deixando gap. Falta ainda o mesmo corte por linha DENTRO do item-fronteira
    dos outros blocos-lista (timeline/dia-pessoal/dias-favoraveis cortam no
    limite do ITEM, não no meio do texto do item) — próximo passo.

13. **CAUSA RAIZ real da perda de texto em listas longas (Meses/Dia Pessoal/
    Arcanos), encontrada e corrigida (2026-07-23)** — o detector de overflow
    (ponto 11) confirmou ao vivo: pág 16 (+334px), pág 17 (+217px), pág 23
    (+206px), todas em blocos-lista de continuação MULTI-página.
    - **Hipótese testada e REFUTADA**: suspeitei de novo de discrepância de
      medição (fonte/largura diferente entre o container de medição e a folha
      real). Testado ao vivo via script no navegador comparando
      `createMeasureContainer` contra uma réplica fiel da `.content-section`
      real com o MESMO conteúdo — resultado: minha medição fica **~5% MAIOR**
      que a real (984px vs 938px), não menor. Then descartada.
    - **Causa real, confirmada por leitura do código**: no loop de RE-SPLIT
      recursivo (`splitIntoPagesReal`, measure-document.tsx — usado quando o
      resto de um bloco cortado ainda não cabe numa página cheia, ex.: uma
      lista tão longa que precisa de 3+ páginas), cada iteração usava
      `(MAX_PAGE_HEIGHT_MM - PAGE_SAFETY_MM) * 0.9` como orçamento — um fator
      `* 0.9` SEM NENHUMA justificativa, reduzindo o orçamento de uma folha
      NOVA em ~25mm/~95px À TOA (deveria ser simplesmente o mesmo orçamento de
      qualquer folha fresca: `MAX_PAGE_HEIGHT_MM - PAGE_SAFETY_MM`). Quando o
      próximo item não cabia nesse orçamento artificialmente menor,
      `splitBlock` devolvia `null` (não conseguiu dividir), o loop desistia
      (`break`) e o CONTEÚDO RESTANTE — que podia ter VÁRIOS itens ainda não
      divididos — era jogado inteiro numa página sem verificar se cabia,
      simplesmente estourando o `overflow:hidden` e sumindo. A aritmética bate:
      253mm (orçamento real) − 227,7mm (orçamento com o `*0.9`) = 25,3mm ≈
      96px por iteração travada; os overflows observados (206-334px) são
      ~2-3,5× isso — consistente com vários itens presos juntos quando o loop
      desistia cedo demais.
    - **Corrigido**: removido o `* 0.9`; o loop agora usa o orçamento real de
      uma folha cheia em toda iteração. Também subi o teto de segurança do
      loop de 5 → 8 iterações (cobre listas bem mais longas, ex.: Dias
      Favoráveis pode ter até 31 dias) e adicionei uma rede de segurança: se
      mesmo assim `remaining` não couber (um item atômico sozinho maior que 1
      página inteira — caso residual, não o bug principal), ele pelo menos
      começa numa página PRÓPRIA em vez de se acumular com algo que já
      estourava.
    - **Não verificado com dados reais**: não há como reproduzir com o
      preview de Blocos sem sessão autenticada (a rota redireciona sem
      login), e uma tentativa de montar um harness sintético (React fora da
      árvore do app, via import dinâmico no console do navegador) travou por
      instabilidade do próprio harness, não do código de produção — abandonada
      por ser pouco confiável. A confirmação fica pendente do próximo teste ao
      vivo do Guilherme (mesmo detector de overflow do ponto 11 — se ainda
      aparecer, o padrão do log agora aponta pra outro lugar, não mais pra
      este `* 0.9`).

14. **A DIFERENÇA REAL entre "Personalidade" (nunca corta) e as listas
    (pareciam cortar) — resposta à pergunta direta do Guilherme (2026-07-23)**:
    depois do fix acima, "Dias Favoráveis do Mês" ainda aparecia terminando
    abruptamente após os chips, sem nenhum texto de vibração — em TODAS as
    capturas de tela desde o INÍCIO desta sessão, mesmo antes de qualquer
    mudança de paginação. Isso é o sinal de que NÃO era (só) bug de
    paginação: era uma diferença estrutural de RENDER.
    - `number-entry` (Personalidade, Propósito de Vida, etc.) SEMPRE renderiza
      a linha completa (número + título + texto), passando
      `emptyFallback="Consulte um numerólogo..."` pro `MarkdownParagraphs` —
      se o texto não está configurado no Neon Postgres, aparece a mensagem de
      fallback, NUNCA um vazio.
    - `dias-favoraveis-entry`, `timeline-entry` (Meses Pessoais) e
      `triangulo-arcanos-lista` (Arcanos) faziam o OPOSTO: `item.texto ? (<row>)
      : null` / `if (!arc) return null` — se o texto (ou a linha inteira no
      banco) não existe, a LINHA INTEIRA é omitida, sem nenhum aviso. Se
      VÁRIOS itens de uma lista não têm texto configurado (comum pra Dias
      Favoráveis — precisa de uma linha por dia 1-31, fácil ficar incompleto),
      a seção "termina" visualmente bem antes do esperado — indistinguível de
      um corte de paginação, mas é na real uma LACUNA DE CONTEÚDO no banco.
    - **Corrigido**: as 3 sempre renderizam a linha agora (número/dia/arcano +
      título), com `emptyFallback` próprio quando o texto não existe — mesmo
      padrão do `number-entry`. `dia-pessoal-entry` (guia) também ganhou o
      mesmo fallback (já renderizava a linha sempre, só faltava a mensagem).
    - **Efeito colateral ÚTIL**: com o fallback, se ainda aparecer uma seção
      "vazia" no documento, agora é FÁCIL diferenciar as duas causas — se
      aparecem várias mensagens "Consulte um numerólogo..." em sequência =
      falta preencher o texto em Textos → (aba correspondente); se o texto
      continua sumindo/cortando no MEIO de uma frase = aí sim é bug de
      paginação de verdade.
    - **Ação recomendada pro Guilherme**: conferir em **Textos → Débitos, Dias
      e Bloqueios** se os dias 3, 6, 12, 15, 21, 24, 30 (os dias favoráveis do
      cliente-modelo João da Silva) têm texto salvo — é bem provável que seja
      simplesmente conteúdo ainda não escrito pra esses números específicos,
      não um bug.

15. **Corte por LINHA dentro do item-fronteira — generalizado pra todos os
    blocos-lista** (2026-07-23, resposta a um bug CONFIRMADO ao vivo: "Dia
    Pessoal 11" cortado ao meio pelo rodapé, sem continuar na próxima folha).
    Até aqui, os blocos-lista (`dia-pessoal-entry`/guia, `triangulo-arcanos-
    lista`, `timeline-entry`, `dias-favoraveis-entry`) só cortavam na
    FRONTEIRA entre itens — se o item-fronteira (o 1º que não cabe mais
    inteiro) fosse medido como "cabe" por um triz e na prática não coubesse
    (mesma classe de erro de arredondamento do ponto 11), ele era renderizado
    inteiro e cortado pelo `overflow:hidden` — o texto simplesmente sumia,
    sem aparecer em nenhuma página. `number-entry` e `cycles-intro` já não
    tinham esse problema porque cortam o PRÓPRIO texto por palavra; agora os 4
    blocos-lista fazem o mesmo:
    - **`cutBoundaryText(text, availableMM, measureCandidate)`** (novo helper
      genérico em `document-builder.ts`): dado o texto do item-fronteira, acha
      por busca binária MEDIDA quantas palavras cabem, com o mesmo guard de
      `markerBalanced` (não corta dentro de `**negrito**` etc.) e
      `MIN_SPLIT_WORDS` do `number-entry`. Cada bloco-lista só precisa montar o
      "candidato" (itens fixos anteriores + este item com o texto parcial) —
      a lógica de ONDE cortar é compartilhada.
    - Fluxo em cada bloco: (1) acha `k` = quantos itens INTEIROS cabem
      (`measuredMaxFit`, como antes); (2) se `k < total`, tenta cortar o TEXTO
      do item `k` com `cutBoundaryText` — se der certo, `k` itens inteiros +
      o item `k` com texto PARCIAL ficam na página atual, e o item `k` com o
      texto RESTANTE (+ os itens seguintes) abre a continuação; (3) só cai no
      corte antigo (por item inteiro) se o corte por palavra não for possível
      (texto curto demais, ou nem o cabeçalho do item cabe).
    - **Flag `isTextContinuation`** (novo campo por-item, não por-bloco):
      marca que ESTE item específico é a continuação do texto de um item que
      já apareceu na página anterior — o render correspondente esconde só o
      RÓTULO desse item (número/dia/título do mês/"Arcano N: Nome"), mantendo
      a MESMA coluna de alinhamento (grid vazio à esquerda), igual ao padrão
      já usado por `number-entry`. Adicionado em: `guia` (dia-pessoal-entry),
      `ArcanoInfo` (document-builder.ts), `items` (timeline-entry), `textos`
      (dias-favoraveis-entry).
    - **Bug real encontrado e corrigido em `dias-favoraveis-entry`** durante
      esta mudança: o loop de render "Vibração de cada dia favorável" iterava
      sobre `dias` (a lista ORIGINAL, nunca fatiada pelo split — só `textos`
      é fatiado), então a página 1 de um bloco dividido mostraria mensagens de
      "não configurado" pra dias que na verdade TÊM texto, só que na página
      seguinte. Corrigido: o loop agora itera `Object.keys(textos)` (que o
      split fatia corretamente), não mais `dias` — `dias` continua servindo
      só pros chips de visão geral (sempre mostra todos, intencionalmente).
      De quebra, `dayKeys` (candidatos ao corte) passou a incluir também dias
      com `textos[d] === null` (sem interpretação no banco) — antes esses
      dias ficavam de fora do corte inteiramente e nunca apareciam em
      NENHUMA página quando o bloco precisava dividir.

16. **`cycles-entry` deixou de ser atômico** (2026-07-23, resolve "2º Ciclo de
    Vida" pulando inteiro e deixando a folha anterior quase em branco — CONFIRMADO
    corrigido ao vivo pelo Guilherme). Cada card (Regente do Ciclo/Desafio(s)/
    Momento(s) Decisivo(s)) é gated SÓ pelo seu próprio campo de texto
    (`index===N && data.textoX`) — dá pra "esconder" um card só esvaziando
    esse campo, sem reestruturar o componente. Split: (1) quantos cards
    INTEIROS cabem; (2) corta o TEXTO do card-fronteira por palavra
    (`cutBoundaryText`, `boundaryCutKey` identifica qual rótulo esconder na
    continuação); (3) só-cabeçalho: se nem o 1º card cabe, o TÍTULO ("Nº Ciclo
    de Vida — O Ciclo X" + período) sozinho ainda pode caber — precisou
    DESACOPLAR o cabeçalho do corpo do card Ciclo (antes ambos eram gated pela
    MESMA condição `textoCiclo`; agora o corpo tem o guard extra `!headerOnly`,
    e o cabeçalho ganhou `!isContinuation` pra nunca repetir o título "Nº Ciclo
    de Vida" numa continuação, nem quando o próprio Ciclo é o card cortado
    (`textoCiclo` permanece truthy nesse caso, só pra manter o cabeçalho).
    Removido de `ATOMIC_BLOCK_TYPES`.

17. **Só-cabeçalho em 2 NÍVEIS — a instrução pode ser maior que título+intro
    juntos** (2026-07-23, resolve "Meses Pessoais"/"Dias Favoráveis" ainda
    pulando inteiros mesmo depois do só-cabeçalho do ponto 13: o Guilherme
    reportou que o só-cabeçalho de 1 nível não bastava). Causa: o só-cabeçalho
    original testava título+intro+INSTRUÇÃO+grade/chips como um candidato ÚNICO
    — a `InstructionCallout` (caixa com borda tracejada, ícone, padding
    generoso) é visualmente grande, então esse candidato ÚNICO podia estourar
    o espaço restante mesmo quando só título+introdução (o pedido específico
    do Guilherme: "colocar a introdução e o subtítulo... pra cima") caberiam
    tranquilamente sozinhos. Corrigido com 2 tentativas em cascata: **nível 1**
    = candidato completo (como antes); **nível 2**, só se o 1º falhar = título+
    intro+grade/chips SEM a instrução — ela não é DESCARTADA, é ADIADA pro
    TOPO da página de continuação via nova flag `showDeferredInstrucao` (o
    render mostra a `InstructionCallout` ali, antes dos itens). Implementado em
    `timeline-entry` (Meses Pessoais) e `dias-favoraveis-entry` (mesma forma de
    instrução) — `dia-pessoal-entry` e `triangulo-arcanos-lista` não têm esse
    padrão de instrução tão grande associada ao cabeçalho, não precisaram do
    2º nível por ora.

18. **A causa raiz do "1 palavra sozinha numa folha nova" / "espaço enorme
    sobrando após um corte" — CORRIGIDA NO PACKER, não por bloco** (2026-07-23,
    confirmado ao vivo pelo Guilherme com 2 exemplos: "Expressão" cortando a
    definição faltando só a palavra "vida." e a folha ficando quase toda em
    branco; "significativos." sozinha abrindo página nova antes de "Dia
    Pessoal"). Até aqui, `splitIntoPagesReal` (measure-document.tsx) fazia
    `currentPage.push(part1); pushPage()` — um `pushPage()` INCONDICIONAL logo
    depois de colocar part1, fechando a página nesse instante MESMO QUANDO
    part1 usava só uma fração do espaço disponível. Isso empurrava part2
    inteiro (às vezes só 1 palavra órfã de um corte por linha) pra uma folha
    NOVA, desperdiçando todo o resto da folha de part1 — não importa qual
    tipo de bloco tivesse sido cortado (number-entry Nível 3, cycles-intro,
    cycles-entry, qualquer corte por palavra de item-fronteira). **Esta era a
    causa raiz comum aos dois exemplos reportados — e por extensão, de
    QUALQUER bloco que passe por um split**, incluindo Triângulo da Vida/
    Arcanos (verificado: usa o MESMO packer, não tinha nada de errado
    ESPECÍFICO nesses blocos — a causa sempre foi aqui, no nível do packer).
    **Corrigido**: depois de colocar part1, mede sua altura REAL (pode ser
    menor que o orçamento usado no corte) e só fecha a página se part2
    REALMENTE não couber no espaço que sobrou — exatamente a mesma lógica já
    aplicada a qualquer bloco "normal" que seja o próximo da fila, agora
    também ao part2 resultante de um split. Como é uma correção no PACKER
    (não em cada tipo de bloco), vale automaticamente pra todos, presentes e
    futuros, sem precisar replicar a lógica em cada `case` do
    `splitBlockMeasured`.

19. **`PAGE_SAFETY_MM` 8mm → 3mm — a última "palavra órfã" numa linha que
    claramente tinha espaço** (2026-07-23, confirmado ao vivo pelo Guilherme
    com 2 exemplos: "duradouros." e "duradouras." sozinhas na folha de baixo,
    frase cortada 1 palavra antes do fim mesmo sobrando espaço visível na
    linha de cima — CONFIRMADO pelo Guilherme que esse é o ÚLTIMO problema de
    corte restante: "fora esse problema estão todos configurados
    perfeitamente"). Causa: o `PAGE_SAFETY_MM=8` (ponto 11 acima) foi um
    band-aid aplicado ANTES de eu achar a causa raiz real do bug de texto
    sumindo (dois CAMINHOS de medição divergentes — corrigido no ponto 12,
    `measureFullPx`). Depois daquele fix de raiz, os 8mm viraram puro
    desperdício: meu próprio comentário no código já admitia "perde-se ~1
    linha no pé da página" — é exatamente essa linha jogada fora, sempre, em
    TODA página, que o Guilherme via como "a última palavra corta pra baixo à
    toa". Reduzido pra 3mm: folga ainda suficiente pra variação real de fonte/
    sub-pixel, pequena demais pra descartar uma linha inteira que já caberia.
    **Se o detector de overflow em `DocumentPreviewStack` voltar a acusar
    corte depois disso**, a lição do ponto 12 vale de novo: investigar a causa
    raiz específica antes de simplesmente subir esse número — aumentar o
    número sem entender O QUÊ está errado só empurra o sintoma pra outro
    lugar (foi exatamente esse ciclo — 2 → 8 → agora 3 — que gerou os últimos
    2 problemas reportados nesta sessão).

20. **Consolidação: TODO corte por palavra passa pela MESMA função agora**
    (2026-07-23, resposta ao pedido direto do Guilherme: "revise as regras de
    todos os blocos... pra ter certeza que todos usam a mesma regra"). Achado
    ao auditar: mesmo depois do fix do ponto 19 (guarda de tamanho mínimo da
    continuação em `cutBoundaryText`), o caso "Resposta Subconsciente" (um
    `number-entry`) ainda cortava 1 palavra órfã — porque `number-entry`
    NUNCA CHAMAVA `cutBoundaryText`: tinha sua PRÓPRIA busca binária + corte
    por palavra DUPLICADA inline (Nível 1, corpo; Nível 3, definição), escrita
    ANTES de `cutBoundaryText` existir como função compartilhada, e nunca foi
    migrada. Essa cópia não tinha a guarda do ponto 19. Mesmo bug encontrado
    em `cycles-intro` (a seção-fronteira também tinha sua própria cópia
    duplicada). **Ambas migradas pra chamar `cutBoundaryText`** — agora é a
    ÚNICA função no arquivo que usa `wordCutOffsets`/`sliceTextByWords`/
    `markerBalanced` (confirmado por busca no código: essas 3 funções
    aparecem SÓ dentro de `cutBoundaryText`). Os 8 pontos de chamada
    confirmados: `number-entry` (corpo e definição — 2 chamadas), `timeline-
    entry` (Meses Pessoais), `dia-pessoal-entry` (guia), `triangulo-arcanos-
    lista`, `dias-favoraveis-entry`, `cycles-intro`, `cycles-entry`. Qualquer
    ajuste futuro na regra de corte por palavra (e a guarda de órfã) só
    precisa mudar em UM lugar — `cutBoundaryText` — e vale pra todos os
    blocos automaticamente.

23. **`PAGE_SAFETY_MM` VOLTOU pra 8mm** (3ª mudança nesta sessão) — reduzir
    pra 3mm (ponto 19) reabriu o bug de texto SUMINDO em blocos-lista longos
    (Dia Pessoal item "11" cortado no rodapé, sem continuar em nenhuma
    página — confirmado ao vivo). A causa do bug de "palavra órfã"
    (`duradouros.`) NUNCA foi o tamanho desta margem — foi a falta da guarda
    de tamanho mínimo em `cutBoundaryText` (pontos 19-20, independente deste
    número). As duas correções precisam coexistir: a margem evita sumiço em
    listas longas; a guarda evita órfã de 1 palavra. Este número já foi
    ajustado 3x na mesma sessão por suposições que não se confirmaram ao
    vivo — da próxima vez, investigar a causa antes de mexer nele.

24. **`conjugal-entry`: corte por GRUPO inteiro virou corte por NÚMERO dentro
    do grupo-fronteira** (resolve "Passivo 4, 5, 8" pulando o grupo INTEIRO
    mesmo se só 1 dos 3 números não coubesse). Corta em 2 níveis (mesmo
    padrão de `cycles-entry`): quantos GRUPOS inteiros cabem, depois quantos
    NÚMEROS do grupo-fronteira cabem. Novo campo `groupFullValues` (lista
    completa de cada grupo, estável através de re-splits — o cabeçalho
    "Passivo 4, 5, 8" continua listando todos os 3 números mesmo quando só
    1 renderiza nesta página) + `shownGroupHeaders` (não repete o cabeçalho
    do grupo na continuação).

25. **`triangulo-arcanos-lista`: card (parágrafo+círculos+legenda) virou 2
    peças independentes** (4º bloco com a mesma classe de bug do ponto 21 —
    "Linha do Tempo dos Arcanos" pulando inteira com o "Arcano Vigente"
    anterior deixando a folha quase em branco; o Guilherme pediu
    explicitamente pra preencher a folha de cima com o parágrafo, não só o
    título). O card (parágrafo+círculos+legenda) era medido como 1 candidato
    ÚNICO — se os círculos (podem ser dezenas, um por arcano da sequência
    completa de vida) empurravam o combo pra fora do orçamento, a seção
    INTEIRA pulava, mesmo o parágrafo leve (~2 frases) claramente cabendo
    sozinho. Agora 3 níveis: (1) card completo; (2) título + card com SÓ o
    parágrafo (`introOnly`), círculos+legenda deferidos JUNTOS pra
    continuação (`hideIntroText` — não repete o parágrafo, título nem os
    círculos aparecem sozinhos ali); (3) fallback, só o título
    (`titleOnly`/`hideTitle`, do ponto anterior).

26. **Medição dupla — protege contra leitura transitoriamente MENOR na 1ª
    passada** (`measureSingleBlock`, measure-document.tsx). Depois do fix do
    ponto 25, o Guilherme reportou (com print) que os CARDS de arcano em si
    (não o cabeçalho "Linha do Tempo") ainda cortavam o corpo inteiro — só o
    título "ARCANO 36: ÁS DE PAUS" aparecia, corpo NENHUM, e nada continuava
    na página seguinte. Hipótese: `document.fonts.ready` garante que fontes
    JÁ REQUISITADAS terminaram de carregar, mas não garante que um peso/
    estilo usado PELA PRIMEIRA VEZ num candidato específico (ex.: o `<strong>`
    do prefixo "Desafio:" — presente em TODO card de arcano) já esteja
    totalmente aplicado no PRIMEIRO layout pass — podendo dar uma leitura de
    altura transitoriamente MENOR que a real, subestimando "cabe inteiro?" e
    causando corte por overflow mesmo com margem de segurança alta. Corrigido
    de forma genérica (não é um band-aid de margem): toda medição agora lê a
    altura 2 VEZES (forçando um reflow no meio via `offsetHeight`) e usa a
    MAIOR das duas — cobre esta e qualquer outra fonte de discrepância
    transitória de layout, sem precisar identificar a causa exata em cada
    caso. Como isso está em `measureSingleBlock` (a função de medição de
    base, usada por TUDO — `measureFullPx`, `measureMM`, `cutBoundaryText`
    via os dois anteriores), vale automaticamente pra todo o documento.

27. **Teto de segurança do re-split recursivo: 8 → 40 iterações**
    (measure-document.tsx, `splitIntoPagesReal`). Depois do fix do ponto 26,
    o Guilherme reportou (com print, "Arcano 36") que o card em si AINDA
    cortava o corpo inteiro (só o título aparecia), mesmo em `triangulo-
    arcanos-lista` já tendo o "Nível 2.5" (introOnly/titleOnly) e a medição
    dupla. Comparado lado a lado com `dia-pessoal-entry` (confirmado
    funcionando) — a estrutura do split é IDÊNTICA; a diferença real é que a
    seção "Linha do Tempo dos Arcanos" tem 1 círculo por arcano de trânsito
    da VIDA INTEIRA da pessoa (pode ser dezenas, pra alguém mais velho),
    tornando `triangulo-arcanos-lista` um dos poucos blocos longos o
    suficiente pra precisar do LOOP RECURSIVO de re-split (quando o "resto"
    de um corte ainda excede 1 página inteira sozinho — `dia-pessoal-entry`
    raramente precisa dele, seu guia é sempre 11 itens fixos). Esse loop
    tinha um teto de segurança de só 8 iterações — quando esgotado (ou
    quando `splitBlock` retorna null pro "resto"), o fallback (`if
    (remainingH > PAGE_HEIGHT_PX...) pushPage(); currentPage.push(remaining)`)
    aceita DELIBERADAMENTE o overflow (comentário no código já admitia: "não
    elimina o overflow desse caso-limite, mas evita piorá-lo") — pra uma
    sequência de arcanos longa, esse teto podia esgotar antes de todos os
    cards serem posicionados, jogando o resto (cards ainda não cortados,
    inclusive o do meio de uma sequência) pra esse fallback que ACEITA
    overflow. Aumentado pra 40 — folga generosa pra sequências bem longas.
    **Atualização — causa raiz real encontrada e CONFIRMADA ao vivo** (ver
    ponto 28 abaixo). O teto de 40 é uma melhoria válida por si só, mas NÃO
    era a causa do "Arcano 36" — essa foi isolada por inspeção direta do DOM
    (Guilherme deu acesso ao navegador via Claude in Chrome).

28. **CAUSA RAIZ REAL do "Arcano 36" (e de todo "título sozinho, corpo
    sumindo" em `triangulo-arcanos-lista`) — encontrada por inspeção AO VIVO
    do DOM, não mais por suposição.** Instrumentação temporária (`console.warn`
    + `window.__debug*`) no packer e no split revelou os números exatos:
    `availableMM≈79.8mm`, mas os candidatos "leves" mediam MUITO mais do que
    deviam — `titleOnlyMM=152.6mm` (devia ser só um `<h3>`, ~15mm) e
    `introOnlyMM=182mm` (devia ser título+parágrafo curto, ~50mm). **A causa**:
    a lista de cards de interpretação (`<div>{arcanosUnicos.map(...)}</div>`,
    DocumentBlock.tsx) NUNCA era gated pelas flags `titleOnly`/`introOnly` —
    e `arcanosUnicos` é calculado a partir de `sequenciaCompleta` (que
    titleOnly/introOnly PRECISAM manter intacto, é o que alimenta os
    círculos), não de `arcanosInfo` (que ELES esvaziam pra `{}`). Resultado:
    mesmo com `arcanosInfo: {}`, os 8 cards RENDERIZAVAM DE QUALQUER JEITO,
    cada um caindo no `emptyFallback` ("Consulte um numerólogo...") por não
    achar seus dados em `arcanosInfo` — inflando um candidato que deveria ser
    "só o título" pra 152mm, maior que o espaço disponível (79.8mm). Como
    TODOS os níveis (`headerOnly`, `introOnly`, `titleOnly`) mediam grande
    demais por essa razão, `splitBlockMeasured` retornava `null` pra TODOS,
    e o bloco INTEIRO (título+parágrafo+círculos+8 cards, ~1221px) caía no
    fallback final do packer — que aceita overflow deliberadamente — sendo
    empurrado inteiro pra 1 única página, estourando o `overflow:hidden` por
    206px e cortando visualmente tudo que passava do limite (o "Arcano 36"
    SEM corpo era literalmente o card #7 de 8, cortado no meio pelo
    `overflow:hidden`, com o #8 "Arcano 61" nem aparecendo).
    **Corrigido**: a lista de cards agora é gated por `{!titleOnly &&
    !introOnly && (<div>...</div>)}`, igual ao cabeçalho "Interpretação de
    Cada Arcano" que JÁ tinha esse gate corretamente.
    **Confirmado ao vivo, reprodutível**: antes do fix, `.doc-content-flow`
    da página 24 tinha overflow de +206px (`scrollHeight 1192 vs
    clientHeight 986`) com os 8 cards + cabeçalho inteiro nela; depois do
    fix, ZERO páginas com overflow em todo o documento (26 páginas, era 27
    antes — o conteúdo que estourava agora se divide corretamente em 2
    páginas), "Linha do Tempo dos Arcanos" aparece logo abaixo de "Arcano
    Vigente 41" na MESMA página (exatamente o pedido original), e o texto
    do Arcano 36 aparece completo ("Aponta para conscientização da força
    interior...") em vez de só o título. Arcanos 47/61 mostram a mensagem
    de fallback — CONFIRMADO como lacuna de conteúdo real no banco (sem
    texto cadastrado pra esses 2 números), não mais um bug de paginação.

29. **O MESMO bug (ponto 28) também explicava o espaço desperdiçado e o
    "Arcano 61" repetido** — confirmado ao vivo, no MESMO acesso de DOM.
    `tryHeaderOnly`'s candidato (`makeWhole(0)`, usado pro Nível 2 antes de
    tentar `introOnly`) sofria do MESMO problema — `arcanosInfo:{}` mas SEM a
    flag `titleOnly`/`introOnly`, então os 8 cards fantasma TAMBÉM inflavam
    ESSE candidato, fazendo `headerOnly` falhar sempre (e, quando por acaso
    "coubesse" num contexto de página diferente, exibir cards com texto
    ERRADO — fallback — seguidos do card de verdade mais adiante = "Arcano
    61" aparecendo 2x). **Corrigido**: novo flag `hideCards` no candidato do
    `tryHeaderOnly`, e o gate da lista de cards + o heading "Interpretação de
    Cada Arcano" agora checam `!titleOnly && !introOnly && !hideCards`.
    **Confirmado ao vivo, reprodutível**: antes — "Arcano 61" aparecia 2x (1x
    como fallback vazio, 1x com texto real) e ~34-130mm+ de espaço vazio
    sobrando antes do rodapé da página com "Linha do Tempo dos Arcanos".
    Depois do fix — `arcano61Count: 1` (só a versão com texto real), espaço
    vazio residual caiu pra ~34mm (aceitável, não mais quase a página
    inteira).

30. **Tentativa de "devolver margem" pro corte por palavra — TESTADA AO VIVO
    e REVERTIDA** (2026-07-23). Hipótese: `PAGE_SAFETY_MM=8` (que protege a
    decisão "cabe a lista INTEIRA?" contra acúmulo de erro em blocos-lista
    longos) também limitava, sem necessidade, o corte por PALAVRA em
    `cutBoundaryText` — que já é uma medição PRECISA de 1 candidato só, sem o
    mesmo risco de acúmulo. Reportado ao vivo (Guilherme, "Junho 8": a linha
    "com determinação e aproveite" visivelmente não alcançava a margem
    direita, mas ainda assim empurrava a frase seguinte inteira pra próxima
    página). Implementei `CUT_MARGIN_REFUND_MM=5` somado ao orçamento SÓ
    dentro de `cutBoundaryText`. **Testado ao vivo**: NÃO mudou o ponto de
    corte do "Junho 8" (mesmo resultado), e introduziu overflow NOVO, real,
    embora pequeno, em 2 outras páginas (+5px e +6px — Meses Pessoais em
    outro trecho). Como o risco (overflow real, ainda que pequeno) supera o
    benefício (que nem se confirmou), **revertido por completo**. Fica
    registrado que essa hipótese específica NÃO é a explicação do "Junho 8"
    — a causa raiz desse caso pontual continua em aberto; qualquer tentativa
    futura de mexer nessa margem específica deve ser TESTADA AO VIVO (agora
    que há acesso ao DOM real via Claude in Chrome) antes de ficar, dado que
    2 hipóteses diferentes sobre essa margem já se mostraram erradas nesta
    mesma sessão.

31. **Remoção completa da "guarda de viúva" (mínimo de palavras na
    continuação) em `cutBoundaryText`** (2026-07-23/2026-07-25, pedido
    EXPLÍCITO e repetido do Guilherme: "não é pra ter essa regra
    'MIN_SPLIT_WORDS'... em nenhum bloco"). Contexto: a guarda existia pra
    evitar que a continuação de um bloco cortado ficasse com poucas
    palavras "órfãs" — mas os exemplos ao vivo ("Junho 8", "Motivação")
    mostraram que ela SEMPRE pulava pro mesmo limiar fixo (6 palavras),
    sacrificando texto que já cabia na linha de cima só pra manter esse
    piso artificial, mesmo quando a fila natural (o que a busca binária já
    tinha medido que cabia) deixaria só 1-2 palavras órfãs. O problema que a
    guarda tentava resolver (órfã sozinha desperdiçando uma página inteira)
    já tinha sido resolvido de forma independente pelo fix do packer (item
    anterior desta sessão: `part2` agora é medido de verdade e só cria
    página nova se realmente não couber) — tornando a guarda pura perda sem
    benefício. **Corrigido**: `cutBoundaryText` agora usa `wc = best`
    diretamente (o resultado exato da busca binária), sem nenhum ajuste de
    mínimo do lado da continuação — `MIN_SPLIT_WORDS` permanece só como
    piso do PREFIXO (não vale a pena tentar cortar um texto com 6 palavras
    ou menos) e como limite de segurança do `while` que ajusta pra não
    quebrar marcadores markdown no meio.
    **1ª tentativa (2026-07-23)**: removida por completo, mas o teste ao
    vivo mostrou o preview travado em "Montando preview..." por 80+
    segundos (vs. 15-30s normal) em várias abas novas — mesmo depois de
    reduzir o teto de re-split recursivo de 40→20. Sem conseguir confirmar
    o mecanismo exato só lendo código, e dado o risco (app aparentemente
    travado), decisão unilateral de reverter pra um piso pequeno
    (`MIN_SUFFIX_WORDS = 2`) como compromisso de segurança, pedindo ao
    Guilherme pra reiniciar o servidor de dev (descartar fadiga de
    sessão/HMR como fator).
    **2ª tentativa (2026-07-25), com dados objetivos**: Guilherme reiniciou
    o ambiente e pediu explicitamente pra tentar de novo, confirmando que
    ainda via corte por palavra com o piso de 2 e mandando remover
    "somente essa possibilidade, mantenha os outros splits". Reaplicada a
    remoção total, desta vez com instrumentação temporária de
    `performance.now()` em volta de `splitIntoPagesReal` (dentro de
    `useMeasuredPages`) pra medir objetivamente em vez de julgar pelo
    tempo de espera subjetivo. **Confirmado ao vivo**: `splitIntoPagesReal`
    levou 2601ms pra 26 páginas — nada perto dos 80s+ observados antes,
    confirmando que a lentidão da 1ª tentativa era ambiental (fadiga do
    servidor de dev depois de muitas horas de HMR), não causada pela
    remoção da guarda. Zero páginas com overflow em todo o documento. Os
    dois casos relatados originalmente ficaram assim: "Motivação" agora
    corta em "...transformando o seu talento em obras sólidas e" (só
    "duradouras." vai pra próxima página, 1 palavra órfã, era 6 antes) e
    "Junho 8" corta em "...aproveite a energia favorável para avanços"
    (só "significativos." vai pra próxima página, 1 palavra órfã, era 6
    antes) — em ambos os casos a página anterior fica com `scrollHeight ===
    clientHeight` (encaixe exato, zero desperdício). Instrumentação de
    timing removida depois de confirmado (não deixar debug code em
    produção).

32. **CAUSA RAIZ da "palavra órfã sozinha no topo da página seguinte" —
    `duradouras.` / `significativos.`** (2026-07-25, resolve DEFINITIVAMENTE
    os dois casos registrados no ponto 31). Sintoma relatado pelo Guilherme
    com prints: a última linha da página de cima termina no meio da largura
    (espaço horizontal de sobra evidente), e ainda assim UMA única palavra é
    empurrada pro topo da página seguinte.

    **Causa raiz — duas medidas DIFERENTES do MESMO bloco decidindo coisas
    diferentes** (a mesma classe de bug do ponto 12, num lugar novo):

    | decisão | medida usada | inclui `marginBottom`? |
    |---|---|---|
    | "o bloco cabe na página?" | `measureFullPx` | **sim** (`DOC_GAP` = 28px) |
    | "onde cortar o bloco?" | `measureMM` → `cutBoundaryText` | **não** |

    A `marginBottom` é espaço MORTO no pé da página (fica embaixo da última
    linha, encostando no rodapé) — por isso o corte a desconta, corretamente.
    Só que isso abre uma **janela de 28px** (maior que uma linha de
    `11px × 1.8` = 19.8px) em que o bloco "não cabe" pela 1ª conta mas o
    texto INTEIRO cabe pela 2ª.

    Dentro dessa janela, a busca binária de `cutBoundaryText` conclui que
    TODAS as palavras cabem — mas o teto dela é `hi = offs.length - 1`, ou
    seja, ela **nunca pode devolver o texto inteiro**. O melhor corte
    possível vira "tudo menos a última palavra", e essa palavra é despejada
    sozinha na próxima página. Isso explica exatamente por que a órfã era
    sempre de **1 palavra** e por que a página de cima ficava com
    `scrollHeight === clientHeight` (ponto 31): não havia overflow nenhum —
    o que "ocupava" o pé da página era a margem de 28px, invisível.

    **Correção** (`splitIntoPagesReal`, `measure-document.tsx`): antes de
    chamar `splitBlock`, testar o bloco INTEIRO com a MESMA medida que o
    corte usa (`excludeTrailingMargin = true`). Se ele cabe (`tailFitPx <=
    availablePx`), não há nada a cortar — o bloco inteiro fica na página e a
    página é fechada.

    Por que é seguro e por que NÃO mexe na paginação já quase perfeita:
    - a comparação é sobre o bloco TODO (não sobre `part1`), então a altura
      aprovada é literalmente a que vai ser renderizada — zero risco de
      overflow, e o orçamento ainda tem `PAGE_SAFETY_MM` de folga por cima;
    - só dispara dentro da janela de 28px descrita acima; qualquer bloco que
      genuinamente estoure a página segue pelo caminho antigo (`MIN_REMAIN_PX`
      → `splitBlock`) sem nenhuma alteração;
    - é mais RÁPIDO quando acerta: pula o `splitBlock` inteiro (com todas as
      medições React off-screen da busca binária) e gasta 1 medição só —
      importante depois do episódio de lentidão do ponto 30.

    **Não confundir com o ponto 30** (tentativa revertida): aquilo dava um
    "troco" da margem de segurança PRO PONTO DE CORTE, chamando `splitBlock`
    mais vezes (→ travamento de 60s+). Este fix faz o oposto — evita o
    `splitBlock` quando não há o que cortar.

    **Correção de documentação**: o comentário de `PAGE_SAFETY_MM`
    (`measure-document.tsx`) e o ponto 23 afirmavam que a órfã fora resolvida
    por uma "guarda de tamanho mínimo na continuação" em `cutBoundaryText`.
    Isso está errado em duas frentes: essa guarda foi REMOVIDA a pedido
    (ponto 31) e, mesmo quando existia, guardava só o PREFIXO (`part1`),
    nunca a continuação. Comentário corrigido in loco — `PAGE_SAFETY_MM`
    continua em 8mm e **não** deve ser mexido por causa de órfã.

33. **A MESMA correção do ponto 32 aplicada ao `part2` e ao loop de re-split —
    TENTADA E REVERTIDA** (2026-07-25). Depois do ponto 32 resolver a órfã
    `duradouras.` (`number-entry`, caminho principal), a órfã
    `significativos.` (**Meses Pessoais**, um `timeline-entry`) CONTINUOU —
    porque ela nasce noutro ramo do paginador. "Junho 8" é o ÚLTIMO item do
    bloco, e o resto do bloco chega ali como `part2` / `remaining`, onde as
    decisões "cabe numa página?" também comparavam a altura COM `marginBottom`
    contra o orçamento (linhas do `if (part2Height > PAGE_HEIGHT_PX)` e do
    `while`).

    Aplicar ali a mesma medida sem-margem **causou REGRESSÃO confirmada ao
    vivo** (print do Guilherme): o guia do **Dia Pessoal** voltou a ser
    CORTADO no rodapé — o item "11" clipado no meio da frase e os itens
    seguintes perdidos, com o bloco seguinte (Dias Favoráveis) começando
    normalmente na página de baixo.

    **Por que regride** (e por que este ramo é diferente do ponto 32): ao
    reclamar os 28px aqui, um pedaço de **lista longa** passa a ocupar a
    página INTEIRA em vez de ser fatiado em duas. Listas longas são
    exatamente as que a medição SUBESTIMA — é a razão de `PAGE_SAFETY_MM`
    existir e valer 8mm (pontos 11 e 23). Enquanto o pedaço era fatiado, cada
    metade tinha folga de sobra e o erro de medição não aparecia; usando o
    orçamento cheio, o erro estoura o `overflow:hidden`. O ponto 32 não tem
    esse problema porque só admite um bloco que cabe INTEIRO (e fecha a
    página em seguida), sem mudar como listas longas são fatiadas.

    **Estado atual**: revertido — `part2` e o loop de re-split voltaram a usar
    a altura CHEIA. A órfã `significativos.` **continua existindo**; é o preço
    consciente de não perder texto. Texto sumindo é muito pior que uma palavra
    órfã.

    **Pré-requisito pra resolver de verdade**: atacar a causa de
    `PAGE_SAFETY_MM` — a subestimação da altura de blocos-lista longos. Só
    depois que a medição de lista longa for confiável dá pra reclamar os 28px
    neste ramo com segurança. Não repetir esta tentativa antes disso.

    **Verificação usada** (repetir antes de mexer aqui de novo): detector de
    overflow que renderiza CADA página produzida por `splitIntoPagesReal` e
    compara a altura real contra a área FÍSICA da folha (`MAX_PAGE_HEIGHT_MM
    * PX_PER_MM` = 986px) — não contra o orçamento com margem de segurança.
    20 combinações (filler × Meses 12/24/30 itens × Dia Pessoal) fecharam com
    **zero páginas em overflow** no estado revertido. A varredura palavra a
    palavra do `number-entry` (795-815) confirma que o fix do ponto 32 segue
    valendo: 795-808 numa página só, 809 é a fronteira física real.

## Refatoração: UMA regra de paginação para todos os blocos (2026-07-25/26)

**Decisão de arquitetura** (pedido do Guilherme): "manter uma regra geral para
todos os blocos e não uma regra para cada bloco diferente — isso torna mais
difícil a manutenção e fica mais vulnerável à personalização e mudança de
textos, pois teria que alterar também toda a regra".

Diagnóstico: os bugs desta feature (órfã de 1 palavra, texto sumindo, espaço
desperdiçado) não são independentes — são sintomas de **cada tipo de bloco ter
seu próprio código de corte**. Blocos COMPOSTOS (`dia-pessoal-entry`,
`timeline-entry`, `dias-favoraveis-entry`, `triangulo-arcanos-lista`) empacotam
título + intro + N itens num único elemento, e por isso exigem um splitter
dedicado cada um.

**Solução: uniformizar os DADOS para a regra poder ser uniforme.** Um composto
vira um `group` cujos filhos são a MESMA unidade atômica das entradas de
Personalidade (`number-entry`).

Duas propriedades do código já existente tornam isso barato — ambas verificadas
antes de mexer:
1. `applyBlockOrder` endereça **um id por entrada de config** (`dia_pessoal` →
   `num-dia`). Se o composto virasse vários blocos SOLTOS, os extras cairiam na
   "safety net" e a ordenação quebraria — por isso o invólucro `group` é
   essencial, não cosmético.
2. `flattenDocumentBlocks` **já recursa** em `group`, então a sequência chega
   plana ao paginador sem nenhuma alteração nele.
Resultado: **zero migração de `block_order` salvo, zero mudança na tela
/app/blocos.**

### Estágio 1 — Dia Pessoal (CONCLUÍDO)

`num-dia` deixou de ser `dia-pessoal-entry` e passou a ser um `group` com:
- `num-dia-hoje` — `number-entry` (destaque de hoje, `accent: 'coral'` =
  `theme.primaryColor`, igual ao render antigo);
- `num-dia-guia-head` — `section-heading` `variant: 'sub'` (h3 + instrução);
- `num-dia-guia-<n>` — um `number-entry` `variant: 'compact'` por número do guia.

Duas variantes NOVAS e ADITIVAS nos renderers (nenhum bloco existente muda):
- `number-entry` + `variant: 'compact'` — reproduz exatamente o item do guia
  (coluna 28px, número 16px), então **o documento não mudou de aparência**;
- `section-heading` + `variant: 'sub'` + `instrucaoTexto`;
- `number-entry` + `useTitulo` — usa o `titulo` do bloco mesmo havendo
  definição, preservando a linha "Hoje: Dia Pessoal N — …". Sem o flag, o
  comportamento é o de sempre (`"Label: N"`).

**Código apagado** (era a fonte dos bugs de Dia Pessoal): o tipo
`dia-pessoal-entry`, seu `case` de render (~89 linhas), seu ramo em
`splitBlockMeasured` (~50 linhas), seu ramo heurístico (~36 linhas) e suas duas
funções de estimativa de altura.

**Verificação** (probe temporário + detector de overflow contra a área FÍSICA
da folha, `MAX_PAGE_HEIGHT_MM * PX_PER_MM` = 986px): 10 deslocamentos de filler
(0→720 palavras), fazendo a quebra cair em pontos diferentes do guia —
**perda de texto = 0 chars e páginas com overflow = 0 em todos**, medido antes
e depois da remoção do código morto.

### Estágio 2 — Meses Pessoais (CONCLUÍDO)

`meses-pessoais` deixou de ser `timeline-entry` e virou um `group` com:
- `meses-pessoais-head` — `section-heading` (`hideRule: true`, pois o render
  antigo não tinha a barrinha de destaque);
- `meses-pessoais-grade` — `summary-grid` (a "visão geral dos 12 meses");
- `meses-pessoais-<i>` — um `number-entry` `variant: 'compact'` por mês.

Novidades ADITIVAS nos renderers:
- `number-entry` compact ganhou `rotulo` — **parametriza** as duas
  apresentações de item em vez de criar um segundo tipo: sem `rotulo`, coluna
  de 28px só com o número (guia de Dias Pessoais); com `rotulo`, coluna de 90px
  com "ABRIL 6" (meses, dias favoráveis). Larguras/gaps são os dos renders
  originais — o documento não mudou de aparência;
- `number-entry` compact ganhou `emptyFallback` (a mensagem de "sem texto" é
  específica de cada lista: "deste mês", "deste dia"…);
- `section-heading` ganhou `instrucaoTexto` e `hideRule` (aditivos: nenhum
  cabeçalho existente os define);
- novo tipo `summary-grid` — grade "de relance". É **atômico** (nunca se
  divide), então existir como tipo próprio não acrescenta NADA ao paginador: a
  regra de corte continua única para os blocos que de fato fluem.

**Código apagado**: tipo `timeline-entry`, seu `case` de render (~65 linhas),
seu ramo em `splitBlockMeasured` (~61), seu ramo heurístico (~33) e seus dois
estimadores de altura (~20).

### Estágio 3 — Dias Favoráveis (CONCLUÍDO)

`dias-favoraveis` deixou de ser `dias-favoraveis-entry` e virou um `group`:
`section-heading` + `summary-grid` (`variant: 'chips'`, as pílulas estreitas) +
um `number-entry` compact (`rotulo: 'Dia'`) por dia. O layout de item é
idêntico ao dos Meses, então reusou exatamente o mesmo `variant`/`rotulo` — sem
nenhum código novo de apresentação.

**Código apagado**: tipo `dias-favoraveis-entry`, seu `case` de render (~75
linhas), seu ramo em `splitBlockMeasured` (~73) e seus dois estimadores (~22).

**Verificação dos estágios 2 e 3** (mesmo detector de overflow contra a área
FÍSICA da folha): 17 deslocamentos de filler (0→1200 palavras) com os TRÊS
grupos juntos na ordem real do documento (Meses → Dia Pessoal → Dias
Favoráveis), fazendo a quebra cair em pontos diferentes de cada lista —
**perda de texto = 0 chars e páginas com overflow = 0 em todos os 17**.

### Estágio 4 — Cármicos + correção de fidelidade visual (CONCLUÍDO)

`multi-number-entry` (Lições Cármicas, Débitos Cármicos, Tendências Ocultas)
virou o helper `numListGroup(...)`, que devolve um `group` com:
`section-heading variant:'entry'` + um `number-entry` CHEIO por número. Os itens
do composto antigo já eram, pixel a pixel, a mesma entrada de Motivação/
Expressão (badge 72px + linha de título + texto) — então aqui não houve
nenhuma variante nova de apresentação, só reuso.

Novidades: `plain-text` (parágrafo solto, atômico) para o caso "mapa sem nenhum
débito cármico", que antes era um ramo `semTexto` dentro do composto.

**BUG DE FIDELIDADE CORRIGIDO (achado neste estágio, introduzido nos estágios
2-3):** os cabeçalhos de Meses Pessoais e Dias Favoráveis foram convertidos
para `section-heading` padrão, cujo h2 é `700 / letterSpacing .1em / SEM caixa
alta / margin 0 0 8px`. Mas o h2 que viviam dentro dos compostos era
`800 / .08em / uppercase / margin 0 0 16px`. Ou seja: a afirmação "o documento
não mudou de aparência" estava errada para esses dois títulos — saíam mais
leves, sem caixa alta e com metade do espaço abaixo.
Corrigido com `section-heading variant: 'entry'`, que reproduz exatamente o h2
dos compostos (e nunca desenha a barrinha de destaque — ela é marca de título
de SEÇÃO). O flag `hideRule`, criado no estágio 2 como paliativo, foi removido.

Passa a haver três apresentações de cabeçalho, todas atômicas e explícitas:
| variante | uso | h2/h3 |
|---|---|---|
| (ausente) | título de SEÇÃO | h2 700 + barrinha |
| `entry` | cabeçalho de entrada/lista | h2 800 uppercase |
| `sub` | cabeçalho interno de lista | h3 11px |

**Código apagado**: tipo `multi-number-entry`, seu `case` de render (~91
linhas), seu ramo em `splitBlockMeasured` (~50), seu ramo heurístico (~33) e
seus dois estimadores (~20).

**Verificação**: 21 deslocamentos (0→1500 palavras) com CINCO grupos juntos
(Lições, Débitos-vazio, Tendências, Meses, Dia Pessoal) — **0 chars perdidos e
0 páginas com overflow em todos**.

### Estágio 5 — Todos os Arcanos (CONCLUÍDO)

`triangulo-arcanos-lista` era o composto mais complexo do arquivo: subtítulo +
caixa da cronologia (parágrafo + esferas + legenda) + h2 + N cards, com um
splitter que precisava de QUATRO modos de render (`titleOnly`, `introOnly`,
`hideIntroText`, `hideCards`) só para conseguir separar a caixa das esferas dos
cards. Virou um `group` de quatro peças independentes:
- `arcanos-linha-head` — `section-heading variant:'sub' tone:'h3'`;
- `arcanos-linha` — novo tipo `arcanos-timeline`, **atômico** (as esferas só
  fazem sentido junto da legenda);
- `arcanos-cards-head` — `section-heading variant:'entry'`;
- `arcano-<n>` — um `number-entry variant:'plain'` por arcano.

Duas novidades:
- `number-entry variant: 'plain'` — entrada SEM badge de número (linha de
  título + texto). `highlight` marca "(Ativo no Presente)";
- `section-heading variant:'sub'` ganhou `tone: 'h3'` — os dois subtítulos que
  existiam nos compostos usavam cores diferentes (guia de Dias Pessoais em
  `primaryColor`, linha do tempo dos Arcanos em `h3Color`); as duas foram
  mantidas.

**A órfã do Arcano 74 foi resolvida na estrutura, não no paginador**: o
"Desafio:" era um `<p>` separado e atômico no fim do card — por isso migrava de
página junto com uma palavra solta ("bem."). Agora é markdown do próprio texto
(`**Desafio:** …`), então flui e se corta como qualquer parágrafo.

**Código apagado**: tipo `triangulo-arcanos-lista`, seu `case` de render (~169
linhas), seu ramo em `splitBlockMeasured` (~92), seu ramo heurístico (~39) e
seus dois estimadores (~22).

**Ajuste visual pedido pelo Guilherme**: o título "Triângulo da Vida
(Pirâmide)" era um h3 de 11px em `h3Color`, destoando dos títulos de mesmo
nível hierárquico. Passou a usar o mesmo h2 de "Harmonia Conjugal" / "Débitos
Cármicos" (15px / 800 / uppercase / `h2Color`).

**Verificação**: 21 deslocamentos (0→1500 palavras) com Meses + Arcanos (16
arcanos, 13 únicos) — **0 chars perdidos e 0 páginas com overflow em todos**.

### Estágio 6 — Harmonia Conjugal (CONCLUÍDO)

`conjugal-entry` tinha o splitter de DOIS níveis do arquivo: quantos grupos
inteiros cabem, depois quantos números dentro do grupo-fronteira — mais
`groupFullValues` (pro cabeçalho "Passivo 4, 5, 8" continuar listando todos os
números mesmo com o grupo cortado) e `shownGroupHeaders` (pra não repetir
cabeçalho na continuação). Virou o helper `conjugalGroup(...)`: cabeçalho
`entry` + a linha "Harmonia Conjugal: N" (`sub tone:'h3'`) +, por grupo, um
`sub` com o rótulo e um `number-entry variant:'compact'` por número. Toda a
maquinaria de dois níveis deixou de ser necessária.

**BUG DE ESPAÇAMENTO CORRIGIDO (introduzido no estágio 1, achado aqui):** a
variante `sub` tinha margens fixas (`h3 margin 0 0 10px` + wrapper 4/16px), mas
cada rótulo tinha o SEU espaçamento no composto de origem — 8px nos grupos
conjugais, 10px no guia de Dias Pessoais, 16px na linha do tempo dos Arcanos.
Como os rótulos agora são blocos IRMÃOS (e não filhos de um flex com `gap`), o
espaçamento passou a vir explicitamente de `spaceBefore`/`spaceAfter`. Sem
isso, o subtítulo dos Arcanos saía com 26px em vez de 16px de respiro.

**Lição recorrente desta refatoração**: converter um flex com `gap` numa
sequência de blocos irmãos TRANSFERE a responsabilidade do espaçamento do pai
para cada filho. Toda vez que isso foi feito sem olhar o `gap` original, o
espaçamento saiu errado — aconteceu 3 vezes (h2 nos estágios 2-3, `sub` aqui).
Ao converter o próximo composto, conferir o `gap` do flex de origem ANTES.

**Código apagado**: tipo `conjugal-entry`, seu `case` de render (~76 linhas),
seu ramo em `splitBlockMeasured` (~86) e seu estimador (~4).

**Verificação**: 21 deslocamentos (0→1500 palavras) com Harmonia Conjugal (4
grupos, 8 números) + Arcanos — **0 chars perdidos e 0 overflow em todos**.

### Estágio 7 — Ciclos de Vida (CONCLUÍDO)

`cycles-entry` era um composto de até 4 cards (Regente do Ciclo + Desafio +
1-2 Momentos Decisivos) num elemento só, com `headerOnly` e `boundaryCutKey`
no splitter pra decidir qual card cortar e qual rótulo esconder na continuação.
Virou o helper `cicloGroup(...)`: `cycle-header` (atômico) + um `number-entry`
CHEIO por card.

Conversão 1:1, sem ajuste de espaçamento — conferido ANTES desta vez (ver a
lição do estágio 6): cada card já era pixel a pixel um `number-entry` cheio, e
o flex que os separava usava `gap: 28`, exatamente o `DOC_GAP` que um
`number-entry` já traz de margem.

Novidades:
- `cycle-header` — título + período de um ciclo, atômico;
- `number-entry` ganhou `subtitulo` — a linha cinza secundária sob o título
  (ex.: "Período: 2018 a 2027 (de 28 a 37 anos)" dos Momentos Decisivos).
  Aditivo: sem ele nada muda.

Os três blocos do builder, que somavam ~80 linhas de `data` repetitivo, viraram
três chamadas de `cicloGroup` com helpers locais (`ciclo`/`desafio`/`momento`/
`idades`) que eliminaram a repetição de `interp[...]?.titulo || fallback`.

**Ajuste visual pedido pelo Guilherme**: o período do ciclo ficava à DIREITA do
título, na mesma linha. Passou para uma linha própria logo abaixo (`marginTop:
4`), mantendo a fonte menor e discreta — títulos longos deixam de disputar
espaço horizontal com ele.

**Código apagado**: tipo `cycles-entry`, seu `case` de render (~355 linhas — o
maior do arquivo, quatro grids quase idênticos repetidos), seu ramo em
`splitBlockMeasured` (~64) e seu estimador (~6).

**Verificação**: 21 deslocamentos (0→1500 palavras) com os TRÊS ciclos (10
cards no total, incluindo os dois com `subtitulo` de período) — **0 chars
perdidos e 0 overflow em todos**.

### Estágio 8 — Definições dos Ciclos + Pirâmide (CONCLUÍDO)

Os dois últimos compostos:

`cycles-intro` (as 3 definições gerais — Ciclos de Vida / Desafios / Momentos
Decisivos, com um splitter que cortava por seção e, na seção-fronteira, por
linha) virou um `group` de 3 `section-heading variant:'def'` (h3 13px Poppins +
citação colada). `spaceAfter` reproduz o `gap: 20` do flex; a última seção
recebe 28, que era a margem herdada do wrapper.

`triangulo-piramide` (título + grade + N cards de bloqueio, com corte de 2 vias)
virou um `group` de: `section-heading variant:'entry'` + `piramide-grid`
(atômico) + um `alert-card` por bloqueio — ou um `plain-text` quando não há
bloqueios.

**BUG DE ORDENAÇÃO EVITADO**: `applyBlockOrder` mantinha o título e as
definições gerais no topo da seção via uma lista de TIPOS fixos
(`fixedTypes`), e `cycles-intro` era um deles. Ao virar `group`, ele deixaria
de ser reconhecido, cairia na "safety net" e seria empurrado para o FIM da
seção — as definições apareceriam DEPOIS do 3º Ciclo. Corrigido com uma
marcação explícita no bloco (`fixed: true`), que não depende do tipo.

**Código apagado**: tipos `cycles-intro` e `triangulo-piramide`, seus dois
`case` de render (~45 + ~90 linhas), seus ramos em `splitBlockMeasured` (~50 +
~12), o ramo heurístico da pirâmide (~25) e três estimadores (~29).

**Verificação**: 26 deslocamentos (0→1500 palavras) com os três grupos —
**0 chars perdidos e 0 overflow em todos**.

### Estado final da refatoração

`splitBlockMeasured` ficou com **um único cliente**: `number-entry`. Todos os
oito tipos COMPOSTOS foram eliminados; o que resta são unidades atômicas
(`section-heading`, `summary-grid`, `plain-text`, `arcanos-timeline`,
`cycle-header`, `piramide-grid`, `alert-card`, cards de arcano regente/vigente)
e a única unidade que FLUI, o `number-entry` — em quatro apresentações
(cheia / `compact` / `plain` / continuação) que compartilham o MESMO caminho de
corte.

Isso era o pré-requisito do estágio 9: com um só tipo fluindo, o motor de
quebra por posição renderizada (`Range` + `getBoundingClientRect`) substitui o
`splitBlockMeasured` inteiro sem precisar de um caminho por tipo.

### Estágio seguinte

9. Trocar o núcleo do paginador pelo motor de
   **quebra por posição renderizada** (`Range` + `getBoundingClientRect`, a
   técnica do `textBreak` do Paged.js — ver ponto 34) e apagar o restante do
   código de corte (`splitBlockMeasured`, `cutBoundaryText`, `measuredMaxFit`,
   `splitItemsMeasured`, `tryHeaderOnly`, ~900 linhas).

As órfãs de 1 palavra morrem no estágio 4 por construção; os estágios 1-3 já
eliminam os bugs específicos de cada composto porque o código que os causava
deixa de existir.

34. **Spike do Paged.js como motor — MEDIDO E DESCARTADO** (2026-07-25).
    Antes de reimplementar a técnica, testamos adotar a biblioteca de
    referência ([pagedjs](https://github.com/pagedjs/pagedjs), MIT) com os
    blocos REAIS deste projeto:

    | cenário | páginas | tempo | texto perdido | overflow |
    |---|---|---|---|---|
    | 6 blocos | 4 | 228ms | **0 de 6.969 chars** | 0 |
    | 30 blocos | 16 | 1.509ms | **2.216 de 34.845 chars (6%)** | 0 |

    Perdeu 6% do texto num documento realista (dentro do guia do Dia Pessoal) —
    justamente a propriedade pela qual valeria adotá-lo. Testada e DESCARTADA a
    hipótese de que a causa era o `break-inside: avoid` dos nossos renderers: o
    resultado saiu byte a byte idêntico com o override aplicado.

    Outras incompatibilidades medidas: (a) depende de `requestAnimationFrame` —
    em aba oculta o rAF não dispara e a paginação **trava indefinidamente**
    (precisou de shim com `MessageChannel` só pra medir); o motor atual é
    síncrono e imune; (b) toma conta do DOM, o que obrigaria cabeçalho/rodapé/
    marca d'água/numeração (hoje React + `DocTheme`) a virarem `@page` margin
    boxes — ou seja, o sistema de TEMPLATES seria a parte mais arriscada da
    migração.

    **Conclusão: adotar a TÉCNICA, não a biblioteca.** A dependência foi
    desinstalada e o projeto restaurado (as 5 vulnerabilidades `npm audit` são
    pré-existentes: postcss, react-router, react-router-dom, vite, ws).

### Nota de processo (2026-07-23): a diferença entre "parece certo" e "está certo"

Esta sessão teve VÁRIAS rodadas de "acho que é X" → implementa → Guilherme
reporta que não resolveu → nova hipótese. O que finalmente resolveu o caso
mais teimoso ("Arcano 36" sem corpo, pontos 28-29) foi abandonar a
especulação e usar acesso DIRETO ao navegador (Claude in Chrome, com login
do Guilherme) pra instrumentar o código com `console.warn`/`window.__debug*`
temporários e ler os números REAIS que o app calculava — revelando em
segundos uma causa (candidatos "leves" inflados por cards fantasma) que
dezenas de linhas de raciocínio estático não haviam encontrado. Padrão pra
próximas sessões com sintomas parecidos: se uma hipótese de causa raiz não
puder ser confirmada por leitura de código em ~2-3 tentativas, PARAR de
especular e pedir acesso ao navegador pra medir de verdade — é
categoricamente mais rápido e mais confiável.

21. **"Nível 2.5" faltando em `number-entry`: a definição INTEIRA nunca era
    testada antes de cortá-la por palavra** (2026-07-23, resolve o caso
    "Resposta Subconsciente" reportado DEPOIS do ponto 20 — o Guilherme notou
    que agora cortava uma FRASE inteira à toa, com MUITO espaço visível
    sobrando acima do rodapé: "há algum espaçamento invisível ocupando esse
    espaço"). Causa raiz: o Nível 2 ("só-cabeçalho") testa um candidato que
    junta definição COMPLETA + a CAIXA DO NÚMERO (72px, borda, padding) — se
    esse combo não coubesse (por causa do peso do número, não da definição em
    si), o código pulava DIRETO pro Nível 3 (corte por palavra), sem nunca
    testar se a definição INTEIRA, SOZINHA (sem a caixa do número — que o
    render `defHeadOnly` nem desenha), já cabia perfeitamente. Corrigido:
    novo teste intermediário — `defHeadOnly` com a definição INTACTA (sem
    cortar nada) — antes do corte por palavra. Só cai no corte por palavra se
    NEM a definição inteira sozinha couber.

22. **`multi-number-entry` (Lições/Débitos Cármicos, Tendências Ocultas) não
    tinha NENHUM dos dois mecanismos** (corte de texto do item-fronteira,
    nem só-cabeçalho) — só dividia por item INTEIRO. Era o único bloco-lista
    ainda nessa condição depois da varredura pedida pelo Guilherme ("revise
    as regras de todos os blocos... pra ter certeza que todos usam a mesma
    regra"). Adicionado: mesmo `cutBoundaryText` no item-fronteira + mesmo
    `tryHeaderOnly` (rótulo+definição sozinhos) dos demais blocos-lista, com
    o mesmo `isTextContinuation` no render pra não repetir o rótulo
    "Lição Cármica: N"/"Débito Cármico: N"/"Tendência Oculta: N" na
    continuação.

8. **ARMADILHA crítica — fallback silencioso pra heurística**: se
   `splitIntoPagesReal` (ou qualquer função de medição que ela chama) LANÇAR uma
   exceção, `useMeasuredPages` cai no `catch` e re-pagina TUDO com a heurística
   antiga (`splitIntoPages`) — que subestima blocos e reintroduz gaps, repetição
   de título nas continuações e corte/perda de texto. Ou seja: um erro de runtime
   em QUALQUER ponto da medição regride o documento INTEIRO de uma vez, sem
   mensagem visível pro usuário (só um `console.error`). Aconteceu ao trocar o
   `createMeasureContainer` sem atualizar os dois pontos de limpeza
   (`document.body.removeChild(container)` passou a lançar porque o container
   virou o div interno). Regra: qualquer mudança em `measure-document.tsx` tem de
   manter TODAS as funções de medição sem exceção — e o `catch` do
   `useMeasuredPages` deve ser tratado como sinal de bug, não como fallback
   aceitável.

9. **Continuações sem repetir título** (referência = `number-entry`, que já fazia
   certo): além de `timeline-entry`/`dias-favoraveis-entry`, agora
   `dia-pessoal-entry` (não repete "Guia de Dias Pessoais" nem a instrução) e
   `triangulo-piramide` (continuação com `linhas=[]` não redesenha a caixa vazia
   da pirâmide nem o título) também escondem o cabeçalho na continuação.
   `triangulo-arcanos-lista` já escondia (via `sequenciaCompleta` ausente).

10. **Container de medição = réplica da folha**: `createMeasureContainer` agora
    monta os blocos dentro de um div com a MESMA largura de folha (210mm) +
    padding (22/12/14mm) + font-family/size da `.content-section` real, em vez de
    um div solto no `document.body`. Elimina discrepância de contexto (fonte/
    largura herdada) entre a medição e o render — a hipótese pra "medido < real"
    que causava corte de blocos altos (Meses, Dia Pessoal). A confirmar em teste
    ao vivo (não reproduzível sem sessão autenticada — o preview de Blocos exige
    login; sem ele a página redireciona pra /app).

### Nota sobre ABNT NBR 14724

Pesquisado a pedido do Guilherme (2026-07-19): a NBR 14724 é a norma da
ABNT pra formatação de trabalhos ACADÊMICOS (monografias, dissertações,
teses) — não se aplica diretamente a um relatório comercial como o mapa
numerológico do Vibraweb, mas fica registrado o que ela pede, já que o
sistema de numeração de página deste projeto foi desenhado inspirado nela:
margens 3cm superior/esquerda, 2cm inferior/direita; numeração em
algarismos arábicos no canto SUPERIOR direito (a 2cm da margem superior) —
diferente do rodapé usado aqui; capa conta mas não numera; numeração só
aparece a partir da 1ª página de texto. As margens atuais do Vibraweb
(22mm topo / 12mm laterais / 20mm rodapé) são uma escolha de design própria
do template, não uma tentativa de seguir a NBR à risca — só a CONVENÇÃO de
"capa não numera, conteúdo numera a partir da 1ª página" foi
deliberadamente espelhada dela (ver seção "Numeração de páginas" acima).

---

## Impressão / PDF (print-document.ts) — fidelidade 1:1 com o preview

**A estratégia inteira é NÃO recalcular nada na impressão** — a paginação
(que bloco cai em qual página) já foi decidida UMA VEZ só no preview
(`PreviewPage.tsx`: `measureBlockHeights` + `splitIntoPages`, medição REAL
de DOM, ver seção acima). `printDocument()` só clona `document.querySelector('.preview-scroll').innerHTML`
já renderizado com essa paginação e injeta num popup de impressão. O botão
"Gerar PDF" só existe depois que `pages` (o array já paginado) está pronto
— nunca dispara com paginação incompleta.

Como cada `.content-section` já é uma página A4 completa e isolada (altura
fixa 297mm, `overflow:hidden`, o JS garante que o conteúdo cabe), o
header/footer de cada página (`.doc-page-header`/`.doc-page-footer`,
`position:absolute` dentro da própria seção, `DocumentChrome.tsx`) já vem
certo por seção — **não precisa** de header/footer `position:fixed` a nível
de documento nem de `counter(page)` do CSS: isso só faria diferença se o
NAVEGADOR fosse quebrar uma seção alta em várias páginas físicas sozinho, o
que não acontece aqui (1 `.content-section` = exatamente 1 página impressa,
garantido pelo paginador). O número de página já vem pronto como texto
literal ("Página N", `PageFooter`) desde o preview.

### Única responsabilidade própria da impressão: esperar a fonte carregar
Verificado ao vivo (2026-07-19): interceptando `window.open`, a página HTML
capturada pra impressão bate **exatamente** com o preview — mesmo número de
`.content-section` (25 = 25), mesmo conteúdo/estilo inline em cada bloco,
inclusive nos splits "só cabeçalho". O único jeito da impressão DIVERGIR do
preview é se a janela de impressão renderizar ANTES de Inter/Poppins
carregarem: o texto sairia numa fonte de fallback com métricas diferentes,
podendo quebrar linha diferente do preview e estourar o `overflow:hidden`
de uma seção que cabia perfeitamente antes. Corrigido: o script da janela de
impressão espera `document.fonts.ready` de verdade antes de `window.print()`
(teto de segurança de 2.5s pra nunca travar o diálogo se a fonte falhar).

### CSS da janela de impressão
Reforça (redundante com os estilos inline já capturados, mas garante
consistência mesmo se algo não estivesse inline): `@page { size: A4; margin: 0; }`
(a página cobre a folha inteira — os 22mm/12mm/20mm de padding já são
inline em cada `.content-section`/`.a4-page.doc-cover`, herdados do
preview); `.content-section`/`.a4-page.doc-cover { page-break-after: always; break-after: page; }`
— 1 seção = 1 folha; `.doc-page-header`/`.doc-page-footer { position: absolute; }`
— reforça o posicionamento por seção (já inline); `.zoom-wrapper { transform: none; }`
— reset do zoom do preview (impressão sempre em escala real).

---

## Adicionando Conteúdo Novo (futuro)

Para adicionar uma nova seção ou sub-bloco ao documento:
1. Adicionar o texto no Neon Postgres (tabela `interpretacoes`, tipo `estatico_def_*` ou `pessoal_*`)
2. Adicionar a chave em `INTERP_KEYS` em `PreviewPage.tsx` se for variável por número
3. Adicionar o bloco em `document-builder.ts` (função `buildDocumentBlocks`)
4. O `DocumentBlockRenderer` em `DocumentBlock.tsx` já sabe renderizar os tipos existentes
5. Para novo tipo de bloco: adicionar case em `DocumentBlock.tsx` e tipo em `BlockType`

Blocos condicionais (que só aparecem se o dado existir) são criados automaticamente — ex.: se `map.licoesCarmicas.length > 0`, o bloco de Lições Cármicas é incluído.

---

## Capa: layout em 3 containers + título do produto configurável (2026-07-28)

`CoverPage` (`DocumentChrome.tsx`) empilhava logo, título e cliente num único
bloco flex centralizado no meio vertical da página — sobrava muito espaço em
branco acima/abaixo em telas/PDFs mais altos. Guilherme pediu pra dividir o
espaço (descontando o rodapé) em **3 containers horizontais empilhados**, cada
um ocupando 1/3 da altura (`flex: 1`) e centralizando seu próprio conteúdo:

1. Logo (imagem) ou nome da empresa em texto
2. Título do produto (barras decorativas + `<h1>`)
3. Nome do cliente + data de nascimento

O texto do título ("Mapa Numerológico Pessoal") era hardcoded em
`DocumentChrome.tsx`, com a palavra final (`tabLabel`, ex. "Pessoal") vindo
colorida em `theme.primaryColor` — esse split não sobrevive a virar um campo
de texto livre, então foi consolidado num único campo configurável:
`DocTheme.coverProductTitle` (`theme-resolver.ts`), com default **"Mapa
Numerológico Pessoal"** (`VIBRAWEB_DEFAULTS`), resolvido como
`config.coverProductTitle ?? VIBRAWEB_DEFAULTS.coverProductTitle` — mesmo
padrão de `companyName`/`footerLeft`. Editável em BrandPage.tsx, accordion
"Capa do Documento", campo "Nome do Produto (título da capa)".

`CoverPage` deixou de receber a prop `tabLabel` (não é mais usada pra colorir
parte do título); `DocumentPreviewStack.tsx` continua com sua própria variável
local `tabLabel` (usada em `docSubject`, sem relação com a capa).

2ª rodada, mesmo dia (Guilherme: "o espaço do logo ficou muito em cima...
adicione mais um container de cabeçalho em branco... mantendo centralizado os
container que tem conteúdo"): virou 4 containers — um 1º container antes do
logo, do mesmo tamanho (`flex: 1`) dos outros 3. Os 3 containers com conteúdo
continuam do mesmo tamanho entre si; esse 1º container só empurra o grupo
inteiro pra baixo, tirando o logo de colado no topo da página.

3ª rodada, mesmo dia (Guilherme: "use o container de cima o campo pra
texto[s] pequeno[s] detalhe, porém deixe em branco como padrão"): o 1º
container deixou de ser um `<div>` vazio e virou um campo de texto pequeno
configurável — `DocTheme.coverTopText` (`theme-resolver.ts`), default `''`
(some visualmente igual ao espaçador em branco até o usuário preencher).
Editável em BrandPage.tsx, mesmo accordion "Capa do Documento", campo "Texto
pequeno (acima do logo)".

4ª rodada, mesmo dia (Guilherme: "no container de cima justifique o texto
posicionado [no topo] ao invés de centralizado como padrão"): só esse
container (o do `coverTopText`) usa `alignItems: 'flex-start'` (texto
alinhado ao topo do próprio container) — os outros 3 continuam centralizados
verticalmente dentro do seu terço.

5ª rodada, mesmo dia (Guilherme: "adicionar a opção de alterar a posição
dentro de cada container: centralizar, topo, inferior — use as palavras
corretas usadas em apps como Canva"): virou configurável nos 4 containers via
`VerticalAlign` (`theme-resolver.ts`, `'top' | 'center' | 'bottom'` — termos
de Word/PowerPoint/Canva) — `coverTopTextAlign` (default `'top'`, herdado da
4ª rodada), `coverLogoAlign`, `coverTitleAlign`, `coverClientAlign` (default
`'center'` os 3). `DocumentChrome.tsx` mapeia `VerticalAlign` pra
`alignItems`/`justifyContent` via `flexAlign` — nos containers `row` (texto
de cima, logo, cliente) é `alignItems`; no container do título
(`flexDirection: column`) é `justifyContent`, já que ali o eixo principal é o
vertical. Editável em BrandPage.tsx via `VAlignSelect` (novo helper, mesmo
padrão do `ColorPicker`), um seletor "Topo/Centro/Base" por container.

6ª rodada, mesmo dia (Guilherme: "ao invés de topo/centro/baixo vamos só
nomear as posições posição 1, posição 2... o usuário não entende que tem um
container transparente, um grid, e que o texto tá sendo posicionado com
relação a esse grid"): `VAlignSelect` trocou os rótulos das opções pra
"Posição 1/2/3" (values internos `top`/`center`/`bottom` sem mudança).

7ª rodada, mesmo dia (Guilherme: "vamos retirar a opção de texto do container
do cabeçalho por enquanto, vamos fingir que ele não existe, mas vamos manter
ele lá, o espaço ocupado ainda por baixo dos panos"): o campo "Texto pequeno
(acima do logo)" e seu `VAlignSelect` saíram da UI de BrandPage.tsx —
`coverTopText`/`coverTopTextAlign` continuam existindo em theme-resolver.ts
e o container correspondente continua ocupando seu 1/4 de altura em
DocumentChrome.tsx (renderiza `''` por padrão, invisível), só não dá mais pra
editar por enquanto.

8ª rodada, mesmo dia (Guilherme: "retire também aquele[s] detalhe[s] linha de
design amarelo[s], vamos deixar só os textos"): removidas as duas barrinhas
decorativas (`accentColor`, 48×3) acima/abaixo do título da capa em
`CoverPage` — o container do título agora só tem o `<h1>`, sem elemento
decorativo.

10ª rodada (2026-07-29) — Hierarquia H1/H2/H3/H4 no Corpo do Documento e Padronização de Componentes:
- **Hierarquia H1, H2, H3 e H4**:
  - `H1`: Títulos de Seção do corpo do documento (`h1FontSize`, `h1Font`, `h1Color`, `h1Bold`, `h1Italic`, `h1Underline`, `h1TextAlign`).
  - `H2`: Sub-títulos (`h2...`).
  - `H3`: Nível 3 (`h3...`).
  - `H4`: Nível 4 / Rótulos (`h4...`).
  - `Parágrafo`: Texto corrido (`body...`).
- **Desacoplamento da Capa**: `titleColor` e `clientColor` da Capa não herdam mais `h1Color` como fallback, permitindo alterar H1 do corpo sem mudar os textos da capa.
- **Padronização dos botões quadrados (`SquarePropertyBtn`)**:
  - Criado o componente padronizado `SquarePropertyBtn` (32px × 32px), compartilhado entre seletores de propriedades de texto (negrito, itálico, sublinhado em `FontControls`), alinhamento de texto (`TextAlignPicker`) e posicionamento de âncora 2D (`AnchorPicker`).
