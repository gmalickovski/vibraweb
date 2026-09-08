// document-builder.ts
// Converts a computed NumerologyMap + fetched interpretations into ordered DocumentBlock[].
// Each block maps to a rendered component in PreviewPage.
// Uses a nested "blocks within blocks" structure.

import type { NumerologyMap } from './numerology'
import type { AnalysisTab } from '../pages/AppPage'
import {
  DEFAULT_BLOCK_ORDER,
  BLOCK_DEFS,
  BLOCK_ID_MAP,
  GROUP_CHILD_ID_MAP,
  getBlockTitle,
  type CustomBlock,
  type BlockOrderConfig,
} from './block-order'

export type BlockType =
  | 'group'
  | 'cover'
  | 'orientation'
  | 'importante'
  | 'conclusion'
  | 'summary-table'
  | 'summary-list'
  | 'summary-grid'          // grade "de relance" (12 meses, dias favoráveis) — atômica
  | 'plain-text'            // parágrafo solto (ex.: "sem débitos cármicos")
  | 'arcanos-timeline'      // caixa da cronologia dos arcanos (esferas) — atômica
  | 'cycle-header'          // título + período de um Ciclo de Vida — atômico
  | 'piramide-grid'         // grade do Triângulo da Vida — atômica
  | 'alert-card'            // card de bloqueio (caixa vermelha) — atômico
  | 'section-heading'
  | 'number-entry'
  | 'list-entry'
  | 'moments-entry'
  | 'triangulo-entry'       // legacy — não mais usado, mantido para compatibilidade
  | 'triangulo-arcano-regente'  // card do arcano regente
  | 'triangulo-arcano-vigente'  // arcano vigente + período + duração
  | 'page-break'

export interface DocumentBlock {
  id: string
  type: BlockType
  pageBreakBefore?: boolean
  data?: Record<string, unknown>
  children?: DocumentBlock[]
  /** Fica sempre no topo da seção, antes dos filhos reordenáveis (ver
   *  `applyBlockOrder`). Usado pelas definições gerais que abrem uma seção. */
  fixed?: boolean
}

export interface InterpretationMap {
  [key: string]: { titulo: string; texto: string } | null
}

// Fonte única das chaves buscadas no Neon pra montar o `interp` passado a
// buildDocumentBlocks() — usada por PreviewPage.tsx (análise real) e
// sample-preview.ts (preview fictício de Blocos/Templates). Antes cada
// arquivo mantinha sua própria cópia da lista, e elas divergiam/tinham bugs
// (ex: PreviewPage nunca buscava diaNatalicio/diaPessoal; 'aptidoes' não
// existe como campo em NumerologyMap — precisa ler `map.expressao` mesmo,
// só o TIPO salvo no banco é 'pessoal_aptidoes'). `mapKey` = propriedade em
// NumerologyMap de onde tirar o número; `tipoSuffix` = sufixo do tipo salvo
// no banco (`${tab}_${tipoSuffix}`) — geralmente iguais, exceto aptidoes e
// dia_natalicio (tipo salvo em snake_case, mapKey em camelCase).
export const NUMERIC_INTERP_KEYS: { mapKey: string; tipoSuffix: string }[] = [
  { mapKey: 'motivacao', tipoSuffix: 'motivacao' },
  { mapKey: 'impressao', tipoSuffix: 'impressao' },
  { mapKey: 'expressao', tipoSuffix: 'expressao' },
  { mapKey: 'talentoOculto', tipoSuffix: 'talentoOculto' },
  { mapKey: 'expressao', tipoSuffix: 'aptidoes' },
  { mapKey: 'psiquico', tipoSuffix: 'psiquico' },
  { mapKey: 'destino', tipoSuffix: 'destino' },
  { mapKey: 'missao', tipoSuffix: 'missao' },
  { mapKey: 'anoPessoal', tipoSuffix: 'anoPessoal' },
  { mapKey: 'respostaSubconsciente', tipoSuffix: 'respostaSubconsciente' },
  { mapKey: 'diaNatalicio', tipoSuffix: 'dia_natalicio' },
  { mapKey: 'diaPessoal', tipoSuffix: 'diaPessoal' },
]

export function cleanTitleWithSub(prefix: string, fullTitle: string | undefined, val: number | string | undefined): string {
  const base = `${prefix} ${val}`
  if (!fullTitle) return base
  const parts = fullTitle.split(/—|-/).map(p => p.trim())
  if (parts.length <= 1) return base
  const sub = parts[parts.length - 1]
  return `${base} — ${sub}`
}

// Chaves estáticas (numero fixo = 1): Orientação/Importante/Resumo/Conclusão
// + a introdução de cada categoria (`estatico_def_*`, editável em "Textos" →
// Introduções de Categoria). PreviewPage.tsx nunca buscava nenhuma destas —
// o bug raiz por trás de "a introdução não aparece no mapa gerado".
export const STATIC_TEXT_KEYS = [
  'estatico_orientacao', 'estatico_importante', 'estatico_importante_resumo', 'estatico_conclusao',
  'estatico_def_motivacao', 'estatico_def_impressao', 'estatico_def_expressao',
  'estatico_def_talento_oculto', 'estatico_def_aptidoes', 'estatico_def_dia_natalicio',
  'estatico_def_psiquico', 'estatico_def_destino', 'estatico_def_missao',
  'estatico_def_licao_carmica', 'estatico_def_debito_carmico', 'estatico_def_tendencia_oculta', 'estatico_def_desafio',
  'estatico_def_ciclo', 'estatico_def_resposta_subconsciente', 'estatico_def_harmonia_conjugal',
  'estatico_def_ano_pessoal', 'estatico_def_mes_pessoal', 'estatico_def_dia_pessoal',
  'estatico_def_momento_decisivo', 'estatico_def_ciclos_intro', 'estatico_def_triangulo_intro',
  // Textos de ausência — exibidos quando o mapa NÃO tem débitos cármicos ou
  // não tem bloqueios no Triângulo (editáveis em Textos → Débitos, Dias e Bloqueios)
  'estatico_sem_debitos', 'estatico_sem_bloqueios',
  // Instruções de cálculo (aba "Instruções" em Textos) — renderizadas no
  // documento com o destaque visual InstructionCallout (DocumentBlock.tsx)
  'estatico_instrucao_ano_pessoal', 'estatico_instrucao_mes_pessoal', 'estatico_instrucao_dia_pessoal',
  // Dias Favoráveis — definição + instrução (os dias são fixos e repetem em
  // todos os meses; ver 'dias-favoraveis-entry')
  'estatico_def_dias_favoraveis', 'estatico_instrucao_dias_favoraveis',
  // Introduções de grupo (abertura de "capítulo" logo abaixo do título da
  // seção) — os grupos Ciclos e Triângulo já tinham as suas acima
  'estatico_def_personalidade_intro', 'estatico_def_proposito_vida_intro',
  'estatico_def_aspectos_carmicos_intro', 'estatico_def_previsoes_intro',
  'estatico_def_relacionamentos_intro',
]

// Guia de referência do Dia Pessoal — os 11 valores possíveis (1-9/11/22),
// buscados sempre por completo (não dependem da data de hoje) sob a chave
// `${tab}_diaPessoal_guia_${n}`. Ver 'dia-pessoal-entry' em DocumentBlock.tsx.
export const DIA_PESSOAL_GUIA_NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22]

function pb(id: string): DocumentBlock {
  return { id, type: 'page-break', data: {} }
}

function heading(id: string, label: string, pageBreakBefore = false, introTexto?: string): DocumentBlock {
  return { id, type: 'section-heading', pageBreakBefore, data: { label, introTexto } }
}

/**
 * Lista de números de uma mesma categoria (Lições/Débitos Cármicos, Tendências
 * Ocultas) como `group` de unidades atômicas — cada item é EXATAMENTE um
 * `number-entry` cheio (badge 72px + linha de título + texto), que é o que o
 * antigo `multi-number-entry` já desenhava internamente.
 *
 * O cabeçalho (h2 + definição) vai num `section-heading variant:'entry'`, que
 * reproduz o mesmo h2. Quando não há itens, o grupo é só cabeçalho + o texto de
 * ausência (`semTexto`, ex.: mapa sem nenhum débito cármico).
 */
function numListGroup(
  id: string,
  label: string,
  singular: string,
  accent: string,
  definicaoTexto: string,
  items: { value: number; texto: string }[],
  semTexto?: string,
): DocumentBlock {
  const head: DocumentBlock = {
    id: `${id}-head`,
    type: 'section-heading',
    data: { label, variant: 'entry', introTexto: definicaoTexto },
  }

  const children: DocumentBlock[] = [head]

  if (items.length > 0) {
    items.forEach(it => {
      children.push({
        id: `${id}-${it.value}`,
        type: 'number-entry',
        data: {
          value: it.value,
          accent,
          useTitulo: true,
          titulo: `${singular}: ${it.value}`,
          texto: it.texto,
        },
      })
    })
  } else if (semTexto) {
    children.push({ id: `${id}-sem`, type: 'plain-text', data: { texto: semTexto } })
  }

  return { id, type: 'group', pageBreakBefore: false, children }
}

/**
 * Harmonia Conjugal como `group` de unidades atômicas. Era `conjugal-entry`,
 * um composto de 4 grupos (Vibra com / Atrai / Oposto / Passivo), cada um com
 * vários números — e seu splitter cortava em DOIS níveis (quantos grupos
 * inteiros cabem, depois quantos números dentro do grupo-fronteira), com
 * `groupFullValues`/`shownGroupHeaders` só pra não repetir cabeçalho.
 *
 * Agora cada rótulo de grupo é um `section-heading variant:'sub'` e cada número
 * é um `number-entry variant:'compact'` — a quebra pode cair em qualquer ponto
 * sem nenhuma lógica dedicada.
 */
