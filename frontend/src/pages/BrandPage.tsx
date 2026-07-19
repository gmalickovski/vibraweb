// BrandPage.tsx — /app/marca (Item 2, Fase 1)
// Redesenho (2026-07-11, 5ª rodada): a coluna de cards e a coluna de edição
// deixaram de ser 2 colunas separadas — agora é UM único container que
// transforma seu conteúdo (lista de cards ↔ editor) com uma animação de
// slide, exatamente como pedido por Guilherme ("no mesmo container onde
// aparece os cards vai alterar para o container das edições usando uma
// animação"). O preview continua ao lado, ocupando o espaço restante.
// Cards agora usam ícones (lápis = editar, círculo = tornar ativo, lixeira =
// excluir) no lugar de botões escritos, têm quebra de texto no nome, e o
// card ativo sobe animado (FLIP) para o topo da lista quando "ativado".
// Ver Produto/docs/vibra-web/requisitos.md, seção 2.

import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchUserProfile, updateUserProfile, uploadBrandLogo } from '../lib/supabase'
import type { UserProfile } from '../lib/supabase'
import { VIBRAWEB_DEFAULTS, resolveDocTheme, wcagStatus } from '../lib/theme-resolver'
import { buildDocumentBlocks, splitIntoPages } from '../lib/document-builder'
import type { InterpretationMap } from '../lib/document-builder'
import { DEFAULT_BLOCK_ORDER } from '../lib/block-order'
import { loadSampleClient, loadSampleInterpretations, type SampleIdentity } from '../lib/sample-preview'
import type { NumerologyMap } from '../lib/numerology'
import { PrimaryBtn, SecondaryBtn } from '../components/shared/Button'
import { PageTitle } from '../components/shared/PageTitle'
import { DocumentOrganizerView } from '../components/shared/DocumentOrganizerView'
import { EyeIcon, EyeOffIcon, ChevronIcon } from '../components/shared/icons'
import { useConfirm } from '../components/shared/ConfirmDialog'
import { useIsMobile } from '../lib/useIsMobile'
import { t } from '../lib/tokens'

const DOC_BACKGROUND = '#FFFFFF' // fundo do documento — sempre claro, não segue dark mode
const COLUMN_WIDTH = 380 // largura única do container (lista OU editor) — antes 320/240

type Section = 'cores' | 'capa' | 'cabecalho' | 'rodape'

interface TemplateItem {
  id: string
  name: string
  isDefault: boolean
  gradient: string
}

