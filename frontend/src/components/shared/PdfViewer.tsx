// PdfViewer.tsx — componente de preview ao vivo compartilhado por Blocos do
// Relatório e Templates de Marca (Fase 1): card escuro com rolagem, header
// "PREVIEW AO VIVO — [contexto]" + contador, folhas em proporção A4 real com
// cantos retos (sem arredondamento, para parecer papel).
import type { ReactNode } from 'react'
import { t } from '../../lib/tokens'

interface PdfViewerProps {
  label: string
  pageCount: number
  children: ReactNode
}

export function PdfViewer({ label, pageCount, children }: PdfViewerProps) {
  return (
    <div style={{
      background: t.night, border: `1px solid ${t.pb}`, borderRadius: 16,
      display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', borderBottom: `1px solid ${t.pb}`, flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
          color: t.fg3, fontFamily: t.body,
        }}>
          PREVIEW AO VIVO — {label}
        </span>
        <span style={{ fontSize: 11, color: t.fg4, fontFamily: t.mono }}>
          {pageCount} {pageCount === 1 ? 'página' : 'páginas'}
        </span>
      </div>
      <div className="vw-scroll-area" style={{
        flex: 1, overflowY: 'auto', padding: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      }}>
        {children}
      </div>
    </div>
  )
}

export function PdfPageThumbnail({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <div style={{
      width: 200, aspectRatio: '210 / 297', background: '#fff', borderRadius: 0,
      boxShadow: '0 8px 20px rgba(0,0,0,0.35)', padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
      opacity: muted ? 0.35 : 1, flexShrink: 0,
    }}>
      {children}
    </div>
  )
}
