import { useMemo } from 'react'
import { t } from '../../lib/tokens'
import { calcBebe } from '../../lib/numerology'

interface NameOption {
  nome: string
  label: string
}

interface Props {
  sobrenome: string
  dob: string
  names: NameOption[]
}

const accents = [t.gold, t.coral, t.magenta]

export function BabyComparison({ sobrenome, dob, names }: Props) {
  const maps = useMemo(
    () => names.map(n => ({ ...n, nums: calcBebe(n.nome, sobrenome, dob) })),
    [names, sobrenome, dob]
  )

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12, fontWeight: 600 }}>
        Comparação de Vibrações
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${maps.length}, 1fr)`,
        gap: 12,
      }}>
        {maps.map((n, i) => {
          const accent = accents[i]
          return (
            <div key={i} style={{
              background: 'rgba(42,22,32,.35)',
              border: `1px solid ${t.pb}`,
              borderRadius: 16,
              padding: 16,
              borderTop: `3px solid ${accent}`,
            }}>
              <div style={{ fontFamily: t.display, fontWeight: 700, fontSize: 13, color: accent, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                {n.label}
              </div>
              <div style={{ fontFamily: t.body, fontSize: 13, color: t.fg, marginBottom: 10, fontWeight: 600 }}>
                {n.nome || '—'} {sobrenome}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Destino',    val: n.nums.destino },
                  { label: 'Expressão',  val: n.nums.expressao },
                  { label: 'Motivação',  val: n.nums.motivacao },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: t.body, fontSize: 11, color: t.fg3 }}>{row.label}</span>
                    <span style={{ fontFamily: t.display, fontWeight: 900, fontSize: 18, color: accent }}>
                      {row.val ?? '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
