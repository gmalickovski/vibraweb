// DocumentBlock.tsx — renders a single block of the numerology document.

import type { DocumentBlock as Block, BlockType, ArcanoInfo } from '../../lib/document-builder'
import type { DocTheme } from '../../lib/theme-resolver'
import { MarkdownParagraphs, MarkdownInline } from '../shared/Markdown'

interface Props {
  block: Block
  theme: DocTheme
}

const accentHex: Record<string, string> = {
  gold: '#D4AF37',
  coral: '#E85D04',
  magenta: '#C0397B',
  info: '#8E7DDB',
}

function getAccentColor(accent: string, theme: DocTheme): string {
  if (accent === 'gold') return theme.accentColor
  if (accent === 'coral' || accent === 'magenta') return theme.primaryColor
  return accentHex[accent] ?? theme.primaryColor
}

// Introdução da categoria (texto configurável em "Textos" → Introduções de
// Categoria, estatico_def_<id>) — mesmo tratamento visual em todo tipo de
// bloco que tenha uma (number-entry, list-entry, cycles-entry, timeline-entry,
// conjugal-entry). Não renderiza nada se o consultor não configurou o texto.
// O template NÃO impõe mais itálico: a formatação (itálico/negrito/sublinhado/
// subtítulo) vem exclusivamente dos marcadores markdown escritos no editor de
// Textos — o editor é a fonte da verdade da formatação.
function IntroBlockquote({ text, theme }: { text?: string; theme: DocTheme }) {
  if (!text) return null
  return (
    <blockquote style={{
      margin: '0 0 12px',
      padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
      background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.primaryColor}0D`,
      borderLeft: theme.quoteStyle === 'accented' ? `4px solid ${theme.primaryColor}` : 'none',
      borderRadius: theme.quoteStyle === 'accented' ? '0 8px 8px 0' : (theme.quoteStyle === 'subtle' ? '8px' : '0')
    }}>
      <MarkdownParagraphs
        text={text}
        style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px' }}
      />
    </blockquote>
  )
}

// Destaque visual de INSTRUÇÃO — texto que ensina o cliente a calcular algo
// sozinho (aba "Instruções" em Textos, chaves `estatico_instrucao_*`). Design
// próprio, diferente da introdução de categoria: caixa com borda tracejada na
// cor de destaque + selo com ícone de calculadora, sinalizando ao leitor que
// aquilo é um passo a passo que ele pode aplicar em qualquer data.
function InstructionCallout({ text, theme }: { text?: string; theme: DocTheme }) {
  if (!text) return null
  return (
    <div style={{
      margin: '0 0 20px',
      padding: '12px 16px',
      border: `1.5px dashed ${theme.accentColor}88`,
      borderRadius: 10,
      background: `${theme.accentColor}0A`,
      breakInside: 'avoid',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="12" x2="8.01" y2="12" /><line x1="12" y1="12" x2="12.01" y2="12" /><line x1="16" y1="12" x2="16.01" y2="12" />
          <line x1="8" y1="16" x2="8.01" y2="16" /><line x1="12" y1="16" x2="12.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" />
        </svg>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: theme.accentColor }}>
          Instrução — calcule você mesmo
        </span>
      </div>
      <MarkdownParagraphs text={text} style={{ fontSize: 10.5, lineHeight: 1.8, color: theme.bodyColor, margin: '0 0 8px' }} />
    </div>
  )
}

export function DocumentBlockRenderer({ block, theme }: Props) {
  switch (block.type as BlockType) {

    case 'group':
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''}>
          {block.children?.map(child => (
            <DocumentBlockRenderer key={child.id} block={child} theme={theme} />
          ))}
        </div>
      )

    case 'page-break':
      return <div style={{ pageBreakBefore: 'always', height: 0 }} />

    case 'section-heading': {
      const { label, introTexto } = block.data as { label: string; introTexto?: string }
      return (
        <div
          className={block.pageBreakBefore ? 'doc-page-break' : ''}
          style={{ marginBottom: 28 }}
        >
          <h2 style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '.1em',
            color: theme.h2Color,
            margin: '0 0 8px',
            fontFamily: "'Poppins', sans-serif",
          }}>
            {label}
          </h2>
          <div style={{ height: 2, width: 48, background: theme.accentColor, borderRadius: 2, marginBottom: introTexto ? 16 : 0 }} />
          <IntroBlockquote text={introTexto} theme={theme} />
        </div>
      )
    }

    case 'number-entry': {
      const { label, value, accent, titulo, texto, definicaoTexto, instrucaoTexto, isHeaderOnly, isContinuation } = block.data as any
      const color = getAccentColor(accent || 'coral', theme)

      if (isHeaderOnly) {
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 20, alignItems: 'start', marginBottom: 12, breakInside: 'avoid' }}>
            <div style={{
              fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 52, lineHeight: 1,
              color, textAlign: 'center', border: `2px solid ${color}22`, borderRadius: 12, padding: '12px 0'
            }}>
              {value ?? '—'}
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 4 }}>
                {titulo}
              </div>
            </div>
          </div>
        )
      }

      if (isContinuation) {
        return (
          <div style={{ marginBottom: 20, fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
            <MarkdownParagraphs
              text={texto}
              style={{ margin: '0 0 10px' }}
            />
          </div>
        )
      }

      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 36 }}>
          {definicaoTexto && (
            <>
              <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h2Color, fontWeight: 800, margin: '0 0 16px' }}>
                {label}
              </h2>
              <blockquote style={{
                margin: '0 0 24px',
                padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
                background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.primaryColor}0D`,
                borderLeft: theme.quoteStyle === 'accented' ? `4px solid ${theme.primaryColor}` : 'none',
                borderRadius: theme.quoteStyle === 'accented' ? '0 8px 8px 0' : (theme.quoteStyle === 'subtle' ? '8px' : '0')
              }}>
                <MarkdownParagraphs
                  text={definicaoTexto}
                  style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px' }}
                />
              </blockquote>
            </>
          )}
          <InstructionCallout text={instrucaoTexto} theme={theme} />

          <div style={{
            display: 'grid',
            gridTemplateColumns: '72px 1fr',
            gap: 20,
            alignItems: 'start',
          }}>
            <div style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 52,
              lineHeight: 1,
              color,
              textAlign: 'center',
              border: `2px solid ${color}22`,
              borderRadius: 12,
              padding: '12px 0',
            }}>
              {value ?? '—'}
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                {definicaoTexto ? `${label}: ${value ?? '-'}` : titulo}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                <MarkdownParagraphs
                  text={texto}
                  style={{ margin: '0 0 10px' }}
                  emptyFallback="Consulte um numerólogo para uma leitura personalizada deste número."
                />
              </div>
            </div>
          </div>
        </div>
      )
    }

    case 'multi-number-entry': {
      const { label, accent, definicaoTexto, items, semTexto, isContinuation } = block.data as {
        label: string
        accent: string
        definicaoTexto?: string
        items: { value: number; titulo: string; texto: string }[]
        /** Texto de ausência (ex.: estatico_sem_debitos) — exibido quando o mapa não tem nenhum item desta categoria */
        semTexto?: string
        isContinuation?: boolean
      }
      const color = getAccentColor(accent, theme)

      const getSingularLabel = (lbl: string) => {
        if (lbl.includes('Lições')) return 'Lição Cármica'
        if (lbl.includes('Débitos')) return 'Débito Cármico'
        if (lbl.includes('Tendências')) return 'Tendência Oculta'
        return lbl
      }

      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 36 }}>
          <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h2Color, fontWeight: 800, margin: '0 0 16px', fontFamily: "'Poppins', sans-serif" }}>
            {label}
          </h2>
          {definicaoTexto && (
            <blockquote style={{
              margin: '0 0 24px',
              padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
              background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.primaryColor}0D`,
              borderLeft: theme.quoteStyle === 'accented' ? `4px solid ${theme.primaryColor}` : 'none',
              borderRadius: theme.quoteStyle === 'accented' ? '0 8px 8px 0' : (theme.quoteStyle === 'subtle' ? '8px' : '0')
            }}>
              <MarkdownParagraphs
                text={definicaoTexto}
                style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px' }}
              />
            </blockquote>
          )}

          {items && items.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr',
                  gap: 20,
                  alignItems: 'start',
                  breakInside: 'avoid',
                }}>
                  <div style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 900,
                    fontSize: 52,
                    lineHeight: 1,
                    color,
                    textAlign: 'center',
                    border: `2px solid ${color}22`,
                    borderRadius: 12,
                    padding: '12px 0',
                  }}>
                    {item.value}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                      {getSingularLabel(label)}: {item.value}
                    </div>
                    <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                      <MarkdownParagraphs
                        text={item.texto}
                        style={{ margin: '0' }}
                        emptyFallback="Consulte um numerólogo para uma leitura personalizada deste número."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : semTexto ? (
            <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
              <MarkdownParagraphs text={semTexto} style={{ margin: '0 0 8px' }} />
            </div>
          ) : null}
        </div>
      )
    }

    case 'list-entry': {
      const { label, items, description } = block.data as {
        label: string
        items: (number | { label: string; value: number })[]
        description: string
      }
      return (
        <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.primaryColor, fontWeight: 700, margin: '0 0 8px' }}>
            {label}
          </h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {items.map((item, i) => {
              const val = typeof item === 'number' ? item : item.value
              const lbl = typeof item === 'object' ? item.label : null
              return (
                <span key={i} style={{
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                  padding: '4px 12px',
                  border: `1px solid ${theme.accentColor}55`,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 12,
                  color: theme.primaryColor,
                }}>
                  {lbl && <span style={{ fontSize: 9, fontWeight: 400, color: '#888' }}>{lbl}</span>}
                  {val}
                </span>
              )
            })}
          </div>
          <p style={{ fontSize: 11, color: theme.bodyColor, margin: 0 }}><MarkdownInline text={description} /></p>
        </div>
      )
    }

    case 'timeline-entry': {
      const { label, items, definicaoTexto, instrucaoTexto } = block.data as {
        label: string
        items: { title: string; subtitle: string; value: number; texto?: string }[]
        definicaoTexto?: string
        instrucaoTexto?: string
      }
      return (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h2Color, fontWeight: 800, margin: '0 0 16px' }}>
            {label}
          </h2>
          <IntroBlockquote text={definicaoTexto} theme={theme} />
          <InstructionCallout text={instrucaoTexto} theme={theme} />
          {/* Visão geral dos 12 meses de relance */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 20 }}>
            {items.map((item, i) => (
              <div key={i} style={{ border: `1px solid ${theme.primaryColor}22`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: theme.h3Color }}>{item.title}</div>
                  <div style={{ fontSize: 9, color: '#888' }}>{item.subtitle}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: theme.primaryColor }}>{item.value}</div>
              </div>
            ))}
          </div>
          {/* Explicação de cada mês */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map((item, i) => item.texto ? (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, alignItems: 'start', breakInside: 'avoid' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: theme.h3Color, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {item.title} <span style={{ color: theme.primaryColor, fontWeight: 900 }}>{item.value}</span>
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                  <MarkdownParagraphs text={item.texto} style={{ margin: '0 0 8px' }} />
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      )
    }

    case 'cycles-intro': {
      // Definições gerais de Ciclos de Vida, Desafios e Momentos Decisivos —
      // apresentadas juntas logo após o título da seção, ANTES da sequência
      // cronológica dos ciclos (estrutura do documento de referência). Cada
      // texto é configurável em "Textos" → Introduções de Categoria.
      const { definicaoCiclo, definicaoDesafio, definicaoMomento } = block.data as {
        definicaoCiclo?: string; definicaoDesafio?: string; definicaoMomento?: string
      }
      const sections = [
        { label: 'Ciclos de Vida', texto: definicaoCiclo },
        { label: 'Desafios', texto: definicaoDesafio },
        { label: 'Momentos Decisivos', texto: definicaoMomento },
      ].filter(s => s.texto)
      if (sections.length === 0) return null
      return (
        <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {sections.map(s => (
            <div key={s.label} style={{ breakInside: 'avoid' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: theme.h3Color, margin: '0 0 8px', fontFamily: "'Poppins', sans-serif" }}>
                {s.label}
              </h3>
              <blockquote style={{
                margin: 0,
                padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
                background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.primaryColor}0D`,
                borderLeft: theme.quoteStyle === 'accented' ? `4px solid ${theme.primaryColor}` : 'none',
                borderRadius: theme.quoteStyle === 'accented' ? '0 8px 8px 0' : (theme.quoteStyle === 'subtle' ? '8px' : '0')
              }}>
                <MarkdownParagraphs
                  text={s.texto}
                  style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px' }}
                />
              </blockquote>
            </div>
          ))}
        </div>
      )
    }

    case 'cycles-entry': {
      const data = block.data as any
      if (!data) return null

      const {
        index,
        inicioAno,
        fimAno,
        inicioIdade,
        fimIdade,
        regenteCiclo,
        tituloCiclo,
        textoCiclo,
      } = data

      // Nomes tradicionais dos ciclos de vida na numerologia cabalística
      const cicloNomes = ['Formativo', 'Produtivo', 'da Colheita e Compartilhamento']
      const nomeCicloFase = (cicloNomes[index - 1] ?? '').toUpperCase()

      return (
        <div style={{ marginBottom: 32 }}>
          {/* Cabeçalho do Ciclo */}
          <div style={{
            borderBottom: `2px solid ${theme.primaryColor}22`,
            paddingBottom: 8,
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}>
            <h2 style={{
              fontSize: 15,
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              color: theme.h2Color,
              fontWeight: 800,
              margin: 0,
            }}>
              {index}º Ciclo de Vida — O Ciclo {nomeCicloFase}
            </h2>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.primaryColor,
              fontFamily: "'Inter', sans-serif",
            }}>
              {inicioAno} a {fimAno} ({inicioIdade === 0 ? 'de 0' : `de ${inicioIdade}`} a {fimIdade === 'fim' ? 'fim da vida' : `${fimIdade}`} anos)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Grid 1: Ciclo de Vida */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '72px 1fr',
              gap: 20,
              alignItems: 'start',
              breakInside: 'avoid',
            }}>
              <div style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 900,
                fontSize: 52,
                lineHeight: 1,
                color: theme.accentColor,
                textAlign: 'center',
                border: `2px solid ${theme.accentColor}22`,
                borderRadius: 12,
                padding: '12px 0',
              }}>
                {regenteCiclo}
              </div>
              <div>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                  Regente do Ciclo: {regenteCiclo} — {tituloCiclo}
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                  <MarkdownParagraphs text={textoCiclo} style={{ margin: '0 0 8px' }} />
                </div>
              </div>
            </div>

            {/* Grid 2: Desafio correspondente */}
            {index === 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr',
                gap: 20,
                alignItems: 'start',
                breakInside: 'avoid',
              }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 900,
                  fontSize: 52,
                  lineHeight: 1,
                  color: theme.primaryColor,
                  textAlign: 'center',
                  border: `2px solid ${theme.primaryColor}22`,
                  borderRadius: 12,
                  padding: '12px 0',
                }}>
                  {data.regenteDesafio}
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                    Desafio do Período: {data.regenteDesafio} — {data.tituloDesafio}
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                    <MarkdownParagraphs text={data.textoDesafio} style={{ margin: '0 0 8px' }} />
                  </div>
                </div>
              </div>
            )}

            {index === 2 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr',
                gap: 20,
                alignItems: 'start',
                breakInside: 'avoid',
              }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 900,
                  fontSize: 52,
                  lineHeight: 1,
                  color: theme.primaryColor,
                  textAlign: 'center',
                  border: `2px solid ${theme.primaryColor}22`,
                  borderRadius: 12,
                  padding: '12px 0',
                }}>
                  {data.regenteDesafio}
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                    Desafio do Período: {data.regenteDesafio} — {data.tituloDesafio}
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                    <MarkdownParagraphs text={data.textoDesafio} style={{ margin: '0 0 8px' }} />
                  </div>
                </div>
              </div>
            )}

            {index === 3 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr',
                gap: 20,
                alignItems: 'start',
                breakInside: 'avoid',
              }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 900,
                  fontSize: 52,
                  lineHeight: 1,
                  color: theme.primaryColor,
                  textAlign: 'center',
                  border: `2px solid ${theme.primaryColor}22`,
                  borderRadius: 12,
                  padding: '12px 0',
                }}>
                  {data.regenteDesafioPrincipal}
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                    Desafio Principal (Atua a vida toda): {data.regenteDesafioPrincipal} — {data.tituloDesafioPrincipal}
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                    <MarkdownParagraphs text={data.textoDesafioPrincipal} style={{ margin: '0 0 8px' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Grid 3: Momentos Decisivos correspondentes */}
            {index === 1 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr',
                gap: 20,
                alignItems: 'start',
                breakInside: 'avoid',
              }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 900,
                  fontSize: 52,
                  lineHeight: 1,
                  color: theme.primaryColor,
                  textAlign: 'center',
                  border: `2px solid ${theme.primaryColor}22`,
                  borderRadius: 12,
                  padding: '12px 0',
                }}>
                  {data.regenteMomento}
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                    Momento Decisivo do Período: {data.regenteMomento} — {data.tituloMomento}
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                    <MarkdownParagraphs text={data.textoMomento} style={{ margin: '0 0 8px' }} />
                  </div>
                </div>
              </div>
            )}

            {index === 2 && (
              <>
                {/* Momento Decisivo 2 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr',
                  gap: 20,
                  alignItems: 'start',
                  breakInside: 'avoid',
                }}>
                  <div style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 900,
                    fontSize: 52,
                    lineHeight: 1,
                    color: theme.primaryColor,
                    textAlign: 'center',
                    border: `2px solid ${theme.primaryColor}22`,
                    borderRadius: 12,
                    padding: '12px 0',
                  }}>
                    {data.regenteMomento2}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                      2º Momento Decisivo: {data.regenteMomento2} — {data.tituloMomento2}
                      <span style={{ display: 'block', fontSize: 9.5, color: '#888', textTransform: 'none', letterSpacing: 'normal', marginTop: 2 }}>
                        Período: {data.momento2InicioAno} a {data.momento2FimAno} (de {data.momento2InicioIdade} a {data.momento2FimIdade} anos)
                      </span>
                    </div>
                    <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                      <MarkdownParagraphs text={data.textoMomento2} style={{ margin: '0 0 8px' }} />
                    </div>
                  </div>
                </div>

                {/* Momento Decisivo 3 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '72px 1fr',
                  gap: 20,
                  alignItems: 'start',
                  breakInside: 'avoid',
                }}>
                  <div style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 900,
                    fontSize: 52,
                    lineHeight: 1,
                    color: theme.primaryColor,
                    textAlign: 'center',
                    border: `2px solid ${theme.primaryColor}22`,
                    borderRadius: 12,
                    padding: '12px 0',
                  }}>
                    {data.regenteMomento3}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                      3º Momento Decisivo: {data.regenteMomento3} — {data.tituloMomento3}
                      <span style={{ display: 'block', fontSize: 9.5, color: '#888', textTransform: 'none', letterSpacing: 'normal', marginTop: 2 }}>
                        Período: {data.momento3InicioAno} a {data.momento3FimAno} (de {data.momento3InicioIdade} a {data.momento3FimIdade} anos)
                      </span>
                    </div>
                    <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                      <MarkdownParagraphs text={data.textoMomento3} style={{ margin: '0 0 8px' }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {index === 3 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr',
                gap: 20,
                alignItems: 'start',
                breakInside: 'avoid',
              }}>
                <div style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 900,
                  fontSize: 52,
                  lineHeight: 1,
                  color: theme.primaryColor,
                  textAlign: 'center',
                  border: `2px solid ${theme.primaryColor}22`,
                  borderRadius: 12,
                  padding: '12px 0',
                }}>
                  {data.regenteMomento4}
                </div>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                    4º Momento Decisivo: {data.regenteMomento4} — {data.tituloMomento4}
                    <span style={{ display: 'block', fontSize: 9.5, color: '#888', textTransform: 'none', letterSpacing: 'normal', marginTop: 2 }}>
                      Período: {data.momento4InicioAno} até o final da vida (de {data.momento4InicioIdade} anos até o final)
                    </span>
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                    <MarkdownParagraphs text={data.textoMomento4} style={{ margin: '0 0 8px' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    case 'conjugal-entry': {
      const { numeroAmor, definicaoTexto, vibra, atrai, oposto, passivo, numerosInfo } = block.data as {
        numeroAmor: number
        definicaoTexto?: string
        vibra: number[]; atrai: number[]; oposto: number[]; passivo: number[]
        numerosInfo?: Record<number, { titulo: string; texto: string } | null>
      }
      if (!vibra) return null
      return (
        <div style={{ marginBottom: 36, breakInside: 'avoid' }}>
          <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h2Color, fontWeight: 800, margin: '0 0 16px', fontFamily: "'Poppins', sans-serif" }}>
            Harmonia Conjugal
          </h2>
          <IntroBlockquote text={definicaoTexto} theme={theme} />
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, margin: '0 0 16px' }}>
            Harmonia Conjugal: {numeroAmor}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {([
              { label: 'Vibra com', values: vibra },
              { label: 'Atrai', values: atrai },
              { label: 'Oposto', values: oposto },
              { label: 'Passivo', values: passivo },
            ] as const).map(row => row.values.length === 0 ? null : (
              <div key={row.label} style={{ breakInside: 'avoid' }}>
                <div style={{
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em',
                  color: theme.primaryColor, fontWeight: 700, marginBottom: 8,
                }}>
                  {row.label} {row.values.join(', ')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {row.values.map(v => {
                    const info = numerosInfo?.[v]
                    if (!info?.texto) return null
                    return (
                      <div key={v} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'start' }}>
                        <div style={{
                          fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 16,
                          color: theme.primaryColor, textAlign: 'center',
                        }}>
                          {v}
                        </div>
                        <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                          <MarkdownParagraphs text={info.texto} style={{ margin: '0 0 8px' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'triangulo-piramide': {
      const { trianguloDaVida, bloqueiosInfo, semBloqueiosTexto } = block.data as any
      if (!trianguloDaVida) return null

      const linhas: number[][] = trianguloDaVida.linhas ?? []
      const letras: string[] = trianguloDaVida.letras ?? []

      // Detecta posições de bloqueio (3+ iguais consecutivos em qualquer linha)
      const bloqueioSet = new Set<string>()
      for (let li = 0; li < linhas.length; li++) {
        const row = linhas[li]
        let i = 0
        while (i < row.length) {
          let j = i + 1
          while (j < row.length && row[j] === row[i]) j++
          if (j - i >= 3) {
            for (let k = i; k < j; k++) bloqueioSet.add(`${li}:${k}`)
          }
          i = j
        }
      }

      // Tamanho de célula adaptativo — máx 32px, mín 10px conforme nº de colunas
      const maxCols = linhas[0]?.length ?? 1
      const cellSize = Math.max(10, Math.min(32, Math.floor(480 / (maxCols + 1))))
      const fontSize = Math.max(6, Math.floor(cellSize * 0.65))

      return (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em',
            color: theme.h3Color, fontWeight: 700, margin: '0 0 16px',
          }}>
            Triângulo da Vida (Pirâmide)
          </h3>

          <div style={{
            border: `1px solid ${theme.accentColor}33`, borderRadius: 8,
            padding: '20px 12px', marginBottom: 16, overflowX: 'auto',
            background: `${theme.accentColor}08`,
          }}>
            {linhas.map((linha, li) => {
              const isBase = li === 0
              const isApex = li === linhas.length - 1
              return (
                <div key={li}>
                  {/* Linha de letras do nome acima da base da pirâmide (linha 0) */}
                  {isBase && letras.length > 0 && (
                    <div style={{
                      display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 4,
                      breakInside: 'avoid', pageBreakInside: 'avoid',
                    }}>
                      {letras.map((char, ni) => (
                        <div key={ni} style={{
                          width: cellSize, height: Math.max(12, Math.floor(cellSize * 0.8)), flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: Math.max(7, Math.floor(cellSize * 0.55)), fontWeight: 700,
                          color: theme.primaryColor,
                          fontFamily: "'Poppins', sans-serif",
                        }}>
                          {char}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Linha de números da pirâmide */}
                  <div style={{
                    display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 3,
                    breakInside: 'avoid', pageBreakInside: 'avoid',
                  }}>
                    {linha.map((num, ni) => {
                      const isBloq = bloqueioSet.has(`${li}:${ni}`)
                      const isRegent = isApex

                      let bg = '#F3F4F6'
                      let border = '#D1D5DB'
                      let color = '#1F2937'

                      if (isBloq) {
                        bg = '#DC2626'
                        border = '#B91C1C'
                        color = '#FFFFFF'
                      } else if (isRegent) {
                        bg = theme.primaryColor
                        border = theme.primaryColor
                        color = '#FFFFFF'
                      } else if (isBase) {
                        color = theme.accentColor
                      }

                      return (
                        <div key={ni} style={{
                          width: cellSize, height: cellSize, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1.5px solid ${border}`, borderRadius: 4,
                          background: bg,
                          fontSize, fontWeight: 700, color,
                          fontFamily: "'Inter', sans-serif",
                          boxShadow: isRegent && !isBloq ? `0 0 6px ${theme.primaryColor}66` : undefined,
                        }}>
                          {num}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bloqueios encontrados — texto vem do banco (tipo 'pessoal_bloqueio',
              editável em Textos → Débitos, Dias e Bloqueios); o mapa embutido
              de numerology.ts é só fallback. Formatação (itálico etc.) vem dos
              marcadores markdown do próprio texto. */}
          {trianguloDaVida.bloqueios?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trianguloDaVida.bloqueios.map((b: { codigo: string; titulo: string; descricao: string; aspectoSaude: string }) => {
                const info = bloqueiosInfo?.[b.codigo] as { titulo: string; texto: string } | null | undefined
                const titulo = info?.titulo ?? b.titulo
                const texto = info?.texto ?? `${b.descricao}\n\nAspecto de saúde: ${b.aspectoSaude}`
                return (
                  <div key={b.codigo} style={{
                    padding: '12px 16px',
                    border: `1px solid #fca5a5`,
                    borderLeft: `4px solid #dc2626`,
                    borderRadius: 8,
                    background: '#fff5f5',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                      {titulo}
                    </div>
                    <MarkdownParagraphs
                      text={texto}
                      style={{ fontSize: 11, lineHeight: 1.7, color: theme.bodyColor, margin: '0 0 6px' }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* Sem bloqueios — texto de ausência (estatico_sem_bloqueios,
              editável em Textos → Débitos, Dias e Bloqueios) */}
          {!(trianguloDaVida.bloqueios?.length > 0) && semBloqueiosTexto && (
            <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
              <MarkdownParagraphs text={semBloqueiosTexto} style={{ margin: '0 0 8px' }} />
            </div>
          )}
        </div>
      )
    }

    case 'triangulo-arcano-regente': {
      const { arcanoRegente, arcanoInfo } = block.data as { arcanoRegente: number; arcanoInfo: ArcanoInfo | null }
      if (arcanoRegente === undefined || arcanoRegente === null) return null

      return (
        <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '72px 1fr',
            gap: 20,
            alignItems: 'start',
          }}>
            <div style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 52,
              lineHeight: 1,
              color: theme.primaryColor,
              textAlign: 'center',
              border: `2px solid ${theme.primaryColor}22`,
              borderRadius: 12,
              padding: '12px 0',
            }}>
              {arcanoRegente}
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                Arcano Regente {arcanoRegente}: {arcanoInfo ? arcanoInfo.nome : `Arcano ${arcanoRegente}`}
              </div>
              {arcanoInfo && (
                <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                  <MarkdownParagraphs text={arcanoInfo.descricao} style={{ margin: '0 0 8px' }} />
                  {arcanoInfo.desafio && (
                    <p style={{ margin: 0 }}>
                      <strong>Desafio:</strong> <MarkdownInline text={arcanoInfo.desafio} />
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    case 'triangulo-arcano-vigente': {
      const { arcanoAtual, sequenciaCompleta, arcanoInfo } = block.data as any
      if (!arcanoAtual || arcanoAtual.numero === null) return null

      const duracaoTotal = arcanoAtual.duracaoCiclo ?? (90 / (sequenciaCompleta?.length || 1))

      return (
        <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '72px 1fr',
            gap: 20,
            alignItems: 'start',
          }}>
            <div style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 900,
              fontSize: 52,
              lineHeight: 1,
              color: theme.primaryColor,
              textAlign: 'center',
              border: `2px solid ${theme.primaryColor}22`,
              borderRadius: 12,
              padding: '12px 0',
            }}>
              {arcanoAtual.numero}
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                Arcano Vigente {arcanoAtual.numero}: {arcanoInfo ? arcanoInfo.nome : `Arcano ${arcanoAtual.numero}`}
                <span style={{ display: 'block', fontSize: 9.5, color: '#888', textTransform: 'none', letterSpacing: 'normal', marginTop: 2 }}>
                  Período: {arcanoAtual.periodo} (Idade {arcanoAtual.idadeInicio} a {arcanoAtual.idadeFim} anos — duração aprox. {duracaoTotal.toFixed(1).replace('.', ',')} anos)
                </span>
              </div>
              {arcanoInfo && (
                <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                  <MarkdownParagraphs text={arcanoInfo.descricao} style={{ margin: '0 0 8px' }} />
                  {arcanoInfo.desafio && (
                    <p style={{ margin: 0 }}>
                      <strong>Desafio:</strong> <MarkdownInline text={arcanoInfo.desafio} />
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    case 'triangulo-arcanos-lista': {
      const { sequenciaCompleta, arcanoAtual, arcanosInfo } = block.data as any
      if (!sequenciaCompleta || sequenciaCompleta.length === 0) return null

      // Obter lista única de arcanos para renderizar as interpretações detalhadas abaixo
      const arcanosUnicos = Array.from(new Set(sequenciaCompleta)) as number[]
      const currentIdx = arcanoAtual?.indice ?? -1

      return (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em',
            color: theme.h3Color, fontWeight: 700, margin: '0 0 16px',
          }}>
            Linha do Tempo dos Arcanos (Jornada da Vida)
          </h3>

          <div style={{
            padding: '16px 20px',
            border: `1px solid ${theme.primaryColor}22`,
            borderRadius: 8,
            background: `${theme.primaryColor}08`,
            marginBottom: 28
          }}>
            <p style={{ fontSize: 11, color: theme.bodyColor, lineHeight: 1.6, margin: '0 0 14px' }}>
              Os Arcanos de Passagem mapeiam o tempo e a evolução ao longo de sua existência. Cada esfera abaixo representa um ciclo de passagem. A cor indica sua posição no tempo:
            </p>

            {/* Círculos da cronologia */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {sequenciaCompleta.map((arc: number, idx: number) => {
                let state: 'past' | 'present' | 'future' = 'future'
                if (currentIdx !== -1) {
                  if (idx < currentIdx) state = 'past'
                  else if (idx === currentIdx) state = 'present'
                }

                let bgColor = `${theme.accentColor}11`
                let borderColor = theme.accentColor
                let textColor = theme.accentColor

                if (state === 'past') {
                  bgColor = '#F3F4F6'
                  borderColor = '#9CA3AF'
                  textColor = '#9CA3AF'
                } else if (state === 'present') {
                  bgColor = theme.primaryColor
                  borderColor = theme.primaryColor
                  textColor = '#FFFFFF'
                }

                return (
                  <div key={idx} style={{
                    width: 24, height: 24, borderRadius: 12,
                    background: bgColor, border: `1.5px solid ${borderColor}`,
                    display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: textColor,
                    boxShadow: state === 'present' ? `0 0 6px ${theme.primaryColor}66` : undefined
                  }}>
                    {arc}
                  </div>
                )
              })}
            </div>

            {/* Legenda das bolinhas */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, borderTop: '1px solid #E5E7EB', paddingTop: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#6B7280' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#F3F4F6', border: '1.5px solid #9CA3AF' }} />
                <span>Ciclos passados</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#6B7280' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: theme.primaryColor }} />
                <span>Ciclo atual (Presente)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#6B7280' }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: `${theme.accentColor}11`, border: `1.5px solid ${theme.accentColor}` }} />
                <span>Ciclos futuros</span>
              </div>
            </div>
          </div>

          <h2 style={{
            fontSize: 15,
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            color: theme.h2Color,
            fontWeight: 800,
            margin: '28px 0 16px',
          }}>
            Interpretação de Cada Arcano da sua Jornada
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {arcanosUnicos.map((arcNum) => {
              const arc: ArcanoInfo | null = arcanosInfo?.[arcNum] ?? null
              if (!arc) return null
              const isCurrent = arcNum === arcanoAtual?.numero

              return (
                <div key={arcNum} style={{ breakInside: 'avoid' }}>
                  <div style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '.1em',
                    color: isCurrent ? theme.primaryColor : theme.h3Color,
                    fontWeight: 700,
                    marginBottom: 8
                  }}>
                    Arcano {arcNum}: {arc.nome} {isCurrent && <span style={{ fontSize: 9.5, color: theme.primaryColor, fontWeight: 600, textTransform: 'none', letterSpacing: 'normal', marginLeft: 6 }}>(Ativo no Presente)</span>}
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                    <MarkdownParagraphs text={arc.descricao} style={{ margin: '0 0 6px' }} />
                    {arc.desafio && (
                      <p style={{ margin: 0 }}>
                        <strong>Desafio:</strong> <MarkdownInline text={arc.desafio} />
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    case 'dia-pessoal-entry': {
      const { hoje, tituloHoje, textoHoje, definicaoTexto, instrucaoTexto, guia } = block.data as {
        hoje: number
        tituloHoje: string
        textoHoje: string
        definicaoTexto?: string
        instrucaoTexto?: string
        guia: { numero: number; titulo: string; texto: string }[]
      }
      return (
        <div style={{ marginBottom: 36, breakInside: 'avoid' }}>
          {definicaoTexto && (
            <>
              <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h2Color, fontWeight: 800, margin: '0 0 16px' }}>
                Dia Pessoal
              </h2>
              <IntroBlockquote text={definicaoTexto} theme={theme} />
            </>
          )}

          {/* Hoje, em destaque */}
          <div style={{
            display: 'grid', gridTemplateColumns: '72px 1fr', gap: 20, alignItems: 'start', marginBottom: 24,
          }}>
            <div style={{
              fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 52, lineHeight: 1,
              color: theme.primaryColor, textAlign: 'center',
              border: `2px solid ${theme.primaryColor}22`, borderRadius: 12, padding: '12px 0',
            }}>
              {hoje}
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: theme.h3Color, fontWeight: 700, marginBottom: 8 }}>
                Hoje: Dia Pessoal {hoje} — {tituloHoje}
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                <MarkdownParagraphs text={textoHoje} style={{ margin: '0 0 10px' }} emptyFallback="Consulte um numerólogo para uma leitura personalizada deste número." />
              </div>
            </div>
          </div>

          {/* Guia de referência — vale pra qualquer dia, não só hoje. A
              instrução de cálculo é editável (Textos → Instruções); o texto
              fixo antigo fica como fallback se o consultor apagar o dela. */}
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.primaryColor, fontWeight: 700, margin: '0 0 10px' }}>
            Guia de Dias Pessoais
          </h3>
          {instrucaoTexto ? (
            <InstructionCallout text={instrucaoTexto} theme={theme} />
          ) : (
            <p style={{ fontSize: 10, color: theme.bodyColor, margin: '0 0 14px' }}>
              Some o Mês Pessoal com o dia do calendário para saber o Dia Pessoal de qualquer data e consulte o significado abaixo.
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {guia.map(g => (
              <div key={g.numero} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'start', breakInside: 'avoid',
                padding: g.numero === hoje ? '6px 8px' : 0,
                background: g.numero === hoje ? `${theme.primaryColor}0D` : 'transparent',
                borderRadius: g.numero === hoje ? 6 : 0,
              }}>
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 900, fontSize: 16, color: theme.primaryColor, textAlign: 'center' }}>
                  {g.numero}
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                  <MarkdownParagraphs text={g.texto} style={{ margin: '0 0 8px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'dias-favoraveis-entry': {
      // Dias do mês favoráveis — FIXOS pra pessoa (dia+mês de nascimento) e
      // idênticos em todos os meses do ano. Chips com os dias + texto de cada
      // dia (tipo 'pessoal_dia_favoravel', editável em Textos → Débitos, Dias
      // e Bloqueios) + instrução explicando que valem pra qualquer mês.
      const { dias, definicaoTexto, instrucaoTexto, textos } = block.data as {
        dias: number[]
        definicaoTexto?: string
        instrucaoTexto?: string
        textos?: Record<number, { titulo: string; texto: string } | null>
      }
      if (!dias || dias.length === 0) return null
      return (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h2Color, fontWeight: 800, margin: '0 0 16px' }}>
            Dias Favoráveis do Mês
          </h2>
          <IntroBlockquote text={definicaoTexto} theme={theme} />
          <InstructionCallout text={instrucaoTexto} theme={theme} />

          {/* Os dias, de relance */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {dias.map(d => (
              <span key={d} style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
                minWidth: 52, padding: '6px 10px',
                border: `1px solid ${theme.accentColor}55`, borderRadius: 10,
              }}>
                <span style={{ fontSize: 8.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: '#888' }}>Dia</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: theme.primaryColor, fontFamily: "'Poppins', sans-serif", lineHeight: 1.2 }}>{d}</span>
              </span>
            ))}
          </div>

          {/* Vibração de cada dia favorável */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {dias.map(d => textos?.[d]?.texto ? (
              <div key={d} style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 14, alignItems: 'start', breakInside: 'avoid' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: theme.h3Color, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Dia <span style={{ color: theme.primaryColor, fontWeight: 900 }}>{d}</span>
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                  <MarkdownParagraphs text={textos[d]!.texto} style={{ margin: '0 0 8px' }} />
                </div>
              </div>
            ) : null)}
          </div>
        </div>
      )
    }

    case 'orientation': {
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: theme.h2Color,
            margin: '0 0 12px', fontFamily: "'Poppins', sans-serif",
          }}>
            Orientação
          </h2>
          <MarkdownParagraphs
            text={block.data?.textoOrientacao as string}
            style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 12px' }}
          />
        </div>
      )
    }

    // Bloco "Importante" — separado de 'orientation' em 2026-07-11 (agora é um
    // bloco próprio, reordenável/ocultável independentemente na tela Blocos do Relatório).
    case 'importante': {
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: theme.h2Color,
            margin: '0 0 12px', fontFamily: "'Poppins', sans-serif",
          }}>
            Importante
          </h2>
          <MarkdownParagraphs
            text={block.data?.texto as string}
            style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 12px' }}
          />
        </div>
      )
    }

    // Bloco "Conclusão" — novo em 2026-07-11 (estrutura/posição é Fase 1; o texto
    // em si é conteúdo Fase 2, ainda não configurado em nenhum perfil — ver
    // Produto/docs/vibra-web/requisitos.md, seção 3a).
    case 'conclusion': {
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: theme.h2Color,
            margin: '0 0 12px', fontFamily: "'Poppins', sans-serif",
          }}>
            Conclusão
          </h2>
          <MarkdownParagraphs
            text={block.data?.texto as string}
            style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 12px' }}
            emptyFallback={
              <p style={{ fontSize: 11, lineHeight: 1.9, color: '#999', margin: 0, fontStyle: 'italic' }}>
                Texto de conclusão ainda não configurado.
              </p>
            }
          />
        </div>
      )
    }

    case 'summary-list': {
      const data = block.data as Record<string, string | number | null>
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: theme.h2Color, margin: '0 0 16px', fontFamily: "'Poppins', sans-serif" }}>
            Os Seus Números
          </h2>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            fontSize: 12, color: theme.bodyColor, fontFamily: "'Inter', sans-serif",
            padding: '16px 20px', background: `${theme.primaryColor}08`,
            border: `1px solid ${theme.primaryColor}22`, borderRadius: 12,
            marginBottom: 24
          }}>
            {[
              { label: 'Nome', key: 'subject' },
              { label: 'Data de Nascimento', key: 'dataNascimento' },
              { label: 'Motivação', key: 'motivacao' },
              { label: 'Impressão', key: 'impressao' },
              { label: 'Expressão', key: 'expressao' },
              { label: 'Talento Oculto', key: 'talentoOculto' },
              { label: 'Aptidões Profissionais', key: 'aptidoesProfissionais' },
              { label: 'Dia Natalício', key: 'diaNatalicio' },
              { label: 'Número Psíquico', key: 'psiquico' },
              { label: 'Destino', key: 'destino' },
              { label: 'Missão', key: 'missao' },
              { label: 'Lições Cármicas', key: 'licoesCarmicas' },
              { label: 'Tendências Ocultas', key: 'tendenciasOcultas' },
              { label: 'Resposta Subconsciente', key: 'respostaSubconsciente' },
              { label: 'Débitos Cármicos', key: 'debitosCarmicos' },
              { label: 'Ciclos de Vida', key: 'ciclosDeVida' },
              { label: 'Desafios', key: 'desafios' },
              { label: 'Momentos Decisivos', key: 'momentosDecisivos' },
              { label: 'Ano Pessoal', key: 'anoPessoal' },
              { label: 'Dia Pessoal', key: 'diaPessoal' },
              { label: 'Dias Favoráveis', key: 'diasFavoraveis' },
              { label: 'Números Harmônicos', key: 'numerosHarmonicos' },
              { label: 'Arcano Regente', key: 'arcanoRegente' },
              { label: 'Arcano Atual', key: 'arcanoAtual' },
            ].map(({ label, key }) => {
              if (data[key] === null || data[key] === undefined || data[key] === '') return null
              return (
                <div key={key}>
                  <strong style={{ color: theme.h3Color }}>{label}:</strong> {data[key]}
                </div>
              )
            })}
          </div>

          <h2 style={{
            fontSize: 15, fontWeight: 700, color: theme.h2Color,
            margin: '0 0 12px', fontFamily: "'Poppins', sans-serif",
          }}>
            Importante
          </h2>
          <MarkdownParagraphs
            text={data.textoImportante as string}
            style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px' }}
          />
        </div>
      )
    }

    case 'summary-table': {
      const { rows } = block.data as { rows: { label: string; value: number }[] }
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: theme.h2Color, margin: '0 0 16px', fontFamily: "'Poppins', sans-serif" }}>
            Seus Números
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {rows.map(r => (
              <div key={r.label} style={{
                textAlign: 'center',
                padding: '12px 8px',
                border: `1px solid ${theme.accentColor}44`,
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: theme.primaryColor }}>{r.value}</div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.07em', color: '#888', marginTop: 4 }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}
