import { motion } from 'framer-motion'
import { t } from '../../lib/tokens'
import { useSiteLayout } from '../../lib/site-layout'

const modules = [
  { n: '01', title: 'Essência & Identidade',     desc: 'Motivação, Impressão, Expressão e Talento Oculto — a matriz vibratória do seu cliente.',                               color: t.gold    },
  { n: '02', title: 'Caminho & Missão',           desc: 'Dia Natalício, Destino, Missão de Vida, Lições e Débitos Kármicos que moldam o propósito.',                            color: t.coral   },
  { n: '03', title: 'Ciclos de Vida',             desc: 'Períodos Formativos, Desafios e Momentos Decisivos ao longo da trajetória de tempo.',                                  color: t.magenta },
  { n: '04', title: 'Previsões Pessoais',         desc: 'Ano, Mês e Dia Pessoal — diretrizes numéricas para decisões estratégicas e timing.',                                   color: t.wine    },
]

export function Analyses() {
  const { stack, mobile, cols, gap, padFor } = useSiteLayout()
  const pad = padFor(1120)
  return (
    <section
      id="demo"
      style={{
        // First banded section — the alternating demarcation starts here.
        background: t.bandPurple,
        borderTop: `1px solid ${t.bandLine}`,
        padding: mobile ? '40px 0 44px' : '80px 0 100px',
        position: 'relative',
      }}
    >
      {/* zIndex 2 → content covers the wave spine (which sits at 1) */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: pad, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap, alignItems: 'center' }}>

          {/* Left: decorative counter */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [.16, 1, .3, 1] }}
            style={{ textAlign: 'center' }}
          >
            <div style={{
              fontFamily: t.display, fontWeight: 900,
              fontSize: 'clamp(120px, 16vw, 200px)',
              lineHeight: 1, letterSpacing: '-.06em',
              WebkitTextStroke: `1px rgba(253,184,19,.18)`,
              WebkitTextFillColor: 'transparent',
              userSelect: 'none',
            }}>
              4
            </div>
            <p style={{ fontFamily: t.body, fontSize: 12, color: t.fg4, marginTop: 4, letterSpacing: '.12em', textTransform: 'uppercase' }}>
              blocos do mapa
            </p>
          </motion.div>

          {/* Right: module list */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7, ease: [.16, 1, .3, 1] }}
            style={stack ? { textAlign: 'center' } : undefined}
          >
            <h2 style={{
              fontFamily: t.display, fontWeight: 900,
              fontSize: 'clamp(26px, 3vw, 40px)',
              lineHeight: 1.1, letterSpacing: '-.02em', color: t.fg,
              marginBottom: 8,
            }}>
              Um mapa completo,
            </h2>
            <h2 style={{
              fontFamily: t.display, fontWeight: 900,
              fontSize: 'clamp(26px, 3vw, 40px)',
              lineHeight: 1.1, letterSpacing: '-.02em',
              WebkitTextStroke: `1.5px ${t.magenta}`,
              WebkitTextFillColor: 'transparent',
              marginBottom: 40,
            }}>
              quatro dimensões.
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {modules.map((m, i) => (
                <motion.div
                  key={m.n}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: [.16, 1, .3, 1] }}
                  style={stack
                    ? { display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }
                    : { display: 'flex', gap: 20, alignItems: 'flex-start' }}
                >
                  <span style={{
                    fontFamily: t.mono, fontWeight: 500, fontSize: 11,
                    color: m.color, letterSpacing: '.08em', paddingTop: 3,
                    flexShrink: 0, minWidth: 28,
                  }}>
                    {m.n}
                  </span>
                  <div>
                    <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 16, color: t.fg, margin: '0 0 4px' }}>
                      {m.title}
                    </h3>
                    <p style={{ fontFamily: t.body, fontSize: 14, color: t.fg3, margin: 0, lineHeight: 1.6 }}>
                      {m.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
