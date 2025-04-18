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

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      fecharModal();
    }
  };

  const handleVisualizarTextos = () => {
    if (resultados) {
      const params = new URLSearchParams();
      
      // Dados básicos
      params.append('nome', encodeURIComponent(nome));
      params.append('dataNascimento', encodeURIComponent(dataNascimento));
      params.append('expressao', resultados.numeroExpressao);
      params.append('motivacao', resultados.numeroMotivacao);
      params.append('impressao', resultados.numeroImpressao);
      params.append('destino', resultados.numeroDestino);
      params.append('missao', String(resultados.missao));
      params.append('talentoOculto', resultados.talentoOculto);
      params.append('diaNatalicio', resultados.diaNatalicio);
      params.append('numeroPsiquico', resultados.numeroPsiquico);
      
      // Arrays
      params.append('debitosCarmicos', resultados.debitosCarmicos?.join(',') || '');
      params.append('licoesCarmicas', resultados.licoesCarmicas?.join(',') || '');
      
      // Objetos complexos - garantindo encoding correto
      params.append('desafios', encodeURIComponent(JSON.stringify(resultados.desafios || {})));
      params.append('momentosDecisivos', encodeURIComponent(JSON.stringify(resultados.momentosDecisivos || {})));
      params.append('ciclosDeVida', encodeURIComponent(JSON.stringify(resultados.ciclosDeVida || { ciclos: [] })));
      
      // Outros campos
      params.append('respostaSubconsciente', resultados.respostaSubconsciente || '');
      params.append('tendenciasOcultas', encodeURIComponent(
        Array.isArray(resultados.tendenciasOcultas)
          ? resultados.tendenciasOcultas.join(',')
          : resultados.tendenciasOcultas || ''
      ));
      params.append('diasFavoraveis', resultados.diasFavoraveis || '');
      
      // Adicionando harmoniaConjugal aos parâmetros
      params.append('harmoniaConjugal', encodeURIComponent(JSON.stringify({
        numero: resultados.harmoniaConjugal?.numero || 0,
        vibra: resultados.harmoniaConjugal?.vibra || [],
        atrai: resultados.harmoniaConjugal?.atrai || [],
        oposto: resultados.harmoniaConjugal?.oposto || [],
        passivo: resultados.harmoniaConjugal?.passivo || []
      })));
      
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
    <div style={styles.modalBg} onClick={handleModalClick}>
      <div style={styles.modal}>
        <button 
          onClick={fecharModal} 
          style={styles.closeBtn}
          aria-label="Fechar modal"
        >
          ✕
        </button>
        
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
                <p><strong>Número:</strong> <span style={styles.value}>{resultados.harmoniaConjugal.numero}</span></p>
                <div style={styles.listItem}>
                  <strong>Vibra com:</strong> <span style={styles.value}>{resultados.harmoniaConjugal.vibra.join(", ")}</span>
                </div>
                <div style={styles.listItem}>
                  <strong>Atrai:</strong> <span style={styles.value}>{resultados.harmoniaConjugal.atrai.join(", ")}</span>
                </div>
                <div style={styles.listItem}>
                  <strong>É oposto a:</strong> <span style={styles.value}>{resultados.harmoniaConjugal.oposto.join(", ")}</span>
                </div>
                <div style={styles.listItem}>
                  <strong>É passivo com:</strong> <span style={styles.value}>{resultados.harmoniaConjugal.passivo.join(", ")}</span>
                </div>
              </div>

              <div style={styles.botoesContainer}>
                <button 
                  className="btn-animated btn-success"
                  onClick={handleSalvar}
                >
                  Salvar Análise
                </button>

                <button 
                  className="btn-animated btn-primary"
                  onClick={handleVisualizarTextos}
                >
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
    alignItems: 'flex-start',
    zIndex: 1000,
    overflow: 'auto',
    padding: '10px'
  },
  modal: {
    background: '#faf7f2', // Fundo claro amarelado
    padding: '15px',
    borderRadius: '8px',
    width: '95%',
    maxWidth: '800px',
    maxHeight: '95vh',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    margin: '10px auto',
    '@media (max-width: 600px)': {
      padding: '10px',
      width: '100%',
      margin: '5px auto'
    }
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#2D1B4E', // Roxo escuro
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    zIndex: 1000,
    padding: 0,
    '&:hover': {
      background: 'rgba(45, 27, 78, 0.05)', // Roxo muito claro
      color: '#E67E22' // Laranja
    }
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
    marginBottom: '15px',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 2
  },
  resultados: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: 'calc(95vh - 200px)',
    padding: '10px',
    backgroundColor: '#f8f6f0',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: '2rem',
    color: '#2D1B4E', // Roxo escuro
    textAlign: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '0.6rem',
    borderBottom: "2px solid #E67E22" // Laranja
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#2D1B4E', // Roxo escuro
    marginBottom: '1rem',
    paddingBottom: '0.4rem',
    borderBottom: "1px solid #E67E22", // Laranja
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  value: {
    color: '#E67E22', // Laranja
    fontWeight: '500',
    fontSize: '1.1rem'
  },
  sectionContainer: {
    marginBottom: '1.5rem',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: '6px',
    textAlign: 'left',
    '@media (max-width: 600px)': {
      padding: '0.75rem',
      marginBottom: '1rem'
    }
  },
  listItem: {
    margin: '0.5rem 0',
    paddingLeft: '1rem',
    borderLeft: "3px solid #E67E22" // Laranja
  },
  listContainer: {
    margin: '0.5rem 0',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: '6px'
  },
  botoesContainer: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "2rem",
    padding: "1rem",
    borderTop: "1px solid rgba(45, 27, 78, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      gap: '0.5rem'
    }
  },
  btnSalvar: {
    padding: "12px 24px",
    backgroundColor: "#27ae60", // Verde harmonioso com a paleta
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      opacity: '0.9'
    }
  },
  btnVisualizar: {
    padding: "12px 24px",
    backgroundColor: "#E67E22", // Laranja
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      opacity: '0.9'
    }
  },
  btnRealizar: {
    padding: "12px 24px",
    backgroundColor: "#2D1B4E", // Roxo escuro
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1.1rem",
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: "#1a0f2e",
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(45, 27, 78, 0.2)'
    }
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
  },
  harmoniaNumero: {
    fontSize: '1.1rem',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid rgba(45, 27, 78, 0.1)'
  },
  ul: {
    listStyleType: 'none',
    padding: 0,
    margin: 0
  },
  li: {
    marginBottom: '0.5rem'
  },
  ulDash: {
    listStyleType: 'none',
    padding: 0,
    margin: '0.5rem 0'
  },
  liDash: {
    marginBottom: '0.5rem',
    paddingLeft: '0'
  }
};

export default ModalAnalise;