import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { t } from '../../lib/tokens'
import { useSiteLayout } from '../../lib/site-layout'

const questions = [
  {
    q: 'O que é a Numerologia Cabalística?',
    a: 'Uma ciência ancestral que interpreta padrões numéricos extraídos do nome e data de nascimento. Não envolve esoterismos — é análise estruturada com resultados práticos e leitura aprofundada do potencial humano.',
  },
  {
    q: 'Como funciona o white-label?',
    a: 'No plano Pro, você envia seu logo, escolhe sua paleta e define seus contatos. Cada PDF gerado sai com a sua identidade — sem nenhuma referência ao Vibraweb — pronto para entrega direta ao cliente.',
  },
  {
    q: 'Preciso saber numerologia para usar?',
    a: 'Não. O Vibraweb já inclui os textos interpretativos para cada número. Basta preencher os dados do cliente e exportar o mapa. No plano Pro, você ainda pode editar cada interpretação para refletir sua abordagem.',
  },
  {
    q: 'Posso comparar nomes de bebê?',
    a: 'Sim. No módulo Bebê você digita até 3 variações de nome. O sistema mostra os três mapas resumidos lado a lado — Destino, Expressão e Motivação — para facilitar a decisão dos pais.',
  },
  {
    q: 'Como funciona o período de teste?',
    a: 'Ao criar sua conta, você recebe automaticamente 7 dias de acesso completo à plataforma, sem precisar informar cartão de crédito. Ao final do período, escolha o plano que melhor se encaixa na sua rotina.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const { stack, mobile, cols, gap, padFor } = useSiteLayout()
  const pad = padFor(1120)

  return (
    <section
      id="faq"
      style={{
        background: t.night,
        borderTop: `1px solid ${t.bandLine}`,
        padding: mobile ? '40px 0 44px' : '80px 0 100px',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: pad }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap, alignItems: 'start' }}>

          {/* Left: sticky label */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: [.16, 1, .3, 1] }}
            style={stack ? { textAlign: 'center' } : { position: 'sticky', top: 120 }}
          >
            <p style={{ fontFamily: t.body, fontSize: 11, fontWeight: 700, color: t.wine, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 16 }}>
              Dúvidas Frequentes
            </p>
            <h2 style={{
              fontFamily: t.display, fontWeight: 900,
              fontSize: 'clamp(28px, 3vw, 44px)',
              lineHeight: 1.08, letterSpacing: '-.02em', color: t.fg,
              marginBottom: 20,
            }}>
              Tudo que você precisa saber antes de começar.
            </h2>
            <p style={{ fontFamily: t.body, fontSize: 15, color: t.fg3, lineHeight: 1.65 }}>
              Outras dúvidas? Entre em contato pelo chat da plataforma.
            </p>
          </motion.div>

          {/* Right: accordion */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.65, ease: [.16, 1, .3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {questions.map((it, i) => {
              const isOpen = open === i
              return (
                <div
                  key={i}
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    borderBottom: `1px solid ${t.pb}`,
                    cursor: 'pointer',
                    padding: '22px 4px',
                    transition: 'border-color .2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontFamily: t.body, fontWeight: 600, fontSize: 15, color: isOpen ? t.gold : t.fg, transition: 'color .2s', lineHeight: 1.4 }}>
                      {it.q}
                    </span>
                    <motion.span
                      animate={{ rotate: isOpen ? 45 : 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ color: t.fg4, fontSize: 20, lineHeight: 1, flexShrink: 0, display: 'block' }}
                    >
                      +
                    </motion.span>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.p
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        style={{ fontFamily: t.body, fontSize: 14, color: t.fg3, margin: '14px 0 0', lineHeight: 1.7, overflow: 'hidden' }}
                      >
                        {it.a}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
