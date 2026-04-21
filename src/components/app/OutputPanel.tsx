import { useMemo } from 'react'
import { t } from '../../lib/tokens'
import { NumberCard } from '../shared/NumberCard'
import { ReportPreview } from './ReportPreview'
import { BabyComparison } from './BabyComparison'
import { calcPessoal, calcEmpresa, calcBebe, calcPrevisoes } from '../../lib/numerology'
import type { AnalysisData, AnalysisTab } from '../../pages/AppPage'

interface Props {
  data: AnalysisData
  tab: AnalysisTab
  consultantName?: string
  consultantContact?: string
}

const primaryCards = [
  { key: 'destino'      as const, label: 'Destino',        accent: 'gold'    as const },
  { key: 'expressao'    as const, label: 'Expressão',      accent: 'coral'   as const },
  { key: 'motivacao'    as const, label: 'Motivação',      accent: 'magenta' as const },
  { key: 'impressao'    as const, label: 'Impressão',      accent: 'wine'    as const },
  { key: 'missao'       as const, label: 'Missão',         accent: 'gold'    as const },
  { key: 'talentoOculto' as const, label: 'Talento Oculto', accent: 'coral'  as const },
  { key: 'psiquico'     as const, label: 'Psíquico',       accent: 'info'    as const },
  { key: 'anoPessoal'   as const, label: 'Ano Pessoal',    accent: 'gold'    as const },
]

export function OutputPanel({ data, tab, consultantName, consultantContact }: Props) {
  const nums = useMemo(() => {
    if (tab === 'empresa')   return calcEmpresa(data.empresa, data.fundacao)
    if (tab === 'bebe')      return calcBebe(data.bebeNome, data.bebeSobrenome, data.bebeDob)
    if (tab === 'previsoes') return calcPrevisoes(data.nome, data.dob, data.anoRef)
    return calcPessoal(data.nome, data.dob)
  }, [data, tab])

  const subject = useMemo(() => {
    if (tab === 'empresa') return data.fantasia || data.empresa || ''
    if (tab === 'bebe')    return [data.bebeNome, data.bebeSobrenome].filter(Boolean).join(' ')
    return data.social || data.nome || ''
  }, [data, tab])

  const showComparison = tab === 'bebe' && Boolean(data.bebeNome2 || data.bebeNome3)

  return (
    <div style={{
      flex: 1,
      padding: 28,
      overflowY: 'auto',
      background: t.night,
      backgroundImage: 'radial-gradient(circle at 70% 0%, rgba(88,28,60,.3), transparent 60%)',
    }}>
      {/* Primary number cards — 4 per row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {primaryCards.map(c => (
          <NumberCard key={c.key} label={c.label} value={nums[c.key] ?? null} accent={c.accent} />
        ))}
      </div>

      {/* Débitos e Lições cármicas */}
      {(nums.debitosCarmicos.length > 0 || nums.licoesCarmicas.length > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {nums.debitosCarmicos.length > 0 && (
            <InfoChips label="Débitos Cármicos" values={nums.debitosCarmicos} color={t.magenta} />
          )}
          {nums.licoesCarmicas.length > 0 && (
            <InfoChips label="Lições Cármicas" values={nums.licoesCarmicas} color={t.coral} />
          )}
        </div>
      )}

      {/* Desafios */}
      {nums.desafios && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24,
        }}>
          {[
            { label: 'Desafio 1',    value: nums.desafios.desafio1 },
            { label: 'Desafio 2',    value: nums.desafios.desafio2 },
            { label: 'Desafio Principal', value: nums.desafios.desafioPrincipal },
          ].map(d => (
            <NumberCard key={d.label} label={d.label} value={d.value} accent="wine" />
          ))}
        </div>
      )}

      {/* Ciclos de vida */}
      {nums.ciclosDeVida.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10, fontWeight: 600 }}>
            Ciclos de Vida
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {nums.ciclosDeVida.map((c, i) => (
              <div key={i} style={{
                flex: 1, padding: '12px 14px', borderRadius: 12,
                background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
              }}>
                <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 24, color: [t.gold, t.coral, t.magenta][i] }}>{c.regente}</div>
                <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Ciclo {i + 1}
                </div>
                <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg4, marginTop: 2 }}>
                  {c.inicio} – {c.fim}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Baby name comparison */}
      {showComparison && (
        <BabyComparison
          sobrenome={data.bebeSobrenome}
          dob={data.bebeDob}
          names={[
            { nome: data.bebeNome,  label: 'Opção 1' },
            { nome: data.bebeNome2, label: 'Opção 2' },
            { nome: data.bebeNome3, label: 'Opção 3' },
          ].filter(n => n.nome.trim())}
        />
      )}

      {/* Report preview */}
      <ReportPreview
        subject={subject}
        nums={nums}
        tab={tab}
        consultantName={consultantName}
        consultantContact={consultantContact}
      />
    </div>
  )
}

function InfoChips({ label, values, color }: { label: string; values: number[]; color: string }) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12,
      background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
    }}>
      <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {values.map(v => (
          <span key={v} style={{
            fontFamily: t.display, fontWeight: 700, fontSize: 13,
            padding: '3px 10px', borderRadius: 999,
            border: `1px solid ${color}`, color,
          }}>{v}</span>
        ))}
      </div>
    </div>
  )
}
