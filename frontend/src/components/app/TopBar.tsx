import { t } from '../../lib/tokens'

interface Props {
  consultantName: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export function TopBar({ consultantName, theme, onToggleTheme }: Props) {
  // Show first two initials from consultant name
  const initials = consultantName
    .replace(/\[.*?\]/g, '')     // strip role tags like [Admin]
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0] ?? '')
    .join('')
    .toUpperCase()

  return (
    <header style={{
      height: 52,
      borderBottom: `1px solid ${t.pb}`,
      background: t.night2,
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      flexShrink: 0,
      zIndex: 10,
    }}>
      {/* Breadcrumb */}
      <div style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, whiteSpace: 'nowrap', flex: 1 }}>
        <span style={{ color: t.fg4 }}>Workspace</span>
        <span style={{ margin: '0 8px', color: t.fg4 }}>/</span>
        <span style={{ color: t.fg }}>{consultantName}</span>
      </div>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        style={{
          width: 34, height: 34, borderRadius: 999,
          background: 'transparent',
          border: `1px solid ${t.pb}`,
          color: t.fg,
          cursor: 'pointer', fontSize: 14,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s',
          flexShrink: 0,
        }}
      >
        {theme === 'light' ? '☾' : '☀'}
      </button>

      {/* User avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: 999,
        background: t.gradSun,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: t.display, fontWeight: 700, fontSize: 12, color: t.ink,
        flexShrink: 0,
      }}>
        {initials}
      </div>
    </header>
  )
}
