import textToSpeech from '@google-cloud/text-to-speech';
import path from 'path';
import fs from 'fs';

const credentialsPath = path.join(process.cwd(), 'config', 'chave.json');
const client = new textToSpeech.TextToSpeechClient({
  keyFilename: credentialsPath
});

export async function getVoices() {
  try {
    const [result] = await client.listVoices({});
    return result.voices.filter(voice => 
      voice.languageCodes.some(code => code.startsWith('pt'))
    ).map(voice => ({
      name: voice.name,
      languageCode: voice.languageCodes[0],
      ssmlGender: voice.ssmlGender,
      naturalSampleRateHertz: voice.naturalSampleRateHertz,
      engineTypes: voice.supportedEngines || []
    }));
  } catch (error) {
    console.error('Error listing voices:', error);
    throw error;
  }
}

export async function synthesizeSpeech(text, voiceConfig) {
  // Dividir o texto em chunks menores se necessário
  const chunkSize = 4000; // Tamanho seguro para cada chunk
  const chunks = [];
  
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  try {
    // Processar cada chunk
    const audioBuffers = await Promise.all(chunks.map(async (chunk) => {
      const request = {
        input: { text: chunk },
        voice: {
          name: voiceConfig.voice,
          languageCode: 'pt-BR',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: voiceConfig.speed || 1.0,
          pitch: voiceConfig.pitch || 0,
        },
      };

      const [response] = await client.synthesizeSpeech(request);
      return response.audioContent;
    }));

    // Concatenar os buffers de áudio
    const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.length, 0);
    const finalBuffer = Buffer.concat(audioBuffers, totalLength);

    // Gerar nome único para o arquivo
    const fileName = `audio-${Date.now()}.mp3`;
    const publicDir = path.join(process.cwd(), 'public', 'audio');
    const filePath = path.join(publicDir, fileName);

    // Garantir que o diretório existe
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Salvar o arquivo
    fs.writeFileSync(filePath, finalBuffer);

    // Retornar a URL relativa para o arquivo
    return `/audio/${fileName}`;

  } catch (error) {
    console.error('Erro na síntese de voz:', error);
    throw error;
  }
}
