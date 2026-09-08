import type { ReactNode } from 'react'
import { t } from '../../lib/tokens'
import { ChevronIcon } from './icons'

interface ExpandablePanelProps {
  title: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
  actionSlot?: ReactNode
  bodyPadding?: number | string
}

/** Painel expansível de uma única coluna para listas e formulários.
 * O estado aberto pertence à página, permitindo que ela mantenha somente
 * uma seção aberta por vez quando isso fizer sentido para o fluxo. */
export function ExpandablePanel({
  title,
  open,
  onToggle,
  children,
  actionSlot,
  bodyPadding = 12,
}: ExpandablePanelProps) {
  return (
    <section style={{ border: `1px solid ${t.pb}`, borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,0.018)' }}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
        style={{
          width: '100%', minHeight: 50, padding: '10px 14px', boxSizing: 'border-box',
          display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 12,
          cursor: 'pointer', userSelect: 'none',
          background: open ? 'rgba(255,255,255,0.045)' : 'transparent',
          transition: 'background 0.18s ease',
        }}
      >
        <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: t.fg3 }}>
          {actionSlot}
          <ChevronIcon open={open} size={14} />
        </div>
      </div>
      {open && (
        <div style={{ padding: bodyPadding, borderTop: `1px solid ${t.pb}` }}>
          {children}
        </div>
      )}
    </section>
  )
}