function conjugalGroup(
  numeroAmor: number,
  harmonia: { vibra: number[]; atrai: number[]; oposto: number[]; passivo: number[] },
  interp: InterpretationMap,
): DocumentBlock {
  const children: DocumentBlock[] = [
    {
      id: 'conjugal-head',
      type: 'section-heading',
      data: {
        label: 'Harmonia Conjugal',
        variant: 'entry',
        introTexto: interp['estatico_def_harmonia_conjugal']?.texto,
      },
    },
    {
      id: 'conjugal-numero',
      type: 'section-heading',
      data: { label: `Harmonia Conjugal: ${numeroAmor}`, variant: 'sub', tone: 'h3', spaceAfter: 16 },
    },
  ]

  const grupos = [
    { key: 'vibra', label: 'Vibra com', values: harmonia.vibra },
    { key: 'atrai', label: 'Atrai', values: harmonia.atrai },
    { key: 'oposto', label: 'Oposto', values: harmonia.oposto },
    { key: 'passivo', label: 'Passivo', values: harmonia.passivo },
  ]

  grupos.forEach((g, gi) => {
    if (g.values.length === 0) return
    children.push({
      id: `conjugal-${g.key}`,
      type: 'section-heading',
      data: {
        label: `${g.label} ${g.values.join(', ')}`,
        variant: 'sub',
        tone: 'h4',
        spaceAfter: 8,
        // No composto os grupos eram irmãos num flex com `gap: 20`; os itens,
        // num flex interno com `gap: 10`. Como item vira bloco com 10px de
        // margem, faltam 10px antes de cada grupo seguinte pra chegar aos 20.
        spaceBefore: gi === 0 ? 0 : 10,
      },
    })
    g.values.forEach(v => {
      const info = interp[`pessoal_harmoniaConjugal_${v}`]
      if (!info?.texto) return // o render antigo também omitia número sem texto
      children.push({
        id: `conjugal-${g.key}-${v}`,
        type: 'number-entry',
        data: { variant: 'compact', value: v, texto: info.texto },
      })
    })
  })

  return { id: 'conjugal', type: 'group', pageBreakBefore: false, children }
}

/**
 * Um Ciclo de Vida como `group` de unidades atômicas. Era `cycles-entry`, um
 * composto de até 4 cards (Regente do Ciclo + Desafio + 1-2 Momentos
 * Decisivos) num elemento só, com `headerOnly` e `boundaryCutKey` no splitter
 * pra decidir qual card cortar e qual rótulo esconder.
 *
 * Cada card já era, pixel a pixel, um `number-entry` cheio (badge 72px + linha
 * de título + texto) e o flex que os separava usava `gap: 28` — exatamente o
 * `DOC_GAP` que um `number-entry` já traz de margem. Então a conversão é 1:1,
 * sem nenhum ajuste de espaçamento.
 */
function cicloGroup(
  id: string,
  index: number,
  periodo: string,
  cards: { key: string; accent: string; value: number | null | undefined; titulo: string; texto: string; subtitulo?: string }[],
): DocumentBlock {
  const nomes = ['Formativo', 'Produtivo', 'da Colheita e Compartilhamento']
  const children: DocumentBlock[] = [
    {
      id: `${id}-head`,
      type: 'cycle-header',
      data: {
        label: `${index}º Ciclo de Vida — O Ciclo ${nomes[index - 1] ?? ''}`,
        periodo,
      },
    },
  ]

  cards.forEach(c => {
    if (!c.texto) return // o render antigo também omitia card sem texto
    children.push({
      id: `${id}-${c.key}`,
      type: 'number-entry',
      data: {
        value: c.value,
        accent: c.accent,
        useTitulo: true,
        titulo: c.titulo,
        subtitulo: c.subtitulo,
        texto: c.texto,
      },
    })
  })

  return { id, type: 'group', pageBreakBefore: false, children }
}

function numEntry(
  id: string,
  label: string,
  value: number | null,
  accent: string,
  interp: InterpretationMap,
  interpKey: string,
  defKey?: string,
  instrucaoKey?: string
): DocumentBlock {
  const i = interp[interpKey]
  return {
    id,
    type: 'number-entry',
    data: {
      label,
      value,
      accent,
      titulo: i?.titulo ?? label,
      texto: i?.texto ?? '',
      definicaoTexto: defKey ? interp[defKey]?.texto : undefined,
      instrucaoTexto: instrucaoKey ? interp[instrucaoKey]?.texto : undefined
    },
  }
}

export interface ArcanoInfo {
  nome: string
  descricao: string
  desafio?: string
  /** Este card foi cortado NO MEIO da própria descrição (splitBlock,
   *  triangulo-arcanos-lista) — a página anterior já mostrou "Arcano N: Nome"
   *  + o começo do texto; aqui só o resto do parágrafo continua. */
  isTextContinuation?: boolean
}

// Lê o texto de um arcano a partir de `interp` (Neon, tipo 'pessoal_arcano',
// editável em Textos → Arcanos) em vez do glossário estático em lib/arcanos.ts.
// Arcano Regente, Arcano Vigente e a Sequência de Arcanos são todos a MESMA
// lista de 99 textos — só muda qual número está em foco (ver comentário em
// ARCANOS_LIST, CustomTexts.tsx). `titulo` no banco vem como "N — Nome"
// (migrations 023-025); `texto` vem como "descrição\n\nDesafio: ...".
function arcanoLookup(interp: InterpretationMap, numero: number | null | undefined): ArcanoInfo | null {
  if (numero === null || numero === undefined) return null
  const row = interp[`pessoal_arcano_${numero}`]
  if (!row) return null
  const nome = row.titulo?.includes(' — ') ? row.titulo.split(' — ').slice(1).join(' — ') : row.titulo
  const [descricao, ...resto] = (row.texto || '').split('\n\nDesafio:')
  const desafio = resto.length > 0 ? resto.join('\n\nDesafio:').trim() : undefined
  return { nome: nome || `Arcano ${numero}`, descricao: descricao.trim(), desafio }
}



function customBlockHeading(block: CustomBlock, asChild: boolean): DocumentBlock {
  return {
    id: block.id,
    type: 'section-heading',
    data: {
      label: block.title,
      introTexto: block.text,
      ...(asChild ? { variant: 'entry' } : {}),
    },
  }
}

function customBlockGroup(block: CustomBlock): DocumentBlock {
  return {
    id: block.id,
    type: 'group',
    pageBreakBefore: false,
    children: [customBlockHeading(block, false)],
  }
}

function applyConfiguredTitles(block: DocumentBlock, config: BlockOrderConfig): DocumentBlock {
  const anchorToExternal = new Map(Object.entries(SECTION_ANCHOR_MAP).map(([id, anchor]) => [anchor, id]))
  const externalId = anchorToExternal.get(block.id)
  const override = externalId ? config.titleOverrides?.[externalId] : undefined
  const data = { ...(block.data ?? {}) }

  if (override) {
    if (block.type === 'number-entry' && data.value !== undefined) {
      data.titulo = `${override}: ${data.value}`
    } else {
      data.label = override
    }
  }

  return {
    ...block,
    ...(Object.keys(data).length ? { data } : {}),
    ...(block.children ? { children: block.children.map(child => applyConfiguredTitles(child, config)) } : {}),
  }
}

// Reordena/oculta os blocos de nível superior e seus sub-blocos internos,
// incluindo as seções autorais salvas no mesmo JSON de configuração.
function applyBlockOrder(blocks: DocumentBlock[], config: BlockOrderConfig): DocumentBlock[] {
  const customBlocks = config.customBlocks ?? []
  const customById = new Map(customBlocks.map(block => [block.id, block]))
  const staticByExternalId = new Map(Object.entries(BLOCK_ID_MAP).map(([externalId, internalId]) => {
    const block = blocks.find(item => item.id === internalId)
    return [externalId, block] as const
  }))
  const topByExternalId = new Map<string, DocumentBlock>()
  staticByExternalId.forEach((block, id) => { if (block) topByExternalId.set(id, block) })
  customBlocks.filter(block => !block.parentId).forEach(block => topByExternalId.set(block.id, customBlockGroup(block)))

  const orderedTop = config.order
    .filter(id => !config.hidden.includes(id))
    .map(id => topByExternalId.get(id))
    .filter((block): block is DocumentBlock => !!block)

  topByExternalId.forEach((block, id) => {
    if (!config.order.includes(id) && !config.hidden.includes(id)) orderedTop.push(block)
  })

  return orderedTop.map(topBlock => {
    const externalId = Object.keys(BLOCK_ID_MAP).find(id => BLOCK_ID_MAP[id] === topBlock.id) ?? topBlock.id
    const childConfig = config.children?.[externalId]
    if (!childConfig || !topBlock.children) return applyConfiguredTitles(topBlock, config)

    const staticChildMap = GROUP_CHILD_ID_MAP[externalId] ?? {}
    const internalToExternal = new Map(Object.entries(staticChildMap).map(([id, internalId]) => [internalId, id]))
    const fixedTypes: BlockType[] = ['section-heading', 'orientation']
    const isFixed = (child: DocumentBlock) => child.fixed === true || fixedTypes.includes(child.type)
    const fixedChildren = topBlock.children.filter(isFixed)
    const reorderableChildren = topBlock.children.filter(child => !isFixed(child))
    const childByExternalId = new Map<string, DocumentBlock>()

    reorderableChildren.forEach(child => {
      const childExternalId = internalToExternal.get(child.id)
      if (childExternalId) childByExternalId.set(childExternalId, child)
    })
    customBlocks.filter(block => block.parentId === externalId).forEach(block => {
      childByExternalId.set(block.id, customBlockHeading(block, true))
    })

    const orderedChildren = childConfig.order
      .filter(id => !childConfig.hidden.includes(id))
      .map(id => childByExternalId.get(id))
      .filter((block): block is DocumentBlock => !!block)

    childByExternalId.forEach((child, id) => {
      if (!childConfig.order.includes(id) && !childConfig.hidden.includes(id)) orderedChildren.push(child)
    })

    return applyConfiguredTitles({ ...topBlock, children: [...fixedChildren, ...orderedChildren] }, config)
  })
}

