// Cabalistic numerology engine — Chaldean table (ported from gmalickovski/vibraweb)
// Pure client-side math: no credentials, no DB calls.

// Chaldean letter-to-value table (not Pythagorean)
const TABLE: Record<string, number> = {
  A: 1, I: 1, Q: 1, J: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4, X: 4,
  E: 5, H: 5, N: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
}

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U', 'Y'])

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Chaldean value for a single character, respecting Portuguese diacritics.
// Acute accent (+2), tilde (+3), grave (×3), Ç = 6.
function letterValue(char: string): number {
  const decomposed = char.normalize('NFD')
  const base = decomposed.charAt(0).toUpperCase()

  if (base === 'Ç') return 6

  let value = TABLE[base] ?? 0
  if (decomposed.length > 1) {
    const diacritic = decomposed.charAt(1)
    if (diacritic === '́') value += 2      // acute
    else if (diacritic === '̃') value += 3  // tilde
    else if (diacritic === '̀') value *= 3  // grave
    // circumflex (̂): no change
  }
  return value
}

// Reduce to single digit; preserve master numbers 11 and 22 when allowMaster = true.
function reduce(n: number, allowMaster = true): number {
  while (n > 9) {
    if (allowMaster && (n === 11 || n === 22)) return n
    n = String(n).split('').reduce((s, d) => s + Number(d), 0)
  }
  return n
}

// Sum all letter values in a text, with optional filter.
function sumLetters(text: string, filter?: (ch: string, base: string) => boolean): number {
  let total = 0
  for (const char of text) {
    if (/\s/.test(char)) continue
    const base = char.normalize('NFD').charAt(0).toUpperCase()
    if (filter && !filter(char, base)) continue
    total += letterValue(char)
  }
  return total
}

// Expressão: if result is 2 or 4, recalculate word-by-word (original rule).
function calcExpressao(name: string): number {
  const total = sumLetters(name)
  let result = reduce(total)
  if (result === 2 || result === 4) {
    const wordSum = name
      .split(/\s+/)
      .filter(Boolean)
      .reduce((acc, word) => acc + reduce(sumLetters(word)), 0)
    result = reduce(wordSum)
  }
  return result
}

// Motivação: vowels only.
function calcMotivacao(name: string): number {
  return reduce(sumLetters(name, (_, base) => VOWELS.has(base)))
}

// Impressão: consonants only.
function calcImpressao(name: string): number {
  return reduce(sumLetters(name, (_, base) => !VOWELS.has(base) && /[A-Z]/.test(base)))
}

// Destino: day + month + year as integers (not digit-by-digit).
function calcDestino(dob: string): number | null {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [day, month, year] = parts
  return reduce(day + month + year, true)
}

// Missão = Expressão + Destino.
function calcMissao(expressao: number, destino: number | null): number | null {
  if (destino === null) return null
  return reduce(expressao + destino, true)
}

// Talento Oculto = Motivação + Expressão.
function calcTalentoOculto(motivacao: number, expressao: number): number {
  return reduce(motivacao + expressao)
}

// Psíquico: reduce the birth day.
function calcPsiquico(dob: string): number | null {
  const day = parseInt(dob.split('/')[0], 10)
  if (isNaN(day)) return null
  return reduce(day)
}

// Ano Pessoal: uses the last birthday date (not just DD/MM + current year).
function calcAnoPessoal(dob: string, targetYear?: number): number | null {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [day, month] = parts
  const year = targetYear ?? new Date().getFullYear()
  const today = new Date()
  const birthdayThisYear = new Date(today.getFullYear(), month - 1, day)
  const refYear = today >= birthdayThisYear ? today.getFullYear() : today.getFullYear() - 1
  const useYear = targetYear ?? refYear
  return reduce(day + month + useYear)
}

export interface CicloDeVida {
  inicio: number | string
  fim: number | string
  regente: number
}

export interface Desafios {
  desafio1: number
  desafio2: number
  desafioPrincipal: number
}

export interface MomentosDecisivos {
  momento1: number
  momento2: number
  momento3: number
  momento4: number
}

export interface HarmoniaConjugal {
  vibra: number[]
  atrai: number[]
  oposto: number[]
  passivo: number[]
}

export interface AnoPessoalEntry {
  numero: number
  periodo: string
}

export interface MesPessoalEntry {
  nome: string
  numero: number
  mes: number
  ano: number
}

