import { t } from '../../lib/tokens'

const items = [
  { title: 'Motor em Tempo Real',   desc: 'Cálculos reativos: os números surgem enquanto o cliente digita.',                    color: t.gold },
  { title: 'White-Label Pro',       desc: 'Seu logo, suas cores, seus contatos — o relatório leva a sua marca.',               color: t.coral },
  { title: 'Exportação PDF + DOCX', desc: 'PDF pronto para entrega; DOCX editável no Word e Google Docs.',                     color: t.magenta },
  { title: 'Conteúdo Dinâmico',     desc: 'Textos interpretativos puxados do banco e sempre atualizados pelo Supabase.',        color: t.wine },
]

export function Features() {
  return (
    <section id="recursos" style={{ padding: '96px 32px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
          <h2 style={{
            fontFamily: t.display, fontWeight: 700, fontSize: 44, color: t.fg,
            letterSpacing: '-.02em', lineHeight: 1.1,
          }}>
            Uma ferramenta de{' '}
            <span style={{
              background: t.gradText,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              produtividade profissional.
            </span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {items.map(item => (
            <div key={item.title} style={{
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