export default function BrandPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const confirm = useConfirm()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [templates, setTemplates] = useState<any[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string>('')

  // previewId: qual template aparece no preview (clicar num card só muda isso).
  // editingId: qual template tem o editor aberto (null = mostra a lista de
  // cards; setado = o MESMO container desliza pro editor daquele template).
  const [previewId, setPreviewId] = useState<string>('default')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingConfig, setEditingConfig] = useState<any>({})
  const [originalConfig, setOriginalConfig] = useState<any>({})
  const [openSection, setOpenSection] = useState<Section>('cores')
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')

  const [sampleIdentity, setSampleIdentity] = useState<SampleIdentity | null>(null)
  const [sampleMap, setSampleMap] = useState<NumerologyMap | null>(null)
  const [interp, setInterp] = useState<InterpretationMap | null>(null)

  // ── FLIP (First-Last-Invert-Play) pra animar o card subindo ao topo
  // quando é ativado — sem depender de lib externa de animação.
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const prevRectsRef = useRef<Map<string, DOMRect>>(new Map())
  const prevOrderKeyRef = useRef<string>('')

  function registerCardRef(id: string, el: HTMLDivElement | null) {
    if (el) cardRefs.current.set(id, el)
    else cardRefs.current.delete(id)
  }

  function captureRectsForFlip() {
    const map = new Map<string, DOMRect>()
    cardRefs.current.forEach((el, id) => map.set(id, el.getBoundingClientRect()))
    prevRectsRef.current = map
  }

  useEffect(() => {
    loadSampleClient().then(({ identity, map }) => {
      setSampleIdentity(identity)
      setSampleMap(map)
      loadSampleInterpretations(map).then(setInterp)
    })
  }, [])

  useEffect(() => {
    fetchUserProfile().then(p => {
      if (!p) { navigate('/app'); return }
      if (p.plan !== 'pro' && p.role !== 'admin') {
        alert('A página "Templates" é exclusiva para assinantes do plano Pro.')
        navigate('/app')
        return
      }

      setProfile(p)
      const configData = p.brand_config || {}
      let loadedTemplates: any[] = []
      let loadedActiveId = 'default'

      if (configData.activeTemplateId && Array.isArray(configData.templates)) {
        loadedTemplates = configData.templates
        loadedActiveId = configData.activeTemplateId
      } else if (configData.primaryColor) {
        const defaultId = crypto.randomUUID()
        loadedTemplates = [{ id: defaultId, name: 'Template Principal', config: configData }]
        loadedActiveId = defaultId
      }

      setTemplates(loadedTemplates)
      setActiveTemplateId(loadedActiveId)
      setPreviewId(loadedActiveId)
      setLoading(false)
    })
  }, [navigate])

  // Lista unificada (Padrão Vibraweb + templates do consultor) — o item
  // ativo sempre vem primeiro; ao trocar de ativo, os cards reordenam com
  // a animação FLIP (ver useLayoutEffect abaixo).
  const allItems: TemplateItem[] = useMemo(() => [
    {
      id: 'default', name: 'Padrão Vibraweb', isDefault: true,
      gradient: `linear-gradient(to bottom, ${VIBRAWEB_DEFAULTS.primaryColor}, ${VIBRAWEB_DEFAULTS.accentColor})`,
    },
    ...templates.map(tpl => ({
      id: tpl.id, name: tpl.name, isDefault: false,
      gradient: `linear-gradient(to bottom, ${tpl.config?.primaryColor || VIBRAWEB_DEFAULTS.primaryColor}, ${tpl.config?.accentColor || VIBRAWEB_DEFAULTS.accentColor})`,
    })),
  ], [templates])

  const sortedItems = useMemo(() => {
    const activeIdx = allItems.findIndex(it => it.id === activeTemplateId)
    if (activeIdx <= 0) return allItems
    const active = allItems[activeIdx]
    const rest = allItems.filter((_, i) => i !== activeIdx)
    return [active, ...rest]
  }, [allItems, activeTemplateId])

  const orderKey = sortedItems.map(it => it.id).join('|')

  useLayoutEffect(() => {
    if (prevOrderKeyRef.current && prevOrderKeyRef.current !== orderKey) {
      sortedItems.forEach(item => {
        const el = cardRefs.current.get(item.id)
        const prevRect = prevRectsRef.current.get(item.id)
        if (!el || !prevRect) return
        const newRect = el.getBoundingClientRect()
        const deltaY = prevRect.top - newRect.top
        if (deltaY) {
          el.style.transition = 'none'
          el.style.transform = `translateY(${deltaY}px)`
          el.getBoundingClientRect() // força reflow antes de animar de volta
          requestAnimationFrame(() => {
            el.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
            el.style.transform = ''
          })
        }
      })
    }
    prevOrderKeyRef.current = orderKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderKey])

  if (loading || !profile) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: t.night, color: t.fg2 }}>
        Carregando...
      </div>
    )
  }

  const isDirty = JSON.stringify(editingConfig) !== JSON.stringify(originalConfig)
  const isEditingDefault = editingId === 'default'

  // --- Actions ---

  const handleCreateTemplateClick = () => {
    setNewTemplateName('')
    setCreateModalOpen(true)
  }

  const confirmCreateTemplate = async () => {
    if (!newTemplateName.trim()) return
    setCreateModalOpen(false)

    const newId = crypto.randomUUID()
    const newTemplate = { id: newId, name: newTemplateName.trim(), config: {} }
    const updated = [...templates, newTemplate]

    setTemplates(updated)
    await updateUserProfile({ brand_config: { activeTemplateId, templates: updated } })

    openEditor(newId, updated)
  }

  // Clicar num card: só troca o que aparece no preview. Se o editor já estiver
  // aberto (editando outro template), acompanha e passa a editar este.
  async function selectCard(id: string) {
    if (editingId && isDirty) {
      const ok = await confirm({
        title: 'Alterações não salvas',
        message: 'Você tem alterações não salvas neste template. Trocar mesmo assim? As alterações serão perdidas.',
        confirmLabel: 'Trocar Mesmo Assim',
        danger: true,
      })
      if (!ok) return
    }
    setPreviewId(id)
    if (editingId) {
      openEditor(id)
    }
  }

  function openEditor(id: string, templateList: any[] = templates) {
    setEditingId(id)
    setPreviewId(id)
    const cfg = id === 'default' ? {} : (templateList.find(tpl => tpl.id === id)?.config || {})
    setEditingConfig(cfg)
    setOriginalConfig(cfg)
    setOpenSection('cores')
  }

  // Rodapé do editor (2026-07-12, 9ª rodada): "Voltar" fecha o editor sem
  // salvar — só aparece quando não há nada pra perder (isDirty false), então
  // o confirm() de antes deixou de ser necessário. Com edição pendente, o
  // botão vira "Cancelar" (descarta via discardEdits, fica no editor).
  function closeEditor() {
    setEditingId(null)
  }

  function discardEdits() {
    setEditingConfig(originalConfig)
  }

  const handleSetActive = async (id: string) => {
    setActiveTemplateId(id)
    await updateUserProfile({ brand_config: { activeTemplateId: id, templates } })
  }

  // Captura as posições dos cards ANTES de ativar, pra animar o card subindo
  // ao topo (FLIP) depois que a reordenação acontecer.
  async function handleActivate(id: string) {
    captureRectsForFlip()
    await handleSetActive(id)
  }

  const handleDeleteTemplate = async (id: string) => {
    if (templates.length <= 1) {
      alert('Você precisa ter pelo menos um template.')
      return
    }
    const ok = await confirm({
      title: 'Excluir template',
      message: 'Tem certeza que deseja excluir este template? Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return

    const updated = templates.filter(tpl => tpl.id !== id)
    setTemplates(updated)

    let newActiveId = activeTemplateId
    if (activeTemplateId === id) {
      newActiveId = updated[0].id
      setActiveTemplateId(newActiveId)
    }
    if (previewId === id) setPreviewId(newActiveId)
    if (editingId === id) setEditingId(null)

    await updateUserProfile({ brand_config: { activeTemplateId: newActiveId, templates: updated } })
  }

  async function persistTemplates(updated: any[], newActiveId: string) {
    setSaving(true)
    const success = await updateUserProfile({ brand_config: { activeTemplateId: newActiveId, templates: updated } })
    if (success) {
      setActiveTemplateId(newActiveId)
      setTemplates(updated)
      setOriginalConfig(editingConfig)
    } else {
      alert('Erro ao salvar configurações.')
    }
    setSaving(false)
    return success
  }

  const handleSave = async () => {
    if (isEditingDefault || !editingId) return
    const updated = templates.map(tpl => tpl.id === editingId ? { ...tpl, config: editingConfig } : tpl)
    await persistTemplates(updated, activeTemplateId)
  }

  // Header do editor (Guilherme, 2026-07-12): "Salvar" salva e volta pra lista de
  // cards; "Voltar" descarta e volta sem salvar (closeEditor já faz isso).
  const handleSaveAndClose = async () => {
    if (isEditingDefault) { setEditingId(null); return }
    await handleSave()
    setEditingId(null)
  }

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'headerLogoUrl') => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const url = await uploadBrandLogo(file)
    if (url) {
      setEditingConfig((prev: any) => ({ ...prev, [field]: url }))
    } else {
      alert('Erro ao fazer upload da imagem.')
    }
    setUploading(false)
  }

  const updateConfig = (key: string, value: any) => {
    setEditingConfig((prev: any) => ({ ...prev, [key]: value }))
  }

  // --- Theme resolution ---
  // Com o editor aberto, o preview segue o editingConfig (ao vivo, com
  // alterações ainda não salvas). Com o editor fechado, segue o config JÁ
  // SALVO do template selecionado pra preview (previewId).
  const previewSavedConfig = previewId === 'default'
    ? {}
    : (templates.find(tpl => tpl.id === previewId)?.config || {})
  const activeConfigForPreview = editingId ? editingConfig : previewSavedConfig

  const previewProfile = {
    ...profile,
    brand_config: {
      activeTemplateId: 'mock',
      templates: [{ id: 'mock', config: activeConfigForPreview }],
    },
  }
  const theme = resolveDocTheme(previewId === 'default' && !editingId ? profile : previewProfile)

  const h1Status = wcagStatus(theme.h1Color, DOC_BACKGROUND, true)
  const h2Status = wcagStatus(theme.h2Color, DOC_BACKGROUND, true)
  const bodyStatus = wcagStatus(theme.bodyColor, DOC_BACKGROUND, false)

  const previewReady = sampleMap && interp && sampleIdentity
  const previewBlocks = previewReady
    ? buildDocumentBlocks(sampleMap!, sampleIdentity!.subject, sampleIdentity!.dataNascimento, interp!, DEFAULT_BLOCK_ORDER)
    : []

  const previewPageCount = previewReady ? splitIntoPages(previewBlocks).length + 1 : 0 // +1 pela capa

  const previewingLabel = previewId === 'default'
    ? 'Padrão Vibraweb'
    : (templates.find(tpl => tpl.id === previewId)?.name ?? 'Template')

  const previewContent = previewReady ? (
    <DocumentOrganizerView
      theme={theme}
      blocks={previewBlocks}
      subject={sampleIdentity!.subject}
      dataNascimento={sampleIdentity!.dataNascimento}
      isPro
      docTitle={`${sampleIdentity!.subject} — ${previewingLabel}${editingId ? ' (editando)' : ''}`}
      pageCount={previewPageCount}
      onBack={isMobile ? () => setMobilePreviewOpen(false) : undefined}
    />
  ) : (
    <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: t.fg3, fontSize: 12, fontFamily: t.body }}>
      Montando preview...
    </div>
  )

  // ── Conteúdo da camada "lista de cards" ─────────────────────────────────
  // Header e rodapé ficam fixos (mesma altura/fonte em ambas as camadas); só
  // o meio (cards) rola quando necessário (Guilherme, 2026-07-12).
  const listView = (
    <>
      <div style={{ padding: 20, borderBottom: `1px solid ${t.pb}`, flexShrink: 0 }}>
        <PageTitle
          title="Templates"
          info="Cada template guarda cores, logo, cabeçalho e rodapé do seu PDF white-label. Clique num card pra ver o preview; use o lápis pra editar."
          size={16}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sortedItems.map(item => (
          <TemplateCard
            key={item.id}
            cardRef={el => registerCardRef(item.id, el)}
            label={item.name}
            isActive={item.id === activeTemplateId}
            isSelected={previewId === item.id}
            gradient={item.gradient}
            onSelect={() => selectCard(item.id)}
            onEdit={!item.isDefault ? () => openEditor(item.id) : undefined}
            onActivate={item.id !== activeTemplateId ? () => handleActivate(item.id) : undefined}
            onDelete={!item.isDefault ? () => handleDeleteTemplate(item.id) : undefined}
          />
        ))}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${t.pb}`, flexShrink: 0 }}>
        <PrimaryBtn onClick={handleCreateTemplateClick} style={{ padding: '10px', fontSize: 12, width: '100%', justifyContent: 'center' }}>
          + Criar Novo Template
        </PrimaryBtn>
      </div>
    </>
  )

  // ── Conteúdo da camada "editor" ──────────────────────────────────────────
  // Header (título) na mesma altura/fonte do header da lista; corpo é a
  // única parte que rola; rodapé fixo com Voltar/Cancelar+Salvar dinâmico.
  const editorView = editingId && (
    <>
      <div style={{ padding: 20, borderBottom: `1px solid ${t.pb}`, flexShrink: 0 }}>
        <h1 style={{
          fontSize: 16, fontWeight: 700, margin: 0, fontFamily: t.display, color: t.fg,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {isEditingDefault ? 'Padrão Vibraweb' : templates.find(tpl => tpl.id === editingId)?.name}
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
      {isEditingDefault ? (
        <div style={{ padding: 24, fontSize: 13, color: t.fg3, fontFamily: t.body, lineHeight: 1.6 }}>
          Este é o template de sistema — sem customização de marca. Crie um novo template para editar cores, capa, cabeçalho e rodapé.
        </div>
      ) : (
        <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Accordion
            title="Cores e Tipografia"
            open={openSection === 'cores'}
            onToggle={() => setOpenSection('cores')}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ColorPicker label="Cor H1" value={theme.h1Color} status={h1Status} onChange={c => updateConfig('h1Color', c)} />
              <ColorPicker label="Cor H2" value={theme.h2Color} status={h2Status} onChange={c => updateConfig('h2Color', c)} />
              <ColorPicker label="Cor H3/H4" value={theme.h3Color} onChange={c => updateConfig('h3Color', c)} />
              <ColorPicker label="Cor dos Textos" value={theme.bodyColor} status={bodyStatus} onChange={c => updateConfig('bodyColor', c)} />
              <ColorPicker label="Cor Principal" value={theme.primaryColor} onChange={c => updateConfig('primaryColor', c)} />
              <ColorPicker label="Cor de Destaque" value={theme.accentColor} onChange={c => updateConfig('accentColor', c)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1', marginTop: 8 }}>
                <label style={{ fontSize: 12, color: t.fg2 }}>Estilo de Citação (Textos Explicativos)</label>
                <select
                  value={editingConfig.quoteStyle ?? theme.quoteStyle}
                  onChange={e => updateConfig('quoteStyle', e.target.value)}
                  style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '6px 8px', fontSize: 14, width: '100%', color: t.fg }}
                >
                  <option value="minimal">Minimalista (Apenas Itálico)</option>
                  <option value="subtle">Discreto (Fundo Translúcido)</option>
                  <option value="accented">Destaque (Com Borda Lateral)</option>
                </select>
              </div>
            </div>
          </Accordion>

          <Accordion
            title="Capa do Documento"
            open={openSection === 'capa'}
            onToggle={() => setOpenSection('capa')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Logo Principal (Capa)</label>
                <input type="file" accept="image/*" onChange={e => handleUploadLogo(e, 'logoUrl')} style={{ fontSize: 12, width: '100%', marginBottom: 8 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: t.fg2 }}>Ou usar texto:</span>
                  <input type="text" value={editingConfig.companyName ?? profile.consultant_name}
                    onChange={e => updateConfig('companyName', e.target.value)}
                    style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '75%', color: t.fg }}
                    placeholder="Nome da Marca" />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, color: t.fg2 }}>Escala do Logo (Tamanho)</label>
                  <span style={{ fontSize: 12, color: t.magenta, fontWeight: 600 }}>{theme.coverLogoScale}x</span>
                </div>
                <input
                  type="range" min="0.5" max="3.0" step="0.1"
                  value={theme.coverLogoScale}
                  onChange={e => updateConfig('coverLogoScale', parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>
          </Accordion>

          <Accordion
            title="Cabeçalho (Páginas)"
            open={openSection === 'cabecalho'}
            onToggle={() => setOpenSection('cabecalho')}
            rightSlot={
              <button
                onClick={e => { e.stopPropagation(); updateConfig('showHeader', !(editingConfig.showHeader ?? true)) }}
                title={(editingConfig.showHeader ?? true) ? 'Ocultar cabeçalho' : 'Mostrar cabeçalho'}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: (editingConfig.showHeader ?? true) ? t.gold : t.fg4 }}
              >
                {(editingConfig.showHeader ?? true) ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
              </button>
            }
          >
            {theme.showHeader && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Logo Menor (Esq.)</label>
                  <input type="file" accept="image/*" onChange={e => handleUploadLogo(e, 'headerLogoUrl')} style={{ fontSize: 12, width: '100%', marginBottom: 8 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto Lado Direito</label>
                  <input type="text" value={editingConfig.headerRightText ?? ''}
                    onChange={e => updateConfig('headerRightText', e.target.value)}
                    style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }}
                    placeholder="Ex: Nome do Cliente — Mapa" />
                </div>
              </div>
            )}
          </Accordion>

          <Accordion
            title="Rodapé (Todas Páginas)"
            open={openSection === 'rodape'}
            onToggle={() => setOpenSection('rodape')}
            rightSlot={
              <button
                onClick={e => { e.stopPropagation(); updateConfig('showFooter', !(editingConfig.showFooter ?? true)) }}
                title={(editingConfig.showFooter ?? true) ? 'Ocultar rodapé' : 'Mostrar rodapé'}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: (editingConfig.showFooter ?? true) ? t.gold : t.fg4 }}
              >
                {(editingConfig.showFooter ?? true) ? <EyeIcon size={16} /> : <EyeOffIcon size={16} />}
              </button>
            }
          >
            {theme.showFooter && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Layout do Rodapé</label>
                  <select
                    value={editingConfig.footerColumns ?? 3}
                    onChange={e => updateConfig('footerColumns', parseInt(e.target.value))}
                    style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg }}
                  >
                    <option value={1}>1 Espaço (Centralizado)</option>
                    <option value={2}>2 Espaços (Esq, Dir)</option>
                    <option value={3}>3 Espaços (Esq, Centro, Dir)</option>
                  </select>
                </div>
                {theme.footerColumns >= 1 && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto Esquerda (ou Único)</label>
                    <input type="text" value={editingConfig.footerLeft ?? theme.companyName} onChange={e => updateConfig('footerLeft', e.target.value)} style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }} />
                  </div>
                )}
                {theme.footerColumns >= 3 && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto Centro</label>
                    <input type="text" value={editingConfig.footerCenter ?? theme.companyContact} onChange={e => updateConfig('footerCenter', e.target.value)} style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }} />
                  </div>
                )}
                {theme.footerColumns >= 2 && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto Direita</label>
                    <input type="text" value={editingConfig.footerRight ?? ''} onChange={e => updateConfig('footerRight', e.target.value)} style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }} />
                  </div>
                )}
              </div>
            )}
          </Accordion>
        </div>
      )}
      </div>

      {/* Rodapé fixo (2026-07-12, 9ª rodada): "Voltar" é o padrão (sem
          destaque, largura cheia) — fecha o editor sem salvar. Com edição
          pendente (isDirty), "Salvar" aparece ao lado dividindo o espaço
          igualmente, e o botão da esquerda vira "Cancelar" (descarta via
          discardEdits, sem sair do editor). "Ver Preview" fica sempre
          visível no mobile. */}
      <div style={{
        flexShrink: 0,
        borderTop: `1px solid ${t.pb}`,
        padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SecondaryBtn
            onClick={isDirty ? discardEdits : closeEditor}
            style={{ padding: '10px', fontSize: 12, flex: 1, justifyContent: 'center' }}
          >
            {isDirty ? 'Cancelar' : 'Voltar'}
          </SecondaryBtn>
          {/* Padrão Vibraweb não tem campo editável — isDirty nunca fica true
              aqui, então esse slot fica sempre colapsado nesse caso. */}
          <div style={{
            flex: isDirty ? 1 : 0,
            maxWidth: isDirty ? '100%' : 0,
            opacity: isDirty ? 1 : 0,
            // overflowX só volta a "visible" quando já totalmente expandido —
            // sem isso o leve zoom do hover do botão ficava cortado nas
            // laterais.
            overflowY: 'hidden', overflowX: isDirty ? 'visible' : 'hidden',
            transition: 'flex 0.25s ease, max-width 0.25s ease, opacity 0.2s ease',
          }}>
            {/* Mesma medida do botão "+ Criar Novo Template" abaixo — padrão
                único pra qualquer botão dinâmico de Salvar no app. */}
            <PrimaryBtn onClick={handleSaveAndClose} disabled={saving || uploading} style={{ padding: '10px', fontSize: 12, width: '100%', justifyContent: 'center', whiteSpace: 'nowrap' }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </PrimaryBtn>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setMobilePreviewOpen(true)}
            style={{
              width: '100%', padding: '12px', background: 'transparent', border: `1px solid ${t.pb}`,
              borderRadius: 8, color: t.fg2, fontFamily: t.body, fontSize: 13, cursor: 'pointer',
            }}
          >
            Ver Preview
          </button>
        )}
      </div>
    </>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: t.night2, padding: 32, borderRadius: 12, width: 400, maxWidth: '90vw', border: `1px solid rgba(255,255,255,0.1)` }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 18, color: t.fg }}>Criar Novo Template</h2>
            <input
              type="text"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="Nome do Template"
              style={{ width: '100%', padding: '12px', background: t.night, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: t.fg, marginBottom: 24, fontSize: 14, boxSizing: 'border-box' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreateModalOpen(false)} style={modalBtnSecondary}>Cancelar</button>
              <button onClick={confirmCreateTemplate} disabled={!newTemplateName.trim()} style={{ ...modalBtnPrimary, opacity: !newTemplateName.trim() ? 0.5 : 1 }}>Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* Container único: lista de cards ↔ editor (mesmo espaço, troca com slide) */}
      <div style={{
        width: isMobile ? '100%' : COLUMN_WIDTH,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        borderRight: isMobile ? 'none' : `1px solid ${t.pb}`,
        borderBottom: isMobile ? `1px solid ${t.pb}` : 'none',
        maxHeight: isMobile ? 260 : 'none',
      }}>
        <div style={{
          position: isMobile ? 'static' : 'absolute', inset: 0,
          height: isMobile ? '100%' : undefined,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transform: (!isMobile && editingId) ? 'translateX(-100%)' : 'translateX(0)',
          opacity: (!isMobile && editingId) ? 0 : 1,
          transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s',
          pointerEvents: (!isMobile && editingId) ? 'none' : 'auto',
        }}>
          {(isMobile ? !editingId : true) && listView}
        </div>
        {!isMobile && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            background: t.night,
            transform: editingId ? 'translateX(0)' : 'translateX(100%)',
            opacity: editingId ? 1 : 0,
            transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s',
            pointerEvents: editingId ? 'auto' : 'none',
          }}>
            {editorView}
          </div>
        )}
        {isMobile && editingId && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {editorView}
          </div>
        )}
      </div>

      {/* Preview ao vivo — desktop, sempre ocupa o espaço que sobra */}
      {!isMobile && (
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {previewContent}
        </div>
      )}

      {/* Preview — mobile, tela cheia */}
      {isMobile && mobilePreviewOpen && (
        <div style={{ position: 'fixed', inset: 0, background: t.night, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          {previewContent}
        </div>
      )}
    </div>
  )
}

// ── Subcomponentes ──────────────────────────────────────────────────────────

const modalBtnPrimary: React.CSSProperties = {
  padding: '10px 20px', background: t.gradCta, color: t.ink, border: 'none',
  borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: t.body,
}
const modalBtnSecondary: React.CSSProperties = {
  padding: '10px 20px', background: 'transparent', color: t.fg2, border: `1px solid ${t.pb}`,
  borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: t.body,
}
const iconBtnStyle: React.CSSProperties = {
  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 6,
  color: '#D1D5DB', cursor: 'pointer', padding: 0, flexShrink: 0,
}

function TemplateCard({ label, isActive, isSelected, gradient, onSelect, onEdit, onActivate, onDelete, cardRef }: {
  label: string
  isActive: boolean
  isSelected: boolean
  gradient: string
  onSelect: () => void
  onEdit?: () => void
  onActivate?: () => void
  onDelete?: () => void
  cardRef?: (el: HTMLDivElement | null) => void
}) {
  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      style={{
        border: `1px solid ${isSelected ? t.magenta : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8, padding: 14,
        background: isSelected ? 'rgba(192, 57, 123, 0.05)' : t.night2,
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: gradient }} />

      {/* Check redondo — indica/seleciona qual é o padrão geral ativo */}
      <button
        onClick={e => { e.stopPropagation(); if (!isActive) onActivate?.() }}
        disabled={isActive}
        title={isActive ? 'Este é o padrão geral ativo' : 'Tornar este o padrão geral'}
        style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, padding: 0,
          border: `2px solid ${isActive ? t.gold : 'rgba(255,255,255,0.25)'}`,
          background: isActive ? t.gold : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isActive ? 'default' : 'pointer', marginLeft: 6,
        }}
      >
        {isActive && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a1310" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        )}
      </button>

      <h3 style={{
        margin: 0, fontSize: 13, fontWeight: 600, color: t.fg, lineHeight: 1.3,
        wordBreak: 'break-word', flex: 1, minWidth: 0,
      }}>
        {label}
      </h3>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        {onEdit && (
          <button onClick={e => { e.stopPropagation(); onEdit() }} title="Editar" style={iconBtnStyle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
          </button>
        )}
        {onDelete && (
          <button onClick={e => { e.stopPropagation(); onDelete() }} title="Excluir" style={{ ...iconBtnStyle, color: '#ff4d4d' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function Accordion({ title, open, onToggle, rightSlot, children }: {
  title: string
  open: boolean
  onToggle: () => void
  rightSlot?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={{ border: `1px solid ${t.pb}`, borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: t.magenta, fontFamily: t.body }}>
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {rightSlot}
          <span style={{ color: t.fg3, display: 'flex' }}><ChevronIcon open={open} size={12} /></span>
        </div>
      </button>
      {open && <div style={{ padding: 16 }}>{children}</div>}
    </div>
  )
}

function ColorPicker({ label, value, status, onChange }: {
  label: string
  value: string
  status?: 'ok' | 'atencao'
  onChange: (c: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <label style={{ fontSize: 12, color: t.fg2 }}>{label}</label>
        {status && (
          <span style={{
            fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 999, textTransform: 'uppercase',
            background: status === 'ok' ? 'rgba(46,163,106,.15)' : 'rgba(232,93,4,.15)',
            color: status === 'ok' ? t.success : t.coral,
          }}>
            {status === 'ok' ? 'AA — ok' : 'AA — atenção'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 32, height: 32, borderRadius: 4, cursor: 'pointer', background: 'transparent', border: 0, padding: 0 }} />
        <input type="text" value={value} onChange={e => onChange(e.target.value)}
          style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 12, width: 80, textTransform: 'uppercase', color: t.fg }} />
      </div>
    </div>
  )
}
