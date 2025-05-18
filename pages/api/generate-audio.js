import { synthesizeSpeech } from '../../lib/googleTTS'; // Ajuste o caminho se o seu ficheiro lib/googleTTS.js estiver noutro local

// Configuração para aumentar o limite do tamanho da resposta da API
export const config = {
  api: {
    responseLimit: '60mb', // Mantido alto para acomodar ficheiros grandes
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log('/api/generate-audio: Método não permitido:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('/api/generate-audio: Recebido pedido POST para gerar áudio MP3 (qualidade padrão).');

  try {
    const { text, voiceConfig: clientVoiceConfig } = req.body;

    if (!text) {
      console.warn('/api/generate-audio: Texto para síntese não fornecido.');
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }
    if (!clientVoiceConfig || !clientVoiceConfig.voice) {
      console.warn('/api/generate-audio: Configuração de voz (do cliente) inválida.');
      return res.status(400).json({ error: 'Voice configuration (voice name) is required.' });
    }

    // Define as configurações de áudio desejadas no servidor: MP3
    // Não especificamos sampleRateHertz aqui para usar o padrão da API (geralmente 24000Hz para MP3),
    // ou 24000Hz que será forçado para vozes Studio em lib/googleTTS.js.
    const serverAudioSettings = { 
      audioEncoding: 'MP3',
      // sampleRateHertz: undefined // Deixando indefinido para usar o padrão da API
    }; 

    // Mescla as configurações do cliente com as configurações de áudio definidas no servidor
    const finalVoiceConfig = {
      ...clientVoiceConfig, // Contém voice, speed, pitch vindos do cliente
      ...serverAudioSettings // Adiciona/sobrescreve audioEncoding
    };

    console.log('/api/generate-audio: Configuração final da voz ANTES de chamar synthesizeSpeech:', JSON.stringify(finalVoiceConfig, null, 2));
    
    const audioBuffer = await synthesizeSpeech(text, finalVoiceConfig);

    if (!audioBuffer || audioBuffer.length === 0) {
      console.error('/api/generate-audio: Buffer de áudio gerado está vazio ou nulo.');
      return res.status(500).json({ error: 'Failed to generate audio content (empty buffer).' });
    }

    console.log(`/api/generate-audio: Síntese de voz concluída. Tamanho do buffer: ${audioBuffer.length} bytes. Encoding: ${finalVoiceConfig.audioEncoding}.`);

    // Configurações para MP3
    const contentType = 'audio/mpeg';
    const filename = 'audio_gerado.mp3'; // Nome do ficheiro para download
    console.log(`/api/generate-audio: Configurando Content-Type para ${contentType} e filename para ${filename}`);
    
    res.setHeader('Content-Type', contentType);
    // Se o objetivo principal for um player online, a linha Content-Disposition pode ser comentada.
    // Se for para download direto, mantenha ou ajuste o nome do ficheiro.
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`); 
    
    res.status(200).send(audioBuffer);
    console.log(`/api/generate-audio: Resposta de áudio (${filename}) enviada com sucesso.`);

  } catch (error) {
    console.error('/api/generate-audio: Erro ao gerar áudio:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    res.status(500).json({ 
      error: 'Failed to generate audio', 
      details: error.message 
    });
  }
}