export interface TrianguloDaVida {
  arcanos: number[]
  arcanoRegente: number | null
  sequenciaCompleta: number[]
}

export interface ArcanoAtual {
  numero: number | null
  periodo: string
  idadeInicio: number
  idadeFim: number
}

export interface NumerologyMap {
  destino: number | null
  expressao: number | null
  motivacao: number | null
  impressao: number | null
  missao: number | null
  talentoOculto: number | null
  psiquico: number | null
  anoPessoal: number | null
  debitosCarmicos: number[]
  desafios: Desafios | null
  licoesCarmicas: number[]
  ciclosDeVida: CicloDeVida[]
  momentosDecisivos: MomentosDecisivos | null
  harmoniaConjugal: HarmoniaConjugal | null
  tendenciasOcultas: number[]
  respostaSubconsciente: number | null
  diasFavoraveis: number[]
  numerosHarmonicos: number[]
  diaPessoal: number | null
  mesesPessoais: MesPessoalEntry[]
  proximos10Anos: AnoPessoalEntry[]
  trianguloDaVida: TrianguloDaVida | null
  arcanoAtual: ArcanoAtual | null
}

function emptyMap(): NumerologyMap {
  return {
    destino: null, expressao: null, motivacao: null, impressao: null,
    missao: null, talentoOculto: null, psiquico: null, anoPessoal: null,
    debitosCarmicos: [], desafios: null, licoesCarmicas: [], ciclosDeVida: [],
    momentosDecisivos: null, harmoniaConjugal: null,
    tendenciasOcultas: [], respostaSubconsciente: null,
    diasFavoraveis: [], numerosHarmonicos: [],
    diaPessoal: null, mesesPessoais: [], proximos10Anos: [],
    trianguloDaVida: null, arcanoAtual: null,
  }
}

// Harmonia conjugal lookup table (fixed per Chaldean numerology)
const HARMONIA_TABLE: Record<number, HarmoniaConjugal> = {
  1: { vibra: [9],       atrai: [4, 8],      oposto: [6, 7],    passivo: [2, 3, 5] },
  2: { vibra: [8],       atrai: [7, 9],      oposto: [5],       passivo: [1, 3, 4, 6] },
  3: { vibra: [7],       atrai: [5, 6, 9],   oposto: [4, 8],    passivo: [1, 2] },
  4: { vibra: [6],       atrai: [1, 8],      oposto: [3, 5],    passivo: [2, 7, 9] },
  5: { vibra: [5],       atrai: [3, 9],      oposto: [2, 4, 6], passivo: [1, 7, 8] },
  6: { vibra: [4],       atrai: [3, 7, 9],   oposto: [1, 5, 8], passivo: [2] },
  7: { vibra: [3],       atrai: [2, 6],      oposto: [1, 9],    passivo: [4, 5, 8] },
  8: { vibra: [2],       atrai: [1, 4],      oposto: [3, 6],    passivo: [5, 7, 9] },
  9: { vibra: [1],       atrai: [2, 3, 5, 6],oposto: [],        passivo: [4, 8] },
}

function calcDebitosCarmicos(dob: string, destino: number | null, motivacao: number | null, expressao: number | null): number[] {
  const day = parseInt(dob.split('/')[0], 10)
  const debts = new Set<number>()
  if ([13, 14, 16, 19].includes(day)) debts.add(day)
  const map: Record<number, number> = { 4: 13, 5: 14, 7: 16, 1: 19 }
  ;[destino, motivacao, expressao].forEach(n => { if (n !== null && map[n]) debts.add(map[n]) })
  return Array.from(debts)
}

function calcDesafios(dob: string): Desafios | null {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [day, month, year] = parts
  const d1 = Math.abs(reduce(day) - reduce(month))
  const d2 = Math.abs(reduce(year) - reduce(day))
  return { desafio1: d1, desafio2: d2, desafioPrincipal: Math.abs(d1 - d2) }
}

function calcLicoesCarmicas(name: string): number[] {
  const present = new Set<number>()
  for (const char of name) {
    const base = char.normalize('NFD').charAt(0).toUpperCase()
    if (/[A-Z]/.test(base)) present.add(TABLE[base] ?? 0)
  }
  return [1, 2, 3, 4, 5, 6, 7, 8].filter(n => !present.has(n))
}

