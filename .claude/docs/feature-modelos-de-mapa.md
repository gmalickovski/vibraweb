# Modelos de Mapa — personalização em conjunto

> **Status**: Fase 1 (Blocos) CONCLUÍDA — 2026-07-27. Fase 2 (Textos) pendente.
> Documento de plano — atualizar conforme cada fase for concluída.

## Problema

Hoje a personalização tem três eixos, e eles têm **poderes diferentes**:

| eixo | onde mora | tem variantes nomeadas? |
|---|---|---|
| Visual | `profiles.brand_config` → `{ activeTemplateId, templates: [{id, name, config}] }` | **sim** |
| Blocos | `profiles.block_order` (JSONB) | **não** — um só, global |
| Textos | tabela `user_interpretations` | **não** — um só, global |

Consequência prática relatada pelo Guilherme:

> "na hora de criação do mapa eu posso alterar em um botão em cascata qual
> template salvo eu quero usar para aquela análise, porém ela só altera o
> visual (…) toda vez que criar um novo, se eu precisar, tenho que alterar a
> ordenação dos blocos um por um, assim como os textos"

Trocar o **visual** é um clique. Trocar **textos** ou **ordem de blocos** para
fugir do global é refazer tudo na mão, análise por análise.

## Decisão

Estender a entidade que já existe (Template) em vez de criar um conceito novo
ao lado dela. O Template passa a carregar os três eixos e é renomeado para
**"Modelos de Mapa"**, porque "Template" comunica só aparência.

### As 4 camadas

```
1. PADRÃO DO SISTEMA     tabela `interpretacoes` + DEFAULT_BLOCK_ORDER
                         piso; nunca deletável, igual pra todo mundo
     └── 2. GLOBAL       páginas Textos + Blocos (profiles.*)
                         a base do consultor
          └── 3. MODELO  visual + blocos (opcional) + textos (só diferenças)
               └── 4. ANÁLISE   ajuste pontual (analyses.*)
```

A camada 4 aplica-se por cima do que estiver ativo — seja um Modelo salvo ou o
global.

**As camadas 1, 2 e 4 já existem e funcionam.** O trabalho é inserir a 3.

### Como cada eixo herda — e por que são diferentes

**Textos → diferença por chave.** O Modelo guarda só os textos que mudou e
herda o resto. Cada texto é independente, então compõe bem: corrigir um erro no
global propaga para todos os Modelos que não sobrescreveram aquela chave.

**Blocos → tudo ou nada.** O Modelo ou herda a ordem global inteira, ou tem a
sua própria (cópia completa). Não existe "herdar metade de uma ordem" — ordem é
uma lista, e merge parcial gera estados sem significado (o que acontece se o
global move um bloco que o Modelo escondeu?).

Isso é seguro porque `normalizeBlockOrder` (block-order.ts) já faz merge do
valor salvo com `DEFAULT_BLOCK_ORDER`, inserindo ids ausentes na posição certa:
um Modelo com ordem própria **absorve automaticamente** blocos novos que o
sistema adicionar depois. Não apodrece.

## Pontos de encaixe já existentes (verificados)

- `analyses` já tem as três colunas: `text_overrides`, `block_order` e
  **`template_id`** (migration 016). O `template_id` hoje só troca o visual.
- `PreviewPage.tsx` — `theme` (~linha 270) aplica `templateId` só ao visual;
  `effectiveOrder` (~linha 281) resolve `analyses.block_order` →
  `profiles.block_order`. **É aqui que a camada Modelo entra.**
- `AppPage.tsx` — `clientTemplateId` é o seletor em cascata na criação da
  análise; já persiste em `analyses.template_id`.
- `BlocosPage.tsx` — o organizador de blocos, reusável como componente.

## Fase 1 — Blocos (CONCLUÍDA, 2026-07-27)

Escolhida como primeira porque é JSONB pequeno, sem versionamento, sem cache, e
o organizador já existe pronto. Validou o desenho da navegação num terreno
pequeno antes de mexer em Textos.

**Renomeação**: a página passou de "Templates" para **"Modelos"** — label na
Sidebar, no BottomNav (mobile), `PageTitle`, alerta do gate Pro, e os textos
de UI da lista (Criar Novo Modelo, Excluir modelo, etc.). A rota continua
`/app/marca` — renomear a URL não foi pedido e evita quebrar links/hábito.

