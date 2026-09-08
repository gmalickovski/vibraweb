import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PrimaryBtn, SecondaryBtn } from '../components/shared/Button'
import { GlobalEditsIcon, SortBlocksIcon, TemplateIcon, TextInputIcon } from '../components/shared/icons'
import { CustomTexts, type TextsAdapter } from '../components/app/CustomTexts'
import { DocumentOrganizerView } from '../components/shared/DocumentOrganizerView'
import {
  fetchInterpretation,
  overrideTexto,
  activateGlobalTemplate,
  saveGlobalTemplate,
  type GlobalTemplate,
  type TextOverrides,
} from '../lib/neon'
import { DEFAULT_BLOCK_ORDER, normalizeBlockOrder, type BlockOrderConfig } from '../lib/block-order'
import { buildDocumentBlocks, buildTocEntriesFromPages } from '../lib/document-builder'
import { loadSampleClient, loadSampleInterpretations, type SampleIdentity } from '../lib/sample-preview'
import { useMeasuredPages } from '../lib/measure-document'
import { resolveDocTheme, VIBRAWEB_DEFAULTS, type ReportStyle } from '../lib/theme-resolver'
import type { NumerologyMap } from '../lib/numerology'
import type { UserProfile } from '../lib/neon'

type GlobalEditTab = 'visual' | 'blocos' | 'textos'

interface Props {
  templates: GlobalTemplate[]
  onChanged: (template: GlobalTemplate) => void
  onActivated?: (template: GlobalTemplate) => void
}

const TAB_META: Record<GlobalEditTab, { label: string; description: string }> = {
  visual: { label: 'Estilos', description: 'Cores, fontes e identidade visual oficial do sistema.' },
  blocos: { label: 'Blocos', description: 'Ordem, títulos e blocos oficiais dos relatórios.' },
  textos: { label: 'Textos', description: 'Textos oficiais que acompanham os blocos do sistema.' },
}

const FONT_OPTIONS = ['Poppins', 'Inter', 'Georgia', 'Arial', 'Montserrat', 'Cinzel', 'Cormorant Garamond', 'UnifrakturCook']

const STYLE_META: Record<ReportStyle, { label: string; description: string }> = {
  vibracao: { label: 'Vibração', description: 'O estilo padrão Vibraweb, com ondas e degradês de marca.' },
  modern: { label: 'Modern', description: 'Cards sólidos, cantos arredondados e linhas diretas.' },
  holistic: { label: 'Holístico', description: 'Ornamentos, roxo profundo e títulos clássicos.' },
  minimalist: { label: 'Minimalista', description: 'Hierarquia sóbria com detalhes discretos.' },
  default: { label: 'Default', description: 'Texto puro, preto no branco, sem decoração.' },
}

function tabFromPath(pathname: string): GlobalEditTab {
  const segment = pathname.split('/')[3]
  return segment === 'blocos' || segment === 'textos' ? segment : 'visual'
}

function freshTemplateConfig(): Record<string, unknown> {
  return {
    ...VIBRAWEB_DEFAULTS,
    blockOrder: DEFAULT_BLOCK_ORDER,
    textOverrides: {},
  }
}

