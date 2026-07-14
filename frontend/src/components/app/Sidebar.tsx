import { useState } from 'react'
import { t } from '../../lib/tokens'
import { Link, useLocation } from 'react-router-dom'

const items = [
  { id: 'novo',       label: 'Novo Mapa',          icon: '✎', path: '/app/novo' },
  { id: 'salvos',     label: 'Mapas',              icon: '❋', path: '/app/salvos' },
  { id: 'brand',      label: 'Templates',          icon: '▣', pro: true, path: '/app/marca' },
  { id: 'textos',     label: 'Textos',             icon: '☷', pro: true, path: '/app/textos' },
  { id: 'blocos',     label: 'Blocos',             icon: '☰', path: '/app/blocos' },
  { id: 'settings',   label: 'Configurações',      icon: '⚙', path: '/app/configuracoes' },
]

export function Sidebar() {
  const location = useLocation()
  const [hovered, setHovered] = useState(false)

  const collapsedWidth = 72
  const expandedWidth = 240

  return (
    <div style={{ width: collapsedWidth, flexShrink: 0, position: 'relative', zIndex: 100 }}>
      <aside 
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: hovered ? expandedWidth : collapsedWidth,
          background: t.night2,
          borderRight: `1px solid ${t.pb}`,
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          boxShadow: hovered ? '10px 0 20px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          padding: '0 20px 24px', 
          whiteSpace: 'nowrap' 
        }}>
          <img src="/assets/logo-vibraweb-mark.svg" alt="Vibraweb" style={{ width: 32, height: 32, minWidth: 32 }} />
          <span style={{ 
            fontFamily: t.display, 
            fontWeight: 700, 
            fontSize: 18, 
            color: t.fg, 
            opacity: hovered ? 1 : 0, 
            transition: 'opacity 0.2s',
            visibility: hovered ? 'visible' : 'hidden'
          }}>Vibraweb</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {items.map(it => {
            const on = location.pathname.startsWith(it.path) || (it.path === '/app/novo' && location.pathname === '/app')
            return (
              <Link
                key={it.id}
                to={it.path}
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '12px',
                  background: on ? 'rgba(253,184,19,.08)' : 'transparent',
                  color: on ? t.gold : t.fg2,
                  textDecoration: 'none',
                  fontFamily: t.body,
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 12,
                  whiteSpace: 'nowrap',
                  transition: 'background .15s, color .15s',
                }}
              >
                <span style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  width: 24, 
                  minWidth: 24, 
                  fontSize: 20, 
                  opacity: on ? 1 : 0.8 
                }}>
                  {it.icon}
                </span>
                
                <span style={{ 
                  marginLeft: 16, 
                  opacity: hovered ? 1 : 0, 
                  transition: 'opacity 0.2s',
                  visibility: hovered ? 'visible' : 'hidden',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {it.label}
                </span>

                {it.pro && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: t.gradCta,
                    color: t.night2,
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    visibility: hovered ? 'visible' : 'hidden',
                    flexShrink: 0
                  }}>PRO</span>
                )}
              </Link>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          padding: 16,
          margin: '0 12px',
          border: `1px solid ${t.pb}`,
          borderRadius: 12,
          background: 'rgba(42,22,32,.5)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
          visibility: hovered ? 'visible' : 'hidden',
          whiteSpace: 'normal',
          minWidth: expandedWidth - 24,
        }}>
          <div style={{
            fontFamily: t.display,
            fontSize: 13,
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
    </div>
  )
}
