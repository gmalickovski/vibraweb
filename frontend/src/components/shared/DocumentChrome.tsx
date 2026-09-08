// DocumentChrome.tsx — cabeçalho/rodapé/capa do documento PDF, extraídos de
// PreviewPage.tsx para serem reaproveitados também pelo preview em miniatura de
// Blocos do Relatório e Templates de Marca (Item 1/2, ajuste de 2026-07-11):
// "arrumar os previews para imitar as mesmas proporções do preview de geração do PDF".
// Qualquer ajuste visual no documento real deve ser feito aqui — nunca duplicado.
//
// Ajuste 2026-07-18: PageFooter agora aceita `pageNumber` — numeração de
// páginas seguindo ABNT NBR 14724 (capa não é contada nem numerada; conteúdo
// a partir da 1ª seção é numerado em arábicos). O número ocupa uma coluna
// fixa à direita; o restante do rodapé continua com os dados dinâmicos do
// consultor.

import type { CSSProperties } from 'react'
import type { DocTheme, VerticalAlign, HorizontalAlign } from '../../lib/theme-resolver'

/** Classes compartilhadas pelo preview e pela janela de impressão. */
export function docStyleClass(theme: DocTheme): string {
  return `doc-style-${theme.stylePreset} doc-ornament-${theme.ornamentDividerKey}`
}

/** Moldura sutil apenas para o estilo Holístico. Os quatro cantos são
 * elementos editoriais, não uma borda retangular de interface. */
export function DocumentFrame({ theme }: { theme: DocTheme }) {
  if (theme.stylePreset !== 'holistic') return null
  return (
    <div className="doc-holistic-frame" aria-hidden="true">
      <img className="doc-holistic-frame-corner is-top-left" src="/assets/ornament-corner.svg" alt="" />
      <img className="doc-holistic-frame-corner is-top-right" src="/assets/ornament-corner.svg" alt="" />
      <img className="doc-holistic-frame-corner is-bottom-right" src="/assets/ornament-corner.svg" alt="" />
      <img className="doc-holistic-frame-corner is-bottom-left" src="/assets/ornament-corner.svg" alt="" />
    </div>
  )
}

const flexAlign: Record<VerticalAlign, 'flex-start' | 'center' | 'flex-end'> = {
  top: 'flex-start', center: 'center', bottom: 'flex-end',
}

const hJustify: Record<HorizontalAlign, 'flex-start' | 'center' | 'flex-end'> = {
  left: 'flex-start', center: 'center', right: 'flex-end',
}

/** Posição 2D independente por eixo (2026-07-29, Guilherme: "separe
 *  posicionamento vertical e posicionamento horizontal... posso marcar
 *  horizontalmente à esquerda e verticalmente no centro") — `justifyContent`
 *  (eixo horizontal, `hJustify`) e `alignItems` (eixo vertical, `flexAlign`)
 *  vêm de dois campos independentes, não de uma âncora única. */
function boxAlign(h: HorizontalAlign, v: VerticalAlign): { alignItems: 'flex-start' | 'center' | 'flex-end'; justifyContent: 'flex-start' | 'center' | 'flex-end' } {
  return { alignItems: flexAlign[v], justifyContent: hJustify[h] }
}

// Mesmas constantes usadas em print-document.ts e no CSS (.a4-page / .content-section)
export const SAFE = '8mm'     // distância da borda da página até header/footer
export const SIDE = '12mm'    // padding lateral
export const PAD_TOP_CONTENT = '22mm'
export const PAD_BOT = '14mm'

const borderColor = (color: string) => `1px solid ${color}22`

