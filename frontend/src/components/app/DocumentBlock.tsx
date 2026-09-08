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

// Espaçamento vertical PADRÃO entre blocos do documento — fonte ÚNICA de verdade
// pra manter o MESMO respiro entre TODOS os blocos. Antes cada tipo tinha a sua
// margem (24 / 28 / 32 / 36), o que criava incoerência de espaçamento entre os
// textos ao longo do documento. Trocar aqui muda o ritmo do documento inteiro
// de uma vez. (As continuações de um bloco cortado usam gaps próprios menores —
// é o mesmo bloco atravessando a página, não dois blocos distintos.)
const DOC_GAP = 28

function getAccentColor(accent: string, theme: DocTheme): string {
  if (accent === 'gold') return theme.accentColor
  if (theme.stylePreset === 'vibracao') return theme.primaryColor
  if (accent === 'coral' || accent === 'magenta') return theme.primaryColor
  return accentHex[accent] ?? theme.primaryColor
}

function VibracaoSectionRule({ theme, marginBottom = 16 }: { theme: DocTheme; marginBottom?: number }) {
  if (theme.stylePreset !== 'vibracao') return null
  return (
    <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', gap: 9, width: 184, maxWidth: '100%', height: 18, margin: `0 auto ${marginBottom}px` }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.accentColor})` }} />
      <svg viewBox="0 0 20 20" style={{ width: 20, height: 20, flex: '0 0 auto' }}>
        <circle cx="10" cy="10" r="7" fill="none" stroke={theme.primaryColor} strokeWidth="1.2" />
        <circle cx="10" cy="10" r="3" fill={theme.accentColor} />
      </svg>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.secondaryColor}, ${theme.ornamentColor})` }} />
    </div>
  )
}

function VibracaoWaveCallout({
  children,
  theme,
  margin = '0 0 16px',
}: {
  children: React.ReactNode
  theme: DocTheme
  margin?: string
}) {
  const waveTile = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 40"><defs><linearGradient id="wave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.primaryColor}"/><stop offset=".34" stop-color="${theme.accentColor}"/><stop offset=".67" stop-color="${theme.secondaryColor}"/><stop offset="1" stop-color="${theme.ornamentColor}"/></linearGradient></defs><path d="M5 0C1 5 1 15 5 20C9 25 9 35 5 40" fill="none" stroke="url(#wave)" stroke-width="1.2"/><circle cx="5" cy="20" r="1.6" fill="${theme.accentColor}"/></svg>`,
  )
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '10px minmax(0, 1fr)', gap: 11, margin, padding: '3px 0' }}>
      <span aria-hidden="true" style={{ display: 'block', minHeight: 40, alignSelf: 'stretch', backgroundImage: `url("data:image/svg+xml,${waveTile}")`, backgroundPosition: 'center top', backgroundRepeat: 'repeat-y', backgroundSize: '10px 40px' }} />
      <div>{children}</div>
    </div>
  )
}

