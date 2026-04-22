import { useState, useEffect, useMemo } from 'react'
import { t } from '../../lib/tokens'
import { NumberCard } from '../shared/NumberCard'
import { BabyComparison } from './BabyComparison'
import {
  calcPessoal, calcEmpresa, calcBebe, calcPrevisoes,
  type NumerologyMap, type Desafios, type MomentosDecisivos,
  type MesPessoalEntry, type AnoPessoalEntry,
} from '../../lib/numerology'
import type { AnalysisData, AnalysisTab } from '../../pages/AppPage'
import { fetchInterpretation, type InterpretationRow } from '../../lib/supabase'

interface Props {
  data: AnalysisData
  tab: AnalysisTab
  consultantName?: string
  consultantContact?: string
}

interface SelectedCard {
  key: string
  label: string
  value: number
  accent: string
  tipo: string
}

function resolveValue(nums: NumerologyMap, key: string): number | null {
  if (key.startsWith('desafios.')) {
    const sub = key.split('.')[1] as keyof Desafios
    return nums.desafios?.[sub] ?? null
  }
  if (key.startsWith('momentosDecisivos.')) {
    const sub = key.split('.')[1] as keyof MomentosDecisivos
    return nums.momentosDecisivos?.[sub] ?? null
  }
  if (key.startsWith('ciclosDeVida.')) {
    const idx = parseInt(key.split('.')[1], 10)
    return nums.ciclosDeVida[idx]?.regente ?? null
  }
  if (key.startsWith('debitosCarmicos.')) {
    const idx = parseInt(key.split('.')[1], 10)
    return nums.debitosCarmicos[idx] ?? null
  }
  if (key.startsWith('licoesCarmicas.')) {
    const idx = parseInt(key.split('.')[1], 10)
    return nums.licoesCarmicas[idx] ?? null
  }
  if (key.startsWith('tendenciasOcultas.')) {
    const idx = parseInt(key.split('.')[1], 10)
    return nums.tendenciasOcultas[idx] ?? null
  }
  if (key.startsWith('harmoniaConjugal.')) {
    return null // harmony chips don't update live (they depend on missao, already tracked)
  }
  if (key.startsWith('proximos10Anos.')) {
    const idx = parseInt(key.split('.')[1], 10)
    return nums.proximos10Anos[idx]?.numero ?? null
  }
  if (key.startsWith('mesesPessoais.')) {
    const idx = parseInt(key.split('.')[1], 10)
    return nums.mesesPessoais[idx]?.numero ?? null
  }
  return (nums as unknown as Record<string, unknown>)[key] as number ?? null
}

