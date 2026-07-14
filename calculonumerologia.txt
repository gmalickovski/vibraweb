// lib/numerologia.js

// Tabela de conversão incluindo acentos e símbolos
const tabelaConversao = {
  'A': 1, 'I': 1, 'Q': 1, 'J': 1, 'Y': 1,
  'B': 2, 'K': 2, 'R': 2,
  'C': 3, 'G': 3, 'L': 3, 'S': 3,
  'D': 4, 'M': 4, 'T': 4, 'X': 4,
  'E': 5, 'H': 5, 'N': 5,
  'U': 6, 'V': 6, 'W': 6,
  'O': 7, 'Z': 7,
  'F': 8, 'P': 8
};

/* =========================
   Parte 01 – Funções baseadas no nome
   ========================= */

// Calcula o valor numérico de uma letra, tratando acentos e diacríticos
function calcularValor(letra) {
  const decomposed = letra.normalize('NFD');
  const letraBase = decomposed.charAt(0).toUpperCase();
  let base = tabelaConversao[letraBase] || 0;
  // Verifica diacríticos:
  // Acento agudo (U+0301): soma 2
  // Acento til (U+0303): soma 3
  // Acento grave (U+0300): multiplica por 3
  // Acento circunflexo (U+0302): sem alteração
  if (decomposed.length > 1) {
    const diacritico = decomposed.charAt(1);
    switch (diacritico) {
      case '́':
        base += 2;
        break;
      case '̃':
        base += 3;
        break;
      case '̀':
        base *= 3;
        break;
    }
  }
  // Valor fixo para cedilha
  if (letraBase === 'Ç') {
    base = 6;
  }
  return base;
}

// Reduz um número à soma de seus dígitos (exceto se permitir mestres: 11 ou 22)
function reduzirNumero(numero, permitirMestres = false) {
  while (numero > 9 && !(permitirMestres && (numero === 11 || numero === 22))) {
    numero = String(numero)
      .split('')
      .reduce((acc, digito) => acc + parseInt(digito, 10), 0);
  }
  return numero;
}

// Calcula o Número de Expressão: soma de todas as letras do nome.
// Se o resultado for 2 ou 4, refaz o cálculo palavra-a-palavra.
function calcularNumeroExpressao(texto) {
  const somaGeral = texto.replace(/\s+/g, '').split('')
    .reduce((acc, letra) => acc + calcularValor(letra), 0);
  let expressao = reduzirNumero(somaGeral);
  if (expressao === 2 || expressao === 4) {
    const palavras = texto.split(/\s+/);
    const somaSeparada = palavras.reduce((total, palavra) => {
      const somaPalavra = palavra.split('')
        .reduce((acc, letra) => acc + calcularValor(letra), 0);
      return total + reduzirNumero(somaPalavra);
    }, 0);
    expressao = reduzirNumero(somaSeparada);
  }
  return expressao;
}

// Calcula o Número de Motivação: soma dos valores das vogais
function calcularNumeroMotivacao(texto) {
  const vogais = 'AEIOUY';
  let somaVogais = 0;
  for (let letra of texto) {
    const char = letra.normalize('NFD').charAt(0).toUpperCase();
    if (vogais.includes(char)) {
      somaVogais += calcularValor(letra);
    }
  }
  return reduzirNumero(somaVogais);
}

// Calcula o Número de Impressão: soma dos valores das consoantes
function calcularNumeroImpressao(texto) {
  const consoantes = 'BCDFGHJKLMNPQRSTVWXYZÇ';
  let somaConsoantes = 0;
  for (let letra of texto) {
    const char = letra.normalize('NFD').charAt(0).toUpperCase();
    if (consoantes.includes(char)) {
      somaConsoantes += calcularValor(letra);
    }
  }
  return reduzirNumero(somaConsoantes);
}

