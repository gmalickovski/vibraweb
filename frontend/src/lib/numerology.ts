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

// "Dias Básicos" — tabela de referência (pdf-dias-favoraveis.pdf) usada para
// calcular os Dias Favoráveis do Mês. Cada par [a, b] é lido diretamente da
// tabela por dia+mês de nascimento — NÃO é derivado do Número Psíquico (o
// cálculo anterior, que só usava reduce(dia), estava com a lógica errada:
// ignorava o mês inteiramente e produzia uma sequência de dias completamente
// diferente da tabela oficial). Índice: DIAS_BASICOS[mês 1-12][dia-1].
// Transcrita da tabela oficial; ambos os exemplos do PDF batem exatamente
// (14/01 → 5,6 e 02/11 → 1,7).
const DIAS_BASICOS: Record<number, [number, number][]> = {
  1: [ // Janeiro
    [1,5],[1,6],[3,6],[1,5],[5,6],[5,6],[1,7],[1,3],[6,9],[1,5],
    [1,6],[6,9],[1,5],[5,6],[5,6],[1,5],[1,3],[5,6],[1,5],[1,6],
    [3,6],[1,5],[5,6],[5,6],[1,5],[2,3],[6,9],[2,7],[5,7],[2,3],
    [2,7],
  ],
  2: [ // Fevereiro
    [1,5],[2,7],[3,6],[2,7],[5,6],[3,6],[2,7],[2,3],[3,6],[2,7],
    [5,7],[5,6],[2,7],[5,6],[3,6],[2,5],[2,3],[3,6],[2,7],[2,7],
    [3,6],[2,7],[5,6],[5,6],[2,7],[2,3],[6,9],[2,7],[6,7],
  ],
  3: [ // Março
    [1,7],[2,7],[3,6],[1,7],[5,7],[3,6],[2,7],[3,6],[6,9],[1,7],
    [1,7],[6,7],[1,5],[5,7],[3,6],[1,2],[3,6],[3,6],[1,7],[2,7],
    [3,6],[1,7],[6,7],[3,6],[2,7],[1,3],[1,9],[5,9],[1,7],[3,6],
    [1,5],
  ],
  4: [ // Abril
    [1,7],[1,7],[3,9],[1,7],[5,7],[3,6],[5,7],[1,3],[3,9],[1,7],
    [1,7],[1,9],[1,7],[5,7],[3,6],[1,2],[1,3],[1,3],[1,7],[2,7],
    [1,3],[1,7],[5,7],[3,5],[5,7],[2,3],[3,6],[2,7],[1,7],[3,6],
  ],
  5: [ // Maio
    [1,2],[2,7],[3,6],[1,7],[5,6],[5,6],[2,7],[2,5],[5,9],[1,5],
    [1,7],[2,6],[1,7],[5,6],[5,6],[2,5],[2,3],[5,6],[1,2],[2,7],
    [3,6],[1,7],[5,6],[5,6],[2,7],[2,5],[5,9],[2,7],[5,7],[5,6],
    [1,5],
  ],
  6: [ // Junho
    [1,5],[2,7],[5,6],[1,5],[5,6],[5,6],[2,7],[3,5],[5,9],[1,5],
    [5,7],[5,6],[1,5],[5,6],[5,6],[2,5],[2,5],[5,6],[1,5],[2,7],
    [5,6],[1,5],[5,6],[5,6],[2,7],[2,5],[5,6],[2,7],[1,7],[2,3],
  ],
  7: [ // Julho
    [1,2],[2,7],[2,3],[1,7],[5,7],[2,6],[2,7],[2,3],[2,3],[1,2],
    [1,7],[2,6],[1,2],[5,7],[6,7],[1,2],[2,3],[2,3],[1,2],[2,7],
    [3,6],[1,2],[5,7],[6,7],[2,7],[2,3],[1,9],[2,7],[1,7],[3,6],
    [1,7],
  ],
  8: [ // Agosto
    [1,2],[1,5],[3,6],[1,2],[1,5],[3,6],[2,7],[2,3],[3,6],[1,2],
    [1,7],[1,6],[1,5],[1,5],[1,6],[1,2],[1,3],[1,3],[1,2],[2,7],
    [3,6],[1,2],[1,5],[3,6],[2,7],[2,3],[3,6],[2,5],[1,5],[3,6],
    [1,5],
  ],
  9: [ // Setembro
    [1,5],[2,5],[3,6],[1,5],[5,6],[5,6],[2,5],[2,3],[3,6],[1,2],
    [1,5],[3,6],[1,7],[5,6],[5,6],[2,5],[2,3],[3,6],[1,5],[2,7],
    [3,6],[1,7],[5,6],[3,6],[2,7],[3,6],[6,9],[2,7],[1,7],[3,6],
  ],
  10: [ // Outubro
    [2,7],[2,7],[3,6],[1,7],[5,6],[3,6],[2,7],[3,6],[3,6],[1,5],
    [1,6],[2,6],[1,7],[5,6],[3,6],[1,2],[3,6],[3,6],[2,7],[2,7],
    [3,6],[1,7],[5,6],[3,6],[2,7],[3,6],[6,9],[2,7],[1,7],[3,6],
    [1,3],
  ],
  11: [ // Novembro
    [1,7],[1,7],[3,9],[1,7],[5,7],[3,5],[1,7],[3,9],[3,9],[2,7],
    [1,7],[1,9],[1,7],[5,7],[3,5],[1,5],[3,9],[3,9],[1,7],[2,7],
    [3,9],[1,7],[5,7],[3,5],[1,7],[3,9],[3,9],[2,7],[1,7],[3,6],
  ],
  12: [ // Dezembro
    [1,7],[2,7],[3,6],[1,7],[3,6],[3,6],[2,7],[2,3],[3,9],[1,7],
    [1,7],[6,9],[1,3],[5,6],[3,6],[1,2],[2,3],[3,6],[1,7],[2,7],
    [3,6],[1,7],[5,6],[3,6],[3,7],[3,6],[6,9],[5,6],[1,6],[3,6],
    [1,3],
  ],
}

