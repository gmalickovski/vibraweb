import { motion } from 'framer-motion'
import { t } from '../../lib/tokens'
import { useSiteLayout } from '../../lib/site-layout'
import { PrimaryBtn } from '../shared/Button'

interface Props {
  onEnter: () => void
}

export function Contact({ onEnter }: Props) {
  const { stack, mobile, cols, gap, padFor } = useSiteLayout()
  return (
    <section
      id="contato"
      style={{
        // Background comes from the SectionCard band in SitePage
        background: 'transparent',
        borderTop: `1px solid ${t.bandLine}`,
        // Vertical rhythm only — the spine-safe gutter goes on the centred
        // container below, so it composes the same way as every other section.
        padding: mobile ? '44px 0 40px' : '96px 0 80px',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Background glow */}
      <div aria-hidden style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 300, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(88,28,60,.28) 0%, transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: padFor(1120), position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap, alignItems: 'center' }}>

          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, ease: [.16, 1, .3, 1] }}
            style={stack ? { textAlign: 'center' } : undefined}
          >
            <p style={{
              fontFamily: t.body, fontSize: 11, fontWeight: 700,
              color: t.wine, letterSpacing: '.18em', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              Fale Conosco
            </p>
            <h2 style={{
              fontFamily: t.display, fontWeight: 900,
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              lineHeight: 1.06, letterSpacing: '-.03em', color: t.fg,
              marginBottom: 20,
            }}>
              Tem dúvidas antes<br />
              <span style={{ WebkitTextStroke: `1.5px ${t.gold}`, WebkitTextFillColor: 'transparent' }}>
                de começar?
              </span>
            </h2>
            <p style={{
              fontFamily: t.body, fontSize: 16, color: t.fg3,
              lineHeight: 1.65, maxWidth: 420, marginBottom: 36,
              marginInline: stack ? 'auto' : undefined,
            }}>
              Nossa equipe responde em até 24 horas úteis. Ou crie sua conta gratuita agora e experimente a plataforma por 7 dias sem compromisso.
            </p>
            <PrimaryBtn onClick={onEnter}>
              Experimentar Grátis
            </PrimaryBtn>
          </motion.div>

          {/* Right: contact options */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.65, delay: 0.1, ease: [.16, 1, .3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {[
              {
                label: 'E-mail',
                value: 'contato@vibraweb.com.br',
                sub: 'Para dúvidas, suporte e parcerias',
                href: 'mailto:contato@vibraweb.com.br',
              },
              {
                label: 'Instagram',
                value: '@vibraweb.num',
                sub: 'Conteúdo sobre numerologia cabalística',
                href: '#',
              },
            ].map(({ label, value, sub, href }) => (
              <a
                key={label}
                href={href}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    padding: '22px 26px',
                    borderRadius: 16,
                    background: 'rgba(42,22,32,.3)',
                    border: `1px solid ${t.pb}`,
                    transition: 'border-color .2s, background .2s',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = 'rgba(253,184,19,.25)'
                    el.style.background  = 'rgba(42,22,32,.55)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = t.pb
                    el.style.background  = 'rgba(42,22,32,.3)'
                  }}
                >
                  <p style={{ fontFamily: t.body, fontSize: 11, fontWeight: 700, color: t.fg4, letterSpacing: '.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: t.display, fontWeight: 700, fontSize: 16, color: t.fg, margin: '0 0 4px' }}>
                    {value}
                  </p>
                  <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg4, margin: 0 }}>
                    {sub}
                  </p>
                </div>
              </a>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
