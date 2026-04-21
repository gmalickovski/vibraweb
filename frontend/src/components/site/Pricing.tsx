import { t } from '../../lib/tokens'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'

const freeFeatures = [
  'Até 3 análises por mês',
  'Relatório PDF padrão',
  'Logo da Vibraweb no relatório',
]
const proFeatures = [
  'Análises ilimitadas',
  'White-label completo (logo, cores, contatos)',
  'Exportação PDF e DOCX',
  'Comparação de nomes de bebê (3 variações)',
  'Modelos personalizáveis',
  'Suporte prioritário',
]

interface Props {
  onSignup: () => void
}

export function Pricing({ onSignup }: Props) {
  return (
    <section id="preços" style={{
      padding: '96px 32px',
      background: 'rgba(28,16,22,.5)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 600, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(88,28,60,.35), transparent 70%)',
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 48px' }}>
          <h2 style={{
            fontFamily: t.display, fontWeight: 700, fontSize: 44, color: t.fg,
            letterSpacing: '-.02em', lineHeight: 1.1,
          }}>
            Planos{' '}
            <span style={{
              background: t.gradText,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Simples.
            </span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 780, margin: '0 auto' }}>
          {/* Free */}
          <div style={{
            background: 'rgba(42,22,32,.35)',
            border: `1px solid ${t.pb}`,
            borderRadius: 24,
            padding: 32,
          }}>
            <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 22, color: t.fg, margin: 0 }}>Essencial</h3>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, margin: '6px 0 20px' }}>Para começar.</p>
            <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 48, color: t.fg, lineHeight: 1 }}>R$ 0</div>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.fg4, margin: '2px 0 22px' }}>para sempre</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {freeFeatures.map(f => (
                <li key={f} style={{ fontFamily: t.body, fontSize: 13, color: t.fg2 }}>
                  <span style={{ color: t.gold, marginRight: 8 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <SecondaryBtn onClick={onSignup} style={{ marginTop: 26, width: '100%', justifyContent: 'center' }}>
              Criar Conta
            </SecondaryBtn>
          </div>

          {/* Pro */}
          <div style={{
            background: 'rgba(42,22,32,.5)',
            border: `1px solid ${t.wine}`,
            borderRadius: 24,
            padding: 32,
            position: 'relative',
            boxShadow: '0 0 40px rgba(253,184,19,.15), 0 0 60px rgba(232,93,4,.08)',
          }}>
            <span style={{
              position: 'absolute', top: -12, right: 24,
              padding: '4px 12px', borderRadius: 999,
              background: t.gradCta,
              fontFamily: t.display, fontWeight: 700, fontSize: 10, color: t.night2,
              letterSpacing: '.08em',
            }}>POPULAR</span>

            <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 22, margin: 0 }}>
              <span style={{
                background: t.gradText,
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Pro</span>
            </h3>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, margin: '6px 0 20px' }}>Para consultores profissionais.</p>
            <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 48, color: t.fg, lineHeight: 1 }}>
              R$ 79<span style={{ fontSize: 16, color: t.fg3, fontWeight: 600 }}>/mês</span>
            </div>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.fg4, margin: '2px 0 22px' }}>ou R$ 790/ano</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {proFeatures.map(f => (
                <li key={f} style={{ fontFamily: t.body, fontSize: 13, color: t.fg2 }}>
                  <span style={{ color: t.gold, marginRight: 8 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={onSignup} style={{ marginTop: 26, width: '100%', justifyContent: 'center' }}>
              Assinar Pro
            </PrimaryBtn>
          </div>
        </div>
      </div>
    </section>
  )
}
