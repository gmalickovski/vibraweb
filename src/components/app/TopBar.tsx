import { t } from '../../lib/tokens'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'

interface Props {
  consultantName: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onExport: () => void
  onSave?: () => void
  saving?: boolean
}

export function TopBar({ consultantName, theme, onToggleTheme, onExport, onSave, saving }: Props) {
  const initials = consultantName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  return (
    <header style={{
      height: 60,
      borderBottom: `1px solid ${t.pb}`,
      background: t.night2,
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 12,
      flexShrink: 0,
    }}>
      <div style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, whiteSpace: 'nowrap' }}>
        <span style={{ color: t.fg4 }}>Workspace</span>
        <span style={{ margin: '0 8px', color: t.fg4 }}>/</span>
        <span style={{ color: t.fg }}>{consultantName}</span>
      </div>
      <div style={{ flex: 1 }} />

      <button
        onClick={onToggleTheme}
        title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'transparent',
          border: `1px solid ${t.pb}`,
          color: t.fg,
          cursor: 'pointer', fontSize: 15,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .2s',
          flexShrink: 0,
        }}
      >
        {theme === 'light' ? '☾' : '☀'}
      </button>

      {onSave && (
        <SecondaryBtn onClick={onSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </SecondaryBtn>
      )}
      <SecondaryBtn onClick={onExport}>Exportar</SecondaryBtn>
      <PrimaryBtn small>Gerar PDF</PrimaryBtn>

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