// Retorna um texto de apoio para um determinado tipo (mantido para referência)
function obterTextoResultado(tipo, numero) {
  const textos = {
    expressao: {
      1: "Texto para Expressão 1...",
      2: "Texto para Expressão 2...",
      3: "Texto para Expressão 3...",
      4: "Texto para Expressão 4...",
      5: "Texto para Expressão 5...",
      6: "Texto para Expressão 6...",
      7: "Texto para Expressão 7...",
      8: "Texto para Expressão 8...",
      9: "Texto para Expressão 9..."
    },
    motivacao: {
      1: "Texto para Motivação 1...",
      2: "Texto para Motivação 2...",
      3: "Texto para Motivação 3...",
      4: "Texto para Motivação 4...",
      5: "Texto para Motivação 5...",
      6: "Texto para Motivação 6...",
      7: "Texto para Motivação 7...",
      8: "Texto para Motivação 8...",
      9: "Texto para Motivação 9..."
    },
    impressao: {
      1: "Texto para Impressão 1...",
      2: "Texto para Impressão 2...",
      3: "Texto para Impressão 3...",
      4: "Texto para Impressão 4...",
      5: "Texto para Impressão 5...",
      6: "Texto para Impressão 6...",
      7: "Texto para Impressão 7...",
      8: "Texto para Impressão 8...",
      9: "Texto para Impressão 9..."
    }
  };
  return (textos[tipo] && textos[tipo][numero]) || "Texto não definido para este número.";
}

/* =========================
   Parte 02 – Funções baseadas na data de nascimento
   ========================= */

function calcularNumeroDestino(dataNascimento) {
  const [dia, mes, ano] = dataNascimento.split('/').map(Number);
  const somaData = dia + mes + ano;
  return reduzirNumero(somaData, true);
}

function calcularMissao(expressao, destino) {
  const soma = expressao + destino;
  return reduzirNumero(soma, true);
}

function calcularTalentoOculto(motivacao, expressao) {
  return reduzirNumero(motivacao + expressao);
}

function calcularDiaNatalicio(dataNascimento) {
  return parseInt(dataNascimento.split('/')[0], 10);
}

function calcularNumeroPsiquico(dataNascimento) {
  const dia = parseInt(dataNascimento.split('/')[0], 10);
  return reduzirNumero(dia);
}

function calcularCiclosDeVida(dataNascimento, destino) {
  const partes = dataNascimento.split('/');
  if (partes.length < 3) {
    console.error("Formato de data inválido:", dataNascimento);
    return { ciclos: [] };
  }
  const [dia, mes, ano] = partes.map(Number);
  const fimCiclo1 = ano + (37 - destino);
  const regenteCiclo1 = reduzirNumero(mes);
  const inicioCiclo2 = fimCiclo1;
  const fimCiclo2 = inicioCiclo2 + 27;
  const regenteCiclo2 = reduzirNumero(dia, true);
  const inicioCiclo3 = fimCiclo2;
  const regenteCiclo3 = reduzirNumero(ano, true);
  const ciclos = [
    { inicio: `${ano}`, fim: fimCiclo1, regente: regenteCiclo1 },
    { inicio: inicioCiclo2, fim: fimCiclo2, regente: regenteCiclo2 },
    { inicio: inicioCiclo3, fim: 'resto da vida', regente: regenteCiclo3 }
  ];
  console.log("Ciclos de Vida para", dataNascimento, ":", ciclos);
  return { ciclos };
}

function calcularNumeroDoAmor(expressao, destino) {
  const soma = expressao + destino;
  return reduzirNumero(soma);
}

/* =========================
   Parte 03 – Interpretação e Aptidões
   ========================= */

// Agora a função retorna também o número (valor) que é interpretado
function interpretarHarmoniaConjugal(numeroDoAmor) {
  const tabelaHarmonia = {
    1: { vibra: [9], atrai: [4, 8], oposto: [6, 7], passivo: [2, 3, 5] },
    2: { vibra: [8], atrai: [7, 9], oposto: [5], passivo: [1, 3, 4, 6] },
    3: { vibra: [7], atrai: [5, 6, 9], oposto: [4, 8], passivo: [1, 2] },
    4: { vibra: [6], atrai: [1, 8], oposto: [3, 5], passivo: [2, 7, 9] },
    5: { vibra: [5], atrai: [3, 9], oposto: [2, 4, 6], passivo: [1, 7, 8] },
    6: { vibra: [4], atrai: [3, 7, 9], oposto: [1, 5, 8], passivo: [2] },
    7: { vibra: [3], atrai: [2, 6], oposto: [1, 9], passivo: [4, 5, 8] },
    8: { vibra: [2], atrai: [1, 4], oposto: [3, 6], passivo: [5, 7, 9] },
    9: { vibra: [1], atrai: [2, 3, 5, 6], passivo: [4, 8] }
  };
  const interpretacao = tabelaHarmonia[numeroDoAmor];
  return interpretacao ? { numero: numeroDoAmor, ...interpretacao } : null;
}

