import { motion } from 'framer-motion'
import { t } from '../../lib/tokens'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'

const freeFeatures = [
  '7 dias de teste grátis na plataforma',
  'Apoio tático em cálculos e resultados na UI',
  'Geração de relatórios com limites',
  'Mapa completo padrão (Logomarca Vibraweb)',
]
const proFeatures = [
  'Uso ilimitado sem restrições de sistema',
  'White-label completo (remoção total da marca Vibraweb)',
  'Acesso ao painel "Personalizar Textos"',
  'Mude a interpretação padrão de qualquer número e linha',
  'Exportação PDF e DOCX com suas cores',
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

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        style={{ position: 'relative', maxWidth: 1120, margin: '0 auto' }}
      >
        <div style={{ textAlign: 'center', maxWidth: 620, margin: '0 auto 48px' }}>
          <h2 style={{
            fontFamily: t.display, fontWeight: 700, fontSize: 44, color: t.fg,
            letterSpacing: '-.02em', lineHeight: 1.1,
          }}>
            Assinaturas{' '}
            <span style={{
              background: t.gradText,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Sob Medida.
            </span>
          </h2>
          <p style={{ fontFamily: t.body, fontSize: 16, color: t.fg3, marginTop: 12 }}>
            Todos os novos cadastros ganham automaticamente os 7 dias de Teste Gratuito.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20, maxWidth: 780, margin: '0 auto' }}>
          {/* Essencial */}
          <motion.div 
            whileHover={{ y: -5 }}
            style={{
              background: 'rgba(42,22,32,.35)',
              border: `1px solid ${t.pb}`,
              borderRadius: 24,
              padding: 32,
            }}
          >
            <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 22, color: t.fg, margin: 0 }}>Essencial</h3>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, margin: '6px 0 20px' }}>Para testes ágeis e mapas bloqueados.</p>
            <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 48, color: t.fg, lineHeight: 1 }}>
              R$ 49<span style={{ fontSize: 16, color: t.fg4, fontWeight: 600 }}>/mês</span>
            </div>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.fg4, margin: '2px 0 22px' }}>ou plano anual disponível</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {freeFeatures.map(f => (
                <li key={f} style={{ fontFamily: t.body, fontSize: 13, color: t.fg2 }}>
                  <span style={{ color: t.gold, marginRight: 8 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <SecondaryBtn onClick={onSignup} style={{ marginTop: 26, width: '100%', justifyContent: 'center' }}>
              Testar Grátis
            </SecondaryBtn>
          </motion.div>

          {/* Pro */}
          <motion.div 
            whileHover={{ y: -5 }}
            style={{
              background: 'rgba(42,22,32,.5)',
              border: `1px solid ${t.wine}`,
              borderRadius: 24,
              padding: 32,
              position: 'relative',
              boxShadow: '0 0 40px rgba(253,184,19,.15), 0 0 60px rgba(232,93,4,.08)',
            }}
          >
            <span style={{
              position: 'absolute', top: -12, right: 24,
              padding: '4px 12px', borderRadius: 999,
              background: t.gradCta,
              fontFamily: t.display, fontWeight: 700, fontSize: 10, color: t.night2,
              letterSpacing: '.08em',
            }}>PREMIUM</span>

            <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 22, margin: 0 }}>
              <span style={{
                background: t.gradText,
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>Pro</span>
            </h3>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, margin: '6px 0 20px' }}>Para quem leva a personalização a sério.</p>
            <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 48, color: t.fg, lineHeight: 1 }}>
              R$ 97<span style={{ fontSize: 16, color: t.fg3, fontWeight: 600 }}>/mês</span>
            </div>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.fg4, margin: '2px 0 22px' }}>ou plano anual disponível</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {proFeatures.map(f => (
                <li key={f} style={{ fontFamily: t.body, fontSize: 13, color: t.fg2 }}>
                  <span style={{ color: t.gold, marginRight: 8 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <PrimaryBtn onClick={onSignup} style={{ marginTop: 26, width: '100%', justifyContent: 'center' }}>
              Assinar Premium
            </PrimaryBtn>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
