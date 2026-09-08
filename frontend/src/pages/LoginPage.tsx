import { useState } from 'react'
import { t } from '../lib/tokens'
import { Field } from '../components/shared/Field'
import { PrimaryBtn, SecondaryBtn } from '../components/shared/Button'
import { resetUserProfileCache, neon } from '../lib/neon'

interface Props {
  onSuccess: () => void
  onBack: () => void
  mode?: 'workspace' | 'admin'
}

export function LoginPage({ onSuccess, onBack, mode = 'workspace' }: Props) {
  const isAdminLogin = mode === 'admin'
  const [isLogin, setIsLogin] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  async function handleSubmit() {
    setLoading(true)
    setError('')
    setMsg('')

    // Validação básica
    if (!email || !password) {
      setError('Por favor, preencha o email e a senha.')
      setLoading(false)
      return
    }
    if (!isLogin && (!firstName || !lastName)) {
      setError('Por favor, preencha seu nome e sobrenome.')
      setLoading(false)
      return
    }
    if (!isLogin && password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      setLoading(false)
      return
    }

    if (isLogin) {
      const { error: err } = await neon.auth.signInWithPassword({ email, password })
      if (err) setError(err.message)
      else {
        resetUserProfileCache()
        onSuccess()
      }
    } else {
      const { error: err } = await neon.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      })
      if (err) {
        setError(err.message)
      } else {
        resetUserProfileCache()
        setMsg('Conta criada com sucesso! Você já pode entrar.')
        setIsLogin(true)
      }
    }
    setLoading(false)
  }

  return (
    <div className="vw-auth-page" style={{
      minHeight: '100vh',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
      background: t.night,
    }}>
      {/* Left — brand panel */}
      <div className="vw-auth-brand" style={{
        position: 'relative',
        padding: 48,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(88,28,60,.5), transparent 70%)',
        overflow: 'hidden',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            display: 'inline-block', padding: 0
          }}
        >
          <img src="/assets/logo-vibraweb.svg" alt="Vibraweb" style={{ height: 34 }} />
        </button>
        <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{
            fontFamily: t.display, fontWeight: 900, fontSize: 52, lineHeight: 1.05,
            letterSpacing: '-.02em', color: t.fg, margin: 0,
          }}>
            {isAdminLogin ? 'Acesso administrativo do' : 'Sua assinatura em'}<br />
            <span style={{
              background: t.gradText,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {isAdminLogin ? 'Vibraweb.' : 'harmonia com os números.'}
            </span>
          </h1>
          <p style={{ fontFamily: t.body, fontSize: 15, color: t.fg3, marginTop: 16, maxWidth: 420, lineHeight: 1.6 }}>
            {isAdminLogin ? 'Gerencie conteúdo global, planos, templates e a operação do produto.' : 'Gere mapas completos de Numerologia Cabalística com a sua marca — em tempo real, exportáveis em PDF e DOCX.'}
          </p>
        </div>
        <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4 }}>
          © {new Date().getFullYear()} Vibraweb · by Studio MLK
        </div>
      </div>

      {/* Right — login form */}
      <div className="vw-auth-form" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderLeft: `1px solid ${t.pb}`,
        background: t.night2,
      }}>
        <div className="vw-auth-form-inner" style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 28, color: t.fg, margin: 0 }}>
              {isLogin ? 'Entrar' : 'Criar minha conta'}
            </h2>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, marginTop: 4 }}>
              {isAdminLogin ? 'Entre no console interno do Vibraweb.' : isLogin ? 'Acesse seu workspace profissional.' : 'Comece a gerar seus próprios relatórios agora.'}
            </p>
          </div>

          {!isLogin && (
            <div className="vw-auth-name-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
              <Field label="Nome" value={firstName} onChange={setFirstName} placeholder="João" type="text" />
              <Field label="Sobrenome" value={lastName} onChange={setLastName} placeholder="Silva" type="text" />
            </div>
          )}

          <Field label="E-mail" value={email} onChange={setEmail} placeholder="seu@email.com" type="email" />
          
          <div style={{ position: 'relative' }}>
            <Field label="Senha" value={password} onChange={setPassword} placeholder="••••••••" type="password" />
            
            {isLogin && (
              <a href="#" style={{ 
                fontFamily: t.body, fontSize: 12, color: t.fg3, 
                position: 'absolute', top: 2, right: 0, 
                textDecoration: 'none', transition: 'color .2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = t.gold}
              onMouseLeave={e => e.currentTarget.style.color = t.fg3}
              >
                Esqueci a senha
              </a>
            )}
          </div>

          {error && (
            <div style={{ fontFamily: t.body, fontSize: 12, color: '#E23E57', padding: '10px 14px', borderRadius: 8, background: 'rgba(226,62,87,.08)', border: '1px solid rgba(226,62,87,.2)' }}>
              {error}
            </div>
          )}
          
          {msg && (
            <div style={{ fontFamily: t.body, fontSize: 12, color: '#38A169', padding: '10px 14px', borderRadius: 8, background: 'rgba(56,161,105,.08)', border: '1px solid rgba(56,161,105,.2)' }}>
              {msg}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <PrimaryBtn onClick={handleSubmit} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? 'Aguarde...' : isAdminLogin ? 'Entrar no Admin' : isLogin ? 'Entrar no Workspace' : 'Criar Workspace Grátis'}
            </PrimaryBtn>

            {!isAdminLogin && (
              <SecondaryBtn
                onClick={() => { setIsLogin(!isLogin); setError(''); setMsg(''); }}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {isLogin ? 'Criar uma conta nova' : 'Já possuo uma conta (Entrar)'}
              </SecondaryBtn>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
