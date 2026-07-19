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
import { NUMERIC_INTERP_KEYS, STATIC_TEXT_KEYS, DIA_PESSOAL_GUIA_NUMEROS, type InterpretationMap } from './document-builder'

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
      const fullKey = 'pessoal_debito_carmico'
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

  // Arcanos (Regente + sequência completa) — mesma chave fixa 'pessoal_arcano'
  // usada em OutputPanel.tsx/CustomTexts.tsx/PreviewPage.tsx.
  const arcanoNumeros = Array.from(new Set([
    map.trianguloDaVida?.arcanoRegente ?? null,
    ...(map.trianguloDaVida?.sequenciaCompleta ?? []),
  ].filter((n): n is number => n !== null)))
  const arcanosEntries = await Promise.all(
    arcanoNumeros.map(async (n) => {
      const row = await fetchInterpretation(n, 'pessoal_arcano')
      return row ? { key: `pessoal_arcano_${n}`, titulo: row.titulo, texto: row.texto } : null
    })
  )

  // Bloqueios do Triângulo (sequências 111-999 encontradas no nome) — tipo
  // fixo 'pessoal_bloqueio', numero = a própria sequência (migration 032).
  const bloqueioEntries = await Promise.all(
    (map.trianguloDaVida?.bloqueios ?? []).map(async (b) => {
      const row = await fetchInterpretation(Number(b.codigo), 'pessoal_bloqueio')
      return row ? { key: `pessoal_bloqueio_${b.codigo}`, titulo: row.titulo, texto: row.texto } : null
    })
  )

  // Dias Favoráveis — texto da vibração de cada dia favorável da pessoa
  // (tipo 'pessoal_dia_favoravel', numero = o dia do mês 1-31, migration 033).
  const diasFavoraveisEntries = await Promise.all(
    (map.diasFavoraveis || []).map(async (v) => {
      const row = await fetchInterpretation(v, 'pessoal_dia_favoravel')
      return row ? { key: `pessoal_dia_favoravel_${v}`, titulo: row.titulo, texto: row.texto } : null
    })
  )

  // Guia de Dias Pessoais — os 11 valores possíveis (1-9/11/22).
  const diaPessoalGuiaEntries = await Promise.all(
    DIA_PESSOAL_GUIA_NUMEROS.map(async (n) => {
      const row = await fetchInterpretation(n, 'pessoal_diaPessoal')
      return row ? { key: `pessoal_diaPessoal_guia_${n}`, titulo: row.titulo, texto: row.texto } : null
    })
  )

  // Meses Pessoais — texto de cada número único nos próximos 12 meses.
  const mesPessoalNumeros = Array.from(new Set((map.mesesPessoais ?? []).map(m => m.numero)))
  const mesesEntries = await Promise.all(
    mesPessoalNumeros.map(async (n) => {
      const fullKey = 'pessoal_mesPessoal'
      const row = await fetchInterpretation(n, fullKey)
      return row ? { key: `${fullKey}_${n}`, titulo: row.titulo, texto: row.texto } : null
    })
  )

  // Harmonia Conjugal — texto de cada número que aparece em
  // Vibra com/Atrai/Oposto/Passivo.
  const harmoniaNumeros = Array.from(new Set([
    ...(map.harmoniaConjugal?.vibra ?? []), ...(map.harmoniaConjugal?.atrai ?? []),
    ...(map.harmoniaConjugal?.oposto ?? []), ...(map.harmoniaConjugal?.passivo ?? []),
  ]))
  const harmoniaEntries = await Promise.all(
    harmoniaNumeros.map(async (n) => {
      const row = await fetchInterpretation(n, 'pessoal_harmoniaConjugal')
      return row ? { key: `pessoal_harmoniaConjugal_${n}`, titulo: row.titulo, texto: row.texto } : null
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
  arcanosEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  bloqueioEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  harmoniaEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  mesesEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  diaPessoalGuiaEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  diasFavoraveisEntries.forEach(e => { if (e) interp[e.key] = { titulo: e.titulo, texto: e.texto } })
  return interp
}
