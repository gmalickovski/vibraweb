// document-builder.ts
// Converts a computed NumerologyMap + fetched interpretations into ordered DocumentBlock[].
// Each block maps to a rendered component in PreviewPage.
// Uses a nested "blocks within blocks" structure.

import type { NumerologyMap } from './numerology'
import type { AnalysisTab } from '../pages/AppPage'
import {
  DEFAULT_BLOCK_ORDER,
  BLOCK_ID_MAP,
  GROUP_CHILD_ID_MAP,
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
  | 'section-heading'
  | 'number-entry'
  | 'multi-number-entry'
  | 'list-entry'
  | 'timeline-entry'
  | 'cycles-entry'
  | 'moments-entry'
  | 'conjugal-entry'
  | 'triangulo-entry'       // legacy — não mais usado, mantido para compatibilidade
  | 'triangulo-piramide'    // pirâmide visual + bloqueios
  | 'triangulo-arcano-regente'  // card do arcano regente
  | 'triangulo-arcano-vigente'  // arcano vigente + período + duração
  | 'triangulo-arcanos-lista'   // sequência cronológica de todos os arcanos
  | 'page-break'

export interface DocumentBlock {
  id: string
  type: BlockType
  pageBreakBefore?: boolean
  data?: Record<string, unknown>
  children?: DocumentBlock[]
}

export interface InterpretationMap {
  [key: string]: { titulo: string; texto: string } | null
}

// Fonte única das chaves buscadas no Supabase pra montar o `interp` passado a
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

// Chaves estáticas (numero fixo = 1): Orientação/Importante/Resumo/Conclusão
// + a introdução de cada categoria (`estatico_def_*`, editável em "Textos" →
// Introduções de Categoria). PreviewPage.tsx nunca buscava nenhuma destas —
// o bug raiz por trás de "a introdução não aparece no mapa gerado".
export const STATIC_TEXT_KEYS = [
  'estatico_orientacao', 'estatico_importante', 'estatico_importante_resumo', 'estatico_conclusao',
  'estatico_def_motivacao', 'estatico_def_impressao', 'estatico_def_expressao',
  'estatico_def_talento_oculto', 'estatico_def_aptidoes', 'estatico_def_dia_natalicio',
  'estatico_def_psiquico', 'estatico_def_destino', 'estatico_def_missao',
  'estatico_def_licao_carmica', 'estatico_def_debito_carmica', 'estatico_def_tendencia_oculta', 'estatico_def_desafio',
  'estatico_def_ciclo', 'estatico_def_resposta_subconsciente', 'estatico_def_harmonia_conjugal',
  'estatico_def_ano_pessoal', 'estatico_def_mes_pessoal', 'estatico_def_dia_pessoal',
]

function pb(id: string): DocumentBlock {
  return { id, type: 'page-break', data: {} }
}

function heading(id: string, label: string, pageBreakBefore = false): DocumentBlock {
  return { id, type: 'section-heading', pageBreakBefore, data: { label } }
}

function numEntry(
  id: string,
  label: string,
  value: number | null,
  accent: string,
  interp: InterpretationMap,
  interpKey: string,
  defKey?: string
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
      definicaoTexto: defKey ? interp[defKey]?.texto : undefined
    },
  }
}



