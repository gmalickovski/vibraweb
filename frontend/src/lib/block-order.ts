// block-order.ts — shared config for "Blocos do Relatório".
// Defines which top-level report blocks — and their children — the consultant
// can reorder/hide in /app/blocos, and the default value used when the profile
// does not have a `block_order` saved yet.
//
// Group structure revised 2026-07-14 based on Chaldean numerology principles:
//
//  Who you ARE:
//    Personalidade → motivacao, impressao, expressao, talento_oculto, psiquico
//
//  Why you are here:
//    Propósito de Vida → dia_natalicio, destino, missao, aptidoes
//
//  What to overcome:
//    Aspectos Cármicos → licao_carmica, debito_carmica, tendencia_oculta, resposta_subconsciente
//
//  Timing & Life periods:
//    Ciclos de Vida → ciclo_1, ciclo_2, ciclo_3 (includes respective challenges & pinnacles)
//    Previsões Temporais → ano_pessoal, mes_pessoal, dia_pessoal
//
//  With whom:
//    Relacionamentos → harmonia_conjugal
//
//  Arcanos (cabalistic / pyramid):
//    Triângulo da Vida → triangulo_vida   (standalone)

export interface ChildBlockOrder {
  order: string[]
  hidden: string[]
}

/** Bloco livre criado no escopo global, de um modelo ou de uma análise.
 * `parentId` ausente representa uma seção principal (H1); presente torna o
 * bloco um sub-bloco do pai indicado (H2). */
export interface CustomBlock {
  id: string
  title: string
  text: string
  parentId?: string
}

export interface BlockOrderConfig {
  order: string[]
  hidden: string[]
  children?: Record<string, ChildBlockOrder>
  /** Rótulos dos blocos nativos. O conteúdo continua no editor de Textos. */
  titleOverrides?: Record<string, string>
  /** Conteúdo autoral, exclusivo do editor de Blocos em cada camada. */
  customBlocks?: CustomBlock[]
}

export const DEFAULT_BLOCK_ORDER: BlockOrderConfig = {
  order: [
    'capa',
    'orientacao',
    'os_seus_numeros',
    'personalidade',
    'proposito_vida',
    'karma_desafios',
    'ciclos_vida',
    'previsoes_tempo',
    'relacionamentos',
    'triangulo',
    'conclusao',
  ],
  hidden: [],
  children: {
    orientacao: {
      order: ['importante'],
      hidden: [],
    },
    personalidade: {
      order: ['motivacao', 'impressao', 'expressao', 'talento_oculto', 'psiquico'],
      hidden: [],
    },
    proposito_vida: {
      order: ['dia_natalicio', 'destino', 'missao', 'aptidoes'],
      hidden: [],
    },
    karma_desafios: {
      order: ['licao_carmica', 'debito_carmica', 'tendencia_oculta', 'resposta_subconsciente'],
      hidden: [],
    },
    ciclos_vida: {
      order: ['ciclo_1', 'ciclo_2', 'ciclo_3'],
      hidden: [],
    },
    previsoes_tempo: {
      order: ['ano_pessoal', 'mes_pessoal', 'dia_pessoal', 'dias_favoraveis'],
      hidden: [],
    },
    relacionamentos: {
      order: ['harmonia_conjugal'],
      hidden: [],
    },
    triangulo: {
      order: ['triangulo_piramide', 'triangulo_arcano_regente', 'triangulo_arcano_vigente', 'triangulo_arcanos_lista'],
      hidden: [],
    },
  },
}

export function getBlockTitle(config: BlockOrderConfig, id: string, fallback: string): string {
  const value = config.titleOverrides?.[id]?.trim()
  return value || fallback
}

export function isCustomBlockId(id: string): boolean {
  return id.startsWith('custom-')
}

export interface BlockTextTarget {
  tipo: string
  view: 'categorias' | 'gerais'
}

