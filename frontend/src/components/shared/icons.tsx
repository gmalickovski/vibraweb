// icons.tsx — ícones de linha (stroke-based) reaproveitados como PADRÃO em
// toda a UI (Guilherme, 2026-07-12): olho aberto/fechado pra qualquer toggle
// de mostrar/ocultar, e chevron pra qualquer accordion que abre/fecha.
// Sempre que existir uma função de "mostrar/ocultar" ou "abrir/fechar seção",
// usar estes componentes em vez de emoji/texto/símbolo unicode.

export function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 1 12s4 8 11 8a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  )
}

/** Ícone de "Novo Mapa"/"Nova Análise" (página com canto dobrado + "+") —
 *  nav de Novo Mapa (Sidebar/BottomNav), 2026-07-27, a partir de referência
 *  visual trazida pelo Guilherme (2 opções: página com linhas de texto +
 *  selo circular "+", ou só a página + "+" central — escolhida a 2ª, mais
 *  simples, por ficar mais legível no tamanho pequeno da sidebar, mesmo
 *  raciocínio já aplicado ao ícone de Textos). Substitui o glifo '✦'
 *  (estrela — não lia como "criar/adicionar"). Formato clássico de "novo
 *  arquivo" (mesmo desenho do ícone "file-plus" do Feather Icons, redesenhado
 *  aqui como componente próprio no MESMO traço dos demais ícones desta
 *  lista: stroke 2, cantos arredondados). */
export function FileNewIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  )
}

/** Ícone de "Mapas" (folha de documento + lápis inclinado por cima) — nav de
 *  Mapas (Sidebar/BottomNav), 2026-07-27. 4ª rodada (Guilherme trouxe 2
 *  imagens de referência — um lápis solto e o par folha+lápis — pedindo "use
 *  os mesmos posicionamentos e design", e antes disso: "o lápis tem que ser
 *  mais legível, maior, e ficar posicionando um pouco mais pra fora da
 *  folha"): o lápis deixou de ser o path do Feather (corpo preenchido +
 *  ponta vazada) e virou o desenho da referência — TODO em contorno (sem
 *  preenchimento), desenhado em coordenadas locais retas (cabo ao longo do
 *  eixo, ponta na origem) e girado com `rotate(-45)`, com uma linha curta
 *  (`M3 -1.7 L3 1.7`) separando a ponta cônica do cabo, igual ao corte da
 *  imagem de referência. Maior que a versão anterior (cabo de 15 unidades
 *  locais vs. antes ~9 efetivas) e cruzando bem mais pra fora do canto
 *  superior direito da folha. Medido via getBBox (que já inclui o stroke,
 *  não só a geometria — checado ponto a ponto com `matrixTransform` real
 *  antes de confiar no número) antes de fixar `translate(10.3,12)
 *  rotate(-45)`: bbox final do lápis x 9.1→22.11, y 0.19→13.2 — dentro do
 *  viewBox 24×24 nas quatro bordas, ponta encostando de leve na linha de
 *  conteúdo (y=14), cabo cruzando o canto (20,2) da folha. */
export function FileEditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="7" y1="14" x2="13" y2="14" />
      <g transform="translate(10.3,12) rotate(-45)">
        <path d="M0 0 L3 -1.7 L15 -1.7 L15 1.7 L3 1.7 Z" />
        <path d="M3 -1.7 L3 1.7" />
      </g>
    </svg>
  )
}

