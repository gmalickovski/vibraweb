import textToSpeech from '@google-cloud/text-to-speech';
import path from 'path';

// O cliente é inicializado fora da função para ser reutilizado entre chamadas.
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(process.cwd(), 'config', 'chave.json')
});

/**
 * Sintetiza um texto longo em áudio, dividindo-o em partes menores e processando-as em paralelo.
 * @param {string} text O texto completo a ser sintetizado.
 * @param {object} voiceConfig A configuração da voz (ex: { voice: 'pt-BR-Wavenet-C', speed: 1.0, pitch: 0 }).
 * @returns {Promise<Buffer>} Um buffer contendo o áudio MP3 completo.
 */
export async function synthesizeSpeech(text, voiceConfig) {
  console.log('--- Iniciando synthesizeSpeech em lib/googleTTS.js (Versão Otimizada) ---');
  
  if (!text || !voiceConfig?.voice) {
    console.error('synthesizeSpeech: Parâmetros inválidos.', { text: !!text, voiceConfig });
    throw new Error('Texto ou nome da voz (voiceConfig.voice) inválido para síntese.');
  }
  
  // Limpa e normaliza o texto para evitar caracteres inválidos.
  const cleanText = text.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!cleanText) {
    console.warn('synthesizeSpeech: O texto fornecido está vazio após a limpeza.');
    return Buffer.from([]);
  }

  // Lógica para dividir o texto em pedaços (chunks) que não excedam o limite da API.
  const maxChunkSize = 4500; // Limite de segurança de caracteres por requisição.
  const chunks = [];
  let currentChunk = '';
  // Divide o texto por frases para evitar cortes abruptos no áudio.
  const sentences = cleanText.match(/[^.!?]+[.!?]+|\S+/g) || [];

  for (const sentence of sentences) {
    if ((currentChunk.length + sentence.length) > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length === 0) {
    console.warn('synthesizeSpeech: Nenhum chunk de texto foi gerado.');
    return Buffer.from([]);
  }

  console.log(`synthesizeSpeech: Texto dividido em ${chunks.length} chunks. Iniciando processamento em paralelo...`);

  try {
    // Cria um array de promessas, onde cada promessa é uma chamada à API do Google para um chunk.
    const promises = chunks.map((chunk, index) => {
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
          effectsProfileId: voiceConfig.voice.toLowerCase().includes('neural2')
            ? ['large-home-entertainment-class-device']
            : ['headphone-class-device'],
        },
      };

      console.log(`   -> Preparando chunk ${index + 1}/${chunks.length} para envio.`);
      return client.synthesizeSpeech(request);
    });

    // Executa todas as promessas em paralelo. O tempo total será o do chunk mais demorado.
    const responses = await Promise.all(promises);

    // Extrai o conteúdo de áudio de cada resposta.
    const audioBuffers = responses.map(response => response[0].audioContent);

    console.log('synthesizeSpeech: Todos os chunks foram processados com sucesso. Concatenando áudio...');
    
    // Concatena todos os buffers de áudio em um único ficheiro.
    return Buffer.concat(audioBuffers);

  } catch (error) {
    console.error('Erro durante a chamada paralela à API do Google:', error);
    throw new Error(`Falha na API do Google TTS: ${error.message}`);
  }
}