// Alterado: Retorna apenas o valor numérico.
function calcularAptidoesProfissionais(expressao) {
  return expressao;
}

/* =========================
   Novos Itens
   ========================= */

function calcularDebitosCarmicos(dataNascimento, destino, motivacao, expressao) {
  const dia = parseInt(dataNascimento.split('/')[0], 10);
  const debitos = [];
  if ([13, 14, 16, 19].includes(dia)) {
    debitos.push(dia);
  }
  const mapa = { 4: 13, 5: 14, 7: 16, 1: 19 };
  [destino, motivacao, expressao].forEach(num => {
    if (mapa[num]) {
      debitos.push(mapa[num]);
    }
  });
  return [...new Set(debitos)];
}

function calcularDesafios(dataNascimento) {
  const [diaStr, mesStr, anoStr] = dataNascimento.split('/');
  const dia = parseInt(diaStr, 10);
  const mes = parseInt(mesStr, 10);
  const ano = parseInt(anoStr, 10);
  const redDia = reduzirNumero(dia);
  const redMes = reduzirNumero(mes);
  const desafio1 = Math.abs(redDia - redMes);
  const redAno = reduzirNumero(ano);
  const desafio2 = Math.abs(redAno - redDia);
  const desafioPrincipal = Math.abs(desafio1 - desafio2);
  return { desafio1, desafio2, desafioPrincipal };
}

function calcularLicoesCarmicas(nome) {
  const presentes = new Set();
  for (const char of nome) {
    const letra = char.toUpperCase();
    if (/[A-ZÀ-Ÿ]/.test(letra)) {
      presentes.add(calcularValor(letra));
    }
  }
  const licoes = [];
  for (let i = 1; i <= 9; i++) {
    if (!presentes.has(i)) {
      licoes.push(i);
    }
  }
  return licoes;
}

function calcularRespostaSubconsciente(nome) {
  const licoes = calcularLicoesCarmicas(nome);
  return 9 - licoes.length;
}

function calcularTendenciasOcultas(nome) {
  const freq = {};
  for (const char of nome) {
    const letra = char.toUpperCase();
    if (/[A-ZÀ-Ÿ]/.test(letra)) {
      const valor = calcularValor(letra);
      freq[valor] = (freq[valor] || 0) + 1;
    }
  }
  const tendencias = [];
  for (let i = 1; i <= 9; i++) {
    if (freq[i] >= 4) {
      tendencias.push(i);
    }
  }
  return tendencias;
}

/* =========================
   Parte 09 – Dias Favoráveis do Mês
   ========================= */

// Tabela de Dias Básicos – atualizada para incluir o caso do mês 05 e dia 31
const tabelaDiasBasicos = {
  "01": { "14": [5, 6] },
  "05": { "31": [1, 5] },
  "11": { "02": [1, 7] }
};

function obterDiasBasicos(dataNascimento) {
  let [dia, mes] = dataNascimento.split('/');
  dia = dia.padStart(2, '0');
  mes = mes.padStart(2, '0');
  if (tabelaDiasBasicos[mes] && tabelaDiasBasicos[mes][dia]) {
    console.log(`Dias Básicos para ${dataNascimento}:`, tabelaDiasBasicos[mes][dia]);
    return tabelaDiasBasicos[mes][dia];
  }
  console.log("Nenhum dia básico encontrado para", dataNascimento);
  return [1, 2];
}