/** Ícone de "Modelos" (cartão de template: caixa em cima + quadrado/linhas
 *  embaixo) — nav de Modelos (Sidebar/BottomNav), 2026-07-27, a partir de
 *  referência visual trazida pelo Guilherme. Numa GRADE explícita — tudo
 *  deriva de uma unidade de célula (9) e um espaçamento (2): (1) metade de
 *  cima (a caixa, 20×9) e metade de baixo têm a MESMA altura; (2) a metade
 *  de baixo se divide em DUAS PARTES IGUAIS — um quadrado 9×9 à esquerda,
 *  área das linhas 9 de largura à direita. 3ª rodada (Guilherme: "o quadrado
 *  de baixo tem que ser VAZADO igual ao de cima, mesmo cantos... como se
 *  cortasse o retângulo de cima ao meio; e 3 linhas em vez de 2, ocupando o
 *  mesmo espaço do quadrado"): o quadrado deixou de ser preenchido (era um
 *  bullet sólido) e virou um retângulo vazado com o MESMO `rx` do de cima —
 *  literalmente a mesma forma, só menor; as linhas foram de 2 pra 3,
 *  reespaçadas pra caber nos mesmos 9×9 do quadrado. 4ª rodada (Guilherme:
 *  "onde está o espaçamento entre os elementos? tem que ter o espaçamento
 *  usando a mesma largura da linha das bordas dos quadrados, entre o
 *  retângulo de cima e os quadrados de baixo, e entre o quadrado da esquerda
 *  e as linhas da direita — as 3 linhas devem formar um quadrado do mesmo
 *  tamanho do quadrado da esquerda, contando com as bordas"): medido via
 *  getBBox que `<rect>`/`<line>` NÃO incluem o stroke no bbox (diferente de
 *  paths com vértice agudo, tipo a ponta do lápis do FileEditIcon, onde o
 *  stroke conta) — ou seja, o espaço em branco REAL entre dois elementos com
 *  stroke 2 é o gap nominal MENOS 2 (1 de bleed de cada lado). Pra sobrar um
 *  respiro visual de 2 (a largura da própria borda), o gap nominal precisa
 *  ser 4, não 2. Reduzida a caixa de cima e o quadrado de 9×9 pra 8×8 (mesma
 *  altura dos dois, célula 8 + gap 4) e as linhas passaram a ocupar
 *  exatamente 8 de largura (x=14→22, igual à largura do quadrado, "contando
 *  com as bordas") com a primeira/última alinhadas ao topo/base do quadrado
 *  e a do meio centralizada — gap nominal de 4 tanto na horizontal
 *  (quadrado→linhas) quanto na vertical (caixa→fileira de baixo), conferido
 *  via getBBox: respiro visual real de 2 nos dois eixos. */
export function TemplateIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="1.5" />
      <rect x="2" y="14" width="8" height="8" rx="1.5" />
      <line x1="14" y1="14" x2="22" y2="14" />
      <line x1="14" y1="18" x2="22" y2="18" />
      <line x1="14" y1="22" x2="22" y2="22" />
    </svg>
  )
}

/** Ícone de "ordenar blocos" (linhas de largura decrescente + seta dupla de
 *  reordenar) — nav de Blocos (Sidebar/BottomNav), 2026-07-27. Substitui o
 *  glifo '☰' (que só lia como "menu", sem transmitir ordenação) por um ícone
 *  que combina os dois elementos pedidos: linhas = os blocos da lista; seta
 *  para cima/para baixo = a ação de reordenar. Mesmo traço dos demais ícones
 *  desta lista (stroke 2, cantos arredondados) — herda a cor do texto ao
 *  redor (currentColor), então funciona nos estados ativo/inativo/hover sem
 *  nenhum ajuste extra, igual aos glifos que substitui. */
export function SortBlocksIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="6" x2="12" y2="6" />
      <line x1="2" y1="12" x2="10" y2="12" />
      <line x1="2" y1="18" x2="7" y2="18" />
      <path d="M20 4v16" />
      <path d="M17 8 20 4.5 23 8" />
      <path d="M17 16 20 19.5 23 16" />
    </svg>
  )
}

/** Ícone de "editar textos" — "Aa" (maiúscula + minúscula) + barra de cursor
 *  de texto, nav de Textos (Sidebar/BottomNav), 2026-07-27. 5ª rodada
 *  (Guilherme: "aumente a proporção geral do ícone, ainda parece menor que
 *  os outros"): a 4ª rodada já batia a altura da maiúscula com a barra, mas
 *  o conjunto todo só preenchia ~62% da altura do viewBox (14.4 de 24) — bem
 *  menos "cheio" que um glifo Unicode normal (que costuma preencher a
 *  maior parte da própria caixa). Corrigido escalando o conjunto INTEIRO
 *  (texto + barra) mantendo as MESMAS proporções relativas entre eles —
 *  medido via getBBox: altura 16.8 (70% do viewBox, margem simétrica de 3.6
 *  em cima/embaixo), acima ficaria raso demais pro respiro até a barra
 *  (medido: ~2 unidades) continuar existindo dentro de 24 de largura. */
export function TextInputIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <text x="0.3" y="17.2" fontSize="15" fontWeight="700" fontFamily="Arial, Helvetica, sans-serif" fill="currentColor" stroke="none">Aa</text>
      <line x1="22" y1="3.6" x2="22" y2="20.4" />
    </svg>
  )
}

