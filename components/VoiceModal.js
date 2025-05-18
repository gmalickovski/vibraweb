import { useState, useEffect } from 'react';

export default function VoiceModal({ isOpen, onClose, onGenerate }) {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0);

  useEffect(() => {
    async function loadVoices() {
      if (!isOpen) return;

      setLoading(true);
      console.log('VoiceModal: Abrindo modal, iniciando carregamento de vozes de /api/voices...');
      try {
        const response = await fetch('/api/voices'); // Busca da API route que usa o seu voices.js
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido ao buscar vozes.' }));
          console.error(`VoiceModal: Erro HTTP ${response.status} ao buscar vozes:`, errorData);
          throw new Error(`Erro HTTP ${response.status}: ${errorData.error || response.statusText}`);
        }
        const data = await response.json();
        const fetchedVoices = data.voices || [];
        
        console.log('VoiceModal: Vozes recebidas de /api/voices (CONSOLE DO NAVEGADOR):', JSON.stringify(fetchedVoices, null, 2));
        
        setVoices(fetchedVoices);
        
        if (fetchedVoices.length > 0) {
          // A lista já deve vir ordenada do backend (pages/api/voices.js)
          // Tenta encontrar a primeira voz feminina como padrão
          const firstFemaleVoice = fetchedVoices.find(v => v.rawGender === 'FEMALE');
          if (firstFemaleVoice) {
            setSelectedVoice(firstFemaleVoice.name);
            console.log('VoiceModal: Voz padrão definida para (primeira feminina):', firstFemaleVoice.name);
          } else {
            // Se não houver feminina, pega a primeira da lista (que será da melhor categoria)
            setSelectedVoice(fetchedVoices[0].name);
            console.log('VoiceModal: Voz padrão definida para (primeira da lista):', fetchedVoices[0].name);
          }
        } else {
          console.log('VoiceModal: Nenhuma voz recebida ou lista vazia de /api/voices.');
          setSelectedVoice('');
        }
      } catch (error) {
        console.error('VoiceModal: Erro crítico ao carregar vozes:', error.message);
        setVoices([]); 
        setSelectedVoice('');
      } finally {
        setLoading(false);
        console.log('VoiceModal: Carregamento de vozes finalizado.');
      }
    }

    loadVoices();
  }, [isOpen]); // Dependência: isOpen. Recarrega se o modal for reaberto.

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedVoice) {
      alert('Por favor, selecione uma voz.'); // Considere um feedback visual melhor
      return;
    }
    console.log('VoiceModal: Gerando áudio com configurações:', { voice: selectedVoice, speed, pitch });
    onGenerate({
      voice: selectedVoice,
      speed,
      pitch
    });
  };

  if (!isOpen) return null;

  // Agrupa as vozes por tipo para os <optgroup>
  const groupedVoices = voices.reduce((acc, voice) => {
    const type = voice.type || 'Standard'; // Fallback, mas o backend deve sempre fornecer um tipo
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(voice);
    return acc;
  }, {});

  // Ordem desejada para os grupos no dropdown, conforme definido em pages/api/voices.js
  const groupOrder = ['Studio', 'Neural2', 'WaveNet', 'Standard'];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2 style={styles.title}>Configurações de Áudio</h2>
        
        {loading ? (
          <p style={styles.loading}>Carregando vozes disponíveis...</p>
        ) : voices.length === 0 ? (
          <p style={styles.loading}>Nenhuma voz disponível. Verifique o console do servidor (onde /api/voices roda).</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="voice">Vozes:</label>
              <select
                style={styles.select}
                id="voice"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                required
              >
                <option value="" disabled={voices.length > 0}>-- Selecione uma Voz --</option>
                {groupOrder.map(typeKey => {
                  const voicesInGroup = groupedVoices[typeKey];
                  if (!voicesInGroup || voicesInGroup.length === 0) return null;
                  
                  return (
                    <optgroup label={typeKey} key={typeKey}>
                      {voicesInGroup.map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name.replace(/^pt-BR-/i, '')} ({voice.gender})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                {/* Fallback para renderizar tipos não explicitamente listados em groupOrder */}
                {Object.keys(groupedVoices).map(typeKey => {
                  if (groupOrder.includes(typeKey) || !groupedVoices[typeKey] || groupedVoices[typeKey].length === 0) return null;
                  console.warn(`VoiceModal: Renderizando grupo fallback (inesperado): ${typeKey}. Verifique a lógica de tipos em pages/api/voices.js.`);
                  return (
                    <optgroup label={`${typeKey} (Outro)`} key={`${typeKey}-fallback`}>
                      {groupedVoices[typeKey].map(voice => (
                        <option key={voice.name} value={voice.name}>
                          {voice.name.replace(/^pt-BR-/i, '')} ({voice.gender})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Velocidade: {speed.toFixed(2)}x 
              </label>
              <input
                style={styles.range}
                type="range"
                min="0.25"
                max="2.0" 
                step="0.05" 
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Tom: {pitch.toFixed(0)} 
              </label>
              <input
                style={styles.range}
                type="range"
                min="-20" 
                max="20"
                step="1" 
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
              />
               <span style={styles.tooltip}>
                Ajuste o tom da voz: negativo (grave), positivo (agudo), 0 (normal).
              </span>
            </div>

            <div style={styles.buttonGroup}>
              <button type="submit" style={styles.primaryButton} disabled={!selectedVoice || loading}>
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

// Estilos (mantidos da sua versão ou da minha sugestão anterior, ajuste conforme necessário)
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '15px'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px 30px',
    width: '90%',
    maxWidth: '550px',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
    maxHeight: '90vh', 
    overflowY: 'auto'  
  },
  title: {
    color: '#2D1B4E', 
    marginBottom: '25px', 
    textAlign: 'center',
    fontSize: '1.6rem', 
    fontWeight: 600 
  },
  formGroup: {
    marginBottom: '22px' 
  },
  label: {
    display: 'block',
    marginBottom: '10px', 
    color: '#333', 
    fontWeight: 500,
    fontSize: '0.95rem'
  },
  select: {
    width: '100%',
    padding: '12px 15px', 
    borderRadius: '6px', 
    border: '1px solid #ccc',
    fontSize: '1rem',
    backgroundColor: '#fff', 
    cursor: 'pointer'
  },
  range: {
    width: '100%',
    marginTop: '5px', 
    cursor: 'pointer'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px', 
    justifyContent: 'flex-end',
    marginTop: '30px' 
  },
  primaryButton: {
    backgroundColor: '#2D1B4E',
    color: 'white',
    border: 'none',
    padding: '12px 24px', 
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    transition: 'background-color 0.2s ease, transform 0.1s ease',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0', 
    color: '#333',
    border: '1px solid #ddd', 
    padding: '12px 24px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 500,
    transition: 'background-color 0.2s ease, transform 0.1s ease',
  },
  loading: {
    textAlign: 'center',
    color: '#555', 
    padding: '30px 0',
    fontSize: '1.1rem'
  },
  tooltip: {
    fontSize: '0.85rem', 
    color: '#666',
    display: 'block',
    marginTop: '6px',
    fontWeight: 'normal',
    lineHeight: 1.4
  }
};
