import { synthesizeSpeech } from '../../lib/googleTTS';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voiceConfig } = req.body;
    
    // Gerar o áudio
    const audioUrl = await synthesizeSpeech(text, voiceConfig);

    res.status(200).json({ audioUrl });
  } catch (error) {
    console.error('Error generating audio:', error);
    res.status(500).json({ error: error.message });
  }
}