/** Ícone de informação (círculo + "i"), traço grosso e arredondado — usado no PageTitle. */
export function InfoIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <line x1="12" y1="11" x2="12" y2="16.5" />
      <circle cx="12" cy="7.5" r="0.25" fill="currentColor" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  )
}

export function SunIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

export function MoonIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.5 15.6A8.5 8.5 0 0 1 8.4 3.5 8.5 8.5 0 1 0 20.5 15.6Z" />
    </svg>
  )
}

export function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
      <path d="M3 4v6h6" />
      <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
      <path d="M21 20v-6h-6" />
    </svg>
  )
}

export function InstallIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v11" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 18v2h14v-2" />
    </svg>
  )
}

/** Cartão simples para áreas de planos, cobrança e assinatura. */
export function CreditCardIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="7" y1="15" x2="11" y2="15" />
    </svg>
  )
}

/** Ícone de edição global: documento com três camadas configuráveis. */
export function GlobalEditsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3.5h9l3 3V20.5H6z" />
      <path d="M15 3.5v3h3" />
      <path d="M9 11h6M9 14.5h6M9 18h3" />
      <path d="M3.5 7.5v13h3" opacity=".55" />
    </svg>
  )
}

/** X de fechar — traço grosso e arredondado, mesmo padrão dos demais ícones. */
export function CloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

/** Check (✓) — usado pra sinalizar ausência positiva (ex: "sem débitos cármicos"), nunca erro. */
export function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 12.5 9.5 18 20 6" />
    </svg>
  )
}

/** Chevron simples (linhas), gira 180° quando `open`. Padrão pra qualquer accordion. */
export function ChevronIcon({ open, size = 12 }: { open: boolean; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Ícones da barra flutuante de formatação (MarkdownEditor) ───────────────
// Mesmo padrão de traço grosso e arredondado dos demais ícones acima.

export function BoldIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
    </svg>
  )
}

export function ItalicIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="14" y1="4" x2="10" y2="20" />
      <line x1="16" y1="4" x2="9" y2="4" />
      <line x1="15" y1="20" x2="8" y2="20" />
    </svg>
  )
}

export function UnderlineIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v7a6 6 0 0 0 12 0V4" />
      <line x1="5" y1="20" x2="19" y2="20" />
    </svg>
  )
}

export function AlignLeftIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="14" y2="12" />
      <line x1="4" y1="18" x2="17" y2="18" />
    </svg>
  )
}

export function AlignCenterIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="5.5" y1="18" x2="18.5" y2="18" />
    </svg>
  )
}

export function AlignRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="10" y1="12" x2="20" y2="12" />
      <line x1="7" y1="18" x2="20" y2="18" />
    </svg>
  )
}

export function AlignJustifyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

/** "H" — ícone padrão de mercado pra título/heading (Google Docs, Notion, WordPress etc. usam H/H1). Só "H" simples porque este editor tem um único nível de título, ao contrário de H1/H2/H3 — usar "H1" sugeriria níveis que não existem aqui. */
export function HeadingIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="4" x2="5" y2="20" />
      <line x1="19" y1="4" x2="19" y2="20" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function ListBulletIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
    </svg>
  )
}

// ── Alternar tela cheia do editor (CustomTexts) ─────────────────────────────
// Par de ícones dinâmico: "cantos abrindo" pra entrar em foco, "cantos
// fechando" pra voltar ao padrão — mesmo par usado por players de vídeo,
// VS Code ("Toggle Panel") e editores em geral pra expandir/recolher um
// painel (equivalente ao Maximize2/Minimize2 do Lucide).

export function ExpandIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  )
}

export function CollapseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

export function ListNumberedIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <text x="0.5" y="8.5" fontSize="7.5" fill="currentColor" stroke="none" fontFamily="'Inter', sans-serif" fontWeight="700">1</text>
      <text x="0.5" y="14.5" fontSize="7.5" fill="currentColor" stroke="none" fontFamily="'Inter', sans-serif" fontWeight="700">2</text>
      <text x="0.5" y="20.5" fontSize="7.5" fill="currentColor" stroke="none" fontFamily="'Inter', sans-serif" fontWeight="700">3</text>
      <line x1="9" y1="6" x2="20" y2="6" />
      <line x1="9" y1="12" x2="20" y2="12" />
      <line x1="9" y1="18" x2="20" y2="18" />
    </svg>
  )
}
