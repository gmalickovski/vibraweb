import { t } from '../../lib/tokens'

interface Props {
  onEnter: () => void
}

const links = [
  { label: 'Recursos',   href: '#recursos' },
  { label: 'Planos',     href: '#planos'   },
  { label: 'FAQ',        href: '#faq'       },
  { label: 'Contato',    href: '#contato'   },
  { label: 'Termos',     href: '#'          },
  { label: 'Privacidade',href: '#'          },
]

export function SiteFooter({ onEnter: _onEnter }: Props) {
  return (
    <footer style={{
      background: '#0d0810',
      padding: '24px 32px',
    }}>
      <div style={{
        maxWidth: 1120, margin: '0 auto',
        display: 'flex', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px 32px',
      }}>
        {/* Logo mark */}
        <img
          src="/assets/logo-vibraweb-mark.svg"
          alt="Vibraweb"
          style={{ width: 26, opacity: 0.45, flexShrink: 0 }}
        />

        {/* Nav links */}
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', flex: 1 }}>
          {links.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              style={{
                fontFamily: t.body, fontSize: 12,
                color: t.fg4, letterSpacing: '.02em',
                transition: 'color .15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = t.fg2 }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = t.fg4 }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Copyright */}
        <p style={{
          fontFamily: t.body, fontSize: 11,
          color: t.fg4, margin: 0, whiteSpace: 'nowrap',
          letterSpacing: '.02em',
        }}>
          © {new Date().getFullYear()} Vibraweb · by Studio MLK
        </p>
      </div>
    </footer>
  )
}
