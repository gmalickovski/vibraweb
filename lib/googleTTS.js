import textToSpeech from '@google-cloud/text-to-speech';
import path from 'path';

// Configuração do caminho para o arquivo de credenciais JSON.
// Certifique-se de que este caminho está correto para o seu ambiente de servidor.
const credentialsPath = path.join(process.cwd(), 'config', 'chave.json');

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: credentialsPath
  // Se você configurou as Application Default Credentials de outra forma no seu servidor,
  // esta linha pode não ser necessária, ou a inicialização pode ser apenas:
  // const client = new textToSpeech.TextToSpeechClient();
});

/**
 * ATENÇÃO: Se o seu VoiceModal.js busca vozes de '/api/voices' 
 * (que usa o arquivo pages/api/voices.js),
 * esta função getVoices() ABAIXO NÃO é a que está populando o seu modal.
 * A lógica de listagem e classificação de vozes para o modal está em pages/api/voices.js.
 */
export async function getVoices() {
  console.warn('Função getVoices() em lib/googleTTS.js foi chamada. Verifique se esta é a intenção, pois o modal geralmente usa /api/voices.');
  try {
    const [result] = await client.listVoices({ languageCode: 'pt-BR' });
    return result.voices
      .filter(voice => voice.languageCodes.includes('pt-BR'))
      .map(voice => ({ 
        name: voice.name,
        languageCode: voice.languageCodes[0],
        gender: voice.ssmlGender,
        // O tipo real para o modal é determinado em pages/api/voices.js
        type: 'Tipo determinado por /api/voices' 
      }));
  } catch (error) {
    console.error('Erro em getVoices() de lib/googleTTS.js:', error);
    throw error;
  }
}

export async function synthesizeSpeech(text, voiceConfig) {
  console.log('--- synthesizeSpeech em lib/googleTTS.js (Configurado para MP3 Qualidade Padrão) ---');
  // Log para ver o que esta função recebe do pages/api/generate-audio.js
  console.log('Configuração da voz RECEBIDA (voiceConfig) em synthesizeSpeech:', JSON.stringify(voiceConfig, null, 2));

  if (!text || !voiceConfig || !voiceConfig.voice) {
    console.error('synthesizeSpeech: Texto ou configuração de voz (voiceConfig.voice) inválida.', { text, voiceConfig });
    throw new Error('Texto ou nome da voz (voiceConfig.voice) inválido para síntese.');
  }

  const cleanText = text
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove caracteres de controle
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();

  if (!cleanText) {
    console.warn('synthesizeSpeech: Texto limpo resultou em string vazia. Nenhum áudio será gerado.');
    return Buffer.from([]); // Retorna buffer vazio
  }

  const maxChunkSize = 4500; 
  const sentences = cleanText.split(/([.!?]+(?:\s|$))/g); // Divide por frases mantendo pontuação
  const chunks = [];
  let currentChunk = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentencePart = sentences[i];
    if (!sentencePart) continue; // Pula partes vazias resultantes da divisão

    if ((currentChunk.length + sentencePart.length) > maxChunkSize) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = sentencePart;
    } else {
      currentChunk += sentencePart;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());

  if (chunks.length === 0 && cleanText.length > 0) {
      chunks.push(cleanText.substring(0, maxChunkSize)); 
  }
  
  if (chunks.length === 0) {
    console.warn('synthesizeSpeech: Nenhum chunk de texto gerado para síntese após a divisão.');
    return Buffer.from([]);
  }

  try {
    const audioBuffers = [];
    console.log(`synthesizeSpeech: Processando ${chunks.length} chunks de texto.`);

    // Espera-se que voiceConfig.audioEncoding seja 'MP3' vindo de pages/api/generate-audio.js
    const audioEncodingToUse = voiceConfig.audioEncoding || 'MP3'; 
    console.log(`synthesizeSpeech: voiceConfig.audioEncoding recebido: "${voiceConfig.audioEncoding}". audioEncodingToUse definido para: "${audioEncodingToUse}"`);
    
    // sampleRateHertz virá como undefined de pages/api/generate-audio.js para vozes não-Studio,
    // permitindo que a API do Google use seu padrão para MP3 (geralmente 24000Hz).
    let sampleRateHertzToUse = voiceConfig.sampleRateHertz; 

    if (voiceConfig.voice && voiceConfig.voice.toUpperCase().includes('-STUDIO-')) {
      sampleRateHertzToUse = 24000; // Vozes Studio EXIGEM 24000Hz
      console.log(`synthesizeSpeech: Voz Studio detectada ("${voiceConfig.voice}"). sampleRateHertzToUse FORÇADO para 24000.`);
    } else if (sampleRateHertzToUse) {
      // Este caso não deve ocorrer se pages/api/generate-audio.js não enviar sampleRateHertz para não-Studio.
      console.log(`synthesizeSpeech: Usando sampleRateHertzToUse (para voz não-Studio): ${sampleRateHertzToUse}. (Inesperado se a API route não o definir)`);
    } else {
      console.log(`synthesizeSpeech: sampleRateHertzToUse não especificado e não é Studio. API do Google escolherá a taxa de amostragem para MP3 (provavelmente 24000Hz).`);
    }


    for (const chunk of chunks) {
      if (!chunk.trim()) continue; // Pula chunks que são apenas espaços em branco

      const request = {
        input: { 
          text: chunk,
        },
        voice: {
          languageCode: 'pt-BR',
          name: voiceConfig.voice
        },
        audioConfig: {
          audioEncoding: audioEncodingToUse, // Deverá ser MP3
          speakingRate: voiceConfig.speed || 1.0, 
          pitch: voiceConfig.pitch || 0,
          effectsProfileId: ['headphone-class-device'], // Perfil de áudio otimizado
        },
      };

      // Adiciona sampleRateHertz ao audioConfig apenas se tiver um valor definido
      // (será 24000Hz para Studio, ou undefined para outras, permitindo que a API escolha)
      if (sampleRateHertzToUse) {
        request.audioConfig.sampleRateHertz = sampleRateHertzToUse;
      }
      
      console.log('synthesizeSpeech: Enviando requisição para API do Google com audioConfig:', JSON.stringify(request.audioConfig, null, 2));
      
      const [response] = await client.synthesizeSpeech(request);
      audioBuffers.push(Buffer.from(response.audioContent, 'base64'));
    }

    if (audioBuffers.length === 0) {
        console.warn('synthesizeSpeech: Nenhum buffer de áudio foi gerado após processar os chunks.');
        return Buffer.from([]); 
    }

    console.log(`synthesizeSpeech: Concatenação de ${audioBuffers.length} buffers de áudio.`);
    return Buffer.concat(audioBuffers);
  } catch (error) {
    console.error('Erro na síntese de voz (synthesizeSpeech em lib/googleTTS.js):', error.message); 
    if (error.details) console.error('Detalhes do erro da API Google:', error.details);
    if (error.code) console.error('Código do erro da API Google:', error.code);
    throw new Error(`Falha ao sintetizar áudio: ${error.message}`);
  }
}
