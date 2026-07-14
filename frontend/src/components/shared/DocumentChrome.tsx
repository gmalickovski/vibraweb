// DocumentChrome.tsx — cabeçalho/rodapé/capa do documento PDF, extraídos de
// PreviewPage.tsx para serem reaproveitados também pelo preview em miniatura de
// Blocos do Relatório e Templates de Marca (Item 1/2, ajuste de 2026-07-11):
// "arrumar os previews para imitar as mesmas proporções do preview de geração do PDF".
// Qualquer ajuste visual no documento real deve ser feito aqui — nunca duplicado.

import type { DocTheme } from '../../lib/theme-resolver'

// Mesmas constantes usadas em print-document.ts e no CSS (.a4-page / .content-section)
export const SAFE = '8mm'     // distância da borda da página até header/footer
export const SIDE = '12mm'    // padding lateral
export const PAD_TOP_COVER = '10mm'
export const PAD_TOP_CONTENT = '22mm'
export const PAD_BOT = '20mm'

const borderColor = (color: string) => `1px solid ${color}22`

export function PageHeader({ theme, subject }: { theme: DocTheme; subject: string }) {
  if (!theme.showHeader) return null
  return (
    <div className="doc-page-header" style={{
      position: 'absolute',
      top: SAFE, left: SIDE, right: SIDE,
      display: 'flex', alignItems: 'center', gap: 10,
      paddingBottom: '3mm',
      borderBottom: borderColor(theme.primaryColor),
    }}>
      {theme.headerLogoUrl ? (
        <img src={theme.headerLogoUrl} alt="Logo" style={{ maxHeight: 22, maxWidth: 64, objectFit: 'contain' }} />
      ) : theme.logoUrl ? (
        <img src={theme.logoUrl} alt="Logo" style={{ maxHeight: 22, maxWidth: 64, objectFit: 'contain' }} />
      ) : (
        <span style={{
          fontFamily: "'Poppins', sans-serif", fontWeight: 700,
          fontSize: 12, color: theme.primaryColor, whiteSpace: 'nowrap',
        }}>
          {theme.companyName}
        </span>
      )}
      <div style={{
        marginLeft: 'auto', fontSize: 8, color: '#aaa',
        fontFamily: "'Inter', sans-serif", textAlign: 'right', lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}>
        {theme.headerRightText || subject}
      </div>
    </div>
  )
}

export function PageFooter({ theme }: { theme: DocTheme }) {
  if (!theme.showFooter) return null
  const cols = []
  if (theme.footerColumns >= 1) cols.push(theme.footerLeft)
  if (theme.footerColumns >= 3) cols.push(theme.footerCenter)
  if (theme.footerColumns >= 2) cols.push(theme.footerRight)

  return (
    <div className="doc-page-footer" style={{
      position: 'absolute',
      bottom: SAFE, left: SIDE, right: SIDE,
      paddingTop: '3mm',
      borderTop: borderColor(theme.primaryColor),
      display: 'grid',
      gridTemplateColumns: `repeat(${theme.footerColumns}, 1fr)`,
      gap: 4,
    }}>
      {cols.map((col, i) => (
        <div key={i} style={{
          fontSize: 8, color: '#999',
          fontFamily: "'Inter', sans-serif",
          textAlign: i === 0 && theme.footerColumns > 1 ? 'left' : i === cols.length - 1 && theme.footerColumns > 1 ? 'right' : 'center',
          lineHeight: 1.4,
        }}>
          {col}
        </div>
      ))}
    </div>
  )
}

export function CoverPage({ theme, tabLabel, subject, dataNascimento, isPro }: {
  theme: DocTheme
  tabLabel: string
  subject: string
  dataNascimento: string
  isPro: boolean
}) {
  return (
    <div className="a4-page doc-cover" style={{ padding: `${PAD_TOP_COVER} ${SIDE} ${PAD_BOT}` }}>
      {isPro ? null : <div className="watermark">Vibraweb</div>}

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', gap: 20, position: 'relative', zIndex: 1,
      }}>
        {theme.logoUrl ? (
          <img src={theme.logoUrl} alt="Logo"
            style={{ maxHeight: 80 * theme.coverLogoScale, maxWidth: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{
            fontFamily: "'Poppins', sans-serif", fontWeight: 900,
            fontSize: 24 * theme.coverLogoScale, color: theme.primaryColor,
          }}>
            {theme.companyName}
          </div>
        )}
        <div style={{ width: 48, height: 3, background: theme.accentColor, borderRadius: 2 }} />
        <h1 style={{
          fontFamily: "'Poppins', sans-serif", fontWeight: 900,
          fontSize: 30, color: theme.h1Color, margin: 0, lineHeight: 1.2,
        }}>
          Mapa Numerológico<br />
          <span style={{ color: theme.primaryColor }}>{tabLabel}</span>
        </h1>
        <div style={{ width: 48, height: 3, background: theme.accentColor, borderRadius: 2 }} />
        <div>
          <div style={{
            fontFamily: "'Poppins', sans-serif", fontWeight: 700,
            fontSize: 20, color: theme.h1Color,
          }}>
            {subject}
          </div>
          {dataNascimento && (
            <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
              Nascimento: {dataNascimento}
            </div>
          )}
        </div>
      </div>

      <PageFooter theme={theme} />
    </div>
  )
}
