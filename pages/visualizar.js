// pages/visualizar.js
import React, { useState, useEffect } from "react";
import { buscarBlocosPorCampo } from "../lib/notion";
import * as numerologia from "../lib/numerologia";
import LoadingOverlay from '../components/LoadingOverlay';

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

// Função auxiliar para renderizar rich text do Notion
function renderRichText(richTextArr) {
  return richTextArr.map((rt, idx) => {
    let el = rt.plain_text;
    if (rt.href) {
      el = <a key={idx} href={rt.href} target="_blank" rel="noopener noreferrer">{el}</a>;
    }
    if (rt.annotations) {
      if (rt.annotations.bold) el = <strong key={idx}>{el}</strong>;
      if (rt.annotations.italic) el = <em key={idx}>{el}</em>;
      if (rt.annotations.underline) el = <u key={idx}>{el}</u>;
      if (rt.annotations.strikethrough) el = <s key={idx}>{el}</s>;
      if (rt.annotations.code) el = <code key={idx}>{el}</code>;
      // cor
      if (rt.annotations.color && rt.annotations.color !== "default") {
        el = <span key={idx} style={{ color: rt.annotations.color }}>{el}</span>;
      }
    }
    return el;
  });
}

// Renderiza um bloco retornado pelo Notion com hierarquia e listas
function renderBlock(block) {
  const type = block.type;
  const key = block.id;

  if (!block[type] || !block[type].rich_text) {
    console.warn("Bloco com estrutura inesperada:", block);
    return (
      <p key={key} className="notion-paragraph">
        Bloco sem conteúdo válido.
      </p>
    );
  }

  const content = renderRichText(block[type].rich_text);

  // Títulos
  if (type === "heading_1") return <h1 key={key} className="notion-heading1">{content}</h1>;
  if (type === "heading_2") return <h2 key={key} className="notion-heading2">{content}</h2>;
  if (type === "heading_3") return <h3 key={key} className="notion-heading3">{content}</h3>;

  // Listas
  if (type === "bulleted_list_item") return <li key={key} className="notion-bullet">{content}</li>;
  if (type === "numbered_list_item") return <li key={key} className="notion-numbered">{content}</li>;
  if (type === "to_do") return (
    <li key={key} className="notion-todo">
      <input type="checkbox" checked={block[type].checked} readOnly style={{ marginRight: 6 }} />
      {content}
    </li>
  );

  // Citações
  if (type === "quote") return <blockquote key={key} className="notion-quote">{content}</blockquote>;

  // Código
  if (type === "code") return (
    <pre key={key} className="notion-code">
      <code>{block[type].rich_text.map(rt => rt.plain_text).join("")}</code>
    </pre>
  );

  // Parágrafo padrão
  return <p key={key} className="notion-paragraph">{content}</p>;
}

