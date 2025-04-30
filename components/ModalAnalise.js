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
  const [coresFavoraveis, setCoresFavoraveis] = useState('');

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
    // Calcula as cores favoráveis sempre que a data muda
    if (dataNascimento && validateDate(dataNascimento)) {
      setCoresFavoraveis(numerologia.calcularCoresFavoraveisPorDiaNatalicio(dataNascimento));
    } else {
      setCoresFavoraveis('');
    }
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
      params.append('coresFavoraveis', Number(coresFavoraveis) || 0); // já está correto
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
        aptidoesProfissionais: resultados.aptidoesProfissionais || '',
        coresFavoraveis: Number(coresFavoraveis) || 0, // ADICIONE ESTA LINHA
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
          <form style={styles.formFields} autoComplete="off" onSubmit={e => e.preventDefault()}>
            <div style={{ ...styles.formGroupModern, ...styles.formGroupNome }}>
              <label style={styles.labelModern} htmlFor="nome">Nome Completo</label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                style={styles.inputModern}
                autoComplete="off"
              />
            </div>
            <div style={{ ...styles.formGroupModern, ...styles.formGroupData }}>
              <label style={styles.labelModern} htmlFor="dataNascimento">Data de Nascimento</label>
              <input
                id="dataNascimento"
                type="text"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                placeholder="Ex: 14/02/1990"
                style={styles.inputModern}
                autoComplete="off"
                inputMode="numeric"
              />
            </div>
            {erro && <p style={styles.errorMsg}>{erro}</p>}
          </form>
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

              <div style={styles.sectionContainer}>
                <h3 style={styles.sectionTitle}>Cores Favoráveis</h3>
                <div style={styles.listItem}>
                  <strong>Número:</strong> <span style={styles.value}>{coresFavoraveis}</span>
                </div>
              </div>
            </>
          ) : (
            <p>Preencha os campos para visualizar os resultados.</p>
          )}
        </div>

        {/* Botões fixos transparentes, só aparecem com resultados */}
        {resultados && (
          <div style={styles.botoesFixos}>
            <button 
              className="btn-animated btn-success"
              onClick={handleSalvar}
              style={styles.btnSalvar}
            >
              Salvar Análise
            </button>
            <button 
              className="btn-animated btn-primary"
              onClick={handleVisualizarTextos}
              style={styles.btnVisualizar}
            >
              Ver Análise Completa
            </button>
          </div>
        )}
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
    alignItems: 'center', // Centraliza verticalmente
    zIndex: 1000,
    overflow: 'auto',
    padding: '0',
  },
  modal: {
    background: '#faf7f2',
    padding: '0',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '650px',
    maxHeight: '96vh',
    minHeight: '320px',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    margin: '0 auto',
    boxShadow: '0 4px 32px rgba(45,27,78,0.13)',
    overflow: 'hidden',
    '@media (max-width: 700px)': {
      maxWidth: '98vw',
      minHeight: '0',
    }
  },
  closeBtn: {
    position: 'absolute',
    top: '10px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#2D1B4E',
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
      background: 'rgba(45, 27, 78, 0.05)',
      color: '#E67E22'
    }
  },
  fixedContent: {
    borderBottom: '1px solid #eee',
    padding: '18px 24px 10px 24px',
    background: '#fff',
    zIndex: 2,
    position: 'relative',
    '@media (max-width: 600px)': {
      padding: '12px 8px 8px 8px'
    }
  },
  formFields: {
    display: 'flex',
    flexDirection: 'row',
    gap: '2rem',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: '10px',
    marginBottom: '0',
    '@media (max-width: 600px)': {
      flexDirection: 'column',
      gap: '1rem',
      alignItems: 'stretch'
    }
  },
  formGroupModern: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minWidth: '220px',
    flex: 1,
    '@media (max-width: 600px)': {
      minWidth: 'unset'
    }
  },
  formGroupNome: {
    flex: 2, // ocupa mais espaço
    minWidth: '260px',
    maxWidth: '420px'
  },
  formGroupData: {
    flex: 0.7, // ocupa menos espaço
    minWidth: '120px',
    maxWidth: '180px'
  },
  labelModern: {
    fontWeight: 500,
    color: '#2D1B4E',
    fontSize: '1rem',
    marginBottom: '2px',
    letterSpacing: '0.01em'
  },
  inputModern: {
    padding: '10px 14px',
    borderRadius: '6px',
    border: '1.5px solid #e0e0e0',
    fontSize: '1rem',
    outline: 'none',
    background: '#faf7f2',
    color: '#2D1B4E',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 2px rgba(45,27,78,0.03)',
    fontFamily: "'Roboto', Arial, sans-serif",
    width: '100%',
    boxSizing: 'border-box',
    marginBottom: 0
  },
  errorMsg: {
    color: '#e74c3c',
    fontSize: '0.98rem',
    marginTop: '0.5rem',
    marginBottom: 0,
    textAlign: 'center'
  },
  resultados: {
    flex: 1,
    overflowY: 'auto',
    padding: '18px 24px 10px 24px',
    backgroundColor: '#f8f6f0',
    borderRadius: '0 0 12px 12px',
    boxShadow: 'none',
    marginBottom: 0,
    minHeight: 0,
    maxHeight: 'calc(96vh - 120px)', // Ajusta para não cortar em telas pequenas
    '@media (max-width: 600px)': {
      padding: '10px 4px 6px 4px',
      maxHeight: 'calc(98vh - 110px)'
    }
  },
  title: {
    fontSize: '2rem',
    color: '#2D1B4E',
    textAlign: 'center',
    marginBottom: '1.5rem',
    paddingBottom: '0.6rem',
    borderBottom: "2px solid #E67E22" // Laranja
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#2D1B4E',
    marginBottom: '1rem',
    paddingBottom: '0.4rem',
    borderBottom: "1px solid #E67E22", // Laranja
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem'
  },
  value: {
    color: '#E67E22',
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
  botoesFixos: {
    position: 'fixed',
    left: '50%',
    bottom: '18px',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    width: '100%',
    maxWidth: '650px',
    zIndex: 1100,
    background: 'transparent', // Sem background
    boxShadow: 'none',
    padding: 0,
    borderRadius: 0,
    '@media (max-width: 700px)': {
      maxWidth: '98vw',
      flexDirection: 'column',
      gap: '0.5rem'
    }
  },
  btnSalvar: {
    padding: "12px 24px",
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: 'all 0.3s ease',
    minWidth: '140px'
  },
  btnVisualizar: {
    padding: "12px 24px",
    backgroundColor: "#E67E22",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: 'all 0.3s ease',
    minWidth: '180px'
  },
  btnRealizar: {
    padding: "12px 24px",
    backgroundColor: "#2D1B4E",
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