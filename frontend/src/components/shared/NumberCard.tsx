import { t } from '../../lib/tokens'

type Accent = 'gold' | 'coral' | 'magenta' | 'wine' | 'info'

interface Props {
  label: string
  value: number | null
  accent?: Accent
  large?: boolean
  onClick?: () => void
}

const accentGradients: Record<Accent, string | null> = {
  gold:    'linear-gradient(90deg,#FDB813,#E85D04)',
  coral:   'linear-gradient(90deg,#E85D04,#C0397B)',
  magenta: null,
  wine:    null,
  info:    null,
}
const accentColors: Record<Accent, string> = {
  gold:    t.gold,
  coral:   t.coral,
  magenta: t.magenta,
  wine:    t.wine,
  info:    t.info,
}

export function NumberCard({ label, value, accent = 'gold', large, onClick }: Props) {
  const grad = accentGradients[accent]
  const color = accentColors[accent]
  const numStyle = grad
    ? { background: grad, WebkitBackgroundClip: 'text' as const, backgroundClip: 'text' as const, WebkitTextFillColor: 'transparent', color: 'transparent' }
    : { color }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(42,22,32,.35)',
        border: `1px solid ${t.pb}`,
        borderRadius: 16,
        padding: large ? '18px 14px' : '14px 10px',
        textAlign: 'center',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, background 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.02)'
          e.currentTarget.style.background = 'rgba(42,22,32,.55)'
          e.currentTarget.style.boxShadow = `0 4px 15px rgba(0,0,0,0.2), 0 0 0 1px ${color}`
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.background = 'rgba(42,22,32,.35)'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      <div style={{
        fontFamily: t.display,
        fontWeight: 900,
        fontSize: large ? 56 : 40,
        lineHeight: 1,
        ...numStyle,
      }}>
        {value ?? '—'}
      </div>
      <div style={{
        fontFamily: t.body,
        fontSize: 10,
        color: t.fg3,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        fontWeight: 600,
        marginTop: 4,
      }}>
        {label}
      </div>
    </div>
  )
}