**Navegação — NÃO abas superiores, e sim a mesma gaveta da Sidebar** (pedido
explícito do Guilherme: "ao invés de aparecer abas superiores... vamos usar
o sidebar"). Isso exigiu tornar a Sidebar mais genérica:

- **Rota**: `App.tsx` mudou de `path="marca"` para **`path="marca/*"`** — o
  mesmo componente `BrandPage` nunca remonta ao trocar de template ou de aba
  (só o "splat", lido via `useParams()['*']`, muda), preservando estado local
  como qual template está sendo editado.
- **URL do editor**: `/app/marca/<id>` (Visual, implícito) ·
  `/app/marca/<id>/blocos` · `/app/marca/<id>/textos`. `editingId`/`editingTab`
  em `BrandPage.tsx` deixaram de ser `useState` e passaram a ser **derivados
  da URL** — mesmo princípio já usado no resto da Sidebar ("nunca um estado
  solto que possa dessincronizar"). Os antigos `setEditingId(...)` viraram
  `navigate(...)`.
- **Sidebar** (`Sidebar.tsx`): ganhou o conceito de **grupo DINÂMICO**
  (`matchModelosEditor`), diferente do grupo estático "Alterações Globais"
  (filhos fixos) — aqui os filhos (Visual/Blocos/Textos) são construídos a
  partir do id do modelo NA PRÓPRIA URL, via regex
  `^\/app\/marca\/([^/]+)(?:\/(blocos|textos))?\/?$`. `'default'` (Padrão
  Vibraweb) é excluído do grupo — não é um modelo salvo, não tem onde guardar
  bloco/texto próprios. `activeGroup`/`modelosEditor` foram unificados num
  único `active = { id, items, backTo }`, do qual TUDO mais deriva (rows,
  "Voltar", nível pra disparar a animação de entrada) — generaliza para os
  dois tipos de grupo sem duplicar a lógica de cascata/transição.
- **"Voltar"** dentro do editor de um Modelo vai para `/app/marca` (a lista) —
  diferente de "Alterações Globais", cujo "Voltar" retorna à última página de
  nível raiz visitada. Fazem sentidos diferentes: um modelo tem uma lista-mãe
  natural pra voltar; "Alterações Globais" não tem página própria nenhuma.

**Aba Blocos** (`ModeloBlocosTab` em `BrandPage.tsx`) — **REFEITA em tela
cheia** (correção de rota, 2026-07-27: a 1ª versão comprimia
`BlockOrderPanel` sozinho na coluna estreita de 380px onde a aba "Aparência"
vive; o Guilherme pediu explicitamente pra reaproveitar a MESMA casca de
`/app/blocos` — `DocumentOrganizerView` inteiro, com seu próprio preview,
zoom e rodapé — ocupando a tela toda, painel E preview trocando juntos ao
alternar de aba). Confirmado via `AskUserQuestion` antes de reescrever.

Quando `editingTab !== 'visual'` e o modelo não é `'default'`, `BrandPage`
faz um **early return** logo após `updateConfig` ser definido — pula por
completo o layout de coluna-estreita+preview e devolve só
`<ModeloBlocosTab>` (ou `<ModeloTextosTab>`), ocupando `flex: 1` inteiro.

Design da aba: SEM um passo explícito de "ativar personalização" — o painel
sempre mostra a ordem EFETIVA (a própria, ou uma cópia do global enquanto
herdando), e qualquer arrastar/ocultar já PROMOVE automaticamente pra
"própria" (grava em `blockOrder`). Um botão no rodapé ("Herdar do padrão
global") só aparece quando já personalizado — é o único jeito de sair,
mantendo a aba o mais parecida possível com a própria `/app/blocos` (que
também não tem esse conceito de ativar/desativar).

A ordem própria é gravada em `brand_config.templates[i].config.blockOrder` —
**sem estado novo**: como esse objeto `config` já é o mesmo lido/escrito por
`editingConfig`/`updateConfig` (cores, capa, cabeçalho, rodapé), o campo
`blockOrder` viaja de carona no MESMO dirty-tracking e MESMO save já
existentes (o footer do `DocumentOrganizerView` chama diretamente o
`handleSave`/`discardEdits` que a aba Visual já usa), sem nenhuma lógica de
merge adicional. O preview desta aba usa o `theme` JÁ RESOLVIDO do modelo
(cores/logo em edição), então a reordenação é vista com a marca real do
modelo, não com o tema padrão.

**Ainda não fiz**: `PreviewPage.effectiveOrder` ainda NÃO resolve
`modelo.blockOrder` — hoje só olha `analyses.block_order` →
`profiles.block_order`. Isto é necessário para o Modelo realmente valer na
hora de gerar um mapa; ficou de fora desta etapa porque o foco foi a Sidebar +
o editor em si. Próximo passo dentro da Fase 1.

**Aba Textos** (`ModeloTextosTab`): a EDIÇÃO ficou pronta nesta mesma sessão
(ver Fase 2 abaixo) — reaproveita `CustomTexts` inteiro (a mesma grade de
`/app/textos`) via um `TextsAdapter` plugável. Falta só a Fase 2.4
(resolveInterpretation em tempo de geração real do mapa).

**Nome da aba "Visual"**: renomeada para **"Aparência"** (pedido do
Guilherme — "escolher outro nome para a parte visual"). O id interno
(`'visual'`, usado na URL como AUSÊNCIA de sufixo — `/app/marca/<id>` sem
`/blocos` nem `/textos`) não mudou, só o rótulo mostrado na gaveta da
Sidebar.

**Compatibilidade**: Modelos existentes não têm `blockOrder` → caem em "herdar
do global" → comportam-se exatamente como hoje. Zero migração de banco.

**Verificação — limitação honesta**: o build TypeScript passa e a lógica do
regex de rota foi testada isoladamente (7 casos, incluindo a exclusão de
`'default'`) fora do navegador. A verificação VISUAL completa do editor com
sessão autenticada ficou bloqueada pela sessão de auth expirada no navegador
de teste (achado já registrado no histórico da Sidebar, não relacionado a
este trabalho) — `/app/marca/*` exige perfil válido e redireciona antes que a
gaveta pudesse ser observada ao vivo. A mecânica ESTÁTICA (Alterações
Globais), que não muda de comportamento nesta refatoração, já havia sido
verificada ao vivo no turno anterior.

## Fase 2 — Textos

### Fase 2.1-2.3 — Editor do Modelo (CONCLUÍDA, 2026-07-27)

`CustomTexts.tsx` (o componente inteiro de `/app/textos` — grade, categorias,
editor de markdown, versionamento, ~1050 linhas) ganhou um **adaptador de
armazenamento plugável** (`TextsAdapter`), em vez de ser duplicado. A ideia:
extrair só o PONTO DE ACESSO aos dados (ler/gravar/listar/limpar), mantendo
100% da UI e da interação intactas.

```ts
interface TextsAdapter {
  fetchEffective(numero, tipo): Promise<{ texto: string; isOverridden: boolean } | null>
  saveOverride(numero, tipo, texto: string | null): Promise<void>
  listOverrideKeys(): Promise<{ numero; tipo }[]>
  clearAllOverrides(): Promise<void>
}
```

`<CustomTexts />` sem props usa `globalTextsAdapter` (chama exatamente as
mesmas `fetchInterpretation`/`saveUserInterpretation`/etc. de sempre) — **zero
mudança de comportamento** em `/app/textos`. `ModeloTextosTab` (BrandPage.tsx)
fornece `makeModeloTextsAdapter(overrides, onPersist)`, onde `overrides` é um
`TextOverrides` (mesmo formato `Record<numero, Record<tipo, entry>>` já usado
pela análise) guardado em `template.config.textOverrides`.

**A sobreposição pedida** ("sobrepondo a personalização globais tanto padrão
como a personalizada global") acontece em `fetchEffective`: sem override do
Modelo pra uma célula, cai DIRETO em `fetchInterpretation` — a MESMA função
que já resolve global-personalizado → padrão do sistema. O editor sempre
mostra e edita o valor EFETIVO, não importa de qual camada ele vem.

**Persistência é IMEDIATA, não via rascunho** (diferente de Blocos/Aparência,
que só gravam no "Salvar" do rodapé): cada célula de texto já salva sozinha
em `/app/textos` (sem um passo de "commit" separado), então `ModeloTextosTab`
preserva esse mesmo comportamento — `persistTextOverrides` (BrandPage.tsx)
grava direto no Neon Data API a cada Salvar/Restaurar/Redefinir. Mescla contra
`tpl.config` (o ÚLTIMO SALVO), nunca contra `editingConfig` (o rascunho em
andamento da aba Aparência/Blocos) — de propósito: editar um texto não deve
empurrar pro banco uma cor/ordem ainda não confirmada. Os dois fluxos de
salvar ficam isolados; depois de persistir, `editingConfig`/`originalConfig`
são atualizados JUNTOS (senão o rodapé de Aparência/Blocos acusaria "não
salvo" à toa por um texto que já foi).

### Fase 2.4 — Ainda não feito

`resolveInterpretation()` (a cascata usada em `PreviewPage.tsx` pra GERAR um
mapa de verdade) ainda NÃO recebe a camada do Modelo — só resolve override da
análise → global → sistema. `template.config.textOverrides` hoje só existe
pro EDITOR; falta ligá-lo na geração real, mesmo gap já registrado pro
`blockOrder` (ver Fase 1).

**Problema conhecido a resolver ANTES desse passo**: a cascata de textos já
tem um marcador `sistema: true` no override da análise, criado porque *"a
ausência de override sempre revela a camada global primeiro"* — é o "revert"
que força o padrão do sistema pulando o texto global do consultor (ver
comentário em `neon.ts`, topo). Esse marcador é **booleano** e não escala
pra 4 camadas: com o Modelo no meio, "voltar ao padrão" passa a ter três
respostas possíveis (voltar ao que o Modelo define / pular o Modelo e usar o
global / pular tudo e usar o sistema). `sistema: boolean` precisa virar um
alvo — `herdarDe: 'modelo' | 'global' | 'sistema'` — mantendo leitura
retrocompatível do booleano antigo (`sistema: true` ⇒ `herdarDe: 'sistema'`).
Se isso não for feito junto, o bug aparece depois como "restaurei o texto e
voltou o errado", caro de diagnosticar. **Não afeta o editor já construído**
(Fase 2.1-2.3) — `fetchInterpretation`, usado ali, nunca teve esse marcador;
ele só existe na cascata de ANÁLISE.

Também falta, pra esse passo: **indicação de origem** em cada campo, nos
três níveis editáveis — "herdado do global" / "definido neste modelo" /
"alterado nesta análise" — com ação "voltar para o nível de baixo" em cada
um. Sem isso, 4 camadas viram confusão.

## Navegação — deixar o ALCANCE explícito

Levantado pelo Guilherme (2026-07-27): as páginas Textos e Blocos salvam
configurações globais, mas nada na tela dizia isso.

**Já feito** (não depende das fases acima): componente `ScopeBanner`
(`components/shared/ScopeBanner.tsx`) com três alcances — `global`, `modelo`,
`analise` — aplicado em:
- `/app/textos` → "Padrão global";
- `/app/blocos` → "Padrão global";
- organizador de blocos dentro da análise → "Somente nesta análise".

Isso fica mais crítico com os Modelos: as MESMAS grades vão aparecer em três
alcances diferentes, e o banner é o que distingue um do outro à primeira vista.

**Proposta de agrupamento (a decidir)** — a sidebar hoje mistura os alcances.
Com os Modelos, a organização natural passa a ser:

```
Novo Mapa
Mapas
Modelos de Mapa      ← visual + blocos + textos POR MODELO
Padrões Globais      ← Textos + Blocos globais, em abas (a base)
Configurações
```

Ou seja: uma entrada para "a base", uma para "os modelos". Resolve o pedido de
agrupar os globais numa página só e deixa a hierarquia óbvia na navegação.
Não implementado — decidir junto da Fase 1.

## Riscos / armadilhas

- **Vazio ≠ herdado.** `overrideTexto()` devolve `''` quando não há texto —
  o código já avisa: *"NUNCA usar truthiness no entry cru: objeto é sempre
  truthy"*. Com 4 camadas isso pesa mais: um texto deliberadamente em branco
  tem de ser distinguível de "não personalizado".
- **Propagação.** Se o Modelo guardar cópia (e não diferença) dos textos,
  corrigir um erro global deixa de propagar. É o motivo de "só diferenças".
- **Cache.** `interpCache` é singleton de módulo e faz write-through em
  save/delete. A camada Modelo tem de entrar nesse cache ou a grade de Textos
  volta a ficar lenta (era o motivo do cache existir).
- **Plano.** `/app/marca` é Pro-only; `/app/blocos` não é. Definir se Modelos
  com blocos/textos é recurso Pro **antes** de expor a UI.

## Aba "Aparência": reestruturação em abas + subdivisões da Capa (2026-07-28)

A aba Aparência (dentro do editor de um Modelo) era uma lista fixa de 4
`<Accordion>` (Cores e Tipografia, Capa do Documento, Cabeçalho, Rodapé)
num único painel rolável. Guilherme pediu um toggle de nível superior — mais
completo, com subdivisões dentro de cada aba, começando pela Capa.

**1ª tentativa (revertida)**: usar `TabBar.tsx` (pill-tabs) pro nível
superior. Guilherme corrigiu: *"errado!! mantenha o formato organizacional
de toggle: cada separação é um toggle, um container que abre com uma seta...
e isso vai acontecer em TODAS as janelas toggle que abrem de cada divisão"* —
ou seja, manter o `Accordion` de sempre (chevron gira, corpo expande/recolhe)
em vez de abas. Confirmado: *"resumindo, a estrutura que tinha antes estava
perfeita, só precisava adicionar e alterar as divisões"*.

**2ª tentativa (revertida) — aninhar `Accordion` em 3 níveis**: interpretei
"todas as janelas toggle" como toggle em TODO nível (Capa→subdivisão→
Fonte/Posição, cada um clicável e colapsável). Errado de novo: *"ainda está
errado, a janela toggle é SÓ na primeira divisão — depois de abrir a
primeira divisão, abre uma janela inteira que é separada por SUBTÍTULO e
linhas divisórias e espaçamentos usados nas regras de UI/UX design"*.

**Estrutura final**: só o **nível 1** (`activeTab`: Capa/Corpo do Documento/
Cabeçalho/Rodapé) é `Accordion` de verdade (clicável, chevron, colapsa).
Tudo dentro de um nível 1 aberto é conteúdo **estático, sempre visível**,
organizado só com dois componentes novos e puramente visuais — sem toggle,
sem estado:

- **`Section`** — subtítulo (mesmo estilo do header do `Accordion`: magenta,
  uppercase, bold) + linha divisória abaixo + espaçamento. Usado pras 4
  "subdivisões" da Capa: Cabeçalho da Capa, Logo, Título, Nome do Cliente.
- **`SubSection`** — um nível abaixo de `Section` (rótulo menor, cor `fg3`,
  linha divisória mais sutil). Usado pra "Fonte" e "Posição" dentro de
  Logo(texto)/Título/Nome do Cliente.

```
Nível 1 (Accordion, activeTab)   Capa · Corpo do Documento · Cabeçalho · Rodapé
  Section (estático)             Cabeçalho da Capa · Logo · Título · Nome do Cliente
    SubSection (estático)        Fonte · Posição
```

Nenhum estado de nível 2/3 existe mais (`capaSection`/`subOpen` foram
removidos) — a hierarquia visual vem só de tamanho/peso/cor/divisória, não
de interação. "Corpo do Documento" herda o que antes era "Cores e
Tipografia" (H1-H4, cor do corpo, cor principal/destaque, estilo de citação
— estiliza o CONTEÚDO das páginas internas). Cabeçalho e Rodapé mantêm
exatamente o conteúdo de antes, só migrando pra dentro do novo nível 1.

- **Cabeçalho da Capa** (`coverHeaderMode: 'inherit' | 'custom' | 'none'`,
  `theme-resolver.ts`) — a capa nunca tinha cabeçalho antes desta feature
  (`CoverPage` não renderizava `PageHeader`); agora pode herdar a config
  geral da aba Cabeçalho, ter logo/texto PRÓPRIOS só da capa
  (`coverHeaderLogoUrl`/`coverHeaderRightText`), ou continuar sem nada
  (default, preserva o comportamento antigo).
- **Logo** — mantém upload + escala de sempre, mas ganhou `logoMode: 'image'
  | 'text'` (default `'text'`, já era o comportamento implícito quando não
  havia `logoUrl`). Modo Texto ganha DUAS `SubSection`, "Fonte" e "Posição"
  (ver abaixo). Modo Imagem ganhou um botão "Posicionar logo..." que abre
  `LogoPositionModal.tsx` (novo componente, `components/app/`) — popup com
  preview do espaço do logo, arrastar livre em 2 eixos (`logoPosX`/
  `logoPosY`, 0–100%) com guias de snap (centro + bordas, tolerância de 4%),
  e upload direto de dentro do popup.
- **Título** e **Nome do Cliente** ganharam as mesmas DUAS `SubSection`.
  Nome do Cliente também ganhou `clientNameMode: 'analysis' | 'custom'` —
  por padrão usa o nome real da análise (`subject`), ou um texto fixo
  (`clientNameCustom`, útil pra Modelos de demonstração/mockup).

**"Fonte" e "Posição"** (Guilherme: *"dentro de cada subseparação existe
mais uma subseparação: Fonte: estilo de fonte, cor da fonte, estilos da
fonte: negrito, sublinhado, itálico — e o mesmo vale pras outras
subdivisões"*) — duas `SubSection` ESTÁTICAS (sem toggle, ver correção
acima) dentro de Logo(texto)/Título/Cliente:
- **Fonte** (`FontControls`, `BrandPage.tsx`) — família (`COVER_FONT_OPTIONS`),
  cor (`ColorPicker`), e 3 toggles de estilo (negrito/sublinhado/itálico,
  `StyleToggleBtn` + `BoldIcon`/`UnderlineIcon`/`ItalicIcon`). Sublinhado é
  novo nesta rodada — `logoTextUnderline`/`titleUnderline`/`clientUnderline`
  em `theme-resolver.ts`, aplicado via `textDecoration` em `DocumentChrome.tsx`.
- **Posição** — REDESENHADA de novo (Guilherme, 2026-07-29, corrigindo o
  grid 3×3 em cruz da rodada anterior — 5 posições só, sem diagonais: "ao
  invés de usar 5 quadrados posicionados dessa forma, precisamos sempre
  ocupar o menos espaço possível... coloque quadrados um ao lado do
  outro... separe posicionamento vertical e posicionamento horizontal, pois
  eu posso marcar horizontalmente à esquerda e verticalmente no centro —
  duas opções, porém não posso marcar esquerda e direita [do mesmo eixo].
  Veja como os profissionais de UI/UX resolvem isso"). `BoxAnchor` (5
  valores, 1 seletor) foi substituído por DOIS tipos independentes —
  `HorizontalAlign` (`'left'|'center'|'right'`) e o `VerticalAlign` que já
  existia (`'top'|'center'|'bottom'`) — cada texto ganhou dois campos
  (`logoTextAnchorH`/`logoTextAnchorV`, e o mesmo pra `title`/`client`).
  `AnchorPicker` (`BrandPage.tsx`) renderiza DOIS grupos de 3 quadrados EM
  LINHA (Horizontal: Esquerda/Centro/Direita — Vertical: Topo/Centro/Base),
  cada grupo de seleção única, mas os dois grupos são independentes entre
  si — compõe as 9 combinações possíveis (inclusive diagonais tipo
  "esquerda + topo"), mesmo padrão profissional do Figma/Sketch/PowerPoint
  (grupo horizontal + grupo vertical, nunca um seletor único de 9 pontos).
  Cada quadrado (`AnchorSquare`) tem uma borda mais grossa no lado
  correspondente pra SIMBOLIZAR a posição (ex.: "Esquerda" = borda grossa à
  esquerda do quadrado), visível mesmo inativo (`t.fg4`, discreta) e acesa
  (`t.gold`) quando selecionado — "Centro" não tem lado, só acende o
  quadrado inteiro. `DocumentChrome.tsx`: `boxAlign(h, v)` agora recebe os
  dois eixos separados em vez de uma âncora única.

**`BoxAnchor` → `HorizontalAlign` + `VerticalAlign`** (`theme-resolver.ts`)
— o primeiro desenho da posição de texto (Guilherme: "é a posição onde a
escrita do texto vai iniciar") foi um único tipo `BoxAnchor` (5 valores: 5
"botões quadrados" num grid 3×3 em cruz). Corrigido na rodada seguinte (ver
"Posição" acima) pra DOIS tipos independentes: `HorizontalAlign`
(`'left'|'center'|'right'`, novo) e `VerticalAlign` (`'top'|'center'|
'bottom'`, já existia — reaproveitado como o eixo vertical). `VerticalAlign`
continua existindo TAMBÉM sozinho pro "Texto pequeno" (topo, ainda escondido
da UI, só 1 eixo). `boxAlign()` em `DocumentChrome.tsx` passou a receber os
2 eixos separados (`boxAlign(h, v)`), reaproveitando o `flexAlign` que já
existia pro eixo vertical e um `hJustify` novo, análogo, pro horizontal.

**Fonte curada** (`COVER_FONT_OPTIONS`, `theme-resolver.ts`) — 8 fontes do
Google Fonts pré-aprovadas (não campo de texto livre, pra garantir que a
fonte escolhida carregue igual no preview E no PDF impresso). A URL
(`COVER_FONTS_GOOGLE_URL`) é importada direto em `print-document.ts`; em
`index.html` (HTML estático, não importa TS) a mesma lista foi duplicada
manualmente num `<link>` — se a lista de fontes mudar, atualizar os dois
lugares.

**Verificação**: `npm run build` limpo. Verificação visual no navegador
bloqueada pela mesma sessão de auth expirada já registrada (não relacionada
a este trabalho) — `/app/marca` redireciona antes da UI renderizar.

## Margens da Capa, seletores em pill, e upload de logo (2026-07-29)

**Bug de margem horizontal** — Guilherme notou que a âncora "esquerda"
(`AnchorPicker`) não chegava de fato na margem da folha (print mostrando um
vão grande à esquerda). Causa: a classe CSS `.doc-cover` (`index.css`) tinha
`align-items: center; justify-content: center` — resquício do layout ANTIGO
(um bloco único centralizado no meio da capa, antes da refatoração em 4
containers). Isso fazia o wrapper dos 4 containers (`CoverPage`,
`DocumentChrome.tsx`) ENCOLHER pra caber no conteúdo mais largo em vez de
ocupar 100% da largura útil — a âncora "esquerda" media a partir da borda
ESQUERDA DESSE WRAPPER ENCOLHIDO, não da margem real da página. Corrigido:
removidas as duas propriedades de `.doc-cover` (volta pro `align-items:
stretch` padrão do flex) + `width: '100%'` explícito no wrapper como
segurança extra.

**Margem superior unificada** — `PAD_TOP_COVER` ('10mm', só a capa) foi
removida; a capa agora usa o MESMO `PAD_TOP_CONTENT` ('22mm') das páginas de
conteúdo (Guilherme: "use as mesmo tamanho de margens das páginas de
conteúdo"). Efeito colateral bom: com `coverHeaderMode` podendo mostrar um
cabeçalho na capa agora (rodada anterior), o padding menor de antes (10mm)
não dava clearance suficiente abaixo do `PageHeader` — o mesmo problema que
já tinha feito as páginas de conteúdo adotarem 22mm.

**Seletores viraram pills, não `<select>`** (Guilherme: "as opções... devem
ser feitas com checkbox, marcar a opção, e não toggle [select] que
desce... deve ficar lado a lado se couber, use palavras únicas sucintas...
não precisa repetir o que se refere, pois o subtítulo do separador já diz"):
novo `PillSelect<T>` (`BrandPage.tsx`, mesmo princípio visual do
`StyleToggleBtn` — borda+fundo dourados quando ativo) substituiu os
`<select>` de:
- **Cabeçalho da Capa** — "Nenhum" / "Geral" / "Personalizado" (era "Sem
  cabeçalho" / "Usar configuração geral..." / "Personalizado só pra
  capa...").
- **Logo** — "Imagem" / "Texto" (era "Usar imagem" / "Usar texto").
- **Nome do Cliente** — "Análise" / "Personalizado" (era "Usar nome da
  análise..." / "Usar nome personalizado").

Os `<label>` que só repetiam o título da `Section` (ex.: "Tipo de logo"
dentro da Section "Logo") foram removidos — o subtítulo já diz a que parte
se refere.

**Upload de logo: 1 botão só + popup com instruções + conversão automática**
(Guilherme: "tem 2 botões pra adicionar imagem, deixe só um botão escrito
Adicionar imagem... dentro do modal vai ter as instruções de formatos e
tamanhos mínimos... e um conversor pra sempre converter pra um tamanho e
formato adequado, pra não perder resolução na impressão nem pesar no banco
de dados"):
- O painel lateral não tem mais um `<input type="file">` PRÓPRIO ao lado do
  botão — só "Adicionar imagem", que abre `LogoPositionModal`. O upload de
  verdade (escolher arquivo) acontece só dentro do popup.
- Popup ganhou um bloco de instrução: PNG/JPG, mínimo 600×600px, avisando
  que a conversão é automática.
- **`frontend/src/lib/image-resize.ts`** (novo) — `resizeImageForLogo(file,
  maxDim=1600)`: usa `createImageBitmap` + `<canvas>` pra redimensionar
  (limitando a maior dimensão a 1600px, preservando proporção) e converter
  SEMPRE pra PNG (preserva transparência), antes do upload de verdade.
  Chamado dentro de `uploadLogoFile` (`BrandPage.tsx`) — vale pros 3 campos
  de logo (capa, cabeçalho de página, cabeçalho da capa), não só no popup.

## Hierarquia visual dos títulos + marcador de centro (2026-07-29)

**Hierarquia de 3 níveis** (Guilherme: "o título tamanho estilo principal de
cada card toggle principal tem que ser maior e diferente do título de cada
sub-separação... tem que haver hierarquia visual... o subtítulo dos
separados internos, ao invés de maiúsculas, vamos usar escrita padrão,
primeira maiúscula o resto minúscula, mantendo o tamanho e o negrito... e
para outros subtítulos dentro dos separadores, adicionar um outro estilo,
talvez diminuir o tamanho da fonte"):

| Nível | Componente | Antes | Depois |
|---|---|---|---|
| 1 | `Accordion` (Capa/Corpo/Cabeçalho/Rodapé) | 13px, MAIÚSCULAS | **16px**, MAIÚSCULAS |
| 2 | `Section` (Cabeçalho da Capa/Logo/Título/Cliente) | 13px, MAIÚSCULAS | 13px, **frase normal** (sem `textTransform`) |
| 3 | `SubSection` (Fonte/Posição) | 11px, MAIÚSCULAS | **10px**, **frase normal** |

Os títulos de `Section` que estavam em Title Case só por causa do
`textTransform: uppercase` viraram frase normal na STRING também (não só no
CSS) — "Cabeçalho da Capa" → "Cabeçalho da capa", "Nome do Cliente" → "Nome
do cliente" (Logo/Título já eram uma palavra só, sem mudança).

**Marcador de centro no `AnchorPicker`** (Guilherme: "no quadrado central,
adicione dentro do botão um quadrado centralizado, pra ficar visivelmente
entendível que é centro a posição") — diferente dos botões de
esquerda/direita/topo/base (que já tinham uma borda grossa no lado
correspondente), o botão "Centro" não tem lado pra destacar; ganhou um
quadradinho de 6×6px centralizado DENTRO do próprio botão (`AnchorSquare`,
`BrandPage.tsx`), na mesma cor de acento (dourado quando ativo, `fg4`
inativo) — mesmo princípio visual dos outros 4, só que o "lado" vira um
ponto no meio.

**Correção no mesmo dia** (Guilherme, olhando o resultado: "tamanho da
fonte dos divisores principais tá muito grande, ficou desproporcional,
diminua, deixe com o tamanho anterior que estava bom... use caracteres
maiúscula no início e minúscula depois"): o 16px + MAIÚSCULAS do nível 1
(`Accordion`) foi longe demais. Corrigido pra **14px, sem
`textTransform: uppercase`** (mesma "escrita padrão" já usada em
`Section`) — a hierarquia visual entre os 3 níveis passa a vir
principalmente da MOLDURA (nível 1 tem borda+botão+chevron; nível 2 é só
texto+linha; nível 3 é ainda menor e mais discreto), não de tamanho
gigante ou caixa-alta. Strings ajustadas pra frase normal também:
"Corpo do Documento" → "Corpo do documento" (Capa/Cabeçalho/Rodapé já
eram uma palavra só).

## Tamanho de fonte em "pt" + estilo completo em TODO o documento (2026-07-29)

Guilherme pediu pra estender fonte/tamanho/cor/estilo (que a Capa já tinha)
pra TODO texto do documento: Cabeçalho, Rodapé, e o Corpo do Documento
(H1/H2/H3/H4 + parágrafos) — com uma barra de TAMANHO em "pt" (valor
absoluto) em vez do multiplicador de escala (`coverLogoScale`) usado até
então só pro logo.

**Pesquisa antes de implementar revelou um problema real**: "H1, H2, H3, H4"
é nomenclatura padrão de documento, mas não é o que existe em
`DocumentBlock.tsx` — `h1Color` nunca é usado no corpo (só alimenta
`titleColor`/`clientColor` da capa, e ambos já têm campo próprio hoje, então
é vestigial); `h3Color` já cobre DOIS papéis visuais (um sub-título de
definição a 13px, e ~7 rótulos "eyebrow" uppercase a 11px) — não existe
`h4Color` próprio, nunca existiu (o picker já se chamava "Cor H3/H4").
**Resolução**: "Cor H1" removida da UI de Corpo do Documento (campo
`h1Color` continua existindo só como fallback interno, sem controle
dedicado); H3/H4 continuam unificados (mesmo tamanho/fonte/cor/estilo pros
dois papéis, consistente com a cor já ser combinada); os ~15 tamanhos
avulsos usados em badges de número/legendas/rótulos de tabela (8.5 a 52px)
ficam FORA de escopo — não pertencem a uma hierarquia de título/parágrafo.

**Unidade "pt"**: o documento inteiro já usa números crus como `fontSize`
em `px` de CSS (sem unidade real de impressão) — converter pra "pt" de
verdade exigiria mudar toda a arquitetura de medição
(`measure-document.tsx`, que mede em `px` de DOM real). Decisão: o RÓTULO
na UI mostra "pt" (`FontSizeSlider`, novo componente em `BrandPage.tsx`) e
o número vira `fontSize` direto, sem conversão — na prática troca "escala
multiplicadora" por "valor absoluto", que é o que foi pedido de verdade.

**Faixas min/max por elemento** (pt): Título capa 14–48 · Logo-texto
14–48 · Nome do Cliente 12–32 · Cabeçalho/Rodapé (página) 8–14 (baixo de
propósito — não pode interferir no espaço fixo de header/footer) · H2
12–24 · H3/H4 10–18 · Parágrafo 10–14.

**Logo-texto perdeu a escala** — antes usava `24 * theme.coverLogoScale`
(multiplicador); agora é só `theme.logoTextFontSize` (valor absoluto).
`coverLogoScale` continua existindo, mas só vale pro modo Imagem (onde
escala ainda faz sentido — amplia/reduz uma imagem, não texto).

**Cabeçalho/Rodapé ganharam cor própria** (`headerColor`/`footerColor`) —
antes usavam cinza fixo (`#aaa`/`#999`) sem tema nenhum. Cada um tem
UM conjunto de controles (tamanho/fonte/cor/negrito/itálico/sublinhado)
aplicado a TODOS os pedaços de texto daquela área (cabeçalho: nome/logo-
texto + texto à direita; rodapé: até 3 colunas) — mesmo princípio de
unificação já usado pra H3/H4.

**2ª rodada, mesmo dia — Corpo do Documento NÃO usa o `AnchorPicker` da
Capa** (Guilherme: *"não vai ter o sistema de posicionamento [os
quadrados]... vai ter somente 3 quadros de direção do texto igual no
Word: esquerda, centro, direita — só pros títulos e subtítulos [H2/H3/H4].
Pros parágrafos só tamanho/cor/estilo, SEM alinhamento"*): diferente da
Capa (posição 2D via flex `alignItems`/`justifyContent` num container
ISOLADO), os títulos do corpo são elementos de FLUXO normal — um
`text-align` CSS simples resolve. Novo `TextAlignPicker` (3 botões,
reaproveitando os ícones `AlignLeftIcon`/`AlignCenterIcon`/`AlignRightIcon`
que já existiam pro `MarkdownEditor`) — só em H2 e H3/H4, NÃO em Parágrafo.
Novos campos `h2TextAlign`/`h3TextAlign` (`'left'|'center'|'right'`,
default `'left'`) — de propósito NÃO existe `bodyTextAlign`.

**`FontControls` estendido** — ganhou `size`/`onSize`/`sizeMin`/`sizeMax`
(embute o `FontSizeSlider` automaticamente no topo) e `colorStatus?`
opcional (pro badge "AA — ok"/"AA — atenção" que H2/Parágrafo já tinham,
preservado). Usado agora em 8 lugares: Título/Logo-texto/Cliente (Capa),
Cabeçalho, Rodapé, H2/H3/Parágrafo (Corpo) — sempre o MESMO componente,
~40 campos novos em `theme-resolver.ts` seguindo o mesmo padrão.

**`DocumentBlock.tsx`**: a parte mecânica (52 edições em ~39 call sites de
`fontSize:15`+`h2Color`, `fontSize:13`/`11`+`h3Color`, `fontSize:11`+
`bodyColor`) foi aplicada via um script Node de uma vez (cada edição
verifica o texto ANTES de trocar, abortando se não bater — sem risco de
corromper o arquivo por engano), não editada manualmente call-site por
call-site.

**Verificação**: `npm run build` limpo em cada etapa. `measure-document.tsx`
já confirmado que remede o DOM real a cada mudança de `theme` (nenhum cache
obsoleto), então as mudanças de tamanho de fonte refletem na paginação
automaticamente. Visual no navegador segue bloqueado pela sessão de auth
expirada (limitação já registrada, não relacionada a este trabalho).

## Aba "Estilos" — galeria de predefinições (2026-07-29)

Guilherme: *"vamos criar mais um card separador principal no início,
'Estilos', onde vou criar predefinições do sistema que vão adicionar
alguns elementos visuais como os cards de números que temos hoje — vai se
chamar Vibraweb. E também vai ter o estilo padrão de texto puro, só texto
preto, e tamanhos de títulos/subtítulos respeitando a hierarquia H1/H2/H3,
sem elementos visuais de cards. Aos poucos vou adicionando outros estilos
predefinidos que o usuário pode usar como base pra suas próprias
personalizações. Depois que arrumar tudo, eu vou definir e criar o sistema
padrão pra quando não houver nenhum template criado."*

**Nova aba de nível 1, PRIMEIRA da lista** (antes de Capa) — uma galeria de
`StylePreset` (`BrandPage.tsx`): cada preset é só um LOTE de campos de
`brand_config` aplicado de uma vez (`applyPreset`, mescla `preset.apply` no
`editingConfig` via `setEditingConfig`) — um ponto de partida rápido, não
substitui as outras abas (o usuário continua ajustando manualmente depois
de aplicar). 2 presets pra começar (lista em `STYLE_PRESETS`, cresce aqui
conforme Guilherme for adicionando mais, sem mexer no resto do editor):

- **Vibraweb** — aplica os mesmos valores de `VIBRAWEB_DEFAULTS` (cores de
  marca, os cards visuais nos números que o documento já usa hoje).
- **Texto Puro** — zera todas as cores pra preto (`#000000`). A hierarquia
  de tamanhos H1/H2/H3 já existe por padrão nos tamanhos de fonte (Título
  30pt > H2 15pt > H3 13pt), não precisa de campo extra.

**Limitação conhecida, deixada explícita no código e aqui**: a parte "sem
elementos visuais de card" do preset Texto Puro AINDA NÃO existe — isso
exigiria um novo modo de renderização em `DocumentBlock.tsx` (um jeito de
`number-entry`/`summary-grid`/etc. renderizarem SEM a moldura/badge, só
texto), que é trabalho novo e maior, fora de escopo desta rodada. O preset
por ora só cobre a parte de cor. O "sistema padrão pra quando não houver
template criado" (mencionado por último) também é uma decisão futura, não
implementada agora.

## Fora de escopo (por ora)

Melhorar as diferenças entre os templates VISUAIS (tipografia, densidade,
estilo do badge de número) é projeto independente — ver análise no final de
`feature-preview-document.md`. A refatoração de blocos concluída em 2026-07-26
tornou isso barato: o badge existe hoje em UM lugar (`number-entry`) e os
títulos em três variantes de `section-heading`, contra 5-6 duplicatas antes.