const primaryCards = [
  { key: 'destino'       as const, label: 'Destino',         accent: 'gold'    as const },
  { key: 'expressao'     as const, label: 'Expressão',       accent: 'coral'   as const },
  { key: 'motivacao'     as const, label: 'Motivação',       accent: 'magenta' as const },
  { key: 'impressao'     as const, label: 'Impressão',       accent: 'wine'    as const },
  { key: 'missao'        as const, label: 'Missão',          accent: 'gold'    as const },
  { key: 'talentoOculto' as const, label: 'Talento Oculto',  accent: 'coral'   as const },
  { key: 'psiquico'      as const, label: 'Psíquico',        accent: 'info'    as const },
  { key: 'anoPessoal'    as const, label: 'Ano Pessoal',     accent: 'gold'    as const },
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

  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null)
  const [interp, setInterp] = useState<InterpretationRow | null>(null)

  // Reset only on tab change
  useEffect(() => {
    setSelectedCard(null)
  }, [tab])

  // Keep the detail view open and update the value in real-time as inputs change
  useEffect(() => {
    if (!selectedCard) return
    const fresh = resolveValue(nums, selectedCard.key)
    if (fresh !== null && fresh !== selectedCard.value) {
      setSelectedCard(prev => prev ? { ...prev, value: fresh } : null)
    }
  }, [nums]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch interpretation when selected card changes
  useEffect(() => {
    if (!selectedCard?.value) { setInterp(null); return }
    let cancelled = false
    fetchInterpretation(selectedCard.value, selectedCard.tipo).then(row => {
      if (!cancelled) setInterp(row)
    })
    return () => { cancelled = true }
  }, [selectedCard])

  // --- Detail view ---
  if (selectedCard) {
    const tabName = tab === 'bebe' ? 'Bebê' : tab === 'empresa' ? 'Empresa' : 'Pessoal'
    return (
      <div style={{ flex: 1, padding: 40, overflowY: 'auto', background: t.night }}>
        <button
          onClick={() => setSelectedCard(null)}
          style={{
            background: 'transparent', border: 0, color: t.fg3, fontFamily: t.body, fontSize: 13,
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24,
            transition: 'color .2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = t.fg}
          onMouseLeave={e => e.currentTarget.style.color = t.fg3}
        >
          ← Voltar aos números
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 32, alignItems: 'start' }}>
          <div style={{
            fontFamily: t.display, fontWeight: 900, fontSize: 88, lineHeight: 1,
            color: (t as Record<string, string>)[selectedCard.accent] || t.gold,
            textAlign: 'center',
            background: 'rgba(42,22,32,.35)',
            border: `1px solid ${t.pb}`,
            borderRadius: 16,
            padding: '24px 0'
          }}>
            {selectedCard.value}
          </div>
          <div>
            <div style={{ fontFamily: t.body, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: t.fg3, fontWeight: 600 }}>
              {interp?.titulo ?? `Número de ${selectedCard.label} (${tabName})`}
            </div>
            <p style={{ fontFamily: t.body, fontSize: 15, color: t.fg, marginTop: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {interp?.texto ?? `Interpretando o número ${selectedCard.value} para ${selectedCard.label}...`}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Card grid view ---
  return (
    <div style={{
      flex: 1,
      padding: 28,
      overflowY: 'auto',
      background: t.night,
      backgroundImage: 'radial-gradient(circle at 70% 0%, rgba(88,28,60,.3), transparent 60%)',
    }}>

      {/* Primary number cards — 4 per row */}
      <Section label="Números Principais">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {primaryCards.map(c => (
            <NumberCard
              key={c.key}
              label={c.label}
              value={nums[c.key] ?? null}
              accent={c.accent}
              onClick={nums[c.key] != null ? () => setSelectedCard({
                key: c.key, label: c.label, value: nums[c.key]!, accent: c.accent,
                tipo: `${tab}_${c.key}`
              }) : undefined}
            />
          ))}
        </div>
      </Section>

      {/* Débitos e Lições cármicas — now clickable */}
      {(nums.debitosCarmicos.length > 0 || nums.licoesCarmicas.length > 0) && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {nums.debitosCarmicos.length > 0 && (
            <ClickableChips
              label="Débitos Cármicos"
              values={nums.debitosCarmicos}
              color={t.magenta}
              onChipClick={(v, i) => setSelectedCard({
                key: `debitosCarmicos.${i}`, label: 'Débito Cármico', value: v,
                accent: 'magenta', tipo: `${tab}_debito_carmico`
              })}
            />
          )}
          {nums.licoesCarmicas.length > 0 && (
            <ClickableChips
              label="Lições Cármicas"
              values={nums.licoesCarmicas}
              color={t.coral}
              onChipClick={(v, i) => setSelectedCard({
                key: `licoesCarmicas.${i}`, label: 'Lição Cármica', value: v,
                accent: 'coral', tipo: `${tab}_licao_carmica`
              })}
            />
          )}
        </div>
      )}

      {/* Desafios — now clickable */}
      {nums.desafios && (
        <Section label="Desafios">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {([
              { label: 'Desafio 1',         subKey: 'desafio1' as const },
              { label: 'Desafio 2',         subKey: 'desafio2' as const },
              { label: 'Desafio Principal', subKey: 'desafioPrincipal' as const },
            ]).map(d => (
              <NumberCard
                key={d.subKey}
                label={d.label}
                value={nums.desafios![d.subKey]}
                accent="wine"
                onClick={() => setSelectedCard({
                  key: `desafios.${d.subKey}`, label: d.label,
                  value: nums.desafios![d.subKey], accent: 'wine',
                  tipo: `${tab}_desafio`
                })}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Ciclos de vida — now clickable */}
      {nums.ciclosDeVida.length > 0 && (
        <Section label="Ciclos de Vida">
          <div style={{ display: 'flex', gap: 10 }}>
            {nums.ciclosDeVida.map((c, i) => (
              <div
                key={i}
                onClick={() => setSelectedCard({
                  key: `ciclosDeVida.${i}`, label: `Ciclo ${i + 1}`, value: c.regente,
                  accent: ['gold', 'coral', 'magenta'][i] as string, tipo: `${tab}_ciclo`
                })}
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                  background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
                  transition: 'border-color .2s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = [t.gold, t.coral, t.magenta][i]}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.pb}
              >
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
        </Section>
      )}

      {/* Momentos Decisivos */}
      {nums.momentosDecisivos && (
        <Section label="Momentos Decisivos">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {([1, 2, 3, 4] as const).map(i => {
              const subKey = `momento${i}` as keyof MomentosDecisivos
              const value = nums.momentosDecisivos![subKey]
              return (
                <NumberCard
                  key={subKey}
                  label={`Momento ${i}`}
                  value={value}
                  accent="info"
                  onClick={() => setSelectedCard({
                    key: `momentosDecisivos.${subKey}`, label: `Momento Decisivo ${i}`,
                    value, accent: 'info', tipo: `${tab}_momentoDecisivo`
                  })}
                />
              )
            })}
          </div>
        </Section>
      )}

      {/* Harmonia Conjugal */}
      {nums.harmoniaConjugal && (
        <Section label="Harmonia Conjugal">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <ClickableChips
              label="Vibra com"
              values={nums.harmoniaConjugal.vibra}
              color={t.gold}
              onChipClick={v => setSelectedCard({
                key: 'harmoniaConjugal.vibra', label: 'Vibra com', value: v,
                accent: 'gold', tipo: `${tab}_harmoniaConjugal`
              })}
            />
            <ClickableChips
              label="Atrai"
              values={nums.harmoniaConjugal.atrai}
              color={t.coral}
              onChipClick={v => setSelectedCard({
                key: 'harmoniaConjugal.atrai', label: 'Atrai', value: v,
                accent: 'coral', tipo: `${tab}_harmoniaConjugal`
              })}
            />
            {nums.harmoniaConjugal.oposto.length > 0 && (
              <ClickableChips
                label="Oposto"
                values={nums.harmoniaConjugal.oposto}
                color={t.magenta}
                onChipClick={v => setSelectedCard({
                  key: 'harmoniaConjugal.oposto', label: 'Oposto', value: v,
                  accent: 'magenta', tipo: `${tab}_harmoniaConjugal`
                })}
              />
            )}
            {nums.harmoniaConjugal.passivo.length > 0 && (
              <ClickableChips
                label="Passivo"
                values={nums.harmoniaConjugal.passivo}
                color={t.fg3}
                onChipClick={v => setSelectedCard({
                  key: 'harmoniaConjugal.passivo', label: 'Passivo', value: v,
                  accent: 'info', tipo: `${tab}_harmoniaConjugal`
                })}
              />
            )}
          </div>
        </Section>
      )}

      {/* Tendências, Resposta Subconsciente, Dias Favoráveis, Harmônicos */}
      {(nums.tendenciasOcultas.length > 0 || nums.respostaSubconsciente !== null ||
        nums.diasFavoraveis.length > 0 || nums.numerosHarmonicos.length > 0) && (
        <Section label="Tendências e Favoráveis">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nums.tendenciasOcultas.length > 0 && (
              <ClickableChips
                label="Tendências Ocultas"
                values={nums.tendenciasOcultas}
                color={t.magenta}
                onChipClick={(v, i) => setSelectedCard({
                  key: `tendenciasOcultas.${i}`, label: 'Tendência Oculta', value: v,
                  accent: 'magenta', tipo: `${tab}_tendenciaOculta`
                })}
              />
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {nums.respostaSubconsciente !== null && (
                <NumberCard
                  label="Resposta Subconsciente"
                  value={nums.respostaSubconsciente}
                  accent="info"
                  onClick={() => setSelectedCard({
                    key: 'respostaSubconsciente', label: 'Resposta Subconsciente',
                    value: nums.respostaSubconsciente!, accent: 'info',
                    tipo: `${tab}_respostaSubconsciente`
                  })}
                />
              )}
              {nums.diasFavoraveis.length > 0 && (
                <InfoChips label="Dias Favoráveis" values={nums.diasFavoraveis} color={t.success} />
              )}
              {nums.numerosHarmonicos.length > 0 && (
                <InfoChips label="Números Harmônicos" values={nums.numerosHarmonicos} color={t.gold} />
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Dia Pessoal + Meses Pessoais */}
      {(nums.diaPessoal !== null || nums.mesesPessoais.length > 0) && (
        <Section label="Previsões Pessoais">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {nums.diaPessoal !== null && (
              <NumberCard
                label="Dia Pessoal"
                value={nums.diaPessoal}
                accent="gold"
                onClick={() => setSelectedCard({
                  key: 'diaPessoal', label: 'Dia Pessoal', value: nums.diaPessoal!,
                  accent: 'gold', tipo: `${tab}_diaPessoal`
                })}
              />
            )}
            {nums.mesesPessoais.length > 0 && (
              <MesesPessoaisGrid
                meses={nums.mesesPessoais}
                onMonthClick={(entry, idx) => setSelectedCard({
                  key: `mesesPessoais.${idx}`, label: entry.nome, value: entry.numero,
                  accent: 'coral', tipo: `${tab}_mesPessoal`
                })}
              />
            )}
          </div>
        </Section>
      )}

      {/* Próximos 10 Anos Pessoais */}
      {nums.proximos10Anos.length > 0 && (
        <Section label="Próximos 10 Anos Pessoais">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {nums.proximos10Anos.map((entry, i) => (
              <AnoCard
                key={i}
                entry={entry}
                onClick={() => setSelectedCard({
                  key: `proximos10Anos.${i}`, label: `Ano Pessoal ${entry.numero}`,
                  value: entry.numero, accent: 'gold', tipo: `${tab}_anoPessoal`
                })}
              />
            ))}
          </div>
        </Section>
      )}

      {/* Triângulo da Vida + Arcano Atual */}
      {nums.trianguloDaVida && (
        <Section label="Triângulo da Vida">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 10 }}>
            {nums.trianguloDaVida.arcanoRegente !== null && (
              <NumberCard
                label="Arcano Regente"
                value={nums.trianguloDaVida.arcanoRegente}
                accent="magenta"
                onClick={() => setSelectedCard({
                  key: 'trianguloDaVida.arcanoRegente', label: 'Arcano Regente',
                  value: nums.trianguloDaVida!.arcanoRegente!, accent: 'magenta',
                  tipo: `${tab}_arcanoAtual`
                })}
              />
            )}
            {nums.trianguloDaVida.arcanos.length > 0 && (
              <ClickableChips
                label="Sequência de Arcanos"
                values={nums.trianguloDaVida.arcanos}
                color={(t as Record<string, string>).info || '#60a5fa'}
                onChipClick={v => setSelectedCard({
                  key: 'trianguloDaVida.arcano', label: 'Arcano', value: v,
                  accent: 'info', tipo: `${tab}_arcanoAtual`
                })}
              />
            )}
          </div>
          {nums.arcanoAtual && (
            <div
              onClick={() => nums.arcanoAtual?.numero != null && setSelectedCard({
                key: 'arcanoAtual', label: 'Arcano Atual', value: nums.arcanoAtual.numero!,
                accent: 'info', tipo: `${tab}_arcanoAtual`
              })}
              style={{
                padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
                transition: 'border-color .2s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = (t as Record<string, string>).info || '#60a5fa'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.pb}
            >
              <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                Arcano Atual
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: t.display, fontWeight: 900, fontSize: 36, color: (t as Record<string, string>).info || '#60a5fa' }}>
                  {nums.arcanoAtual.numero ?? '—'}
                </span>
                <span style={{ fontFamily: t.body, fontSize: 11, color: t.fg4 }}>
                  {nums.arcanoAtual.periodo}
                </span>
              </div>
            </div>
          )}
        </Section>
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

      {/* Suppress unused warning for consultantName/consultantContact */}
      {false && consultantName && consultantContact}
    </div>
  )
}

// --- Helper components ---

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontFamily: t.body, fontSize: 11, color: t.fg3, textTransform: 'uppercase',
        letterSpacing: '.08em', marginBottom: 10, fontWeight: 600
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function InfoChips({ label, values, color }: { label: string; values: number[]; color: string }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}` }}>
      <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {values.map(v => (
          <span key={v} style={{ fontFamily: t.display, fontWeight: 700, fontSize: 13, padding: '3px 10px', borderRadius: 999, border: `1px solid ${color}`, color }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}

function ClickableChips({ label, values, color, onChipClick }: {
  label: string
  values: number[]
  color: string
  onChipClick?: (v: number, index: number) => void
}) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}` }}>
      <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {values.map((v, i) => (
          <span
            key={v}
            onClick={onChipClick ? () => onChipClick(v, i) : undefined}
            style={{
              fontFamily: t.display, fontWeight: 700, fontSize: 13,
              padding: '3px 10px', borderRadius: 999,
              border: `1px solid ${color}`, color,
              cursor: onChipClick ? 'pointer' : 'default',
              transition: 'opacity .2s',
            }}
            onMouseEnter={e => { if (onChipClick) (e.currentTarget as HTMLSpanElement).style.opacity = '0.65' }}
            onMouseLeave={e => { if (onChipClick) (e.currentTarget as HTMLSpanElement).style.opacity = '1' }}
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  )
}

function MesesPessoaisGrid({ meses, onMonthClick }: {
  meses: MesPessoalEntry[]
  onMonthClick: (entry: MesPessoalEntry, idx: number) => void
}) {
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 12, background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
      flex: 1, minWidth: 260,
    }}>
      <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8, fontWeight: 600 }}>
        Meses Pessoais
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4 }}>
        {meses.map((entry, i) => (
          <div
            key={i}
            onClick={() => onMonthClick(entry, i)}
            style={{
              padding: '6px 4px', borderRadius: 8, textAlign: 'center', cursor: 'pointer',
              border: `1px solid ${t.pb}`, transition: 'border-color .2s, background .2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.borderColor = t.coral
              el.style.background = 'rgba(224,94,71,.08)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.borderColor = t.pb
              el.style.background = 'transparent'
            }}
          >
            <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 16, color: t.coral }}>{entry.numero}</div>
            <div style={{ fontFamily: t.body, fontSize: 9, color: t.fg4, marginTop: 2 }}>{entry.nome.slice(0, 3)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnoCard({ entry, onClick }: { entry: AnoPessoalEntry; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
        background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
        display: 'flex', alignItems: 'center', gap: 12, transition: 'border-color .2s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.gold}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.pb}
    >
      <span style={{ fontFamily: t.display, fontWeight: 900, fontSize: 28, color: t.gold, minWidth: 32, textAlign: 'center' }}>
        {entry.numero}
      </span>
      <span style={{ fontFamily: t.body, fontSize: 10, color: t.fg4, lineHeight: 1.4 }}>
        {entry.periodo}
      </span>
    </div>
  )
}
