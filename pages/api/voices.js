import textToSpeech from '@google-cloud/text-to-speech';
import path from 'path'; // Necessário se for usar keyFilename

// Se você usa um arquivo de chave JSON para autenticação, configure o caminho.
// Caso contrário, a biblioteca tentará usar as Application Default Credentials.
// const credentialsPath = path.join(process.cwd(), 'config', 'chave.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('--- INÍCIO DA API /api/voices (voices.js) ---');

  try {
    // Inicialização do cliente TTS
    // Se usar credentialsPath: new textToSpeech.TextToSpeechClient({ keyFilename: credentialsPath });
    const client = new textToSpeech.TextToSpeechClient(); 
    console.log('--- API /api/voices: Passo 1 - Solicitando vozes da API do Google...');
    
    const [response] = await client.listVoices({ languageCode: 'pt-BR' });
    
    if (!response.voices || response.voices.length === 0) {
      console.warn('--- API /api/voices: AVISO - Nenhuma voz retornada pela API do Google!');
      return res.status(200).json({ voices: [] });
    }
    console.log(`--- API /api/voices: API retornou ${response.voices.length} vozes no total (antes de qualquer filtro local).`);

    // Filtra por pt-BR (embora já solicitado, é uma boa prática garantir)
    let allPtBrVoices = response.voices.filter(voice => voice.languageCodes.includes('pt-BR'));
    console.log(`--- API /api/voices: Encontradas ${allPtBrVoices.length} vozes para pt-BR (antes de remover Chirp).`);

    // REMOVE VOZES "CHIRP"
    console.log('--- API /api/voices: Passo 2 - Tentando filtrar vozes "Chirp"...');
    const voicesWithoutChirp = allPtBrVoices.filter(voice => {
      const voiceNameUpper = voice.name.toUpperCase();
      const isChirp = voiceNameUpper.includes('CHIRP');
      console.log(`     API /api/voices: Verificando voz: "${voice.name}" (Upper: "${voiceNameUpper}") - Contém "CHIRP"? ${isChirp} - Será mantida? ${!isChirp}`);
      if (isChirp) {
        console.log(`     ---> API /api/voices: VOZ "${voice.name}" IDENTIFICADA COMO CHIRP E SERÁ REMOVIDA.`);
      }
      return !isChirp; // Mantém a voz se NÃO for Chirp
    });
    
    console.log(`--- API /api/voices: Após filtro Chirp: ${allPtBrVoices.length - voicesWithoutChirp.length} vozes "Chirp" foram (ou deveriam ter sido) removidas.`);
    console.log(`--- API /api/voices: Restam ${voicesWithoutChirp.length} vozes pt-BR para processamento.`);

    if (voicesWithoutChirp.length === 0) {
        console.warn('--- API /api/voices: AVISO - Nenhuma voz pt-BR restante após o filtro Chirp (ou nenhuma encontrada inicialmente)!');
        return res.status(200).json({ voices: [] });
    }

    const processedVoices = voicesWithoutChirp.map(voice => {
        const name = voice.name; 
        const upperName = name.toUpperCase();
        let type = 'Standard'; // Predefinir como Standard

        // Lógica de atribuição de tipo para vozes NÃO-CHIRP
        if (upperName.includes('-STUDIO-')) { 
          type = 'Studio';
        }
        else if (upperName.includes('-NEURAL2-') ||
                   upperName.endsWith('NEURAL') || // Para vozes como pt-BR-AntonioNeural
                   upperName.includes('-NEWS-') ||
                   upperName.includes('-JOURNEY-') ||
                   upperName.includes('-CASUAL-') ||
                   upperName.includes('-POLYGLOT-')) {
          type = 'Neural2';
        }
        else if (upperName.includes('-WAVENET-')) {
          type = 'WaveNet';
        }
        else if (upperName.includes('-STANDARD-')) {
          // Esta condição é importante para não classificar erroneamente
          // vozes que não são Studio, Neural2 ou WaveNet, mas podem não ter '-Standard-' explícito.
          // No entanto, se uma voz não tem nenhum dos outros identificadores, ela será Standard por fallback.
          type = 'Standard';
        }
        // Fallback: Se não corresponder a nenhum dos acima, permanece 'Standard'
        
        const gender = voice.ssmlGender === 'FEMALE' ? 'Feminina' : 
                       voice.ssmlGender === 'MALE' ? 'Masculina' : 
                       'Neutra';
        
        console.log(`     API /api/voices: CLASSIFICAÇÃO FINAL para "${name}" (não-Chirp): Tipo = "${type}", Gênero = "${gender}"`);

        return {
          name: voice.name,
          // displayName: voice.name.replace(/^pt-BR-/i, ''), // O VoiceModal já faz isso
          gender: gender,
          rawGender: voice.ssmlGender, // Adicionando rawGender para consistência com o que VoiceModal pode esperar
          type: type,
          languageCode: 'pt-BR' // Já está em voice.languageCodes, mas podemos manter
        };
      })
      .sort((a, b) => {
        // Ordena por: Studio > Neural2 > WaveNet > Standard
        const typeOrder = { 'Studio': 0, 'Neural2': 1, 'WaveNet': 2, 'Standard': 3 };
        const aTypeOrder = typeOrder[a.type] !== undefined ? typeOrder[a.type] : 99; // Fallback para tipos não mapeados
        const bTypeOrder = typeOrder[b.type] !== undefined ? typeOrder[b.type] : 99;

        if (aTypeOrder !== bTypeOrder) {
          return aTypeOrder - bTypeOrder;
        }
        
        // Se mesmo tipo, ordena por gênero (Feminina primeiro)
        const genderOrder = { 'Feminina': 0, 'Masculina': 1, 'Neutra': 2 };
        return genderOrder[a.gender] - genderOrder[b.gender];
      });

    console.log('--- API /api/voices: Passo 3 - Enviando vozes processadas para o cliente.');
    res.status(200).json({ voices: processedVoices });

  } catch (error) {
    console.error('--- API /api/voices: ERRO CRÍTICO ao listar vozes ---:', error);
    res.status(500).json({ error: 'Failed to list voices', details: error.message });
  } finally {
    console.log('--- FIM DA API /api/voices (voices.js) ---');
  }
}
