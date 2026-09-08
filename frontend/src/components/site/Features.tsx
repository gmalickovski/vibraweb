import { motion } from 'framer-motion'
import { t } from '../../lib/tokens'
import { useSiteLayout } from '../../lib/site-layout'

const items = [
  { title: 'Cálculo em Tempo Real',     desc: 'Os números surgem enquanto você ou seu cliente digita. Sem espera, sem recarregamento.',          color: t.gold    },
  { title: 'White-Label Completo',      desc: 'Remove nossa marca e adiciona a sua — logo, cores e contatos no PDF final.',                      color: t.coral   },
  { title: 'Textos Personalizáveis',    desc: 'Edite a interpretação de qualquer número. Use os nossos como base ou escreva os seus próprios.',   color: t.magenta },
  { title: 'Apoio Tático Diário',       desc: 'Verificações rápidas de compatibilidade e previsões sem precisar gerar o mapa completo.',         color: t.wine    },
]

export function Features() {
  const { stack, mobile, cols, gap, padFor } = useSiteLayout()
  const pad = padFor(1120)
  return (
    <section
      id="recursos"
      style={{
        background: t.night,
        borderTop: `1px solid ${t.bandLine}`,
        padding: mobile ? '40px 0 44px' : '80px 0 100px',
        position: 'relative',
      }}
    >
      {/* zIndex 2 → content covers the wave spine (which sits at 1) */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: pad, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap, alignItems: 'center' }}>

          {/* Left: content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [.16, 1, .3, 1] }}
            style={stack ? { textAlign: 'center' } : undefined}
          >
            <h2 style={{
              fontFamily: t.display, fontWeight: 900,
              fontSize: 'clamp(28px, 3vw, 42px)',
              lineHeight: 1.1, letterSpacing: '-.02em', color: t.fg,
              marginBottom: 8,
            }}>
              O braço direito de
            </h2>
            <h2 style={{
              fontFamily: t.display, fontWeight: 900,
              fontSize: 'clamp(28px, 3vw, 42px)',
              lineHeight: 1.1, letterSpacing: '-.02em',
              WebkitTextStroke: `1.5px ${t.coral}`, WebkitTextFillColor: 'transparent',
              marginBottom: 40,
            }}>
              todo numerólogo.
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {items.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.09, duration: 0.5, ease: [.16, 1, .3, 1] }}
                >
                  <div style={{
                    width: 28, height: 2, borderRadius: 2,
                    background: item.color, marginBottom: 10,
                    marginInline: stack ? 'auto' : undefined,
                  }} />
                  <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 17, color: t.fg, margin: '0 0 5px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: t.body, fontSize: 14, color: t.fg3, margin: 0, lineHeight: 1.65 }}>
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: decorative visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [.16, 1, .3, 1] }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            <NumberOrb />
          </motion.div>

        </div>
      </div>
    </section>
  )
}

function NumberOrb() {
  const nums = ['7', '3', '11', '9', '4', '22', '6', '1']
  return (
    <div style={{ position: 'relative', width: 280, height: 280 }}>
      {/* Center orb */}
      <div style={{
        position: 'absolute', inset: 40,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, rgba(88,28,60,.9) 0%, rgba(18,10,16,1) 75%)',
        border: '1px solid rgba(253,184,19,.18)',
        boxShadow: '0 0 60px rgba(88,28,60,.5), inset 0 0 40px rgba(253,184,19,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: t.display, fontWeight: 900, fontSize: 56,
          WebkitTextStroke: `1.5px ${t.gold}`, WebkitTextFillColor: 'transparent',
        }}>∞</span>
      </div>
      {/* Orbiting numbers */}
      {nums.map((n, i) => {
        const angle = (i / nums.length) * 360
        const rad   = (angle - 90) * (Math.PI / 180)
        const r     = 130
        const x     = 140 + r * Math.cos(rad)
        const y     = 140 + r * Math.sin(rad)
        const colors = [t.gold, t.coral, t.magenta, t.wine, t.gold, t.coral, t.magenta, t.wine]
        return (
          <motion.div
            key={n}
            animate={{ rotate: 360 }}
            transition={{ duration: 40 + i * 3, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              left: x - 16, top: y - 16,
              width: 32, height: 32,
              borderRadius: '50%',
              border: `1px solid ${colors[i]}44`,
              background: `${colors[i]}11`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: t.display, fontWeight: 700, fontSize: 13, color: colors[i],
            }}
          >
            {n}
          </motion.div>
        )
      })}
    </div>
  )
}