function calcCiclosDeVida(dob: string, destino: number | null): CicloDeVida[] {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN) || destino === null) return []
  const [day, month, year] = parts
  const fim1 = year + (37 - destino)
  return [
    { inicio: String(year), fim: fim1, regente: reduce(month) },
    { inicio: fim1, fim: fim1 + 27, regente: reduce(day, true) },
    { inicio: fim1 + 27, fim: 'resto da vida', regente: reduce(year, true) },
  ]
}

// --- New calculation functions ---

function calcMomentosDecisivos(dob: string): MomentosDecisivos | null {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [day, month, year] = parts
  const n = reduce(day, true)
  const m = reduce(month, true)
  const a = reduce(year, true)
  const momento1 = reduce(m + n, true)
  const momento2 = reduce(n + a, true)
  const momento3 = reduce(momento1 + momento2, true)
  const momento4 = reduce(m + a, true)
  return { momento1, momento2, momento3, momento4 }
}

function calcHarmoniaConjugal(missao: number): HarmoniaConjugal | null {
  return HARMONIA_TABLE[missao] ?? null
}

function calcTendenciasOcultas(nome: string): number[] {
  const counts: Record<number, number> = {}
  for (const char of nome) {
    if (/\s/.test(char)) continue
    const base = char.normalize('NFD').charAt(0).toUpperCase()
    if (!/[A-Z]/.test(base)) continue
    const v = reduce(letterValue(char))
    counts[v] = (counts[v] ?? 0) + 1
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => (counts[i] ?? 0) >= 3)
}

function calcRespostaSubconsciente(nome: string): number {
  return 9 - calcLicoesCarmicas(nome).length
}

// Favorable days: psychic number + psychic+1, then keep adding psychic to last day ≤31.
function calcDiasFavoraveis(dob: string): number[] {
  const day = parseInt(dob.split('/')[0], 10)
  if (isNaN(day)) return []
  const psychic = reduce(day)
  const days = new Set<number>()
  days.add(psychic)
  let last = reduce(psychic + 1)
  days.add(last)
  while (true) {
    const next = last + psychic
    if (next > 31 || days.has(next)) break
    days.add(next)
    last = next
  }
  return Array.from(days).sort((a, b) => a - b)
}

function calcNumerosHarmonicos(missao: number): number[] {
  const h = HARMONIA_TABLE[missao]
  if (!h) return []
  return Array.from(new Set([...h.vibra, ...h.atrai])).sort((a, b) => a - b)
}

function calcDiaPessoal(dob: string): number | null {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [day, month] = parts
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  const birthday = new Date(currentYear, month - 1, day)
  const refYear = today >= birthday ? currentYear : currentYear - 1
  const anoPessoalNum = reduce(day + month + refYear)
  const mesPessoalNum = reduce(anoPessoalNum + currentMonth)
  return reduce(mesPessoalNum + reduce(today.getDate()), true)
}

function calcMesesPessoais(dob: string): MesPessoalEntry[] {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return []
  const [day, month] = parts
  const today = new Date()
  const result: MesPessoalEntry[] = []
  for (let i = 0; i < 12; i++) {
    const target = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const targetMonth = target.getMonth() + 1
    const targetYear = target.getFullYear()
    const birthday = new Date(targetYear, month - 1, day)
    const refYear = target >= birthday ? targetYear : targetYear - 1
    const anoPessoalNum = reduce(day + month + refYear)
    const numero = reduce(anoPessoalNum + targetMonth)
    result.push({ nome: MONTH_NAMES[target.getMonth()], numero, mes: targetMonth, ano: targetYear })
  }
  return result
}

function calcProximos10AnosPessoais(dob: string): AnoPessoalEntry[] {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return []
  const [day, month] = parts
  const today = new Date()
  const birthday = new Date(today.getFullYear(), month - 1, day)
  const startYear = today >= birthday ? today.getFullYear() : today.getFullYear() - 1
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  const result: AnoPessoalEntry[] = []
  for (let i = 0; i < 10; i++) {
    const y = startYear + i
    const numero = reduce(day + month + y)
    const inicio = new Date(y, month - 1, day)
    const fimDate = new Date(y + 1, month - 1, day)
    fimDate.setDate(fimDate.getDate() - 1)
    result.push({ numero, periodo: `${fmt(inicio)} a ${fmt(fimDate)}` })
  }
  return result
}

