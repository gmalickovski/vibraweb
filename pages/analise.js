import { useState, useEffect } from 'react';  // Adicione useEffect ao import
import { useRouter } from 'next/router';  // Add this import
import ModalAnalise from '../components/ModalAnalise';
import { useAnalise } from '../contexts/AnaliseContext'; // Corrigido o caminho do import

export default function Analise() {
  const router = useRouter();  // Add this line
  const [mostrarModal, setMostrarModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);  // Adicione este estado
  const { analisesGuardadas, removerAnalise } = useAnalise();

  // Adicione este useEffect para detectar o tamanho da tela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVisualizarAnalise = (dados) => {
    const params = new URLSearchParams({
      nome: dados.nome || '',
      dataNascimento: dados.dataNascimento || '',
      expressao: String(dados.numeroExpressao || 0),
      motivacao: String(dados.numeroMotivacao || 0),
      impressao: String(dados.numeroImpressao || 0),
      destino: String(dados.numeroDestino || 0),
      missao: String(dados.missao || 0),
      talentoOculto: String(dados.talentoOculto || 0),
      diaNatalicio: String(dados.diaNatalicio || 0),
      numeroPsiquico: String(dados.numeroPsiquico || 0),
      debitosCarmicos: (dados.debitosCarmicos || []).join(','),
      licoesCarmicas: (dados.licoesCarmicas || []).join(','),
      desafios: JSON.stringify(dados.desafios || {}),
      respostaSubconsciente: dados.respostaSubconsciente || '',
      tendenciasOcultas: Array.isArray(dados.tendenciasOcultas) 
        ? dados.tendenciasOcultas.join(',') 
        : String(dados.tendenciasOcultas || ''),
      diasFavoraveis: dados.diasFavoraveis || '',
      momentosDecisivos: JSON.stringify(dados.momentosDecisivos || {}),
      anoPessoal: String(dados.anoPessoal || 0),
      ciclosDeVida: JSON.stringify(dados.ciclosDeVida || { ciclos: [] }),
      harmoniaConjugal: JSON.stringify(dados.harmoniaConjugal || {}),
      aptidoesProfissionais: dados.aptidoesProfissionais || ''
    });
    window.open(`/visualizar?${params.toString()}`, '_blank');
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    document.cookie = 'isAuthenticated=false; path=/';
    router.replace('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.navigationBar}>
        <button 
          onClick={() => router.push('/')} 
          className="btn-animated btn-primary"
        >
          Voltar ao Dashboard
        </button>
        <button 
          onClick={() => handleLogout()} 
          className="btn-animated btn-danger"
        >
          Sair
        </button>
      </div>

      <h1 style={styles.title}>Análise de Propósito</h1>
      
      <button style={styles.btnPrimary} onClick={() => setMostrarModal(true)}>
        Realizar Análise
      </button>

      <div style={styles.tableContainer}>
        {!isMobile ? (
          // Versão desktop - tabela atual
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Data Nascimento</th>
                <th style={styles.th}>Expressão</th>
                <th style={styles.th}>Motivação</th>
                <th style={styles.th}>Destino</th>
                <th style={styles.th}>Missão</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {analisesGuardadas.map((analise, index) => (
                <tr key={index} style={styles.tr}>
                  <td style={styles.nameCell}>{analise.nome || ''}</td>
                  <td style={styles.td}>{analise.dataNascimento || ''}</td>
                  <td style={styles.td}>{Number(analise.numeroExpressao) || 0}</td>
                  <td style={styles.td}>{Number(analise.numeroMotivacao) || 0}</td>
                  <td style={styles.td}>{Number(analise.numeroDestino) || 0}</td>
                  <td style={styles.td}>{Number(analise.missao) || 0}</td>
                  <td style={styles.actionsCell}>
                    <button 
                      className="btn-animated btn-primary"
                      onClick={() => handleVisualizarAnalise(analise)}
                    >
                      Ver Análise
                    </button>
                    <button 
                      className="btn-animated btn-danger"
                      onClick={() => removerAnalise(index)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          // Versão mobile - cards
          <div style={styles.mobileCardContainer}>
            {analisesGuardadas.map((analise, index) => (
              <div key={index} style={styles.mobileCard}>
                <div style={styles.mobileCardContent}>
                  <h3 style={styles.mobileCardTitle}>{analise.nome || ''}</h3>
                  <p style={styles.mobileCardItem}>
                    <strong>Data:</strong> {analise.dataNascimento || ''}
                  </p>
                  <p style={styles.mobileCardItem}>
                    <strong>Expressão:</strong> {Number(analise.numeroExpressao) || 0}
                  </p>
                  <p style={styles.mobileCardItem}>
                    <strong>Motivação:</strong> {Number(analise.numeroMotivacao) || 0}
                  </p>
                  <p style={styles.mobileCardItem}>
                    <strong>Destino:</strong> {Number(analise.numeroDestino) || 0}
                  </p>
                  <p style={styles.mobileCardItem}>
                    <strong>Missão:</strong> {Number(analise.missao) || 0}
                  </p>
                </div>
                <div style={styles.mobileCardActions}>
                  <button 
                    className="btn-animated btn-primary"
                    onClick={() => handleVisualizarAnalise(analise)}
                    style={styles.mobileCardButton}
                  >
                    Ver Análise
                  </button>
                  <button 
                    className="btn-animated btn-danger"
                    onClick={() => removerAnalise(index)}
                    style={styles.mobileCardButton}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {mostrarModal && (
        <ModalAnalise fecharModal={() => setMostrarModal(false)} />
      )}
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Roboto', Arial, sans-serif",
    padding: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
    background: "#faf7f2" // Fundo bem claro com tom amarelado
  },
  navigationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '2rem',
    gap: '1rem'
  },
  btnNavigation: {
    padding: '8px 16px',
    backgroundColor: '#D4AF37',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      opacity: '0.9'
    }
  },
  title: {
    textAlign: "center",
    color: "#2D1B4E", // Roxo escuro
    marginBottom: "2rem"
  },
  btnPrimary: {
    padding: "12px 24px",
    backgroundColor: "#E67E22", // Laranja
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "2rem",
    display: "block",
    margin: "0 auto",
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      opacity: '0.9'
    }
  },
  tableContainer: {
    overflowX: "auto",
    marginTop: "2rem",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(45, 27, 78, 0.1)", // Sombra com tom roxo
    borderRadius: "8px",
    backgroundColor: "white"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
    textAlign: "left",
  },
  th: {
    padding: "1rem",
    borderBottom: "2px solid #E67E22", // Laranja
    color: "#2D1B4E", // Roxo escuro
    fontWeight: "bold"
  },
  td: {
    padding: "1rem",
    borderBottom: "1px solid #f0e6d2" // Borda suave amarelada
  },
  nameCell: {
    fontWeight: "bold",
    padding: "1rem",
    borderBottom: "1px solid #f0e6d2", // Borda suave amarelada
    color: "#2D1B4E" // Roxo escuro
  },
  actionsCell: {
    padding: "1rem",
    borderBottom: "1px solid #eee",
    display: "flex",
    gap: "0.5rem"
  },
  tr: {
    '&:hover': {
      backgroundColor: "#fff9ea" // Amarelo bem claro no hover
    }
  },
  btnAction: {
    padding: "8px 16px",
    backgroundColor: "#E67E22", // Laranja
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      opacity: '0.9'
    }
  },
  btnDelete: {
    padding: "8px 16px",
    backgroundColor: "#c0392b", // Vermelho harmonioso com a paleta
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      opacity: '0.9'
    }
  },
  mobileCardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '100%',
    '@media (max-width: 600px)': {
      padding: '10px'
    }
  },
  mobileCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 2px 8px rgba(45, 27, 78, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  mobileCardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  mobileCardTitle: {
    fontSize: '1.2rem',
    color: '#2D1B4E',
    borderBottom: '2px solid #E67E22',
    paddingBottom: '8px',
    marginBottom: '8px'
  },
  mobileCardItem: {
    margin: '4px 0',
    color: '#2D1B4E'
  },
  mobileCardActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    borderTop: '1px solid rgba(45, 27, 78, 0.1)',
    paddingTop: '15px',
    marginTop: '5px'
  },
  mobileCardButton: {
    flex: 1,
    padding: '8px',
    fontSize: '0.9rem'
  }
};