// Atualizar renderItem para usar h2 e garantir espaçamento consistente
function renderItem(title, value, blocks) {
  return (
    <div style={styles.sectionContainer} key={title}>
      <h3 style={styles.itemTitle}>
        {title}: <span style={{ ...styles.value, ...styles.itemValue }}>{value}</span>
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
  const [isLoading, setIsLoading] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    // Só esconde o loading depois de um pequeno delay e quando os dados realmente chegaram
    if (resultados && nome && dataNascimento) {
      setShowLoading(false);
    }
  }, [resultados, nome, dataNascimento]);

  useEffect(() => {
    // Esconde o loading assim que o React monta e os dados já estão disponíveis
    setShowInitialLoading(false);
  }, []);

  if (showLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(250,247,242,0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '1.3rem',
          color: '#2D1B4E',
          marginBottom: '1.5rem',
          fontWeight: 500
        }}>
          Aguarde, carregando as informações da análise...
        </div>
        <div style={{
          border: '4px solid #E67E22',
          borderTop: '4px solid #faf7f2',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}</style>
      </div>
    );
  }

  if (showInitialLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(250,247,242,0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontSize: '1.3rem',
          color: '#2D1B4E',
          marginBottom: '1.5rem',
          fontWeight: 500
        }}>
          Aguarde, carregando as informações da análise...
        </div>
        <div style={{
          border: '4px solid #E67E22',
          borderTop: '4px solid #faf7f2',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}</style>
      </div>
    );
  }

  if (!resultados) {
    return (
      <div style={styles.container}>
        <h1 style={styles.mainTitle}>Resultados não encontrados.</h1>
        <p style={styles.paragraph}>Certifique-se de preencher os dados no modal e tente novamente.</p>
      </div>
    );
  }

  // Funcionalidade de áudio removida

  return (
    <div>
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
      <div style={styles.container} id="printable-content">
        <h1 style={styles.mainTitle}>
          Análise de Propósito: <span style={{ ...styles.value, ...styles.mainValue }}>{nome}</span>
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
            { label: "Número Psíquico", key: "numeroPsiquico" }
            // Remova { label: "Cores Favoráveis", key: "coresFavoraveis" } daqui!
          ].map(campo =>
            renderItem(
              campo.label,
              resultados[campo.key],
              resultados?.blocosTextos?.[campo.label] || []
            )
          )}

          {/* Seção Resposta do Subconciente */}
          <div style={styles.sectionContainer}>
            <h3 style={styles.itemTitle}>
              Resposta do Subconsciênte: <span style={{ ...styles.value, ...styles.itemValue }}>{resultados.respostaSubconsciente}</span>
            </h3>
            <div>
              {resultados?.blocosRespostaSubconsciente && resultados.blocosRespostaSubconsciente.length > 0 ? (
                resultados.blocosRespostaSubconsciente.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Resposta do Subconsciênte; {resultados.respostaSubconsciente}</p>
              )}
            </div>
          </div>

          {/* Seção Ciclos de Vida */}
          {resultados.ciclosDeVida && resultados.ciclosDeVida.ciclos && resultados.ciclosDeVida.ciclos.length > 0 && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>Ciclos de Vida</h3>
              {/* Introdução dos Ciclos de Vida */}
              {resultados?.blocosCiclosIntroducao && resultados.blocosCiclosIntroducao.length > 0 ? (
                resultados.blocosCiclosIntroducao.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Texto de introdução não encontrado para Ciclos de Vida.</p>
              )}
              <ul style={styles.ul}>
                {resultados.ciclosDeVida.ciclos.map((ciclo, index) => (
                  <li key={index} style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      {index + 1}º Ciclo: <span style={{ ...styles.value, ...styles.subItemValue }}>{ciclo.regente}</span>
                      {" - Período: "}{ciclo.inicio} – {ciclo.fim}
                    </h4>
                    {resultados?.blocosCiclos && resultados.blocosCiclos[index] && resultados.blocosCiclos[index].length > 0 ? (
                      resultados.blocosCiclos[index].map(block => renderBlock(block))
                    ) : (
                      <p style={styles.paragraph}>Texto não encontrado para o {index + 1}º Ciclo.</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Seção Tendências Ocultas */}
          {resultados.tendenciasOcultas && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Tendências Ocultas: <span style={{ ...styles.value, ...styles.itemValue }}>
                  {Array.isArray(resultados.tendenciasOcultas)
                    ? resultados.tendenciasOcultas.join(", ")
                    : resultados.tendenciasOcultas}
                </span>
              </h3>
              {/* Introdução Tendências Ocultas */}
              {resultados?.blocosTendenciasOcultasIntroducao && resultados.blocosTendenciasOcultasIntroducao.length > 0 ? (
                resultados.blocosTendenciasOcultasIntroducao.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Texto de introdução não encontrado.</p>
              )}
              <ul style={styles.ul}>
                {(Array.isArray(resultados.tendenciasOcultas)
                  ? resultados.tendenciasOcultas
                  : [resultados.tendenciasOcultas]
                ).map(item => (
                  <li key={item} style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      Tendência Oculta: <span style={{ ...styles.value, ...styles.subItemValue }}>{item}</span>
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

          {/* Seção Cores Favoráveis (ajuste para sempre mostrar o número) */}
          {resultados.coresFavoraveis !== null && resultados.coresFavoraveis !== undefined && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Cores Favoráveis: <span style={{ ...styles.value, ...styles.itemValue }}>{resultados.coresFavoraveis}</span>
              </h3>
              <div>
                {resultados?.blocosCoresFavoraveis && resultados.blocosCoresFavoraveis.length > 0 ? (
                  resultados.blocosCoresFavoraveis.map(block => renderBlock(block))
                ) : (
                  <p style={styles.paragraph}>Texto não encontrado para Cores Favoráveis.</p>
                )}
              </div>
            </div>
          )}

          {/* Seção Dias Favoráveis */}
          <div style={styles.sectionContainer}>
            <h3 style={styles.itemTitle}>
              Dias Favoráveis
            </h3>
            <div>
              <h4 style={styles.subItemTitle}>
                Seus dias: <span style={{ ...styles.value, ...styles.subItemValue }}>
                  {resultados.diasFavoraveis?.split(',').map(dia => dia.trim()).join(', ')}
                </span>
              </h4>
              {/* Texto do Notion Dias Favoráveis; 1 */}
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
                Débitos Cármicos: <span style={{ ...styles.value, ...styles.itemValue }}>{resultados.debitosCarmicos.join(", ")}</span>
              </h3>
              {/* Introdução Débitos Cármicos */}
              {resultados?.blocosDebitosCarmicosIntroducao && resultados.blocosDebitosCarmicosIntroducao.length > 0 ? (
                resultados.blocosDebitosCarmicosIntroducao.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Texto de introdução não encontrado.</p>
              )}
              <ul style={styles.ul}>
                {resultados.debitosCarmicos.map(debito => (
                  <li key={debito} style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      Débito Cármico: <span style={{ ...styles.value, ...styles.subItemValue }}>{debito}</span>
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

          {/* Seção Lições Cármicas */}
          {resultados.licoesCarmicas && resultados.licoesCarmicas.length > 0 && (
            <div style={styles.sectionContainer}>
              <h3 style={styles.itemTitle}>
                Lições Cármicas: <span style={{ ...styles.value, ...styles.itemValue }}>{resultados.licoesCarmicas.join(", ")}</span>
              </h3>
              {/* Introdução Lições Cármicas */}
              {resultados?.blocosLicoesCarmicasIntroducao && resultados.blocosLicoesCarmicasIntroducao.length > 0 ? (
                resultados.blocosLicoesCarmicasIntroducao.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Texto de introdução não encontrado.</p>
              )}
              <ul style={styles.ul}>
                {resultados.licoesCarmicas.map(licao => (
                  <li key={licao} style={styles.li}>
                    <h4 style={styles.subItemTitle}>
                      Lição Cármica: <span style={{ ...styles.value, ...styles.subItemValue }}>{licao}</span>
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
                Momentos Decisivos: <span style={{ ...styles.value, ...styles.itemValue }}>
                  {[1, 2, 3, 4].map(i => resultados.momentosDecisivos["momento" + i]).filter(Boolean).join(", ")}
                </span>
              </h3>
              {/* Introdução Momentos Decisivos */}
              {resultados?.blocosMomentosDecisivosIntroducao && resultados.blocosMomentosDecisivosIntroducao.length > 0 ? (
                resultados.blocosMomentosDecisivosIntroducao.map(block => renderBlock(block))
              ) : (
                <p style={styles.paragraph}>Texto de introdução não encontrado.</p>
              )}
              <ul style={styles.ul}>
                {[1, 2, 3, 4].map(i => {
                  const m = resultados.momentosDecisivos["momento" + i];
                  const p = resultados.momentosDecisivos["periodo" + i];
                  return (
                    <li key={i} style={styles.li}>
                      <h4 style={styles.subItemTitle}>
                        {i}º Momento Decisivo: <span style={{ ...styles.value, ...styles.subItemValue }}>{m}</span>
                        {p && <> - Período: {p}</>}
                      </h4>
                      <div>
                        {resultados?.blocosMomentosDecisivosDetalhados &&
                          resultados.blocosMomentosDecisivosDetalhados[i] &&
                          resultados.blocosMomentosDecisivosDetalhados[i].length > 0 ? (
                          resultados.blocosMomentosDecisivosDetalhados[i].map(block => renderBlock(block))
                        ) : (
                          <p style={styles.paragraph}>{`${i}º Momento Decisivo; ${m}`}</p>
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
              Desafios: <span style={{ ...styles.value, ...styles.itemValue }}>
                {[resultados.desafios.desafio1, resultados.desafios.desafio2, resultados.desafios.desafioPrincipal].filter(Boolean).join(", ")}
              </span>
            </h3>
            {/* Introdução Desafios */}
            {resultados?.blocosDesafiosIntroducao && resultados.blocosDesafiosIntroducao.length > 0 ? (
              resultados.blocosDesafiosIntroducao.map(block => renderBlock(block))
            ) : (
              <p style={styles.paragraph}>Texto de introdução não encontrado.</p>
            )}
            <ul style={styles.ul}>
              <li style={styles.li}>
                <h4 style={styles.subItemTitle}>
                  1º Desafio: <span style={{ ...styles.value, ...styles.subItemValue }}>{resultados.desafios.desafio1}</span>
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
                  2º Desafio: <span style={{ ...styles.value, ...styles.subItemValue }}>{resultados.desafios.desafio2}</span>
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
                  3º Desafio (Principal): <span style={{ ...styles.value, ...styles.subItemValue }}>{resultados.desafios.desafioPrincipal}</span>
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
              Harmonia Conjugal: <span style={{ ...styles.value, ...styles.itemValue }}>{resultados.harmoniaConjugal?.numero || 'N/A'}</span>
            </h3>
            {resultados.harmoniaConjugal && (
              <>
                <ul style={styles.ul}>
                  <li style={styles.li}>
                    <strong>Vibra com:</strong> <span style={{ ...styles.value, ...styles.subItemValue }}>
                      {resultados.harmoniaConjugal.vibra?.join(", ") || 'N/A'}
                    </span>
                  </li>
                  <li style={styles.li}>
                    <strong>Atrai:</strong> <span style={{ ...styles.value, ...styles.subItemValue }}>
                      {resultados.harmoniaConjugal.atrai?.join(", ") || 'N/A'}
                    </span>
                  </li>
                  <li style={styles.li}>
                    <strong>É oposto a:</strong> <span style={{ ...styles.value, ...styles.subItemValue }}>
                      {resultados.harmoniaConjugal.oposto?.join(", ") || 'N/A'}
                    </span>
                  </li>
                  <li style={styles.li}>
                    <strong>É passivo com:</strong> <span style={{ ...styles.value, ...styles.subItemValue }}>
                      {resultados.harmoniaConjugal.passivo?.join(", ") || 'N/A'}
                    </span>
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
              Ano Pessoal: <span style={{ ...styles.value, ...styles.itemValue }}>{resultados.anoPessoal}</span>
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
                Aptidões e Potencialidades Profissionais: <span style={{ ...styles.value, ...styles.itemValue }}>
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

        {/* Botões de Ação */}
        <div className="botoes-container">
          <button onClick={() => window.print()} className="btn-imprimir">
            Imprimir
          </button>
        </div>

        {isLoading && <LoadingOverlay />}
      </div>

      <style jsx>{`
        /* ================================
           Estilos
        ================================= */
        .botoes-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          gap: 1rem;
          z-index: 1000;
          @media print {
            display: none;
          }
        }

        .btn-imprimir,
        .btn-audio {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 4px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .btn-imprimir {
          background-color: #2D1B4E;
          color: white;
        }

        .btn-audio {
          background-color: #E67E22;
          color: white;
        }

        .btn-imprimir:hover,
        .btn-audio:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        /* Estilos existentes */
        #printable-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media print {
          #printable-content {
            display: block;
          }
        }

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
    </div>
  );
}

const styles = {
  container: {
    fontFamily: "'Roboto', 'Arial', sans-serif",
    padding: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
    backgroundColor: "#faf7f2",
    color: "#2D1B4E",
    lineHeight: "1.6",
    boxSizing: "border-box",
    width: "100%",
  },
  mainTitle: {
    fontSize: "2rem",
    color: "#2D1B4E",
    textAlign: "center",
    marginTop: "0.5rem",
    marginBottom: "1rem",
    paddingBottom: "0.4rem",
    borderBottom: "3px solid #E67E22",
    width: "100%",
    // Mobile
    '@media (max-width: 600px)': {
      fontSize: "1.3rem",
      padding: "0.5rem 0.2rem",
    }
  },
  sectionTitle: {
    fontSize: "1.75rem",
    color: "#2D1B4E",
    textAlign: "center",
    marginTop: "0",
    marginBottom: "0.5rem",
    paddingBottom: "0.3rem",
    borderBottom: "2px solid #E67E22",
    width: "100%",
    '@media (max-width: 600px)': {
      fontSize: "1.1rem",
      padding: "0.3rem 0.1rem",
    }
  },
  itemTitle: {
    fontSize: '1.5rem',
    color: '#2D1B4E',
    marginBottom: '0.2rem',
    paddingBottom: '0.2rem',
    borderBottom: '1px solid #E67E22',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.15rem',
    width: '100%',
    flexWrap: 'wrap',
    '@media (max-width: 600px)': {
      fontSize: '1rem',
      flexDirection: 'column',
      gap: '0.1rem',
    }
  },
  subItemTitle: {
    fontSize: '1.25rem',
    color: '#2D1B4E',
    marginBottom: '0.2rem',
    marginTop: '0.2rem',
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.15rem',
    flexWrap: 'wrap',
    '@media (max-width: 600px)': {
      fontSize: '0.95rem',
      flexDirection: 'column',
      gap: '0.05rem',
    }
  },
  sectionContainer: {
    width: "100%",
    padding: "18px 24px",
    backgroundColor: "#fff",
    borderRadius: "14px",
    boxShadow: "0 2px 10px rgba(45, 27, 78, 0.08)",
    marginBottom: "1.2rem",
    minHeight: "120px",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    border: "1px solid #f0e6d2",
    boxSizing: "border-box",
    '@media (max-width: 600px)': {
      padding: "10px 6px",
      minHeight: "auto",
      marginBottom: "0.7rem",
      borderRadius: "8px",
      gap: "0.2rem",
    }
  },
  value: {
    color: '#E67E22',
    fontWeight: '500',
    display: 'inline-block',
    marginLeft: '0.15rem',
    '@media (max-width: 600px)': {
      fontSize: "1rem"
    }
  },
  mainValue: {
    fontSize: "2rem",
    '@media (max-width: 600px)': {
      fontSize: "1.1rem"
    }
  },
  sectionValue: {
    fontSize: "1.75rem",
    '@media (max-width: 600px)': {
      fontSize: "1rem"
    }
  },
  itemValue: {
    fontSize: "1.35rem",
    '@media (max-width: 600px)': {
      fontSize: "1rem"
    }
  },
  subItemValue: {
    fontSize: "1.1rem",
    '@media (max-width: 600px)': {
      fontSize: "0.95rem"
    }
  },
  ul: {
    listStyle: "none",
    padding: "0",
    margin: "0.3rem 0",
    width: "100%"
  },
  li: {
    marginBottom: "0.3rem",
    paddingLeft: "1rem",
    position: "relative",
    borderLeft: "3px solid #E67E22",
    width: "100%",
    background: "rgba(250,247,242,0.7)",
    borderRadius: "6px",
    paddingTop: "8px",
    paddingBottom: "8px",
    paddingRight: "10px",
    boxSizing: "border-box",
    '@media (max-width: 600px)': {
      paddingLeft: "0.5rem",
      paddingTop: "4px",
      paddingBottom: "4px",
      fontSize: "0.95rem"
    }
  },
  paragraph: {
    margin: '0.2rem 0',
    lineHeight: '1.5',
    color: '#2D1B4E',
    width: '100%',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    textAlign: 'justify',
    background: "rgba(255,255,255,0.7)",
    borderRadius: "6px",
    padding: "8px 14px",
    '@media (max-width: 600px)': {
      padding: "5px 6px",
      fontSize: "0.95rem"
    }
  },
  listContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    padding: "0",
    '@media (max-width: 600px)': {
      gap: "0.15rem"
    }
  },
  harmoniaNumero: {
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid rgba(45, 27, 78, 0.1)'
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
    coresFavoraveis, // <-- adicione aqui
  } = context.query;

  const safeNome = nome ? decodeURIComponent(nome).trim() : "Nome Padrão";
  const safeDataNascimento = dataNascimento
    ? converterData(decodeURIComponent(dataNascimento).trim())
    : "2000/01/01";

  // Função auxiliar para parse seguro de JSON com decode
  const safeJSONParse = (str, defaultValue = {}) => {
    if (!str) return defaultValue;
    try {
      const decoded = decodeURIComponent(str);
      // Remove possíveis caracteres inválidos no início e fim
      const cleaned = decoded.replace(/^\s+|\s+$/g, '');
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Erro ao fazer parse do JSON:', error, str);
      return defaultValue;
    }
  };

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
    desafios: safeJSONParse(desafios),
    respostaSubconsciente: respostaSubconsciente || "",
    tendenciasOcultas: tendenciasOcultas
      ? decodeURIComponent(tendenciasOcultas).split(",").map(x => x.trim())
      : [],
    momentosDecisivos: safeJSONParse(momentosDecisivos),
    ciclosDeVida: safeJSONParse(ciclosParam),
    harmoniaConjugal: safeJSONParse(context.query.harmoniaConjugal, {
      numero: 0,
      vibra: [],
      atrai: [],
      oposto: [],
      passivo: []
    }),
    aptidoesProfissionais: context.query.aptidoesProfissionais || '',
    // Corrija para garantir que o numeral é um número válido
    coresFavoraveis: coresFavoraveis && !isNaN(Number(coresFavoraveis)) ? Number(coresFavoraveis) : null,
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
    // { label: "Cores Favoráveis", key: "coresFavoraveis" }, // Adicione esta linha
  ];

  // Busca blocos de texto do Notion para todos os campos necessários
  try {
    // Blocos básicos
    const blocosTextos = {};
    await Promise.all(
      campos.map(async (campo) => {
        try {
          // Busca os blocos do Notion para cada campo usando o valor correspondente
          const blocks = await buscarBlocosPorCampo(
            campo.label,
            resultados[campo.key]?.toString()
          );
          blocosTextos[campo.label] = blocks;
        } catch (error) {
          console.error("Erro buscando blocos para", campo.label, error);
          blocosTextos[campo.label] = [];
        }
      })
    );
    resultados.blocosTextos = blocosTextos;

    // Blocos de introdução
    resultados.introducaoBlocos = await buscarBlocosPorCampo("Introdução", "1");

    // Blocos de conclusão
    resultados.conclusaoBlocos = await buscarBlocosPorCampo("Conclusão", "1");

    // Blocos de Resposta do Subconsciente
    resultados.blocosRespostaSubconsciente = await buscarBlocosPorCampo(
      "Resposta do Subconsciênte",
      resultados.respostaSubconsciente?.toString()
    );

    // Blocos de Ano Pessoal
    resultados.blocosAnoPessoal = await buscarBlocosPorCampo(
      "Ano Pessoal",
      resultados.anoPessoal?.toString()
    );

    // Blocos de Momentos Decisivos (Introdução e Detalhes)
    resultados.blocosMomentosDecisivosIntroducao = await buscarBlocosPorCampo("Introdução Momentos Decisivos", "1");

    // Busca os textos específicos para cada momento decisivo
    const blocosMomentosDecisivosDetalhados = {};
    for (let i = 1; i <= 4; i++) {
      const momento = resultados.momentosDecisivos[`momento${i}`];
      if (momento) {
        const blocks = await buscarBlocosPorCampo(`${i}º Momento Decisivo`, momento.toString());
        blocosMomentosDecisivosDetalhados[i] = blocks;
      }
    }
    resultados.blocosMomentosDecisivosDetalhados = blocosMomentosDecisivosDetalhados;

    // Blocos de Harmonia Conjugal
    if (resultados.harmoniaConjugal?.numero) {
      resultados.blocosHarmoniaConjugal = await buscarBlocosPorCampo(
        "Harmonia Conjugal",
        resultados.harmoniaConjugal.numero.toString()
      );
    }

    // Blocos de Dias Favoráveis (sempre busca pelo valor 1)
    resultados.blocosDiasFavoraveis = await buscarBlocosPorCampo("Dias Favoráveis", "1");

    // Blocos de Tendências Ocultas (subitens)
    const blocosTendenciasOcultas = {};
    if (Array.isArray(resultados.tendenciasOcultas)) {
      for (const tendencia of resultados.tendenciasOcultas) {
        blocosTendenciasOcultas[tendencia] = await buscarBlocosPorCampo(
          "Tendência Oculta",
          tendencia.toString()
        );
      }
    }
    resultados.blocosTendenciasOcultas = blocosTendenciasOcultas;

    // Fetch introduction blocks for all sections with static value "1"
    resultados.blocosTendenciasOcultasIntroducao = await buscarBlocosPorCampo(
      "Introdução Tendências Ocultas",
      "1"
    );

    resultados.blocosDebitosCarmicosIntroducao = await buscarBlocosPorCampo(
      "Introdução Débitos Cármicos",
      "1"
    );

    resultados.blocosLicoesCarmicasIntroducao = await buscarBlocosPorCampo(
      "Introdução Lições Cármicas",
      "1"
    );

    resultados.blocosDesafiosIntroducao = await buscarBlocosPorCampo(
      "Introdução Desafios",
      "1"
    );

    // Blocos de Ciclos de Vida
    if (resultados.ciclosDeVida && resultados.ciclosDeVida.ciclos) {
      // Blocos de introdução dos ciclos
      resultados.blocosCiclosIntroducao = await buscarBlocosPorCampo(
        "Introdução Ciclos de Vida",
        "1"
      );

      const blocosCiclos = [];
      for (let i = 0; i < resultados.ciclosDeVida.ciclos.length; i++) {
        const ciclo = resultados.ciclosDeVida.ciclos[i];
        try {
          // Busca usando título exato e regente
          const titulo = `${i + 1}º Ciclo`;
          const regente = ciclo.regente?.toString() || '';
          const blocks = await buscarBlocosPorCampo(titulo, regente);
          blocosCiclos[i] = blocks || [];
        } catch (error) {
          console.error(`Erro ao buscar blocos para ciclo ${i + 1}:`, error);
          blocosCiclos[i] = [];
        }
      }
      resultados.blocosCiclos = blocosCiclos;
    }

    // Blocos de Débitos Cármicos
    const blocosDebitosCarmicos = {};
    for (const debito of resultados.debitosCarmicos || []) {
      const blocks = await buscarBlocosPorCampo("Débito Cármico", debito.toString());
      if (blocks && blocks.length > 0) {
        blocosDebitosCarmicos[debito] = blocks;
      }
    }
    resultados.blocosDebitosCarmicos = blocosDebitosCarmicos;

    // Blocos de Lições Cármicas
    const blocosLicoesCarmicas = {};
    for (const licao of resultados.licoesCarmicas || []) {
      const blocks = await buscarBlocosPorCampo("Lição Cármica", licao.toString());
      if (blocks && blocks.length > 0) {
        blocosLicoesCarmicas[licao] = blocks;
      }
    }
    resultados.blocosLicoesCarmicas = blocosLicoesCarmicas;

    // Blocos de Desafios
    if (resultados.desafios) {
      const blocosDesafios = {};
      const desafiosLabels = [
        { key: "desafio1", label: "1º Desafio" },
        { key: "desafio2", label: "2º Desafio" },
        { key: "desafioPrincipal", label: "3º Desafio (Principal)" }
      ];

      for (const { key, label } of desafiosLabels) {
        if (resultados.desafios[key]) {
          blocosDesafios[label] = await buscarBlocosPorCampo(label, resultados.desafios[key].toString());
        }
      }
      resultados.blocosDesafios = blocosDesafios;
    }

    // Add this block for Professional Aptitudes
    resultados.blocosAptidoesProfissionais = await buscarBlocosPorCampo(
      "Aptidões e Potencialidades Profissionais",
      resultados.aptidoesProfissionais?.toString()
    );

    // Buscar blocos para Cores Favoráveis usando o numeral correto
    resultados.blocosCoresFavoraveis = resultados.coresFavoraveis
      ? await buscarBlocosPorCampo("Cores Favoráveis", resultados.coresFavoraveis)
      : [];

  } catch (error) {
    console.error("Erro ao buscar blocos do Notion:", error);
  }

  return {
    props: {
      nome: safeNome,
      dataNascimento: safeDataNascimento,
      resultados,
    },
  };
}