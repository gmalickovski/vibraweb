// PageTitle.tsx — título de página + ícone "i" (hover/toque mostra explicação).
// Substitui o padrão antigo de subtítulo fixo (Item 4, Navegação global — Fase 1).
// Usado em Blocos do Relatório, Templates (Marca) e Personalizar Textos.

import { useState } from 'react'
import { InfoIcon } from './icons'
import { t } from '../../lib/tokens'

interface PageTitleProps {
  title: string
  info: string
  size?: number
}

export function PageTitle({ title, info, size = 20 }: PageTitleProps) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      <h1 style={{ fontSize: size, fontWeight: 700, margin: 0, fontFamily: t.display, color: t.fg }}>
        {title}
      </h1>
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
        aria-label={`Sobre ${title}`}
        style={{
          width: 20, height: 20, borderRadius: '50%',
          border: 'none', background: 'transparent',
          color: t.fg3,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, padding: 0,
        }}
      >
        <InfoIcon size={16} />
      </button>
      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 8,
            width: 260, padding: '10px 14px', borderRadius: 8,
            background: t.night2, border: `1px solid ${t.pb}`,
            color: t.fg2, fontFamily: t.body, fontSize: 12, lineHeight: 1.5,
            zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {info}
        </div>
      )}
    </div>
  )
}
