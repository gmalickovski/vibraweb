// sample-preview.ts — dados de exemplo usados pelos previews "ao vivo" de
// Blocos do Relatório e Templates de Marca. Essas telas não têm uma análise
// real em contexto (não são a tela de geração do mapa), então usamos um mapa
// de exemplo com números calculados de verdade (calcPessoal) e os MESMOS
// textos reais do Supabase que o documento final usaria — igual ao preview
// de geração do PDF (PreviewPage.tsx), só que com um "cliente fictício".
// Ver Produto/docs/vibra-web/requisitos.md (ajuste de 2026-07-11).
//
// A IDENTIDADE do cliente fictício (nome + data de nascimento) vem da tabela
// sample_client (migration 015) em vez de ser hardcoded — assim é editável
// direto no banco, sem precisar de deploy. Só a identidade é persistida: o
// cálculo numerológico em si (calcPessoal) continua rodando ao vivo a cada
// chamada, nunca é congelado, porque vários campos (Ano Pessoal, Dia Pessoal,
// Meses Pessoais, Arcano Atual) dependem da data de hoje e ficariam errados/
// desatualizados com o tempo se fossem salvos prontos no banco.

import { calcPessoal, type NumerologyMap } from './numerology'
import { fetchInterpretation, supabase } from './supabase'
import { NUMERIC_INTERP_KEYS, STATIC_TEXT_KEYS, type InterpretationMap } from './document-builder'

export interface SampleIdentity {
  subject: string
  dataNascimento: string
}

// Fallback usado só se a tabela sample_client ainda não tiver sido migrada/seedada
// no ambiente (ex: banco local sem a migration 015 aplicada).
const FALLBACK_IDENTITY: SampleIdentity = { subject: 'João da Silva', dataNascimento: '15/03/1985' }

let cachedIdentity: SampleIdentity | null = null

async function loadSampleIdentity(): Promise<SampleIdentity> {
  if (cachedIdentity) return cachedIdentity

  const { data, error } = await supabase
    .from('sample_client')
    .select('subject, data_nascimento')
    .eq('id', 1)
    .single()

  cachedIdentity = (!error && data)
    ? { subject: data.subject, dataNascimento: data.data_nascimento }
    : FALLBACK_IDENTITY

  return cachedIdentity
}

// Busca a identidade fixa (banco) e calcula o mapa numerológico ao vivo a partir dela.
export async function loadSampleClient(): Promise<{ identity: SampleIdentity; map: NumerologyMap }> {
  const identity = await loadSampleIdentity()
  const map = calcPessoal(identity.subject, identity.dataNascimento)
  return { identity, map }
}

export async function loadSampleInterpretations(map: NumerologyMap): Promise<InterpretationMap> {
  const entries = await Promise.all(
    NUMERIC_INTERP_KEYS.map(async ({ mapKey, tipoSuffix }) => {
      const num = (map as any)[mapKey]
      if (num === null || num === undefined) return null
      const fullKey = `pessoal_${tipoSuffix}`
      const row = await fetchInterpretation(num, fullKey)
      return row ? { key: fullKey, titulo: row.titulo, texto: row.texto } : null
    })
  )
  const staticEntries = await Promise.all(
    STATIC_TEXT_KEYS.map(async (key) => {
      const row = await fetchInterpretation(1, key)
      return row ? { key, titulo: row.titulo, texto: row.texto } : null
    })
  )
  const licoesEntries = await Promise.all(
    (map.licoesCarmicas || []).map(async (v) => {
      const fullKey = 'pessoal_licao_carmica'
      const row = await fetchInterpretation(v, fullKey)
      return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
    })
  )
  const debitosEntries = await Promise.all(
    (map.debitosCarmicos || []).map(async (v) => {
      const fullKey = 'pessoal_debito_carmica'
      const row = await fetchInterpretation(v, fullKey)
      return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
    })
  )
  const tendenciasEntries = await Promise.all(
    (map.tendenciasOcultas || []).map(async (v) => {
      const fullKey = 'pessoal_tendenciaOculta'
      const row = await fetchInterpretation(v, fullKey)
      return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
    })
  )

  const ciclosEntries = await Promise.all(
    (map.ciclosDeVida || []).map(async (c) => {
      const fullKey = 'pessoal_ciclo'
      const row = await fetchInterpretation(c.regente, fullKey)
      return row ? { key: `${fullKey}_${c.regente}`, titulo: row.titulo, texto: row.texto } : null
    })
  )
  const desafiosList = map.desafios
    ? [map.desafios.desafio1, map.desafios.desafio2, map.desafios.desafioPrincipal]
    : []
  const desafiosEntries = await Promise.all(
    desafiosList.map(async (v) => {
      const fullKey = 'pessoal_desafio'
      const row = await fetchInterpretation(v, fullKey)
      return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
    })
  )
  const momentosList = map.momentosDecisivos
    ? [map.momentosDecisivos.momento1, map.momentosDecisivos.momento2, map.momentosDecisivos.momento3, map.momentosDecisivos.momento4]
    : []
  const momentosEntries = await Promise.all(
    momentosList.map(async (v) => {
      const fullKey = 'pessoal_momentoDecisivo'
      const row = await fetchInterpretation(v, fullKey)
      return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
    })
  )

  const interp: InterpretationMap = {}
  entries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  staticEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  licoesEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  debitosEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  tendenciasEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  ciclosEntries.forEach(e => { if (e) interp[`pessoal_ciclo_${e.key.split('_').pop()}`] = { titulo: e.titulo, texto: e.texto } })
  desafiosEntries.forEach(e => { if (e) interp[`pessoal_desafio_${e.key.split('_').pop()}`] = { titulo: e.titulo, texto: e.texto } })
  momentosEntries.forEach(e => { if (e) interp[`pessoal_momentoDecisivo_${e.key.split('_').pop()}`] = { titulo: e.titulo, texto: e.texto } })
  return interp
}
