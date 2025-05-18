import { synthesizeSpeech } from '../../lib/googleTTS';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceConfig } = req.body;

    // Gera o áudio (deve retornar um Buffer)
    const audioBuffer = await synthesizeSpeech(text, voiceConfig);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="analise.mp3"');
    res.status(200).send(audioBuffer);
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: error.message });
  }
}