export function buildDocumentBlocks(
  map: NumerologyMap,
  subject: string,
  dataNascimento: string,
  interp: InterpretationMap,
  blockOrder: BlockOrderConfig = DEFAULT_BLOCK_ORDER
): DocumentBlock[] {
  const tabLabel = 'Pessoal'

  // Bloco: Capa (só a capa — nunca reordenável/ocultável, sempre a 1ª página)
  const blocoCapa: DocumentBlock = {
    id: 'bloco-capa',
    type: 'group',
    pageBreakBefore: false,
    children: [
      { id: 'cover', type: 'cover', data: { subject, tabLabel, dataNascimento } },
    ]
  }

  // Bloco: Orientação + Importante (Importante é sub-bloco de Orientação,
  // reordenável/ocultável via block-order.ts children['orientacao'])
  const blocoOrientacao: DocumentBlock = {
    id: 'bloco-orientacao',
    type: 'group',
    pageBreakBefore: false,
    children: [
      {
        id: 'orientation',
        type: 'orientation',
        data: { textoOrientacao: interp['estatico_orientacao']?.texto || '' },
      },
      {
        id: 'importante',
        type: 'importante',
        data: { texto: interp['estatico_importante']?.texto || '' },
      },
    ]
  }

  // Bloco: Os Seus Números
  const blocoNumeros: DocumentBlock = {
    id: 'bloco-numeros',
    type: 'group',
    pageBreakBefore: false,
    children: [
      {
        id: 'summary',
        type: 'summary-list',
        data: {
          subject,
          dataNascimento,
          diaNatalicio: parseInt(dataNascimento.split('/')[0], 10) || null,
          psiquico: map.psiquico,
          motivacao: map.motivacao,
          impressao: map.impressao,
          expressao: map.expressao,
          talentoOculto: map.talentoOculto,
          aptidoesProfissionais: map.expressao,
          destino: map.destino,
          missao: map.missao,
          anoPessoal: map.anoPessoal,
          diaPessoal: map.diaPessoal,
          licoesCarmicas: map.licoesCarmicas.length > 0 ? map.licoesCarmicas.join(', ') : 'Nenhuma',
          tendenciasOcultas: map.tendenciasOcultas.length > 0 ? map.tendenciasOcultas.join(', ') : 'Nenhuma',
          respostaSubconsciente: map.respostaSubconsciente,
          debitosCarmicos: map.debitosCarmicos.length > 0 ? map.debitosCarmicos.join(', ') : 'Nenhum',
          ciclosDeVida: map.ciclosDeVida.length > 0 ? map.ciclosDeVida.map(c => c.regente).join(', ') : '',
          desafios: map.desafios ? `${map.desafios.desafio1}, ${map.desafios.desafio2}, ${map.desafios.desafioPrincipal}` : '',
          momentosDecisivos: map.momentosDecisivos ? `${map.momentosDecisivos.momento1}, ${map.momentosDecisivos.momento2}, ${map.momentosDecisivos.momento3}, ${map.momentosDecisivos.momento4}` : '',
          diasFavoraveis: map.diasFavoraveis.length > 0 ? map.diasFavoraveis.join(', ') : 'Nenhum',
          numerosHarmonicos: map.numerosHarmonicos.length > 0 ? map.numerosHarmonicos.join(', ') : 'Nenhum',
          arcanoRegente: map.trianguloDaVida?.arcanoRegente ?? null,
          arcanoAtual: map.arcanoAtual?.numero ?? null,
          textoImportante: interp['estatico_importante_resumo']?.texto || '',
        },
      }
    ]
  }

  // Bloco 2: Personalidade — Motivação, Impressão, Expressão, Talento Oculto, Psíquico
  // "Quem você É" — alma, máscara, expressão, dons e personalidade consciente
  const blocoPersonalidade: DocumentBlock = {
    id: 'bloco-personalidade',
    type: 'group',
    pageBreakBefore: false,
    children: [
      heading('h-personalidade', 'Personalidade', false, interp['estatico_def_personalidade_intro']?.texto),
      numEntry('num-motivacao',  'Motivação',          map.motivacao,     'gold',    interp, `pessoal_motivacao`,     'estatico_def_motivacao'),
      numEntry('num-impressao',  'Impressão',           map.impressao,     'magenta', interp, `pessoal_impressao`,     'estatico_def_impressao'),
      numEntry('num-expressao',  'Expressão',           map.expressao,     'coral',   interp, `pessoal_expressao`,     'estatico_def_expressao'),
      numEntry('num-talento',    'Talento Oculto',       map.talentoOculto, 'info',    interp, `pessoal_talentoOculto`, 'estatico_def_talento_oculto'),
      numEntry('num-psiquico',   'Número Psíquico',     map.psiquico,      'gold',    interp, `pessoal_psiquico`,      'estatico_def_psiquico'),
    ]
  }

  // Bloco 3: Propósito de Vida — Dia Natalício, Destino, Missão, Aptidões
  // "Por que você veio" — trajetória, missão e vocação
  const blocoPropositoVida: DocumentBlock = {
    id: 'bloco-proposito-vida',
    type: 'group',
    pageBreakBefore: false,
    children: [
      heading('h-proposito-vida', 'Propósito de Vida', false, interp['estatico_def_proposito_vida_intro']?.texto),
      numEntry('num-dia-natalicio', 'Dia Natalício', map.diaNatalicio, 'gold',    interp, `pessoal_dia_natalicio`, 'estatico_def_dia_natalicio'),
      numEntry('num-destino',       'Destino',        map.destino,      'coral',   interp, `pessoal_destino`,        'estatico_def_destino'),
      numEntry('num-missao',        'Missão',         map.missao,       'magenta', interp, `pessoal_missao`,         'estatico_def_missao'),
      numEntry('num-aptidoes',      'Aptidões e Potencialidades Profissionais', map.expressao, 'gold', interp, `pessoal_aptidoes`, 'estatico_def_aptidoes'),
    ]
  }

  // Bloco 4: Aspectos Cármicos — Lições, Débitos, Tendências, Resposta Subconsciente
  // "O que precisa superar" — padrões kármicos e provas de vida
  const filhosKarma: DocumentBlock[] = [
    heading('h-karma-desafios', 'Aspectos Cármicos', false, interp['estatico_def_aspectos_carmicos_intro']?.texto),
    numEntry('num-resposta', 'Resposta Subconsciente', map.respostaSubconsciente, 'info', interp, `pessoal_respostaSubconsciente`, 'estatico_def_resposta_subconsciente'),
  ]

  if (map.licoesCarmicas.length > 0) {
    filhosKarma.push(numListGroup(
      'licoes', 'Lições Cármicas', 'Lição Cármica', 'magenta',
      interp['estatico_def_licao_carmica']?.texto || 'Qualidades que precisam ser desenvolvidas ao longo da vida.',
      map.licoesCarmicas.map(v => ({ value: v, texto: interp[`pessoal_licao_carmica_${v}`]?.texto ?? '' })),
    ))
  }

  // Débitos Cármicos: sempre presente — quando o mapa não tem nenhum débito
  // (13/14/16/19), mostra o texto de ausência (estatico_sem_debitos) em vez
  // de simplesmente omitir a seção.
  filhosKarma.push(numListGroup(
    'debitos', 'Débitos Cármicos', 'Débito Cármico', 'magenta',
    interp['estatico_def_debito_carmico']?.texto || 'Padrões de carma que exigem atenção e superação.',
    map.debitosCarmicos.map(v => ({ value: v, texto: interp[`pessoal_debito_carmico_${v}`]?.texto ?? '' })),
    interp['estatico_sem_debitos']?.texto,
  ))

  if (map.tendenciasOcultas.length > 0) {
    filhosKarma.push(numListGroup(
      'tendencias', 'Tendências Ocultas', 'Tendência Oculta', 'success',
      interp['estatico_def_tendencia_oculta']?.texto || 'Potencialidades ocultas que influenciam a personalidade.',
      map.tendenciasOcultas.map(v => ({ value: v, texto: interp[`pessoal_tendenciaOculta_${v}`]?.texto ?? '' })),
    ))
  }

  // Desafios NÃO entra aqui como bloco solto: já aparece embutido em cada
  // Ciclo de Vida (cycles-entry, "Desafio do Período"/"Desafio Principal")
  // dentro do bloco "Ciclos de Vida, Desafios e Momentos Decisivos" logo
  // abaixo — tinha uma duplicata aqui em "Aspectos Cármicos" que foi retirada
  // (mesmo motivo pelo qual Momentos Decisivos nunca teve bloco solto: só
  // existe embutido nos Ciclos).

  const blocoKarmaDesafios: DocumentBlock = {
    id: 'bloco-karma-desafios',
    type: 'group',
    pageBreakBefore: false,
    children: filhosKarma
  }

  // Parse do ano de nascimento para cálculo das idades de ciclos/desafios/momentos
  const dobParts = dataNascimento.split('/').map(Number)
  const birthYear = dobParts.length >= 3 && !isNaN(dobParts[2]) ? dobParts[2] : new Date().getFullYear()
  const destVal = map.destino ?? 1
  const l1 = 37 - destVal
  const l2 = l1 + 27
  const lm3 = l1 + 9
  const lm4 = l1 + 18

  // Bloco 5: Ciclos de Vida, Desafios e Momentos Decisivos
  // Estrutura espelha o documento de referência: título → definições gerais
  // das 3 categorias (Ciclos de Vida · Desafios · Momentos Decisivos) → só
  // então os ciclos em ordem cronológica, todos com a mesma estrutura interna.
  const filhosCiclosVida: DocumentBlock[] = [
    heading('h-ciclos-vida', 'Ciclos de Vida, Desafios e Momentos Decisivos', false, interp['estatico_def_ciclos_intro']?.texto),
    // ESTRUTURA UNIFORME (2026-07-26) — era `cycles-intro`, um composto com as
    // 3 definições de categoria num elemento só (e um splitter que cortava por
    // seção e, na seção-fronteira, por linha). Agora é um `group` de 3
    // `section-heading variant:'def'` independentes.
    ...(() => {
      const defs = [
        { id: 'ciclos-intro-ciclo', label: 'Ciclos de Vida', texto: interp['estatico_def_ciclo']?.texto },
        { id: 'ciclos-intro-desafio', label: 'Desafios', texto: interp['estatico_def_desafio']?.texto },
        { id: 'ciclos-intro-momento', label: 'Momentos Decisivos', texto: interp['estatico_def_momento_decisivo']?.texto },
      ].filter(d => d.texto)
      if (defs.length === 0) return []
      return [{
        id: 'ciclos-intro',
        type: 'group' as BlockType,
        pageBreakBefore: false,
        fixed: true, // abre a seção, antes dos ciclos reordenáveis
        children: defs.map((d, i) => ({
          id: d.id,
          type: 'section-heading' as BlockType,
          data: {
            label: d.label,
            variant: 'def',
            introTexto: d.texto,
            // `gap: 20` entre seções no composto; a última herdava o DOC_GAP
            // do wrapper.
            spaceAfter: i === defs.length - 1 ? 28 : 20,
          },
        })),
      }]
    })(),
  ]

  if (map.ciclosDeVida.length >= 3) {
    // Helpers locais pra ler título/texto de cada categoria do `interp`
    const ciclo = (r: number | undefined) => ({
      titulo: interp[`pessoal_ciclo_${r}`]?.titulo || `Ciclo Regente ${r}`,
      texto: interp[`pessoal_ciclo_${r}`]?.texto || '',
    })
    const desafio = (r: number | undefined) => ({
      titulo: interp[`pessoal_desafio_${r}`]?.titulo || `Desafio ${r}`,
      texto: interp[`pessoal_desafio_${r}`]?.texto || '',
    })
    const momento = (r: number | undefined) => ({
      titulo: interp[`pessoal_momentoDecisivo_${r}`]?.titulo || `Momento Decisivo ${r}`,
      texto: interp[`pessoal_momentoDecisivo_${r}`]?.texto || '',
    })
    const idades = (a: number | string, b: number | string) =>
      `${a === 0 ? 'de 0' : `de ${a}`} a ${b === 'fim' ? 'fim da vida' : b} anos`

    // 1º Ciclo de Vida
    const c1 = map.ciclosDeVida[0]?.regente
    const d1 = map.desafios?.desafio1
    const m1 = map.momentosDecisivos?.momento1
    const p1Str = `${birthYear} a ${birthYear + l1} (${idades(0, l1)})`
    filhosCiclosVida.push(cicloGroup('ciclo-1', 1,
      p1Str,
      [
        { key: 'ciclo', accent: 'gold', value: c1, titulo: cleanTitleWithSub('Regente do Ciclo:', ciclo(c1).titulo, c1), subtitulo: `Período: ${p1Str}`, texto: ciclo(c1).texto },
        { key: 'desafio', accent: 'coral', value: d1, titulo: cleanTitleWithSub('Desafio do Período:', desafio(d1).titulo, d1), subtitulo: `Período: ${p1Str}`, texto: desafio(d1).texto },
        { key: 'momento', accent: 'coral', value: m1, titulo: cleanTitleWithSub('Momento Decisivo do Período:', momento(m1).titulo, m1), subtitulo: `Período: ${birthYear} a ${birthYear + l1} (${idades(0, l1)})`, texto: momento(m1).texto },
      ],
    ))

    // 2º Ciclo de Vida — dois Momentos Decisivos, cada um com seu período
    const c2 = map.ciclosDeVida[1]?.regente
    const d2 = map.desafios?.desafio2
    const m2 = map.momentosDecisivos?.momento2
    const m3 = map.momentosDecisivos?.momento3
    const p2Str = `${birthYear + l1} a ${birthYear + l2} (${idades(l1, l2)})`
    filhosCiclosVida.push(cicloGroup('ciclo-2', 2,
      p2Str,
      [
        { key: 'ciclo', accent: 'gold', value: c2, titulo: cleanTitleWithSub('Regente do Ciclo:', ciclo(c2).titulo, c2), subtitulo: `Período: ${p2Str}`, texto: ciclo(c2).texto },
        { key: 'desafio', accent: 'coral', value: d2, titulo: cleanTitleWithSub('Desafio do Período:', desafio(d2).titulo, d2), subtitulo: `Período: ${p2Str}`, texto: desafio(d2).texto },
        {
          key: 'momento2', accent: 'coral', value: m2,
          titulo: cleanTitleWithSub('2º Momento Decisivo:', momento(m2).titulo, m2),
          subtitulo: `Período: ${birthYear + l1} a ${birthYear + lm3} (${idades(l1, lm3)})`,
          texto: momento(m2).texto,
        },
        {
          key: 'momento3', accent: 'coral', value: m3,
          titulo: cleanTitleWithSub('3º Momento Decisivo:', momento(m3).titulo, m3),
          subtitulo: `Período: ${birthYear + lm3} a ${birthYear + lm4} (${idades(lm3, lm4)})`,
          texto: momento(m3).texto,
        },
      ],
    ))

    // 3º Ciclo de Vida — Desafio Principal (vida toda) + 4º Momento
    const c3 = map.ciclosDeVida[2]?.regente
    const dp = map.desafios?.desafioPrincipal
    const m4 = map.momentosDecisivos?.momento4
    const p3Str = `${birthYear + l2} a resto da vida (${idades(l2, 'fim')})`
    filhosCiclosVida.push(cicloGroup('ciclo-3', 3,
      p3Str,
      [
        { key: 'ciclo', accent: 'gold', value: c3, titulo: cleanTitleWithSub('Regente do Ciclo:', ciclo(c3).titulo, c3), subtitulo: `Período: ${p3Str}`, texto: ciclo(c3).texto },
        { key: 'desafio', accent: 'coral', value: dp, titulo: cleanTitleWithSub('Desafio Principal (Atua a vida toda):', desafio(dp).titulo, dp), subtitulo: `Período: atua a vida toda (${idades(0, 'fim')})`, texto: desafio(dp).texto },
        {
          key: 'momento4', accent: 'coral', value: m4,
          titulo: cleanTitleWithSub('4º Momento Decisivo:', momento(m4).titulo, m4),
          subtitulo: `Período: a partir de ${birthYear + lm4} (${lm4} anos)`,
          texto: momento(m4).texto,
        },
      ],
    ))
  }

  const blocoCiclosVida: DocumentBlock = {
    id: 'bloco-ciclos-vida',
    type: 'group',
    pageBreakBefore: false,
    children: filhosCiclosVida
  }

  // Novo Bloco: Previsões Temporais (Ano, Mês e Dia Pessoal)
  const filhosPrevisoesTempo: DocumentBlock[] = [
    heading('h-previsoes-tempo', 'Previsões Temporais', false, interp['estatico_def_previsoes_intro']?.texto),
    numEntry('num-ano', 'Ano Pessoal (Atual)', map.anoPessoal, 'gold', interp, `pessoal_anoPessoal`, 'estatico_def_ano_pessoal', 'estatico_instrucao_ano_pessoal')
  ]

  // ESTRUTURA UNIFORME (2026-07-26) — ver nota do Dia Pessoal abaixo. Os Meses
  // Pessoais eram um `timeline-entry` composto (título + intro + instrução +
  // grade-resumo + 12 itens num elemento só) com splitter próprio; agora são um
  // `group` de unidades atômicas, paginado pela regra geral.
  if (map.mesesPessoais && map.mesesPessoais.length > 0) {
    const meses = map.mesesPessoais
    filhosPrevisoesTempo.push({
      id: 'meses-pessoais',
      type: 'group',
      pageBreakBefore: false,
      children: [
        {
          id: 'meses-pessoais-head',
          type: 'section-heading',
          data: {
            label: 'Meses Pessoais (Próximos 12 meses)',
            variant: 'entry', // mesmo h2 do render composto antigo
            introTexto: interp['estatico_def_mes_pessoal']?.texto,
            instrucaoTexto: interp['estatico_instrucao_mes_pessoal']?.texto,
          },
        },
        {
          id: 'meses-pessoais-grade',
          type: 'summary-grid',
          data: {
            items: meses.map(m => ({ title: m.nome, subtitle: String(m.ano), value: m.numero })),
          },
        },
        ...meses.map((m, i) => ({
          id: `meses-pessoais-${i}`,
          type: 'number-entry' as BlockType,
          data: {
            variant: 'compact',
            rotulo: m.nome,
            value: m.numero,
            texto: interp[`pessoal_mesPessoal_${m.numero}`]?.texto ?? '',
            emptyFallback: 'Consulte um numerólogo para uma leitura personalizada deste mês.',
          },
        })),
      ],
    })
  }

  // Dia Pessoal: em vez de só o valor de hoje (que fica desatualizado assim
  // que o mapa é impresso/entregue em outra data), mostra hoje em destaque
  // + um guia de referência com o significado de todos os 11 valores
  // possíveis (1-9/11/22) — o cliente consegue usar o mapa como um oráculo
  // diário permanente, calculando o Dia Pessoal de qualquer data e
  // consultando o significado aqui.
  // ESTRUTURA UNIFORME (2026-07-25) — o Dia Pessoal era um bloco COMPOSTO
  // (`dia-pessoal-entry`: destaque de hoje + cabeçalho do guia + 11 itens, tudo
  // num elemento só), e por isso precisava de código de corte PRÓPRIO no
  // paginador. Agora é um `group` — exatamente como Personalidade/Propósito —
  // cujos filhos são as MESMAS unidades atômicas usadas por Motivação,
  // Expressão etc. Consequências:
  //   • a paginação passa a tratá-lo com a regra geral (nenhuma regra própria);
  //   • `flattenDocumentBlocks` já recursa em `group`, então a sequência chega
  //     plana ao paginador sem nenhuma mudança lá;
  //   • o id `num-dia` continua sendo UM bloco endereçável, então
  //     `applyBlockOrder`/GROUP_CHILD_ID_MAP e as configurações já salvas em
  //     `block_order` seguem valendo — não há migração de dados.
  if (map.diaPessoal !== null) {
    const i = interp['pessoal_diaPessoal']
    const hoje = map.diaPessoal
    filhosPrevisoesTempo.push({
      id: 'num-dia',
      type: 'group',
      pageBreakBefore: false,
      children: [
        // Destaque de hoje — mesma unidade atômica das entradas de Personalidade
        {
          id: 'num-dia-hoje',
          type: 'number-entry',
          data: {
            label: 'Dia Pessoal',
            value: hoje,
            accent: 'coral', // = theme.primaryColor, cor usada antes
            useTitulo: true,
            titulo: cleanTitleWithSub('Hoje: Dia Pessoal', i?.titulo, hoje),
            texto: i?.texto ?? '',
            definicaoTexto: interp['estatico_def_dia_pessoal']?.texto,
          },
        },
        // Cabeçalho interno do guia + instrução de cálculo
        {
          id: 'num-dia-guia-head',
          type: 'section-heading',
          data: {
            label: 'Guia de Dias Pessoais',
            variant: 'sub',
            instrucaoTexto:
              interp['estatico_instrucao_dia_pessoal']?.texto ??
              'Some o Mês Pessoal com o dia do calendário para saber o Dia Pessoal de qualquer data e consulte o significado abaixo.',
          },
        },
        // Um bloco por número do guia — cada um paginável por si só
        ...DIA_PESSOAL_GUIA_NUMEROS.map(n => ({
          id: `num-dia-guia-${n}`,
          type: 'number-entry' as BlockType,
          data: {
            variant: 'compact',
            value: n,
            highlight: n === hoje,
            titulo: interp[`pessoal_diaPessoal_guia_${n}`]?.titulo ?? `Dia Pessoal ${n}`,
            texto: interp[`pessoal_diaPessoal_guia_${n}`]?.texto ?? '',
          },
        })),
      ],
    })
  }

  // Dias Favoráveis do Mês — mesma ordem do documento de referência (Ano →
  // Mês → Dia Pessoal → Dias Favoráveis). Os dias são FIXOS para a pessoa
  // (tabela DIAS_BASICOS por dia+mês de nascimento, calcDiasFavoraveis) e se
  // repetem em todos os meses do ano — a instrução explica isso ao cliente.
  // ESTRUTURA UNIFORME (2026-07-26) — era `dias-favoraveis-entry` composto
  // (título + intro + instrução + chips + N textos) com splitter próprio.
  if (map.diasFavoraveis.length > 0) {
    const dias = map.diasFavoraveis
    filhosPrevisoesTempo.push({
      id: 'dias-favoraveis',
      type: 'group',
      pageBreakBefore: false,
      children: [
        {
          id: 'dias-favoraveis-head',
          type: 'section-heading',
          data: {
            label: 'Dias Favoráveis do Mês',
            variant: 'entry',
            introTexto: interp['estatico_def_dias_favoraveis']?.texto,
            instrucaoTexto: interp['estatico_instrucao_dias_favoraveis']?.texto,
          },
        },
        {
          id: 'dias-favoraveis-grade',
          type: 'summary-grid',
          data: { variant: 'chips', items: dias.map(d => ({ title: 'Dia', value: d })) },
        },
        ...dias.map(d => ({
          id: `dias-favoraveis-${d}`,
          type: 'number-entry' as BlockType,
          data: {
            variant: 'compact',
            rotulo: 'Dia',
            value: d,
            texto: interp[`pessoal_dia_favoravel_${d}`]?.texto ?? '',
            emptyFallback: 'Consulte um numerólogo para uma leitura personalizada deste dia.',
          },
        })),
      ],
    })
  }

  const blocoPrevisoesTempo: DocumentBlock = {
    id: 'bloco-previsoes-tempo',
    type: 'group',
    pageBreakBefore: false,
    children: filhosPrevisoesTempo
  }

  // Bloco 6: Relacionamentos — Harmonia Conjugal (apenas)
  const blocoRelacionamentos: DocumentBlock = {
    id: 'bloco-relacionamentos',
    type: 'group',
    pageBreakBefore: false,
    children: [
      heading('h-relacionamentos', 'Relacionamentos', false, interp['estatico_def_relacionamentos_intro']?.texto),
      ...(map.missao && map.harmoniaConjugal ? [conjugalGroup(map.missao, map.harmoniaConjugal, interp)] : []),
    ]
  }

  // Bloco 7: Triângulo da Vida e Arcanos — 4 sub-blocos independentes
  const filhosTriangulo: DocumentBlock[] = [
    heading('h-triangulo', 'Triângulo da Vida e Arcanos', false, interp['estatico_def_triangulo_intro']?.texto),
  ]

  if (map.trianguloDaVida) {
    // 7a. Pirâmide visual + bloqueios. Os textos de cada bloqueio (sequência
    // 111-999) vêm do banco (tipo 'pessoal_bloqueio', editável em Textos) —
    // o BLOQUEIOS_MAP embutido em numerology.ts vira só fallback.
    // ESTRUTURA UNIFORME (2026-07-26) — era `triangulo-piramide`, um composto
    // (título + grade + N cards de bloqueio) com corte de 2 vias no splitter.
    // Agora: título, grade (atômica) e cada bloqueio são blocos irmãos.
    const bloqueios = map.trianguloDaVida.bloqueios ?? []
    filhosTriangulo.push({
      id: 'triangulo-piramide',
      type: 'group',
      pageBreakBefore: false,
      children: [
        {
          id: 'piramide-head',
          type: 'section-heading',
          data: { label: 'Triângulo da Vida (Pirâmide)', variant: 'entry' },
        },
        {
          id: 'piramide-grade',
          type: 'piramide-grid',
          data: { trianguloDaVida: map.trianguloDaVida },
        },
        ...(bloqueios.length > 0
          ? bloqueios.map((b, i) => {
              const info = interp[`pessoal_bloqueio_${b.codigo}`]
              return {
                id: `piramide-bloqueio-${b.codigo}`,
                type: 'alert-card' as BlockType,
                data: {
                  titulo: info?.titulo ?? b.titulo,
                  texto: info?.texto ?? `${b.descricao}\n\nAspecto de saúde: ${b.aspectoSaude}`,
                  // `gap: 8` entre cards; o último herdava o DOC_GAP do wrapper.
                  spaceAfter: i === bloqueios.length - 1 ? 28 : 8,
                },
              }
            })
          : interp['estatico_sem_bloqueios']?.texto
            ? [{
                id: 'piramide-sem-bloqueios',
                type: 'alert-card' as BlockType,
                data: {
                  titulo: interp['estatico_sem_bloqueios']?.titulo ?? 'Sem Bloqueios Cármicos',
                  texto: interp['estatico_sem_bloqueios']?.texto,
                  isSuccess: true,
                  spaceAfter: 28,
                },
              }]
            : []),
      ],
    })

    // 7b. Arcano Regente
    if (map.trianguloDaVida.arcanoRegente !== null) {
      filhosTriangulo.push({
        id: 'triangulo-arcano-regente',
        type: 'triangulo-arcano-regente',
        data: {
          arcanoRegente: map.trianguloDaVida.arcanoRegente,
          arcanoInfo: arcanoLookup(interp, map.trianguloDaVida.arcanoRegente),
        }
      })
    }

    // 7c. Arcano Vigente (de Trânsito)
    if (map.arcanoAtual) {
      filhosTriangulo.push({
        id: 'triangulo-arcano-vigente',
        type: 'triangulo-arcano-vigente',
        data: {
          arcanoAtual: map.arcanoAtual,
          sequenciaCompleta: map.trianguloDaVida.sequenciaCompleta,
          arcanoInfo: arcanoLookup(interp, map.arcanoAtual.numero),
        }
      })
    }

    // 7d. Todos os Arcanos da pessoa (sequência cronológica)
    // ESTRUTURA UNIFORME (2026-07-26) — era `triangulo-arcanos-lista`, um
    // composto (subtítulo + caixa da cronologia + h2 + N cards) cujo splitter
    // precisava dos modos `titleOnly`/`introOnly`/`hideIntroText`/`hideCards`
    // só pra conseguir separar a caixa das esferas dos cards. Agora cada peça é
    // um bloco: a caixa é atômica e os cards fluem pela regra geral.
    if (map.trianguloDaVida.sequenciaCompleta.length > 0) {
      const seq = map.trianguloDaVida.sequenciaCompleta
      const arcanosUnicos = Array.from(new Set(seq))
      filhosTriangulo.push({
        id: 'triangulo-arcanos-lista',
        type: 'group',
        pageBreakBefore: false,
        children: [
          {
            id: 'arcanos-linha-head',
            type: 'section-heading',
            data: { label: 'Linha do Tempo dos Arcanos (Jornada da Vida)', variant: 'entry' },
          },
          {
            id: 'arcanos-linha',
            type: 'arcanos-timeline',
            data: { sequenciaCompleta: seq, arcanoAtual: map.arcanoAtual },
          },
          {
            id: 'arcanos-cards-head',
            type: 'section-heading',
            data: { label: 'Interpretação de Cada Arcano da sua Jornada', variant: 'entry' },
          },
          ...arcanosUnicos.map(n => {
            const arc = arcanoLookup(interp, n)
            // O "Desafio:" era um <p> à parte, atômico no fim do card — o que
            // produzia a órfã relatada (só "bem." + o Desafio migravam de
            // página). Vira markdown do próprio texto, então flui e pode ser
            // cortado como qualquer parágrafo.
            const texto = [arc?.descricao, arc?.desafio ? `**Desafio:** ${arc.desafio}` : '']
              .filter(Boolean)
              .join('\n\n')
            return {
              id: `arcano-${n}`,
              type: 'number-entry' as BlockType,
              data: {
                variant: 'plain',
                value: n,
                accent: 'magenta',
                highlight: n === map.arcanoAtual?.numero,
                titulo: `Arcano ${n}: ${arc?.nome ?? `Arcano ${n}`}`,
                texto,
                emptyFallback: 'Consulte um numerólogo para uma leitura personalizada deste arcano.',
              },
            }
          }),
        ],
      })
    }
  }

  const blocoTriangulo: DocumentBlock = {
    id: 'bloco-triangulo',
    type: 'group',
    pageBreakBefore: false,
    children: filhosTriangulo
  }

  // Bloco: Conclusão (novo, adicionado em 2026-07-11 — fecha o relatório, que hoje
  // termina abruptamente após Relacionamentos. Conteúdo em si é Fase 2 (ver
  // requisitos.md, seção 3a) — aqui só existe a estrutura/posição do bloco;
  // sem texto configurado ainda, mostra um aviso discreto em vez de nada.)
  const blocoConclusao: DocumentBlock = {
    id: 'bloco-conclusao',
    type: 'group',
    pageBreakBefore: false,
    children: [
      { id: 'conclusao', type: 'conclusion', data: { texto: interp['estatico_conclusao']?.texto || '' } },
    ]
  }

  // Return the top-level nested blocks, reordenados/filtrados conforme block_order do perfil.
  // Regra de bloco-pai (Guilherme, 2026-07-23): CADA grupo de nível superior
  // começa numa PÁGINA NOVA — Orientação, Os Seus Números (sozinha),
  // Personalidade e todos os demais, inclusive Conclusão. Exceção: a Capa (já é
  // a folha 1 isolada, fora do fluxo). Os sub-blocos FILHOS dentro de cada
  // pai continuam com o fluxo natural de texto (começam nessa página nova e só
  // quebram pra próxima quando não há mais espaço). Como `flattenDocumentBlocks`
  // só injeta a quebra quando já existe conteúdo antes, o 1º grupo de conteúdo
  // (Orientação, logo após a capa) não ganha uma página vazia extra.
  return applyBlockOrder(
    [
      blocoCapa,
      blocoOrientacao,
      blocoNumeros,
      blocoPersonalidade,
      blocoPropositoVida,
      blocoKarmaDesafios,
      blocoCiclosVida,
      blocoPrevisoesTempo,
      blocoRelacionamentos,
      blocoTriangulo,
      blocoConclusao,
    ],
    blockOrder
  ).map(b => (b.type === 'group' && b.id !== 'bloco-capa' ? { ...b, pageBreakBefore: true } : b))
}


