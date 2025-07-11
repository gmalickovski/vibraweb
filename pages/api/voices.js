import textToSpeech from '@google-cloud/text-to-speech';
import path from 'path';

// O caminho para suas credenciais. Certifique-se que este arquivo está no local correto.
const credentialsPath = path.join(process.cwd(), 'config', 'chave.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('--- INÍCIO DA API /api/voices ---');

  try {
    const client = new textToSpeech.TextToSpeechClient({
      keyFilename: credentialsPath
    });
    
    console.log('Passo 1: Solicitando vozes da API do Google para pt-BR...');
    const [response] = await client.listVoices({ languageCode: 'pt-BR' });

    if (!response.voices || response.voices.length === 0) {
      console.warn('AVISO: Nenhuma voz retornada pela API do Google para pt-BR!');
      return res.status(200).json({ voices: [] });
    }
    console.log(`API do Google retornou ${response.voices.length} vozes no total.`);

    // Opcional: filtro extra para garantir que só temos vozes pt-BR
    let ptBrVoices = response.voices.filter(voice => voice.languageCodes.includes('pt-BR'));

    console.log('Passo 2: Processando e classificando as vozes recebidas...');
    
    const processedVoices = ptBrVoices
      .map(voice => {
        const name = voice.name;
        const lowerName = name.toLowerCase();
        let type = 'Standard'; // Tipo padrão

        // Lógica de classificação aprimorada e na ordem correta
        if (lowerName.includes('-studio-')) {
          type = 'Studio'; // Mais alta qualidade
        } else if (lowerName.includes('-neural2-')) {
          type = 'Neural2';
        } else if (lowerName.includes('-wavenet-')) {
          type = 'WaveNet';
        }
        // Vozes "Standard" não precisam de 'else', já são o padrão.
        // Vozes "Journey" (se existirem para pt-BR no futuro) podem ser adicionadas aqui.
        
        // Vamos ignorar vozes que não se encaixam nos padrões desejados (ex: Chirp, Polyglot)
        if (lowerName.includes('chirp') || lowerName.includes('polyglot')) {
            console.log(` -> Ignorando voz não padrão: "${name}"`);
            return null; // Retorna nulo para ser filtrado depois
        }

        const gender = voice.ssmlGender === 'FEMALE' ? 'Feminina' :
                       voice.ssmlGender === 'MALE' ? 'Masculina' :
                       'Neutra';
        
        console.log(` -> Processando: "${name}" | Tipo: ${type} | Gênero: ${gender}`);

        return {
          name: voice.name,
          gender: gender,
          rawGender: voice.ssmlGender,
          type: type,
          languageCode: 'pt-BR'
        };
      })
      .filter(Boolean) // Remove todas as entradas nulas (as vozes que ignoramos)
      .sort((a, b) => {
        // Ordena por: Studio > Neural2 > WaveNet > Standard
        const typeOrder = { 'Studio': 0, 'Neural2': 1, 'WaveNet': 2, 'Standard': 3 };
        const aTypeOrder = typeOrder[a.type] ?? 99;
        const bTypeOrder = typeOrder[b.type] ?? 99;

        if (aTypeOrder !== bTypeOrder) {
          return aTypeOrder - bTypeOrder;
        }
        
        // Se o tipo for o mesmo, ordena por nome
        return a.name.localeCompare(b.name);
      });

    console.log(`Passo 3: Enviando ${processedVoices.length} vozes processadas para o cliente.`);
    res.status(200).json({ voices: processedVoices });

  } catch (error) {
    console.error('--- ERRO CRÍTICO na API /api/voices ---:', error);
    res.status(500).json({ error: 'Failed to list voices', details: error.message });
  } finally {
    console.log('--- FIM DA API /api/voices ---');
  }
}