// Calcula os Dias Favoráveis do Mês seguindo a fórmula descrita no PDF
function calcularDiasFavoraveis(dataNascimento) {
  let [dia, mes] = dataNascimento.split('/');
  const diaNorm = dia.padStart(2, '0');
  const mesNorm = mes.padStart(2, '0');
  let basicos = [];
  if (tabelaDiasBasicos[mesNorm] && tabelaDiasBasicos[mesNorm][diaNorm]) {
    basicos = tabelaDiasBasicos[mesNorm][diaNorm];
  } else {
    basicos = [1, 2];
  }
  const [b1, b2] = basicos;
  const lista = [b1, b2];
  let r = b2 * 2;
  if (r <= 31 && !lista.includes(r)) {
    lista.push(r);
  }
  let ultimo = r;
  let alternador = 0;
  while (true) {
    const adicao = alternador === 0 ? b1 : b2;
    const novo = ultimo + adicao;
    if (novo > 31) break;
    lista.push(novo);
    ultimo = novo;
    alternador = 1 - alternador;
  }
  const unicos = Array.from(new Set(lista)).sort((a, b) => a - b);
  return unicos.join(',');
}

/* =========================
   Parte 10 – Momentos Decisivos
   ========================= */

function calcularMomentosDecisivos(dataNascimento) {
  const [diaStr, mesStr, anoStr] = dataNascimento.split('/');
  const somaDia = diaStr.split('').reduce((s, d) => s + parseInt(d, 10), 0);
  const somaMes = mesStr.split('').reduce((s, d) => s + parseInt(d, 10), 0);
  const somaAno = anoStr.split('').reduce((s, d) => s + parseInt(d, 10), 0);
  const momento1 = reduzirNumero(somaDia + somaMes);
  const momento2 = reduzirNumero(somaDia + somaAno);
  const momento3 = reduzirNumero(momento1 + momento2);
  const momento4 = reduzirNumero(somaMes + somaAno);
  return { momento1, momento2, momento3, momento4 };
}

/* =========================
   Parte 11 – Ano Pessoal (Atualizado)
   ========================= */

function calcularAnoPessoal(dataNascimento) {
  const [diaNas, mesNas, anoNas] = dataNascimento.split('/').map(Number);
  const hoje = new Date();
  const aniversarioEsteAno = new Date(hoje.getFullYear(), mesNas - 1, diaNas);
  let ultimoAniversario;
  if (hoje >= aniversarioEsteAno) {
    ultimoAniversario = aniversarioEsteAno;
  } else {
    ultimoAniversario = new Date(hoje.getFullYear() - 1, mesNas - 1, diaNas);
  }
  const diaUA = ultimoAniversario.getDate();
  const mesUA = ultimoAniversario.getMonth() + 1;
  const anoUA = ultimoAniversario.getFullYear();
  const soma = diaUA + mesUA + anoUA;
  console.log("Ano Pessoal: Último aniversário:", `${diaUA}/${mesUA}/${anoUA}`, "Soma =", soma);
  return reduzirNumero(soma);
}

/* =========================
   Cores Favoráveis pelo Dia Natalício reduzido
   ========================= */

function calcularCoresFavoraveisPorDiaNatalicio(dataNascimento) {
  // Reduz o dia natalício a um dígito
  const dia = parseInt(dataNascimento.split('/')[0], 10);
  return reduzirNumero(dia) || 0; // Garante sempre número
}

/* =========================
   Exportação Completa
   ========================= */

module.exports = {
  // Parte 01
  calcularValor,
  reduzirNumero,
  calcularNumeroExpressao,
  calcularNumeroMotivacao,
  calcularNumeroImpressao,
  obterTextoResultado,
  // Parte 02
  calcularNumeroDestino,
  calcularMissao,
  calcularTalentoOculto,
  calcularDiaNatalicio,
  calcularNumeroPsiquico,
  calcularCiclosDeVida,
  calcularNumeroDoAmor,
  // Parte 03
  interpretarHarmoniaConjugal,
  calcularAptidoesProfissionais,
  // Novos Itens
  calcularDebitosCarmicos,
  calcularDesafios,
  calcularLicoesCarmicas,
  calcularRespostaSubconsciente,
  calcularTendenciasOcultas,
  // Parte 09 – Dias Favoráveis
  obterDiasBasicos,
  calcularDiasFavoraveis,
  // Parte 10 – Momentos Decisivos
  calcularMomentosDecisivos,
  // Parte 11 – Ano Pessoal (Atualizado)
  calcularAnoPessoal,
  calcularCoresFavoraveisPorDiaNatalicio
};