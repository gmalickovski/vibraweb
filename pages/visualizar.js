// pages/visualizar.js
import React from "react";
import { buscarBlocosPorCampo } from "../lib/notion";
import * as numerologia from "../lib/numerologia";

/* ================================
   Funções Auxiliares
================================ */

// Converte a data do formato "DD/MM/YYYY" para "YYYY/MM/DD".
// Se o formato não estiver completo, retorna "2000/01/01".
function converterData(dataStr) {
  const partes = dataStr.split("/");
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  console.error("Formato de data inválido:", dataStr);
  return "2000/01/01";
}

// Calcula os períodos dos Momentos Decisivos conforme a regra desejada.
// Exemplo: para uma data de nascimento em 1990, os períodos serão:
//   1º Momento: "1990 - 2019"
//   2º Momento: "2019 - 2028"
//   3º Momento: "2028 - 2037"
//   4º Momento: "2037 - ?"
function getPeriodosMomentos(dataNascimento) {
  const partes = dataNascimento.split("/");
  if (partes.length === 3) {
    const ano = parseInt(partes[0], 10);
    const periodo1 = `${ano} - ${ano + 29}`;
    const periodo2 = `${ano + 29} - ${ano + 29 + 9}`;
    const periodo3 = `${ano + 29 + 9} - ${ano + 29 + 9 + 9}`;
    const periodo4 = `${ano + 29 + 9 + 9} - ?`;
    return { periodo1, periodo2, periodo3, periodo4 };
  }
  return { periodo1: "", periodo2: "", periodo3: "", periodo4: "" };
}

// Renderiza um bloco retornado pelo Notion.
function renderBlock(block) {
  const type = block.type;
  if (!block[type] || !block[type].rich_text) {
    console.warn("Bloco com estrutura inesperada:", block);
    return (
      <p key={block.id} className="notion-paragraph">
        Bloco sem conteúdo válido.
      </p>
    );
  }
  const content = block[type].rich_text.map(rt => rt.plain_text).join("");
  return <p key={block.id} className="notion-paragraph">{content}</p>;
}

// Atualizar renderItem para usar h2 e garantir espaçamento consistente
function renderItem(title, value, blocks) {
  return (
    <div style={styles.sectionContainer} key={title}>
      <h3 style={styles.itemTitle}>
        {title}: <span style={{...styles.value, ...styles.itemValue}}>{value}</span>
      </h3>
      <div>
        {blocks && blocks.length > 0
          ? blocks.map(block => renderBlock(block))
          : <p style={styles.paragraph}>Texto não encontrado para {title}.</p>}
      </div>
    </div>
  );
}

