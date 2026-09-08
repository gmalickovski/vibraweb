import { useState, useEffect } from 'react'
import { t } from '../../lib/tokens'
import { useSiteLayout } from '../../lib/site-layout'
import { PrimaryBtn } from '../shared/Button'

interface Props {
  onEnter: () => void
}

const navLinks = [
  { label: 'Demo',      href: '#demo'     },
  { label: 'Recursos',  href: '#recursos'  },
  { label: 'Planos',    href: '#planos'    },
  { label: 'FAQ',       href: '#faq'       },
]

export function SiteHeader({ onEnter }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  // Phones drop the nav links (they would wrap or collide with the logo)
  // and keep only the logo + the entry CTA.
  const { mobile, stack, padFor } = useSiteLayout()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Rotating to landscape restores the inline links — drop the open sheet
  useEffect(() => { if (!mobile) setMenuOpen(false) }, [mobile])

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'background .3s, border-color .3s, backdrop-filter .3s',
      // An open menu also needs the solid bar, or the sheet floats over raw page
      background: scrolled || menuOpen ? 'rgba(18,10,16,.85)' : 'transparent',
      backdropFilter: scrolled || menuOpen ? 'blur(16px)' : 'none',
      borderBottom: scrolled || menuOpen ? `1px solid ${t.pb}` : '1px solid transparent',
      // Vertical only — the horizontal gutter lives on the centred container
      // below so the logo clears the wave spine like every other section.
      padding: mobile ? '12px 0' : '14px 0',
    }}>
      <div style={{
        maxWidth: 1120, width: '100%', margin: '0 auto',
        padding: padFor(1120),
        display: 'flex', alignItems: 'center',
      }}>
        <img src="/assets/logo-vibraweb.svg" alt="Vibraweb" style={{ height: mobile ? 26 : 30 }} />

        <nav style={{ marginLeft: 'auto', display: 'flex', gap: stack ? 16 : 32, alignItems: 'center' }}>
          {!mobile && navLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                fontFamily: t.body, fontSize: 13, color: t.fg3, fontWeight: 500,
                letterSpacing: '.02em', transition: 'color .2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.fg }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.fg3 }}
            >
              {label}
            </a>
          ))}
          <PrimaryBtn small onClick={onEnter}>Entrar</PrimaryBtn>

          {/* Phones: the links collapse into a burger that opens a sheet */}
          {mobile && (
            <button
              type="button"
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              style={{
                width: 40, height: 40, flexShrink: 0,
                display: 'grid', placeItems: 'center',
                background: 'transparent', cursor: 'pointer',
                border: `1px solid ${t.pb}`, borderRadius: 12,
                padding: 0,
              }}
            >
              <span style={{ display: 'block', width: 18, height: 12, position: 'relative' }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      position: 'absolute', left: 0, width: '100%', height: 1.5,
                      borderRadius: 2, background: t.fg,
                      transition: 'transform .25s ease, opacity .2s ease, top .25s ease',
                      top: menuOpen ? 5 : i * 5.25,
                      opacity: menuOpen && i === 1 ? 0 : 1,
                      transform: menuOpen
                        ? `rotate(${i === 0 ? 45 : i === 2 ? -45 : 0}deg)`
                        : 'none',
                    }}
                  />
                ))}
              </span>
            </button>
          )}
        </nav>
      </div>

      {/* Mobile menu sheet — 0fr → 1fr animates the row track instead of
          max-height: no layout thrash, and no magic pixel cap that could
          clip links added later. */}
      {mobile && (
        <div
          id="site-menu"
          style={{
            display: 'grid',
            gridTemplateRows: menuOpen ? '1fr' : '0fr',
            opacity: menuOpen ? 1 : 0,
            transition: 'grid-template-rows .32s ease, opacity .22s ease',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>
            <nav style={{
              display: 'flex', flexDirection: 'column',
              padding: '14px 20px 18px',
              marginTop: 12,
              borderTop: `1px solid ${t.pb}`,
              background: 'rgba(18,10,16,.96)',
              backdropFilter: 'blur(16px)',
            }}>
              {navLinks.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: t.body, fontSize: 15, color: t.fg2, fontWeight: 500,
                    letterSpacing: '.02em', padding: '13px 0', textAlign: 'center',
                  }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
