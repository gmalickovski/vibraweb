import textToSpeech from '@google-cloud/text-to-speech';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new textToSpeech.TextToSpeechClient();
    const [response] = await client.listVoices({});
    
    // Filtrar apenas vozes pt-BR (português do Brasil)
    const brVoices = response.voices.filter(voice => 
      voice.languageCodes.some(code => code === 'pt-BR')
    );

    // Formatar a resposta com informações detalhadas
    const voices = brVoices.map(voice => ({
      name: voice.name,
      languageCode: voice.languageCodes[0],
      gender: voice.ssmlGender === 'FEMALE' ? 'Feminina' : 
              voice.ssmlGender === 'MALE' ? 'Masculina' : 'Neutra',
      type: voice.name.toLowerCase().includes('chirp') ? 'Chirp' :
            voice.name.toLowerCase().includes('wavenet') ? 'WaveNet' :
            voice.name.toLowerCase().includes('neural') ? 'Neural' :
            'Standard',
      naturalSampleRateHertz: voice.naturalSampleRateHertz
    }));

    res.status(200).json({ voices });
  } catch (error) {
    console.error('Error listing voices:', error);
    res.status(500).json({ error: 'Failed to list voices' });
  }
}
