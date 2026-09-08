import { motion } from 'framer-motion'
import { t } from '../../lib/tokens'
import { useSiteLayout } from '../../lib/site-layout'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'

const essencialFeatures = [
  'Geração de mapa cabalístico completo',
  'PDF com logomarca Vibraweb',
  'Apoio tático em cálculos e resultados',
  'Análise de nome de bebê e empresarial',
  '7 dias de teste gratuito ao cadastrar',
]

const proFeatures = [
  'Tudo do Plano Essencial',
  'White-label: remoção total da marca Vibraweb',
  'Adicione seu logo, cores e contatos ao PDF',
  'Painel "Personalizar Textos" desbloqueado',
  'Edite a interpretação de qualquer número',
]

interface Props {
  onSignup: () => void
}

export function Pricing({ onSignup }: Props) {
  // The two plan cards only stack on phones — portrait tablets still fit
  // them side by side within the 820px cap.
  const { mobile, padFor } = useSiteLayout()
  const pad = padFor(1120)
  return (
    <section
      id="planos"
      // Background comes from the SectionCard band in SitePage
      style={{
        background: 'transparent',
        borderTop: `1px solid ${t.bandLine}`,
        padding: mobile ? '40px 0 44px' : '80px 0 100px',
        position: 'relative',
      }}
    >
      {/* Centered glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 700, height: 400, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(88,28,60,.3) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: pad, position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <h2 style={{
            fontFamily: t.display, fontWeight: 900,
            fontSize: 'clamp(32px, 4vw, 52px)',
            lineHeight: 1.06, letterSpacing: '-.03em', color: t.fg,
            marginBottom: 14,
          }}>
            Planos para cada{' '}
            <span style={{ WebkitTextStroke: `2px ${t.gold}`, WebkitTextFillColor: 'transparent' }}>
              momento.
            </span>
          </h2>
          <p style={{ fontFamily: t.body, fontSize: 16, color: t.fg3 }}>
            Todos os novos cadastros entram com 7 dias de teste gratuito — sem cartão.
          </p>
        </motion.div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: mobile ? 'minmax(0,1fr)' : 'minmax(0,1fr) minmax(0,1fr)',
          gap: 24, maxWidth: 820, margin: '0 auto',
        }}>
          {/* Essencial */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.05 }}
            style={{
              background: 'rgba(28,16,22,.6)',
              border: `1px solid ${t.pb}`,
              borderRadius: 24, padding: '36px 32px',
            }}
          >
            <p style={{ fontFamily: t.body, fontSize: 11, fontWeight: 700, color: t.fg4, letterSpacing: '.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Plano Essencial
            </p>
            <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 52, color: t.fg, lineHeight: 1, marginBottom: 4 }}>
              R$&nbsp;49<span style={{ fontSize: 16, fontWeight: 600, color: t.fg4 }}>/mês</span>
            </div>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.fg4, marginBottom: 28 }}>Plano anual disponível com desconto.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {essencialFeatures.map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontFamily: t.body, fontSize: 14, color: t.fg2, alignItems: 'flex-start' }}>
                  <span style={{ color: t.gold, marginTop: 1, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <SecondaryBtn onClick={onSignup} style={{ width: '100%', justifyContent: 'center' }}>
              Começar Teste Grátis
            </SecondaryBtn>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55, delay: 0.15 }}
            style={{
              background: 'rgba(42,22,32,.55)',
              border: `1px solid rgba(253,184,19,.3)`,
              borderRadius: 24, padding: '36px 32px',
              position: 'relative',
              boxShadow: '0 0 50px rgba(253,184,19,.1), 0 0 80px rgba(232,93,4,.06)',
            }}
          >
            <span style={{
              position: 'absolute', top: -13, right: 28,
              padding: '5px 14px', borderRadius: 9999,
              background: t.gradCta,
              fontFamily: t.display, fontWeight: 700, fontSize: 10,
              color: t.night2, letterSpacing: '.1em',
            }}>
              PRO
            </span>
            <p style={{ fontFamily: t.body, fontSize: 11, fontWeight: 700, color: t.gold, letterSpacing: '.15em', textTransform: 'uppercase', margin: '0 0 12px' }}>
              Plano Pro
            </p>
            <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 52, lineHeight: 1, marginBottom: 4 }}>
              <span style={{ WebkitTextStroke: `1px ${t.gold}`, WebkitTextFillColor: 'transparent' }}>R$&nbsp;97</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: t.fg4, WebkitTextFillColor: t.fg4 }}>/mês</span>
            </div>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.fg4, marginBottom: 28 }}>Plano anual disponível com desconto.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {proFeatures.map(f => (
                <li key={f} style={{ display: 'flex', gap: 10, fontFamily: t.body, fontSize: 14, color: t.fg2, alignItems: 'flex-start' }}>
                  <span style={{ color: t.gold, marginTop: 1, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={onSignup} style={{ width: '100%', justifyContent: 'center' }}>
              Criar Meu Mapa
            </PrimaryBtn>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
