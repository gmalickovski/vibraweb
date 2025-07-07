import { synthesizeSpeech } from '../../lib/googleTTS';

// Configuração para aumentar o limite do tamanho da resposta da API
export const config = {
  api: {
    responseLimit: '60mb', // Mantido alto para acomodar ficheiros grandes
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Recebe 'text' e 'voiceConfig' do corpo da requisição
    const { text, voiceConfig } = req.body;

    // 2. Valida se os dados necessários foram recebidos
    if (!text || !voiceConfig?.voice) {
      console.error('API Route: Parâmetros "text" ou "voiceConfig.voice" ausentes no corpo da requisição.');
      return res.status(400).json({ error: 'Parâmetros "text" e "voiceConfig.voice" são obrigatórios.' });
    }

    // 3. CHAMA A FUNÇÃO CORRETAMENTE com dois argumentos
    //    Não montamos mais o objeto 'request' aqui. Apenas passamos os dados.
    console.log('API Route: Chamando synthesizeSpeech com os parâmetros corretos...');
    const audioContent = await synthesizeSpeech(text, voiceConfig);

    // 4. Verifica se o áudio foi gerado antes de enviar
    if (!audioContent || audioContent.length === 0) {
        console.error('API Route: synthesizeSpeech retornou conteúdo de áudio vazio ou nulo.');
        return res.status(500).json({ error: 'Falha ao gerar o áudio. Nenhum conteúdo foi retornado pela função de síntese.' });
    }

    // 5. Envia o áudio como resposta
    console.log(`API Route: Enviando áudio de ${audioContent.length} bytes para o cliente.`);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
    res.send(audioContent);

  } catch (error) {
    // Captura qualquer erro que a função synthesizeSpeech possa lançar
    console.error('Erro pego na rota da API /api/generate-audio:', error);
    res.status(500).json({
      error: 'Falha ao gerar o áudio.',
      details: error.message, // A mensagem de erro vinda de synthesizeSpeech será mostrada aqui
    });
  }
}