/** Ação contextual do modal de Blocos → campo já existente em Textos. */
export function getBlockTextTarget(id: string): BlockTextTarget | null {
  const general: Record<string, string> = {
    orientacao: 'estatico_orientacao',
    importante: 'estatico_importante',
    os_seus_numeros: 'estatico_importante_resumo',
    conclusao: 'estatico_conclusao',
  }
  if (general[id]) return { tipo: general[id], view: 'gerais' }

  const category: Record<string, string> = {
    personalidade: 'personalidade_intro', proposito_vida: 'proposito_vida_intro',
    karma_desafios: 'aspectos_carmicos_intro', ciclos_vida: 'ciclos_intro',
    previsoes_tempo: 'previsoes_intro', relacionamentos: 'relacionamentos_intro',
    triangulo: 'triangulo_intro', motivacao: 'motivacao', impressao: 'impressao',
    expressao: 'expressao', talento_oculto: 'talento_oculto', psiquico: 'psiquico',
    dia_natalicio: 'dia_natalicio', destino: 'destino', missao: 'missao', aptidoes: 'aptidoes',
    licao_carmica: 'licao_carmica', debito_carmica: 'debito_carmico',
    tendencia_oculta: 'tendencia_oculta', resposta_subconsciente: 'resposta_subconsciente',
    ciclo_1: 'ciclo', ciclo_2: 'ciclo', ciclo_3: 'ciclo', ano_pessoal: 'ano_pessoal',
    mes_pessoal: 'mes_pessoal', dia_pessoal: 'dia_pessoal', dias_favoraveis: 'dias_favoraveis',
    harmonia_conjugal: 'harmonia_conjugal', triangulo_piramide: 'triangulo_intro',
    triangulo_arcano_regente: 'triangulo_intro', triangulo_arcano_vigente: 'triangulo_intro',
    triangulo_arcanos_lista: 'triangulo_intro',
  }
  return category[id] ? { tipo: `estatico_def_${category[id]}`, view: 'categorias' } : null
}

export interface BlockDef {
  id: string
  label: string
  description: string
  lockedVisible?: boolean
  children?: BlockDef[]
}

