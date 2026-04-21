import { t } from '../../lib/tokens'
import { PrimaryBtn } from '../shared/Button'

interface Props {
  onEnter: () => void
}

const navLinks = ['Demo', 'Recursos', 'Preços', 'FAQ']

export function SiteHeader({ onEnter }: Props) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'rgba(0,0,0,.3)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${t.pb}`,
      padding: '14px 32px',
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{ maxWidth: 1120, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        <img src="/assets/logo-vibraweb.svg" alt="Vibraweb" style={{ height: 34 }} />
        <nav style={{ marginLeft: 'auto', display: 'flex', gap: 28, alignItems: 'center' }}>
          {navLinks.map(link => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              style={{ fontFamily: t.body, fontSize: 13, color: t.fg2, fontWeight: 500 }}
            >
              {link}
            </a>
          ))}
          <PrimaryBtn small onClick={onEnter}>Entrar</PrimaryBtn>
        </nav>
      </div>
    </header>
  )
}
