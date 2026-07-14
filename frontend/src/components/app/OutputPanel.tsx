import { useState, useEffect, useMemo, useRef } from 'react'
import { t } from '../../lib/tokens'
import { NumberCard } from '../shared/NumberCard'
import { ChevronIcon } from '../shared/icons'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'
import { MarkdownEditor } from '../shared/MarkdownEditor'
import {
  calcPessoal,
  type NumerologyMap, type Desafios, type MomentosDecisivos,
  type MesPessoalEntry, type AnoPessoalEntry,
} from '../../lib/numerology'
import type { AnalysisData } from '../../pages/AppPage'
import { fetchInterpretation, type InterpretationRow, type TextOverrides } from '../../lib/supabase'

interface Props {
  data: AnalysisData
  consultantName?: string
  consultantContact?: string
  savedMode?: boolean
  onNewAnalysis?: () => void
  onDismiss?: () => void
  onSave?: () => void
  saving?: boolean
  onPreview?: () => void
  onGenerate?: () => void
  textOverrides?: TextOverrides
  onTextOverrideChange?: (numero: number, tipo: string, texto: string) => void
  // Template específico desta análise (2026-07-12, ver migration 016) — só
  // aparece pra plano Pro, que é quem tem templates de marca pra escolher.
  isPro?: boolean
  templateOptions?: { id: string; name: string; gradient?: string }[]
  templateOverride?: string | null
  onTemplateOverrideChange?: (id: string | null) => void
  effectiveTemplateName?: string
  globalTemplateName?: string
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

export function OutputPanel({
  data, consultantName, consultantContact, savedMode, onNewAnalysis, onDismiss, onSave, saving,
  onPreview, onGenerate, textOverrides, onTextOverrideChange,
  isPro, templateOptions, templateOverride, onTemplateOverrideChange, effectiveTemplateName, globalTemplateName,
}: Props) {
  const nums = useMemo(() => calcPessoal(data.nome, data.dob), [data])
  const subject = useMemo(() => data.nome || '', [data])

  const [selectedCard, setSelectedCard] = useState<SelectedCard | null>(null)
  const [interp, setInterp] = useState<InterpretationRow | null>(null)
  const [draft, setDraft] = useState('')

  // Valor hoje "salvo" pra este campo: o override deste cliente se existir
  // (mesma checagem truthy que PreviewPage.tsx usa pra decidir entre override
  // e padrão — string vazia == "sem override", cai no padrão), senão o texto
  // padrão global. `isDirty`/`isCustom` seguem o mesmo par de conceitos do
  // rodapé de CustomTexts.tsx (Personalizar Textos).
  const overrideValue = (selectedCard && textOverrides?.[selectedCard.value]?.[selectedCard.tipo]) || ''
  const defaultValue = interp?.texto ?? ''
  const savedText = overrideValue || defaultValue
  const isCustom = !!overrideValue
  const isDirty = draft !== savedText
  const showFieldFooter = isCustom || isDirty

  // Seletor de template desta análise (2026-07-12, redesenho): popover com
  // busca + opções em formato card, no lugar do <select> nativo (que
  // duplicava o nome do template já mostrado no rótulo "Template:").
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  const [templateSearch, setTemplateSearch] = useState('')
  const templatePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!templatePickerOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (templatePickerRef.current && !templatePickerRef.current.contains(e.target as Node)) {
        setTemplatePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [templatePickerOpen])

  const templatePickerOptions = useMemo(() => {
    const list: { value: string | null; label: string; sub?: string; gradient?: string }[] = [
      { value: null, label: 'Seguir padrão do sistema', sub: globalTemplateName },
      { value: 'default', label: 'Padrão Vibraweb', gradient: t.gradCta },
      ...(templateOptions ?? []).map(tpl => ({ value: tpl.id, label: tpl.name, gradient: tpl.gradient })),
    ]
    const q = templateSearch.trim().toLowerCase()
    if (!q) return list
    return list.filter(o => o.label.toLowerCase().includes(q) || (o.sub ?? '').toLowerCase().includes(q))
  }, [templateOptions, globalTemplateName, templateSearch])

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

  // Sincroniza o rascunho editável: prioriza o override já salvo deste cliente,
  // depois o texto padrão (global) do consultor/sistema. Só reage a mudanças
  // de campo selecionado/interpretação carregada e ao commit do próprio botão
  // Salvar/Restaurar (que atualiza textOverrides) — não mais a cada tecla
  // digitada, já que agora o override só é gravado no clique de "Salvar".
  useEffect(() => {
    if (!selectedCard) return
    const override = textOverrides?.[selectedCard.value]?.[selectedCard.tipo]
    setDraft(override || interp?.texto || '')
  }, [selectedCard, interp, textOverrides])

  // --- Detail view ---
  if (selectedCard) {
    const tabName = 'Pessoal'
    const canEdit = !!onTextOverrideChange

    function handleFieldSave() {
      if (!selectedCard) return
      onTextOverrideChange!(selectedCard.value, selectedCard.tipo, draft)
    }
    function handleFieldClear() {
      setDraft(savedText)
    }
    function handleFieldRestore() {
      if (!selectedCard) return
      if (!confirm('Deseja apagar sua versão e restaurar o texto padrão do Vibraweb pra este cliente?')) return
      onTextOverrideChange!(selectedCard.value, selectedCard.tipo, '')
    }

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: t.night }}>
        <div style={{ flex: 1, padding: '40px 40px 0', overflowY: 'auto' }}>
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
            Voltar aos números
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ fontFamily: t.body, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: t.fg3, fontWeight: 600, flex: 1 }}>
                  {interp?.titulo ?? `Número de ${selectedCard.label} (${tabName})`}
                </div>
                {isCustom && (
                  <span style={{ fontSize: 11, padding: '4px 8px', background: t.wine, color: t.fg, borderRadius: 4, fontFamily: t.body, flexShrink: 0 }}>
                    Texto Personalizado Ativo
                  </span>
                )}
              </div>
              {canEdit ? (
                <>
                  <MarkdownEditor
                    value={draft}
                    onChange={setDraft}
                    placeholder={`Interpretando o número ${selectedCard.value} para ${selectedCard.label}...`}
                    style={{
                      fontFamily: t.body, fontSize: 15, color: t.fg, marginTop: 12, lineHeight: 1.7,
                      width: '100%', minHeight: 220, resize: 'vertical', boxSizing: 'border-box',
                      background: 'rgba(42,22,32,.25)', border: `1px solid ${t.pb}`, borderRadius: 10,
                      padding: 16,
                    }}
                  />
                  <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginTop: 8 }}>
                    Esse ajuste vale só para este cliente — não muda o texto padrão em "Textos". Selecione um trecho pra formatar.
                  </div>
                </>
              ) : (
                <p style={{ fontFamily: t.body, fontSize: 15, color: t.fg, marginTop: 12, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {draft || `Interpretando o número ${selectedCard.value} para ${selectedCard.label}...`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rodapé fixo, mesmo padrão dinâmico de CustomTexts.tsx (Personalizar
            Textos): colapsa a 0 quando não há nada pra mostrar; "Restaurar
            Padrão" fica sozinho quando há override salvo sem edição pendente;
            "Limpar"/"Salvar" aparecem juntos só enquanto há edição pendente. */}
        {canEdit && (
          <div style={{
            flexShrink: 0, marginLeft: 40, marginRight: 40,
            borderTop: `1px solid ${showFieldFooter ? t.pb : 'transparent'}`,
            padding: showFieldFooter ? '16px 0' : '0',
            maxHeight: showFieldFooter ? 64 : 0,
            overflow: 'hidden',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'max-height 0.25s ease, padding 0.25s ease, border-color 0.25s ease',
          }}>
            {isCustom && (
              <SecondaryBtn onClick={handleFieldRestore} style={{ padding: '10px', fontSize: 12, flexShrink: 0 }}>
                Restaurar Padrão
              </SecondaryBtn>
            )}
            <div style={{ flex: 1 }} />
            <div style={{
              flex: isDirty ? 1 : 0,
              maxWidth: isDirty ? 160 : 0,
              opacity: isDirty ? 1 : 0,
              overflowY: 'hidden', overflowX: isDirty ? 'visible' : 'hidden',
              transition: 'flex 0.25s ease, max-width 0.25s ease, opacity 0.2s ease',
            }}>
              <SecondaryBtn onClick={handleFieldClear} style={{ padding: '10px', fontSize: 12, width: '100%', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                Limpar
              </SecondaryBtn>
            </div>
            <div style={{
              flex: isDirty ? 1 : 0,
              maxWidth: isDirty ? '100%' : 0,
              opacity: isDirty ? 1 : 0,
              overflowY: 'hidden', overflowX: isDirty ? 'visible' : 'hidden',
              transition: 'flex 0.25s ease, max-width 0.25s ease, opacity 0.2s ease',
            }}>
              <PrimaryBtn onClick={handleFieldSave} disabled={!draft.trim()} style={{ padding: '10px', fontSize: 12, width: '100%', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                Salvar
              </PrimaryBtn>
            </div>
          </div>
        )}
        <div style={{ height: 24, flexShrink: 0 }} />
      </div>
    )
  }

  // --- Card grid view ---
  // Toolbar flutuante (2026-07-12) — mesmo padrão de DocumentOrganizerView:
  // barra em pílula, com blur, flutuando por cima do conteúdo, em vez de
  // header fixo com borda. Só existe quando há algo pra mostrar/fazer.
  const hasData = savedMode || data.nome.trim() !== '' || data.dob.trim() !== ''
  const toolbarVisible = hasData && (onSave || onPreview || onGenerate || savedMode)
  const toolbarContent = toolbarVisible && (
    <>
      {savedMode && onDismiss && (
        <button onClick={onDismiss} style={{
          background: 'rgba(255,255,255,0.05)', border: `1px solid ${t.pb}`,
          borderRadius: 6, color: t.fg3,
          fontSize: 12, cursor: 'pointer', padding: '4px 8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, flexShrink: 0,
        }} title="Fechar Painel">
          ✕
        </button>
      )}

      <span style={{
        fontFamily: t.body, fontSize: 13, color: savedMode ? t.gold : t.fg4, fontWeight: savedMode ? 600 : 400,
        flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {savedMode ? data.nome : 'Mapa Pessoal'}
      </span>

      {/* Template desta análise — só pra quem tem templates de marca (Pro).
          Override específico do cliente, sem alterar o padrão global. */}
      {isPro && onTemplateOverrideChange && (
        <div ref={templatePickerRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => { setTemplatePickerOpen(o => !o); setTemplateSearch('') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${t.pb}`, borderRadius: 7,
              color: t.fg3, fontFamily: t.body, fontSize: 11, padding: '5px 10px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <span>Template:</span>
            <strong style={{ color: t.fg2 }}>{effectiveTemplateName ?? 'Padrão Vibraweb'}</strong>
            <ChevronIcon open={templatePickerOpen} size={9} />
          </button>

          {templatePickerOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, width: 260, zIndex: 50,
              background: t.night2, border: `1px solid ${t.pb}`, borderRadius: 10,
              boxShadow: '0 12px 32px rgba(0,0,0,0.5)', padding: 8,
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <input
                autoFocus
                value={templateSearch}
                onChange={e => setTemplateSearch(e.target.value)}
                placeholder="Buscar template..."
                style={{
                  background: 'rgba(0,0,0,0.25)', border: `1px solid ${t.pb}`, borderRadius: 6,
                  color: t.fg, fontFamily: t.body, fontSize: 12, padding: '7px 9px', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {templatePickerOptions.length === 0 && (
                  <div style={{ padding: '10px 8px', fontSize: 12, color: t.fg4, fontFamily: t.body, textAlign: 'center' }}>
                    Nenhum template encontrado
                  </div>
                )}
                {templatePickerOptions.map(opt => {
                  const isSelected = (templateOverride ?? null) === opt.value
                  return (
                    <button
                      key={opt.value ?? '__global__'}
                      onClick={() => { onTemplateOverrideChange(opt.value); setTemplatePickerOpen(false); setTemplateSearch('') }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                        padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                        border: `1px solid ${isSelected ? t.gold : 'rgba(255,255,255,0.05)'}`,
                        background: isSelected ? 'rgba(253,184,19,.08)' : 'rgba(255,255,255,0.02)',
                      }}
                    >
                      <span style={{
                        width: 4, alignSelf: 'stretch', minHeight: 26, borderRadius: 2, flexShrink: 0,
                        background: opt.gradient ?? 'transparent',
                        border: opt.gradient ? 'none' : `1px dashed ${t.pb}`,
                      }} />
                      <span style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: 12, color: t.fg, fontFamily: t.body, fontWeight: 600,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {opt.label}
                        </span>
                        {opt.sub && (
                          <span style={{
                            fontSize: 10, color: t.fg4, fontFamily: t.body,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {opt.sub}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {savedMode && (
        <button onClick={onNewAnalysis} style={{
          background: 'transparent', border: `1px solid ${t.pb}`,
          borderRadius: 7, color: t.fg3,
          fontFamily: t.body, fontWeight: 600, fontSize: 12, padding: '6px 14px', cursor: 'pointer',
          flexShrink: 0,
        }}>
          + Nova Análise
        </button>
      )}
      {onSave && (
        <button onClick={onSave} disabled={saving} style={{
          background: 'transparent', border: `1px solid ${t.pb}`,
          borderRadius: 7, color: t.fg3,
          fontFamily: t.body, fontWeight: 600, fontSize: 12, padding: '6px 14px', cursor: 'pointer',
          opacity: saving ? 0.6 : 1, flexShrink: 0,
        }}>
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      )}
      {onPreview && (
        <button onClick={onPreview} style={{
          background: 'transparent', border: `1px solid ${t.pb}`, borderRadius: 7, color: t.fg2,
          fontFamily: t.body, fontWeight: 600, fontSize: 12, padding: '6px 14px', cursor: 'pointer', flexShrink: 0,
        }}>
          Reordenar Blocos
        </button>
      )}
      {onGenerate && (
        <button onClick={onGenerate} style={{
          background: t.gradCta, border: 'none', borderRadius: 7, color: t.ink,
          fontFamily: t.body, fontWeight: 700, fontSize: 12, padding: '6px 16px', cursor: 'pointer', flexShrink: 0,
        }}>
          Gerar Análise
        </button>
      )}
    </>
  )

  return (
    <div style={{ flex: 1, position: 'relative', minHeight: 0, background: t.night }}>
      {toolbarVisible && (
        <div style={{
          position: 'absolute', top: 16, left: 16, right: 16, zIndex: 20,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          padding: '10px 16px', borderRadius: 12,
          background: 'rgba(22,15,26,0.88)', backdropFilter: 'blur(8px)',
          border: `1px solid ${t.pb}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        }}>
          {toolbarContent}
        </div>
      )}
      <div style={{
        position: 'absolute', inset: 0,
        padding: toolbarVisible ? '88px 28px 64px' : 28,
        overflowY: 'auto',
        backgroundImage: 'radial-gradient(circle at 70% 0%, rgba(88,28,60,.3), transparent 60%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
      }}>

      {/* Empty state placeholder when no data */}
      {!hasData && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.fg4, fontFamily: t.body, fontSize: 14, textAlign: 'center',
          padding: 40, lineHeight: 1.8,
        }}>
          Preencha o nome e a data de nascimento<br />para visualizar o mapa numerológico.
        </div>
      )}

      {/* Sections 1 & 2 — only when there is data */}
      {hasData && <>

      {/* 1. A Essência (Traços de Personalidade) */}
      <Section label="A Essência (Traços de Personalidade)">
        {/* flex-wrap: cards shrink to fit all in one row; orphans on a new line are centered */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {([
            { key: 'motivacao' as const, label: 'Motivação', accent: 'gold' as const },
            { key: 'impressao' as const, label: 'Impressão', accent: 'magenta' as const },
            { key: 'expressao' as const, label: 'Expressão', accent: 'coral' as const },
            { key: 'talentoOculto' as const, label: 'Talento Oculto', accent: 'info' as const },
            { key: 'expressao' as const, label: 'Aptidões Profissionais', accent: 'gold' as const },
          ]).map((c, i) => (
            <div key={`${c.key}-${i}`} style={{ flex: '1 1 90px', minWidth: 90, maxWidth: 200 }}>
              <NumberCard
                label={c.label} value={nums[c.key] ?? null} accent={c.accent}
                onClick={nums[c.key] != null ? () => setSelectedCard({
                  key: c.key, label: c.label, value: nums[c.key]!, accent: c.accent, tipo: c.label === 'Aptidões Profissionais' ? 'pessoal_aptidoes' : `pessoal_${c.key}`
                }) : undefined}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* 2. O Caminho e os Desafios */}
      <Section label="O Caminho e os Desafios">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Row 1: Destino + Missão — 2 large cards filling full width */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            <NumberCard
              label="Destino" value={nums.destino} accent="coral"
              onClick={nums.destino != null ? () => setSelectedCard({
                key: 'destino', label: 'Destino', value: nums.destino!, accent: 'coral', tipo: 'pessoal_destino'
              }) : undefined}
            />
            <NumberCard
              label="Missão" value={nums.missao} accent="magenta"
              onClick={nums.missao != null ? () => setSelectedCard({
                key: 'missao', label: 'Missão', value: nums.missao!, accent: 'magenta', tipo: 'pessoal_missao'
              }) : undefined}
            />
          </div>

          {/* Row 2: Dia Natalício + Número Psíquico + Resposta Subconsciente — 3 cards full width */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <NumberCard
              label="Dia Natalício" value={nums.diaNatalicio} accent="gold"
              onClick={nums.diaNatalicio != null ? () => setSelectedCard({
                key: 'diaNatalicio', label: 'Dia Natalício', value: nums.diaNatalicio!, accent: 'gold', tipo: 'pessoal_dia_natalicio'
              }) : undefined}
            />
            <NumberCard
              label="Número Psíquico" value={nums.psiquico} accent="gold"
              onClick={nums.psiquico != null ? () => setSelectedCard({
                key: 'psiquico', label: 'Número Psíquico', value: nums.psiquico!, accent: 'gold', tipo: 'pessoal_psiquico'
              }) : undefined}
            />
            <NumberCard
              label="Resposta Subconsciente" value={nums.respostaSubconsciente} accent="info"
              onClick={nums.respostaSubconsciente != null ? () => setSelectedCard({
                key: 'respostaSubconsciente', label: 'Resposta Subconsciente', value: nums.respostaSubconsciente!, accent: 'info', tipo: 'pessoal_respostaSubconsciente'
              }) : undefined}
            />
          </div>

          {/* Row 3 (conditional): Lições, Débitos, Tendências */}
          {(nums.licoesCarmicas.length > 0 || nums.debitosCarmicos.length > 0 || nums.tendenciasOcultas.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, alignItems: 'stretch' }}>
              {nums.licoesCarmicas.length > 0 && (
                <GroupCard label="Lições Cármicas" accent="magenta">
                  {nums.licoesCarmicas.map((v, i) => (
                    <CircleNumber key={`licao-${i}`} value={v} accent="magenta" onClick={() => setSelectedCard({
                      key: `licoesCarmicas.${i}`, label: 'Lição Cármica', value: v, accent: 'magenta', tipo: 'pessoal_licao_carmica'
                    })} />
                  ))}
                </GroupCard>
              )}
              {nums.debitosCarmicos.length > 0 && (
                <GroupCard label="Débitos Cármicos" accent="magenta">
                  {nums.debitosCarmicos.map((v, i) => (
                    <CircleNumber key={`debito-${i}`} value={v} accent="magenta" onClick={() => setSelectedCard({
                      key: `debitosCarmicos.${i}`, label: 'Débito Cármico', value: v, accent: 'magenta', tipo: 'pessoal_debito_carmico'
                    })} />
                  ))}
                </GroupCard>
              )}
              {nums.tendenciasOcultas.length > 0 && (
                <GroupCard label="Tendências Ocultas" accent="success">
                  {nums.tendenciasOcultas.map((v, i) => (
                    <CircleNumber key={`tend-${i}`} value={v} accent="success" onClick={() => setSelectedCard({
                      key: `tendenciasOcultas.${i}`, label: 'Tendência Oculta', value: v, accent: 'success', tipo: 'pessoal_tendenciaOculta'
                    })} />
                  ))}
                </GroupCard>
              )}
            </div>
          )}
        </div>
      </Section>

      </> /* end hasData sections 1 & 2 */}

      {/* 3. Ciclos de Tempo (Previsões) — only when there is data */}
      {(nums.ciclosDeVida.length > 0 || !!nums.desafios || !!nums.momentosDecisivos ||
        nums.anoPessoal !== null || nums.diaPessoal !== null || nums.mesesPessoais.length > 0) && (
      <Section label="Ciclos de Tempo (Previsões)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {nums.ciclosDeVida.length > 0 && (
            <div>
              <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginBottom: 8 }}>Ciclos de Vida</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {nums.ciclosDeVida.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedCard({
                      key: `ciclosDeVida.${i}`, label: `Ciclo ${i + 1}`, value: c.regente,
                      accent: 'coral', tipo: 'pessoal_ciclo'
                    })}
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
                      transition: 'border-color .2s', display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.coral}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.pb}
                  >
                    <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 24, color: t.coral }}>{c.regente}</div>
                    <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Ciclo {i + 1}</div>
                    <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg4, marginTop: 2 }}>{c.inicio} – {c.fim}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nums.desafios && (
            <div>
              <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginBottom: 8 }}>Desafios</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {([
                  { label: 'Desafio 1', subKey: 'desafio1' as const, period: nums.ciclosDeVida[0] ? `${nums.ciclosDeVida[0].inicio} – ${nums.ciclosDeVida[0].fim}` : '' },
                  { label: 'Desafio 2', subKey: 'desafio2' as const, period: nums.ciclosDeVida[0] && typeof nums.ciclosDeVida[0].fim === 'number' ? `${nums.ciclosDeVida[0].fim} – ${nums.ciclosDeVida[0].fim + 9}` : '' },
                  { label: 'Desafio Principal', subKey: 'desafioPrincipal' as const, period: 'Vida Toda' },
                ]).map(d => (
                  <div
                    key={d.subKey}
                    onClick={() => setSelectedCard({
                      key: `desafios.${d.subKey}`, label: d.label, value: nums.desafios![d.subKey], accent: 'coral', tipo: 'pessoal_desafio'
                    })}
                    style={{
                      flex: 1, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                      background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
                      transition: 'border-color .2s', display: 'flex', flexDirection: 'column', alignItems: 'center'
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.coral}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.pb}
                  >
                    <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 24, color: t.coral }}>{nums.desafios![d.subKey]}</div>
                    <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{d.label}</div>
                    {d.period && <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg4, marginTop: 2 }}>{d.period}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {nums.momentosDecisivos && (
            <div>
              <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginBottom: 8 }}>Momentos Decisivos</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {([
                  { i: 1, label: 'Momento 1', subKey: 'momento1' as const, period: nums.ciclosDeVida[0] ? `${nums.ciclosDeVida[0].inicio} – ${nums.ciclosDeVida[0].fim}` : '' },
                  { i: 2, label: 'Momento 2', subKey: 'momento2' as const, period: nums.ciclosDeVida[0] && typeof nums.ciclosDeVida[0].fim === 'number' ? `${nums.ciclosDeVida[0].fim} – ${nums.ciclosDeVida[0].fim + 9}` : '' },
                  { i: 3, label: 'Momento 3', subKey: 'momento3' as const, period: nums.ciclosDeVida[0] && typeof nums.ciclosDeVida[0].fim === 'number' ? `${nums.ciclosDeVida[0].fim + 9} – ${nums.ciclosDeVida[0].fim + 18}` : '' },
                  { i: 4, label: 'Momento 4', subKey: 'momento4' as const, period: nums.ciclosDeVida[0] && typeof nums.ciclosDeVida[0].fim === 'number' ? `${nums.ciclosDeVida[0].fim + 18} – Vida Toda` : '' },
                ]).map(d => {
                  const value = nums.momentosDecisivos![d.subKey]
                  return (
                    <div
                      key={d.subKey}
                      onClick={() => setSelectedCard({
                        key: `momentosDecisivos.${d.subKey}`, label: `Momento Decisivo ${d.i}`,
                        value, accent: 'coral', tipo: 'pessoal_momentoDecisivo'
                      })}
                      style={{
                        flex: 1, padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
                        background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
                        transition: 'border-color .2s', display: 'flex', flexDirection: 'column', alignItems: 'center'
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.coral}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.pb}
                    >
                      <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 24, color: t.coral }}>{value}</div>
                      <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>{d.label}</div>
                      {d.period && <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg4, marginTop: 2 }}>{d.period}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(nums.anoPessoal !== null || nums.diaPessoal !== null || nums.mesesPessoais.length > 0) && (
            <div>
              <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginBottom: 8 }}>Previsões Pessoais</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {nums.anoPessoal !== null && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <NumberCard
                        label="Ano Pessoal" value={nums.anoPessoal} accent="gold"
                        onClick={() => setSelectedCard({
                          key: 'anoPessoal', label: 'Ano Pessoal', value: nums.anoPessoal!, accent: 'gold', tipo: 'pessoal_anoPessoal'
                        })}
                      />
                    </div>
                  )}
                  {nums.diaPessoal !== null && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <NumberCard
                        label="Dia Pessoal" value={nums.diaPessoal} accent="gold"
                        onClick={() => setSelectedCard({
                          key: 'diaPessoal', label: 'Dia Pessoal', value: nums.diaPessoal!, accent: 'gold', tipo: 'pessoal_diaPessoal'
                        })}
                      />
                    </div>
                  )}
                </div>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                  {nums.mesesPessoais.length > 0 && (
                    <MesesPessoaisGrid
                      meses={nums.mesesPessoais}
                      onMonthClick={(entry, idx) => setSelectedCard({
                        key: `mesesPessoais.${idx}`, label: entry.nome, value: entry.numero, accent: 'gold', tipo: 'pessoal_mesPessoal'
                      })}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>
      )}

      {/* 4. Relacionamentos e Cabalística — only when there is data */}
      {(!!nums.harmoniaConjugal || !!nums.trianguloDaVida ||
        nums.diasFavoraveis.length > 0 || nums.numerosHarmonicos.length > 0) && (
      <Section label="Relacionamentos e Cabalística">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {nums.harmoniaConjugal && (
            <div>
              <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginBottom: 8 }}>Harmonia Conjugal</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, alignItems: 'stretch' }}>
                <GroupCard label="Vibra com" accent="indigo">
                  {nums.harmoniaConjugal.vibra.map((v, i) => (
                    <CircleNumber key={`vibra-${i}`} value={v} accent="indigo" onClick={() => setSelectedCard({
                      key: 'harmoniaConjugal.vibra', label: 'Vibra com', value: v, accent: 'indigo', tipo: 'pessoal_harmoniaConjugal'
                    })} />
                  ))}
                </GroupCard>
                <GroupCard label="Atrai" accent="indigo">
                  {nums.harmoniaConjugal.atrai.map((v, i) => (
                    <CircleNumber key={`atrai-${i}`} value={v} accent="indigo" onClick={() => setSelectedCard({
                      key: 'harmoniaConjugal.atrai', label: 'Atrai', value: v, accent: 'indigo', tipo: 'pessoal_harmoniaConjugal'
                    })} />
                  ))}
                </GroupCard>
                <GroupCard label="Oposto" accent="indigo">
                  {nums.harmoniaConjugal.oposto.length === 0 && <span style={{ color: t.fg4, fontSize: 13, fontFamily: t.body }}>Nenhum</span>}
                  {nums.harmoniaConjugal.oposto.map((v, i) => (
                    <CircleNumber key={`oposto-${i}`} value={v} accent="indigo" onClick={() => setSelectedCard({
                      key: 'harmoniaConjugal.oposto', label: 'Oposto', value: v, accent: 'indigo', tipo: 'pessoal_harmoniaConjugal'
                    })} />
                  ))}
                </GroupCard>
                <GroupCard label="Passivo" accent="indigo">
                  {nums.harmoniaConjugal.passivo.length === 0 && <span style={{ color: t.fg4, fontSize: 13, fontFamily: t.body }}>Nenhum</span>}
                  {nums.harmoniaConjugal.passivo.map((v, i) => (
                    <CircleNumber key={`passivo-${i}`} value={v} accent="indigo" onClick={() => setSelectedCard({
                      key: 'harmoniaConjugal.passivo', label: 'Passivo', value: v, accent: 'indigo', tipo: 'pessoal_harmoniaConjugal'
                    })} />
                  ))}
                </GroupCard>
              </div>
            </div>
          )}

          {nums.trianguloDaVida && (
            <div>
              <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginBottom: 8 }}>Triângulo da Vida</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 10, alignItems: 'stretch', marginBottom: 10 }}>
                <NumberCard
                  label="Arcano Regente" value={nums.trianguloDaVida.arcanoRegente} accent="indigo"
                  onClick={nums.trianguloDaVida.arcanoRegente != null ? () => setSelectedCard({
                    key: 'arcanoRegente', label: 'Arcano Regente', value: nums.trianguloDaVida!.arcanoRegente!, accent: 'indigo', tipo: 'pessoal_arcano'
                  }) : undefined}
                />
                <GroupCard label="Sequência de Arcanos" accent="indigo">
                  {nums.trianguloDaVida.arcanos.length === 0 && <span style={{ color: t.fg4, fontSize: 13, fontFamily: t.body }}>Sem sequência</span>}
                  {nums.trianguloDaVida.arcanos.map((v, i) => (
                    <CircleNumber key={`seq-${i}`} value={v} accent="indigo" onClick={() => setSelectedCard({
                      key: `arcanos.${i}`, label: 'Arcano da Sequência', value: v, accent: 'indigo', tipo: 'pessoal_arcano'
                    })} />
                  ))}
                </GroupCard>
              </div>
              {nums.arcanoAtual && (
                <GroupCard label="Arcano Atual" accent="indigo">
                  <div
                    onClick={nums.arcanoAtual.numero != null ? () => setSelectedCard({
                      key: 'arcanoAtual', label: 'Arcano Atual', value: nums.arcanoAtual!.numero!, accent: 'indigo', tipo: 'pessoal_arcano'
                    }) : undefined}
                    style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: nums.arcanoAtual.numero != null ? 'pointer' : 'default' }}
                  >
                    <span style={{ fontFamily: t.display, fontWeight: 900, fontSize: 40, color: t.indigo }}>
                      {nums.arcanoAtual.numero}
                    </span>
                    <span style={{ fontFamily: t.body, fontSize: 13, color: t.fg3 }}>
                      {nums.arcanoAtual.periodo}
                    </span>
                  </div>
                </GroupCard>
              )}
            </div>
          )}

          {(nums.diasFavoraveis.length > 0 || nums.numerosHarmonicos.length > 0) && (
            <div>
              <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginBottom: 8 }}>Dias e Números Harmônicos</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, alignItems: 'stretch' }}>
                <GroupCard label="Dias Favoráveis" accent="success">
                  {nums.diasFavoraveis.length === 0 && <span style={{ color: t.fg4, fontSize: 13, fontFamily: t.body }}>Nenhum</span>}
                  {nums.diasFavoraveis.map((v, i) => (
                    <CircleNumber key={`dia-${i}`} value={v} accent="success" onClick={() => setSelectedCard({
                      key: `diasFavoraveis.${i}`, label: 'Dia Favorável', value: v, accent: 'success', tipo: 'pessoal_dia_favoravel'
                    })} />
                  ))}
                </GroupCard>
                <GroupCard label="Números Harmônicos" accent="success">
                  {nums.numerosHarmonicos.length === 0 && <span style={{ color: t.fg4, fontSize: 13, fontFamily: t.body }}>Nenhum</span>}
                  {nums.numerosHarmonicos.map((v, i) => (
                    <CircleNumber key={`harm-${i}`} value={v} accent="success" />
                  ))}
                </GroupCard>
              </div>
            </div>
          )}
        </div>
      </Section>
      )}

      {/* Suppress unused warning for consultantName/consultantContact */}
      {false && consultantName && consultantContact}
      </div>
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

