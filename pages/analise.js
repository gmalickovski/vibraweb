import { useState } from 'react';
import ModalAnalise from '../components/ModalAnalise';
import { useAnalise } from '../contexts/AnaliseContext'; // Corrigido o caminho do import

export default function Analise() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const { analisesGuardadas, removerAnalise } = useAnalise();

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

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Análise de Propósito</h1>
      
      <button style={styles.btnPrimary} onClick={() => setMostrarModal(true)}>
        Realizar Análise
      </button>

      <div style={styles.tableContainer}>
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
                    style={styles.btnAction}
                    onClick={() => handleVisualizarAnalise(analise)}
                  >
                    Ver Análise
                  </button>
                  <button 
                    style={styles.btnDelete}
                    onClick={() => removerAnalise(index)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
    margin: "0 auto"
  },
  title: {
    textAlign: "center",
    color: "#2c2c2c",
    marginBottom: "2rem"
  },
  btnPrimary: {
    padding: "12px 24px",
    backgroundColor: "#D4AF37",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: "2rem",
    display: "block",
    margin: "0 auto"
  },
  tableContainer: {
    overflowX: "auto",
    marginTop: "2rem",
    padding: "1.5rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
    borderBottom: "2px solid #D4AF37",
    color: "#2c2c2c",
    fontWeight: "bold"
  },
  td: {
    padding: "1rem",
    borderBottom: "1px solid #eee"
  },
  nameCell: {
    fontWeight: "bold",
    padding: "1rem",
    borderBottom: "1px solid #eee"
  },
  actionsCell: {
    padding: "1rem",
    borderBottom: "1px solid #eee",
    display: "flex",
    gap: "0.5rem"
  },
  tr: {
    '&:hover': {
      backgroundColor: "#f8f6f0"
    }
  },
  btnAction: {
    padding: "8px 16px",
    backgroundColor: "#D4AF37",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem"
  },
  btnDelete: {
    padding: "8px 16px",
    backgroundColor: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem"
  }
};