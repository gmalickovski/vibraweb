// Test script for Chaldean numerology calculations
// Name: Guilherme Malickovski Correa | DOB: 14/02/1990

const TABLE = {
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

// letterValue — handles Portuguese diacritics
function letterValue(char) {
  const decomposed = char.normalize('NFD')
  const base = decomposed.charAt(0).toUpperCase()
  if (base === 'Ç') return 6
  let value = TABLE[base] ?? 0
  if (decomposed.length > 1) {
    const diacritic = decomposed.charAt(1)
    if (diacritic === '\u0301') value += 2      // acute
    else if (diacritic === '\u0303') value += 3  // tilde
    else if (diacritic === '\u0300') value *= 3  // grave
  }
  return value
}

// reduce — optionally preserve 11, 22
function reduce(n, allowMaster = true) {
  while (n > 9) {
    if (allowMaster && (n === 11 || n === 22)) return n
    n = String(n).split('').reduce((s, d) => s + Number(d), 0)
  }
  return n
}

// Per-character values with debug
function charDebug(name, filter) {
  const chars = []
  let total = 0
  for (const char of name) {
    if (/\s/.test(char)) continue
    const base = char.normalize('NFD').charAt(0).toUpperCase()
    if (filter && !filter(char, base)) continue
    const v = letterValue(char)
    chars.push(`${char}(${v})`)
    total += v
  }
  return { chars, total }
}

const name = 'Guilherme Malickovski Correa'
const dob  = '14/02/1990'

console.log('='.repeat(60))
console.log(`NOME: ${name}`)
console.log(`DATA: ${dob}`)
console.log('='.repeat(60))

// --- All letter values ---
console.log('\n--- Valores por letra ---')
for (const char of name) {
  if (/\s/.test(char)) { process.stdout.write(' '); continue }
  const v = letterValue(char)
  const base = char.normalize('NFD').charAt(0).toUpperCase()
  const isVowel = VOWELS.has(base)
  process.stdout.write(`${char}${v}(${isVowel?'V':'C'}) `)
}
console.log()

// --- Expressão ---
const exAll = charDebug(name)
const exTotal = exAll.total
const exReduced = reduce(exTotal)
console.log(`\nExpressão:`)
console.log(`  Letras: ${exAll.chars.join(' ')}`)
console.log(`  Total: ${exTotal}  →  reduce: ${exReduced}`)
// special rule for 2 or 4: word-by-word
if (exReduced === 2 || exReduced === 4) {
  const words = name.split(/\s+/).filter(Boolean)
  const wordDetails = words.map(w => {
    const wd = charDebug(w)
    const wr = reduce(wd.total)
    return `${w}=${wd.total}→${wr}`
  })
  const wordSum = words.reduce((acc, w) => {
    const wd = charDebug(w)
    return acc + reduce(wd.total)
  }, 0)
  const finalExp = reduce(wordSum)
  console.log(`  Regra 2/4 → por palavra: ${wordDetails.join(', ')} → soma=${wordSum} → ${finalExp}`)
}

// --- Vogais (Motivação) ---
const vogais = charDebug(name, (_, base) => VOWELS.has(base))
const motivacaoTotal = vogais.total
const motivacao = reduce(motivacaoTotal)
console.log(`\nMotivação (vogais):`)
console.log(`  Vogais: ${vogais.chars.join(' ')}`)
console.log(`  Total: ${motivacaoTotal}  →  reduce(allowMaster): ${motivacao}`)

// --- Consoantes (Impressão) ---
const consoantes = charDebug(name, (_, base) => !VOWELS.has(base) && /[A-Z]/.test(base))
const impTotal = consoantes.total
const impMaster = reduce(impTotal, true)   // current code
const impNoMaster = reduce(impTotal, false) // without master numbers
console.log(`\nImpressão (consoantes):`)
console.log(`  Consoantes: ${consoantes.chars.join(' ')}`)
console.log(`  Total: ${impTotal}`)
console.log(`  reduce(allowMaster=true) = ${impMaster}`)
console.log(`  reduce(allowMaster=false) = ${impNoMaster}`)
console.log(`  *** Valor esperado segundo PDF: 2 ***`)

// --- Destino ---
const [day, month, year] = dob.split('/').map(Number)
const destinoRaw = day + month + year
const destino = reduce(destinoRaw, true)
console.log(`\nDestino:`)
console.log(`  ${day} + ${month} + ${year} = ${destinoRaw}  →  ${destino}`)

// --- Missão ---
const expressaoFinal = (() => {
  const exAll = charDebug(name)
  const exTotal = exAll.total
  let exReduced = reduce(exTotal)
  if (exReduced === 2 || exReduced === 4) {
    const words = name.split(/\s+/).filter(Boolean)
    const wordSum = words.reduce((acc, w) => acc + reduce(charDebug(w).total), 0)
    exReduced = reduce(wordSum)
  }
  return exReduced
})()
const missaoRaw = expressaoFinal + destino
const missao = reduce(missaoRaw, true)
console.log(`\nMissão (Expressão + Destino):`)
console.log(`  ${expressaoFinal} + ${destino} = ${missaoRaw}  →  ${missao}`)

// --- Psíquico ---
const psiquico = reduce(day)
console.log(`\nPsíquico: reduce(${day}) = ${psiquico}`)

// --- Talento Oculto ---
const talentoOculto = reduce(motivacao + expressaoFinal)
console.log(`\nTalento Oculto (Motivação + Expressão): ${motivacao} + ${expressaoFinal} = ${reduce(motivacao + expressaoFinal, false)}`)

// --- Resposta Subconsciente ---
const allValues = new Set()
for (const char of name) {
  const base = char.normalize('NFD').charAt(0).toUpperCase()
  if (/[A-Z]/.test(base)) allValues.add(TABLE[base] ?? 0)
}
const licoesArr = [1,2,3,4,5,6,7,8].filter(n => !allValues.has(n))
const respostaSubconsciente = 9 - licoesArr.length
console.log(`\nLições Cármicas ausentes: [${licoesArr.join(',')}]`)
console.log(`Resposta Subconsciente: 9 - ${licoesArr.length} = ${respostaSubconsciente}`)

// --- Desafios ---
const d1 = Math.abs(reduce(day, false) - reduce(month, false))
const d2 = Math.abs(reduce(year, false) - reduce(day, false))
const dp = Math.abs(d1 - d2)
console.log(`\nDesafios:`)
console.log(`  dia=${reduce(day,false)} mês=${reduce(month,false)} ano=${reduce(year,false)}`)
console.log(`  Desafio 1: |${reduce(day,false)} - ${reduce(month,false)}| = ${d1}`)
console.log(`  Desafio 2: |${reduce(year,false)} - ${reduce(day,false)}| = ${d2}`)
console.log(`  Desafio Principal: |${d1} - ${d2}| = ${dp}`)

// --- Ciclos de Vida ---
const fim1Year = year + (37 - destino)
const fim2Year = fim1Year + 27
console.log(`\nCiclos de Vida:`)
console.log(`  Ciclo 1: ${year} – ${fim1Year} | regente: reduce(mês=${month}) = ${reduce(month, false)}`)
console.log(`  Ciclo 2: ${fim1Year} – ${fim2Year} | regente: reduce(dia=${day}) = ${reduce(day, true)}`)
console.log(`  Ciclo 3: ${fim2Year} – resto da vida | regente: reduce(ano=${year}) = ${reduce(year, true)}`)

// --- Momentos Decisivos ---
const mn = reduce(day, true)
const mm = reduce(month, true)
const ma = reduce(year, true)
const m1 = reduce(mm + mn, true)
const m2 = reduce(mn + ma, true)
const m3 = reduce(m1 + m2, true)
const m4 = reduce(mm + ma, true)
console.log(`\nMomentos Decisivos:`)
console.log(`  n=${mn} m=${mm} a=${ma}`)
console.log(`  M1 = m+n = ${mm}+${mn} = ${m1}`)
console.log(`  M2 = n+a = ${mn}+${ma} = ${m2}`)
console.log(`  M3 = M1+M2 = ${m1}+${m2} = ${m3}`)
console.log(`  M4 = m+a = ${mm}+${ma} = ${m4}`)

// --- Ano Pessoal (2026) ---
const anoPessoalRaw = day + month + 2026
const anoPessoal = reduce(anoPessoalRaw)
console.log(`\nAno Pessoal 2026: ${day}+${month}+2026 = ${anoPessoalRaw} → ${anoPessoal}`)

console.log('\n' + '='.repeat(60))
console.log('RESUMO DE VERIFICAÇÕES:')
console.log(`  Expressão  = ${expressaoFinal}`)
console.log(`  Motivação  = ${motivacao}`)
console.log(`  Impressão  = ${impMaster} (atual) | SEM master = ${impNoMaster}`)
console.log(`  Destino    = ${destino}`)
console.log(`  Missão     = ${missao}`)
console.log(`  Psíquico   = ${psiquico}`)
console.log('='.repeat(60))
