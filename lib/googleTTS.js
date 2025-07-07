import textToSpeech from '@google-cloud/text-to-speech';
import path from 'path';

// Inicializa o cliente fora da função para reutilização
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(process.cwd(), 'config', 'chave.json')
});

/**
 * Sintetiza um texto longo em áudio, dividindo-o em partes menores para a API do Google.
 * @param {string} text O texto completo a ser sintetizado.
 * @param {object} voiceConfig A configuração da voz (ex: { voice: 'pt-BR-Wavenet-C', speed: 1.0, pitch: 0 }).
 * @returns {Promise<Buffer>} Um buffer contendo o áudio MP3 completo.
 */
export async function synthesizeSpeech(text, voiceConfig) {
  console.log('--- Iniciando synthesizeSpeech em lib/googleTTS.js ---');
  
  if (!text || !voiceConfig?.voice) {
    console.error('synthesizeSpeech: Parâmetros inválidos.', { text: !!text, voiceConfig });
    throw new Error('Texto ou nome da voz (voiceConfig.voice) inválido para síntese.');
  }
  
  // Limpeza e normalização do texto
  const cleanText = text.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!cleanText) {
    console.warn('synthesizeSpeech: O texto fornecido está vazio após a limpeza. Retornando buffer vazio.');
    return Buffer.from([]);
  }

  // Divide o texto em pedaços (chunks) para não exceder o limite da API
  const maxChunkSize = 4500; // Limite seguro de caracteres por requisição
  const chunks = [];
  let currentChunk = '';
  const sentences = cleanText.match(/[^.!?]+[.!?]+|\S+/g) || [];

  for (const sentence of sentences) {
    if ((currentChunk.length + sentence.length) > maxChunkSize) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 0) {
    console.warn('synthesizeSpeech: Nenhum chunk de texto foi gerado.');
    return Buffer.from([]);
  }

  try {
    const audioBuffers = [];
    console.log(`synthesizeSpeech: Processando ${chunks.length} chunks de texto.`);

    for (const [index, chunk] of chunks.entries()) {
      if (!chunk) continue;

      const request = {
        input: { text: chunk },
        voice: {
          languageCode: 'pt-BR',
          name: voiceConfig.voice,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: voiceConfig.speed || 1.0,
          pitch: voiceConfig.pitch || 0,
          // Lógica para otimizar a qualidade do áudio com base no tipo de voz
          effectsProfileId: voiceConfig.voice.toLowerCase().includes('neural2')
            ? ['large-home-entertainment-class-device']
            : ['headphone-class-device'],
        },
      };

      console.log(`Enviando chunk ${index + 1}/${chunks.length} para a API do Google...`);
      const [response] = await client.synthesizeSpeech(request);
      audioBuffers.push(response.audioContent);
    }

    if (audioBuffers.length === 0) {
      console.warn('synthesizeSpeech: Nenhum buffer de áudio foi gerado.');
      return Buffer.from([]);
    }

    console.log('synthesizeSpeech: Concatenação de todos os buffers de áudio finalizada.');
    return Buffer.concat(audioBuffers);

  } catch (error) {
    console.error('Erro durante a chamada para a API do Google em synthesizeSpeech:', error);
    throw new Error(`Falha na API do Google TTS: ${error.message}`);
  }
}
