export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { resultados, nome, dataNascimento } = req.body;
    let text = `Análise de Propósito para ${nome}, nascido em ${dataNascimento}.\n\n`;

    // Função auxiliar para formatar seções
    const addSection = (title, content) => {
      if (content) {
        text += `${title}:\n${content}\n\n`;
      }
    };

    // Adiciona números principais
    addSection('Números Principais', [
      `Expressão: ${resultados.numeroExpressao}`,
      `Motivação: ${resultados.numeroMotivacao}`,
      `Impressão: ${resultados.numeroImpressao}`,
      `Destino: ${resultados.numeroDestino}`,
      `Missão: ${resultados.missao}`
    ].join('\n'));

    // Adiciona outros aspectos
    if (resultados.debitosCarmicos?.length) {
      addSection('Débitos Cármicos', resultados.debitosCarmicos.join(', '));
    }

    if (resultados.licoesCarmicas?.length) {
      addSection('Lições Cármicas', resultados.licoesCarmicas.join(', '));
    }

    // Continua adicionando outras seções...

    res.status(200).json({ text });
  } catch (error) {
    console.error('Erro ao gerar texto:', error);
    res.status(500).json({ error: 'Erro ao gerar texto' });
  }
}