function countMarkdownLines(text?: string): number {
  if (!text) return 0
  const paragraphs = text.split(/\n\n+/)
  let lines = 0
  for (const p of paragraphs) {
    const clean = p.replace(/#+\s+/g, '').replace(/\[.*?\]/g, '').trim()
    if (!clean) continue
    lines += Math.max(1, Math.ceil(clean.length / 62))
    lines += 0.5 // parágrafo gap
  }
  return lines
}

function calcMarkdownHeightMM(text?: string): number {
  const lines = countMarkdownLines(text)
  return lines * 5.0
}

export function estimateBlockHeight(block: DocumentBlock): number {
  const data = (block.data || {}) as any

  if (data.isContinuation) {
    if (block.type === 'number-entry') {
      return calcMarkdownHeightMM(data.texto) + 10
    }
    if (block.type === 'orientation' || block.type === 'importante' || block.type === 'conclusion') {
      return calcMarkdownHeightMM(data.texto || data.textoOrientacao) + 10
    }
  }

  switch (block.type) {
    case 'section-heading': {
      const intro = calcMarkdownHeightMM(data.introTexto)
      return 15 + (intro > 0 ? intro + 8 : 0)
    }
    case 'number-entry': {
      const def = calcMarkdownHeightMM(data.definicaoTexto)
      const inst = calcMarkdownHeightMM(data.instrucaoTexto)
      const text = calcMarkdownHeightMM(data.texto)
      return 32 + (def > 0 ? def + 6 : 0) + (inst > 0 ? inst + 8 : 0) + text + 10
    }
    case 'triangulo-arcano-regente': {
      const desc = calcMarkdownHeightMM(data.arcanoInfo?.descricao)
      const des = calcMarkdownHeightMM(data.arcanoInfo?.desafio)
      return 25 + desc + des + 10
    }
    case 'triangulo-arcano-vigente': {
      const desc = calcMarkdownHeightMM(data.arcanoInfo?.descricao)
      const des = calcMarkdownHeightMM(data.arcanoInfo?.desafio)
      return 35 + desc + des + 10
    }
    case 'summary-list':
    case 'summary-table': {
      return 180
    }
    case 'orientation':
    case 'importante':
    case 'conclusion': {
      return 20 + calcMarkdownHeightMM(data.texto || data.textoOrientacao)
    }
    default:
      return 40
  }
}

function splitTextAtHeight(text: string, availableMM: number): [string, string] | null {
  if (!text) return null
  const paragraphs = text.split(/\n\n+/)
  if (paragraphs.length === 0) return null

  let cumH = 0
  let splitIdx = 0
  for (let i = 0; i < paragraphs.length; i++) {
    const pH = calcMarkdownHeightMM(paragraphs[i])
    if (cumH + pH > availableMM && i > 0) {
      break
    }
    cumH += pH
    splitIdx = i + 1
  }

  if (splitIdx > 0 && splitIdx < paragraphs.length) {
    const p1 = paragraphs.slice(0, splitIdx).join('\n\n')
    const p2 = paragraphs.slice(splitIdx).join('\n\n')
    return [p1, p2]
  }

  if (paragraphs.length > 0) {
    const targetPIdx = splitIdx === 0 ? 0 : splitIdx - 1
    const pTarget = paragraphs[targetPIdx]
    const sentences = pTarget.match(/[^.!?]+[.!?]+(\s+|$)/g) || [pTarget]

    if (sentences.length > 1) {
      const priorH = paragraphs.slice(0, targetPIdx).reduce((acc, p) => acc + calcMarkdownHeightMM(p), 0)
      let sentH = priorH
      let sentSplitIdx = 0
      for (let s = 0; s < sentences.length; s++) {
        const sLines = Math.ceil(sentences[s].length / 62) * 5.0
        if (sentH + sLines > availableMM && s > 0) {
          break
        }
        sentH += sLines
        sentSplitIdx = s + 1
      }

      if (sentSplitIdx > 0 && sentSplitIdx < sentences.length) {
        const s1 = sentences.slice(0, sentSplitIdx).join('').trim()
        const s2 = sentences.slice(sentSplitIdx).join('').trim()

        const text1 = [...paragraphs.slice(0, targetPIdx), s1].join('\n\n')
        const text2 = [s2, ...paragraphs.slice(targetPIdx + 1)].join('\n\n')

        return [text1, text2]
      }
    }
  }

  return null
}

// Heurística de corte (contagem de caracteres) — imprecisa por natureza. Só é
// usada agora nos previews de AMOSTRA (Blocos/Templates, sample-preview.ts), que
// paginam sem medição real. O documento REAL usa splitBlockMeasured (abaixo).
function splitBlockHeuristic(block: DocumentBlock, availableMM: number): [DocumentBlock, DocumentBlock] | null {
  const data = (block.data || {}) as any

  if (block.type === 'number-entry' && data.texto) {
    const baseOverhead = data.isContinuation ? 0 : (32 + (data.definicaoTexto ? calcMarkdownHeightMM(data.definicaoTexto) + 6 : 0) + (data.instrucaoTexto ? calcMarkdownHeightMM(data.instrucaoTexto) + 8 : 0))
    const availableForText = availableMM - baseOverhead

    if (availableForText >= 12) {
      const textSplit = splitTextAtHeight(data.texto, availableForText)
      if (textSplit) {
        const [p1, p2] = textSplit
        const b1: DocumentBlock = {
          ...block,
          data: { ...data, texto: p1 }
        }
        const b2: DocumentBlock = {
          ...block,
          id: `${block.id}-part2`,
          data: {
            ...data,
            texto: p2,
            definicaoTexto: undefined,
            instrucaoTexto: undefined,
            isContinuation: true,
          }
        }
        return [b1, b2]
      }
    }
  }



  return null
}

// ─────────────────────────────────────────────────────────────────────────
// Corte por MEDIÇÃO REAL (substitui a adivinhação por contagem de caracteres)
// ─────────────────────────────────────────────────────────────────────────
//
// `measure(block)` devolve a altura REAL (mm) do bloco candidato, renderizado
// fora da tela com a MESMA fonte/CSS/largura do documento final
// (measure-document.tsx o fornece). Assim o ponto de corte é onde o texto de
// fato transborda a linha — nunca uma estimativa. É o padrão que ferramentas
// reais de paginação usam (Paged.js, CSS Fragmentation): renderiza primeiro,
// mede depois, corta no lugar exato.

export type MeasureFn = (block: DocumentBlock) => number

// Blocos que NÃO se dividem (exceções pontuais à regra geral "todo bloco pode
// ser cortado por linha"). São elementos estruturais/atômicos: capa, tabelas de
// resumo, títulos, a pirâmide como imagem, e os cards curtos de ciclo/arcano/
// conjugal que perdem sentido cortados no meio. Para tornar um tipo cortável no
// futuro, basta removê-lo daqui e garantir que o render trate `isContinuation`.
const ATOMIC_BLOCK_TYPES: ReadonlySet<BlockType> = new Set<BlockType>([
  'cover', 'group', 'page-break',
  'section-heading', 'summary-list', 'summary-table', 'summary-grid', 'plain-text', 'arcanos-timeline', 'cycle-header',
  'piramide-grid', 'alert-card',
  'orientation', 'importante', 'conclusion',
  'triangulo-arcano-regente', 'triangulo-arcano-vigente',
])

const MIN_SPLIT_WORDS = 6 // não deixa órfão de 1-2 palavras no fim da página

// Posições de corte a nível de PALAVRA (offset após cada palavra), preservando
// as quebras de parágrafo (\n\n) e a formatação markdown do texto original —
// part1 = text.slice(0, cut), part2 = text.slice(cut).
function wordCutOffsets(text: string): number[] {
  const offs: number[] = []
  const re = /\S+/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) offs.push(m.index + m[0].length)
  return offs
}

