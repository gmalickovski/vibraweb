// pages/api/calcular.js
import * as numerologia from '../../lib/numerologia';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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
    const aptidoesProfissionais = String(numeroExpressao); // Converting to string to match Notion validation
    const debitosCarmicos = numerologia.calcularDebitosCarmicos(dataNascimento, numeroDestino, numeroMotivacao, numeroExpressao);
    const desafios = numerologia.calcularDesafios(dataNascimento);
    const licoesCarmicas = numerologia.calcularLicoesCarmicas(nome);
    const respostaSubconsciente = numerologia.calcularRespostaSubconsciente(nome);
    const tendenciasOcultas = numerologia.calcularTendenciasOcultas(nome);
    
    // Cores Favoráveis (Dia Natalício reduzido)
    const coresFavoraveis = Number(numerologia.calcularCoresFavoraveisPorDiaNatalicio(dataNascimento)) || 0;

    // Partes finais – Dias Favoráveis, Dias Básicos, Momentos Decisivos, Ano Pessoal
    const diasFavoraveis = numerologia.calcularDiasFavoraveis(dataNascimento);
    const diasBasicos = numerologia.obterDiasBasicos(dataNascimento);
    const momentosDecisivos = numerologia.calcularMomentosDecisivos(dataNascimento);
    const anoPessoal = numerologia.calcularAnoPessoal(dataNascimento);
    
    // Monte o objeto de resposta incluindo coresFavoraveis:
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
      anoPessoal,
      coresFavoraveis, // já será número
    });
  } catch (error) {
    console.error('Erro ao calcular:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}