export function PageHeader({ theme, subject }: { theme: DocTheme; subject: string }) {
  if (!theme.showHeader) return null
  return (
    <div className="doc-page-header" style={{
      position: 'absolute',
      top: SAFE, left: SIDE, right: SIDE,
      display: 'flex', alignItems: 'center', gap: 10,
      paddingBottom: '3mm',
      borderBottom: theme.plainTextMode ? '1px solid #cccccc' : borderColor(theme.primaryColor),
    }}>
      {theme.headerLogoUrl ? (
        <img src={theme.headerLogoUrl} alt="Logo" style={{ maxHeight: 22, maxWidth: 64, objectFit: 'contain' }} />
      ) : theme.logoUrl ? (
        <img src={theme.logoUrl} alt="Logo" style={{ maxHeight: 22, maxWidth: 64, objectFit: 'contain' }} />
      ) : (
        <span style={{
          fontFamily: `'${theme.headerFont}', sans-serif`,
          fontWeight: theme.headerBold ? 700 : 400,
          fontStyle: theme.headerItalic ? 'italic' : 'normal',
          textDecoration: theme.headerUnderline ? 'underline' : 'none',
          fontSize: theme.headerFontSize, color: theme.headerColor, whiteSpace: 'nowrap',
        }}>
          {theme.companyName}
        </span>
      )}
      <div style={{
        marginLeft: 'auto', fontSize: theme.headerFontSize, color: theme.headerColor,
        fontFamily: `'${theme.headerFont}', sans-serif`,
        fontWeight: theme.headerBold ? 700 : 400,
        fontStyle: theme.headerItalic ? 'italic' : 'normal',
        textDecoration: theme.headerUnderline ? 'underline' : 'none',
        textAlign: 'right', lineHeight: 1.4,
        whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {theme.headerRightText || subject}
      </div>
    </div>
  )
}

interface PageFooterProps {
  theme: DocTheme
  /** Número da página a exibir na coluna fixa inferior direita.
   *  null = não exibe número (capa, índice futuro).
   *  undefined = não exibe número (compatibilidade com chamadas antigas). */
  pageNumber?: number | null
}

export function PageFooter({ theme, pageNumber }: PageFooterProps) {
  if (!theme.showFooter) return null

  // Monta as colunas dinâmicas do consultor (configuráveis via template)
  const cols: string[] = []
  if (theme.footerColumns >= 1) cols.push(theme.footerLeft)
  if (theme.footerColumns >= 3) cols.push(theme.footerCenter)
  if (theme.footerColumns >= 2) cols.push(theme.footerRight)

  // Layout editorial: [campos dinâmicos (85%)] + [número fixo (15%)].
  // Quando não há número (capa/índice), os campos ocupam toda a largura.
  const showNumber = pageNumber !== null && pageNumber !== undefined
  const pageNumberStyle: CSSProperties = theme.stylePreset === 'vibracao'
    ? {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28,
      }
    : theme.stylePreset === 'modern'
      ? {
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: 8,
          background: theme.primaryColor, color: '#FFFFFF',
          fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 700,
        }
    : theme.stylePreset === 'holistic'
      ? {
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 27, height: 27, borderRadius: '50%',
          border: `1px solid ${theme.primaryColor}`, color: theme.primaryColor,
          fontFamily: "'Cinzel', Georgia, serif", fontSize: 11, fontWeight: 600,
        }
      : theme.stylePreset === 'minimalist'
        ? {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24, borderRadius: 4,
            border: `1px solid ${theme.footerColor}`, color: theme.footerColor,
            fontFamily: "'Inter', sans-serif", fontSize: 10, fontWeight: 600,
          }
        : {
            display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end',
            minHeight: 24, color: theme.footerColor,
            fontFamily: `'${theme.footerFont}', sans-serif`, fontSize: theme.footerFontSize,
            fontWeight: theme.footerBold ? 700 : 400,
          }

  return (
    <div className="doc-page-footer" style={{
      position: 'absolute',
      bottom: SAFE, left: SIDE, right: SIDE,
      paddingTop: '3mm',
      borderTop: theme.plainTextMode ? '1px solid #cccccc' : borderColor(theme.primaryColor),
      display: 'grid',
      gridTemplateColumns: showNumber ? 'minmax(0, 1fr) 15%' : 'minmax(0, 1fr)',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* Colunas dinâmicas do consultor, distribuídas no espaço restante. */}
      <div className="doc-page-footer-fields" style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(cols.length, 1)}, minmax(0, 1fr))`,
        gap: 4,
        minWidth: 0,
      }}>
        {cols.map((col, i) => (
          <div key={i} style={{
            fontSize: theme.footerFontSize, color: theme.footerColor,
            fontFamily: `'${theme.footerFont}', sans-serif`,
            fontWeight: theme.footerBold ? 700 : 400,
            fontStyle: theme.footerItalic ? 'italic' : 'normal',
            textDecoration: theme.footerUnderline ? 'underline' : 'none',
            textAlign: i === 0 && cols.length > 1 ? 'left' : i === cols.length - 1 && cols.length > 1 ? 'right' : 'center',
            lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {col}
          </div>
        ))}
      </div>

      {/* Número de página: área estável à direita, com marcador do estilo. */}
      {showNumber && (
        <div style={{ minWidth: 0, display: 'flex', justifyContent: 'flex-end' }}>
          <div className="page-number-display" style={{
            ...pageNumberStyle,
            fontStyle: theme.footerItalic ? 'italic' : 'normal',
            textDecoration: theme.footerUnderline ? 'underline' : 'none',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
            boxSizing: 'border-box',
          }}>
            {theme.stylePreset === 'vibracao' ? (
              <svg viewBox="0 0 28 28" aria-label={`Página ${pageNumber}`} style={{ width: 28, height: 28, overflow: 'visible' }}>
                <defs>
                  <linearGradient id={`page-number-gradient-${pageNumber}`} x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={theme.primaryColor} />
                    <stop offset="35%" stopColor={theme.secondaryColor} />
                    <stop offset="68%" stopColor={theme.accentColor} />
                    <stop offset="100%" stopColor={theme.ornamentColor} />
                  </linearGradient>
                  <linearGradient id={`page-number-text-gradient-${pageNumber}`} x1="7" y1="6" x2="21" y2="22" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={theme.primaryColor} />
                    <stop offset="52%" stopColor={theme.secondaryColor} />
                    <stop offset="100%" stopColor={theme.ornamentColor} />
                  </linearGradient>
                </defs>
                <circle cx="14" cy="14" r="12" fill="none" stroke={`url(#page-number-gradient-${pageNumber})`} strokeWidth="1.5" />
                <text x="14" y="14" textAnchor="middle" dominantBaseline="central" fill={`url(#page-number-text-gradient-${pageNumber})`} style={{ fontFamily: "'Poppins', sans-serif", fontSize: 12, fontWeight: 600 }}>
                  {pageNumber}
                </text>
              </svg>
            ) : pageNumber}
          </div>
        </div>
      )}
    </div>
  )
}