export default function AdminGlobalEditsPage({ templates, onChanged, onActivated }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const tab = tabFromPath(location.pathname)
  const [selectedId, setSelectedId] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [createError, setCreateError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    if (!selectedId || !templates.some(template => template.id === selectedId)) {
      setSelectedId(templates.find(template => template.is_active)?.id ?? templates[0]?.id ?? '')
    }
  }, [templates, selectedId])

  const selected = templates.find(template => template.id === selectedId) ?? templates[0] ?? null

  const persistConfig = useCallback(async (config: Record<string, unknown>) => {
    if (!selected) return false
    setSaving(true)
    const saved = await saveGlobalTemplate({ ...selected, config })
    setSaving(false)
    if (!saved) return false
    onChanged(saved)
    return true
  }, [onChanged, selected])

  async function createTemplate() {
    const slug = newSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    if (!newName.trim() || !slug) {
      setCreateError('Informe um nome e um identificador válido.')
      return
    }
    setCreateError('')
    setSaving(true)
    const saved = await saveGlobalTemplate({
      slug,
      name: newName.trim(),
      description: 'Template global administrado pelo Vibraweb.',
      template_type: 'report',
      config: freshTemplateConfig(),
      is_active: templates.length === 0,
      is_system: true,
      sort_order: templates.length * 10 + 10,
    })
    setSaving(false)
    if (!saved) {
      setCreateError('Não foi possível criar o template. Verifique se o slug já existe.')
      return
    }
    onChanged(saved)
    setSelectedId(saved.id)
    setNewName('')
    setNewSlug('')
    setCreating(false)
    navigate('/admin/base/visual')
  }

  async function activateSelected() {
    if (!selected) return
    setActivating(true)
    const saved = await activateGlobalTemplate(selected.id)
    setActivating(false)
    if (saved) (onActivated ?? onChanged)(saved)
  }

  return (
    <div className="admin-global-edits">
      <div className="admin-global-toolbar">
        <div className="admin-global-template-select">
          <label htmlFor="admin-global-template">Estilo base</label>
          <select
            id="admin-global-template"
            value={selected?.id ?? ''}
            onChange={event => setSelectedId(event.target.value)}
            disabled={!templates.length}
          >
            {templates.map(template => <option key={template.id} value={template.id}>{template.name}{template.is_active ? ' · ativo' : ''}</option>)}
          </select>
        </div>
        <div className="admin-global-toolbar-actions">
          {selected && !selected.is_active && <SecondaryBtn small onClick={activateSelected} disabled={activating}>{activating ? 'Publicando...' : 'Publicar template'}</SecondaryBtn>}
          <SecondaryBtn small onClick={() => setCreating(open => !open)}>{creating ? 'Cancelar' : 'Novo template'}</SecondaryBtn>
        </div>
      </div>

      {creating && (
        <div className="admin-global-create admin-panel">
          <div>
            <h2>Criar estilo base</h2>
            <p>O novo estilo nasce como parte oficial do sistema, com Estilos, Blocos e Textos.</p>
          </div>
          <div className="admin-form-grid">
            <label>Nome<input value={newName} onChange={event => setNewName(event.target.value)} placeholder="ex: Vibra Essencial" /></label>
            <label>Slug<input value={newSlug} onChange={event => setNewSlug(event.target.value)} placeholder="vibra-essencial" /></label>
          </div>
          {createError && <p className="admin-form-error">{createError}</p>}
          <div className="admin-editor-actions"><PrimaryBtn small onClick={createTemplate} disabled={saving}>{saving ? 'Criando...' : 'Criar template'}</PrimaryBtn></div>
        </div>
      )}

      {selected ? (
        <>
          <div className="admin-global-tabs" role="tablist" aria-label="Base oficial do sistema">
            {(Object.keys(TAB_META) as GlobalEditTab[]).map(key => {
              const meta = TAB_META[key]
              const active = tab === key
              const Icon = key === 'visual' ? TemplateIcon : key === 'blocos' ? SortBlocksIcon : TextInputIcon
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={active}
                  className={active ? 'is-active' : ''}
                  onClick={() => navigate(`/admin/base/${key}`)}
                >
                  <Icon size={18} />
                  <span><strong>{meta.label}</strong><small>{meta.description}</small></span>
                </button>
              )
            })}
          </div>

          <div key={`${selected.id}-${tab}`} className="admin-global-edit-content">
            <div className="admin-global-edit-heading">
              <div><p className="admin-kicker"><GlobalEditsIcon size={13} /> BASE DO SISTEMA</p><h2>{selected.name} / {TAB_META[tab].label}</h2></div>
              {saving && <span className="admin-notice">Salvando...</span>}
            </div>
            {tab === 'visual' && <GlobalVisualEditor template={selected} onSave={persistConfig} />}
            {tab === 'blocos' && <GlobalBlocksEditor template={selected} onSave={persistConfig} />}
            {tab === 'textos' && <GlobalTextsEditor template={selected} onSave={persistConfig} />}
          </div>
        </>
      ) : (
        <div className="admin-state"><strong>Nenhum template global cadastrado.</strong><span>Crie o primeiro template para abrir as camadas de edição.</span></div>
      )}
    </div>
  )
}

