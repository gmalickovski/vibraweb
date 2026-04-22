// document-builder.ts
// Converts a computed NumerologyMap + fetched interpretations into ordered DocumentBlock[].
// Each block maps to a rendered component in PreviewPage.

import type { NumerologyMap } from './numerology'
import type { AnalysisTab } from '../pages/AppPage'

export type BlockType =
  | 'cover'
  | 'orientation'
  | 'summary-table'
  | 'section-heading'
  | 'number-entry'
  | 'list-entry'
  | 'cycles-entry'
  | 'moments-entry'
  | 'conjugal-entry'
  | 'page-break'

export interface DocumentBlock {
  id: string
  type: BlockType
  pageBreakBefore?: boolean
  data: Record<string, unknown>
}

export interface InterpretationMap {
  [key: string]: { titulo: string; texto: string } | null
}

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
  interpKey: string
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
    },
  }
}

export function buildDocumentBlocks(
  map: NumerologyMap,
  tab: AnalysisTab,
  subject: string,
  dataNascimento: string,
  interp: InterpretationMap
): DocumentBlock[] {
  const tabLabel =
    tab === 'bebe' ? 'Bebê' : tab === 'empresa' ? 'Empresa' : tab === 'previsoes' ? 'Previsões' : 'Pessoal'
  const blocks: DocumentBlock[] = []

  // ── Capa ──────────────────────────────────────────────────────────────
  blocks.push({
    id: 'cover',
    type: 'cover',
    data: { subject, tabLabel, dataNascimento },
  })

  blocks.push({
    id: 'orientation',
    type: 'orientation',
    pageBreakBefore: false,
    data: {},
  })

  blocks.push({
    id: 'summary',
    type: 'summary-table',
    pageBreakBefore: false,
    data: {
      rows: [
        { label: 'Motivação',       value: map.motivacao },
        { label: 'Impressão',       value: map.impressao },
        { label: 'Expressão',       value: map.expressao },
        { label: 'Destino',         value: map.destino },
        { label: 'Missão',          value: map.missao },
        { label: 'Talento Oculto',  value: map.talentoOculto },
        { label: 'Psíquico',        value: map.psiquico },
        { label: 'Ano Pessoal',     value: map.anoPessoal },
      ].filter(r => r.value !== null),
    },
  })

  // ── Seção 1: A Essência ────────────────────────────────────────────────
  blocks.push(heading('h-essencia', 'A Essência — Traços de Personalidade', false))
  blocks.push(numEntry('num-motivacao', 'Motivação',      map.motivacao,     'gold',    interp, `${tab}_motivação`))
  blocks.push(numEntry('num-impressao', 'Impressão',      map.impressao,     'magenta', interp, `${tab}_impressão`))
  blocks.push(numEntry('num-expressao', 'Expressão',      map.expressao,     'coral',   interp, `${tab}_expressão`))
  blocks.push(numEntry('num-talento',   'Talento Oculto', map.talentoOculto, 'info',    interp, `${tab}_talento_oculto`))

  // ── Seção 2: O Caminho e Desafios ─────────────────────────────────────
  blocks.push(heading('h-caminho', 'O Caminho e os Desafios', true))
  blocks.push(numEntry('num-psiquico', 'Número Psíquico', map.psiquico, 'gold',   interp, `${tab}_psíquico`))
  blocks.push(numEntry('num-destino',  'Destino',          map.destino,  'coral',  interp, `${tab}_destino`))
  blocks.push(numEntry('num-missao',   'Missão',           map.missao,   'magenta',interp, `${tab}_missão`))

  if (map.licoesCarmicas.length > 0) {
    blocks.push({
      id: 'licoes',
      type: 'list-entry',
      data: {
        label: 'Lições Cármicas',
        items: map.licoesCarmicas,
        description: 'Qualidades que precisam ser desenvolvidas ao longo da vida.',
      },
    })
  }
  if (map.debitosCarmicos.length > 0) {
    blocks.push({
      id: 'debitos',
      type: 'list-entry',
      data: {
        label: 'Débitos Cármicos',
        items: map.debitosCarmicos,
        description: 'Padrões de karma que exigem atenção e superação.',
      },
    })
  }

  // ── Seção 3: Ciclos de Tempo ───────────────────────────────────────────
  blocks.push(heading('h-ciclos', 'Ciclos de Tempo — Previsões', false))

  if (map.ciclosDeVida.length > 0) {
    blocks.push({
      id: 'ciclos',
      type: 'cycles-entry',
      data: { ciclos: map.ciclosDeVida },
    })
  }

  if (map.desafios) {
    blocks.push({
      id: 'desafios',
      type: 'list-entry',
      data: {
        label: 'Desafios',
        items: [
          { label: '1º Desafio',       value: map.desafios.desafio1 },
          { label: '2º Desafio',       value: map.desafios.desafio2 },
          { label: 'Desafio Principal',value: map.desafios.desafioPrincipal },
        ],
        description: 'Números que indicam os principais desafios a serem trabalhados.',
      },
    })
  }

  blocks.push(numEntry('num-ano', 'Ano Pessoal', map.anoPessoal, 'gold', interp, `${tab}_ano_pessoal`))

  // ── Seção 4: Relacionamentos ───────────────────────────────────────────
  blocks.push(heading('h-relacionamentos', 'Relacionamentos e Harmonia', true))
  // Harmonia conjugal baseada na missão
  if (map.missao) {
    blocks.push({
      id: 'conjugal',
      type: 'conjugal-entry',
      data: { numeroAmor: map.missao },
    })
  }

  return blocks
}