function calcTrianguloDaVida(nome: string): TrianguloDaVida | null {
  const clean = nome.replace(/\s+/g, '').toUpperCase()
  if (clean.length < 2) return null
  const valores = clean.split('').map(letterValue)
  // Adjacent pairs concatenated as two-digit numbers (e.g. 3,5 → 35)
  const sequenciaCompleta: number[] = []
  for (let i = 0; i < valores.length - 1; i++) {
    sequenciaCompleta.push(parseInt(`${valores[i]}${valores[i + 1]}`, 10))
  }
  // Reduce the triangle to find the arcano regente (tip of the triangle)
  let row = valores
  while (row.length > 1) {
    row = row.slice(0, -1).map((v, j) => reduce(v + row[j + 1]))
  }
  const arcanoRegente = row[0] ?? null
  const arcanos = Array.from(new Set(sequenciaCompleta))
  return { arcanos, arcanoRegente, sequenciaCompleta }
}

function calcArcanoAtual(dob: string, sequenciaCompleta: number[]): ArcanoAtual | null {
  if (!sequenciaCompleta.length) return null
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [day, month, year] = parts
  const today = new Date()
  let idade = today.getFullYear() - year
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) idade--
  const duracaoCiclo = 90 / sequenciaCompleta.length
  const indice = Math.min(Math.floor(idade / duracaoCiclo), sequenciaCompleta.length - 1)
  const numero = sequenciaCompleta[indice] ?? null
  const idadeInicio = Math.floor(indice * duracaoCiclo)
  const idadeFim = Math.floor((indice + 1) * duracaoCiclo)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  const periodo = `${fmt(new Date(year + idadeInicio, month - 1, day))} a ${fmt(new Date(year + idadeFim, month - 1, day))}`
  return { numero, periodo, idadeInicio, idadeFim }
}

// --- Public calc functions ---

export function calcPessoal(nome: string, dob: string): NumerologyMap {
  if (!nome || nome.trim().length < 2) return emptyMap()
  const expressao = calcExpressao(nome)
  const motivacao = calcMotivacao(nome)
  const impressao = calcImpressao(nome)
  const destino = calcDestino(dob)
  const missao = calcMissao(expressao, destino)
  const talentoOculto = calcTalentoOculto(motivacao, expressao)
  const psiquico = calcPsiquico(dob)
  const anoPessoal = calcAnoPessoal(dob)
  const debitosCarmicos = calcDebitosCarmicos(dob, destino, motivacao, expressao)
  const desafios = calcDesafios(dob)
  const licoesCarmicas = calcLicoesCarmicas(nome)
  const ciclosDeVida = calcCiclosDeVida(dob, destino)
  const momentosDecisivos = calcMomentosDecisivos(dob)
  const harmoniaConjugal = missao !== null ? calcHarmoniaConjugal(missao) : null
  const tendenciasOcultas = calcTendenciasOcultas(nome)
  const respostaSubconsciente = calcRespostaSubconsciente(nome)
  const diasFavoraveis = calcDiasFavoraveis(dob)
  const numerosHarmonicos = missao !== null ? calcNumerosHarmonicos(missao) : []
  const diaPessoal = calcDiaPessoal(dob)
  const mesesPessoais = calcMesesPessoais(dob)
  const proximos10Anos = calcProximos10AnosPessoais(dob)
  const trianguloDaVida = calcTrianguloDaVida(nome)
  const arcanoAtual = trianguloDaVida !== null
    ? calcArcanoAtual(dob, trianguloDaVida.sequenciaCompleta)
    : null
  return {
    destino, expressao, motivacao, impressao, missao, talentoOculto,
    psiquico, anoPessoal, debitosCarmicos, desafios, licoesCarmicas, ciclosDeVida,
    momentosDecisivos, harmoniaConjugal, tendenciasOcultas, respostaSubconsciente,
    diasFavoraveis, numerosHarmonicos, diaPessoal, mesesPessoais, proximos10Anos,
    trianguloDaVida, arcanoAtual,
  }
}

export function calcBebe(nome: string, sobrenome: string, dob: string): NumerologyMap {
  return calcPessoal(`${nome} ${sobrenome}`.trim(), dob)
}

export function calcEmpresa(razaoSocial: string, fundacao: string): NumerologyMap {
  return calcPessoal(razaoSocial, fundacao)
}

export function calcPrevisoes(nome: string, dob: string, ano?: string): NumerologyMap {
  const base = calcPessoal(nome, dob)
  const targetYear = parseInt(ano || String(new Date().getFullYear()), 10)
  return { ...base, anoPessoal: calcAnoPessoal(dob, isNaN(targetYear) ? undefined : targetYear) }
}