function GroupCard({ label, children, accent }: { label: string; children: React.ReactNode; accent: string }) {
  const color = (t as Record<string, string>)[accent] || t.gold
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '16px 20px', borderRadius: 16,
      background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function CircleNumber({ value, accent, onClick }: { value: string | number; accent: string; onClick?: () => void }) {
  const color = (t as Record<string, string>)[accent] || t.gold
  return (
    <div
      onClick={onClick}
      style={{
        width: 44, height: 44, borderRadius: 22,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${color}`, color,
        background: 'transparent',
        fontFamily: t.display, fontWeight: 800, fontSize: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all .2s',
      }}
      onMouseEnter={e => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.background = color;
          (e.currentTarget as HTMLDivElement).style.color = t.night;
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          (e.currentTarget as HTMLDivElement).style.color = color;
        }
      }}
    >
      {value}
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
  const parts = entry.periodo.split(' a ')
  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 18px', borderRadius: 12, cursor: 'pointer',
        background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
        display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color .2s',
      }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.gold}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = t.pb}
    >
      <span style={{ fontFamily: t.display, fontWeight: 900, fontSize: 32, color: t.gold, minWidth: 32, textAlign: 'center' }}>
        {entry.numero}
      </span>
      <span style={{ fontFamily: t.body, fontSize: 11, color: t.fg3, lineHeight: 1.5, display: 'flex', flexDirection: 'column' }}>
        <span>{parts[0]} a</span>
        {parts[1] && <span>{parts[1]}</span>}
      </span>
    </div>
  )
}
