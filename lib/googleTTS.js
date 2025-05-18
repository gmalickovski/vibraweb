import textToSpeech from '@google-cloud/text-to-speech';
import path from 'path';

// Configuração do caminho para o arquivo de credenciais JSON.
// Se você configurou as Application Default Credentials no seu ambiente,
// a inicialização do cliente pode não precisar do keyFilename explicitamente.
const credentialsPath = path.join(process.cwd(), 'config', 'chave.json');

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: credentialsPath
  // Se não estiver usando um arquivo de chave, pode tentar:
  // const client = new textToSpeech.TextToSpeechClient();
});

/**
 * ATENÇÃO: Se o seu VoiceModal.js busca vozes de '/api/voices' (que usa o arquivo pages/api/voices.js),
 * esta função getVoices() ABAIXO NÃO é a que está populando o seu modal.
 * A lógica de listagem e classificação de vozes para o modal deve estar em pages/api/voices.js.
 * Esta função é mantida aqui como um exemplo ou para outros usos potenciais,
 * mas não deve ser confundida com a fonte de dados do seu modal.
 */
export async function getVoices() {
  console.warn('Função getVoices() em lib/googleTTS.js foi chamada. Verifique se esta é a intenção, pois o modal geralmente usa /api/voices.');
  try {
    const [result] = await client.listVoices({ languageCode: 'pt-BR' });
    return result.voices
      .filter(voice => voice.languageCodes.includes('pt-BR'))
      .map(voice => ({ // Mapeamento simples, a lógica de 'type' detalhada está em pages/api/voices.js
        name: voice.name,
        languageCode: voice.languageCodes[0],
        gender: voice.ssmlGender,
        type: 'Verificar em /api/voices' // Indica que o tipo real vem da API route
      }));
  } catch (error) {
    console.error('Erro em getVoices() de lib/googleTTS.js:', error);
    throw error;
  }
}

export async function synthesizeSpeech(text, voiceConfig) {
  console.log('--- synthesizeSpeech em lib/googleTTS.js ---');
  console.log('Texto recebido:', text ? text.substring(0, 50) + "..." : "NULO OU VAZIO");
  console.log('Configuração da voz recebida:', voiceConfig);

  if (!text || !voiceConfig || !voiceConfig.voice) {
    console.error('synthesizeSpeech: Texto ou configuração de voz inválida.', { text, voiceConfig });
    throw new Error('Texto ou configuração de voz inválida para síntese.');
  }

  const cleanText = text
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    console.warn('synthesizeSpeech: Texto limpo resultou em string vazia.');
    return Buffer.from([]); // Retorna buffer vazio se o texto for apenas espaços ou caracteres de controle
  }

  // Limite de chunking (a API do Google tem um limite de 5000 bytes para o input.text)
  const maxChunkSize = 4500; 
  const sentences = cleanText.split(/([.!?]+(?:\s|$))/g); // Divide por frases mantendo pontuação
  const chunks = [];
  let currentChunk = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentencePart = sentences[i];
    if (!sentencePart) continue;

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
    console.warn('synthesizeSpeech: Nenhum chunk de texto gerado para síntese.');
    return Buffer.from([]);
  }

  try {
    const audioBuffers = [];
    console.log(`synthesizeSpeech: Processando ${chunks.length} chunks de texto.`);

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;

      const request = {
        input: { 
          text: chunk,
        },
        voice: {
          languageCode: 'pt-BR', // O nome da voz já contém o código do idioma
          name: voiceConfig.voice
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: voiceConfig.speed || 1.0, 
          pitch: voiceConfig.pitch || 0,
          effectsProfileId: ['headphone-class-device'], // Otimizado para fones de ouvido/alto-falantes de boa qualidade
        },
      };
      
      // Vozes Studio/Chirp podem preferir/requerer 24kHz.
      // A lógica no seu pages/api/voices.js remove Chirp, então focamos em Studio.
      if (voiceConfig.voice && voiceConfig.voice.toUpperCase().includes('-STUDIO-')) {
        request.audioConfig.sampleRateHertz = 24000;
        console.log(`synthesizeSpeech: Definido sampleRateHertz para 24000 para voz Studio: ${voiceConfig.voice}`);
      }

      // console.log('synthesizeSpeech: Enviando requisição para API do Google com:', JSON.stringify(request, null, 2));
      const [response] = await client.synthesizeSpeech(request);
      audioBuffers.push(Buffer.from(response.audioContent, 'base64'));
      console.log(`synthesizeSpeech: Chunk processado, buffer de áudio recebido (tamanho: ${response.audioContent.length}).`);
    }

    if (audioBuffers.length === 0) {
        console.warn('synthesizeSpeech: Nenhum buffer de áudio foi gerado após processar os chunks.');
        return Buffer.from([]); 
    }

    console.log(`synthesizeSpeech: Concatenação de ${audioBuffers.length} buffers de áudio.`);
    return Buffer.concat(audioBuffers);
  } catch (error) {
    console.error('Erro na síntese de voz (synthesizeSpeech em lib/googleTTS.js):', error.message); 
    // Adiciona mais detalhes do erro, se disponíveis
    if (error.details) console.error('Detalhes do erro:', error.details);
    if (error.code) console.error('Código do erro:', error.code);
    throw new Error(`Falha ao sintetizar áudio: ${error.message}`);
  }
}
