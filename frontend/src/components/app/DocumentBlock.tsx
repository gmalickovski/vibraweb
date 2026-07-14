// DocumentBlock.tsx — renders a single block of the numerology document.

import type { DocumentBlock as Block, BlockType } from '../../lib/document-builder'
import type { DocTheme } from '../../lib/theme-resolver'
import { MarkdownParagraphs, MarkdownInline } from '../shared/Markdown'
import { ARCANOS } from '../../lib/arcanos'

interface Props {
  block: Block
  theme: DocTheme
}

const HARMONIA_TABLE: Record<number, { vibra: number[]; atrai: number[]; oposto?: number[]; passivo?: number[] }> = {
  1: { vibra: [9], atrai: [4, 8], oposto: [6, 7], passivo: [2, 3, 5] },
  2: { vibra: [8], atrai: [7, 9], oposto: [5],    passivo: [1, 3, 4, 6] },
  3: { vibra: [7], atrai: [5, 6, 9], oposto: [4, 8], passivo: [1, 2] },
  4: { vibra: [6], atrai: [1, 8], oposto: [3, 5], passivo: [2, 7, 9] },
  5: { vibra: [5], atrai: [3, 9], oposto: [2, 4, 6], passivo: [1, 7, 8] },
  6: { vibra: [4], atrai: [3, 7, 9], oposto: [1, 5, 8], passivo: [2] },
  7: { vibra: [3], atrai: [2, 6], oposto: [1, 9], passivo: [4, 5, 8] },
  8: { vibra: [2], atrai: [1, 4], oposto: [3, 6], passivo: [5, 7, 9] },
  9: { vibra: [1], atrai: [2, 3, 5, 6], passivo: [4, 8] },
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
function IntroBlockquote({ text, theme }: { text?: string; theme: DocTheme }) {
  if (!text) return null
  return (
    <blockquote style={{
      fontSize: 11,
      lineHeight: 1.9,
      color: theme.bodyColor,
      margin: '0 0 12px',
      fontStyle: 'italic',
      padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
      background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.primaryColor}0D`,
      borderLeft: theme.quoteStyle === 'accented' ? `4px solid ${theme.primaryColor}` : 'none',
      borderRadius: theme.quoteStyle === 'accented' ? '0 8px 8px 0' : (theme.quoteStyle === 'subtle' ? '8px' : '0')
    }}>
      <MarkdownInline text={text} />
    </blockquote>
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
      const { label } = block.data as { label: string }
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
          <div style={{ height: 2, width: 48, background: theme.accentColor, borderRadius: 2 }} />
        </div>
      )
    }

    case 'number-entry': {
      const { label, value, accent, titulo, texto, definicaoTexto } = block.data as {
        label: string; value: number | null; accent: string; titulo: string; texto: string; definicaoTexto?: string
      }
      const color = getAccentColor(accent, theme)
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 36 }}>
          {definicaoTexto && (
            <>
              <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h2Color, fontWeight: 800, margin: '0 0 16px' }}>
                {label}
              </h2>
              <blockquote style={{
                fontSize: 11,
                lineHeight: 1.9,
                color: theme.bodyColor,
                margin: '0 0 24px',
                fontStyle: 'italic',
                padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
                background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.primaryColor}0D`,
                borderLeft: theme.quoteStyle === 'accented' ? `4px solid ${theme.primaryColor}` : 'none',
                borderRadius: theme.quoteStyle === 'accented' ? '0 8px 8px 0' : (theme.quoteStyle === 'subtle' ? '8px' : '0')
              }}>
                <MarkdownInline text={definicaoTexto} />
              </blockquote>
            </>
          )}

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
      const { label, accent, definicaoTexto, items } = block.data as {
        label: string
        accent: string
        definicaoTexto?: string
        items: { value: number; titulo: string; texto: string }[]
      }
      const color = getAccentColor(accent, theme)

      const getSingularLabel = (lbl: string) => {
        if (lbl === 'Lições Cármicas') return 'Lição Cármica'
        if (lbl === 'Débitos Cármicos') return 'Débito Cármico'
        if (lbl === 'Tendências Ocultas') return 'Tendência Oculta'
        return lbl
      }

      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 36 }}>
          <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h2Color, fontWeight: 800, margin: '0 0 16px', fontFamily: "'Poppins', sans-serif" }}>
            {label}
          </h2>
          {definicaoTexto && (
            <blockquote style={{
              fontSize: 11,
              lineHeight: 1.9,
              color: theme.bodyColor,
              margin: '0 0 24px',
              fontStyle: 'italic',
              padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
              background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.primaryColor}0D`,
              borderLeft: theme.quoteStyle === 'accented' ? `4px solid ${theme.primaryColor}` : 'none',
              borderRadius: theme.quoteStyle === 'accented' ? '0 8px 8px 0' : (theme.quoteStyle === 'subtle' ? '8px' : '0')
            }}>
              <MarkdownInline text={definicaoTexto} />
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
          <p style={{ fontSize: 11, color: theme.bodyColor, margin: 0, fontStyle: 'italic' }}><MarkdownInline text={description} /></p>
        </div>
      )
    }

    case 'timeline-entry': {
      const { label, items, definicaoTexto } = block.data as {
        label: string
        items: { title: string; subtitle: string; value: number }[]
        definicaoTexto?: string
      }
      return (
        <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.primaryColor, fontWeight: 700, margin: '0 0 12px' }}>
            {label}
          </h3>
          <IntroBlockquote text={definicaoTexto} theme={theme} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
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
                  <MarkdownInline text={textoCiclo} />
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
                    <MarkdownInline text={data.textoDesafio} />
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
                    <MarkdownInline text={data.textoDesafio} />
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
                    <MarkdownInline text={data.textoDesafioPrincipal} />
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
                    <MarkdownInline text={data.textoMomento} />
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
                      <MarkdownInline text={data.textoMomento2} />
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
                      <MarkdownInline text={data.textoMomento3} />
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
                    <MarkdownInline text={data.textoMomento4} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    case 'conjugal-entry': {
      const { numeroAmor, definicaoTexto } = block.data as { numeroAmor: number; definicaoTexto?: string }
      const h = HARMONIA_TABLE[numeroAmor]
      if (!h) return null
      return (
        <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h3Color, fontWeight: 700, margin: '0 0 12px' }}>
            Harmonia Conjugal — Número {numeroAmor}
          </h3>
          <IntroBlockquote text={definicaoTexto} theme={theme} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {([
              { label: 'Vibra com', values: h.vibra },
              { label: 'Atrai', values: h.atrai },
              { label: 'Oposto', values: h.oposto ?? [] },
              { label: 'Passivo', values: h.passivo ?? [] },
            ] as const).map(row => (
              <div key={row.label} style={{ padding: '8px 12px', border: `1px solid ${theme.accentColor}33`, borderRadius: 8 }}>
                <span style={{ fontSize: 9, textTransform: 'uppercase', color: '#888', letterSpacing: '.06em' }}>{row.label}</span>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {row.values.map(v => (
                    <span key={v} style={{ fontWeight: 700, color: theme.primaryColor, fontSize: 14 }}>{v}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'triangulo-piramide': {
      const { trianguloDaVida } = block.data as any
      if (!trianguloDaVida) return null

      const linhas: number[][] = trianguloDaVida.linhas ?? []

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
        <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
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
                <div key={li} style={{
                  display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 3,
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
                      bg = '#3B0764'
                      border = '#6D28D9'
                      color = '#EDE9FE'
                    } else if (isBase) {
                      color = '#D4AF37'
                    }

                    return (
                      <div key={ni} style={{
                        width: cellSize, height: cellSize, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1.5px solid ${border}`, borderRadius: 4,
                        background: bg,
                        fontSize, fontWeight: 700, color,
                        fontFamily: "'Inter', sans-serif",
                        boxShadow: isRegent && !isBloq ? `0 0 6px rgba(109, 40, 217, 0.4)` : undefined,
                      }}>
                        {num}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Bloqueios encontrados */}
          {trianguloDaVida.bloqueios?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {trianguloDaVida.bloqueios.map((b: { codigo: string; titulo: string; descricao: string; aspectoSaude: string }) => (
                <div key={b.codigo} style={{
                  padding: '12px 16px',
                  border: `1px solid #fca5a5`,
                  borderLeft: `4px solid #dc2626`,
                  borderRadius: 8,
                  background: '#fff5f5',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                    {b.titulo}
                  </div>
                  <p style={{ fontSize: 11, lineHeight: 1.7, color: theme.bodyColor, margin: '0 0 6px' }}>
                    <MarkdownInline text={b.descricao} />
                  </p>
                  <p style={{ fontSize: 10, lineHeight: 1.6, color: '#6B7280', margin: 0, fontStyle: 'italic' }}>
                    Aspecto de saúde: <MarkdownInline text={b.aspectoSaude} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    case 'triangulo-arcano-regente': {
      const { arcanoRegente } = block.data as any
      if (arcanoRegente === undefined || arcanoRegente === null) return null

      const arcanoInfo = ARCANOS[arcanoRegente]

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
                {arcanoInfo?.palavraChave && (
                  <span style={{ display: 'block', fontSize: 9.5, color: theme.accentColor, textTransform: 'none', letterSpacing: 'normal', marginTop: 2, fontWeight: 600 }}>
                    Frequência: {arcanoInfo.palavraChave}
                  </span>
                )}
              </div>
              {arcanoInfo && (
                <div style={{ fontSize: 11, lineHeight: 1.8, color: theme.bodyColor }}>
                  <p style={{ margin: '0 0 8px' }}>{arcanoInfo.descricao}</p>
                  {arcanoInfo.desafio && (
                    <p style={{ margin: 0, padding: '8px 12px', background: `${theme.primaryColor}06`, borderRadius: 6, borderLeft: `3px solid ${theme.primaryColor}`, fontSize: 10.5, fontStyle: 'italic', color: theme.bodyColor }}>
                      <strong>Desafio:</strong> {arcanoInfo.desafio}
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
      const { arcanoAtual, sequenciaCompleta } = block.data as any
      if (!arcanoAtual || arcanoAtual.numero === null) return null

      const arcanoInfo = ARCANOS[arcanoAtual.numero]
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
                  <p style={{ margin: '0 0 8px' }}>{arcanoInfo.descricao}</p>
                  {arcanoInfo.desafio && (
                    <p style={{ margin: 0, padding: '8px 12px', background: `${theme.primaryColor}06`, borderRadius: 6, borderLeft: `3px solid ${theme.primaryColor}`, fontSize: 10.5, fontStyle: 'italic', color: theme.bodyColor }}>
                      <strong>Desafio:</strong> {arcanoInfo.desafio}
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
      const { sequenciaCompleta, arcanoAtual } = block.data as any
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
            border: '1px solid #E5E7EB',
            borderRadius: 8,
            background: '#FAFAFA',
            marginBottom: 28
          }}>
            <p style={{ fontSize: 11, color: '#4B5563', lineHeight: 1.6, margin: '0 0 14px' }}>
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

                let bgColor = '#FFFDF0'
                let borderColor = '#D4AF37'
                let textColor = '#8A661C'

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
                <div style={{ width: 8, height: 8, borderRadius: 4, background: '#FFFDF0', border: '1.5px solid #D4AF37' }} />
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
              const arc = ARCANOS[arcNum]
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
                    <p style={{ margin: '0 0 6px' }}>{arc.descricao}</p>
                    {arc.desafio && (
                      <p style={{ margin: 0, padding: '8px 12px', background: `${theme.primaryColor}06`, borderRadius: 6, borderLeft: `3px solid ${isCurrent ? theme.primaryColor : theme.h3Color}`, fontSize: 10, fontStyle: 'italic', color: theme.bodyColor }}>
                        <strong>Desafio:</strong> {arc.desafio}
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
            style={{ fontSize: 11, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px', fontStyle: 'italic' }}
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
