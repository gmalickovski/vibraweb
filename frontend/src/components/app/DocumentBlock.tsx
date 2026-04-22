// DocumentBlock.tsx — renders a single block of the numerology document.

import type { DocumentBlock as Block, BlockType } from '../../lib/document-builder'
import type { DocTheme } from '../../lib/theme-resolver'

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

export function DocumentBlockRenderer({ block, theme }: Props) {
  switch (block.type as BlockType) {

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
            textTransform: 'uppercase',
            letterSpacing: '.1em',
            color: theme.primaryColor,
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
      const { label, value, accent, titulo, texto } = block.data as {
        label: string; value: number | null; accent: string; titulo: string; texto: string
      }
      const color = getAccentColor(accent, theme)
      return (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '72px 1fr',
          gap: 20,
          marginBottom: 28,
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
            {value ?? '—'}
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: '#888', fontWeight: 600, marginBottom: 4 }}>
              {titulo}
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.7, color: '#333', margin: 0, whiteSpace: 'pre-wrap' }}>
              {texto || 'Consulte um numerólogo para uma leitura personalizada deste número.'}
            </p>
          </div>
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
          <p style={{ fontSize: 11, color: '#555', margin: 0, fontStyle: 'italic' }}>{description}</p>
        </div>
      )
    }

    case 'cycles-entry': {
      const { ciclos } = block.data as { ciclos: { inicio: number | string; fim: number | string; regente: number }[] }
      return (
        <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.primaryColor, fontWeight: 700, margin: '0 0 12px' }}>
            Ciclos de Vida
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {ciclos.map((c, i) => (
              <div key={i} style={{ border: `1px solid ${theme.primaryColor}22`, borderRadius: 10, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 9, textTransform: 'uppercase', color: '#888', letterSpacing: '.06em' }}>{i + 1}º Ciclo</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: theme.primaryColor, lineHeight: 1.2 }}>{c.regente}</div>
                <div style={{ fontSize: 9, color: '#999', marginTop: 4 }}>{c.inicio} – {c.fim}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'conjugal-entry': {
      const { numeroAmor } = block.data as { numeroAmor: number }
      const h = HARMONIA_TABLE[numeroAmor]
      if (!h) return null
      return (
        <div style={{ marginBottom: 24, breakInside: 'avoid' }}>
          <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: theme.primaryColor, fontWeight: 700, margin: '0 0 12px' }}>
            Harmonia Conjugal — Número {numeroAmor}
          </h3>
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

    case 'orientation': {
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 15, fontWeight: 700, color: theme.primaryColor,
            margin: '0 0 12px', fontFamily: "'Poppins', sans-serif",
          }}>
            {'\u004frient\u0061\u00e7\u00e3o Inicial'}
          </h2>
          <p style={{ fontSize: 11, lineHeight: 1.9, color: '#444', margin: 0 }}>
            Este documento é o seu Mapa Numerológico Pessoal, um retrato completo da sua essência,
            construído a partir do nome de nascimento e data de nascimento. A Numerologia Caldaica
            interpreta padrões numéricos para revelar talentos, missão de vida, desafios e os ciclos
            de tempo pelos quais você atravessa. Utilize este mapa como ferramenta de autoconhecimento
            e planejamento — não como um destino imutável, mas como uma bússola para escolhas mais conscientes.
          </p>
        </div>
      )
    }

    case 'summary-table': {
      const { rows } = block.data as { rows: { label: string; value: number }[] }
      return (
        <div className={block.pageBreakBefore ? 'doc-page-break' : ''} style={{ breakInside: 'avoid', marginBottom: 28 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: theme.primaryColor, margin: '0 0 16px', fontFamily: "'Poppins', sans-serif" }}>
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