// Reordena/oculta os blocos de nível superior e seus sub-blocos internos
function applyBlockOrder(blocks: DocumentBlock[], config: BlockOrderConfig): DocumentBlock[] {
  // 1. Reordena e filtra blocos de nível superior
  const internalOrder = config.order.map(id => BLOCK_ID_MAP[id]).filter(Boolean)
  const internalHidden = new Set(config.hidden.map(id => BLOCK_ID_MAP[id]).filter(Boolean))
  const byId = new Map(blocks.map(b => [b.id, b]))

  const orderedTop = internalOrder
    .map(id => byId.get(id))
    .filter((b): b is DocumentBlock => !!b && !internalHidden.has(b.id))

  // Garante que blocos não listados na ordem ainda apareçam (safety net)
  byId.forEach((block, id) => {
    if (!internalOrder.includes(id) && !internalHidden.has(id)) {
      orderedTop.push(block)
    }
  })

  // 2. Reordena e filtra os sub-blocos filhos de cada grupo
  return orderedTop.map(block => {
    const extKey = Object.keys(BLOCK_ID_MAP).find(k => BLOCK_ID_MAP[k] === block.id)
    if (!extKey || !config.children?.[extKey] || !block.children || block.children.length === 0) {
      return block
    }

    const childConfig = config.children[extKey]
    const childIdMap = GROUP_CHILD_ID_MAP[extKey]
    if (!childIdMap) return block

    // Separa o título (heading) para mantê-lo sempre fixo no topo da seção
    const headingBlock = block.children.find(c => c.type === 'section-heading')
    const otherChildren = block.children.filter(c => c.type !== 'section-heading')

    const childInternalOrder = childConfig.order.map(id => childIdMap[id]).filter(Boolean)
    const childInternalHidden = new Set(childConfig.hidden.map(id => childIdMap[id]).filter(Boolean))
    const childById = new Map(otherChildren.map(c => [c.id, c]))

    const orderedChildren = childInternalOrder
      .map(id => childById.get(id))
      .filter((c): c is DocumentBlock => !!c && !childInternalHidden.has(c.id))

    // Garante que sub-blocos do cliente não listados na ordem ainda apareçam
    otherChildren.forEach(child => {
      if (!childInternalOrder.includes(child.id) && !childInternalHidden.has(child.id)) {
        orderedChildren.push(child)
      }
    })

    return {
      ...block,
      children: headingBlock ? [headingBlock, ...orderedChildren] : orderedChildren
    }
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

  // Bloco: Orientação (separado de "Importante" em 2026-07-11 — cada um agora é
  // um bloco próprio na tela /app/blocos, ver requisitos.md)
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
    ]
  }

  // Bloco: Importante
  const blocoImportante: DocumentBlock = {
    id: 'bloco-importante',
    type: 'group',
    pageBreakBefore: false,
    children: [
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
    pageBreakBefore: true,
    children: [
      heading('h-personalidade', 'Personalidade', false),
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
    pageBreakBefore: true,
    children: [
      heading('h-proposito-vida', 'Propósito de Vida', false),
      numEntry('num-dia-natalicio', 'Dia Natalício', map.diaNatalicio, 'gold',    interp, `pessoal_dia_natalicio`, 'estatico_def_dia_natalicio'),
      numEntry('num-destino',       'Destino',        map.destino,      'coral',   interp, `pessoal_destino`,        'estatico_def_destino'),
      numEntry('num-missao',        'Missão',         map.missao,       'magenta', interp, `pessoal_missao`,         'estatico_def_missao'),
      numEntry('num-aptidoes',      'Aptidões e Potencialidades Profissionais', map.expressao, 'gold', interp, `pessoal_aptidoes`, 'estatico_def_aptidoes'),
    ]
  }

  // Bloco 4: Karma e Desafios — Lições, Débitos, Tendências, Resposta Subconsciente, Desafios
  // "O que precisa superar" — padrões kármicos e provas de vida
  const filhosKarma: DocumentBlock[] = [
    heading('h-karma-desafios', 'Karma e Desafios', false),
    numEntry('num-resposta', 'Resposta Subconsciente', map.respostaSubconsciente, 'info', interp, `pessoal_respostaSubconsciente`, 'estatico_def_resposta_subconsciente'),
  ]

  if (map.licoesCarmicas.length > 0) {
    filhosKarma.push({
      id: 'licoes',
      type: 'multi-number-entry',
      data: {
        label: 'Lições Cármicas',
        accent: 'magenta',
        definicaoTexto: interp['estatico_def_licao_carmica']?.texto || 'Qualidades que precisam ser desenvolvidas ao longo da vida.',
        items: map.licoesCarmicas.map(v => {
          const key = `pessoal_licao_carmica_${v}`
          return { value: v, titulo: interp[key]?.titulo ?? `Lição Cármica ${v}`, texto: interp[key]?.texto ?? '' }
        })
      }
    })
  }

  if (map.debitosCarmicos.length > 0) {
    filhosKarma.push({
      id: 'debitos',
      type: 'multi-number-entry',
      data: {
        label: 'Débitos Cármicos',
        accent: 'magenta',
        definicaoTexto: interp['estatico_def_debito_carmica']?.texto || 'Padrões de karma que exigem atenção e superação.',
        items: map.debitosCarmicos.map(v => {
          const key = `pessoal_debito_carmica_${v}`
          return { value: v, titulo: interp[key]?.titulo ?? `Débito Cármico ${v}`, texto: interp[key]?.texto ?? '' }
        })
      }
    })
  }

  if (map.tendenciasOcultas.length > 0) {
    filhosKarma.push({
      id: 'tendencias',
      type: 'multi-number-entry',
      data: {
        label: 'Tendências Ocultas',
        accent: 'success',
        definicaoTexto: interp['estatico_def_tendencia_oculta']?.texto || 'Potencialidades ocultas que influenciam a personalidade.',
        items: map.tendenciasOcultas.map(v => {
          const key = `pessoal_tendenciaOculta_${v}`
          return { value: v, titulo: interp[key]?.titulo ?? `Tendência Oculta ${v}`, texto: interp[key]?.texto ?? '' }
        })
      }
    })
  }

  if (map.desafios) {
    filhosKarma.push({
      id: 'desafios',
      type: 'list-entry',
      data: {
        label: 'Desafios',
        items: [
          { label: '1º Desafio',        value: map.desafios.desafio1 },
          { label: '2º Desafio',        value: map.desafios.desafio2 },
          { label: 'Desafio Principal', value: map.desafios.desafioPrincipal },
        ],
        description: interp['estatico_def_desafio']?.texto || 'Números que indicam os principais desafios a serem trabalhados.',
      },
    })
  }

  const blocoKarmaDesafios: DocumentBlock = {
    id: 'bloco-karma-desafios',
    type: 'group',
    pageBreakBefore: true,
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
  const filhosCiclosVida: DocumentBlock[] = [
    heading('h-ciclos-vida', 'Ciclos de Vida, Desafios e Momentos Decisivos', false)
  ]

  if (map.ciclosDeVida.length >= 3) {
    // 1º Ciclo de Vida
    filhosCiclosVida.push({
      id: 'ciclo-1',
      type: 'cycles-entry',
      data: {
        index: 1,
        inicioAno: birthYear,
        fimAno: birthYear + l1,
        inicioIdade: 0,
        fimIdade: l1,
        regenteCiclo: map.ciclosDeVida[0]?.regente,
        regenteDesafio: map.desafios?.desafio1,
        regenteMomento: map.momentosDecisivos?.momento1,
        tituloCiclo: interp[`pessoal_ciclo_${map.ciclosDeVida[0]?.regente}`]?.titulo || `Ciclo Regente ${map.ciclosDeVida[0]?.regente}`,
        textoCiclo: interp[`pessoal_ciclo_${map.ciclosDeVida[0]?.regente}`]?.texto || '',
        tituloDesafio: interp[`pessoal_desafio_${map.desafios?.desafio1}`]?.titulo || `Desafio ${map.desafios?.desafio1}`,
        textoDesafio: interp[`pessoal_desafio_${map.desafios?.desafio1}`]?.texto || '',
        tituloMomento: interp[`pessoal_momentoDecisivo_${map.momentosDecisivos?.momento1}`]?.titulo || `Momento Decisivo ${map.momentosDecisivos?.momento1}`,
        textoMomento: interp[`pessoal_momentoDecisivo_${map.momentosDecisivos?.momento1}`]?.texto || '',
        definicaoCiclo: interp['estatico_def_ciclo']?.texto,
        definicaoDesafio: interp['estatico_def_desafio']?.texto,
        definicaoMomento: interp['estatico_def_momento_decisivo']?.texto,
      }
    })

    // 2º Ciclo de Vida
    filhosCiclosVida.push({
      id: 'ciclo-2',
      type: 'cycles-entry',
      data: {
        index: 2,
        inicioAno: birthYear + l1,
        fimAno: birthYear + l2,
        inicioIdade: l1,
        fimIdade: l2,
        regenteCiclo: map.ciclosDeVida[1]?.regente,
        regenteDesafio: map.desafios?.desafio2,
        regenteMomento2: map.momentosDecisivos?.momento2,
        regenteMomento3: map.momentosDecisivos?.momento3,
        momento2InicioAno: birthYear + l1,
        momento2FimAno: birthYear + lm3,
        momento2InicioIdade: l1,
        momento2FimIdade: lm3,
        momento3InicioAno: birthYear + lm3,
        momento3FimAno: birthYear + lm4,
        momento3InicioIdade: lm3,
        momento3FimIdade: lm4,
        tituloCiclo: interp[`pessoal_ciclo_${map.ciclosDeVida[1]?.regente}`]?.titulo || `Ciclo Regente ${map.ciclosDeVida[1]?.regente}`,
        textoCiclo: interp[`pessoal_ciclo_${map.ciclosDeVida[1]?.regente}`]?.texto || '',
        tituloDesafio: interp[`pessoal_desafio_${map.desafios?.desafio2}`]?.titulo || `Desafio ${map.desafios?.desafio2}`,
        textoDesafio: interp[`pessoal_desafio_${map.desafios?.desafio2}`]?.texto || '',
        tituloMomento2: interp[`pessoal_momentoDecisivo_${map.momentosDecisivos?.momento2}`]?.titulo || `Momento Decisivo ${map.momentosDecisivos?.momento2}`,
        textoMomento2: interp[`pessoal_momentoDecisivo_${map.momentosDecisivos?.momento2}`]?.texto || '',
        tituloMomento3: interp[`pessoal_momentoDecisivo_${map.momentosDecisivos?.momento3}`]?.titulo || `Momento Decisivo ${map.momentosDecisivos?.momento3}`,
        textoMomento3: interp[`pessoal_momentoDecisivo_${map.momentosDecisivos?.momento3}`]?.texto || '',
      }
    })

    // 3º Ciclo de Vida
    filhosCiclosVida.push({
      id: 'ciclo-3',
      type: 'cycles-entry',
      data: {
        index: 3,
        inicioAno: birthYear + l2,
        fimAno: 'resto da vida',
        inicioIdade: l2,
        fimIdade: 'fim',
        regenteCiclo: map.ciclosDeVida[2]?.regente,
        regenteDesafioPrincipal: map.desafios?.desafioPrincipal,
        regenteMomento4: map.momentosDecisivos?.momento4,
        momento4InicioAno: birthYear + lm4,
        momento4InicioIdade: lm4,
        tituloCiclo: interp[`pessoal_ciclo_${map.ciclosDeVida[2]?.regente}`]?.titulo || `Ciclo Regente ${map.ciclosDeVida[2]?.regente}`,
        textoCiclo: interp[`pessoal_ciclo_${map.ciclosDeVida[2]?.regente}`]?.texto || '',
        tituloDesafioPrincipal: interp[`pessoal_desafio_${map.desafios?.desafioPrincipal}`]?.titulo || `Desafio Principal ${map.desafios?.desafioPrincipal}`,
        textoDesafioPrincipal: interp[`pessoal_desafio_${map.desafios?.desafioPrincipal}`]?.texto || '',
        tituloMomento4: interp[`pessoal_momentoDecisivo_${map.momentosDecisivos?.momento4}`]?.titulo || `Momento Decisivo ${map.momentosDecisivos?.momento4}`,
        textoMomento4: interp[`pessoal_momentoDecisivo_${map.momentosDecisivos?.momento4}`]?.texto || '',
      }
    })
  }

  const blocoCiclosVida: DocumentBlock = {
    id: 'bloco-ciclos-vida',
    type: 'group',
    pageBreakBefore: true,
    children: filhosCiclosVida
  }

  // Novo Bloco: Previsões Temporais (Ano, Mês e Dia Pessoal)
  const filhosPrevisoesTempo: DocumentBlock[] = [
    heading('h-previsoes-tempo', 'Previsões Temporais', false),
    numEntry('num-ano', 'Ano Pessoal (Atual)', map.anoPessoal, 'gold', interp, `pessoal_anoPessoal`, 'estatico_def_ano_pessoal')
  ]

  if (map.mesesPessoais && map.mesesPessoais.length > 0) {
    filhosPrevisoesTempo.push({
      id: 'meses-pessoais',
      type: 'timeline-entry',
      data: {
        label: 'Meses Pessoais (Próximos 12 meses)',
        definicaoTexto: interp['estatico_def_mes_pessoal']?.texto,
        items: map.mesesPessoais.map(m => ({
          title: m.nome,
          subtitle: String(m.ano),
          value: m.numero
        }))
      }
    })
  }

  if (map.diaPessoal !== null) {
    filhosPrevisoesTempo.push(numEntry('num-dia', 'Dia Pessoal (Hoje)', map.diaPessoal, 'info', interp, `pessoal_diaPessoal`, 'estatico_def_dia_pessoal'))
  }

  const blocoPrevisoesTempo: DocumentBlock = {
    id: 'bloco-previsoes-tempo',
    type: 'group',
    pageBreakBefore: true,
    children: filhosPrevisoesTempo
  }

  // Bloco 6: Relacionamentos — Harmonia Conjugal (apenas)
  const blocoRelacionamentos: DocumentBlock = {
    id: 'bloco-relacionamentos',
    type: 'group',
    pageBreakBefore: true,
    children: [
      heading('h-relacionamentos', 'Relacionamentos', false),
      ...(map.missao ? [{
        id: 'conjugal',
        type: 'conjugal-entry' as const,
        data: { numeroAmor: map.missao, definicaoTexto: interp['estatico_def_harmonia_conjugal']?.texto },
      }] : []),
    ]
  }

  // Bloco 7: Triângulo da Vida e Arcanos — 4 sub-blocos independentes
  const filhosTriangulo: DocumentBlock[] = [
    heading('h-triangulo', 'Triângulo da Vida e Arcanos', false),
  ]

  if (map.trianguloDaVida) {
    // 7a. Pirâmide visual + bloqueios
    filhosTriangulo.push({
      id: 'triangulo-piramide',
      type: 'triangulo-piramide',
      data: {
        trianguloDaVida: map.trianguloDaVida,
      }
    })

    // 7b. Arcano Regente
    if (map.trianguloDaVida.arcanoRegente !== null) {
      filhosTriangulo.push({
        id: 'triangulo-arcano-regente',
        type: 'triangulo-arcano-regente',
        data: {
          arcanoRegente: map.trianguloDaVida.arcanoRegente,
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
        }
      })
    }

    // 7d. Todos os Arcanos da pessoa (sequência cronológica)
    if (map.trianguloDaVida.sequenciaCompleta.length > 0) {
      filhosTriangulo.push({
        id: 'triangulo-arcanos-lista',
        type: 'triangulo-arcanos-lista',
        data: {
          sequenciaCompleta: map.trianguloDaVida.sequenciaCompleta,
          arcanoAtual: map.arcanoAtual,
        }
      })
    }
  }

  const blocoTriangulo: DocumentBlock = {
    id: 'bloco-triangulo',
    type: 'group',
    pageBreakBefore: true,
    children: filhosTriangulo
  }

  // Bloco: Conclusão (novo, adicionado em 2026-07-11 — fecha o relatório, que hoje
  // termina abruptamente após Relacionamentos. Conteúdo em si é Fase 2 (ver
  // requisitos.md, seção 3a) — aqui só existe a estrutura/posição do bloco;
  // sem texto configurado ainda, mostra um aviso discreto em vez de nada.)
  const blocoConclusao: DocumentBlock = {
    id: 'bloco-conclusao',
    type: 'group',
    pageBreakBefore: true,
    children: [
      { id: 'conclusao', type: 'conclusion', data: { texto: interp['estatico_conclusao']?.texto || '' } },
    ]
  }

  // Return the top-level nested blocks, reordenados/filtrados conforme block_order do perfil
  return applyBlockOrder(
    [
      blocoCapa,
      blocoOrientacao,
      blocoImportante,
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
  )
}

// ── Paginação ────────────────────────────────────────────────────────────
// Achata os grupos de nível superior numa lista linear de páginas. Um grupo
// com pageBreakBefore=true inicia uma nova página. Children de cada grupo
// fluem para a página atual sem quebrar (só o pageBreakBefore do GRUPO conta —
// o de blocos-folha individuais é ignorado, ver PreviewPage.tsx histórico).
// Movido para cá (de PreviewPage.tsx) em 2026-07-11 para ser reaproveitado
// também pelo preview em miniatura de Blocos do Relatório e Templates de Marca.
export function splitIntoPages(blocks: DocumentBlock[]): DocumentBlock[][] {
  const pages: DocumentBlock[][] = [[]]

  function addBlock(block: DocumentBlock) {
    // Skip cover — rendered separately
    if (block.type === 'cover') return

    if (block.type === 'group') {
      if (block.pageBreakBefore && pages[pages.length - 1].length > 0) {
        pages.push([])
      }
      block.children?.forEach(addBlock)
      return
    }

    if (block.type === 'page-break') {
      if (pages[pages.length - 1].length > 0) pages.push([])
      return
    }

    pages[pages.length - 1].push(block)
  }

  blocks.forEach(addBlock)
  return pages.filter(p => p.length > 0)
}
