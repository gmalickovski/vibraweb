import { t } from '../../lib/tokens'

const analyses = [
  {
    n: '1',
    title: 'Análise Pessoal',
    desc: 'Mapa completo: Destino, Expressão, Motivação, Karma e Ciclos de Vida.',
    color: t.gold,
  },
  {
    n: '2',
    title: 'Nome de Bebê',
    desc: 'Teste variações e descubra a vibração mais harmônica. Compare até 3 nomes lado a lado.',
    color: t.coral,
  },
  {
    n: '3',
    title: 'Nome Empresarial',
    desc: 'Avalie razão social e nome fantasia com base na data de fundação. Relatório estratégico.',
    color: t.magenta,
  },
  {
    n: '4',
    title: 'Previsões',
    desc: 'Ano pessoal, dias favoráveis e diretrizes para decisões estratégicas.',
    color: t.wine,
  },
]

export function Analyses() {
  return (
    <section style={{
      padding: '96px 32px',
      background: 'rgba(28,16,22,.5)',
    }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }}>
          <h2 style={{
            fontFamily: t.display, fontWeight: 700, fontSize: 44, color: t.fg,
            letterSpacing: '-.02em', lineHeight: 1.1,
          }}>
            Quatro tipos de análise,{' '}
            <span style={{
              background: t.gradText,
              WebkitBackgroundClip: 'text', backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              uma única ferramenta.
            </span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {analyses.map(a => (
            <div key={a.n} style={{
              background: 'rgba(42,22,32,.35)',
              border: `1px solid ${t.pb}`,
              borderRadius: 20,
              padding: 24,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 999,
                border: `2px solid ${a.color}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: t.display, fontWeight: 900, fontSize: 18,
                color: a.color, marginBottom: 14,
              }}>
                {a.n}
              </div>
              <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 18, color: t.fg, margin: '0 0 6px' }}>
                {a.title}
              </h3>
              <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, margin: 0, lineHeight: 1.6 }}>
                {a.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
