import { motion } from 'framer-motion'
import { t } from '../../lib/tokens'
import { PrimaryBtn } from '../shared/Button'
import { RippleBackground } from './RippleBackground'

interface Props {
  onCta: () => void
}

export function Hero({ onCta }: Props) {
  return (
    <section style={{
      position: 'relative',
      padding: '160px 32px',
      overflow: 'hidden',
      textAlign: 'center',
    }}>
      {/* Background Ripple & Glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 800, borderRadius: 999,
        background: 'radial-gradient(circle, rgba(88,28,60,.3), transparent 70%)',
        filter: 'blur(100px)', zIndex: 0, pointerEvents: 'none',
      }} />
      <RippleBackground />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ position: 'relative', maxWidth: 1120, margin: '0 auto', zIndex: 1 }}
      >
        <span style={{
          fontFamily: t.body, fontSize: 13, fontWeight: 600, color: t.gold,
          textTransform: 'uppercase', letterSpacing: '.12em',
          padding: '8px 18px', borderRadius: 999,
          border: '1px solid rgba(253,184,19,.25)',
          background: 'rgba(253,184,19,.08)',
        }}>
          Acelere seus Atendimentos
        </span>

        <h1 style={{
          fontFamily: t.display, fontWeight: 900, fontSize: 72, lineHeight: 1.1,
          letterSpacing: '-.02em', color: t.fg, margin: '32px 0 20px',
        }}>
          Geração instantânea e análise de<br />
          <span style={{
            background: t.gradText,
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            mapas numerológicos cabalísticos.
          </span>
        </h1>

        <p style={{
          fontFamily: t.body, fontSize: 20, color: t.fg2,
          maxWidth: 720, margin: '0 auto 40px', lineHeight: 1.6,
        }}>
          Sua plataforma definitiva para testes ágeis no dia a dia e para a emissão de cadernos em PDFs com a sua própria marca e seus textos personalizados.
        </p>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: 'inline-block' }}>
          <PrimaryBtn onClick={onCta} style={{ fontSize: 16, padding: '20px 42px', boxShadow: '0 8px 30px rgba(88,28,60, 0.4)' }}>
            Experimentar a Plataforma
          </PrimaryBtn>
        </motion.div>

        <p style={{ fontFamily: t.body, fontSize: 14, color: t.fg4, marginTop: 18 }}>
          Liberação imediata · Comece seu teste com a conta gratuita
        </p>
      </motion.div>
    </section>
  )
}
