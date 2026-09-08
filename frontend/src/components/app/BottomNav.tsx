// BottomNav.tsx — navegação mobile (Item 4, Navegação global — Fase 1).
// Decisão tomada por Guilherme em 2026-07-11 (ver Produto/docs/vibra-web/requisitos.md,
// seção 4): 5 itens fixos, sem menu "Mais" — Blocos do Relatório ganha ícone próprio.
import { Link, useLocation } from 'react-router-dom'
import { t } from '../../lib/tokens'
import { SortBlocksIcon, TextInputIcon, TemplateIcon, FileNewIcon, FileEditIcon, InfoIcon, CreditCardIcon } from '../shared/icons'

const items = [
  // Mesmos ícones da Sidebar — ver comentário lá.
  { id: 'novo',   label: 'Novo',   icon: <FileNewIcon size={18} />, path: '/app/novo' },
  { id: 'salvos', label: 'Mapas',  icon: <FileEditIcon size={18} />, path: '/app/salvos' },
  { id: 'brand',  label: 'Modelos',  icon: <TemplateIcon size={18} />, path: '/app/marca' },
  { id: 'textos', label: 'Textos', icon: <TextInputIcon size={18} />, path: '/app/textos' },
  { id: 'blocos', label: 'Blocos', icon: <SortBlocksIcon size={18} />, path: '/app/blocos' },
]

const adminItems = [
  { id: 'overview', label: 'Visão geral', icon: <InfoIcon size={18} />, path: '/admin' },
  { id: 'system-base', label: 'Base', icon: <TemplateIcon size={18} />, path: '/admin/base/visual' },
  { id: 'plans', label: 'Planos', icon: <CreditCardIcon size={18} />, path: '/admin/plans' },
  { id: 'settings', label: 'Config.', icon: <SortBlocksIcon size={18} />, path: '/admin/settings' },
]

export function BottomNav({ mode = 'workspace' }: { mode?: 'workspace' | 'admin' }) {
  const location = useLocation()
  const navItems = mode === 'admin' ? adminItems : items

  return (
    <nav style={{
      display: 'flex', alignItems: 'stretch',
      background: t.night2, borderTop: `1px solid ${t.pb}`,
      flexShrink: 0, height: 64, paddingBottom: 'env(safe-area-inset-bottom, 0)',
    }}>
      {navItems.map(it => {
        const on = location.pathname.startsWith(it.path)
          || (it.path === '/app/novo' && location.pathname === '/app')
          || (it.id === 'system-base' && (location.pathname.startsWith('/admin/base') || location.pathname.startsWith('/admin/edicoes-globais')))
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
