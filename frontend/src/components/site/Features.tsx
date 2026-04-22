import { motion } from 'framer-motion'
import { t } from '../../lib/tokens'

const items = [
  { title: 'Tudo em Tempo Real',   desc: 'Cálculos reativos da análise: os números surgem enquanto você ou seu cliente digita.',                    color: t.gold },
  { title: 'White-Label Premium',       desc: 'Toda a interface dos relatórios limpa de nossa marca, pronto para incluir seu logo e cores.',               color: t.coral },
  { title: 'Personalização Pessoal', desc: 'Edite o significado de qualquer número. Se não gostar dos que fornecemos, escreva os seus próprios para usar nas impressões!',                     color: t.magenta },
  { title: 'Apoio Tático Diário',     desc: 'Use nossa base para verificar compatibilidades ou previsões rápidas no dia a dia sem precisar fazer grandes exportações.',        color: t.wine },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, stiffness: 300 } }
}

export function Features() {
  return (
    <section id="recursos" style={{ padding: '96px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}
        >
          <h2 style={{
            fontFamily: t.display, fontWeight: 700, fontSize: 44, color: t.fg,
            letterSpacing: '-.02em', lineHeight: 1.1,
          }}>
            O braço direito de{' '}
            <span style={{
              background: t.gradText,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              todo numerólogo.
            </span>
          </h2>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 20 }}
        >
          {items.map(item => (
            <motion.div variants={itemVariants} key={item.title} style={{
              display: 'flex', gap: 16, padding: 24, borderRadius: 20,
              background: 'rgba(42,22,32,.35)',
              border: `1px solid ${t.pb}`,
            }}>
              <div style={{
                width: 8, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0,
                background: `linear-gradient(180deg, ${item.color}, ${t.wine})`,
              }} />
              <div>
                <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 20, color: t.fg, margin: '0 0 6px' }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: t.body, fontSize: 14, color: t.fg3, margin: 0, lineHeight: 1.6 }}>
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
