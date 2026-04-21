import { useState } from 'react'
import { t } from '../../lib/tokens'

const questions = [
  {
    q: 'O que é a Numerologia Cabalística?',
    a: 'Uma ciência ancestral que interpreta padrões numéricos extraídos do nome e data de nascimento. Não envolve esoterismos — é análise estruturada com resultados práticos.',
  },
  {
    q: 'Como funciona o white-label?',
    a: 'Você envia seu logo, escolhe sua paleta e define seus contatos. Cada PDF gerado sai com a sua identidade, pronto para revenda ao cliente.',
  },
  {
    q: 'Posso exportar em DOCX?',
    a: 'Sim. O plano Pro exporta DOCX editável no Word e Google Docs, além do PDF fechado para entrega direta.',
  },
  {
    q: 'Preciso saber numerologia para usar?',
    a: 'Não. O Vibraweb já inclui os textos interpretativos para cada número; basta preencher os dados do cliente e exportar.',
  },
  {
    q: 'Como funciona a comparação de nomes de bebê?',
    a: 'No módulo Bebê, você digita até 3 variações de nome. O sistema mostra os três mapas resumidos lado a lado — Destino, Expressão e Motivação — para facilitar a decisão dos pais.',
  },
]

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" style={{ padding: '80px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{
            fontFamily: t.display, fontWeight: 700, fontSize: 40,
            color: t.fg, letterSpacing: '-.02em',
          }}>
            Perguntas Frequentes
          </h2>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {questions.map((it, i) => {
            const on = open === i
            return (
              <div
                key={i}
                onClick={() => setOpen(on ? null : i)}
                style={{
                  padding: '18px 22px', borderRadius: 16, cursor: 'pointer',
                  background: 'rgba(42,22,32,.35)',
                  border: `1px solid ${t.pb}`,
                  transition: 'border-color .2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: t.body, fontWeight: 700, fontSize: 15, color: t.fg, flex: 1 }}>
                    {it.q}
                  </span>
                  <span style={{
                    color: t.fg3,
                    transition: 'transform .3s',
                    transform: on ? 'rotate(180deg)' : 'none',
                  }}>▾</span>
                </div>
                {on && (
                  <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, margin: '10px 0 0', lineHeight: 1.6 }}>
                    {it.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