function sliceTextByWords(text: string, wordCount: number, offs: number[]): [string, string] {
  const cut = offs[wordCount - 1]
  return [text.slice(0, cut).replace(/\s+$/, ''), text.slice(cut).replace(/^\s+/, '')]
}

// Evita cortar no meio de um marcador markdown (**negrito**, __sublinhado__,
// *itálico*, _sublinhado_): part1 precisa ter contagem PAR de cada marcador.
function markerBalanced(s: string): boolean {
  const pairs = (s.match(/\*\*/g) || []).length
  const unders2 = (s.match(/__/g) || []).length
  const singleStar = (s.replace(/\*\*/g, '').match(/\*/g) || []).length
  const singleUnder = (s.replace(/__/g, '').match(/_/g) || []).length
  return pairs % 2 === 0 && unders2 % 2 === 0 && singleStar % 2 === 0 && singleUnder % 2 === 0
}

// Maior k em [1..max] tal que measure(makePart1(k)) <= availableMM (0 = nem k=1
// cabe). A altura cresce monotonicamente com k (mais palavras/itens = mais
// alto), então busca binária é exata e barata (~log2 medições).
function measuredMaxFit(
  makePart1: (k: number) => DocumentBlock,
  max: number,
  availableMM: number,
  measure: MeasureFn,
): number {
  let lo = 1, hi = max, best = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (measure(makePart1(mid)) <= availableMM) { best = mid; lo = mid + 1 }
    else hi = mid - 1
  }
  return best
}

