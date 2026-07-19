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
  | 'cycles-intro'          // definições gerais de Ciclos/Desafios/Momentos — antes dos ciclos
  | 'cycles-entry'
  | 'moments-entry'
  | 'conjugal-entry'
  | 'triangulo-entry'       // legacy — não mais usado, mantido para compatibilidade
  | 'triangulo-piramide'    // pirâmide visual + bloqueios
  | 'triangulo-arcano-regente'  // card do arcano regente
  | 'triangulo-arcano-vigente'  // arcano vigente + período + duração
  | 'triangulo-arcanos-lista'   // sequência cronológica de todos os arcanos
  | 'dia-pessoal-entry'     // dia pessoal de hoje + guia de referência (1-9/11/22)
  | 'dias-favoraveis-entry' // dias do mês favoráveis (fixos, valem pra todos os meses)
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
}

// Lê o texto de um arcano a partir de `interp` (Supabase, tipo 'pessoal_arcano',
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

    // Separa o título (heading) e as definições gerais (cycles-intro) para
    // mantê-los sempre fixos no topo da seção, antes dos filhos reordenáveis
    const fixedTypes: BlockType[] = ['section-heading', 'cycles-intro']
    const fixedTop = block.children.filter(c => fixedTypes.includes(c.type))
    const otherChildren = block.children.filter(c => !fixedTypes.includes(c.type))

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
      children: [...fixedTop, ...orderedChildren]
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

  // Débitos Cármicos: sempre presente — quando o mapa não tem nenhum débito
  // (13/14/16/19), mostra o texto de ausência (estatico_sem_debitos) em vez
  // de simplesmente omitir a seção.
  filhosKarma.push({
    id: 'debitos',
    type: 'multi-number-entry',
    data: {
      label: 'Débitos Cármicos',
      accent: 'magenta',
      definicaoTexto: interp['estatico_def_debito_carmico']?.texto || 'Padrões de carma que exigem atenção e superação.',
      items: map.debitosCarmicos.map(v => {
        const key = `pessoal_debito_carmico_${v}`
        return { value: v, titulo: interp[key]?.titulo ?? `Débito Cármico ${v}`, texto: interp[key]?.texto ?? '' }
      }),
      semTexto: interp['estatico_sem_debitos']?.texto,
    }
  })

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
    {
      id: 'ciclos-intro',
      type: 'cycles-intro',
      data: {
        definicaoCiclo: interp['estatico_def_ciclo']?.texto,
        definicaoDesafio: interp['estatico_def_desafio']?.texto,
        definicaoMomento: interp['estatico_def_momento_decisivo']?.texto,
      }
    },
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
    pageBreakBefore: false,
    children: filhosCiclosVida
  }

  // Novo Bloco: Previsões Temporais (Ano, Mês e Dia Pessoal)
  const filhosPrevisoesTempo: DocumentBlock[] = [
    heading('h-previsoes-tempo', 'Previsões Temporais', false, interp['estatico_def_previsoes_intro']?.texto),
    numEntry('num-ano', 'Ano Pessoal (Atual)', map.anoPessoal, 'gold', interp, `pessoal_anoPessoal`, 'estatico_def_ano_pessoal', 'estatico_instrucao_ano_pessoal')
  ]

  if (map.mesesPessoais && map.mesesPessoais.length > 0) {
    filhosPrevisoesTempo.push({
      id: 'meses-pessoais',
      type: 'timeline-entry',
      data: {
        label: 'Meses Pessoais (Próximos 12 meses)',
        definicaoTexto: interp['estatico_def_mes_pessoal']?.texto,
        instrucaoTexto: interp['estatico_instrucao_mes_pessoal']?.texto,
        items: map.mesesPessoais.map(m => ({
          title: m.nome,
          subtitle: String(m.ano),
          value: m.numero,
          texto: interp[`pessoal_mesPessoal_${m.numero}`]?.texto,
        }))
      }
    })
  }

  // Dia Pessoal: em vez de só o valor de hoje (que fica desatualizado assim
  // que o mapa é impresso/entregue em outra data), mostra hoje em destaque
  // + um guia de referência com o significado de todos os 11 valores
  // possíveis (1-9/11/22) — o cliente consegue usar o mapa como um oráculo
  // diário permanente, calculando o Dia Pessoal de qualquer data e
  // consultando o significado aqui.
  if (map.diaPessoal !== null) {
    const i = interp['pessoal_diaPessoal']
    filhosPrevisoesTempo.push({
      id: 'num-dia',
      type: 'dia-pessoal-entry',
      data: {
        hoje: map.diaPessoal,
        tituloHoje: i?.titulo ?? 'Dia Pessoal',
        textoHoje: i?.texto ?? '',
        definicaoTexto: interp['estatico_def_dia_pessoal']?.texto,
        instrucaoTexto: interp['estatico_instrucao_dia_pessoal']?.texto,
        guia: DIA_PESSOAL_GUIA_NUMEROS.map(n => ({
          numero: n,
          titulo: interp[`pessoal_diaPessoal_guia_${n}`]?.titulo ?? `Dia Pessoal ${n}`,
          texto: interp[`pessoal_diaPessoal_guia_${n}`]?.texto ?? '',
        })),
      },
    })
  }

  // Dias Favoráveis do Mês — mesma ordem do documento de referência (Ano →
  // Mês → Dia Pessoal → Dias Favoráveis). Os dias são FIXOS para a pessoa
  // (tabela DIAS_BASICOS por dia+mês de nascimento, calcDiasFavoraveis) e se
  // repetem em todos os meses do ano — a instrução explica isso ao cliente.
  if (map.diasFavoraveis.length > 0) {
    filhosPrevisoesTempo.push({
      id: 'dias-favoraveis',
      type: 'dias-favoraveis-entry',
      data: {
        dias: map.diasFavoraveis,
        definicaoTexto: interp['estatico_def_dias_favoraveis']?.texto,
        instrucaoTexto: interp['estatico_instrucao_dias_favoraveis']?.texto,
        textos: Object.fromEntries(
          map.diasFavoraveis.map(d => [d, interp[`pessoal_dia_favoravel_${d}`] ?? null])
        ),
      }
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
      ...(map.missao && map.harmoniaConjugal ? [{
        id: 'conjugal',
        type: 'conjugal-entry' as const,
        data: {
          numeroAmor: map.missao,
          definicaoTexto: interp['estatico_def_harmonia_conjugal']?.texto,
          vibra: map.harmoniaConjugal.vibra,
          atrai: map.harmoniaConjugal.atrai,
          oposto: map.harmoniaConjugal.oposto,
          passivo: map.harmoniaConjugal.passivo,
          numerosInfo: Object.fromEntries(
            Array.from(new Set([
              ...map.harmoniaConjugal.vibra, ...map.harmoniaConjugal.atrai,
              ...map.harmoniaConjugal.oposto, ...map.harmoniaConjugal.passivo,
            ])).map(n => [n, interp[`pessoal_harmoniaConjugal_${n}`] ?? null])
          ),
        },
      }] : []),
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
    filhosTriangulo.push({
      id: 'triangulo-piramide',
      type: 'triangulo-piramide',
      data: {
        trianguloDaVida: map.trianguloDaVida,
        bloqueiosInfo: Object.fromEntries(
          (map.trianguloDaVida.bloqueios ?? []).map(b => [b.codigo, interp[`pessoal_bloqueio_${b.codigo}`] ?? null])
        ),
        semBloqueiosTexto: interp['estatico_sem_bloqueios']?.texto,
      }
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
    if (map.trianguloDaVida.sequenciaCompleta.length > 0) {
      const arcanosUnicos = Array.from(new Set(map.trianguloDaVida.sequenciaCompleta))
      filhosTriangulo.push({
        id: 'triangulo-arcanos-lista',
        type: 'triangulo-arcanos-lista',
        data: {
          sequenciaCompleta: map.trianguloDaVida.sequenciaCompleta,
          arcanoAtual: map.arcanoAtual,
          arcanosInfo: Object.fromEntries(arcanosUnicos.map(n => [n, arcanoLookup(interp, n)])),
        }
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

const MAX_PAGE_HEIGHT_MM = 240 // printable content area on 297mm A4 page

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
    if (block.type === 'multi-number-entry') {
      let itemsH = 0
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          itemsH += 22 + calcMarkdownHeightMM(item.texto) + 8
        }
      }
      return itemsH + 10
    }
    if (block.type === 'triangulo-piramide') {
      let bloqH = 0
      if (data.trianguloDaVida?.bloqueios && Array.isArray(data.trianguloDaVida.bloqueios)) {
        for (const b of data.trianguloDaVida.bloqueios) {
          const info = data.bloqueiosInfo?.[b.codigo]
          bloqH += 14 + calcMarkdownHeightMM(info?.texto ?? b.descricao)
        }
      }
      return bloqH + 10
    }
    if (block.type === 'timeline-entry') {
      let itemsH = 0
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          itemsH += 10 + calcMarkdownHeightMM(item.texto) + 6
        }
      }
      return itemsH + 10
    }
    if (block.type === 'dia-pessoal-entry') {
      let guiaH = 0
      if (data.guia && Array.isArray(data.guia)) {
        for (const g of data.guia) guiaH += 8 + calcMarkdownHeightMM(g.texto)
      }
      return guiaH + 10
    }
    if (block.type === 'dias-favoraveis-entry') {
      let daysH = 0
      if (data.textos) {
        for (const k of Object.keys(data.textos)) {
          const t = data.textos[k]
          if (t) daysH += 8 + calcMarkdownHeightMM(t.texto)
        }
      }
      return daysH + 10
    }
    if (block.type === 'triangulo-arcanos-lista') {
      let arcanosH = 0
      if (data.arcanosInfo) {
        for (const k of Object.keys(data.arcanosInfo)) {
          const info = data.arcanosInfo[k]
          if (info) arcanosH += 16 + calcMarkdownHeightMM(info.descricao) + calcMarkdownHeightMM(info.desafio)
        }
      }
      return arcanosH + 10
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
    case 'multi-number-entry': {
      const def = calcMarkdownHeightMM(data.definicaoTexto)
      let itemsH = 0
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          itemsH += 22 + calcMarkdownHeightMM(item.texto) + 8
        }
      }
      const sem = calcMarkdownHeightMM(data.semTexto)
      return 15 + (def > 0 ? def + 6 : 0) + itemsH + (sem > 0 ? sem + 6 : 0) + 10
    }
    case 'timeline-entry': {
      const def = calcMarkdownHeightMM(data.definicaoTexto)
      const inst = calcMarkdownHeightMM(data.instrucaoTexto)
      let itemsH = 35 // summary grid
      if (data.items && Array.isArray(data.items)) {
        for (const item of data.items) {
          itemsH += 10 + calcMarkdownHeightMM(item.texto) + 6
        }
      }
      return 15 + (def > 0 ? def + 6 : 0) + (inst > 0 ? inst + 8 : 0) + itemsH + 10
    }
    case 'cycles-intro': {
      return 70
    }
    case 'cycles-entry': {
      const cText = calcMarkdownHeightMM(data.textoCiclo)
      const dText = calcMarkdownHeightMM(data.textoDesafio || data.textoDesafioPrincipal)
      const mText = calcMarkdownHeightMM(data.textoMomento || data.textoMomento2) + calcMarkdownHeightMM(data.textoMomento3 || data.textoMomento4)
      return 40 + cText + dText + mText + 12
    }
    case 'triangulo-piramide': {
      const nrows = data.trianguloDaVida?.linhas?.length ?? 0
      const pyrH = nrows * 6 + 15
      let bloqH = 0
      if (data.trianguloDaVida?.bloqueios && Array.isArray(data.trianguloDaVida.bloqueios)) {
        for (const b of data.trianguloDaVida.bloqueios) {
          const info = data.bloqueiosInfo?.[b.codigo]
          bloqH += 14 + calcMarkdownHeightMM(info?.texto ?? b.descricao)
        }
      }
      const sem = calcMarkdownHeightMM(data.semBloqueiosTexto)
      return 15 + pyrH + bloqH + (sem > 0 ? sem + 6 : 0) + 10
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
    case 'triangulo-arcanos-lista': {
      let arcanosH = 65 // circles grid + legend
      if (data.arcanosInfo) {
        for (const k of Object.keys(data.arcanosInfo)) {
          const info = data.arcanosInfo[k]
          if (info) {
            arcanosH += 16 + calcMarkdownHeightMM(info.descricao) + calcMarkdownHeightMM(info.desafio)
          }
        }
      }
      return arcanosH + 10
    }
    case 'dia-pessoal-entry': {
      const def = calcMarkdownHeightMM(data.definicaoTexto)
      const inst = calcMarkdownHeightMM(data.instrucaoTexto)
      const hoje = calcMarkdownHeightMM(data.textoHoje)
      let guiaH = 0
      if (data.guia && Array.isArray(data.guia)) {
        for (const g of data.guia) {
          guiaH += 8 + calcMarkdownHeightMM(g.texto)
        }
      }
      return 45 + (def > 0 ? def + 6 : 0) + (inst > 0 ? inst + 8 : 0) + hoje + guiaH + 10
    }
    case 'dias-favoraveis-entry': {
      const def = calcMarkdownHeightMM(data.definicaoTexto)
      const inst = calcMarkdownHeightMM(data.instrucaoTexto)
      let daysH = 30 // chips
      if (data.textos) {
        for (const k of Object.keys(data.textos)) {
          const t = data.textos[k]
          if (t) daysH += 8 + calcMarkdownHeightMM(t.texto)
        }
      }
      return 15 + (def > 0 ? def + 6 : 0) + (inst > 0 ? inst + 8 : 0) + daysH + 10
    }
    case 'conjugal-entry': {
      const def = calcMarkdownHeightMM(data.definicaoTexto)
      return 90 + (def > 0 ? def + 6 : 0)
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

function splitBlock(block: DocumentBlock, availableMM: number): [DocumentBlock, DocumentBlock] | null {
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

  if (block.type === 'multi-number-entry' && data.items && data.items.length > 1) {
    const baseOverhead = data.isContinuation ? 0 : (15 + (data.definicaoTexto ? calcMarkdownHeightMM(data.definicaoTexto) + 6 : 0))
    let cumH = baseOverhead
    let splitIdx = 0
    for (let i = 0; i < data.items.length; i++) {
      const itemH = 22 + calcMarkdownHeightMM(data.items[i].texto) + 8
      if (cumH + itemH > availableMM && i > 0) {
        break
      }
      cumH += itemH
      splitIdx = i + 1
    }

    if (splitIdx > 0 && splitIdx < data.items.length) {
      const items1 = data.items.slice(0, splitIdx)
      const items2 = data.items.slice(splitIdx)

      const b1: DocumentBlock = { ...block, data: { ...data, items: items1 } }
      const b2: DocumentBlock = {
        ...block,
        id: `${block.id}-part2`,
        data: {
          ...data,
          definicaoTexto: undefined,
          items: items2,
          isContinuation: true,
        }
      }
      return [b1, b2]
    }
  }

  if (block.type === 'triangulo-piramide' && data.trianguloDaVida?.bloqueios?.length > 0) {
    const nrows = data.trianguloDaVida?.linhas?.length ?? 0
    const pyrH = 15 + nrows * 6 + 15
    if (pyrH <= availableMM) {
      const b1: DocumentBlock = {
        ...block,
        data: { ...data, trianguloDaVida: { ...data.trianguloDaVida, bloqueios: [] } }
      }
      const b2: DocumentBlock = {
        ...block,
        id: `${block.id}-part2`,
        data: {
          ...data,
          trianguloDaVida: { ...data.trianguloDaVida, linhas: [] },
          isContinuation: true,
        }
      }
      return [b1, b2]
    }
  }

  if (block.type === 'timeline-entry' && data.items && data.items.length > 1) {
    const baseOverhead = 15 + (data.definicaoTexto ? calcMarkdownHeightMM(data.definicaoTexto) + 6 : 0) + 35
    let cumH = baseOverhead
    let splitIdx = 0
    for (let i = 0; i < data.items.length; i++) {
      const itemH = 10 + calcMarkdownHeightMM(data.items[i].texto) + 6
      if (cumH + itemH > availableMM && i > 0) {
        break
      }
      cumH += itemH
      splitIdx = i + 1
    }

    if (splitIdx > 0 && splitIdx < data.items.length) {
      const items1 = data.items.slice(0, splitIdx)
      const items2 = data.items.slice(splitIdx)

      const b1: DocumentBlock = { ...block, data: { ...data, items: items1 } }
      const b2: DocumentBlock = {
        ...block,
        id: `${block.id}-part2`,
        data: {
          ...data,
          definicaoTexto: undefined,
          instrucaoTexto: undefined,
          items: items2,
          isContinuation: true,
        }
      }
      return [b1, b2]
    }
  }

  if (block.type === 'dia-pessoal-entry' && data.guia && data.guia.length > 1) {
    const baseOverhead = 45 + (data.definicaoTexto ? calcMarkdownHeightMM(data.definicaoTexto) + 6 : 0) + calcMarkdownHeightMM(data.textoHoje)
    let cumH = baseOverhead
    let splitIdx = 0
    for (let i = 0; i < data.guia.length; i++) {
      const gH = 8 + calcMarkdownHeightMM(data.guia[i].texto)
      if (cumH + gH > availableMM && i > 0) {
        break
      }
      cumH += gH
      splitIdx = i + 1
    }

    if (splitIdx > 0 && splitIdx < data.guia.length) {
      const guia1 = data.guia.slice(0, splitIdx)
      const guia2 = data.guia.slice(splitIdx)

      const b1: DocumentBlock = { ...block, data: { ...data, guia: guia1 } }
      const b2: DocumentBlock = {
        ...block,
        id: `${block.id}-part2`,
        data: {
          ...data,
          guia: guia2,
          definicaoTexto: undefined,
          instrucaoTexto: undefined,
          textoHoje: undefined,
          isContinuation: true,
        }
      }
      return [b1, b2]
    }
  }

  if (block.type === 'triangulo-arcanos-lista' && data.arcanosInfo) {
    const keys = Object.keys(data.arcanosInfo)
    if (keys.length > 1) {
      const baseOverhead = 65
      let cumH = baseOverhead
      let splitIdx = 0
      for (let i = 0; i < keys.length; i++) {
        const info = data.arcanosInfo[keys[i]]
        const aH = 16 + calcMarkdownHeightMM(info?.descricao) + calcMarkdownHeightMM(info?.desafio)
        if (cumH + aH > availableMM && i > 0) {
          break
        }
        cumH += aH
        splitIdx = i + 1
      }

      if (splitIdx > 0 && splitIdx < keys.length) {
        const keys1 = keys.slice(0, splitIdx)
        const keys2 = keys.slice(splitIdx)

        const info1 = Object.fromEntries(keys1.map(k => [k, data.arcanosInfo[k]]))
        const info2 = Object.fromEntries(keys2.map(k => [k, data.arcanosInfo[k]]))

        const b1: DocumentBlock = { ...block, data: { ...data, arcanosInfo: info1 } }
        const b2: DocumentBlock = {
          ...block,
          id: `${block.id}-part2`,
          data: {
            ...data,
            arcanosInfo: info2,
            isContinuation: true,
          }
        }
        return [b1, b2]
      }
    }
  }

  return null
}

export function splitIntoPages(blocks: DocumentBlock[]): DocumentBlock[][] {
  const pages: DocumentBlock[][] = []
  let currentPage: DocumentBlock[] = []
  let currentHeight = 0
  const maxH = MAX_PAGE_HEIGHT_MM // 240mm

  function pushCurrentPage() {
    if (currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = []
      currentHeight = 0
    }
  }

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