export const BLOCK_DEFS: BlockDef[] = [
  {
    id: 'capa',
    label: 'Capa',
    description: 'Capa do documento — sempre a 1ª página, não é reordenável nem pode ser ocultada.',
    lockedVisible: true,
  },
  {
    id: 'orientacao',
    label: 'Orientação',
    description: 'Texto de abertura, logo após a capa.',
    children: [
      { id: 'importante', label: 'Importante', description: 'Explicação de como ler o mapa.' },
    ],
  },
  { id: 'os_seus_numeros',label: 'Os Seus Números',  description: 'Resumo com todos os números calculados do cliente.' },
  {
    id: 'personalidade',
    label: 'Personalidade',
    description: 'Quem você é — alma, máscara, expressão e número psíquico',
    children: [
      { id: 'motivacao',    label: 'Motivação',         description: 'Número de Motivação — alma, desejos internos (vogais)' },
      { id: 'impressao',    label: 'Impressão',          description: 'Número de Impressão — imagem externa / como é visto (consoantes)' },
      { id: 'expressao',    label: 'Expressão',          description: 'Número de Expressão — identidade vibracional completa (nome todo)' },
      { id: 'talento_oculto',label: 'Talento Oculto',   description: 'Talento escondido — junção de Motivação e Expressão' },
      { id: 'psiquico',     label: 'Número Psíquico',    description: 'Número Psíquico — personalidade consciente (dia de nascimento)' },
    ],
  },
  {
    id: 'proposito_vida',
    label: 'Propósito de Vida',
    description: 'Por que você veio — destino, missão e vocação',
    children: [
      { id: 'dia_natalicio',        label: 'Dia Natalício',          description: 'Energia especial do dia de nascimento' },
      { id: 'destino',              label: 'Destino',                description: 'Número de Destino — trajetória (data de nascimento)' },
      { id: 'missao',               label: 'Missão',                 description: 'Missão de vida — Expressão + Destino' },
      { id: 'aptidoes',             label: 'Aptidões Profissionais', description: 'Aptidões e potencialidades baseadas na Expressão' },
    ],
  },
  {
    id: 'karma_desafios',
    label: 'Aspectos Cármicos',
    description: 'O que precisa ser superado — lições, débitos, tendências ocultas e resposta subconsciente',
    children: [
      { id: 'licao_carmica',         label: 'Lições Cármicas',       description: 'Números ausentes no nome — qualidades a desenvolver' },
      { id: 'debito_carmica',        label: 'Débitos Cármicos',      description: 'Padrões kármicos (13, 14, 16, 19) que exigem superação' },
      { id: 'tendencia_oculta',      label: 'Tendências Ocultas',    description: 'Números muito repetidos no nome — energia em excesso' },
      { id: 'resposta_subconsciente',label: 'Resposta Subconsciente',description: 'Reação instintiva diante de crises e pressão' },
    ],
  },
  {
    id: 'ciclos_vida',
    label: 'Ciclos de Vida, Desafios e Momentos Decisivos',
    description: 'Os três grandes ciclos com seus respectivos desafios e pináculos cronológicos integrados',
    children: [
      { id: 'ciclo_1', label: 'Primeiro Ciclo de Vida', description: 'Ciclo Formativo + 1º Desafio + 1º Momento Decisivo' },
      { id: 'ciclo_2', label: 'Segundo Ciclo de Vida',  description: 'Ciclo Produtivo + 2º Desafio + 2º e 3º Momentos Decisivos' },
      { id: 'ciclo_3', label: 'Terceiro Ciclo de Vida', description: 'Ciclo da Colheita + Desafio Principal + 4º Momento Decisivo' },
    ],
  },
  {
    id: 'previsoes_tempo',
    label: 'Previsões Temporais',
    description: 'Ano Pessoal, Mês Pessoal e Dia Pessoal do consulente',
    children: [
      { id: 'ano_pessoal', label: 'Ano Pessoal', description: 'Energia do ano pessoal corrente' },
      { id: 'mes_pessoal', label: 'Mês Pessoal', description: 'Sequência dos meses pessoais (próximos 12)' },
      { id: 'dia_pessoal', label: 'Dia Pessoal', description: 'Energia do dia pessoal (hoje)' },
      { id: 'dias_favoraveis', label: 'Dias Favoráveis', description: 'Dias do mês que vibram favoravelmente — os mesmos em todos os meses' },
    ],
  },
  {
    id: 'relacionamentos',
    label: 'Relacionamentos',
    description: 'Compatibilidade e harmonia com outras pessoas',
    children: [
      { id: 'harmonia_conjugal', label: 'Harmonia Conjugal', description: 'Tabela de compatibilidade baseada na Missão' },
    ],
  },
  {
    id: 'triangulo',
    label: 'Triângulo da Vida e Arcanos',
    description: 'Pirâmide cabalística, arcano regente, arcano vigente e todos os arcanos da pessoa',
    children: [
      { id: 'triangulo_piramide',        label: 'Triângulo da Vida (Pirâmide)',   description: 'Pirâmide visual das letras do nome + bloqueios encontrados' },
      { id: 'triangulo_arcano_regente',  label: 'Arcano Regente',                description: 'O arcano do topo do triângulo — energia dominante da vida toda' },
      { id: 'triangulo_arcano_vigente',  label: 'Arcano Vigente',                description: 'Arcano de trânsito atual + período + duração do ciclo' },
      { id: 'triangulo_arcanos_lista',   label: 'Todos os Arcanos',              description: 'Sequência cronológica completa com descrição de cada arcano' },
    ],
  },
  { id: 'conclusao', label: 'Conclusão', description: 'Fecha o relatório.' },
]

// Mapeia ids externos (UI) para ids internos (document-builder.ts)
export const BLOCK_ID_MAP: Record<string, string> = {
  capa:            'bloco-capa',
  orientacao:      'bloco-orientacao',
  os_seus_numeros: 'bloco-numeros',
  personalidade:   'bloco-personalidade',
  proposito_vida:  'bloco-proposito-vida',
  karma_desafios:  'bloco-karma-desafios',
  ciclos_vida:     'bloco-ciclos-vida',
  previsoes_tempo: 'bloco-previsoes-tempo',
  relacionamentos: 'bloco-relacionamentos',
  triangulo:       'bloco-triangulo',
  conclusao:       'bloco-conclusao',
}