function GlobalVisualEditor({ template, onSave }: { template: GlobalTemplate; onSave: (config: Record<string, unknown>) => Promise<boolean> }) {
  const [draft, setDraft] = useState<Record<string, unknown>>({})
  const [resetToSystem, setResetToSystem] = useState(false)
  const config = template.config ?? {}

  useEffect(() => {
    setDraft({
      stylePreset: config.stylePreset ?? VIBRAWEB_DEFAULTS.stylePreset,
      ornamentDividerKey: config.ornamentDividerKey ?? VIBRAWEB_DEFAULTS.ornamentDividerKey,
      ornamentColor: config.ornamentColor ?? VIBRAWEB_DEFAULTS.ornamentColor,
      primaryColor: config.primaryColor ?? VIBRAWEB_DEFAULTS.primaryColor,
      secondaryColor: config.secondaryColor ?? VIBRAWEB_DEFAULTS.secondaryColor,
      accentColor: config.accentColor ?? VIBRAWEB_DEFAULTS.accentColor,
      titleFont: config.titleFont ?? VIBRAWEB_DEFAULTS.titleFont,
      bodyFont: config.bodyFont ?? VIBRAWEB_DEFAULTS.bodyFont,
      logoUrl: config.logoUrl ?? VIBRAWEB_DEFAULTS.logoUrl,
      headerLogoUrl: config.headerLogoUrl ?? VIBRAWEB_DEFAULTS.headerLogoUrl,
      showHeader: config.showHeader ?? VIBRAWEB_DEFAULTS.showHeader,
      showFooter: config.showFooter ?? VIBRAWEB_DEFAULTS.showFooter,
      companyName: config.companyName ?? VIBRAWEB_DEFAULTS.companyName,
      companyContact: config.companyContact ?? VIBRAWEB_DEFAULTS.companyContact,
    })
    setResetToSystem(false)
  }, [template.id])

  const set = (key: string, value: unknown) => setDraft(current => ({ ...current, [key]: value }))
  const color = (key: string, fallback: string) => typeof draft[key] === 'string' ? String(draft[key]) : fallback
  const text = (key: string, fallback: string) => typeof draft[key] === 'string' ? String(draft[key]) : fallback
  const hasSystemCustomization = Object.entries({ ...config, ...draft }).some(([key, value]) => (
    key !== 'blockOrder' && key !== 'textOverrides'
      && JSON.stringify(value) !== JSON.stringify(VIBRAWEB_DEFAULTS[key as keyof typeof VIBRAWEB_DEFAULTS])
  ))

  async function save() {
    const preservedStructure = resetToSystem
      ? Object.fromEntries(Object.entries(config).filter(([key]) => key === 'blockOrder' || key === 'textOverrides'))
      : config
    const saved = await onSave({ ...preservedStructure, ...draft })
    if (saved) setResetToSystem(false)
  }

  function restoreSystemDefaults() {
    // No Admin, esta e a camada nascente: a restauracao nao herda de outra
    // configuracao, mas recompõe os defaults oficiais embarcados no produto.
    setDraft({ ...VIBRAWEB_DEFAULTS })
    setResetToSystem(true)
  }

  function applyPreset(preset: ReportStyle) {
    const values: Record<ReportStyle, Record<string, unknown>> = {
      vibracao: {
        stylePreset: 'vibracao', ornamentDividerKey: 'none', ornamentColor: '#2457C5',
        primaryColor: '#581C3C', secondaryColor: '#C0397B', accentColor: '#FDB813',
        titleFont: 'Poppins', bodyFont: 'Inter',
        h1Font: 'Poppins', h2Font: 'Poppins', h3Font: 'Poppins', h4Font: 'Poppins',
        h1Color: '#9A5A00', h1TextAlign: 'center', h2Color: '#C0397B', h3Color: '#C0397B', h4Color: '#4C2A68', bodyColor: '#352632',
        plainTextMode: false, quoteStyle: 'accented',
      },
      modern: {
        stylePreset: 'modern', ornamentDividerKey: 'none', ornamentColor: '#2457C5',
        primaryColor: '#581C3C', secondaryColor: '#C0397B', accentColor: '#FDB813',
        titleFont: 'Poppins', bodyFont: 'Inter',
        h1Font: 'Poppins', h2Font: 'Poppins', h3Font: 'Poppins', h4Font: 'Poppins',
        h1Color: '#581C3C', h1TextAlign: 'left', h2Color: '#581C3C', h3Color: '#C0397B', h4Color: '#4C2A68', bodyColor: '#352632',
        plainTextMode: false, quoteStyle: 'accented',
      },
      holistic: {
        stylePreset: 'holistic', ornamentDividerKey: 'flourish', ornamentColor: '#4C2A68',
        primaryColor: '#4C2A68', secondaryColor: '#2A173D', accentColor: '#72538A',
        titleFont: 'Cinzel', bodyFont: 'Lora',
        h1Font: 'Cinzel', h2Font: 'Cormorant Garamond', h3Font: 'Cormorant Garamond', h4Font: 'Cormorant Garamond',
        h1Color: '#8A5A00', h2Color: '#4C2A68', h3Color: '#4C2A68', h4Color: '#4C2A68', bodyColor: '#3F3547',
        plainTextMode: false, quoteStyle: 'subtle',
      },
      minimalist: {
        stylePreset: 'minimalist', ornamentDividerKey: 'line', ornamentColor: '#5F6368',
        primaryColor: '#34383D', secondaryColor: '#555B63', accentColor: '#8A9199',
        titleFont: 'Inter', bodyFont: 'Inter',
        h1Font: 'Inter', h2Font: 'Inter', h3Font: 'Inter', h4Font: 'Inter',
        h1Color: '#34383D', h2Color: '#34383D', h3Color: '#4A5057', h4Color: '#4A5057', bodyColor: '#3F444A',
        plainTextMode: true, quoteStyle: 'minimal',
      },
      default: {
        stylePreset: 'default', ornamentDividerKey: 'none', ornamentColor: '#111111',
        primaryColor: '#111111', secondaryColor: '#111111', accentColor: '#111111',
        titleFont: 'Arial', bodyFont: 'Arial',
        h1Font: 'Arial', h2Font: 'Arial', h3Font: 'Arial', h4Font: 'Arial',
        h1Color: '#111111', h2Color: '#111111', h3Color: '#111111', h4Color: '#111111', bodyColor: '#111111',
        plainTextMode: true, quoteStyle: 'minimal', showWatermark: false, showVibrawebBranding: false,
      },
    }
    setDraft(current => ({ ...current, ...values[preset] }))
  }

  return (
    <div className="admin-global-visual-grid">
      <section className="admin-panel admin-global-form">
        <div className="admin-panel-heading"><div><h3>Identidade do relatório</h3><p>As alterações ficam dentro deste template e servem como camada global para os consultores.</p></div></div>
        <div className="admin-global-style-picker">
          <div><strong>Estilo global</strong><small>Escolha uma base visual. As cores e fontes continuam editáveis abaixo.</small></div>
          <div className="admin-style-grid" role="listbox" aria-label="Estilos globais">
            {(Object.keys(STYLE_META) as ReportStyle[]).map(style => (
              <button key={style} type="button" className={`admin-style-option ${draft.stylePreset === style ? 'is-active' : ''}`} onClick={() => applyPreset(style)} role="option" aria-selected={draft.stylePreset === style}>
                <span className={`admin-style-swatch style-${style}`} aria-hidden="true" />
                <span><strong>{STYLE_META[style].label}</strong><small>{STYLE_META[style].description}</small></span>
              </button>
            ))}
          </div>
          <label className="admin-form-label">Divisor decorativo
            <select value={text('ornamentDividerKey', 'none')} onChange={event => set('ornamentDividerKey', event.target.value)}>
              <option value="none">Nenhum</option>
              <option value="flourish">Flourish clássico</option>
              <option value="line">Linha discreta</option>
            </select>
          </label>
        </div>
        <div className="admin-form-grid">
          <label>Cor principal<div className="admin-color-field"><input type="color" value={color('primaryColor', VIBRAWEB_DEFAULTS.primaryColor)} onChange={event => set('primaryColor', event.target.value)} /><input value={color('primaryColor', VIBRAWEB_DEFAULTS.primaryColor)} onChange={event => set('primaryColor', event.target.value)} /></div></label>
          <label>Cor secundária<div className="admin-color-field"><input type="color" value={color('secondaryColor', VIBRAWEB_DEFAULTS.secondaryColor)} onChange={event => set('secondaryColor', event.target.value)} /><input value={color('secondaryColor', VIBRAWEB_DEFAULTS.secondaryColor)} onChange={event => set('secondaryColor', event.target.value)} /></div></label>
          <label>Cor de destaque<div className="admin-color-field"><input type="color" value={color('accentColor', VIBRAWEB_DEFAULTS.accentColor)} onChange={event => set('accentColor', event.target.value)} /><input value={color('accentColor', VIBRAWEB_DEFAULTS.accentColor)} onChange={event => set('accentColor', event.target.value)} /></div></label>
          <label>Cor complementar<div className="admin-color-field"><input type="color" value={color('ornamentColor', VIBRAWEB_DEFAULTS.ornamentColor)} onChange={event => set('ornamentColor', event.target.value)} /><input value={color('ornamentColor', VIBRAWEB_DEFAULTS.ornamentColor)} onChange={event => set('ornamentColor', event.target.value)} /></div></label>
          <label>Fonte dos títulos<select value={text('titleFont', VIBRAWEB_DEFAULTS.titleFont)} onChange={event => set('titleFont', event.target.value)}>{FONT_OPTIONS.map(font => <option key={font}>{font}</option>)}</select></label>
          <label>Fonte do corpo<select value={text('bodyFont', VIBRAWEB_DEFAULTS.bodyFont)} onChange={event => set('bodyFont', event.target.value)}>{FONT_OPTIONS.map(font => <option key={font}>{font}</option>)}</select></label>
          <label>Logo padrão da capa<input value={text('logoUrl', VIBRAWEB_DEFAULTS.logoUrl ?? '')} onChange={event => set('logoUrl', event.target.value)} placeholder="/assets/logo-vibraweb.svg" /></label>
          <label>Logo padrão do cabeçalho<input value={text('headerLogoUrl', VIBRAWEB_DEFAULTS.headerLogoUrl ?? '')} onChange={event => set('headerLogoUrl', event.target.value)} placeholder="/assets/logo-vibraweb.svg" /></label>
          <label>Nome padrão<input value={text('companyName', VIBRAWEB_DEFAULTS.companyName)} onChange={event => set('companyName', event.target.value)} /></label>
          <label>Contato padrão<input value={text('companyContact', VIBRAWEB_DEFAULTS.companyContact)} onChange={event => set('companyContact', event.target.value)} /></label>
          <label className="admin-checkbox"><input type="checkbox" checked={Boolean(draft.showHeader)} onChange={event => set('showHeader', event.target.checked)} /> Exibir cabeçalho padrão</label>
          <label className="admin-checkbox"><input type="checkbox" checked={Boolean(draft.showFooter)} onChange={event => set('showFooter', event.target.checked)} /> Exibir rodapé padrão</label>
        </div>
        <div className="admin-editor-actions">
          {hasSystemCustomization && <SecondaryBtn small onClick={restoreSystemDefaults}>Restaurar padrão do sistema</SecondaryBtn>}
          <PrimaryBtn small onClick={save}>Salvar visual</PrimaryBtn>
        </div>
      </section>
      <section className="admin-panel admin-global-visual-preview">
        <span className="admin-kicker">PRÉVIA DA IDENTIDADE</span>
        <div className="admin-global-paper" style={{ borderColor: color('secondaryColor', VIBRAWEB_DEFAULTS.secondaryColor) }}>
          <div className="admin-global-paper-line" style={{ background: color('accentColor', VIBRAWEB_DEFAULTS.accentColor) }} />
          {draft.ornamentDividerKey === 'flourish' && <img className="admin-global-paper-ornament" src="/assets/ornament-flourish.svg" alt="" />}
          {text('logoUrl', VIBRAWEB_DEFAULTS.logoUrl ?? '') && <img src={text('logoUrl', VIBRAWEB_DEFAULTS.logoUrl ?? '')} alt="Logo padrão" style={{ width: 104, maxHeight: 30, objectFit: 'contain', objectPosition: 'left center', marginBottom: 10 }} />}
          <strong style={{ color: color('primaryColor', VIBRAWEB_DEFAULTS.primaryColor), fontFamily: text('titleFont', VIBRAWEB_DEFAULTS.titleFont) }}>{text('companyName', VIBRAWEB_DEFAULTS.companyName)}</strong>
          <h3 style={{ color: color('secondaryColor', VIBRAWEB_DEFAULTS.secondaryColor), fontFamily: text('titleFont', VIBRAWEB_DEFAULTS.titleFont) }}>Mapa Numerológico</h3>
          <p style={{ color: '#5d5560', fontFamily: text('bodyFont', VIBRAWEB_DEFAULTS.bodyFont) }}>A identidade visual deste template será usada como base para os relatórios globais.</p>
          <small style={{ color: color('accentColor', VIBRAWEB_DEFAULTS.accentColor) }}>{text('companyContact', VIBRAWEB_DEFAULTS.companyContact)}</small>
        </div>
      </section>
    </div>
  )
}

