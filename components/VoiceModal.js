import { useState, useEffect } from 'react';

export default function VoiceModal({ isOpen, onClose, onGenerate }) {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  useEffect(() => {
    async function loadVoices() {
      try {
        const response = await fetch('/api/voices');
        const data = await response.json();
        
        // Organizar vozes por tipo
        const organizedVoices = data.voices.reduce((acc, voice) => {
          const type = voice.type; // Usando o tipo definido na API

          if (!acc[type]) acc[type] = [];
          acc[type].push(voice);
          return acc;
        }, {});
        
        setVoices(organizedVoices);
        
        // Selecionar primeira voz Chirp por padrão, se disponível
        const firstChirp = data.voices.find(v => v.type === 'Chirp');
        const firstWaveNet = data.voices.find(v => v.type === 'WaveNet');
        const firstNeural = data.voices.find(v => v.type === 'Neural');
        const firstStandard = data.voices.find(v => v.type === 'Standard');
        
        setSelectedVoice((firstChirp || firstWaveNet || firstNeural || firstStandard)?.name || '');
      } catch (error) {
        console.error('Erro ao carregar vozes:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      loadVoices();
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({
      voice: selectedVoice,
      speed,
      pitch
    });
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Configurações de Áudio</h2>
        
        {loading ? (
          <p style={styles.loading}>Carregando vozes disponíveis...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="voice">Vozes:</label>
              <select
                style={styles.select}
                id="voice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {Object.entries(voices).map(([type, typeVoices]) => (
                  <optgroup label={type} key={type}>
                    {typeVoices.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name.replace(/^pt-BR-/, '')} ({voice.gender})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Velocidade: {speed}x
              </label>
              <input
                style={styles.range}
                type="range"
                min="0.25"
                max="4.0"
                step="0.25"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Tom: {pitch}
                <span style={styles.tooltip}>
                  Ajuste o tom da voz: valores negativos deixam a voz mais grave, 
                  valores positivos deixam a voz mais aguda. Zero é o tom normal.
                </span>
              </label>
              <input
                style={styles.range}
                type="range"
                min="-20"
                max="20"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
              />
            </div>

            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.primaryButton}>
                Gerar Áudio
              </button>
              <button type="button" onClick={onClose} style={styles.secondaryButton}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  },
  title: {
    color: '#2D1B4E',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '1.5rem'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#2D1B4E',
    fontWeight: 500
  },
  select: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '1rem'
  },
  range: {
    width: '100%',
    marginTop: '8px'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  primaryButton: {
    backgroundColor: '#2D1B4E',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#E67E22'
    }
  },
  secondaryButton: {
    backgroundColor: '#e0e0e0',
    color: '#333',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.3s ease',
    '&:hover': {
      backgroundColor: '#d0d0d0'
    }
  },
  loading: {
    textAlign: 'center',
    color: '#666'
  },
  tooltip: {
    fontSize: '0.8rem',
    color: '#666',
    display: 'block',
    marginTop: '4px',
    fontWeight: 'normal'
  }
};