// Mapeia chaves de sub-blocos (externos) para seus IDs internos
export const GROUP_CHILD_ID_MAP: Record<string, Record<string, string>> = {
  orientacao: {
    importante: 'importante',
  },
  personalidade: {
    motivacao:    'num-motivacao',
    impressao:    'num-impressao',
    expressao:    'num-expressao',
    talento_oculto: 'num-talento',
    psiquico:     'num-psiquico',
  },
  proposito_vida: {
    dia_natalicio:  'num-dia-natalicio',
    destino:        'num-destino',
    missao:         'num-missao',
    aptidoes:       'num-aptidoes',
  },
  karma_desafios: {
    licao_carmica:          'licoes',
    debito_carmica:         'debitos',
    tendencia_oculta:       'tendencias',
    resposta_subconsciente: 'num-resposta',
  },
  ciclos_vida: {
    ciclo_1: 'ciclo-1',
    ciclo_2: 'ciclo-2',
    ciclo_3: 'ciclo-3',
  },
  previsoes_tempo: {
    ano_pessoal: 'num-ano',
    mes_pessoal: 'meses-pessoais',
    dia_pessoal: 'num-dia',
    dias_favoraveis: 'dias-favoraveis',
  },
  relacionamentos: {
    harmonia_conjugal: 'conjugal',
  },
  triangulo: {
    triangulo_piramide:       'triangulo-piramide',
    triangulo_arcano_regente: 'triangulo-arcano-regente',
    triangulo_arcano_vigente: 'triangulo-arcano-vigente',
    triangulo_arcanos_lista:  'triangulo-arcanos-lista',
  },
}

function mergeWithDefaultOrder(saved: string[], defaultOrder: string[]): string[] {
  const missing = defaultOrder.filter(id => !saved.includes(id))
  if (missing.length === 0) return saved
  const result = [...saved]
  for (const id of missing) {
    const defaultIdx = defaultOrder.indexOf(id)
    let insertBeforeId: string | undefined
    for (let i = defaultIdx + 1; i < defaultOrder.length; i++) {
      if (result.includes(defaultOrder[i])) { insertBeforeId = defaultOrder[i]; break }
    }
    if (insertBeforeId) {
      result.splice(result.indexOf(insertBeforeId), 0, id)
    } else {
      result.push(id)
    }
  }
  return result
}

