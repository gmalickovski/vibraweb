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

// Chaldean value for a single character, respecting Portuguese diacritics.
// Acute accent (+2), tilde (+3), grave (×3), Ç = 6.
function letterValue(char: string): number {
  const decomposed = char.normalize('NFD')
  const base = decomposed.charAt(0).toUpperCase()

  if (base === 'Ç') return 6

  let value = TABLE[base] ?? 0
  if (decomposed.length > 1) {
    const diacritic = decomposed.charAt(1)
    if (diacritic === '\u0301') value += 2      // acute
    else if (diacritic === '\u0303') value += 3  // tilde
    else if (diacritic === '\u0300') value *= 3  // grave
    // circumflex (\u0302): no change
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
}

function emptyMap(): NumerologyMap {
  return {
    destino: null, expressao: null, motivacao: null, impressao: null,
    missao: null, talentoOculto: null, psiquico: null, anoPessoal: null,
    debitosCarmicos: [], desafios: null, licoesCarmicas: [], ciclosDeVida: [],
  }
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
  return { destino, expressao, motivacao, impressao, missao, talentoOculto, psiquico, anoPessoal, debitosCarmicos, desafios, licoesCarmicas, ciclosDeVida }
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