function GlobalBlocksEditor({ template, onSave }: { template: GlobalTemplate; onSave: (config: Record<string, unknown>) => Promise<boolean> }) {
  const [sampleIdentity, setSampleIdentity] = useState<SampleIdentity | null>(null)
  const [sampleMap, setSampleMap] = useState<NumerologyMap | null>(null)
  const [interp, setInterp] = useState<Awaited<ReturnType<typeof loadSampleInterpretations>> | null>(null)
  const [config, setConfig] = useState<BlockOrderConfig>(() => normalizeBlockOrder(template.config?.blockOrder))
  const [savedConfig, setSavedConfig] = useState<BlockOrderConfig>(() => normalizeBlockOrder(template.config?.blockOrder))

  useEffect(() => {
    setConfig(normalizeBlockOrder(template.config?.blockOrder))
    setSavedConfig(normalizeBlockOrder(template.config?.blockOrder))
  }, [template.id])

  useEffect(() => {
    let cancelled = false
    loadSampleClient().then(async ({ identity, map }) => {
      const nextInterp = await loadSampleInterpretations(map)
      if (!cancelled) { setSampleIdentity(identity); setSampleMap(map); setInterp(nextInterp) }
    })
    return () => { cancelled = true }
  }, [])

  const previewProfile: UserProfile = {
    id: 'global-template-preview', consultant_name: 'Vibraweb', consultant_contact: 'vibraweb.com.br',
    logo_url: null, plan: 'pro', role: 'admin', brand_config: { activeTemplateId: 'global', templates: [{ id: 'global', config: template.config ?? {} }] }, block_order: config,
  }
  const theme = useMemo(() => resolveDocTheme(previewProfile), [template, config])
  const ready = !!(sampleIdentity && sampleMap && interp)
  const blocks = useMemo(() => ready ? buildDocumentBlocks(sampleMap!, sampleIdentity!.subject, sampleIdentity!.dataNascimento, interp!, config) : [], [ready, sampleIdentity, sampleMap, interp, config])
  const pages = useMeasuredPages(blocks, theme)
  const tocEntries = useMemo(() => pages ? buildTocEntriesFromPages(config, pages) : undefined, [config, pages])

  async function save() {
    const ok = await onSave({ ...(template.config ?? {}), blockOrder: config })
    if (ok) setSavedConfig(config)
  }

  const hasSystemCustomization = JSON.stringify(config) !== JSON.stringify(DEFAULT_BLOCK_ORDER)

  if (!ready || !pages) return <div className="admin-global-loading">Montando prévia do relatório...</div>
  return (
    <div className="admin-global-document-editor">
      <DocumentOrganizerView
        theme={theme} blocks={blocks} pages={pages} tocEntries={tocEntries} subject={sampleIdentity!.subject} dataNascimento={sampleIdentity!.dataNascimento}
        isPro docTitle={`${sampleIdentity!.subject} — ${template.name}`} pageCount={pages.length + 1 + (tocEntries?.length ? 1 : 0)}
        config={config} onConfigChange={setConfig} panelTitle="Ordem dos Blocos" scope="admin"
        panelInfo="Defina a ordem e a visibilidade padrão que os templates globais entregarão aos consultores."
        isDirty={JSON.stringify(config) !== JSON.stringify(savedConfig)} saving={false} onSave={save}
        onFooterBack={() => setConfig(savedConfig)} onCancelEdit={() => setConfig(savedConfig)}
        footerExtra={hasSystemCustomization ? (
          <SecondaryBtn onClick={() => setConfig(DEFAULT_BLOCK_ORDER)} style={{ padding: '10px', fontSize: 12, flexShrink: 0 }}>
            Restaurar padrão do sistema
          </SecondaryBtn>
        ) : undefined}
      />
    </div>
  )
}