export function CoverPage({ theme, subject, headerSubject, dataNascimento, isPro }: {
  theme: DocTheme
  subject: string
  headerSubject?: string
  dataNascimento: string
  isPro: boolean
}) {
  // Cabeçalho próprio da capa (2026-07-28, subdivisão "Cabeçalho da Capa" do
  // editor de Modelos): 'none' (padrão, comportamento de antes desta
  // feature — capa nunca tinha cabeçalho), 'inherit' (usa a MESMA config de
  // "Cabeçalho (Páginas)"), ou 'custom' (logo/texto próprios só da capa,
  // força `showHeader: true` já que é uma decisão independente do toggle
  // geral de cabeçalho).
  const coverHeaderTheme: DocTheme = theme.coverHeaderMode === 'custom'
    ? { ...theme, showHeader: true, headerLogoUrl: theme.coverHeaderLogoUrl, headerRightText: theme.coverHeaderRightText }
    : theme

  const clientName = theme.clientNameMode === 'custom' ? theme.clientNameCustom : subject
  const showImageLogo = theme.logoMode === 'image' && !!theme.logoUrl

  return (
    // Padding igual ao das páginas de conteúdo (`PAD_TOP_CONTENT`, não mais
    // um `PAD_TOP_COVER` próprio menor) — 2026-07-29, Guilherme: "use as
    // mesmo tamanho de margens das páginas de conteúdo". Também corrige um
    // problema real: com `coverHeaderMode: 'custom'|'inherit'` (capa pode
    // ter cabeçalho agora), o padding-top menor de antes (10mm) não dava
    // clearance suficiente abaixo do `PageHeader` — o mesmo motivo que já
    // fazia as páginas de conteúdo usarem 22mm em vez de um valor menor.
    <div className={`a4-page doc-cover ${docStyleClass(theme)}`} style={{ padding: `${PAD_TOP_CONTENT} ${SIDE} ${PAD_BOT}` }}>
      {isPro ? null : <div className="watermark">Vibraweb</div>}
      <DocumentFrame theme={theme} />
      {theme.coverHeaderMode !== 'none' && <PageHeader theme={coverHeaderTheme} subject={headerSubject ?? subject} />}

      {/* 4 containers horizontais, cada um ocupando 1/4 da altura disponível
          (histórico completo das rodadas de ajuste em
          .claude/docs/feature-preview-document.md). Título/Logo-texto/
          Nome-do-cliente usam `BoxAnchor` (2026-07-28, "posição onde a
          escrita do texto vai inicia": 5 âncoras — centro + 4 bordas — cada
          uma com fonte/negrito/itálico/cor próprios). Texto de cima
          continua com `VerticalAlign` (1 eixo só, sem estilo próprio — ainda
          escondido da UI). Logo-como-imagem usa posição livre por
          drag (`logoPosX`/`logoPosY`, 0–100%), não âncora — arrastada no
          popup de posicionamento (`LogoPositionModal`). */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: flexAlign[theme.coverTopTextAlign], justifyContent: 'center',
          fontFamily: "'Inter', sans-serif", fontSize: 11, color: '#888', textAlign: 'center',
        }}>
          {theme.coverTopText}
        </div>

        <div style={{
          flex: 1, position: 'relative', display: 'flex',
          ...(showImageLogo ? { alignItems: 'center', justifyContent: 'center' } : boxAlign(theme.logoTextAnchorH, theme.logoTextAnchorV)),
        }}>
          {showImageLogo ? (
            <img src={theme.logoUrl!} alt="Logo" style={{
              position: 'absolute', left: `${theme.logoPosX}%`, top: `${theme.logoPosY}%`,
              transform: 'translate(-50%, -50%)',
              maxHeight: 80 * theme.coverLogoScale, maxWidth: '80%', objectFit: 'contain',
            }} />
          ) : (
            <div style={{
              fontFamily: `'${theme.logoTextFont}', sans-serif`,
              fontWeight: theme.logoTextBold ? 900 : 400,
              fontStyle: theme.logoTextItalic ? 'italic' : 'normal',
              textDecoration: theme.logoTextUnderline ? 'underline' : 'none',
              // Valor ABSOLUTO em pt (não mais `24 * coverLogoScale`) —
              // 2026-07-29, Guilherme: "ao invés de escala, no caso de
              // textos vamos usar pt". `coverLogoScale` continua só pro
              // modo Imagem, onde escala ainda faz sentido.
              fontSize: theme.logoTextFontSize, color: theme.logoTextColor,
            }}>
              {theme.companyName}
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', textAlign: 'center', ...boxAlign(theme.titleAnchorH, theme.titleAnchorV) }}>
          <h1 style={{
            fontFamily: `'${theme.titleFont}', sans-serif`,
            fontWeight: theme.titleBold ? 900 : 400,
            fontStyle: theme.titleItalic ? 'italic' : 'normal',
            textDecoration: theme.titleUnderline ? 'underline' : 'none',
            fontSize: theme.titleFontSize, color: theme.titleColor, margin: 0, lineHeight: 1.2,
          }}>
            {theme.coverProductTitle}
          </h1>
        </div>

        <div style={{ flex: 1, display: 'flex', textAlign: 'center', ...boxAlign(theme.clientAnchorH, theme.clientAnchorV) }}>
          <div>
            <div style={{
              fontFamily: `'${theme.clientFont}', sans-serif`,
              fontWeight: theme.clientBold ? 900 : 400,
              fontStyle: theme.clientItalic ? 'italic' : 'normal',
              textDecoration: theme.clientUnderline ? 'underline' : 'none',
              fontSize: theme.clientFontSize, color: theme.clientColor,
            }}>
              {clientName}
            </div>
            {dataNascimento && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                Nascimento: {dataNascimento}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Capa: footer SEM numeração (ABNT: capa não é contada nem numerada) */}
      <PageFooter theme={theme} pageNumber={null} />
    </div>
  )
}
