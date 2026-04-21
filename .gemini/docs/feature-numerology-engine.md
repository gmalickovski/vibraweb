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
  destino:       number | null    // dia + mês + ano (inteiros)
  expressao:     number | null    // todas as letras (regra 2/4)
  motivacao:     number | null    // vogais
  impressao:     number | null    // consoantes
  missao:        number | null    // expressao + destino
  talentoOculto: number | null    // motivacao + expressao
  psiquico:      number | null    // redução do dia de nascimento
  anoPessoal:    number | null    // dia + mês + ano do último aniversário
  debitosCarmicos: number[]       // baseado em dia e números calculados
  desafios:      Desafios | null  // { desafio1, desafio2, desafioPrincipal }
  licoesCarmicas: number[]        // valores Caldaicos ausentes no nome
  ciclosDeVida:  CicloDeVida[]    // 3 ciclos com início, fim e regente
}
```

## Destino — fórmula

`destino = reduce(dia + mês + ano)` onde dia, mês e ano são inteiros (não dígito a dígito).

## Ano Pessoal — fórmula

Usa a data do **último aniversário** (não simplesmente DD/MM + ano atual).