// Chaldean value for a single character, respecting Portuguese diacritics.
// Acute (+2), tilde (+3), grave (×2), trema (×2), circumflex (+7), Ç = 6.
// Modifiers ported from the nome-magnetico reference implementation
// (nome-magnetico/src/backend/numerology/core.ts) — the previous grave (×3)
// and circumflex (no change) values were wrong, which skewed every
// calculation that reads individual letter values (não só o Triângulo da
// Vida) for names with acentos comuns em português (â, ê, ô...).
function letterValue(char: string): number {
  const decomposed = char.normalize('NFD')
  const base = decomposed.charAt(0).toUpperCase()

  if (base === 'Ç') return 6

  let value = TABLE[base] ?? 0
  if (decomposed.length > 1) {
    const diacritic = decomposed.charAt(1)
    if (diacritic === '́') value += 2       // acute (´)
    else if (diacritic === '̃') value += 3  // tilde (~)
    else if (diacritic === '̀') value *= 2  // grave (`)
    else if (diacritic === '̈') value *= 2  // trema/diaeresis (¨)
    else if (diacritic === '̂') value += 7  // circumflex (^)
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

// Motivação: vowels only. Preserves master numbers per Chaldean rules.
function calcMotivacao(name: string): number {
  return reduce(sumLetters(name, (_, base) => VOWELS.has(base)), true)
}

// Impressão: consonants only. Does NOT preserve master numbers.
function calcImpressao(name: string): number {
  return reduce(sumLetters(name, (_, base) => !VOWELS.has(base) && /[A-Z]/.test(base)), false)
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

// Talento Oculto = Motivação + Expressão. Does NOT preserve master numbers.
function calcTalentoOculto(motivacao: number | null, expressao: number | null): number | null {
  if (motivacao === null || expressao === null) return null
  return reduce(motivacao + expressao)
}

function calcDiaNatalicio(dob: string): number | null {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  return parts[0]
}

// Psíquico: reduce the birth day. Does NOT preserve master numbers.
function calcPsiquico(dob: string): number | null {
  const day = calcDiaNatalicio(dob)
  return day !== null ? reduce(day) : null
}

// Ano Pessoal: uses the last birthday date (not just DD/MM + current year).
// Referência (pdf-ano-pessoal.pdf): "O Ano Pessoal, que vai do 1 até o 9" —
// nunca preserva número mestre, ao contrário de Mês/Dia Pessoal. Precisa do
// allowMaster=false explícito aqui; sem isso, uma soma cujo primeiro passo de
// redução de dígitos bate em 11 ou 22 (ex: 15/03/2000 → 15+3+2000=2018 →
// 2+0+1+8=11) parava errado em 11 em vez de continuar reduzindo para 2.
function calcAnoPessoal(dob: string, targetYear?: number): number | null {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return null
  const [day, month] = parts
  const year = targetYear ?? new Date().getFullYear()
  const today = new Date()
  const birthdayThisYear = new Date(today.getFullYear(), month - 1, day)
  const refYear = today >= birthdayThisYear ? today.getFullYear() : today.getFullYear() - 1
  const useYear = targetYear ?? refYear
  return reduce(day + month + useYear, false)
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

// Sequência de 3+ dígitos iguais repetidos em qualquer linha do triângulo
// (ex: "555") — ver BLOQUEIOS_MAP.
export interface TrianguloBloqueio {
  codigo: string
  titulo: string
  descricao: string
  aspectoSaude: string
}

export interface TrianguloDaVida {
  arcanos: number[]
  arcanoRegente: number | null
  sequenciaCompleta: number[]
  bloqueios: TrianguloBloqueio[]
  /** Todas as linhas da pirâmide, da base (letras) até o topo (arcano regente) */
  linhas: number[][]
}

export interface ArcanoAtual {
  numero: number | null
  periodo: string
  idadeInicio: number
  idadeFim: number
  /** Índice cronológico do arcano na sequência (para marcar passado/presente/futuro) */
  indice: number
  /** Duração de cada ciclo em anos (90 / total de arcanos) */
  duracaoCiclo: number
  /** Total de arcanos na sequência */
  totalArcanos: number
}

export interface NumerologyMap {
  destino: number | null
  expressao: number | null
  motivacao: number | null
  impressao: number | null
  missao: number | null
  talentoOculto: number | null
  diaNatalicio: number | null
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
    missao: null, talentoOculto: null, diaNatalicio: null, psiquico: null, anoPessoal: null,
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

// Bloqueios (sequências negativas) do Triângulo da Vida — 3+ dígitos iguais
// seguidos em qualquer linha do triângulo (ex: "555"). Portado literalmente
// de nome-magnetico/src/backend/numerology/triangle.ts (BLOQUEIOS_MAP).
const BLOQUEIOS_MAP: Record<string, Omit<TrianguloBloqueio, 'codigo'>> = {
  '111': {
    titulo: 'Bloqueio de Iniciação (111)',
    descricao: 'Limitação profunda da força de vontade, perda de coragem e inatividade crônica. A presença deste bloqueio gera uma forte tendência à dependência de terceiros e cria bloqueios sistêmicos ao tentar iniciar projetos, defender ideias próprias ou afirmar a sua individualidade autêntica. O grande antídoto cármico para transcender essa energia é desenvolver ativamente a coragem, fortalecer a autonomia pessoal e recuperar a confiança absoluta no próprio potencial de liderança inato.',
    aspectoSaude: 'Tendência para desenvolver alguns distúrbios ou doenças cardíacas.',
  },
  '222': {
    titulo: 'Bloqueio de Associação (222)',
    descricao: 'Timidez extrema, indecisão constante e uma perigosa tendência a ser subjugado e apagado pelos outros. Este bloqueio manifesta dificuldades severas em manter parcerias, sociedades e relacionamentos saudáveis, muitas vezes resultando em drástica perda de autoestima e anulação da própria vontade. O antídoto fundamental é cultivar a diplomacia, a paciência e estabelecer limites claros para manter o equilíbrio inegociável entre o que você oferece e o que você recebe.',
    aspectoSaude: 'Pode, eventualmente, surgir alguma doença que provoque dependência.',
  },
  '333': {
    titulo: 'Bloqueio de Expressão (333)',
    descricao: 'Dificuldade profunda no diálogo e barreiras persistentes ao tentar se comunicar com clareza. Este bloqueio gera a constante sensação de ser incompreendido e uma forte dificuldade em se impor e expressar seus sentimentos verdadeiros nas relações pessoais e profissionais. Para transcender esse obstáculo, o antídoto exige focar na expressão criativa, treinar a comunicação autêntica e transparente, e sustentar o otimismo mesmo diante das barreiras sociais.',
    aspectoSaude: 'Indica possibilidade de doenças respiratórias ou de articulações.',
  },
  '444': {
    titulo: 'Bloqueio de Estruturação (444)',
    descricao: 'Bloqueio severo na realização profissional e financeira. Indica uma forte tendência a não receber o reconhecimento merecido pelo seu esforço, além de dificuldade crônica em manter estabilidade. Pode gerar excesso de rigidez, pessimismo ou, pelo contrário, extrema desorganização. O antídoto para destravar este fluxo exige o cultivo diário da disciplina, estabelecimento de métodos claros de ação, e uma resiliência inabalável para construir bases sólidas.',
    aspectoSaude: 'Indica possibilidade de doenças reumáticas ou arteriais.',
  },
  '555': {
    titulo: 'Bloqueio de Liberdade (555)',
    descricao: 'Dificuldade crônica em aceitar e lidar com mudanças, acompanhada de instabilidade contínua. Este bloqueio provoca insatisfação constante, agitação interna e uma perigosa atração pela rebeldia ou vícios como válvula de escape. A liberdade pessoal frequentemente se torna uma fonte de caos em vez de paz. O antídoto principal é aprender a aceitar o fluxo natural da vida, desenvolver flexibilidade mental, adaptar-se sem resistência e usar a liberdade com profunda responsabilidade.',
    aspectoSaude: 'Desenvolver alguma doença de pele.',
  },
  '666': {
    titulo: 'Bloqueio de Harmonia (666)',
    descricao: 'Conflitos persistentes e instabilidade na vida familiar e afetiva. Este bloqueio gera decepções frequentes nos relacionamentos íntimos, ciúmes, possessividade e uma tendência ao isolamento emocional. Muitas vezes, você atrai parceiros incompatíveis ou se sente sobrecarregado por responsabilidades domésticas. O antídoto essencial é desenvolver o amor-próprio antes de buscar afeto externo, aprender a perdoar e cultivar a compreensão de que as relações devem ser fontes de equilíbrio, não de peso.',
    aspectoSaude: 'Algum tipo de doença cardíaca pode aparecer nesse estado.',
  },
  '777': {
    titulo: 'Bloqueio de Conexão Espiritual (777)',
    descricao: 'Desconexão dolorosa do plano espiritual e do propósito maior de vida. Este bloqueio gera desânimo, melancolia, confusão mental frequente, medos infundados e uma sensação de vazio interno que o sucesso material não preenche. A energia fica dispersa e a mente nebulosa. O antídoto fundamental para esta vibração é a interiorização diária, o estudo profundos de temas existenciais, a meditação e o desenvolvimento ativo da sua intuição e sabedoria oculta.',
    aspectoSaude: 'Doenças nervosas, dependências e, eventualmente, algum tipo de câncer.',
  },
  '888': {
    titulo: 'Bloqueio de Poder e Abundância (888)',
    descricao: 'Bloqueio crítico no fluxo da abundância financeira e na relação com o mundo material. Manifesta-se através de perdas financeiras súbitas, dificuldades extremas em acumular ou reter riquezas, e um constante sentimento de estagnação na carreira. Pode indicar ambição desmedida ou total aversão ao poder. O antídoto central requer a harmonização da sua relação com o dinheiro, compreendendo-o como energia de troca justa, agindo com máxima ética, justiça e reequilibrando a balança entre a matéria e o espírito.',
    aspectoSaude: 'Como consequência desse estresse extremo, poderá desenvolver alguma doença.',
  },
  '999': {
    titulo: 'Bloqueio de Compaixão Universal (999)',
    descricao: 'Prolongamento exaustivo de ciclos que já deveriam ter se encerrado. Este bloqueio cria forte apego ao passado, ressentimentos duradouros e dificuldades crônicas em perdoar e soltar o que não serve mais. Pode gerar desilusões frequentes, perdas emocionais e uma sensação de sacrifício contínuo pelos outros. O antídoto cármico definitivo é o desenvolvimento da compaixão universal, a prática ativa do desapego, o perdão incondicional (a si mesmo e aos outros) e a aceitação pacífica das conclusões.',
    aspectoSaude: 'Tudo isto pode afetar diretamente o sistema nervoso e o coração.',
  },
}

// Detecta 3+ dígitos iguais consecutivos em qualquer linha do triângulo
// (mesmo código em linhas diferentes conta só 1x na lista final).
function detectBloqueios(linhas: number[][]): TrianguloBloqueio[] {
  const found = new Set<string>()
  for (const linha of linhas) {
    const s = linha.join('')
    const matches = s.match(/(\d)\1{2,}/g) ?? []
    matches.forEach(m => found.add(m.charAt(0).repeat(3)))
  }
  return Array.from(found).sort().map(codigo => ({ codigo, ...BLOQUEIOS_MAP[codigo] }))
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
    if (/\s/.test(char)) continue
    const base = char.normalize('NFD').charAt(0).toUpperCase()
    if (/[A-ZÀ-ÿ]/.test(base)) {
      const v = reduce(letterValue(char), false) // reduce without master numbers
      if (v > 0) present.add(v)
    }
  }
  // Chaldean karmic lessons: 1-9 (reference: calculo-numerologia-completo.txt)
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !present.has(n))
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

// Referência (pdf-tendencias-ocultas.pdf): "a partir de quatro ocorrências,
// temos uma Tendência Oculta" — limiar é >=4, não >=3. Verificado contra os
// 2 exemplos do PDF: Antônio Fragoso (todos os números ≤3× → nenhuma
// tendência) e Jaqueline Martins (1 aparece 6×, 5 aparece 4× → tendências 1 e 5).
function calcTendenciasOcultas(nome: string): number[] {
  const counts: Record<number, number> = {}
  for (const char of nome) {
    if (/\s/.test(char)) continue
    const base = char.normalize('NFD').charAt(0).toUpperCase()
    if (!/[A-Z]/.test(base)) continue
    const v = reduce(letterValue(char))
    counts[v] = (counts[v] ?? 0) + 1
  }
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(i => (counts[i] ?? 0) >= 4)
}

function calcRespostaSubconsciente(nome: string): number {
  return 9 - calcLicoesCarmicas(nome).length
}

// Dias Favoráveis do Mês (pdf-dias-favoraveis.pdf): parte dos 2 "dias
// básicos" [a, b] da tabela de referência (DIAS_BASICOS, por dia+mês de
// nascimento — não do Número Psíquico). Sequência: dobra o 2º básico, depois
// alterna somando o 1º e o 2º básico ao resultado anterior até passar de 31.
// Ex.: [5,6] → 6×2=12 → 12+5=17 → 17+6=23 → 23+5=28 → 28+6=34 (para, >31) →
// {5,6,12,17,23,28}, batendo exatamente com o exemplo do PDF.
function calcDiasFavoraveis(dob: string): number[] {
  const parts = dob.split('/').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return []
  const [day, month] = parts
  const basicos = DIAS_BASICOS[month]?.[day - 1]
  if (!basicos) return []
  const [a, b] = basicos
  const days = new Set<number>([a, b])
  let current = b * 2
  if (current <= 31) days.add(current)
  else return Array.from(days).sort((x, y) => x - y)
  let useA = true
  while (true) {
    const next = current + (useA ? a : b)
    if (next > 31) break
    days.add(next)
    current = next
    useA = !useA
  }
  return Array.from(days).sort((x, y) => x - y)
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
  const anoPessoalNum = reduce(day + month + refYear, false)
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
    const anoPessoalNum = reduce(day + month + refYear, false)
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
    const numero = reduce(day + month + y, false)
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
  // Cada valor de letra é reduzido a 1 dígito (1-9) ANTES de montar o
  // triângulo — mirrors a referência (nome-magnetico/core.ts). Sem isso,
  // acentos como â/ê/ô produzem valores >9 e "arcanos" de 3+ dígitos em vez
  // do range 11-88 esperado.
  const valores = clean.split('').map(letterValue).filter(v => v > 0).map(v => reduce(v, false))
  // Adjacent pairs concatenated as two-digit numbers (e.g. 3,5 → 35)
  const sequenciaCompleta: number[] = []
  for (let i = 0; i < valores.length - 1; i++) {
    sequenciaCompleta.push(parseInt(`${valores[i]}${valores[i + 1]}`, 10))
  }
  // Reduce the triangle to find the arcano regente (tip of the triangle) —
  // números mestre (11/22) nunca sobrevivem à redução da pirâmide na
  // referência, então o Arcano Regente final é sempre 1 dígito.
  const linhas: number[][] = [valores]
  let row = valores
  while (row.length > 1) {
    row = row.slice(0, -1).map((v, j) => reduce(v + row[j + 1], false))
    linhas.push(row)
  }
  const arcanoRegente = row[0] ?? null
  const arcanos = Array.from(new Set(sequenciaCompleta))
  const bloqueios = detectBloqueios(linhas)
  return { arcanos, arcanoRegente, sequenciaCompleta, bloqueios, linhas }
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
  const indice = Math.max(0, Math.min(Math.floor(idade / duracaoCiclo), sequenciaCompleta.length - 1))
  const numero = sequenciaCompleta[indice] ?? null
  const idadeInicio = Math.floor(indice * duracaoCiclo)
  const idadeFim = Math.floor((indice + 1) * duracaoCiclo)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
  const periodo = `${fmt(new Date(year + idadeInicio, month - 1, day))} a ${fmt(new Date(year + idadeFim, month - 1, day))}`
  return { numero, periodo, idadeInicio, idadeFim, indice, duracaoCiclo, totalArcanos: sequenciaCompleta.length }
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
  const diaNatalicio = calcDiaNatalicio(dob)
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
    diaNatalicio, psiquico, anoPessoal, debitosCarmicos, desafios, licoesCarmicas, ciclosDeVida,
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