/** Garante um BlockOrderConfig válido a partir do valor salvo no perfil (possivelmente nulo/antigo). */
export function normalizeBlockOrder(raw: unknown): BlockOrderConfig {
  if (!raw || typeof raw !== 'object') return DEFAULT_BLOCK_ORDER

  const cfg = raw as Partial<BlockOrderConfig>
  let savedOrder  = Array.isArray(cfg.order) && cfg.order.length > 0 ? cfg.order : DEFAULT_BLOCK_ORDER.order
  let savedHidden = Array.isArray(cfg.hidden) ? cfg.hidden : []
  const rawCustomBlocks = Array.isArray(cfg.customBlocks)
    ? cfg.customBlocks
    : Object.values((cfg as { customBlocks?: Record<string, CustomBlock> }).customBlocks ?? {})
  const customBlocks: CustomBlock[] = rawCustomBlocks
    .filter((block): block is CustomBlock => !!block && typeof block === 'object' && typeof block.id === 'string' && isCustomBlockId(block.id))
    .map(block => ({
      id: block.id,
      title: typeof block.title === 'string' && block.title.trim() ? block.title.trim() : 'Novo bloco',
      text: typeof block.text === 'string' ? block.text : '',
      ...(typeof block.parentId === 'string' && block.parentId ? { parentId: block.parentId } : {}),
    }))
  const customIds = new Set(customBlocks.map(block => block.id))

  // Inicializa estrutura de filhos a partir do padrão ou do perfil
  const children: Record<string, ChildBlockOrder> = {}
  for (const [groupKey, defaultVal] of Object.entries(DEFAULT_BLOCK_ORDER.children || {})) {
    const userVal = cfg.children?.[groupKey]
    children[groupKey] = {
      order: userVal && Array.isArray(userVal.order) ? [...userVal.order] : [...defaultVal.order],
      hidden: userVal && Array.isArray(userVal.hidden) ? [...userVal.hidden] : [...defaultVal.hidden],
    }
  }

  // Pais autorais carregam a mesma estrutura de ordenação dos grupos nativos.
  // Isso permite criar uma seção (H1) e, em seguida, soltar blocos filhos (H2)
  // nela sem inventar uma segunda representação de árvore.
  customBlocks.forEach(block => {
    const saved = cfg.children?.[block.id] as Partial<ChildBlockOrder> | undefined
    children[block.id] = {
      order: saved && Array.isArray(saved.order) ? [...saved.order] : [],
      hidden: saved && Array.isArray(saved.hidden) ? [...saved.hidden] : [],
    }
  })

  // ── Migrações de estruturas anteriores ───────────────────────────────────

  // 1. Renomeia top-level ids antigos → novos
  const topMigration: Record<string, string> = {
    caminho_desafios: 'karma_desafios',
    caminho_destino:  'karma_desafios',
    caminho:          'karma_desafios',
    essencia:         'personalidade',
    potencial:        'proposito_vida',
    desafios_karma:   'karma_desafios',
    ciclos_tempo:     'ciclos_vida', // migra ciclos_tempo -> ciclos_vida
  }
  savedOrder  = savedOrder.map(id => topMigration[id] ?? id)
  savedHidden = savedHidden.map(id => topMigration[id] ?? id)

  // Se 'ciclos_vida' está na ordem mas não 'previsoes_tempo', insere 'previsoes_tempo' logo após
  if (savedOrder.includes('ciclos_vida') && !savedOrder.includes('previsoes_tempo')) {
    const idx = savedOrder.indexOf('ciclos_vida')
    savedOrder.splice(idx + 1, 0, 'previsoes_tempo')
  }

  // 2. Migra filhos de grupos antigos para novos destinos
  const oldEssenciaLike = ['essencia', 'personalidade']
  for (const src of oldEssenciaLike) {
    const old = cfg.children?.[src] as Partial<ChildBlockOrder> | undefined
    if (!old) continue
    if (Array.isArray(old.hidden)) {
      old.hidden.forEach(h => {
        if (h === 'talento_oculto' && !children['personalidade'].hidden.includes(h)) {
          children['personalidade'].hidden.push(h)
        }
        if (h === 'aptidoes' && !children['proposito_vida'].hidden.includes(h)) {
          children['proposito_vida'].hidden.push(h)
        }
      })
    }
  }

  type ChildTarget = { group: string; id: string }
  const oldChildTarget: Record<string, ChildTarget> = {
    dia_natalicio:          { group: 'proposito_vida',  id: 'dia_natalicio' },
    destino:                { group: 'proposito_vida',  id: 'destino' },
    missao:                 { group: 'proposito_vida',  id: 'missao' },
    aptidoes:               { group: 'proposito_vida',  id: 'aptidoes' },
    psiquico:               { group: 'personalidade',   id: 'psiquico' },
    licao_carmica:          { group: 'karma_desafios',  id: 'licao_carmica' },
    debito_carmica:         { group: 'karma_desafios',  id: 'debito_carmica' },
    tendencia_oculta:       { group: 'karma_desafios',  id: 'tendencia_oculta' },
    resposta_subconsciente: { group: 'karma_desafios',  id: 'resposta_subconsciente' },
    harmonia_conjugal:      { group: 'relacionamentos', id: 'harmonia_conjugal' },
    triangulo_vida:         { group: 'triangulo',       id: 'triangulo_vida' },
  }
  const oldGroupSources = ['caminho', 'caminho_desafios', 'potencial', 'desafios_karma', 'relacionamentos']
  for (const src of oldGroupSources) {
    const old = cfg.children?.[src] as Partial<ChildBlockOrder> | undefined
    if (!old || !Array.isArray(old.hidden)) continue
    old.hidden.forEach(h => {
      const t = oldChildTarget[h]
      if (t && !children[t.group].hidden.includes(t.id)) {
        children[t.group].hidden.push(t.id)
      }
    })
  }

  // Migra filhos de ciclos_tempo (antigos) para os dois novos blocos
  const oldCiclos = cfg.children?.['ciclos_tempo'] as Partial<ChildBlockOrder> | undefined
  if (oldCiclos && Array.isArray(oldCiclos.hidden)) {
    oldCiclos.hidden.forEach(h => {
      if (h === 'ano_pessoal' && !children['previsoes_tempo'].hidden.includes('ano_pessoal')) {
        children['previsoes_tempo'].hidden.push('ano_pessoal')
      }
      if (h === 'mes_pessoal' && !children['previsoes_tempo'].hidden.includes('mes_pessoal')) {
        children['previsoes_tempo'].hidden.push('mes_pessoal')
      }
      if (h === 'dia_pessoal' && !children['previsoes_tempo'].hidden.includes('dia_pessoal')) {
        children['previsoes_tempo'].hidden.push('dia_pessoal')
      }
      // Se ocultava ciclos_vida ou momentos_decisivos ou desafios, oculta todos os 3 ciclos novos por garantia
      if (['ciclos_vida', 'momentos_decisivos', 'desafios'].includes(h)) {
        ;['ciclo_1', 'ciclo_2', 'ciclo_3'].forEach(c => {
          if (!children['ciclos_vida'].hidden.includes(c)) {
            children['ciclos_vida'].hidden.push(c)
          }
        })
      }
    })
  }

  // 4. Flat ids muito antigos (top-level direto)
  const flatMigration: Record<string, ChildTarget> = {
    licoes_carmicas:    { group: 'karma_desafios', id: 'licao_carmica' },
    debitos_carmicos:   { group: 'karma_desafios', id: 'debito_carmica' },
    tendencias_ocultas: { group: 'karma_desafios', id: 'tendencia_oculta' },
  }
  Object.entries(flatMigration).forEach(([flatId, t]) => {
    if (savedHidden.includes(flatId) && !children[t.group].hidden.includes(t.id)) {
      children[t.group].hidden.push(t.id)
    }
  })

  // ── Finaliza ──────────────────────────────────────────────────────────────
  const validIds = new Set([...DEFAULT_BLOCK_ORDER.order, ...customBlocks.filter(block => !block.parentId).map(block => block.id)])
  const order = mergeWithDefaultOrder(
    savedOrder.filter(id => validIds.has(id)),
    [...DEFAULT_BLOCK_ORDER.order, ...customBlocks.filter(block => !block.parentId).map(block => block.id)]
  )
  const hidden = savedHidden.filter(id => validIds.has(id))

  // Acrescenta filhos autorais aos respectivos pais e elimina referências
  // órfãs deixadas por um bloco removido em alguma camada anterior.
  const validParentIds = new Set([...DEFAULT_BLOCK_ORDER.order, ...customIds])
  customBlocks.forEach(block => {
    if (block.parentId && !validParentIds.has(block.parentId)) delete block.parentId
  })
  Object.entries(children).forEach(([parentId, childConfig]) => {
    const nativeChildren = (DEFAULT_BLOCK_ORDER.children?.[parentId]?.order ?? [])
    const customChildren = customBlocks.filter(block => block.parentId === parentId).map(block => block.id)
    const validChildren = new Set([...nativeChildren, ...customChildren])
    childConfig.order = mergeWithDefaultOrder(childConfig.order.filter(id => validChildren.has(id)), [...nativeChildren, ...customChildren])
    childConfig.hidden = childConfig.hidden.filter(id => validChildren.has(id))
  })

  const titleOverrides = Object.fromEntries(
    Object.entries(cfg.titleOverrides ?? {}).filter(([id, title]) =>
      (DEFAULT_BLOCK_ORDER.order.includes(id) || Object.values(DEFAULT_BLOCK_ORDER.children ?? {}).some(group => group.order.includes(id)))
      && typeof title === 'string' && title.trim().length > 0,
    ).map(([id, title]) => [id, (title as string).trim()]),
  )

  return { order, hidden, children, ...(Object.keys(titleOverrides).length ? { titleOverrides } : {}), ...(customBlocks.length ? { customBlocks } : {}) }
}