// "Só-cabeçalho": quando NEM o item-fronteira (inteiro ou cortado por
// palavra) cabe, testa se o CABEÇALHO SOZINHO (título+intro+instrução+grade-
// resumo, zero itens) cabe no espaço restante. `measuredMaxFit` nunca testa
// isso (começa em k=1) — sem este check explícito, um cabeçalho que cabia
// tranquilamente era jogado inteiro pra pular pra nova página junto com TODOS
// os itens, deixando a folha anterior com uma folga enorme (o card de
// "Momentos Decisivos"/"Meses Pessoais" começando sozinho na folha de baixo
// mesmo sobrando bastante espaço em cima). Mesmo princípio do "só-cabeçalho"
// que `number-entry` já tinha, generalizado pra qualquer bloco-lista.
function tryHeaderOnly(makeEmpty: () => DocumentBlock, availableMM: number, measure: MeasureFn): DocumentBlock | null {
  const candidate = makeEmpty()
  return measure(candidate) <= availableMM ? candidate : null
}

// Corta o TEXTO de um item-fronteira (o 1º item de uma lista que não coube
// inteiro) por PALAVRA — mesma técnica usada em number-entry/cycles-intro —
// devolvendo [prefixo, resto] ou null se não há texto suficiente pra valer a
// pena (ou o corte cairia dentro de um marcador markdown, sem sobra pra
// recuar). `measureCandidate(prefixo)` mede a altura MM do bloco CANDIDATO
// inteiro (itens fixos anteriores + este item com o texto = prefixo) — cada
// chamador (dia-pessoal, arcanos, meses, dias favoráveis) sabe montar esse
// candidato com sua própria estrutura de dados; esta função só decide ONDE
// cortar a palavra. Usada pra nunca deixar sobrar espaço só porque o PRÓXIMO
// item não cabe inteiro — em vez disso, mostra o começo do texto dele.
function cutBoundaryText(
  text: string,
  availableMM: number,
  measureCandidate: (prefixText: string) => number,
): [string, string] | null {
  const offs = wordCutOffsets(text)
  if (offs.length <= MIN_SPLIT_WORDS) return null
  let lo = 1, hi = offs.length - 1, best = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const [prefix] = sliceTextByWords(text, mid, offs)
    if (measureCandidate(prefix) <= availableMM) { best = mid; lo = mid + 1 } else { hi = mid - 1 }
  }
  let wc = best

  // SEM guarda de mínimo de palavras na continuação — corte puro por linha,
  // exatamente o que a busca binária mediu que cabe (pedido explícito do
  // Guilherme, retestado 2026-07-23 após reiniciar o servidor de dev).
  while (wc > MIN_SPLIT_WORDS && !markerBalanced(sliceTextByWords(text, wc, offs)[0])) wc--
  if (wc < MIN_SPLIT_WORDS || wc >= offs.length) return null
  return sliceTextByWords(text, wc, offs)
}