// Introdução da categoria (texto configurável em "Textos" → Introduções de
// Categoria, estatico_def_<id>) — mesmo tratamento visual em todo tipo de
// bloco que tenha uma (number-entry, list-entry, cycles-entry, timeline-entry,
// conjugal-entry). Não renderiza nada se o consultor não configurou o texto.
// O template NÃO impõe mais itálico: a formatação (itálico/negrito/sublinhado/
// subtítulo) vem exclusivamente dos marcadores markdown escritos no editor de
// Textos — o editor é a fonte da verdade da formatação.
function IntroBlockquote({ text, theme, isParentBlock = false }: { text?: string; theme: DocTheme; isParentBlock?: boolean }) {
  if (!text) return null
  const bodyStyle = { fontSize: theme.bodyFontSize, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px', fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }
  if (theme.plainTextMode) {
    return <div style={{ margin: '0 0 12px' }}><MarkdownParagraphs text={text} style={bodyStyle} /></div>
  }
  if (theme.stylePreset === 'holistic') {
    if (isParentBlock) {
      return <div className="doc-holistic-section-intro"><MarkdownParagraphs text={text} style={bodyStyle} /></div>
    }
    return (
      <div className="doc-holistic-callout doc-holistic-intro">
        <span className="doc-holistic-callout-mark" aria-hidden="true" />
        <div><MarkdownParagraphs text={text} style={bodyStyle} /></div>
      </div>
    )
  }
  if (theme.stylePreset === 'vibracao') {
    if (isParentBlock) {
      return <div style={{ margin: '0 0 16px' }}><MarkdownParagraphs text={text} style={bodyStyle} /></div>
    }
    return (
      <VibracaoWaveCallout theme={theme}>
        <MarkdownParagraphs text={text} style={bodyStyle} />
      </VibracaoWaveCallout>
    )
  }
  if (theme.stylePreset === 'modern') {
    const isParentStyle = isParentBlock
    return (
      <blockquote style={{
        margin: '0 0 16px', padding: '12px 16px',
        background: isParentStyle ? `${theme.primaryColor}06` : `${theme.secondaryColor}08`,
        border: `1px solid ${isParentStyle ? theme.primaryColor : theme.secondaryColor}55`,
        borderLeft: isParentStyle ? undefined : `4px solid ${theme.ornamentColor}`,
        borderTop: isParentStyle ? `3px solid ${theme.accentColor}` : undefined,
        borderRadius: 8,
      }}>
        <MarkdownParagraphs text={text} style={bodyStyle} />
      </blockquote>
    )
  }
  return (
    <blockquote style={{
      margin: '0 0 12px',
      padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
      background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.secondaryColor}0D`,
      borderLeft: isParentBlock || theme.quoteStyle === 'minimal' ? 'none' : `4px solid ${theme.secondaryColor}`,
      borderRadius: theme.quoteStyle === 'minimal' ? '0' : isParentBlock ? '8px' : '0 8px 8px 0',
    }}>
      <MarkdownParagraphs text={text} style={bodyStyle} />
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
  const bodyStyle = { fontSize: theme.bodyFontSize, lineHeight: 1.8, color: theme.bodyColor, margin: '0 0 8px', fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }
  if (theme.stylePreset === 'holistic') {
    return (
      <div className="doc-holistic-instruction">
        <div>
          <span className="doc-holistic-instruction-label">Nota de leitura</span>
          <MarkdownParagraphs text={text} style={bodyStyle} />
        </div>
      </div>
    )
  }
  if (theme.stylePreset === 'vibracao') {
    return (
      <div style={{ margin: '0 0 20px', padding: '12px 16px', border: `1.5px solid ${theme.ornamentColor}`, borderRadius: 8, breakInside: 'avoid' }}>
        <div style={{ marginBottom: 8 }}>
          <span style={{ color: theme.ornamentColor, fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Instrução — calcule você mesmo
          </span>
        </div>
        <div>
          <MarkdownParagraphs text={text} style={bodyStyle} />
        </div>
      </div>
    )
  }
  if (theme.stylePreset === 'modern') {
    return (
      <div style={{ margin: '0 0 20px', padding: '12px 16px', border: `1px solid ${theme.primaryColor}66`, borderTop: `3px solid ${theme.accentColor}`, borderRadius: 8, background: `${theme.primaryColor}05`, breakInside: 'avoid' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, paddingBottom: 7, borderBottom: `1px solid ${theme.primaryColor}22` }}>
          <span aria-hidden="true" style={{ display: 'block', width: 7, height: 7, borderRadius: 2, background: theme.accentColor }} />
          <span style={{ color: theme.primaryColor, fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>Instrução</span>
        </div>
        <MarkdownParagraphs text={text} style={bodyStyle} />
      </div>
    )
  }
  return (
    <div style={{
      margin: '0 0 20px',
      padding: '12px 16px',
      border: `1.5px dashed ${theme.secondaryColor}88`,
      borderRadius: 8,
      background: `${theme.secondaryColor}0A`,
      breakInside: 'avoid',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.secondaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <line x1="8" y1="7" x2="16" y2="7" />
          <line x1="8" y1="12" x2="8.01" y2="12" /><line x1="12" y1="12" x2="12.01" y2="12" /><line x1="16" y1="12" x2="16.01" y2="12" />
          <line x1="8" y1="16" x2="8.01" y2="16" /><line x1="12" y1="16" x2="12.01" y2="16" /><line x1="16" y1="16" x2="16.01" y2="16" />
        </svg>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: theme.secondaryColor }}>
          Instrução — calcule você mesmo
        </span>
      </div>
      <MarkdownParagraphs text={text} style={bodyStyle} />
    </div>
  )
}

function PeriodBadgeCard({ text, theme }: { text?: string; theme: DocTheme }) {
  if (!text) return null
  const formattedText = text.startsWith('Período:') ? text : `Período: ${text}`
  if (theme.stylePreset === 'holistic') {
    return <div className="doc-holistic-period">{formattedText}</div>
  }
  return (
    <div style={{ display: 'block', width: '100%', marginTop: 4, marginBottom: 8 }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: `${theme.secondaryColor}0D`,
        border: `1.5px dashed ${theme.secondaryColor}66`,
        borderRadius: 6,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.secondaryColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: theme.secondaryColor,
          fontFamily: `'${theme.bodyFont}', sans-serif`,
          letterSpacing: 'normal',
          textTransform: 'none',
        }}>
          {formattedText}
        </span>
      </div>
    </div>
  )
}

// Componente único e padronizado para renderizar qualquer card com o badge numérico de 72px.
// Usa a Cor de Destaque (theme.accentColor) para o número, borda e fundo opaco translúcido.
function NumberBadgeCard({
  value,
  theme,
  children,
}: {
  value: string | number | null | undefined
  theme: DocTheme
  children: React.ReactNode
}) {
  const accentColor = theme.accentColor
  if (theme.stylePreset === 'holistic') {
    return (
      <div className="doc-holistic-number-entry">
        <div className="doc-holistic-number">{value ?? '—'}</div>
        <div>{children}</div>
      </div>
    )
  }
  if (theme.stylePreset === 'vibracao') {
    const cardColor = theme.accentColor
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '68px minmax(0, 1fr)',
        gap: 16,
        alignItems: 'start',
        padding: '4px 0',
      }}>
        <div style={{
          display: 'grid',
          minHeight: 68,
          placeItems: 'center',
          color: cardColor,
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 500,
          fontSize: 54,
          lineHeight: 1,
          WebkitTextStroke: `1.5px ${cardColor}`,
          WebkitTextFillColor: 'transparent',
        }}>
          {value ?? '—'}
        </div>
        <div>{children}</div>
      </div>
    )
  }
  if (theme.stylePreset === 'modern') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr)', gap: 16, alignItems: 'start', padding: '4px 0' }}>
        <div style={{ display: 'grid', minHeight: 72, placeItems: 'center', borderRadius: 8, background: theme.primaryColor, color: '#FFFFFF', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 28, lineHeight: 1 }}>
          {value ?? '—'}
        </div>
        <div>{children}</div>
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 20, alignItems: 'start' }}>
      <div style={{
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 900,
        fontSize: 52,
        lineHeight: 1,
        color: accentColor,
        textAlign: 'center',
        background: `${accentColor}0D`,
        border: `1.5px solid ${accentColor}33`,
        borderRadius: 12,
        padding: '12px 0',
      }}>
        {value ?? '—'}
      </div>
      <div>
        {children}
      </div>
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
      const { label, introTexto, variant, instrucaoTexto, tone, spaceBefore, spaceAfter } = block.data as {
        label: string; introTexto?: string; instrucaoTexto?: string; tone?: 'h3' | 'h4'
        spaceBefore?: number; spaceAfter?: number
        /** 'sub'   = cabeçalho interno de lista (h3/h4)
         *  'entry' = cabeçalho de uma ENTRADA/lista (h2 800)
         *  ausente = título de SEÇÃO (h1 700). */
        variant?: 'sub' | 'entry' | 'def'
      }

      if (variant === 'entry') {
        const isUppercase = !theme.plainTextMode
        return (
          <div id={block.id} className={block.pageBreakBefore ? 'doc-page-break' : ''}>
            <h2 style={{
              fontSize: theme.h2FontSize,
              textTransform: isUppercase ? 'uppercase' : 'none',
              letterSpacing: isUppercase ? '.08em' : 'normal',
              color: theme.h2Color,
              fontWeight: theme.h2Bold ? 700 : 400,
              margin: '28px 0 10px',
              fontFamily: `'${theme.h2Font}', sans-serif`,
              fontStyle: theme.h2Italic ? 'italic' : 'normal',
              textDecoration: theme.h2Underline ? 'underline' : 'none',
              textAlign: theme.h2TextAlign,
            }}>
              {label}
            </h2>
            <IntroBlockquote text={introTexto} theme={theme} />
            <InstructionCallout text={instrucaoTexto} theme={theme} />
          </div>
        )
      }

      if (variant === 'def') {
        const bodyStyle = { fontSize: theme.bodyFontSize, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px', fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }
        const isUppercase = !theme.plainTextMode
        return (
          <div id={block.id} style={{ marginBottom: spaceAfter ?? 20 }}>
            <h2 style={{
              fontSize: theme.h2FontSize,
              textTransform: isUppercase ? 'uppercase' : 'none',
              letterSpacing: isUppercase ? '.08em' : 'normal',
              fontWeight: theme.h2Bold ? 700 : 400,
              color: theme.h2Color,
              margin: '32px 0 12px',
              fontFamily: `'${theme.h2Font}', sans-serif`,
              fontStyle: theme.h2Italic ? 'italic' : 'normal',
              textDecoration: theme.h2Underline ? 'underline' : 'none',
              textAlign: theme.h2TextAlign,
            }}>
              {label}
            </h2>
            {theme.plainTextMode ? (
              <div style={{ margin: 0 }}><MarkdownParagraphs text={introTexto} style={bodyStyle} /></div>
            ) : theme.stylePreset === 'holistic' ? (
              <IntroBlockquote text={introTexto} theme={theme} isParentBlock />
            ) : theme.stylePreset === 'vibracao' ? (
              <div style={{ margin: 0 }}><MarkdownParagraphs text={introTexto} style={bodyStyle} /></div>
            ) : theme.stylePreset === 'modern' ? (
              <IntroBlockquote text={introTexto} theme={theme} isParentBlock />
            ) : (
              <blockquote style={{
                margin: 0,
                padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
                background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.secondaryColor}0D`,
                borderLeft: theme.quoteStyle === 'minimal' ? 'none' : `4px solid ${theme.secondaryColor}`,
                borderRadius: theme.quoteStyle === 'minimal' ? '0' : '0 8px 8px 0',
              }}>
                <MarkdownParagraphs text={introTexto} style={bodyStyle} />
              </blockquote>
            )}
          </div>
        )
      }

      if (variant === 'sub') {
        const isUppercase = !theme.plainTextMode
        const isH4 = tone === 'h4'
        const Tag = isH4 ? 'h4' : 'h3'
        const fontSize = isH4 ? theme.h4FontSize : theme.h3FontSize
        const font = isH4 ? theme.h4Font : theme.h3Font
        const color = isH4 ? theme.h4Color : (tone === 'h3' ? theme.h3Color : theme.primaryColor)
        const bold = isH4 ? theme.h4Bold : theme.h3Bold
        const italic = isH4 ? theme.h4Italic : theme.h3Italic
        const underline = isH4 ? theme.h4Underline : theme.h3Underline
        const textAlign = isH4 ? theme.h4TextAlign : theme.h3TextAlign

        return (
          <div id={block.id} style={{ marginTop: spaceBefore ?? 0 }}>
            <Tag style={{
              fontSize,
              textTransform: isUppercase ? 'uppercase' : 'none',
              letterSpacing: isUppercase ? '.08em' : 'normal',
              color,
              fontWeight: bold ? 700 : 400,
              margin: `${isH4 ? 16 : 20}px 0 ${spaceAfter ?? (isH4 ? 6 : 8)}px`,
              fontFamily: `'${font}', sans-serif`,
              fontStyle: italic ? 'italic' : 'normal',
              textDecoration: underline ? 'underline' : 'none',
              textAlign,
            }}>
              {label}
            </Tag>
            <InstructionCallout text={instrucaoTexto} theme={theme} />
          </div>
        )
      }

      const isUppercase = !theme.plainTextMode
      return (
        <div
          id={block.id}
          className={block.pageBreakBefore ? 'doc-page-break' : ''}
          style={{ marginBottom: DOC_GAP }}
        >
          <h1 style={{
            fontSize: theme.h1FontSize,
            fontWeight: theme.h1Bold ? 700 : 400,
            textTransform: isUppercase ? 'uppercase' : 'none',
            letterSpacing: isUppercase ? '.1em' : 'normal',
            color: theme.h1Color,
            margin: theme.plainTextMode ? '0 0 16px' : '0 0 8px',
            fontFamily: `'${theme.h1Font}', sans-serif`,
            fontStyle: theme.h1Italic ? 'italic' : 'normal',
            textDecoration: theme.h1Underline ? 'underline' : 'none',
            textAlign: theme.h1TextAlign,
          }}>
            {label}
          </h1>
          <VibracaoSectionRule theme={theme} marginBottom={introTexto ? 16 : 0} />
          <IntroBlockquote text={introTexto} theme={theme} isParentBlock={true} />
        </div>
      )
    }

    case 'number-entry': {
      const {
        label, value, rotulo, titulo, subtitulo, texto, definicaoTexto, instrucaoTexto,
        accent, useTitulo, isHeaderOnly, isContinuation, highlight,
        emptyFallback, deferredText, hideDefLabel, defHeadOnly, variant
      } = block.data as any

      const color = accent === 'indigo' ? '#4f46e5'
        : accent === 'amber' ? '#d97706'
        : accent === 'coral' ? '#e11d48'
        : theme.primaryColor

      if (variant === 'plain') {
        const isUppercase = !theme.plainTextMode
        const plainBodyStyle = { fontSize: theme.bodyFontSize, lineHeight: 1.8, color: theme.bodyColor, fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }
        if (theme.plainTextMode) {
          return (
            <div style={{ marginBottom: 16 }}>
              {!isContinuation && (
                <h4 style={{ fontSize: theme.h4FontSize, color: theme.h4Color, fontWeight: theme.h4Bold ? 700 : 400, margin: '16px 0 6px', fontFamily: `'${theme.h4Font}', sans-serif`, fontStyle: theme.h4Italic ? 'italic' : 'normal', textDecoration: theme.h4Underline ? 'underline' : 'none', textAlign: theme.h4TextAlign }}>
                  {titulo}{highlight && ' (Ativo no Presente)'}
                </h4>
              )}
              <div style={plainBodyStyle}>
                <MarkdownParagraphs text={texto} style={{ margin: '0 0 6px' }} emptyFallback={isContinuation ? undefined : emptyFallback} />
              </div>
            </div>
          )
        }
        return (
          <div style={{ marginBottom: 24 }}>
            {!isContinuation && (
              value !== undefined && value !== null ? (
                <NumberBadgeCard value={value} theme={theme}>
                  <div style={{
                    fontSize: theme.h3FontSize, textTransform: isUppercase ? 'uppercase' : 'none', letterSpacing: isUppercase ? '.1em' : 'normal',
                    color: highlight ? theme.primaryColor : theme.h3Color,
                    fontWeight: theme.h3Bold ? 700 : 400, marginBottom: 8, fontFamily: `'${theme.h3Font}', sans-serif`, fontStyle: theme.h3Italic ? 'italic' : 'normal', textDecoration: theme.h3Underline ? 'underline' : 'none', textAlign: theme.h3TextAlign,
                  }}>
                    {titulo}
                    {highlight && (
                      <span style={{ fontSize: 9.5, color: theme.primaryColor, fontWeight: 600, textTransform: 'none', letterSpacing: 'normal', marginLeft: 6 }}>
                        (Ativo no Presente)
                      </span>
                    )}
                  </div>
                  <div style={plainBodyStyle}>
                    <MarkdownParagraphs
                      text={texto}
                      style={{ margin: '0 0 6px' }}
                      emptyFallback={isContinuation ? undefined : emptyFallback}
                    />
                  </div>
                </NumberBadgeCard>
              ) : (
                <div>
                  <div style={{
                    fontSize: theme.h3FontSize, textTransform: isUppercase ? 'uppercase' : 'none', letterSpacing: isUppercase ? '.1em' : 'normal',
                    color: highlight ? theme.primaryColor : theme.h3Color,
                    fontWeight: theme.h3Bold ? 700 : 400, marginBottom: 8, fontFamily: `'${theme.h3Font}', sans-serif`, fontStyle: theme.h3Italic ? 'italic' : 'normal', textDecoration: theme.h3Underline ? 'underline' : 'none', textAlign: theme.h3TextAlign,
                  }}>
                    {titulo}
                    {highlight && (
                      <span style={{ fontSize: 9.5, color: theme.primaryColor, fontWeight: 600, textTransform: 'none', letterSpacing: 'normal', marginLeft: 6 }}>
                        (Ativo no Presente)
                      </span>
                    )}
                  </div>
                  <div style={plainBodyStyle}>
                    <MarkdownParagraphs
                      text={texto}
                      style={{ margin: '0 0 6px' }}
                      emptyFallback={isContinuation ? undefined : emptyFallback}
                    />
                  </div>
                </div>
              )
            )}
            {isContinuation && (
              <div style={plainBodyStyle}>
                <MarkdownParagraphs
                  text={texto}
                  style={{ margin: '0 0 6px' }}
                  emptyFallback={undefined}
                />
              </div>
            )}
          </div>
        )
      }

      if (variant === 'compact') {
        const compactBodyStyle = {
          fontSize: theme.bodyFontSize,
          lineHeight: 1.8,
          color: theme.bodyColor,
          fontFamily: `'${theme.bodyFont}', sans-serif`,
          fontWeight: theme.bodyBold ? 700 : 400,
          fontStyle: theme.bodyItalic ? 'italic' : 'normal',
          textDecoration: theme.bodyUnderline ? 'underline' : 'none',
        }

        const prefixLabel = rotulo
          ? `${rotulo} ${value ?? ''}`.trim()
          : titulo
          ? titulo
          : value !== undefined && value !== null
          ? `Número ${value}`
          : null

        const rawText = texto ?? ''
        const formattedPrefix = prefixLabel && !isContinuation
          ? (prefixLabel.endsWith('-') || prefixLabel.endsWith('—') ? prefixLabel : `${prefixLabel} -`)
          : null
        const fullMarkdownText = formattedPrefix
          ? `**${formattedPrefix}** ${rawText}`
          : rawText

        const isHighlightedBox = highlight && theme.stylePreset === 'modern'

        return (
          <div style={{
            marginBottom: 12,
            padding: isHighlightedBox ? '12px 16px' : 0,
            background: isHighlightedBox ? `${theme.secondaryColor}0D` : 'transparent',
            borderLeft: isHighlightedBox ? `4px solid ${theme.secondaryColor}` : 'none',
            borderRadius: isHighlightedBox ? '0 8px 8px 0' : 0,
          }}>
            <div style={compactBodyStyle}>
              <MarkdownParagraphs
                text={fullMarkdownText}
                style={{ margin: isHighlightedBox ? 0 : '0 0 8px' }}
                strongColor={theme.secondaryColor}
                emptyFallback={isContinuation ? undefined : emptyFallback ?? 'Consulte um numerólogo para uma leitura personalizada deste número.'}
              />
            </div>
          </div>
        )
      }

      const isUppercase = !theme.plainTextMode
      const h2Style = { fontSize: theme.h2FontSize, textTransform: (isUppercase ? 'uppercase' : 'none') as any, letterSpacing: isUppercase ? '.08em' : 'normal', color: theme.h2Color, fontWeight: theme.h2Bold ? 700 : 400, fontFamily: `'${theme.h2Font}', sans-serif`, fontStyle: theme.h2Italic ? 'italic' : 'normal', textDecoration: theme.h2Underline ? 'underline' : 'none', textAlign: theme.h2TextAlign, margin: '28px 0 10px' }
      const h3Style = { fontSize: theme.h3FontSize, textTransform: (isUppercase ? 'uppercase' : 'none') as any, letterSpacing: isUppercase ? '.1em' : 'normal', color: theme.h3Color, fontWeight: theme.h3Bold ? 700 : 400, fontFamily: `'${theme.h3Font}', sans-serif`, fontStyle: theme.h3Italic ? 'italic' : 'normal', textDecoration: theme.h3Underline ? 'underline' : 'none', textAlign: theme.h3TextAlign, margin: '20px 0 8px' }
      const bodyStyle = { fontSize: theme.bodyFontSize, lineHeight: 1.8, color: theme.bodyColor, fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }
      const defBodyStyle = { fontSize: theme.bodyFontSize, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px', fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }

      if (isHeaderOnly) {
        if (theme.plainTextMode) {
          return (
            <div style={{ marginBottom: 12, breakInside: 'avoid' }}>
              <h3 style={h3Style}>{titulo}</h3>
            </div>
          )
        }
        return (
          <div style={{ marginBottom: 12, breakInside: 'avoid' }}>
            <NumberBadgeCard value={value} theme={theme}>
              <div style={h3Style}>{titulo}</div>
            </NumberBadgeCard>
          </div>
        )
      }

      if (isContinuation) {
        if (theme.plainTextMode) {
          return (
            <div style={{ marginBottom: 20, ...bodyStyle }}>
              <MarkdownParagraphs text={texto} style={{ margin: '0 0 10px' }} />
            </div>
          )
        }
        return (
          <div style={{ display: 'grid', gridTemplateColumns: theme.stylePreset === 'holistic' ? '44px 1fr' : '72px 1fr', gap: 20, alignItems: 'start', marginBottom: 20 }}>
            <div aria-hidden />
            <div style={bodyStyle}>
              <MarkdownParagraphs text={texto} style={{ margin: '0 0 10px' }} />
            </div>
          </div>
        )
      }

      // defHeadOnly: pedaço "só a introdução" — quando a definição é alta demais
      // pra caber junto do número, o título + começo da intro ficam na página
      // atual; o resto da intro + número + corpo seguem na continuação.
      if (defHeadOnly) {
        return (
          <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 12 }}>
            <h2 style={h2Style}>{label}</h2>
            {theme.plainTextMode ? (
              <div style={{ margin: 0 }}><MarkdownParagraphs text={definicaoTexto} style={defBodyStyle} /></div>
            ) : theme.stylePreset === 'holistic' ? (
              <IntroBlockquote text={definicaoTexto} theme={theme} />
            ) : theme.stylePreset === 'vibracao' ? (
              <VibracaoWaveCallout theme={theme} margin="0"><MarkdownParagraphs text={definicaoTexto} style={defBodyStyle} /></VibracaoWaveCallout>
            ) : theme.stylePreset === 'modern' ? (
              <IntroBlockquote text={definicaoTexto} theme={theme} />
            ) : (
              <blockquote style={{
                margin: 0,
                padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
                background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.secondaryColor}0D`,
                borderLeft: theme.quoteStyle === 'minimal' ? 'none' : `4px solid ${theme.secondaryColor}`,
                borderRadius: theme.quoteStyle === 'minimal' ? '0' : '0 8px 8px 0',
              }}>
                <MarkdownParagraphs text={definicaoTexto} style={defBodyStyle} />
              </blockquote>
            )}
          </div>
        )
      }

      if (theme.plainTextMode) {
        const titleText = definicaoTexto && !useTitulo ? `${label}: ${value ?? '-'}` : titulo
        return (
          <div id={block.id} className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ marginBottom: DOC_GAP }}>
            {definicaoTexto && !hideDefLabel && <h2 style={h2Style}>{label}</h2>}
            {definicaoTexto && (
              <div style={{ margin: '0 0 16px' }}><MarkdownParagraphs text={definicaoTexto} style={defBodyStyle} /></div>
            )}
            <InstructionCallout text={instrucaoTexto} theme={theme} />
            <h3 style={h3Style}>
              {titleText}
            </h3>
            {subtitulo && <PeriodBadgeCard text={subtitulo} theme={theme} />}
            {!deferredText && (
              <div style={bodyStyle}>
                <MarkdownParagraphs text={texto} style={{ margin: '0 0 10px' }} emptyFallback="Consulte um numerólogo para uma leitura personalizada deste número." />
              </div>
            )}
          </div>
        )
      }

      return (
        <div id={block.id} className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: DOC_GAP }}>
          {definicaoTexto && (
            <>
              {!hideDefLabel && <h2 style={h2Style}>{label}</h2>}
              {theme.stylePreset === 'holistic' ? (
                <IntroBlockquote text={definicaoTexto} theme={theme} />
              ) : theme.stylePreset === 'vibracao' ? (
                <VibracaoWaveCallout theme={theme} margin="0 0 24px"><MarkdownParagraphs text={definicaoTexto} style={defBodyStyle} /></VibracaoWaveCallout>
              ) : theme.stylePreset === 'modern' ? (
                <IntroBlockquote text={definicaoTexto} theme={theme} />
              ) : (
                <blockquote style={{
                  margin: '0 0 24px',
                  padding: theme.quoteStyle === 'minimal' ? '0' : '12px 16px',
                  background: theme.quoteStyle === 'minimal' ? 'transparent' : `${theme.secondaryColor}0D`,
                  borderLeft: theme.quoteStyle === 'minimal' ? 'none' : `4px solid ${theme.secondaryColor}`,
                  borderRadius: theme.quoteStyle === 'minimal' ? '0' : '0 8px 8px 0',
                }}>
                  <MarkdownParagraphs text={definicaoTexto} style={defBodyStyle} />
                </blockquote>
              )}
            </>
          )}
          <InstructionCallout text={instrucaoTexto} theme={theme} />

          <NumberBadgeCard value={value} theme={theme}>
            <div style={h3Style}>
              {definicaoTexto && !useTitulo ? `${label}: ${value ?? '-'}` : titulo}
            </div>
            {subtitulo && <PeriodBadgeCard text={subtitulo} theme={theme} />}
            {!deferredText && (
              <div style={bodyStyle}>
                <MarkdownParagraphs text={texto} style={{ margin: '0 0 10px' }} emptyFallback="Consulte um numerólogo para uma leitura personalizada deste número." />
              </div>
            )}
          </NumberBadgeCard>
        </div>
      )
    }

    case 'list-entry': {
      const { label, items, description } = block.data as {
        label: string
        items: (number | { label: string; value: number })[]
        description: string
      }
      const listBodyStyle = { fontSize: theme.bodyFontSize, color: theme.bodyColor, margin: 0, fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }
      if (theme.plainTextMode) {
        const valuesText = items.map(item => {
          const val = typeof item === 'number' ? item : item.value
          const lbl = typeof item === 'object' ? item.label : null
          return lbl ? `${lbl} ${val}` : String(val)
        }).join(', ')
        return (
          <div style={{ marginBottom: DOC_GAP, breakInside: 'avoid' }}>
            <h3 style={{ fontSize: theme.h3FontSize, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h3Color, fontWeight: theme.h3Bold ? 700 : 400, margin: '20px 0 8px', fontFamily: `'${theme.h3Font}', sans-serif` }}>
              {label}
            </h3>
            <p style={{ ...listBodyStyle, marginBottom: 4 }}>{valuesText}</p>
            <p style={listBodyStyle}><MarkdownInline text={description} /></p>
          </div>
        )
      }
      return (
        <div style={{ marginBottom: DOC_GAP, breakInside: 'avoid' }}>
          <h3 style={{ fontSize: theme.h3FontSize, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.h3Color, fontWeight: theme.h3Bold ? 700 : 400, margin: '20px 0 8px', fontFamily: `'${theme.h3Font}', sans-serif`, fontStyle: theme.h3Italic ? 'italic' : 'normal', textDecoration: theme.h3Underline ? 'underline' : 'none', textAlign: theme.h3TextAlign }}>
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
                  fontWeight: 700, fontSize: 12, color: theme.stylePreset === 'vibracao' ? theme.accentColor : theme.primaryColor,
                }}>
                  {lbl && <span style={{ fontSize: 9, fontWeight: 400, color: '#888' }}>{lbl}</span>}
                  {val}
                </span>
              )
            })}
          </div>
          <p style={listBodyStyle}><MarkdownInline text={description} /></p>
        </div>
      )
    }

    // Grade-resumo "de relance" (os 12 meses, os dias favoráveis…). É ATÔMICA:
    // nunca se divide, então existir como tipo próprio não acrescenta nada ao
    // paginador — a regra de corte continua sendo uma só, para os blocos que
    // de fato fluem. Antes era markup embutido dentro de `timeline-entry`.
    // Parágrafo solto — ex.: o texto de ausência "o mapa não tem nenhum débito
    // cármico", que antes era um ramo dentro de `multi-number-entry`.
    case 'plain-text': {
      const { texto } = block.data as { texto?: string }
      if (!texto) return null
      return (
        <div style={{ fontSize: theme.bodyFontSize, lineHeight: 1.8, color: theme.bodyColor, marginBottom: DOC_GAP, fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }}>
          <MarkdownParagraphs text={texto} style={{ margin: '0 0 8px' }} />
        </div>
      )
    }

    // Caixa da cronologia dos arcanos: parágrafo + esferas + legenda. Uma
    // unidade VISUAL indivisível (as esferas só fazem sentido com a legenda),
    // portanto ATÔMICA — antes era markup dentro de `triangulo-arcanos-lista`,
    // e era ela que exigia toda a maquinaria `titleOnly`/`introOnly`/
    // `hideIntroText` no splitter.
    // Cabeçalho de um Ciclo de Vida: título à esquerda + período à direita,
    // separados por uma linha. Atômico (uma barra só) — antes era markup dentro
    // de `cycles-entry`.
    // Card vermelho de bloqueio do Triângulo da Vida. Atômico (caixa fechada).
    case 'alert-card': {
      const { titulo, texto, isSuccess, spaceAfter } = block.data as {
        titulo: string
        texto: string
        isSuccess?: boolean
        spaceAfter?: number
      }
      const alertBodyStyle = {
        fontSize: theme.bodyFontSize,
        lineHeight: 1.7,
        color: theme.bodyColor,
        margin: '0 0 6px',
        fontFamily: `'${theme.bodyFont}', sans-serif`,
        fontWeight: theme.bodyBold ? 700 : 400,
        fontStyle: theme.bodyItalic ? 'italic' : 'normal',
        textDecoration: theme.bodyUnderline ? 'underline' : 'none'
      }

      const isUppercase = !theme.plainTextMode
      const titleColor = isSuccess ? '#16a34a' : '#dc2626'
      const titleStyle = {
        fontSize: theme.h3FontSize,
        textTransform: (isUppercase ? 'uppercase' : 'none') as any,
        letterSpacing: isUppercase ? '.08em' : 'normal',
        color: titleColor,
        fontWeight: theme.h3Bold ? 700 : 400,
        margin: '0 0 6px',
        fontFamily: `'${theme.h3Font}', sans-serif`,
        fontStyle: theme.h3Italic ? 'italic' : 'normal',
        textDecoration: theme.h3Underline ? 'underline' : 'none',
        textAlign: theme.h3TextAlign,
      }

      if (theme.plainTextMode) {
        return (
          <div id={block.id} style={{ marginBottom: spaceAfter ?? 16 }}>
            <h3 style={titleStyle}>{titulo}</h3>
            <MarkdownParagraphs text={texto} style={alertBodyStyle} />
          </div>
        )
      }

      return (
        <div id={block.id} style={{
          padding: '14px 18px',
          border: isSuccess ? '1px solid #bbf7d0' : '1px solid #fca5a5',
          borderLeft: isSuccess ? '4px solid #16a34a' : '4px solid #dc2626',
          borderRadius: 8,
          background: isSuccess ? '#f0fdf4' : '#fff5f5',
          marginBottom: spaceAfter ?? 16,
        }}>
          <h3 style={titleStyle}>{titulo}</h3>
          <MarkdownParagraphs text={texto} style={alertBodyStyle} />
        </div>
      )
    }

    case 'cycle-header': {
      const { label, periodo } = block.data as { label: string; periodo: string }
      const isUppercase = !theme.plainTextMode
      return (
        <div id={block.id} style={{
          borderBottom: theme.stylePreset === 'vibracao' ? `2px solid ${theme.secondaryColor}22` : theme.stylePreset === 'modern' ? `2px solid ${theme.primaryColor}` : 'none',
          paddingBottom: 8,
          marginBottom: 24,
        }}>
          <h2 style={{
            fontSize: theme.h2FontSize,
            textTransform: isUppercase ? 'uppercase' : 'none',
            letterSpacing: isUppercase ? '.08em' : 'normal',
            color: theme.h2Color,
            fontWeight: theme.h2Bold ? 700 : 400,
            margin: 0,
            fontFamily: `'${theme.h2Font}', sans-serif`,
            fontStyle: theme.h2Italic ? 'italic' : 'normal',
            textDecoration: theme.h2Underline ? 'underline' : 'none',
            textAlign: theme.h2TextAlign,
          }}>
            {label}
          </h2>
        </div>
      )
    }

    case 'arcanos-timeline': {
      const { sequenciaCompleta, arcanoAtual } = block.data as {
        sequenciaCompleta: number[]
        arcanoAtual?: { numero?: number; indice?: number } | null
      }
      if (!sequenciaCompleta?.length) return null
      const currentIdx = arcanoAtual?.indice ?? -1

      const bodyStyle = {
        fontSize: theme.bodyFontSize,
        color: theme.bodyColor,
        lineHeight: 1.6,
        margin: '0 0 14px',
        fontFamily: `'${theme.bodyFont}', sans-serif`,
        fontWeight: theme.bodyBold ? 700 : 400,
        fontStyle: theme.bodyItalic ? 'italic' : 'normal',
        textDecoration: theme.bodyUnderline ? 'underline' : 'none'
      }

      const timelineGraphicElements = (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {sequenciaCompleta.map((arc, idx) => {
              let state: 'past' | 'present' | 'future' = 'future'
              if (currentIdx !== -1) {
                if (idx < currentIdx) state = 'past'
                else if (idx === currentIdx) state = 'present'
              }
              let bgColor = `${theme.accentColor}11`
              let borderColor = theme.accentColor
              let textColor = theme.accentColor
              if (state === 'past') {
                bgColor = `${theme.secondaryColor}15`; borderColor = theme.secondaryColor; textColor = theme.secondaryColor
              } else if (state === 'present') {
                bgColor = theme.primaryColor; borderColor = theme.primaryColor; textColor = '#FFFFFF'
              }
              return (
                <div key={idx} style={{
                  width: 24, height: 24, borderRadius: 12,
                  background: bgColor, border: `1.5px solid ${borderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: textColor,
                  boxShadow: state === 'present' ? `0 0 6px ${theme.primaryColor}66` : undefined,
                }}>
                  {arc}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, borderTop: '1px solid #E5E7EB', paddingTop: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#6B7280' }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: `${theme.secondaryColor}15`, border: `1.5px solid ${theme.secondaryColor}` }} />
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
        </>
      )

      if (theme.plainTextMode) {
        return (
          <div id={block.id} style={{ marginBottom: 28 }}>
            <p style={bodyStyle}>
              Os Arcanos de Passagem mapeiam o tempo e a evolução ao longo de sua existência. Cada esfera abaixo representa um ciclo de passagem. A cor indica sua posição no tempo:
            </p>
            <div style={{ paddingTop: 4 }}>
              {timelineGraphicElements}
            </div>
          </div>
        )
      }

      return (
        <div id={block.id} style={{ marginBottom: 28 }}>
          <p style={bodyStyle}>
            Os Arcanos de Passagem mapeiam o tempo e a evolução ao longo de sua existência. Cada esfera abaixo representa um ciclo de passagem. A cor indica sua posição no tempo:
          </p>
          <div style={{
            padding: '16px 20px',
            border: `1px solid ${theme.secondaryColor}22`,
            borderRadius: 8,
            background: `${theme.secondaryColor}08`,
          }}>
            {timelineGraphicElements}
          </div>
        </div>
      )
    }

    case 'summary-grid': {
      if (theme.plainTextMode) return null

      const { items, variant: gridVariant } = block.data as {
        items: { title: string; subtitle?: string; value: number }[]
        /** 'chips' = pílulas estreitas (Dias Favoráveis); padrão = cartões
         *  em grade (Meses Pessoais). Ambas atômicas. */
        variant?: 'chips'
      }

      if (gridVariant === 'chips') {
        const isVibracao = theme.stylePreset === 'vibracao'
        const isModern = theme.stylePreset === 'modern'
        const isCardStyle = isVibracao || isModern
        return (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {items.map((item, i) => (
              <span key={i} style={{
                display: 'inline-flex', flexDirection: isCardStyle ? 'row' : 'column', alignItems: 'center', justifyContent: isCardStyle ? 'space-between' : undefined,
                gap: isCardStyle ? 8 : undefined, minWidth: isCardStyle ? 80 : 52, padding: isCardStyle ? '8px 10px' : '6px 10px',
                border: isVibracao ? `1px solid ${theme.secondaryColor}22` : isModern ? `1.5px solid ${theme.primaryColor}55` : `1px solid ${theme.accentColor}55`, borderRadius: isCardStyle ? 8 : 10,
                backgroundColor: isVibracao ? '#fff' : isModern ? `${theme.primaryColor}05` : undefined,
              }}>
                <span style={{ fontSize: isCardStyle ? theme.h3FontSize : 8.5, fontWeight: isCardStyle ? (theme.h3Bold ? 700 : 400) : 600, textTransform: isCardStyle ? 'none' : 'uppercase', letterSpacing: isCardStyle ? 'normal' : '.08em', color: isVibracao ? theme.h3Color : isModern ? theme.primaryColor : '#888', fontFamily: isCardStyle ? `'${theme.h3Font}', sans-serif` : undefined }}>{item.title}</span>
                <span style={{ display: isModern ? 'grid' : undefined, placeItems: isModern ? 'center' : undefined, minWidth: isModern ? 28 : undefined, minHeight: isModern ? 28 : undefined, borderRadius: isModern ? 6 : undefined, background: isModern ? theme.primaryColor : undefined, fontSize: isCardStyle ? 20 : 18, fontWeight: isVibracao ? 500 : isModern ? 700 : 900, color: isVibracao ? theme.accentColor : isModern ? '#FFFFFF' : theme.primaryColor, fontFamily: "'Poppins', sans-serif", lineHeight: 1.2 }}>{item.value}</span>
              </span>
            ))}
          </div>
        )
      }

      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 20 }}>
          {items.map((item, i) => (
            <div key={i} style={{ border: theme.stylePreset === 'modern' ? `1.5px solid ${theme.primaryColor}55` : `1px solid ${theme.secondaryColor}22`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.stylePreset === 'modern' ? `${theme.primaryColor}05` : '#fff' }}>
              <div>
                <div style={{ fontSize: theme.h3FontSize, fontWeight: theme.h3Bold ? 700 : 400, color: theme.stylePreset === 'modern' ? theme.primaryColor : theme.h3Color, fontFamily: `'${theme.h3Font}', sans-serif`, fontStyle: theme.h3Italic ? 'italic' : 'normal', textDecoration: theme.h3Underline ? 'underline' : 'none', textAlign: theme.h3TextAlign }}>{item.title}</div>
                {item.subtitle && <div style={{ fontSize: 9, color: '#888' }}>{item.subtitle}</div>}
              </div>
              <div style={{ display: theme.stylePreset === 'modern' ? 'grid' : undefined, placeItems: theme.stylePreset === 'modern' ? 'center' : undefined, minWidth: theme.stylePreset === 'modern' ? 30 : undefined, minHeight: theme.stylePreset === 'modern' ? 30 : undefined, borderRadius: theme.stylePreset === 'modern' ? 6 : undefined, background: theme.stylePreset === 'modern' ? theme.primaryColor : undefined, fontSize: 20, fontWeight: theme.stylePreset === 'vibracao' ? 500 : 700, color: theme.stylePreset === 'modern' ? '#FFFFFF' : theme.accentColor, fontFamily: "'Poppins', sans-serif" }}>{item.value}</div>
            </div>
          ))}
        </div>
      )
    }

    case 'piramide-grid': {
      const { trianguloDaVida } = block.data as any
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

      if (linhas.length === 0) return null

      return (
          <div style={{
            border: `1px solid ${theme.accentColor}33`, borderRadius: 8,
            padding: '20px 12px', marginBottom: 16, overflowX: 'auto',
            background: `${theme.accentColor}08`,
          }}>
            {linhas.map((linha, li) => {
              const isBase = li === 0
              return (
                <div key={li} style={{ display: 'flex', justifyContent: 'center', gap: 2, marginBottom: 2 }}>
                  {isBase && letras.map((letra, ci) => (
                    <div key={`l-${ci}`} style={{
                      width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize, fontWeight: 700, color: theme.primaryColor,
                    }}>
                      {letra}
                    </div>
                  ))}
                  {!isBase && linha.map((num, ci) => {
                    const isBloqueio = bloqueioSet.has(`${li}:${ci}`)
                    return (
                      <div key={`n-${ci}`} style={{
                        width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize, fontWeight: isBloqueio ? 900 : 600,
                        color: isBloqueio ? '#dc2626' : theme.bodyColor,
                        background: isBloqueio ? '#fef2f2' : 'transparent',
                        borderRadius: isBloqueio ? 4 : 0,
                      }}>
                        {num}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
      )
    }

    case 'triangulo-arcano-regente': {
      const { arcanoRegente, arcanoInfo } = block.data as { arcanoRegente: number; arcanoInfo: ArcanoInfo | null }
      if (arcanoRegente === undefined || arcanoRegente === null) return null

      const isUppercase = !theme.plainTextMode
      const titleText = `Arcano Regente ${arcanoRegente}: ${arcanoInfo ? arcanoInfo.nome : `Arcano ${arcanoRegente}`}`
      const h2Style = {
        fontSize: theme.h2FontSize,
        textTransform: (isUppercase ? 'uppercase' : 'none') as any,
        letterSpacing: isUppercase ? '.08em' : 'normal',
        color: theme.h2Color,
        fontWeight: theme.h2Bold ? 700 : 400,
        margin: '0 0 8px',
        fontFamily: `'${theme.h2Font}', sans-serif`,
        fontStyle: theme.h2Italic ? 'italic' : 'normal',
        textDecoration: theme.h2Underline ? 'underline' : 'none',
        textAlign: theme.h2TextAlign,
      }
      const bodyStyle = {
        fontSize: theme.bodyFontSize,
        lineHeight: 1.8,
        color: theme.bodyColor,
        fontFamily: `'${theme.bodyFont}', sans-serif`,
        fontWeight: theme.bodyBold ? 700 : 400,
        fontStyle: theme.bodyItalic ? 'italic' : 'normal',
        textDecoration: theme.bodyUnderline ? 'underline' : 'none',
      }

      if (theme.plainTextMode) {
        return (
          <div id={block.id} style={{ marginBottom: DOC_GAP, breakInside: 'avoid' }}>
            <h2 style={h2Style}>{titleText}</h2>
            {arcanoInfo && (
              <div style={bodyStyle}>
                <MarkdownParagraphs text={arcanoInfo.descricao} style={{ margin: '0 0 8px' }} />
                {arcanoInfo.desafio && (
                  <p style={{ margin: 0 }}>
                    <strong>Desafio:</strong> <MarkdownInline text={arcanoInfo.desafio} />
                  </p>
                )}
              </div>
            )}
          </div>
        )
      }

      return (
        <div id={block.id} style={{ marginBottom: DOC_GAP, breakInside: 'avoid' }}>
          <NumberBadgeCard value={arcanoRegente} theme={theme}>
            <h2 style={h2Style}>{titleText}</h2>
            {arcanoInfo && (
              <div style={bodyStyle}>
                <MarkdownParagraphs text={arcanoInfo.descricao} style={{ margin: '0 0 8px' }} />
                {arcanoInfo.desafio && (
                  <p style={{ margin: 0 }}>
                    <strong>Desafio:</strong> <MarkdownInline text={arcanoInfo.desafio} />
                  </p>
                )}
              </div>
            )}
          </NumberBadgeCard>
        </div>
      )
    }

    case 'triangulo-arcano-vigente': {
      const { arcanoAtual, sequenciaCompleta, arcanoInfo } = block.data as any
      if (!arcanoAtual || arcanoAtual.numero === null) return null

      const duracaoTotal = arcanoAtual.duracaoCiclo ?? (90 / (sequenciaCompleta?.length || 1))
      const isUppercase = !theme.plainTextMode
      const titleText = `Arcano Vigente ${arcanoAtual.numero}: ${arcanoInfo ? arcanoInfo.nome : `Arcano ${arcanoAtual.numero}`}`
      const h2Style = {
        fontSize: theme.h2FontSize,
        textTransform: (isUppercase ? 'uppercase' : 'none') as any,
        letterSpacing: isUppercase ? '.08em' : 'normal',
        color: theme.h2Color,
        fontWeight: theme.h2Bold ? 700 : 400,
        margin: '0 0 4px',
        fontFamily: `'${theme.h2Font}', sans-serif`,
        fontStyle: theme.h2Italic ? 'italic' : 'normal',
        textDecoration: theme.h2Underline ? 'underline' : 'none',
        textAlign: theme.h2TextAlign,
      }
      const bodyStyle = {
        fontSize: theme.bodyFontSize,
        lineHeight: 1.8,
        color: theme.bodyColor,
        fontFamily: `'${theme.bodyFont}', sans-serif`,
        fontWeight: theme.bodyBold ? 700 : 400,
        fontStyle: theme.bodyItalic ? 'italic' : 'normal',
        textDecoration: theme.bodyUnderline ? 'underline' : 'none',
      }
      const periodoSubtitle = (
        <span style={{ display: 'block', fontSize: 9.5, color: '#888', textTransform: 'none', letterSpacing: 'normal', marginTop: 2, marginBottom: 8 }}>
          Período: {arcanoAtual.periodo} (Idade {arcanoAtual.idadeInicio} a {arcanoAtual.idadeFim} anos — duração aprox. {duracaoTotal.toFixed(1).replace('.', ',')} anos)
        </span>
      )

      if (theme.plainTextMode) {
        return (
          <div id={block.id} style={{ marginBottom: DOC_GAP, breakInside: 'avoid' }}>
            <h2 style={h2Style}>{titleText}</h2>
            {periodoSubtitle}
            {arcanoInfo && (
              <div style={bodyStyle}>
                <MarkdownParagraphs text={arcanoInfo.descricao} style={{ margin: '0 0 8px' }} />
                {arcanoInfo.desafio && (
                  <p style={{ margin: 0 }}>
                    <strong>Desafio:</strong> <MarkdownInline text={arcanoInfo.desafio} />
                  </p>
                )}
              </div>
            )}
          </div>
        )
      }

      return (
        <div id={block.id} style={{ marginBottom: DOC_GAP, breakInside: 'avoid' }}>
          <NumberBadgeCard value={arcanoAtual.numero} theme={theme}>
            <h2 style={h2Style}>{titleText}</h2>
            {periodoSubtitle}
            {arcanoInfo && (
              <div style={bodyStyle}>
                <MarkdownParagraphs text={arcanoInfo.descricao} style={{ margin: '0 0 8px' }} />
                {arcanoInfo.desafio && (
                  <p style={{ margin: 0 }}>
                    <strong>Desafio:</strong> <MarkdownInline text={arcanoInfo.desafio} />
                  </p>
                )}
              </div>
            )}
          </NumberBadgeCard>
        </div>
      )
    }

    case 'orientation': {
      const isUppercase = !theme.plainTextMode
      return (
        <div id={block.id} className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: DOC_GAP }}>
          <h1 style={{
            fontSize: theme.h1FontSize,
            textTransform: isUppercase ? 'uppercase' : 'none',
            letterSpacing: isUppercase ? '.08em' : 'normal',
            fontWeight: theme.h1Bold ? 700 : 400,
            color: theme.h1Color,
            margin: theme.plainTextMode ? '0 0 16px' : '0 0 8px',
            fontFamily: `'${theme.h1Font}', sans-serif`,
            fontStyle: theme.h1Italic ? 'italic' : 'normal',
            textDecoration: theme.h1Underline ? 'underline' : 'none',
            textAlign: theme.h1TextAlign,
          }}>
            {(block.data?.label as string) || 'Orientação'}
          </h1>
          <VibracaoSectionRule theme={theme} />
          <MarkdownParagraphs
            text={block.data?.textoOrientacao as string}
            style={{ fontSize: theme.bodyFontSize, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 12px', fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }}
          />
        </div>
      )
    }

    case 'importante': {
      const isUppercase = !theme.plainTextMode
      return (
        <div id={block.id} className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: DOC_GAP }}>
          <h2 style={{
            fontSize: theme.h2FontSize,
            textTransform: isUppercase ? 'uppercase' : 'none',
            letterSpacing: isUppercase ? '.08em' : 'normal',
            fontWeight: theme.h2Bold ? 700 : 400,
            color: theme.h2Color,
            margin: '28px 0 10px',
            fontFamily: `'${theme.h2Font}', sans-serif`,
            fontStyle: theme.h2Italic ? 'italic' : 'normal',
            textDecoration: theme.h2Underline ? 'underline' : 'none',
            textAlign: theme.h2TextAlign,
          }}>
            {(block.data?.label as string) || 'Importante'}
          </h2>
          <MarkdownParagraphs
            text={block.data?.texto as string}
            style={{ fontSize: theme.bodyFontSize, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 12px', fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }}
          />
        </div>
      )
    }

    case 'conclusion': {
      const isUppercase = !theme.plainTextMode
      return (
        <div id={block.id} className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: DOC_GAP }}>
          <h1 style={{
            fontSize: theme.h1FontSize,
            textTransform: isUppercase ? 'uppercase' : 'none',
            letterSpacing: isUppercase ? '.08em' : 'normal',
            fontWeight: theme.h1Bold ? 700 : 400,
            color: theme.h1Color,
            margin: theme.plainTextMode ? '0 0 16px' : '0 0 8px',
            fontFamily: `'${theme.h1Font}', sans-serif`,
            fontStyle: theme.h1Italic ? 'italic' : 'normal',
            textDecoration: theme.h1Underline ? 'underline' : 'none',
            textAlign: theme.h1TextAlign,
          }}>
            {(block.data?.label as string) || 'Conclusão'}
          </h1>
          <VibracaoSectionRule theme={theme} />
          <MarkdownParagraphs
            text={block.data?.texto as string}
            style={{ fontSize: theme.bodyFontSize, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 12px', fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }}
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
      const isUppercase = !theme.plainTextMode
      return (
        <div id={block.id} className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: DOC_GAP }}>
          <h1 style={{
            fontSize: theme.h1FontSize,
            textTransform: isUppercase ? 'uppercase' : 'none',
            letterSpacing: isUppercase ? '.08em' : 'normal',
            fontWeight: theme.h1Bold ? 700 : 400,
            color: theme.h1Color,
            margin: theme.plainTextMode ? '0 0 16px' : '0 0 8px',
            fontFamily: `'${theme.h1Font}', sans-serif`,
            fontStyle: theme.h1Italic ? 'italic' : 'normal',
            textDecoration: theme.h1Underline ? 'underline' : 'none',
            textAlign: theme.h1TextAlign,
          }}>
            {(data.label as string) || 'Os Seus Números'}
          </h1>
          <VibracaoSectionRule theme={theme} />

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            fontSize: theme.bodyFontSize, color: theme.bodyColor, fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none',
            padding: '16px 20px', background: `${theme.secondaryColor}08`,
            border: `1px solid ${theme.secondaryColor}22`, borderRadius: 12,
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
            fontSize: theme.h2FontSize, fontWeight: theme.h2Bold ? 700 : 400, color: theme.h2Color,
            margin: '28px 0 10px', fontFamily: `'${theme.h2Font}', sans-serif`, fontStyle: theme.h2Italic ? 'italic' : 'normal', textDecoration: theme.h2Underline ? 'underline' : 'none', textAlign: theme.h2TextAlign,
          }}>
            Importante
          </h2>
          <MarkdownParagraphs
            text={data.textoImportante as string}
            style={{ fontSize: theme.bodyFontSize, lineHeight: 1.9, color: theme.bodyColor, margin: '0 0 8px', fontFamily: `'${theme.bodyFont}', sans-serif`, fontWeight: theme.bodyBold ? 700 : 400, fontStyle: theme.bodyItalic ? 'italic' : 'normal', textDecoration: theme.bodyUnderline ? 'underline' : 'none' }}
          />
        </div>
      )
    }

    case 'summary-table': {
      const { rows } = block.data as { rows: { label: string; value: number }[] }
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: DOC_GAP }}>
          <h1 style={{ fontSize: theme.h1FontSize, fontWeight: theme.h1Bold ? 700 : 400, color: theme.h1Color, margin: '0 0 16px', fontFamily: `'${theme.h1Font}', sans-serif`, fontStyle: theme.h1Italic ? 'italic' : 'normal', textDecoration: theme.h1Underline ? 'underline' : 'none', textAlign: theme.h1TextAlign }}>
            Seus Números
          </h1>
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
