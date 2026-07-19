// DocumentChrome.tsx — cabeçalho/rodapé/capa do documento PDF, extraídos de
// PreviewPage.tsx para serem reaproveitados também pelo preview em miniatura de
// Blocos do Relatório e Templates de Marca (Item 1/2, ajuste de 2026-07-11):
// "arrumar os previews para imitar as mesmas proporções do preview de geração do PDF".
// Qualquer ajuste visual no documento real deve ser feito aqui — nunca duplicado.
//
// Ajuste 2026-07-18: PageFooter agora aceita `pageNumber` — numeração de
// páginas seguindo ABNT NBR 14724 (capa não é contada nem numerada; conteúdo
// a partir da 1ª seção é numerado em arábicos). O número fica no canto
// inferior direito como campo fixo; o restante do rodapé continua com os
// dados dinâmicos do consultor.

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

interface PageFooterProps {
  theme: DocTheme
  /** Número da página a exibir no canto inferior direito.
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

  // Layout: [colunas dinâmicas (flex:1)] + [número fixo à direita]
  // Quando não há número (capa/índice), o grid de colunas ocupa toda a largura.
  const showNumber = pageNumber !== null && pageNumber !== undefined

  return (
    <div className="doc-page-footer" style={{
      position: 'absolute',
      bottom: SAFE, left: SIDE, right: SIDE,
      paddingTop: '3mm',
      borderTop: borderColor(theme.primaryColor),
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* Colunas dinâmicas do consultor */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${cols.length}, 1fr)`,
        gap: 4,
        minWidth: 0,
      }}>
        {cols.map((col, i) => (
          <div key={i} style={{
            fontSize: 8, color: '#999',
            fontFamily: "'Inter', sans-serif",
            textAlign: i === 0 && cols.length > 1 ? 'left' : i === cols.length - 1 && cols.length > 1 ? 'right' : 'center',
            lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {col}
          </div>
        ))}
      </div>

      {/* Número fixo da página — canto inferior direito */}
      {showNumber && (
        <div className="page-number-display" style={{
          flexShrink: 0,
          fontSize: 8,
          color: '#999',
          fontFamily: "'Inter', sans-serif",
          whiteSpace: 'nowrap',
          paddingLeft: 8,
          borderLeft: `1px solid ${theme.primaryColor}18`,
        }}>
          Página {pageNumber}
        </div>
      )}
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

      {/* Capa: footer SEM numeração (ABNT: capa não é contada nem numerada) */}
      <PageFooter theme={theme} pageNumber={null} />
    </div>
  )
}



