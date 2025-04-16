// pages/api/calcular.js
import * as numerologia from '../../lib/numerologia';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Método ${req.method} não permitido`);
  }
  
  const { nome, dataNascimento } = req.body;
  console.log("Nome recebido:", nome);
  console.log("Data de Nascimento recebida:", dataNascimento);
  
  // Parte 01 – Cálculos baseados no nome
  const numeroExpressao = numerologia.calcularNumeroExpressao(nome);
  const numeroMotivacao = numerologia.calcularNumeroMotivacao(nome);
  const numeroImpressao = numerologia.calcularNumeroImpressao(nome);
  
  // Parte 02 – Cálculos usando a data de nascimento
  const numeroDestino = numerologia.calcularNumeroDestino(dataNascimento);
  const missao = numerologia.calcularMissao(numeroExpressao, numeroDestino);
  const talentoOculto = numerologia.calcularTalentoOculto(numeroMotivacao, numeroExpressao);
  const diaNatalicio = numerologia.calcularDiaNatalicio(dataNascimento);
  const numeroPsiquico = numerologia.calcularNumeroPsiquico(dataNascimento);
  const ciclosDeVida = numerologia.calcularCiclosDeVida(dataNascimento, numeroDestino);
  
  // Parte 03 e Novos Itens
  const numeroDoAmor = numerologia.calcularNumeroDoAmor(numeroExpressao, numeroDestino);
  const harmoniaConjugal = numerologia.interpretarHarmoniaConjugal(numeroDoAmor);
  const aptidoesProfissionais = numerologia.calcularAptidoesProfissionais(numeroExpressao);
  const debitosCarmicos = numerologia.calcularDebitosCarmicos(dataNascimento, numeroDestino, numeroMotivacao, numeroExpressao);
  const desafios = numerologia.calcularDesafios(dataNascimento);
  const licoesCarmicas = numerologia.calcularLicoesCarmicas(nome);
  const respostaSubconsciente = numerologia.calcularRespostaSubconsciente(nome);
  const tendenciasOcultas = numerologia.calcularTendenciasOcultas(nome);
  
  // Partes finais – Dias Favoráveis, Dias Básicos, Momentos Decisivos, Ano Pessoal
  const diasFavoraveis = numerologia.calcularDiasFavoraveis(dataNascimento);
  const diasBasicos = numerologia.obterDiasBasicos(dataNascimento);
  const momentosDecisivos = numerologia.calcularMomentosDecisivos(dataNascimento);
  const anoPessoal = numerologia.calcularAnoPessoal(dataNascimento);
  
  res.status(200).json({
    numeroExpressao,
    numeroMotivacao,
    numeroImpressao,
    numeroDestino,
    missao,
    talentoOculto,
    diaNatalicio,
    numeroPsiquico,
    ciclosDeVida,
    numeroDoAmor,
    harmoniaConjugal,
    aptidoesProfissionais,
    debitosCarmicos,
    desafios,
    licoesCarmicas,
    respostaSubconsciente,
    tendenciasOcultas,
    diasFavoraveis,
    diasBasicos,
    momentosDecisivos,
    anoPessoal
  });
}