import { t } from '../../lib/tokens'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'
import { useLocation, useNavigate } from 'react-router-dom'
import { printDocument } from '../../lib/print-document'
import { resolveDocTheme } from '../../lib/theme-resolver'
import type { UserProfile } from '../../lib/supabase'

interface Props {
  consultantName: string
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onPreview: () => void
  onSave?: () => void
  saving?: boolean
  previewSubject?: string
  profile?: import('../../lib/supabase').UserProfile | null
}

export function TopBar({ consultantName, theme, onToggleTheme, onPreview, onSave, saving, previewSubject, profile }: Props) {
  const initials = consultantName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const location = useLocation()
  const navigate = useNavigate()
  const isPreview = location.pathname === '/app/preview'

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
      zIndex: 10,
    }}>
      {isPreview ? (
        // ── Preview mode header ───────────────────────────────────────
        <>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent', border: `1px solid ${t.pb}`,
              color: t.fg3, padding: '6px 14px', borderRadius: 8,
              cursor: 'pointer', fontFamily: t.body, fontSize: 13,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Voltar
          </button>
          <span style={{ fontFamily: t.display, fontWeight: 600, fontSize: 14, color: t.fg, flex: 1 }}>
            {previewSubject || 'Prévia do Mapa'}
          </span>
          <PrimaryBtn small onClick={() => {
            const docTheme = resolveDocTheme(profile ?? null)
            printDocument(previewSubject || 'Mapa Numerológico', docTheme)
          }}>
            ⬇ Salvar PDF
          </PrimaryBtn>
        </>
      ) : (
        // ── Normal app header ────────────────────────────────────────
        <>
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
            <SecondaryBtn small onClick={onSave} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </SecondaryBtn>
          )}
          <PrimaryBtn small onClick={onPreview}>📄 Prévia do PDF</PrimaryBtn>

          <div style={{
            width: 32, height: 32, borderRadius: 999,
            background: t.gradSun,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: t.display, fontWeight: 700, fontSize: 12, color: t.ink,
            flexShrink: 0,
          }}>
            {initials}
          </div>
        </>
      )}
    </header>
  )
}