function GlobalTextsEditor({ template, onSave }: { template: GlobalTemplate; onSave: (config: Record<string, unknown>) => Promise<boolean> }) {
  const overrides = (template.config?.textOverrides ?? {}) as TextOverrides
  const persist = useCallback(async (next: TextOverrides) => onSave({ ...(template.config ?? {}), textOverrides: next }), [onSave, template])
  const adapter = useMemo<TextsAdapter>(() => ({
    async fetchEffective(numero, tipo) {
      const local = overrideTexto(overrides?.[numero]?.[tipo])
      if (local) return { texto: local, isOverridden: true }
      const row = await fetchInterpretation(numero, tipo)
      return row ? { texto: row.texto, isOverridden: false } : null
    },
    async saveOverride(numero, tipo, texto) {
      const byNumero = { ...(overrides[numero] ?? {}) }
      if (texto === null) delete byNumero[tipo]
      else byNumero[tipo] = texto
      const next = { ...overrides }
      if (Object.keys(byNumero).length) next[numero] = byNumero
      else delete next[numero]
      if (!(await persist(next))) throw new Error('Não foi possível salvar o texto global.')
    },
    async listOverrideKeys() {
      return Object.entries(overrides).flatMap(([numero, values]) => Object.keys(values ?? {}).map(tipo => ({ numero: Number(numero), tipo })))
    },
    async clearAllOverrides() { await persist({}) },
  }), [overrides, persist])

  return <div className="admin-global-text-editor"><CustomTexts adapter={adapter} scope="admin" title={`Textos — ${template.name}`} info="Cada texto salvo nesta camada é a nascente do template publicado. Workspaces, modelos e análises podem sobrescrever pontualmente sem alterar esta base." restoreTargetLabel="ao texto padrão do sistema" /></div>
}
