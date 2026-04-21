import { useState } from 'react'
import { t } from '../lib/tokens'
import { Field } from '../components/shared/Field'
import { PrimaryBtn } from '../components/shared/Button'
import { supabase } from '../lib/supabase'

interface Props {
  onSuccess: () => void
  onBack: () => void
}

export function LoginPage({ onSuccess, onBack }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      onSuccess()
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      background: t.night,
    }}>
      {/* Left — brand panel */}
      <div style={{
        position: 'relative',
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'radial-gradient(ellipse at center, rgba(88,28,60,.5), transparent 70%)',
        overflow: 'hidden',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            display: 'inline-block', padding: 0,
          }}
        >
          <img src="/assets/logo-vibraweb.svg" alt="Vibraweb" style={{ height: 34 }} />
        </button>
        <div>
          <h1 style={{
            fontFamily: t.display, fontWeight: 900, fontSize: 52, lineHeight: 1.05,
            letterSpacing: '-.02em', color: t.fg, margin: 0,
          }}>
            Sua assinatura em<br />
            <span style={{
              background: t.gradText,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              harmonia com os números.
            </span>
          </h1>
          <p style={{ fontFamily: t.body, fontSize: 15, color: t.fg3, marginTop: 16, maxWidth: 420, lineHeight: 1.6 }}>
            Gere mapas completos de Numerologia Cabalística com a sua marca — em tempo real, exportáveis em PDF e DOCX.
          </p>
        </div>
        <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4 }}>
          © {new Date().getFullYear()} Vibraweb · by Studio MLK
        </div>
      </div>

      {/* Right — login form */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderLeft: `1px solid ${t.pb}`,
        background: t.night2,
      }}>
        <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <h2 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 26, color: t.fg, margin: 0 }}>
              Entrar
            </h2>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, marginTop: 4 }}>
              Acesse seu workspace profissional.
            </p>
          </div>

          <Field label="E-mail" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
          <Field label="Senha" value={password} onChange={setPassword} placeholder="••••••••" type="password" />

          {error && (
            <div style={{ fontFamily: t.body, fontSize: 12, color: '#E23E57', padding: '8px 12px', borderRadius: 8, background: 'rgba(226,62,87,.08)', border: '1px solid rgba(226,62,87,.2)' }}>
              {error}
            </div>
          )}

          <PrimaryBtn onClick={handleSubmit} disabled={loading} style={{ marginTop: 6 }}>
            {loading ? 'Entrando...' : 'Entrar no Workspace'}
          </PrimaryBtn>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -4 }}>
            <a href="#" style={{ fontFamily: t.body, fontSize: 12, color: t.fg3 }}>Criar conta</a>
            <a href="#" style={{ fontFamily: t.body, fontSize: 12, color: t.gold }}>Esqueci a senha</a>
          </div>
        </div>
      </div>
    </div>
  )
}
