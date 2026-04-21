import { t } from '../../lib/tokens'

export interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
}

export function TabBar({ tabs, value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {tabs.map(tab => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              fontFamily: t.display,
              fontWeight: 700,
              fontSize: 12,
              padding: '8px 16px',
              borderRadius: 9999,
              border: `1px solid ${active ? t.gold : t.pb}`,
              background: active ? 'rgba(253,184,19,.08)' : 'transparent',
              color: active ? t.gold : t.fg2,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              whiteSpace: 'nowrap',
              transition: 'all .2s',
            }}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
