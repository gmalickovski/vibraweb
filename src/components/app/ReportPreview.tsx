import { useState, useEffect } from 'react'
import { t } from '../../lib/tokens'
import type { NumerologyMap } from '../../lib/numerology'
import type { AnalysisTab } from '../../pages/AppPage'
import { fetchInterpretation, type InterpretationRow } from '../../lib/supabase'

interface Props {
  subject: string
  nums: NumerologyMap
  tab: AnalysisTab
  consultantName?: string
  consultantContact?: string
}

const tabLabel: Record<AnalysisTab, string> = {
  pessoal:   'Análise Pessoal',
  bebe:      'Análise de Nome de Bebê',
  empresa:   'Análise de Nome Empresarial',
  previsoes: 'Previsões · Ano Pessoal',
}

const secondary = [
  { key: 'expressao' as const, tipo: 'expressao', label: 'Expressão', color: t.coral },
  { key: 'motivacao' as const, tipo: 'motivacao', label: 'Motivação', color: t.magenta },
  { key: 'impressao' as const, tipo: 'impressao', label: 'Impressão', color: t.wine },
]

export function ReportPreview({
  subject, nums, tab,
  consultantName = 'Vibraweb',
  consultantContact = 'vibraweb.com.br',
}: Props) {
  const initials = consultantName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  // Fetch interpretation text for Destino from Supabase
  const [destinoInterp, setDestinoInterp] = useState<InterpretationRow | null>(null)
  useEffect(() => {
    if (nums.destino === null) { setDestinoInterp(null); return }
    let cancelled = false
    fetchInterpretation(nums.destino, 'destino').then(row => {
      if (!cancelled) setDestinoInterp(row)
    })
    return () => { cancelled = true }
  }, [nums.destino])

  const destinoTexto = destinoInterp?.texto
    ?? 'O número do Destino revela a missão de vida — a direção para onde tudo converge.'

  return (
    <div style={{
      background: t.paper,
      color: t.ink,
      borderRadius: 20,
      boxShadow: '0 20px 60px rgba(0,0,0,.5)',
      overflow: 'hidden',
      border: `1px solid ${t.pb}`,
    }}>
      {/* Report header */}
      <div style={{
        background: t.gradSun,
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 999, flexShrink: 0,
          background: 'rgba(18,10,16,.2)',
          border: '2px solid rgba(251,247,244,.9)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: t.display, fontWeight: 900, fontSize: 16, color: t.paper,
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 16, color: t.paper, lineHeight: 1.25 }}>
            {consultantName}
          </div>
          <div style={{ fontFamily: t.body, fontSize: 11, color: 'rgba(251,247,244,.9)', marginTop: 2 }}>
            {consultantContact}
          </div>
        </div>
      </div>

      <div style={{ padding: '30px 36px 36px' }}>
        <div style={{ fontFamily: t.body, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280' }}>
          {tabLabel[tab]}
        </div>
        <h2 style={{
          fontFamily: t.display, fontWeight: 900, fontSize: 32, color: t.ink,
          margin: '6px 0 18px', letterSpacing: '-.02em', lineHeight: 1.1,
        }}>
          {subject || 'Nome do Cliente'}
        </h2>

        {/* Destino — big number */}
        <div style={{
          display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20, alignItems: 'center',
          padding: '18px 0', borderTop: '1px solid #E8DDD3', borderBottom: '1px solid #E8DDD3',
        }}>
          <div style={{
            fontFamily: t.display, fontWeight: 900, fontSize: 88, lineHeight: 1,
            background: t.gradSun,
            WebkitBackgroundClip: 'text', backgroundClip: 'text',
            WebkitTextFillColor: 'transparent', textAlign: 'center',
          }}>
            {nums.destino ?? '—'}
          </div>
          <div>
            <div style={{ fontFamily: t.body, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6B7280', fontWeight: 600 }}>
              {destinoInterp?.titulo ?? 'Número do Destino'}
            </div>
            <p style={{ fontFamily: t.body, fontSize: 13, color: t.ink2, marginTop: 6, lineHeight: 1.6 }}>
              {destinoTexto}
            </p>
          </div>
        </div>

        {/* Secondary numbers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
          {secondary.map(s => (
            <SecondaryCard
              key={s.key}
              numero={nums[s.key]}
              tipo={s.tipo}
              label={s.label}
              color={s.color}
            />
          ))}
        </div>

        {/* Additional numbers: Missão + Psíquico */}
        {(nums.missao !== null || nums.psiquico !== null) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            {nums.missao !== null && (
              <div style={{ padding: 14, borderRadius: 10, background: t.paper2 }}>
                <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 28, color: t.gold }}>{nums.missao}</div>
                <div style={{ fontFamily: t.body, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4, fontWeight: 600 }}>Missão</div>
              </div>
            )}
            {nums.psiquico !== null && (
              <div style={{ padding: 14, borderRadius: 10, background: t.paper2 }}>
                <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 28, color: t.info }}>{nums.psiquico}</div>
                <div style={{ fontFamily: t.body, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4, fontWeight: 600 }}>Psíquico</div>
              </div>
            )}
          </div>
        )}

        <div style={{ fontFamily: t.body, fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 24 }}>
          Página 1 · Gerado por Vibraweb · visualização prévia
        </div>
      </div>
    </div>
  )
}

// Loads interpretation text from Supabase for each secondary number
function SecondaryCard({ numero, tipo, label, color }: { numero: number | null; tipo: string; label: string; color: string }) {
  const [interp, setInterp] = useState<InterpretationRow | null>(null)
  useEffect(() => {
    if (numero === null) { setInterp(null); return }
    let cancelled = false
    fetchInterpretation(numero, tipo).then(row => { if (!cancelled) setInterp(row) })
    return () => { cancelled = true }
  }, [numero, tipo])

  return (
    <div style={{ padding: 14, borderRadius: 10, background: t.paper2 }} title={interp?.texto}>
      <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 28, color }}>{numero ?? '—'}</div>
      <div style={{ fontFamily: t.body, fontSize: 11, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: 4, fontWeight: 600 }}>
        {interp?.titulo?.split(' — ')[0] ?? label}
      </div>
    </div>
  )
}
