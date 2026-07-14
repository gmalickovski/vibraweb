// BottomNav.tsx — navegação mobile (Item 4, Navegação global — Fase 1).
// Decisão tomada por Guilherme em 2026-07-11 (ver Produto/docs/vibra-web/requisitos.md,
// seção 4): 5 itens fixos, sem menu "Mais" — Blocos do Relatório ganha ícone próprio.
import { Link, useLocation } from 'react-router-dom'
import { t } from '../../lib/tokens'

const items = [
  { id: 'novo',   label: 'Novo',   icon: '✎', path: '/app/novo' },
  { id: 'salvos', label: 'Mapas',  icon: '❋', path: '/app/salvos' },
  { id: 'brand',  label: 'Marca',  icon: '▣', path: '/app/marca' },
  { id: 'textos', label: 'Textos', icon: '☷', path: '/app/textos' },
  { id: 'blocos', label: 'Blocos', icon: '☰', path: '/app/blocos' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav style={{
      display: 'flex', alignItems: 'stretch',
      background: t.night2, borderTop: `1px solid ${t.pb}`,
      flexShrink: 0, height: 64, paddingBottom: 'env(safe-area-inset-bottom, 0)',
    }}>
      {items.map(it => {
        const on = location.pathname.startsWith(it.path) || (it.path === '/app/novo' && location.pathname === '/app')
        return (
          <Link
            key={it.id}
            to={it.path}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, textDecoration: 'none',
              color: on ? t.gold : t.fg3,
              fontFamily: t.body, fontSize: 10, fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 18, opacity: on ? 1 : 0.85 }}>{it.icon}</span>
            {it.label}
          </Link>
        )
      })}
    </nav>
  )
}
