import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { t } from '../../lib/tokens'
import { MoonIcon, SunIcon } from '../shared/icons'
import { useLocation } from 'react-router-dom'

export interface TopBarAction {
  id: string
  label: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: 'default' | 'accent'
}

interface ShellHeaderContextValue {
  actions: TopBarAction[]
  setActions: (actions: TopBarAction[]) => void
}

const ShellHeaderContext = createContext<ShellHeaderContextValue | null>(null)

export function ShellHeaderProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<TopBarAction[]>([])
  return <ShellHeaderContext.Provider value={{ actions, setActions }}>{children}</ShellHeaderContext.Provider>
}

export function useShellHeaderActions(actions: TopBarAction[]) {
  const context = useContext(ShellHeaderContext)
  useEffect(() => {
    if (!context) return
    context.setActions(actions)
    return () => context.setActions([])
  }, [context, actions])
}

interface Props {
  consultantName: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  actions?: TopBarAction[]
}

export function TopBar({ consultantName, theme, onToggleTheme, actions: directActions }: Props) {
  const shellHeader = useContext(ShellHeaderContext)
  const location = useLocation()
  const isAdmin = location.pathname.startsWith('/admin')
  const surfaceLabel = isAdmin ? 'Admin' : 'Workspace'
  const identityLabel = isAdmin ? 'Console interno' : consultantName
  const actions = directActions ?? shellHeader?.actions ?? []

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
    <header className="vw-topbar" style={{
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
      {/* Contexto da superfície — não é breadcrumb: não há níveis navegáveis aqui. */}
      <div className="vw-topbar-context" aria-label={`${surfaceLabel}: ${identityLabel}`}>
        <strong className="vw-topbar-brand">Vibraweb</strong>
        <span className="vw-topbar-divider" aria-hidden="true" />
        <span className="vw-topbar-surface">{surfaceLabel}</span>
        <span className="vw-topbar-identity">{identityLabel}</span>
      </div>

      <div className="vw-topbar-actions" aria-label="Ações desta página">
        {actions.map(action => (
          <button
            key={action.id}
            className={`vw-topbar-action${action.tone === 'accent' ? ' is-accent' : ''}`}
            onClick={action.onClick}
            disabled={action.disabled}
            title={action.label}
            aria-label={action.label}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
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
        {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
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
