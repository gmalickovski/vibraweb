import { t } from '../../lib/tokens'
import { Link, useLocation } from 'react-router-dom'

const items = [
  { id: 'novo',       label: 'Novo Mapa',          icon: '✎', path: '/app/novo' },
  { id: 'salvos',     label: 'Mapas Salvos',       icon: '❋', path: '/app/salvos' },
  { id: 'templates',  label: 'Modelos',            icon: '▣', path: '/app/modelos' },
  { id: 'textos',     label: 'Personalizar Textos', icon: '☷', pro: true, path: '/app/textos' },
  { id: 'brand',      label: 'Minha Marca',        icon: '✦', pro: true, path: '/app/marca' },
  { id: 'settings',   label: 'Configurações',      icon: '⚙', path: '/app/configuracoes' },
]

export function Sidebar() {
  const location = useLocation()
  return (
    <aside style={{
      width: 220,
      background: t.night2,
      borderRight: `1px solid ${t.pb}`,
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px 16px' }}>
        <img src="/assets/logo-vibraweb-mark.svg" alt="" style={{ width: 26, height: 26 }} />
        <span style={{ fontFamily: t.display, fontWeight: 700, fontSize: 15, color: t.fg }}>Vibraweb</span>
      </div>

      {items.map(it => {
        const on = location.pathname.startsWith(it.path) || (it.path === '/app/novo' && location.pathname === '/app')
        return (
          <Link
            key={it.id}
            to={it.path}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px',
              border: 0,
              background: on ? 'rgba(253,184,19,.08)' : 'transparent',
              color: on ? t.gold : t.fg2,
              textDecoration: 'none',
              fontFamily: t.body,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 10,
              position: 'relative',
              textAlign: 'left',
              transition: 'background .15s, color .15s',
            }}
          >
            <span style={{ width: 18, textAlign: 'center', opacity: .9 }}>{it.icon}</span>
            {it.label}
            {it.pro && (
              <span style={{
                marginLeft: 'auto',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '.08em',
                padding: '2px 6px',
                borderRadius: 999,
                background: t.gradCta,
                color: t.night2,
              }}>PRO</span>
            )}
          </Link>
        )
      })}

      <div style={{ flex: 1 }} />

      <div style={{
        padding: 12,
        border: `1px solid ${t.pb}`,
        borderRadius: 12,
        background: 'rgba(42,22,32,.5)',
      }}>
        <div style={{
          fontFamily: t.display,
          fontSize: 12,
          fontWeight: 700,
          background: t.gradText,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 4,
        }}>Upgrade para Pro</div>
        <p style={{ fontSize: 11, color: t.fg3, margin: 0, lineHeight: 1.5, fontFamily: t.body }}>
          White-label, logo próprio e relatórios ilimitados.
        </p>
      </div>
    </aside>
  )
}