// Corte de blocos baseados em LISTA de itens (mesma lógica de continuação dos
// branches heurísticos, só que o índice de corte vem da medição real).
function splitItemsMeasured(
  block: DocumentBlock,
  items: unknown[],
  availableMM: number,
  measure: MeasureFn,
  makePart1: (n: number) => DocumentBlock,
  makePart2: (n: number) => DocumentBlock,
): [DocumentBlock, DocumentBlock] | null {
  if (!items || items.length < 2) return null
  const n = measuredMaxFit(makePart1, items.length - 1, availableMM, measure)
  if (n < 1) return null
  return [makePart1(n), makePart2(n)]
}

// Ponto de entrada da paginação real. Devolve [part1, part2] cabendo part1 em
// availableMM, ou null quando o bloco não deve/pode ser cortado aqui (o
// paginador então empurra o bloco inteiro pra próxima página).
function splitBlockMeasured(
  block: DocumentBlock,
  availableMM: number,
  measure: MeasureFn,
): [DocumentBlock, DocumentBlock] | null {
  if (ATOMIC_BLOCK_TYPES.has(block.type)) return null
  const data = (block.data || {}) as any
  const part2Id = `${block.id}-part2`

  // number-entry: fluxo de corte em 3 níveis. Mantém número + título juntos o
  // máximo possível, mas deixa o TEXTO e a INTRODUÇÃO fluírem por LINHA — nunca
  // pula o bloco inteiro se algo dele ainda cabe na página.
  if (block.type === 'number-entry') {
    const texto = typeof data.texto === 'string' ? data.texto : ''
    const def = typeof data.definicaoTexto === 'string' ? data.definicaoTexto : ''

    // Nível 1 — corta o CORPO por palavra (número + título + definição ficam).
    // Usa a MESMA `cutBoundaryText` de todos os outros blocos-lista — antes
    // tinha sua própria busca binária duplicada aqui, que NÃO recebeu a
    // guarda "nunca deixa a continuação com <MIN_SPLIT_WORDS" quando ela foi
    // adicionada, causando a mesma "palavra órfã sozinha na folha de baixo"
    // (ex.: "Resposta Subconsciente") mesmo depois do fix em cutBoundaryText.
    if (texto.trim()) {
      const cut = cutBoundaryText(texto, availableMM, prefix => measure({ ...block, data: { ...data, texto: prefix } }))
      if (cut) {
        const [t1, t2] = cut
        return [
          { ...block, data: { ...data, texto: t1 } },
          { ...block, id: part2Id, data: { ...data, texto: t2, definicaoTexto: undefined, instrucaoTexto: undefined, isContinuation: true } },
        ]
      }
    }

    if (!data.isContinuation) {
      // Nível 2 — "só cabeçalho": número + título + definição inteira ficam na
      // página atual; o corpo inteiro migra (quando a definição ainda cabe).
      if (texto.trim()) {
        const headerOnly: DocumentBlock = { ...block, data: { ...data, texto: '', deferredText: true } }
        if (measure(headerOnly) <= availableMM) {
          return [
            headerOnly,
            { ...block, id: part2Id, data: { ...data, texto, definicaoTexto: undefined, instrucaoTexto: undefined, isContinuation: true } },
          ]
        }
      }

      // Nível 3 — a própria INTRODUÇÃO é alta demais pra caber junto do número:
      // corta a definição por LINHA (título + começo da intro ficam; resto da
      // intro + número + corpo continuam na próxima página).
      if (def.trim()) {
        // Nível 2.5 — a definição INTEIRA (sem cortar nada) cabe sozinha
        // (defHeadOnly não desenha o número/72px, só título+blockquote — mais
        // leve que o candidato do Nível 2, que incluía o número). Se o Nível
        // 2 falhou só por causa do NÚMERO (não da definição em si), a
        // definição inteira geralmente cabe aqui — sem isso, o código pulava
        // direto pro corte por palavra mesmo sobrando espaço de sobra na
        // página (relatado ao vivo: definição terminando bem antes do rodapé,
        // ainda assim cortando 1 frase pra próxima página à toa).
        const fullDefHeadOnly: DocumentBlock = { ...block, data: { ...data, defHeadOnly: true } }
        if (measure(fullDefHeadOnly) <= availableMM) {
          return [
            fullDefHeadOnly,
            { ...block, id: part2Id, data: { ...data, definicaoTexto: undefined, instrucaoTexto: undefined } },
          ]
        }

        // Nível 3 — nem a definição inteira cabe: corta ela por LINHA. Mesma
        // `cutBoundaryText` compartilhada (ver nota no Nível 1 acima).
        const cut = cutBoundaryText(def, availableMM, prefix => measure({ ...block, data: { ...data, definicaoTexto: prefix, defHeadOnly: true } }))
        if (cut) {
          const [d1, d2] = cut
          return [
            { ...block, data: { ...data, definicaoTexto: d1, defHeadOnly: true } },
            { ...block, id: part2Id, data: { ...data, definicaoTexto: d2, hideDefLabel: true, instrucaoTexto: undefined } },
          ]
        }
      }
    }
    return null
  }




  return null
}

