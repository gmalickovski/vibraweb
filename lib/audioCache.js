const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class AudioCache {
  constructor() {
    this.cacheDir = path.join(process.cwd(), 'public', 'audio');
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  generateKey(text, voiceConfig) {
    const data = JSON.stringify({ text, voiceConfig });
    return crypto.createHash('md5').update(data).digest('hex');
  }

  exists(key) {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    return fs.existsSync(filePath);
  }

  get(key) {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    return fs.readFileSync(filePath);
  }

  save(key, audioBuffer) {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    fs.writeFileSync(filePath, audioBuffer);
  }
}

export default new AudioCache();
