import { useState, useEffect, useMemo, useRef } from 'react'
import { t } from '../../lib/tokens'
import { NumberCard } from '../shared/NumberCard'
import { ChevronIcon, CloseIcon } from '../shared/icons'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'
import { MarkdownEditor } from '../shared/MarkdownEditor'
import { useConfirm } from '../shared/ConfirmDialog'
import { useIsMobile } from '../../lib/useIsMobile'
import {
  calcPessoal,
  type NumerologyMap, type Desafios, type MomentosDecisivos,
  type MesPessoalEntry,
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

export function OutputPanel({
  data, consultantName, consultantContact, savedMode, onNewAnalysis, onDismiss, onSave, saving,
  onPreview, onGenerate, textOverrides, onTextOverrideChange,
  isPro, templateOptions, templateOverride, onTemplateOverrideChange, effectiveTemplateName, globalTemplateName,
}: Props) {
  const confirm = useConfirm()
  const isMobile = useIsMobile()
  const nums = useMemo(() => calcPessoal(data.nome, data.dob), [data])

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

  // --- Modal de edição do texto (por análise) ---
  // Clicar num número NÃO troca mais a tela inteira (nem abre painel lateral):
  // abre uma janela modal flutuante por cima da grade de cards, com o MESMO
  // MarkdownEditor compartilhado do editor global (Personalizar Textos) —
  // mesma barra de formatação fixa, mesmos botões dinâmicos Restaurar/Limpar/
  // Salvar. A diferença é o destino do save: aqui grava só no text_overrides
  // DESTA análise (via onTextOverrideChange), nunca no texto padrão global.
  const canEdit = !!onTextOverrideChange

  function handleFieldSave() {
    if (!selectedCard) return
    onTextOverrideChange!(selectedCard.value, selectedCard.tipo, draft)
  }
  function handleFieldClear() {
    setDraft(savedText)
  }
  async function handleFieldRestore() {
    if (!selectedCard) return
    const ok = await confirm({
      title: 'Restaurar padrão',
      message: 'Deseja apagar sua versão personalizada e restaurar o texto padrão do Vibraweb pra este cliente?',
      confirmLabel: 'Restaurar',
      danger: true,
    })
    if (!ok) return
    onTextOverrideChange!(selectedCard.value, selectedCard.tipo, '')
  }

  const accentColor = selectedCard ? ((t as Record<string, string>)[selectedCard.accent] || t.gold) : t.gold
  const editorModal = selectedCard && (
    <div
      // Clicar no backdrop fecha SÓ sem edição pendente — com rascunho não
      // salvo, força a escolha explícita (Salvar/Limpar/✕) em vez de perder
      // o texto num clique acidental fora da janela.
      onMouseDown={e => { if (e.target === e.currentTarget && !isDirty) setSelectedCard(null) }}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? 0 : 24,
        background: 'rgba(10,6,12,0.65)', backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        width: isMobile ? '100%' : 'min(760px, 100%)',
        height: isMobile ? '100%' : 'min(78vh, 720px)',
        display: 'flex', flexDirection: 'column', minHeight: 0,
        background: t.night, border: isMobile ? 'none' : `1px solid ${t.pb}`,
        borderRadius: isMobile ? 0 : 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.55)',
        overflow: 'hidden', boxSizing: 'border-box',
      }}>
        {/* Header: número em destaque + título + badge + fechar */}
        <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 12, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: t.display, fontWeight: 900, fontSize: 26, color: accentColor,
            background: 'rgba(42,22,32,.45)', border: `1px solid ${t.pb}`,
          }}>
            {selectedCard.value}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: t.display, fontSize: 15, fontWeight: 700, color: t.fg,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {interp?.titulo ?? `Número de ${selectedCard.label}`}
            </div>
            <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginTop: 2 }}>
              Ajuste vale só para esta análise — não muda o texto padrão em "Textos".
            </div>
          </div>
          {isCustom && (
            <span style={{ fontSize: 11, padding: '4px 8px', background: t.wine, color: t.fg, borderRadius: 4, fontFamily: t.body, flexShrink: 0 }}>
              Texto Personalizado Ativo
            </span>
          )}
          <button
            onClick={() => setSelectedCard(null)}
            title="Fechar"
            style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: 'transparent', border: `1px solid ${t.pb}`, color: t.fg3,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Corpo: o mesmo editor compartilhado, barra de formatação fixa no topo */}
        <div style={{ flex: 1, minHeight: 0, padding: '0 20px', display: 'flex', flexDirection: 'column' }}>
          {canEdit ? (
            <>
              <MarkdownEditor
                value={draft}
                onChange={setDraft}
                placeholder={`Interpretando o número ${selectedCard.value} para ${selectedCard.label}...`}
                style={{
                  flex: 1, minHeight: 0, width: '100%', boxSizing: 'border-box', overflowY: 'auto',
                  fontFamily: t.body, fontSize: 15, color: t.fg, lineHeight: 1.7,
                  background: 'rgba(0,0,0,0.2)', border: `1px solid ${t.pb}`, borderRadius: 8,
                  padding: 16, outline: 'none',
                }}
              />
              <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginTop: 6, flexShrink: 0 }}>
                Use a barra acima da caixa pra formatar. Reflete no preview e no PDF gerado desta análise.
              </div>
            </>
          ) : (
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              <p style={{ fontFamily: t.body, fontSize: 15, color: t.fg, margin: 0, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {draft || `Interpretando o número ${selectedCard.value} para ${selectedCard.label}...`}
              </p>
            </div>
          )}
        </div>

        {/* Rodapé dinâmico — mesmo padrão de CustomTexts (Personalizar Textos):
            colapsa a 0 sem nada a mostrar; Restaurar sozinho com override
            salvo; Limpar/Salvar só com edição pendente. */}
        {canEdit && (
          <div style={{
            flexShrink: 0, marginLeft: 20, marginRight: 20,
            borderTop: `1px solid ${showFieldFooter ? t.pb : 'transparent'}`,
            padding: showFieldFooter ? '14px 0' : '0',
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
        <div style={{ height: 14, flexShrink: 0 }} />
      </div>
    </div>
  )

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

      {/* Seções seguem EXATAMENTE os grupos de nível superior de "Blocos"
          (block-order.ts / BLOCK_DEFS) — mesma organização e nomes que o
          consultor vê em /app/blocos e no documento gerado, pra grade de
          cards e relatório contarem a mesma história na mesma ordem. */}
      {hasData && <>

      {/* 1. Personalidade — quem você é */}
      <Section label="Personalidade">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {([
            { key: 'motivacao' as const, label: 'Motivação', accent: 'gold' as const, tipo: 'pessoal_motivacao' },
            { key: 'impressao' as const, label: 'Impressão', accent: 'magenta' as const, tipo: 'pessoal_impressao' },
            { key: 'expressao' as const, label: 'Expressão', accent: 'coral' as const, tipo: 'pessoal_expressao' },
            { key: 'talentoOculto' as const, label: 'Talento Oculto', accent: 'info' as const, tipo: 'pessoal_talentoOculto' },
            { key: 'psiquico' as const, label: 'Número Psíquico', accent: 'wine' as const, tipo: 'pessoal_psiquico' },
          ]).map(c => (
            <div key={c.tipo} style={{ flex: '1 1 90px', minWidth: 90, maxWidth: 200 }}>
              <NumberCard
                label={c.label} value={nums[c.key] ?? null} accent={c.accent}
                onClick={nums[c.key] != null ? () => setSelectedCard({
                  key: c.key, label: c.label, value: nums[c.key]!, accent: c.accent, tipo: c.tipo
                }) : undefined}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Propósito de Vida — por que você veio */}
      <Section label="Propósito de Vida">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <NumberCard
            label="Dia Natalício" value={nums.diaNatalicio} accent="gold"
            onClick={nums.diaNatalicio != null ? () => setSelectedCard({
              key: 'diaNatalicio', label: 'Dia Natalício', value: nums.diaNatalicio!, accent: 'gold', tipo: 'pessoal_dia_natalicio'
            }) : undefined}
          />
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
          {/* Aptidões usa o número de Expressão — mesma base de cálculo. */}
          <NumberCard
            label="Aptidões Profissionais" value={nums.expressao} accent="gold"
            onClick={nums.expressao != null ? () => setSelectedCard({
              key: 'expressao', label: 'Aptidões Profissionais', value: nums.expressao!, accent: 'gold', tipo: 'pessoal_aptidoes'
            }) : undefined}
          />
        </div>
      </Section>

      {/* 3. Aspectos Cármicos — o que superar */}
      <Section label="Aspectos Cármicos">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' }}>
          {nums.licoesCarmicas.length > 0 && (
            <div style={{ flex: '1 1 200px', minWidth: 200, display: 'flex' }}>
              <GroupCard label="Lições Cármicas" accent="magenta">
                {nums.licoesCarmicas.map((v, i) => (
                  <CircleNumber key={`licao-${i}`} value={v} accent="magenta" onClick={() => setSelectedCard({
                    key: `licoesCarmicas.${i}`, label: 'Lição Cármica', value: v, accent: 'magenta', tipo: 'pessoal_licao_carmica'
                  })} />
                ))}
              </GroupCard>
            </div>
          )}
          {nums.debitosCarmicos.length > 0 && (
            <div style={{ flex: '1 1 200px', minWidth: 200, display: 'flex' }}>
              <GroupCard label="Débitos Cármicos" accent="magenta">
                {nums.debitosCarmicos.map((v, i) => (
                  <CircleNumber key={`debito-${i}`} value={v} accent="magenta" onClick={() => setSelectedCard({
                    key: `debitosCarmicos.${i}`, label: 'Débito Cármico', value: v, accent: 'magenta', tipo: 'pessoal_debito_carmico'
                  })} />
                ))}
              </GroupCard>
            </div>
          )}
          {nums.tendenciasOcultas.length > 0 && (
            <div style={{ flex: '1 1 200px', minWidth: 200, display: 'flex' }}>
              <GroupCard label="Tendências Ocultas" accent="success">
                {nums.tendenciasOcultas.map((v, i) => (
                  <CircleNumber key={`tend-${i}`} value={v} accent="success" onClick={() => setSelectedCard({
                    key: `tendenciasOcultas.${i}`, label: 'Tendência Oculta', value: v, accent: 'success', tipo: 'pessoal_tendenciaOculta'
                  })} />
                ))}
              </GroupCard>
            </div>
          )}
          {nums.respostaSubconsciente != null && (
            <div style={{ flex: '1 1 200px', minWidth: 200 }}>
              <NumberCard
                label="Resposta Subconsciente" value={nums.respostaSubconsciente} accent="info"
                onClick={() => setSelectedCard({
                  key: 'respostaSubconsciente', label: 'Resposta Subconsciente', value: nums.respostaSubconsciente!, accent: 'info', tipo: 'pessoal_respostaSubconsciente'
                })}
              />
            </div>
          )}
        </div>
      </Section>

      {/* 4. Ciclos de Vida, Desafios e Momentos Decisivos */}
      {(nums.ciclosDeVida.length > 0 || !!nums.desafios || !!nums.momentosDecisivos) && (
      <Section label="Ciclos de Vida, Desafios e Momentos Decisivos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {nums.ciclosDeVida.length > 0 && (
            <div>
              <SubLabel>Ciclos de Vida</SubLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {nums.ciclosDeVida.map((c, i) => (
                  <MiniTile
                    key={i} value={c.regente} title={`Ciclo ${i + 1}`} sub={`${c.inicio} – ${c.fim}`}
                    onClick={() => setSelectedCard({
                      key: `ciclosDeVida.${i}`, label: `Ciclo ${i + 1}`, value: c.regente,
                      accent: 'coral', tipo: 'pessoal_ciclo'
                    })}
                  />
                ))}
              </div>
            </div>
          )}

          {nums.desafios && (
            <div>
              <SubLabel>Desafios</SubLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {([
                  { label: 'Desafio 1', subKey: 'desafio1' as const, period: nums.ciclosDeVida[0] ? `${nums.ciclosDeVida[0].inicio} – ${nums.ciclosDeVida[0].fim}` : '' },
                  { label: 'Desafio 2', subKey: 'desafio2' as const, period: nums.ciclosDeVida[0] && typeof nums.ciclosDeVida[0].fim === 'number' ? `${nums.ciclosDeVida[0].fim} – ${nums.ciclosDeVida[0].fim + 9}` : '' },
                  { label: 'Desafio Principal', subKey: 'desafioPrincipal' as const, period: 'Vida Toda' },
                ]).map(d => (
                  <MiniTile
                    key={d.subKey} value={nums.desafios![d.subKey]} title={d.label} sub={d.period || undefined}
                    onClick={() => setSelectedCard({
                      key: `desafios.${d.subKey}`, label: d.label, value: nums.desafios![d.subKey], accent: 'coral', tipo: 'pessoal_desafio'
                    })}
                  />
                ))}
              </div>
            </div>
          )}

          {nums.momentosDecisivos && (
            <div>
              <SubLabel>Momentos Decisivos</SubLabel>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {([
                  { i: 1, label: 'Momento 1', subKey: 'momento1' as const, period: nums.ciclosDeVida[0] ? `${nums.ciclosDeVida[0].inicio} – ${nums.ciclosDeVida[0].fim}` : '' },
                  { i: 2, label: 'Momento 2', subKey: 'momento2' as const, period: nums.ciclosDeVida[0] && typeof nums.ciclosDeVida[0].fim === 'number' ? `${nums.ciclosDeVida[0].fim} – ${nums.ciclosDeVida[0].fim + 9}` : '' },
                  { i: 3, label: 'Momento 3', subKey: 'momento3' as const, period: nums.ciclosDeVida[0] && typeof nums.ciclosDeVida[0].fim === 'number' ? `${nums.ciclosDeVida[0].fim + 9} – ${nums.ciclosDeVida[0].fim + 18}` : '' },
                  { i: 4, label: 'Momento 4', subKey: 'momento4' as const, period: nums.ciclosDeVida[0] && typeof nums.ciclosDeVida[0].fim === 'number' ? `${nums.ciclosDeVida[0].fim + 18} – Vida Toda` : '' },
                ]).map(d => (
                  <MiniTile
                    key={d.subKey} value={nums.momentosDecisivos![d.subKey]} title={d.label} sub={d.period || undefined}
                    onClick={() => setSelectedCard({
                      key: `momentosDecisivos.${d.subKey}`, label: `Momento Decisivo ${d.i}`,
                      value: nums.momentosDecisivos![d.subKey], accent: 'coral', tipo: 'pessoal_momentoDecisivo'
                    })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>
      )}

      {/* 5. Previsões Temporais — Ano/Mês/Dia Pessoal + Dias Favoráveis
          (Dias Favoráveis mudou de "Relacionamentos e Cabalística" pra cá,
          seguindo a posição real no documento/Blocos). */}
      {(nums.anoPessoal !== null || nums.diaPessoal !== null || nums.mesesPessoais.length > 0 || nums.diasFavoraveis.length > 0) && (
      <Section label="Previsões Temporais">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(nums.anoPessoal !== null || nums.diaPessoal !== null || nums.mesesPessoais.length > 0) && (
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
          )}
          {nums.diasFavoraveis.length > 0 && (
            <GroupCard label="Dias Favoráveis" accent="success">
              {nums.diasFavoraveis.map((v, i) => (
                <CircleNumber key={`dia-${i}`} value={v} accent="success" onClick={() => setSelectedCard({
                  key: `diasFavoraveis.${i}`, label: 'Dia Favorável', value: v, accent: 'success', tipo: 'pessoal_dia_favoravel'
                })} />
              ))}
            </GroupCard>
          )}
        </div>
      </Section>
      )}

      {/* 6. Relacionamentos — Harmonia Conjugal + Números Harmônicos */}
      {(!!nums.harmoniaConjugal || nums.numerosHarmonicos.length > 0) && (
      <Section label="Relacionamentos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {nums.harmoniaConjugal && (
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
          )}
          {nums.numerosHarmonicos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <GroupCard label="Números Harmônicos" accent="success">
                {nums.numerosHarmonicos.map((v, i) => (
                  <CircleNumber key={`harm-${i}`} value={v} accent="success" />
                ))}
              </GroupCard>
            </div>
          )}
        </div>
      </Section>
      )}

      {/* 7. Triângulo da Vida e Arcanos */}
      {nums.trianguloDaVida && (
      <Section label="Triângulo da Vida e Arcanos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 10, alignItems: 'stretch' }}>
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
      </Section>
      )}

      </> /* end hasData */}

      {/* Suppress unused warning for consultantName/consultantContact */}
      {false && consultantName && consultantContact}
      </div>

      {editorModal}
    </div>
  )
}

// --- Helper components ---

// Cabeçalho de seção: marcador em gradiente + rótulo + linha fina até a
// borda — dá hierarquia visual clara entre os 7 grupos (mesmos de Blocos)
// sem pesar o layout.
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ width: 3, height: 14, borderRadius: 2, background: t.gradCta, flexShrink: 0 }} />
        <span style={{
          fontFamily: t.body, fontSize: 11, color: t.fg2, textTransform: 'uppercase',
          letterSpacing: '.08em', fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          {label}
        </span>
        <span style={{ flex: 1, height: 1, background: t.pb }} />
      </div>
      {children}
    </div>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: t.body, fontSize: 11, color: t.fg4, marginBottom: 8 }}>
      {children}
    </div>
  )
}

// Tile compacto de número + rótulo + período — usado por Ciclos, Desafios e
// Momentos Decisivos (antes eram 3 cópias do mesmo bloco de estilos inline).
function MiniTile({ value, title, sub, onClick }: {
  value: number | string
  title: string
  sub?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px', borderRadius: 12, cursor: onClick ? 'pointer' : 'default',
        background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
        transition: 'border-color .2s, background .2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
      onMouseEnter={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = t.coral
        el.style.background = 'rgba(224,94,71,.08)'
      }}
      onMouseLeave={e => {
        if (!onClick) return
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = t.pb
        el.style.background = 'rgba(42,22,32,.35)'
      }}
    >
      <div style={{ fontFamily: t.display, fontWeight: 900, fontSize: 24, color: t.coral }}>{value}</div>
      <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg3, marginTop: 4, textTransform: 'uppercase', letterSpacing: '.06em', textAlign: 'center' }}>{title}</div>
      {sub && <div style={{ fontFamily: t.body, fontSize: 10, color: t.fg4, marginTop: 2 }}>{sub}</div>}
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

