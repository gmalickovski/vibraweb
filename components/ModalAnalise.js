// components/ModalAnalise.js
import { useState, useEffect } from 'react';
import * as numerologia from "../lib/numerologia";
import { useAnalise } from "../contexts/AnaliseContext";

function ModalAnalise({ fecharModal }) {
  const { salvarAnalise } = useAnalise();
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState(''); // inicia vazio
  const [resultados, setResultados] = useState(null);
  const [erro, setErro] = useState('');

  // Função para validar se a data está no formato "DD/MM/AAAA"
  function validateDate(value) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(value);
  }

  async function atualizarCalculos(nome, dataNascimento) {
    if (!nome || !dataNascimento) return;
    if (!validateDate(dataNascimento)) {
      setErro("Formato de data inválido. Utilize DD/MM/AAAA.");
      return;
    }
    try {
      const response = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, dataNascimento })
      });
      if (response.ok) {
        const dados = await response.json();
        console.log("Dados recebidos da API:", dados);
        setResultados(dados);
        setErro('');
      } else {
        setErro("Erro ao buscar os dados da API.");
      }
    } catch (error) {
      console.error("Erro ao buscar os dados:", error);
      setErro("Erro ao buscar os dados.");
    }
  }

  useEffect(() => {
    atualizarCalculos(nome, dataNascimento);
  }, [nome, dataNascimento]);

  const handleVisualizarTextos = () => {
    if (resultados) {
      const params = new URLSearchParams({
        nome,
        dataNascimento,
        expressao: resultados.numeroExpressao,
        motivacao: resultados.numeroMotivacao,
        impressao: resultados.numeroImpressao,
        destino: resultados.numeroDestino,
        missao: String(resultados.missao),
        talentoOculto: resultados.talentoOculto,
        diaNatalicio: resultados.diaNatalicio,
        numeroPsiquico: resultados.numeroPsiquico,
        debitosCarmicos: resultados.debitosCarmicos && Array.isArray(resultados.debitosCarmicos)
          ? resultados.debitosCarmicos.join(',')
          : '',
        licoesCarmicas: Array.isArray(resultados.licoesCarmicas)
          ? resultados.licoesCarmicas.join(',')
          : '',
        desafios: resultados.desafios
          ? `${resultados.desafios.desafio1}, ${resultados.desafios.desafio2}, ${resultados.desafios.desafioPrincipal}`
          : '',
        respostaSubconsciente: resultados.respostaSubconsciente,
        tendenciasOcultas: Array.isArray(resultados.tendenciasOcultas)
          ? resultados.tendenciasOcultas.join(',')
          : '',
        diasFavoraveis: resultados.diasFavoraveis,
        momentosDecisivos: resultados.momentosDecisivos
          ? `${resultados.momentosDecisivos.momento1}, ${resultados.momentosDecisivos.momento2}, ${resultados.momentosDecisivos.momento3}, ${resultados.momentosDecisivos.momento4}`
          : '',
        anoPessoal: resultados.anoPessoal,
        ciclosDeVida: resultados.ciclosDeVida ? JSON.stringify(resultados.ciclosDeVida) : '',
        harmoniaConjugal: resultados.harmoniaConjugal ? JSON.stringify(resultados.harmoniaConjugal) : '',
        aptidoesProfissionais: resultados.aptidoesProfissionais || ''
      });
      window.open(`/visualizar?${params.toString()}`, '_blank');
    }
  };

  const handleSalvar = () => {
    if (resultados) {
      salvarAnalise({
        nome,
        dataNascimento,
        numeroExpressao: Number(resultados.numeroExpressao) || 0,
        numeroMotivacao: Number(resultados.numeroMotivacao) || 0,
        numeroDestino: Number(resultados.numeroDestino) || 0,
        missao: Number(resultados.missao) || 0,
        numeroImpressao: Number(resultados.numeroImpressao) || 0,
        talentoOculto: Number(resultados.talentoOculto) || 0,
        diaNatalicio: Number(resultados.diaNatalicio) || 0,
        numeroPsiquico: Number(resultados.numeroPsiquico) || 0,
        debitosCarmicos: resultados.debitosCarmicos || [],
        licoesCarmicas: resultados.licoesCarmicas || [],
        desafios: resultados.desafios || {},
        respostaSubconsciente: resultados.respostaSubconsciente || '',
        tendenciasOcultas: resultados.tendenciasOcultas || [],
        diasFavoraveis: resultados.diasFavoraveis || '',
        momentosDecisivos: resultados.momentosDecisivos || {},
        anoPessoal: Number(resultados.anoPessoal) || 0,
        ciclosDeVida: resultados.ciclosDeVida || { ciclos: [] },
        harmoniaConjugal: resultados.harmoniaConjugal || { numero: 0, vibra: [], atrai: [], oposto: [], passivo: [] },
        aptidoesProfissionais: resultados.aptidoesProfissionais || ''
      });
      fecharModal();
    }
  };

  return (
    <div style={styles.modalBg}>
      <div style={styles.modal}>
        <span style={styles.closeBtn} onClick={fecharModal}>&times;</span>
        
        <div style={styles.fixedContent}>
          <h2 style={styles.title}>Análise de Propósito</h2>
          <div style={styles.formGroup}>
            <label>Nome Completo:</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome"
              style={styles.input}
            />
          </div>
          <div style={styles.formGroup}>
            <label>Data de Nascimento (DD/MM/AAAA):</label>
            <input
              type="text"
              value={dataNascimento}
              onChange={(e) => setDataNascimento(e.target.value)}
              placeholder="Ex: 14/02/1990"
              style={styles.input}
            />
          </div>
          {erro && <p style={{ color: 'red' }}>{erro}</p>}
        </div>

        <div style={styles.resultados}>
          {resultados ? (
            <>
              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Números Principais</h3>
                <p><strong>Expressão:</strong> <span style={styles.value}>{resultados.numeroExpressao}</span></p>
                <p><strong>Motivação:</strong> <span style={styles.value}>{resultados.numeroMotivacao}</span></p>
                <p><strong>Impressão:</strong> <span style={styles.value}>{resultados.numeroImpressao}</span></p>
                <p><strong>Destino:</strong> <span style={styles.value}>{resultados.numeroDestino}</span></p>
                <p><strong>Missão:</strong> <span style={styles.value}>{resultados.missao}</span></p>
              </div>

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Números Pessoais</h3>
                <p><strong>Talento Oculto:</strong> <span style={styles.value}>{resultados.talentoOculto}</span></p>
                <p><strong>Dia Natalício:</strong> <span style={styles.value}>{resultados.diaNatalicio}</span></p>
                <p><strong>Número Psíquico:</strong> <span style={styles.value}>{resultados.numeroPsiquico}</span></p>
              </div>

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Aspectos Cármicos</h3>
                <div style={styles.listItem}>
                  <strong>Débitos:</strong> <span style={styles.value}>{resultados.debitosCarmicos ? resultados.debitosCarmicos.join(', ') : 'Não possui'}</span>
                </div>
                <div style={styles.listItem}>
                  <strong>Lições:</strong> <span style={styles.value}>{Array.isArray(resultados.licoesCarmicas) ? resultados.licoesCarmicas.join(', ') : 'N/A'}</span>
                </div>
              </div>

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Desafios</h3>
                {resultados.desafios && (
                  <>
                    <p><strong>Desafio 1:</strong> <span style={styles.value}>{resultados.desafios.desafio1}</span></p>
                    <p><strong>Desafio 2:</strong> <span style={styles.value}>{resultados.desafios.desafio2}</span></p>
                    <p><strong>Desafio Principal:</strong> <span style={styles.value}>{resultados.desafios.desafioPrincipal}</span></p>
                  </>
                )}
              </div>

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Momentos Decisivos</h3>
                {resultados.momentosDecisivos && (
                  <>
                    <p><strong>Momento 1:</strong> <span style={styles.value}>{resultados.momentosDecisivos.momento1}</span></p>
                    <p><strong>Momento 2:</strong> <span style={styles.value}>{resultados.momentosDecisivos.momento2}</span></p>
                    <p><strong>Momento 3:</strong> <span style={styles.value}>{resultados.momentosDecisivos.momento3}</span></p>
                    <p><strong>Momento 4:</strong> <span style={styles.value}>{resultados.momentosDecisivos.momento4}</span></p>
                  </>
                )}
              </div>

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Outros Aspectos</h3>
                <div style={styles.listItem}>
                  <strong>Resposta Subconsciente:</strong> <span style={styles.value}>{resultados.respostaSubconsciente}</span>
                </div>
                <div style={styles.listItem}>
                  <strong>Tendências Ocultas:</strong> <span style={styles.value}>
                    {Array.isArray(resultados.tendenciasOcultas) ? resultados.tendenciasOcultas.join(', ') : 'N/A'}
                  </span>
                </div>
                <div style={styles.listItem}>
                  <strong>Dias Favoráveis:</strong> <span style={styles.value}>
                    {resultados.diasFavoraveis?.split(',').map(dia => dia.trim()).join(', ')}
                  </span>
                </div>
                <div style={styles.listItem}>
                  <strong>Ano Pessoal:</strong> <span style={styles.value}>{resultados.anoPessoal || 'N/A'}</span>
                </div>
              </div>

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Aptidões Profissionais</h3>
                <div style={styles.listItem}>
                  <strong>Aptidões e Potencialidades Profissionais:</strong> <span style={styles.value}>{resultados.aptidoesProfissionais}</span>
                </div>
              </div>

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Ciclos de Vida</h3>
                {resultados.ciclosDeVida && resultados.ciclosDeVida.ciclos && (
                  resultados.ciclosDeVida.ciclos.map((ciclo, index) => (
                    <div key={index} style={styles.listItem}>
                      <strong>Ciclo {index + 1}:</strong> <span style={styles.value}>{ciclo.inicio} - {ciclo.fim} = {ciclo.regente}</span>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Harmonia Conjugal</h3>
                {resultados.harmoniaConjugal && (
                  <>
                    <br />
                    <em>Vibra: {resultados.harmoniaConjugal.vibra.join(', ')}</em>
                    <br />
                    <em>Atrai: {resultados.harmoniaConjugal.atraia ? resultados.harmoniaConjugal.atraia.join(', ') : 'N/A'}</em>
                    <br />
                    <em>Oposto: {resultados.harmoniaConjugal.oposto.join(', ')}</em>
                    <br />
                    <em>Passivo: {resultados.harmoniaConjugal.passivo.join(', ')}</em>
                  </>
                )}
              </div>

              <div style={styles.botoesContainer}>
                <button style={styles.btnSalvar} onClick={handleSalvar}>
                  Salvar Análise
                </button>
                <button style={styles.btnVisualizar} onClick={handleVisualizarTextos}>
                  Ver Análise Completa
                </button>
              </div>
            </>
          ) : (
            <p>Preencha os campos para visualizar os resultados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalBg: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#fff',
    padding: '20px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    position: 'relative'
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    cursor: 'pointer',
    fontSize: '24px',
    color: '#666',
  },
  formGroup: {
    marginBottom: '15px',
    textAlign: 'left'
  },
  input: {
    width: '100%',
    padding: '8px',
    boxSizing: 'border-box',
    border: '1px solid #ccc',
    borderRadius: '4px'
  },
  fixedContent: {
    borderBottom: '1px solid #ccc',
    paddingBottom: '15px',
    marginBottom: '15px'
  },
  resultados: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px',
    backgroundColor: '#f8f6f0',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '2rem',
    color: '#2c2c2c',
    textAlign: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '0.6rem',
    borderBottom: '2px solid #D4AF37'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#333333',
    marginBottom: '1rem',
    paddingBottom: '0.4rem',
    borderBottom: '1px solid #D4AF37',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  value: {
    color: '#B8860B',
    fontWeight: '500',
    fontSize: '1.1rem'
  },
  sectionContainer: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: '6px',
    textAlign: 'left'
  },
  listItem: {
    margin: '0.5rem 0',
    paddingLeft: '1rem',
    borderLeft: '3px solid #D4AF37'
  },
  botoesContainer: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "1rem"
  },
  btnSalvar: {
    padding: "12px 24px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  btnVisualizar: {
    padding: "12px 24px",
    backgroundColor: "#D4AF37",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold"
  },
  visualizarBtn: {
    marginTop: '20px',
    padding: '12px 24px',
    background: '#D4AF37',
    border: 'none',
    color: '#fff',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    width: '100%',
    transition: 'background 0.3s ease'
  }
};

export default ModalAnalise;