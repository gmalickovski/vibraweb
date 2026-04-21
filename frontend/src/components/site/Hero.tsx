import { t } from '../../lib/tokens'
import { PrimaryBtn } from '../shared/Button'

interface Props {
  onCta: () => void
}

export function Hero({ onCta }: Props) {
  return (
    <section style={{
      position: 'relative',
      padding: '140px 32px',
      overflow: 'hidden',
      textAlign: 'center',
    }}>
      {/* Wine glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 700, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(88,28,60,.35), transparent 70%)',
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 1120, margin: '0 auto' }}>
        <span style={{
          fontFamily: t.body, fontSize: 12, fontWeight: 600, color: t.gold,
          textTransform: 'uppercase', letterSpacing: '.12em',
          padding: '6px 14px', borderRadius: 999,
          border: '1px solid rgba(253,184,19,.25)',
          background: 'rgba(253,184,19,.05)',
        }}>
          Plataforma SaaS · Numerologia Cabalística
        </span>

        <h1 style={{
          fontFamily: t.display, fontWeight: 900, fontSize: 80, lineHeight: 1.05,
          letterSpacing: '-.02em', color: t.fg, margin: '24px 0 18px',
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

        <p style={{
          fontFamily: t.body, fontSize: 19, color: t.fg2,
          maxWidth: 680, margin: '0 auto 32px', lineHeight: 1.6,
        }}>
          Gere mapas de numerologia cabalística com a sua marca, em tempo real.
          Análise pessoal, nome de bebê, nome empresarial e previsões —
          exportáveis em PDF e DOCX.
        </p>

        <PrimaryBtn onClick={onCta} style={{ fontSize: 15, padding: '18px 34px' }}>
          Começar Grátis
        </PrimaryBtn>

        <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg4, marginTop: 14 }}>
          14 dias grátis · sem cartão de crédito
        </p>
      </div>
    </section>
  )
}
