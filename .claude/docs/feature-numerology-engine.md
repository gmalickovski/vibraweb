# Numerology Engine

**File**: `src/lib/numerology.ts`  
**Origem do algoritmo**: `gmalickovski/vibraweb` → `lib/numerologia.js` (portado para TypeScript)

## Tabela Caldaica (NÃO Pitagórica)

```
A=1  I=1  Q=1  J=1  Y=1
B=2  K=2  R=2
C=3  G=3  L=3  S=3
D=4  M=4  T=4  X=4
E=5  H=5  N=5
U=6  V=6  W=6
O=7  Z=7
F=8  P=8
```

## Tratamento de acentos (pt-BR)

Acentos **modificam** o valor Caldaico da letra:
- Agudo (´) → +2
- Til  (~) → +3
- Grave (`) → ×3
- Circunflexo (^) → sem alteração
- Ç → valor fixo 6

## Regras de redução

- Redução padrão: soma de dígitos até 1–9.
- Números mestres **11** e **22** são preservados quando `allowMaster = true`.

## Regra especial — Expressão

Se o resultado for **2** ou **4**, o cálculo é refeito **palavra a palavra** e os resultados somados.

## Funções exportadas

| Função | Descrição |
|--------|-----------|
| `calcPessoal(nome, dob)` | Mapa completo pessoal |
| `calcBebe(nome, sobrenome, dob)` | Mapa para nome de bebê |
| `calcEmpresa(razaoSocial, fundacao)` | Mapa empresarial |
| `calcPrevisoes(nome, dob, ano?)` | Mapa com ano pessoal customizável |

## NumerologyMap

```typescript
interface NumerologyMap {
  // Números primários (8)
  destino:       number | null
  expressao:     number | null
  motivacao:     number | null
  impressao:     number | null
  missao:        number | null
  talentoOculto: number | null
  psiquico:      number | null
  anoPessoal:    number | null

  // Cármico / desafios
  debitosCarmicos:   number[]
  desafios:          Desafios | null       // { desafio1, desafio2, desafioPrincipal }
  licoesCarmicas:    number[]
  ciclosDeVida:      CicloDeVida[]         // 3 ciclos { inicio, fim, regente }

  // Momentos e Harmonia (novos)
  momentosDecisivos: MomentosDecisivos | null  // { momento1..4 }
  harmoniaConjugal:  HarmoniaConjugal | null   // { vibra, atrai, oposto, passivo }

  // Análise de frequências (novos)
  tendenciasOcultas:      number[]     // valores com count ≥ 3 no nome
  respostaSubconsciente:  number | null // 9 − licoesCarmicas.length
  diasFavoraveis:         number[]
  numerosHarmonicos:      number[]     // vibra + atrai da missão

  // Previsões (novos)
  diaPessoal:    number | null
  mesesPessoais: MesPessoalEntry[]     // 12 próximos meses
  proximos10Anos: AnoPessoalEntry[]    // 10 anos a partir do ciclo atual

  // Triângulo da Vida (novos)
  trianguloDaVida: TrianguloDaVida | null
  arcanoAtual:     ArcanoAtual | null
}
```

## Interfaces auxiliares (todas exportadas)

```typescript
interface Desafios {
  desafio1: number; desafio2: number; desafioPrincipal: number
}

interface CicloDeVida {
  inicio: number; fim: number; regente: number
}

interface MomentosDecisivos {
  momento1: number; momento2: number; momento3: number; momento4: number
}

interface HarmoniaConjugal {
  vibra: number[]; atrai: number[]; oposto: number[]; passivo: number[]
}

interface AnoPessoalEntry {
  numero: number; periodo: string   // "DD/MM/AAAA a DD/MM/AAAA"
}

interface MesPessoalEntry {
  nome: string; numero: number; mes: number; ano: number
}

interface TrianguloDaVida {
  arcanos: number[]
  arcanoRegente: number | null
  sequenciaCompleta: number[]
}

interface ArcanoAtual {
  numero: number | null
  periodo: string
  idadeInicio: number
  idadeFim: number
}
```

## HARMONIA_TABLE

Tabela fixa de compatibilidade conjugal por número de missão:

```typescript
const HARMONIA_TABLE: Record<number, HarmoniaConjugal> = {
  1: { vibra:[9],     atrai:[4,8],     oposto:[6,7],   passivo:[2,3,5]   },
  2: { vibra:[8],     atrai:[7,9],     oposto:[5],     passivo:[1,3,4,6] },
  3: { vibra:[7],     atrai:[5,6,9],   oposto:[4,8],   passivo:[1,2]     },
  4: { vibra:[6],     atrai:[1,8],     oposto:[3,5],   passivo:[2,7,9]   },
  5: { vibra:[5],     atrai:[3,9],     oposto:[2,4,6], passivo:[1,7,8]   },
  6: { vibra:[4],     atrai:[3,7,9],   oposto:[1,5,8], passivo:[2]       },
  7: { vibra:[3],     atrai:[2,6],     oposto:[1,9],   passivo:[4,5,8]   },
  8: { vibra:[2],     atrai:[1,4],     oposto:[3,6],   passivo:[5,7,9]   },
  9: { vibra:[1],     atrai:[2,3,5,6], oposto:[],      passivo:[4,8]     },
}
```

## Funções privadas de cálculo (11 novas)

| Função | Retorno | Algoritmo |
|--------|---------|-----------|
| `calcMomentosDecisivos(dob)` | `MomentosDecisivos \| null` | n=reduce(day), m=reduce(month), a=reduce(year); m1=m+n, m2=n+a, m3=m1+m2, m4=m+a |
| `calcHarmoniaConjugal(missao)` | `HarmoniaConjugal \| null` | Lookup em HARMONIA_TABLE pela missão |
| `calcTendenciasOcultas(nome)` | `number[]` | Conta valores Caldaicos reduzidos; retorna os com count ≥ 3 |
| `calcRespostaSubconsciente(nome)` | `number` | `9 − calcLicoesCarmicas(nome).length` |
| `calcDiasFavoraveis(dob)` | `number[]` | psychic=reduce(day); seed={psychic, psychic+1}; acumula psychic ao último ≤ 31 |
| `calcNumerosHarmonicos(missao)` | `number[]` | Union de HARMONIA_TABLE[missao].vibra + .atrai |
| `calcDiaPessoal(dob)` | `number \| null` | anoPessoal → mesPessoal → reduce(mesPessoal + reduce(hoje.getDate())) |
| `calcMesesPessoais(dob)` | `MesPessoalEntry[]` | 12 próximos meses; each: reduce(anoPessoal + monthNum) |
| `calcProximos10AnosPessoais(dob)` | `AnoPessoalEntry[]` | 10 anos a partir do aniversário corrente; formato "DD/MM/AAAA a DD/MM/AAAA" |
| `calcTrianguloDaVida(nome)` | `TrianguloDaVida \| null` | pares adjacentes de valores de letras como `parseInt(\`${a}${b}\`)`; reduce pairwise até restar 1 |
| `calcArcanoAtual(dob, sequencia)` | `ArcanoAtual \| null` | duracaoCiclo = 90 / seq.length; indice = floor(idade / ciclo) |

### Notas de implementação

- **`calcDiasFavoraveis`**: A fonte n8n original hardcoda `[5,6,12,17,23,28]`. A implementação correta usa o psychic como seed, iniciando com `{psychic, psychic+1}` e somando psychic ao último valor real do calendário até exceder 31.
- **`calcNumerosHarmonicos`**: A fonte n8n original também hardcodava. A implementação correta deriva os valores diretamente de `HARMONIA_TABLE[missao]`.
- **`calcTrianguloDaVida` com nomes longos**: `parseInt(\`${a}${b}\`)` produz arcanos 11–88. O ciclo de duração é fração de 90. Usa `Math.floor` e cap no índice máximo da sequência.

## Formulas dos 8 números primários

| Número | Fórmula |
|--------|---------|
| Destino | `reduce(dia + mês + ano)` — inteiros, não dígito a dígito |
| Expressão | Soma de todos os valores Caldaicos; regra especial se resultado = 2 ou 4 |
| Motivação | Soma das vogais |
| Impressão | Soma das consoantes |
| Missão | `reduce(expressão + destino)` |
| Talento Oculto | `reduce(motivação + expressão)` |
| Psíquico | `reduce(dia)` |
| Ano Pessoal | `reduce(dia + mês + anoDoUltimoAniversario)` |

## Débitos e Lições Cármicas

- **Débitos cármicos**: valores especiais ausentes: 13→4, 14→5, 16→7, 19→1 (verificados no dia de nascimento e nos números calculados)
- **Lições cármicas**: valores Caldaicos 1–9 completamente ausentes no nome

## Ciclos de Vida — fórmula

```
ciclo1.regente = reduce(mês_nascimento)
ciclo2.regente = reduce(dia_nascimento)
ciclo3.regente = reduce(ano_nascimento)
ciclo1.fim     = 36 - destino   (primeiro ciclo termina quando soma com destino = 36)
ciclo2.inicio  = ciclo1.fim + 1
ciclo2.fim     = ciclo1.fim + 27
ciclo3.inicio  = ciclo2.fim + 1
```

## Ano Pessoal — fórmula

Usa a data do **último aniversário** (não simplesmente DD/MM + ano atual).
Se ainda não fez aniversário no ano corrente, usa `anoAtual - 1`.