// Dispatcher: com `measure` (documento real), corta por medição real de DOM;
// sem ela (previews de amostra), cai na heurística por contagem de caracteres.
export function splitBlock(
  block: DocumentBlock,
  availableMM: number,
  measure?: MeasureFn,
): [DocumentBlock, DocumentBlock] | null {
  return measure
    ? splitBlockMeasured(block, availableMM, measure)
    : splitBlockHeuristic(block, availableMM)
}

// Altura ÚTIL de conteúdo numa folha A4 de conteúdo (`.content-section`):
// 297mm − 22mm (padding-top) − 14mm (padding-bottom) = 261mm. É o espaço real
// dentro do qual os blocos fluem (o wrapper interno em DocumentPreviewStack tem
// height:100% + overflow:hidden dessa mesma caixa). Precisa bater com a área
// REAL — como a paginação usa medição de DOM real (measure-document.tsx), um
// orçamento menor que 261 só deixa uma faixa em branco fixa no fim de cada
// página; um maior estoura o overflow:hidden e corta conteúdo. A margem de
// segurança (sub-pixel / arredondamento de fonte) é aplicada no paginador, não
// aqui — ver PAGE_SAFETY_MM em measure-document.tsx.
export const MAX_PAGE_HEIGHT_MM = 261 // = 297 − 22 (topo) − 14 (rodapé)
export const PX_PER_MM = 96 / 25.4

export function flattenDocumentBlocks(blocks: DocumentBlock[]): DocumentBlock[] {
  const flatBlocks: DocumentBlock[] = []
  function flatten(block: DocumentBlock) {
    if (block.type === 'cover') return
    if (block.type === 'group') {
      if (block.pageBreakBefore && flatBlocks.length > 0) {
        flatBlocks.push({ id: `pb-${block.id}`, type: 'page-break' })
      }
      block.children?.forEach(flatten)
      return
    }
    flatBlocks.push(block)
  }
  blocks.forEach(flatten)
  return flatBlocks
}

// ─────────────────────────────────────────────────────────────────────────
// Sumário / Índice (TOC) — estrutura dinâmica refletindo a ordem de blocos
// ─────────────────────────────────────────────────────────────────────────

export interface TocEntry {
  id: string        // ID externo do bloco (ex.: 'personalidade')
  label: string     // Rótulo exibido (ex.: 'Personalidade')
  level: 1 | 2     // 1 = seção principal, 2 = subseção
  pageNumber: number
  anchor: string    // HTML id do primeiro elemento DOM desta seção
}

// Mapeia IDs externos (block-order.ts) → ID do primeiro bloco DOM que
// aparece nas pages[] para aquela seção. Usado para:
//   (a) encontrar o número de página (scan em pages[])
//   (b) gerar o href da âncora clicável no PDF
export const SECTION_ANCHOR_MAP: Record<string, string> = {
  // Seções de nível superior
  orientacao:      'orientation',
  os_seus_numeros: 'summary',
  personalidade:   'h-personalidade',
  proposito_vida:  'h-proposito-vida',
  karma_desafios:  'h-karma-desafios',
  ciclos_vida:     'h-ciclos-vida',
  previsoes_tempo: 'h-previsoes-tempo',
  relacionamentos: 'h-relacionamentos',
  triangulo:       'h-triangulo',
  conclusao:       'conclusao',
  // Personalidade (filhos)
  motivacao:       'num-motivacao',
  impressao:       'num-impressao',
  expressao:       'num-expressao',
  talento_oculto:  'num-talento',
  psiquico:        'num-psiquico',
  // Propósito de Vida (filhos)
  dia_natalicio:   'num-dia-natalicio',
  destino:         'num-destino',
  missao:          'num-missao',
  aptidoes:        'num-aptidoes',
  // Aspectos Cármicos (filhos)
  licao_carmica:          'licoes-head',
  debito_carmica:         'debitos-head',
  tendencia_oculta:       'tendencias-head',
  resposta_subconsciente: 'num-resposta',
  // Ciclos de Vida (filhos)
  ciclo_1: 'ciclo-1-head',
  ciclo_2: 'ciclo-2-head',
  ciclo_3: 'ciclo-3-head',
  // Previsões Temporais (filhos)
  ano_pessoal:     'num-ano',
  mes_pessoal:     'meses-pessoais-head',
  dia_pessoal:     'num-dia-hoje',
  dias_favoraveis: 'dias-favoraveis-head',
  // Relacionamentos (filhos)
  harmonia_conjugal: 'conjugal-head',
  // Triângulo da Vida (filhos)
  triangulo_piramide:       'piramide-head',
  triangulo_arcano_regente: 'triangulo-arcano-regente',
  triangulo_arcano_vigente: 'triangulo-arcano-vigente',
  triangulo_arcanos_lista:  'arcanos-linha-head',
}

/** Constrói as entradas do sumário a partir da ordem efetiva de blocos e
 *  do mapa blockId → número de página calculado pelo paginador.
 *  Entradas cujo bloco não existe no documento (blocos condicionais, ex.:
 *  Lições Cármicas quando não há nenhuma) são omitidas automaticamente. */
export function buildTocEntries(
  config: BlockOrderConfig,
  blockPageMap: Map<string, number>,
): TocEntry[] {
  const entries: TocEntry[] = []
  const skip = new Set(['capa'])
  const customById = new Map((config.customBlocks ?? []).map(block => [block.id, block]))

  for (const extId of config.order) {
    if (skip.has(extId) || config.hidden.includes(extId)) continue
    const def = BLOCK_DEFS.find(d => d.id === extId)
    const custom = customById.get(extId)
    if (!def && (!custom || custom.parentId)) continue
    const anchor = custom ? custom.id : SECTION_ANCHOR_MAP[extId]
    if (!anchor) continue
    const pageNumber = blockPageMap.get(anchor)
    if (!pageNumber) continue

    entries.push({ id: extId, label: custom?.title ?? getBlockTitle(config, extId, def!.label), level: 1, pageNumber, anchor })

    const childConfig = config.children?.[extId]
    if (!childConfig) continue

    for (const childExtId of childConfig.order) {
      if (childConfig.hidden.includes(childExtId)) continue
      const childDef = def?.children?.find(c => c.id === childExtId)
      const childCustom = customById.get(childExtId)
      if (!childDef && (!childCustom || childCustom.parentId !== extId)) continue
      const childAnchor = childCustom ? childCustom.id : SECTION_ANCHOR_MAP[childExtId]
      if (!childAnchor) continue
      const childPageNumber = blockPageMap.get(childAnchor)
      if (!childPageNumber) continue

      entries.push({ id: childExtId, label: childCustom?.title ?? getBlockTitle(config, childExtId, childDef!.label), level: 2, pageNumber: childPageNumber, anchor: childAnchor })
    }
  }

  return entries
}

/** Cria o sumário a partir das páginas já medidas. Todos os previews usam
 * esta função para que capa, índice e números coincidam com o PDF final. */
export function buildTocEntriesFromPages(
  config: BlockOrderConfig,
  pages: DocumentBlock[][],
): TocEntry[] {
  const blockPageMap = new Map<string, number>()

  pages.forEach((pageBlocks, pageIdx) => {
    pageBlocks.forEach(block => {
      // Um bloco dividido conserva o id na primeira parte; as demais recebem
      // sufixos. O índice precisa apontar sempre para a primeira ocorrência.
      if (!blockPageMap.has(block.id)) blockPageMap.set(block.id, pageIdx + 1)
    })
  })

  return buildTocEntries(config, blockPageMap)
}

export function splitIntoPages(blocks: DocumentBlock[]): DocumentBlock[][] {
  const pages: DocumentBlock[][] = []
  let currentPage: DocumentBlock[] = []
  let currentHeight = 0
  const maxH = MAX_PAGE_HEIGHT_MM

  function pushCurrentPage() {
    if (currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = []
      currentHeight = 0
    }
  }

  const flatBlocks = flattenDocumentBlocks(blocks)

  for (let i = 0; i < flatBlocks.length; i++) {
    const block = flatBlocks[i]

    if (block.type === 'page-break') {
      pushCurrentPage()
      continue
    }

    const bh = estimateBlockHeight(block)

    if (currentHeight + bh <= maxH) {
      currentPage.push(block)
      currentHeight += bh
      continue
    }

    if (currentPage.length > 0 && bh <= maxH) {
      pushCurrentPage()
      currentPage.push(block)
      currentHeight = bh
      continue
    }

    const available = maxH - currentHeight
    if (available > 30 && currentPage.length > 0) {
      const split = splitBlock(block, available)
      if (split) {
        const [part1, part2] = split
        currentPage.push(part1)
        pushCurrentPage()
        currentPage.push(part2)
        currentHeight = estimateBlockHeight(part2)
        continue
      }
    }

    if (currentPage.length > 0) {
      pushCurrentPage()
    }
    currentPage.push(block)
    currentHeight = bh
  }

  pushCurrentPage()

  return pages.filter(p => p.length > 0)
}