/* ================================
   Componente Principal
================================ */
export default function Visualizar({ resultados, nome, dataNascimento }) {
  if (!resultados) {
    return (
      <div style={styles.container}>
        <h1 style={styles.mainTitle}>Resultados não encontrados.</h1>
        <p style={styles.paragraph}>Certifique-se de preencher os dados no modal e tente novamente.</p>
      </div>
    );
  }
  return (
    <>
      <style jsx global>{`
        @media print {
          /* Configurações básicas da página */
          @page {
            size: A4;
            margin: 1.5cm 1cm; /* Reduzido: top/bottom 1.5cm, left/right 1cm */
          }

          /* Controle de quebra de página e margens */
          @page :first {
            margin-top: 1.5cm;
          }

          @page :left, @page :right {
            margin: 1.5cm 1cm;
          }

          /* Ajustes do corpo da página */
          body {
            margin: 0;
            padding: 1.5cm 1cm;
          }

          /* Ajustes para textos longos do Notion */
          .notion-paragraph {
            margin: 0.8em 0;
            white-space: normal;
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
            max-width: 100%;
            box-sizing: border-box;
          }

          /* Ajustes para containers */
          div[style*="sectionContainer"] {
            overflow: hidden;
            page-break-inside: avoid;
            width: 100%;
            box-sizing: border-box;
          }

          /* Remove links e URLs */
          a[href]::after {
            content: none !important;
          }

          /* Remove headers e footers específicos do navegador */
          head, header, footer {
            display: none !important;
          }

          /* Remove elementos não desejados na impressão */
          button {
            display: none !important;
          }

          /* Ajustes para parágrafos */
          .notion-paragraph {
            margin: 1em 0;
            page-break-inside: avoid;
          }

          /* Força a remoção de qualquer cabeçalho ou rodapé */
          body::before, body::after {
            display: none !important;
            content: none !important;
          }
        }
      `}</style>
      <div style={styles.container}>
        <h1 style={styles.mainTitle}>
          Análise de Propósito: <span style={{...styles.value, ...styles.mainValue}}>{nome}</span>
        </h1>
        
        <div style={styles.sectionContainer}>
          <h2 style={styles.sectionTitle}>Introdução</h2>
          {resultados?.introducaoBlocos && resultados.introducaoBlocos.length > 0 ? (
            resultados.introducaoBlocos.map(block => renderBlock(block))
          ) : (
            <p style={styles.paragraph}>Texto de introdução não encontrado.</p>
          )}
        </div>
        
        <h2 style={styles.sectionTitle}>Os Seus Números</h2>
        <div style={styles.listContainer}>
          {[
            { label: "Expressão", key: "numeroExpressao" },
            { label: "Motivação", key: "numeroMotivacao" },
            { label: "Impressão", key: "numeroImpressao" },
            { label: "Destino", key: "numeroDestino" },
            { label: "Missão", key: "missao" },
            { label: "Talento Oculto", key: "talentoOculto" },
            { label: "Dia Natalício", key: "diaNatalicio" },
            { label: "Número Psíquico", key: "numeroPsiquico" },
          ].map(campo =>
            renderItem(
              campo.label,
              resultados[campo.key],
              resultados?.blocosTextos?.[campo.label] || []
            )
          )}

          {/* Seção Resposta do Subconsciênte */}
          <div style={styles.sectionContainer}>
            <h3 style={styles.itemTitle}>
              Resposta do Subconsciênte: <span style={{...styles.value, ...styles.itemValue}}>{resultados.respostaSubconsciente}</span>
            </h3>
            <div>
              {resultados?.blocosRespostaSubconsciente && resultados.blocosRespostaSubconsciente.length > 0 ? (
                resultados.blocosRespostaSubconsciente.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Resposta do Subconsciênte; {resultados.respostaSubconsciente}</p>
              )}
            </div>
          </div>

          {/* Seção Tendências Ocultas */}
          {resultados.tendenciasOcultas && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Tendências Ocultas: <span style={{...styles.value, ...styles.itemValue}}>
                  {Array.isArray(resultados.tendenciasOcultas)
                    ? resultados.tendenciasOcultas.join(", ")
                    : resultados.tendenciasOcultas}
                </span>
              </h3>
              <ul style={styles.ul}>
                {(Array.isArray(resultados.tendenciasOcultas)
                  ? resultados.tendenciasOcultas
                  : [resultados.tendenciasOcultas]
                ).map(item => (
                  <li key={item} style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      Tendência Oculta: <span style={{...styles.value, ...styles.subItemValue}}>{item}</span>
                    </h4>
                    {resultados?.blocosTendenciasOcultas &&
                    resultados.blocosTendenciasOcultas[item] &&
                    resultados.blocosTendenciasOcultas[item].length > 0 ? (
                      resultados.blocosTendenciasOcultas[item].map(block => renderBlock(block))
                    ) : (
                      <p style={styles.paragraph}>Tendência Oculta; {item}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seção Dias Favoráveis */}
          <div style={styles.sectionContainer}>
            <h3 style={styles.itemTitle}>
              Dias Favoráveis
            </h3>
            <div>
              <h4 style={styles.subItemTitle}>
                Seus dias: <span style={{...styles.value, ...styles.subItemValue}}>
                  {resultados.diasFavoraveis?.split(',').map(dia => dia.trim()).join(', ')}
                </span>
              </h4>
              {resultados?.blocosDiasFavoraveis && resultados.blocosDiasFavoraveis.length > 0 ? (
                resultados.blocosDiasFavoraveis.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Texto não encontrado para Dias Favoráveis.</p>
              )}
            </div>
          </div>

          {/* Seção Débitos Cármicos */}
          {resultados.debitosCarmicos && resultados.debitosCarmicos.length > 0 && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Débitos Cármicos: <span style={{...styles.value, ...styles.itemValue}}>{resultados.debitosCarmicos.join(", ")}</span>
              </h3>
              <ul style={styles.ul}>
                {resultados.debitosCarmicos.map(debito => (
                  <li key={debito} style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      Débito Cármico: <span style={{...styles.value, ...styles.subItemValue}}>{debito}</span>
                    </h4>
                    {resultados?.blocosDebitosCarmicos &&
                    resultados.blocosDebitosCarmicos[debito] &&
                    resultados.blocosDebitosCarmicos[debito].length > 0 ? (
                      resultados.blocosDebitosCarmicos[debito].map(block => renderBlock(block))
                    ) : (
                      <p style={styles.paragraph}>Débito Cármico; {debito}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seção Ciclos de Vida */}
          {resultados.ciclosDeVida && resultados.ciclosDeVida.ciclos && resultados.ciclosDeVida.ciclos.length > 0 && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Ciclos de Vida: <span style={{...styles.value, ...styles.itemValue}}>
                  {resultados.ciclosDeVida.ciclos.map(c => c.regente).join(", ")}
                </span>
              </h3>
              <ul style={styles.ul}>
                {resultados.ciclosDeVida.ciclos.map((ciclo, index) => (
                  <li key={index} style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      {index + 1}º Ciclo: <span style={{...styles.value, ...styles.subItemValue}}>{ciclo.regente}</span>
                       - Período: {ciclo.inicio} - {ciclo.fim}
                    </h4>
                    {resultados?.blocosCiclos &&
                    resultados.blocosCiclos[index] &&
                    resultados.blocosCiclos[index].blocks &&
                    resultados.blocosCiclos[index].blocks.length > 0 ? (
                      resultados.blocosCiclos[index].blocks.map(block => renderBlock(block))
                    ) : (
                      <p style={styles.paragraph}>Texto não encontrado para este ciclo.</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seção Lições Cármicas */}
          {resultados.licoesCarmicas && resultados.licoesCarmicas.length > 0 && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Lições Cármicas: <span style={{...styles.value, ...styles.itemValue}}>{resultados.licoesCarmicas.join(", ")}</span>
              </h3>
              <ul style={styles.ul}>
                {resultados.licoesCarmicas.map(licao => (
                  <li key={licao} style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      Lição Cármica: <span style={{...styles.value, ...styles.subItemValue}}>{licao}</span>
                    </h4>
                    {resultados?.blocosLicoesCarmicas &&
                    resultados.blocosLicoesCarmicas[licao] &&
                    resultados.blocosLicoesCarmicas[licao].length > 0 ? (
                      resultados.blocosLicoesCarmicas[licao].map(block => renderBlock(block))
                    ) : (
                      <p style={styles.paragraph}>Lição Cármica; {licao}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seção Momentos Decisivos */}
          {resultados.momentosDecisivos &&
          typeof resultados.momentosDecisivos === "object" &&
          Object.keys(resultados.momentosDecisivos).length > 0 ? (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Momentos Decisivos: <span style={{...styles.value, ...styles.itemValue}}>
                  {[1,2,3,4].map(i => resultados.momentosDecisivos["momento" + i]).filter(Boolean).join(", ")}
                </span>
              </h3>
              <ul style={styles.ul}>
                {[1, 2, 3, 4].map(i => {
                  const m = resultados.momentosDecisivos["momento" + i];
                  const p = resultados.momentosDecisivos["periodo" + i];
                  return (
                    <li key={i} style={styles.li}>
                      <h4 style={styles.subItemTitle}>
                        {i}º Momento Decisivo: <span style={{...styles.value, ...styles.subItemValue}}>{m}</span>
                        {p && <> - Período: {p}</>}
                      </h4>
                      <div>
                        {resultados?.blocosMomentosDecisivos &&
                        resultados.blocosMomentosDecisivos["momento" + i] &&
                        resultados.blocosMomentosDecisivos["momento" + i].length > 0 ? (
                          resultados.blocosMomentosDecisivos["momento" + i].map(block => renderBlock(block))
                        ) : (
                          <p style={styles.paragraph}>Momento Decisivo; {m}</p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p style={styles.paragraph}>Momentos Decisivos não encontrados.</p>
          )}

          {/* Seção Desafios */}
          <div style={styles.sectionContainer}>
            <h3 style={styles.itemTitle}>
              Desafios: <span style={{...styles.value, ...styles.itemValue}}>
                {[resultados.desafios.desafio1, resultados.desafios.desafio2, resultados.desafios.desafioPrincipal].filter(Boolean).join(", ")}
              </span>
            </h3>
            <ul style={styles.ul}>
              <li style={styles.li}>
                <h4 style={styles.subItemTitle}>
                  1º Desafio: <span style={{...styles.value, ...styles.subItemValue}}>{resultados.desafios.desafio1}</span>
                </h4>
                {resultados?.blocosDesafios &&
                resultados.blocosDesafios["1º Desafio"] &&
                resultados.blocosDesafios["1º Desafio"].length > 0 ? (
                  resultados.blocosDesafios["1º Desafio"].map(block => renderBlock(block))
                ) : (
                  <p style={styles.paragraph}>Texto não encontrado para 1º Desafio.</p>
                )}
              </li>
              <li style={styles.li}>
                <h4 style={styles.subItemTitle}>
                  2º Desafio: <span style={{...styles.value, ...styles.subItemValue}}>{resultados.desafios.desafio2}</span>
                </h4>
                {resultados?.blocosDesafios &&
                resultados.blocosDesafios["2º Desafio"] &&
                resultados.blocosDesafios["2º Desafio"].length > 0 ? (
                  resultados.blocosDesafios["2º Desafio"].map(block => renderBlock(block))
                ) : (
                  <p style={styles.paragraph}>Texto não encontrado para 2º Desafio.</p>
                )}
              </li>
              <li style={styles.li}>
                <h4 style={styles.subItemTitle}>
                  3º Desafio (Principal): <span style={{...styles.value, ...styles.subItemValue}}>{resultados.desafios.desafioPrincipal}</span>
                </h4>
                {resultados?.blocosDesafios &&
                resultados.blocosDesafios["3º Desafio (Principal)"] &&
                resultados.blocosDesafios["3º Desafio (Principal)"].length > 0 ? (
                  resultados.blocosDesafios["3º Desafio (Principal)"].map(block => renderBlock(block))
                ) : (
                  <p style={styles.paragraph}>Texto não encontrado para 3º Desafio (Principal).</p>
                )}
              </li>
            </ul>
          </div>

          {/* Seção Harmonia Conjugal */}
          <div style={styles.sectionContainer}>
            <h3 style={styles.itemTitle}>
              Harmonia Conjugal: <span style={{...styles.value, ...styles.itemValue}}>{resultados.harmoniaConjugal.numero}</span>
            </h3>
            {resultados.harmoniaConjugal && (
              <>
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      Vibra com: <span style={{...styles.value, ...styles.subItemValue}}>{resultados.harmoniaConjugal.vibra.join(", ")}</span>
                    </h4>
                  </li>
                  <li style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      Atrai: <span style={{...styles.value, ...styles.subItemValue}}>{resultados.harmoniaConjugal.atrai.join(", ")}</span>
                    </h4>
                  </li>
                  <li style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      É oposto a: <span style={{...styles.value, ...styles.subItemValue}}>{resultados.harmoniaConjugal.oposto.join(", ")}</span>
                    </h4>
                  </li>
                  <li style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      É passivo com: <span style={{...styles.value, ...styles.subItemValue}}>{resultados.harmoniaConjugal.passivo.join(", ")}</span>
                    </h4>
                  </li>
                </ul>
                {resultados?.blocosHarmoniaConjugal && resultados.blocosHarmoniaConjugal.length > 0 ? (
                  resultados.blocosHarmoniaConjugal.map(block => renderBlock(block))
                ) : (
                  <p style={styles.paragraph}>Texto não encontrado para Harmonia Conjugal.</p>
                )}
              </>
            )}
          </div>

          {/* Seção Ano Pessoal */}
          <div style={styles.sectionContainer}>
            <h3 style={styles.itemTitle}>
              Ano Pessoal: <span style={{...styles.value, ...styles.itemValue}}>{resultados.anoPessoal}</span>
            </h3>
            <div>
              {resultados?.blocosAnoPessoal && resultados.blocosAnoPessoal.length > 0 ? (
                resultados.blocosAnoPessoal.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Ano Pessoal; {resultados.anoPessoal}</p>
              )}
            </div>
          </div>

          {/* Seção Aptidões e Potencialidades Profissionais */}
          {resultados.aptidoesProfissionais && resultados.aptidoesProfissionais !== "N/A" && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Aptidões e Potencialidades Profissionais: <span style={{...styles.value, ...styles.itemValue}}>
                  {Array.isArray(resultados.aptidoesProfissionais) 
                    ? resultados.aptidoesProfissionais.join(", ") 
                    : resultados.aptidoesProfissionais}
                </span>
              </h3>
              <div>
                {resultados?.blocosAptidoesProfissionais && resultados.blocosAptidoesProfissionais.length > 0 ? (
                  resultados.blocosAptidoesProfissionais.map(block => renderBlock(block))
                ) : (
                  <p style={styles.paragraph}>Aptidões e Potencialidades Profissionais; {resultados.aptidoesProfissionais}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bloco de Conclusão */}
        {resultados.conclusaoBlocos && resultados.conclusaoBlocos.length > 0 && (
          <div style={styles.sectionContainer}>
            <h2 style={styles.sectionTitle}>Conclusão</h2>
            {resultados.conclusaoBlocos.map(block => renderBlock(block))}
          </div>
        )}

        {/* Botão de Imprimir */}
        <button
          onClick={() => window.print()}
          className="btn-animated modal-btn"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#2D1B4E', // Roxo escuro
            boxShadow: '0 2px 8px rgba(45, 27, 78, 0.2)'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M5 1a2 2 0 0 0-2 2v1h10V3a2 2 0 0 0-2-2H5zm6 8H5a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1z"/>
            <path d="M0 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1v-2a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2H2a2 2 0 0 1-2-2V7zm2.5 1a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z"/>
          </svg>
          Imprimir
        </button>
      </div>
    </>
  );
}

/* ================================
   Estilos
================================ */
const styles = {
  container: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
    padding: "20px", // Reduzido de 40px para dar mais espaço ao conteúdo
    maxWidth: "1000px",
    margin: "0 auto",
    backgroundColor: "#faf7f2", // Voltando para o tom amarelado anterior
    color: "#2D1B4E", // Roxo escuro para texto
    lineHeight: "1.6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem", // Reduzido de 1.5rem
    boxSizing: "border-box", // Garantir que padding não afete a largura total
    width: "100%" // Garantir largura total do container
  },
  mainTitle: {  // h1
    fontSize: "2rem", // Reduzido de 2.5rem
    color: "#2D1B4E", // Roxo escuro
    textAlign: "center",
    marginTop: "0.5rem", // Reduzido de 1rem
    marginBottom: "1rem", // Reduzido de 1.5rem
    paddingBottom: "0.4rem", // Reduzido de 0.6rem
    borderBottom: "3px solid #E67E22", // Laranja
    width: "100%"
  },
  sectionTitle: {  // h2
    fontSize: "1.75rem", // Reduzido de 2rem
    color: "#2D1B4E", // Roxo escuro
    textAlign: "center",
    marginTop: "0",
    marginBottom: "0.5rem", // Reduzido de 1rem
    paddingBottom: "0.3rem", // Reduzido de 0.4rem
    borderBottom: "2px solid #E67E22", // Laranja
    width: "100%"
  },
  itemTitle: {  // h3
    fontSize: '1.5rem',
    color: '#2D1B4E', // Roxo escuro
    marginBottom: '0.2rem',
    paddingBottom: '0.2rem',
    borderBottom: '1px solid #E67E22', // Laranja
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.15rem',
    width: '100%',
    flexWrap: 'wrap', // Added to fix mobile wrapping
    '@media (max-width: 600px)': {
      fontSize: '1.2rem',
      flexDirection: 'column',
      gap: '0.1rem'
    }
  },
  subItemTitle: {  // h4
    fontSize: '1.25rem',
    color: '#2D1B4E', // Roxo escuro
    marginBottom: '0.2rem',
    marginTop: '0.2rem',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.15rem',
    flexWrap: 'wrap', // Added to fix mobile wrapping
    '@media (max-width: 600px)': {
      fontSize: '1.1rem',
      flexDirection: 'column',
      gap: '0.1rem'
    }
  },
  sectionContainer: {
    width: "100%",
    padding: "0.5rem",
    backgroundColor: "#fff", // Fundo branco
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(45, 27, 78, 0.1)", // Sombra com tom roxo
    marginBottom: "0.5rem",
    minHeight: "120px",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    boxSizing: "border-box",
    overflow: "hidden", // Adicionado para controlar overflow
    wordWrap: "break-word", // Adicionado para quebrar palavras longas
    overflowWrap: "break-word" // Suporte adicional para quebra de palavras
  },
  value: {
    color: '#E67E22', // Laranja
    fontWeight: '500',
    display: 'inline-block',
    marginLeft: '0.15rem',
    '@media (max-width: 600px)': {
      marginLeft: 0,
      width: '100%'
    }
  },
  mainValue: {  // for h1
    fontSize: "2rem" // Reduzido de 2.5rem
  },
  sectionValue: {  // for h2
    fontSize: "1.75rem" // Reduzido de 2rem
  },
  itemValue: {  // for h3
    fontSize: "1.5rem" // Reduzido de 1.75rem
  },
  subItemValue: {  // for h4
    fontSize: "1.25rem"
  },
  ul: {
    listStyle: "none",
    padding: "0",
    margin: "0.3rem 0", // Aumentado de 0.25rem
    width: "100%",
    boxSizing: "border-box"
  },
  li: {
    marginBottom: "0.3rem", // Aumentado de 0.25rem
    paddingLeft: "1rem",
    position: "relative",
    borderLeft: "3px solid #E67E22", // Laranja
    width: "100%",
    boxSizing: "border-box",
    '@media (max-width: 600px)': {
      paddingLeft: '0.5rem'
    }
  },
  paragraph: {
    margin: '0.2rem 0',
    lineHeight: '1.5',
    color: '#2D1B4E', // Roxo escuro mais suave
    width: '100%',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    textAlign: 'justify', // Added for consistent text alignment
    '@media (max-width: 600px)': {
      fontSize: '0.95rem',
      textAlign: 'left' // Better readability on mobile
    }
  },
  listContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem", // Aumentado de 0.35rem
    padding: "0",
    boxSizing: "border-box",
    '& > div': {
      margin: "0",
      width: "100%",
      boxSizing: "border-box"
    }
  },
  tr: {
    '&:hover': {
      backgroundColor: "#fff9ea" // Voltando para o amarelo claro no hover
    }
  }
};

export async function getServerSideProps(context) {
  const {
    nome,
    dataNascimento,
    expressao,
    motivacao,
    impressao,
    destino,
    missao,
    talentoOculto,
    diaNatalicio,
    numeroPsiquico,
    debitosCarmicos,
    licoesCarmicas,
    desafios,
    respostaSubconsciente,
    tendenciasOcultas,
    diasFavoraveis,
    momentosDecisivos,
    anoPessoal,
    ciclosDeVida: ciclosParam,
    introducaoBlocos: introducaoBlocosParam,
    conclusaoBlocos: conclusaoBlocosParam,
  } = context.query;

  const safeNome = nome ? decodeURIComponent(nome).trim() : "Nome Padrão";
  const safeDataNascimento = dataNascimento
    ? converterData(decodeURIComponent(dataNascimento).trim())
    : "2000/01/01";

  const resultados = {
    numeroExpressao: expressao ? Number(expressao) : null,
    numeroMotivacao: motivacao ? Number(motivacao) : null,
    numeroImpressao: impressao ? Number(impressao) : null,
    numeroDestino: destino ? Number(destino) : null,
    missao: missao ? Number(missao) : null,
    talentoOculto: talentoOculto ? Number(talentoOculto) : null,
    diaNatalicio: diaNatalicio ? Number(diaNatalicio) : null,
    numeroPsiquico: numeroPsiquico ? Number(numeroPsiquico) : null,
    debitosCarmicos: debitosCarmicos ? debitosCarmicos.split(",") : [],
    licoesCarmicas: licoesCarmicas ? licoesCarmicas.split(",") : [],
    diasFavoraveis: diasFavoraveis || "",
    anoPessoal: anoPessoal ? Number(anoPessoal) : null,
    desafios: (() => {
      if (!desafios) return {};
      const t = desafios.trim();
      if (t[0] !== "{" && t[0] !== "[") {
        const parts = t.split(",").map(x => x.trim());
        return {
          desafio1: parts[0] || "",
          desafio2: parts[1] || "",
          desafioPrincipal: parts[2] || "",
        };
      }
      try {
        return JSON.parse(desafios);
      } catch (e) {
        console.error("Erro ao parsear desafios:", e);
        return {};
      }
    })(),
    respostaSubconsciente: respostaSubconsciente || "",
    tendenciasOcultas: tendenciasOcultas
      ? (() => {
          const decoded = decodeURIComponent(tendenciasOcultas).trim();
          return decoded.indexOf(",") > -1 ? decoded.split(",").map(x => x.trim()) : decoded;
        })()
      : null,
    momentosDecisivos: (() => {
      try {
        if (momentosDecisivos && momentosDecisivos.trim().startsWith("{")) {
          return JSON.parse(momentosDecisivos);
        } else if (momentosDecisivos) {
          const parts = momentosDecisivos.split(",").map(x => x.trim());
          return {
            momento1: parts[0] || "",
            momento2: parts[1] || "",
            momento3: parts[2] || "",
            momento4: parts[3] || "",
          };
        } else return {};
      } catch (e) {
        console.error("Erro ao parsear momentos decisivos:", e);
        return {};
      }
    })(),
    ciclosDeVida: null,
    harmoniaConjugal: null,
    aptidoesProfissionais: null,
  };

  // Process introduction and conclusion blocks first
  try {
    if (introducaoBlocosParam) {
      resultados.introducaoBlocos = JSON.parse(introducaoBlocosParam);
    } else {
      // Use the same field validation as other blocks
      resultados.introducaoBlocos = await buscarBlocosPorCampo("Introdução", "1");
    }
    
    if (conclusaoBlocosParam) {
      resultados.conclusaoBlocos = JSON.parse(conclusaoBlocosParam);
    } else {
      // Use the same field validation as other blocks
      resultados.conclusaoBlocos = await buscarBlocosPorCampo("Conclusão", "1");
    }
  } catch (error) {
    console.error("Erro ao processar blocos de introdução/conclusão:", error);
    resultados.introducaoBlocos = [];
    resultados.conclusaoBlocos = [];
  }

  if (ciclosParam) {
    try {
      resultados.ciclosDeVida = JSON.parse(ciclosParam);
    } catch (e) {
      console.error("Erro ao parsear ciclosDeVida:", e);
      resultados.ciclosDeVida = { ciclos: [] };
    }
  } else {
    resultados.ciclosDeVida = numerologia.calcularCiclosDeVida(safeDataNascimento, resultados.numeroDestino);
    if (!resultados.ciclosDeVida || !resultados.ciclosDeVida.ciclos) {
      resultados.ciclosDeVida = { ciclos: [] };
    }
  }

  const periodos = getPeriodosMomentos(safeDataNascimento);
  resultados.momentosDecisivos = {
    ...resultados.momentosDecisivos,
    periodo1: periodos.periodo1,
    periodo2: periodos.periodo2,
    periodo3: periodos.periodo3,
    periodo4: periodos.periodo4,
  };

  const campos = [
    { label: "Expressão", key: "numeroExpressao" },
    { label: "Motivação", key: "numeroMotivacao" },
    { label: "Impressão", key: "numeroImpressao" },
    { label: "Destino", key: "numeroDestino" },
    { label: "Missão", key: "missao" },
    { label: "Talento Oculto", key: "talentoOculto" },
    { label: "Dia Natalício", key: "diaNatalicio" },
    { label: "Número Psíquico", key: "numeroPsiquico" },
  ];
  const blocosTextos = {};
  for (const campo of campos) {
    try {
      const blocks = await buscarBlocosPorCampo(campo.label, resultados[campo.key]);
      blocosTextos[campo.label] = blocks;
    } catch (error) {
      console.error("Erro buscando blocos para", campo.label, error);
      blocosTextos[campo.label] = [];
    }
  }
  resultados.blocosTextos = blocosTextos;

  if (resultados.numeroExpressao != null && resultados.numeroDestino != null) {
    resultados.harmoniaConjugal = numerologia.interpretarHarmoniaConjugal(
      numerologia.calcularNumeroDoAmor(resultados.numeroExpressao, resultados.numeroDestino)
    );
  }
  if (!resultados.harmoniaConjugal) {
    resultados.harmoniaConjugal = { numero: "N/A", vibra: [], atrai: [], oposto: [], passivo: [] };
  }
  let blocosHarmoniaConjugal = [];
  if (resultados.harmoniaConjugal.numero && resultados.harmoniaConjugal.numero !== "N/A") {
    try {
      blocosHarmoniaConjugal = await buscarBlocosPorCampo("Harmonia Conjugal", resultados.harmoniaConjugal.numero);
    } catch (error) {
      console.error("Erro buscando blocos para Harmonia Conjugal", error);
      blocosHarmoniaConjugal = [];
    }
  }
  resultados.blocosHarmoniaConjugal = blocosHarmoniaConjugal;
  
  if (resultados.numeroExpressao != null) {
    resultados.aptidoesProfissionais = numerologia.calcularAptidoesProfissionais(resultados.numeroExpressao);
  }
  if (resultados.aptidoesProfissionais === null || resultados.aptidoesProfissionais === undefined) {
    resultados.aptidoesProfissionais = "N/A";
  }
  
  const blocosCiclos = [];
  if (resultados.ciclosDeVida && resultados.ciclosDeVida.ciclos) {
    for (let i = 0; i < resultados.ciclosDeVida.ciclos.length; i++) {
      const ciclo = resultados.ciclosDeVida.ciclos[i];
      try {
        const blocks = await buscarBlocosPorCampo(`Ciclo ${i + 1}`, ciclo.regente);
        blocosCiclos.push({ titulo: `Ciclo ${i + 1}`, blocks });
      } catch (error) {
        console.error("Erro buscando blocos para Ciclo", i + 1, error);
        blocosCiclos.push({ titulo: `Ciclo ${i + 1}`, blocks: [] });
      }
    }
  }
  resultados.blocosCiclos = blocosCiclos;
  
  const blocosDesafios = {};
  const desafiosKeys = [
    { label: "1º Desafio", prop: "desafio1" },
    { label: "2º Desafio", prop: "desafio2" },
    { label: "3º Desafio (Principal)", prop: "desafioPrincipal" },
  ];
  for (const item of desafiosKeys) {
    try {
      const blocks = await buscarBlocosPorCampo(item.label, resultados.desafios[item.prop]);
      blocosDesafios[item.label] = blocks;
    } catch (error) {
      console.error("Erro buscando blocos para", item.label, error);
      blocosDesafios[item.label] = [];
    }
  }
  resultados.blocosDesafios = blocosDesafios;
  
  let blocosDiasFavoraveis = [];
  try {
    blocosDiasFavoraveis = await buscarBlocosPorCampo("Dias Favoráveis", "0");
  } catch (error) {
    console.error("Erro buscando blocos para Dias Favoráveis", error);
  }
  resultados.blocosDiasFavoraveis = blocosDiasFavoraveis;
  
  const blocosTendenciasOcultas = {};
  if (resultados.tendenciasOcultas) {
    if (Array.isArray(resultados.tendenciasOcultas)) {
      for (const item of resultados.tendenciasOcultas) {
        try {
          const blocks = await buscarBlocosPorCampo("Tendência Oculta", item);
          blocosTendenciasOcultas[item] = blocks;
        } catch (error) {
          console.error("Erro buscando blocos para Tendência Oculta", error);
          blocosTendenciasOcultas[item] = [];
        }
      }
    } else {
      try {
        const blocks = await buscarBlocosPorCampo("Tendência Oculta", resultados.tendenciasOcultas);
        blocosTendenciasOcultas[resultados.tendenciasOcultas] = blocks;
      } catch (error) {
        console.error("Erro buscando blocos para Tendência Oculta", error);
        blocosTendenciasOcultas[resultados.tendenciasOcultas] = [];
      }
    }
  }
  resultados.blocosTendenciasOcultas = blocosTendenciasOcultas;
  
  const blocosDebitosCarmicos = {};
  if (resultados.debitosCarmicos && resultados.debitosCarmicos.length > 0) {
    for (const deb of resultados.debitosCarmicos) {
      try {
        const blocks = await buscarBlocosPorCampo("Débito Cármico", deb);
        blocosDebitosCarmicos[deb] = blocks;
      } catch (error) {
        console.error("Erro buscando blocos para Débito Cármico", error);
        blocosDebitosCarmicos[deb] = [];
      }
    }
  }
  resultados.blocosDebitosCarmicos = blocosDebitosCarmicos;
  
  const blocosLicoesCarmicas = {};
  if (resultados.licoesCarmicas && resultados.licoesCarmicas.length > 0) {
    for (const licao of resultados.licoesCarmicas) {
      try {
        const blocks = await buscarBlocosPorCampo("Lição Cármica", licao);
        blocosLicoesCarmicas[licao] = blocks;
      } catch (error) {
        console.error("Erro buscando blocos para Lição Cármica", error);
        blocosLicoesCarmicas[licao] = [];
      }
    }
  }
  resultados.blocosLicoesCarmicas = blocosLicoesCarmicas;
  
  const blocosMomentosDecisivos = {};
  if (resultados.momentosDecisivos && typeof resultados.momentosDecisivos === "object") {
    for (let i = 1; i <= 4; i++) {
      const key = "momento" + i;
      try {
        const numero = resultados.momentosDecisivos[key];
        if (numero) {
          // Buscar blocos usando o formato exato do título do Notion e número
          let blocks = await buscarBlocosPorCampo("Momento Decisivo", numero);
          if (!blocks || blocks.length === 0) {
            // Fallback para o formato alternativo se necessário
            blocks = await buscarBlocosPorCampo(`${i}º Momento Decisivo`, numero);
          }
          blocosMomentosDecisivos[key] = blocks;
        }
      } catch (e) {
        console.error(`Erro buscando blocos para Momento Decisivo ${i}`, e);
        blocosMomentosDecisivos[key] = [];
      }
    }
  }
  resultados.blocosMomentosDecisivos = blocosMomentosDecisivos;

  let blocosRespostaSubconsciente = [];
  try {
    blocosRespostaSubconsciente = await buscarBlocosPorCampo(
      "Resposta do Subconsciênte",
      resultados.respostaSubconsciente?.toString()
    );
  } catch (error) {
    console.error("Erro buscando blocos para Resposta do Subconsciênte", error);
  }
  resultados.blocosRespostaSubconsciente = blocosRespostaSubconsciente;

  let blocosAnoPessoal = [];
  if (resultados.anoPessoal != null) {
    try {
      blocosAnoPessoal = await buscarBlocosPorCampo(
        "Ano Pessoal",
        resultados.anoPessoal.toString()
      );
      if (!blocosAnoPessoal || blocosAnoPessoal.length === 0) {
        // Try alternative format
        blocosAnoPessoal = await buscarBlocosPorCampo(
          "Ano Pessoal",
          `${resultados.anoPessoal}`
        );
      }
    } catch (error) {
      console.error(`Erro buscando blocos para Ano Pessoal`, error);
    }
  }
  resultados.blocosAnoPessoal = blocosAnoPessoal;

  let blocosAptidoesProfissionais = [];
  if (resultados.aptidoesProfissionais && resultados.aptidoesProfissionais !== "N/A") {
    try {
      blocosAptidoesProfissionais = await buscarBlocosPorCampo(
        "Aptidões e Potencialidades Profissionais",
        resultados.aptidoesProfissionais.toString()
      );
    } catch (error) {
      console.error("Erro buscando blocos para Aptidões e Potencialidades Profissionais", error);
    }
  }
  resultados.blocosAptidoesProfissionais = blocosAptidoesProfissionais;
  
  return {
    props: {
      nome: safeNome,
      dataNascimento: safeDataNascimento,
      resultados,
    },
  };
}