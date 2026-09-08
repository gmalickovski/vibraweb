import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PrimaryBtn, SecondaryBtn } from '../components/shared/Button'
import { TextInputIcon, TemplateIcon, SortBlocksIcon, CreditCardIcon, GlobalEditsIcon, RefreshIcon, InstallIcon } from '../components/shared/icons'
import { Sidebar } from '../components/app/Sidebar'
import { ShellHeaderProvider, TopBar, useShellHeaderActions } from '../components/app/TopBar'
import { BottomNav } from '../components/app/BottomNav'
import { useIsMobile } from '../lib/useIsMobile'
import { fetchUserProfile, fetchAdminPlans, fetchAdminInterpretations, fetchGlobalSettings, fetchGlobalTemplates, saveAdminPlan, saveAdminInterpretation, saveGlobalSetting, saveGlobalTemplate, deleteAdminPlan, deleteAdminInterpretation, deleteGlobalTemplate, type BillingPlan, type AdminInterpretation, type GlobalSetting, type GlobalTemplate } from '../lib/neon'
import { t } from '../lib/tokens'
import { usePwaInstall } from '../lib/pwa'
import AdminGlobalEditsPage from './AdminGlobalEditsPage'

type AdminSection = 'overview' | 'system-base' | 'texts' | 'plans' | 'templates' | 'settings'

const sectionMeta: Record<AdminSection, { label: string; description: string }> = {
  overview: { label: 'Visão geral', description: 'O pulso operacional do Vibraweb.' },
  'system-base': { label: 'Base do Sistema', description: 'Estilos, blocos e textos oficiais que sustentam todos os workspaces.' },
  texts: { label: 'Textos globais', description: 'A camada oficial de conteúdo usada pelos relatórios.' },
  plans: { label: 'Planos e cobrança', description: 'Catálogo comercial preparado para o Stripe.' },
  templates: { label: 'Templates globais', description: 'Modelos oficiais que servem de base aos consultores.' },
  settings: { label: 'Configurações', description: 'Ordem, identidade e parâmetros do produto.' },
}

function money(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((cents || 0) / 100)
}

function AdminGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    fetchUserProfile().then(profile => {
      if (!profile) {
        navigate('/login', { replace: true })
        return
      }
      setState(profile.role === 'admin' ? 'allowed' : 'denied')
    })
  }, [])

  if (state === 'loading') return <div className="admin-state">Carregando ambiente administrativo...</div>
  if (state === 'denied') {
    return (
      <div className="admin-state">
        <strong>Esta área é restrita.</strong>
        <span>Seu usuário não possui permissão administrativa.</span>
        <SecondaryBtn small onClick={() => navigate('/app/novo')}>Voltar ao workspace</SecondaryBtn>
      </div>
    )
  }
  return <>{children}</>
}

export default function AdminPage() {
  return <AdminGate><ShellHeaderProvider><AdminWorkspace /></ShellHeaderProvider></AdminGate>
}

function AdminWorkspace() {
  const navigate = useNavigate()
  const location = useLocation()
  // Até 900px prioriza toque e orientação vertical: a sidebar hover-only não
  // é confiável em tablets, Fold aberto estreito ou telas divididas.
  const isMobile = useIsMobile(900)
  const { canInstall, installed, install } = usePwaInstall()
  const [section, setSection] = useState<AdminSection>(() => sectionFromPath(window.location.pathname))
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (localStorage.getItem('vw-theme') as 'dark' | 'light') || 'dark')
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [texts, setTexts] = useState<AdminInterpretation[]>([])
  const [settings, setSettings] = useState<GlobalSetting[]>([])
  const [templates, setTemplates] = useState<GlobalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    const [nextPlans, nextTexts, nextSettings, nextTemplates] = await Promise.all([
      fetchAdminPlans(), fetchAdminInterpretations(), fetchGlobalSettings(), fetchGlobalTemplates(),
    ])
    setPlans(nextPlans); setTexts(nextTexts); setSettings(nextSettings); setTemplates(nextTemplates)
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [])

  useEffect(() => {
    setSection(sectionFromPath(location.pathname))
  }, [location.pathname])

  function changeSection(next: AdminSection) {
    setSection(next)
    navigate(next === 'overview' ? '/admin' : next === 'system-base' ? '/admin/base/visual' : `/admin/${next}`)
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('vw-theme', next)
  }

  function flash(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  const headerActions = useMemo(() => [
    {
      id: 'refresh',
      label: 'Atualizar dados',
      icon: <RefreshIcon size={16} />,
      onClick: reload,
      disabled: loading,
    },
    ...(canInstall && !installed ? [{
      id: 'install',
      label: 'Instalar app',
      icon: <InstallIcon size={16} />,
      onClick: () => { void install() },
      tone: 'accent' as const,
    }] : []),
  ], [canInstall, install, installed, loading, reload])
  useShellHeaderActions(headerActions)

  const adminContent = <>
        <header className="admin-header">
          <div>
            <p className="admin-kicker">VIBRAWEB / ADMIN</p>
            <h1>{sectionMeta[section].label}</h1>
            <p>{sectionMeta[section].description}</p>
          </div>
          {notice && <div className="admin-header-actions"><span className="admin-notice" role="status">{notice}</span></div>}
        </header>

        {loading ? <div className="admin-loading">Atualizando dados...</div> : (
          <div className="admin-content">
            {section === 'overview' && <Overview plans={plans} texts={texts} templates={templates} onNavigate={changeSection} />}
            {section === 'system-base' && <AdminGlobalEditsPage templates={templates} onChanged={item => setTemplates(current => current.some(row => row.id === item.id) ? current.map(row => row.id === item.id ? item : row) : [...current, item])} onActivated={item => setTemplates(current => current.map(row => row.id === item.id ? item : { ...row, is_active: false }))} />}
            {section === 'texts' && <TextsPanel items={texts} onSaved={item => { setTexts(current => current.some(row => row.id === item.id) ? current.map(row => row.id === item.id ? item : row) : [item, ...current]); flash('Texto global salvo.') }} onDeleted={id => { setTexts(current => current.filter(row => row.id !== id)); flash('Texto global removido.') }} />}
            {section === 'plans' && <PlansPanel items={plans} onSaved={item => { setPlans(current => current.some(row => row.id === item.id) ? current.map(row => row.id === item.id ? item : row) : [...current, item]); flash('Plano salvo.') }} onDeleted={id => { setPlans(current => current.filter(row => row.id !== id)); flash('Plano removido.') }} />}
            {section === 'templates' && <TemplatesPanel items={templates} onSaved={item => { setTemplates(current => current.some(row => row.id === item.id) ? current.map(row => row.id === item.id ? item : row) : [...current, item]); flash('Template global salvo.') }} onDeleted={id => { setTemplates(current => current.filter(row => row.id !== id)); flash('Template removido.') }} />}
            {section === 'settings' && <SettingsPanel items={settings} onSaved={item => { setSettings(current => current.some(row => row.id === item.id) ? current.map(row => row.id === item.id ? item : row) : [...current, item]); flash('Configuração salva.') }} />}
          </div>
        )}
  </>

  if (isMobile) {
    return (
      <div className="admin-shell admin-shell-mobile">
        <div className="admin-workspace-column">
          <TopBar consultantName="Vibraweb Admin" theme={theme} onToggleTheme={toggleTheme} />
          <main className="admin-main">{adminContent}</main>
        </div>
        <BottomNav mode="admin" />
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <Sidebar mode="admin" />
      <div className="admin-workspace-column">
        <TopBar consultantName="Vibraweb Admin" theme={theme} onToggleTheme={toggleTheme} />
        <main className="admin-main">{adminContent}</main>
      </div>
    </div>
  )
}

function sectionFromPath(pathname: string): AdminSection {
  const segment = pathname.split('/')[2]
  // Mantem URLs antigas funcionando para bookmarks ja salvos; toda navegacao
  // nova usa /admin/base, que comunica melhor a origem oficial da cascata.
  if (segment === 'base' || segment === 'edicoes-globais') return 'system-base'
  return segmentMetaKey(segment) ? segment : 'overview'
}

function segmentMetaKey(value: string | undefined): value is Exclude<AdminSection, 'system-base'> {
  return value === 'overview' || value === 'texts' || value === 'plans' || value === 'templates' || value === 'settings'
}

function Overview({ plans, texts, templates, onNavigate }: { plans: BillingPlan[]; texts: AdminInterpretation[]; templates: GlobalTemplate[]; onNavigate: (section: AdminSection) => void }) {
  const activePlans = plans.filter(plan => plan.status === 'active')
  return <>
    <section className="admin-kpi-grid">
      <Kpi label="Textos globais" value={texts.length.toString()} note="editáveis pelo admin" />
      <Kpi label="Planos cadastrados" value={plans.length.toString()} note={`${activePlans.length} publicado(s)`} />
      <Kpi label="Templates oficiais" value={templates.length.toString()} note={`${templates.filter(item => item.is_active).length} ativo(s)`} />
      <Kpi label="Métricas de acesso" value="Em preparação" note="eventos e receita entram na próxima etapa" />
    </section>
    <section className="admin-overview-grid">
      <div className="admin-panel admin-panel-large">
        <div className="admin-panel-heading"><div><h2>Centro de controle</h2><p>As decisões globais ficam aqui; cada consultor continua com seus próprios textos e templates.</p></div><span className="admin-live-dot">estrutura ativa</span></div>
        <div className="admin-roadmap">
          <RoadmapItem done title="Workspace separado por superfície" text="/app para consultores e /admin para operação interna." />
          <RoadmapItem done title="Catálogo comercial flexível" text="2 ou 3 planos podem ser publicados sem alterar o código." />
          <RoadmapItem title="Stripe e webhooks" text="Conectar os IDs e a confirmação de pagamento após criar o projeto no Studio MLK." />
          <RoadmapItem title="Eventos de produto" text="Registrar acessos, conversão, receita bruta e líquida para o dashboard." />
        </div>
      </div>
      <div className="admin-panel">
        <h2>Ações rápidas</h2>
        <div className="admin-quick-actions">
          <button onClick={() => onNavigate('system-base')}><GlobalEditsIcon size={18} /><span><strong>Base do Sistema</strong><small>Estilos, blocos e textos oficiais no mesmo lugar</small></span></button>
          <button onClick={() => onNavigate('plans')}><CreditCardIcon size={18} /><span><strong>Configurar planos</strong><small>Preços e IDs do Stripe</small></span></button>
          <button onClick={() => onNavigate('settings')}><SortBlocksIcon size={18} /><span><strong>Revisar configurações</strong><small>Parâmetros globais do produto</small></span></button>
        </div>
      </div>
    </section>
  </>
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="admin-kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>
}

function RoadmapItem({ done, title, text }: { done?: boolean; title: string; text: string }) {
  return <div className="admin-roadmap-item"><span className={`admin-roadmap-mark${done ? ' is-done' : ''}`}>{done ? '✓' : '·'}</span><div><strong>{title}</strong><p>{text}</p></div></div>
}

function TextsPanel({ items, onSaved, onDeleted }: { items: AdminInterpretation[]; onSaved: (item: AdminInterpretation) => void; onDeleted: (id: number) => void }) {
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<AdminInterpretation | null>(null)
  const filtered = useMemo(() => items.filter(item => `${item.tipo} ${item.titulo} ${item.texto}`.toLowerCase().includes(query.toLowerCase())), [items, query])
  return <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Textos globais do sistema</h2><p>Esta é a camada padrão. O consultor pode criar uma versão própria por cima sem alterar o texto oficial.</p></div><PrimaryBtn small onClick={() => setEditing({ id: 0, numero: 1, tipo: '', titulo: '', texto: '', created_at: '' })}>Novo texto</PrimaryBtn></div><div className="admin-toolbar"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar por tipo, título ou conteúdo" /></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Número</th><th>Tipo</th><th>Título</th><th>Conteúdo</th><th /></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td>{item.numero}</td><td><code>{item.tipo}</code></td><td>{item.titulo}</td><td className="admin-table-text">{item.texto.slice(0, 110)}{item.texto.length > 110 ? '...' : ''}</td><td><button className="admin-row-action" onClick={() => setEditing(item)}>Editar</button><button className="admin-row-action danger" onClick={async () => { if (window.confirm('Remover este texto global?')) { if (await deleteAdminInterpretation(item.id)) onDeleted(item.id) } }}>Excluir</button></td></tr>)}</tbody></table></div>{editing && <TextEditor value={editing} onClose={() => setEditing(null)} onSaved={item => { onSaved(item); setEditing(null) }} />}</section>
}

function TextEditor({ value, onClose, onSaved }: { value: AdminInterpretation; onClose: () => void; onSaved: (item: AdminInterpretation) => void }) {
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  return <div className="admin-editor"><div className="admin-editor-heading"><h3>{value.id ? 'Editar texto global' : 'Novo texto global'}</h3><button onClick={onClose} aria-label="Fechar editor">×</button></div><div className="admin-form-grid compact"><label>Número<input type="number" value={draft.numero} onChange={event => setDraft({ ...draft, numero: Number(event.target.value) })} /></label><label>Tipo<input value={draft.tipo} onChange={event => setDraft({ ...draft, tipo: event.target.value })} placeholder="ex: estatico_orientacao" /></label><label className="full">Título<input value={draft.titulo} onChange={event => setDraft({ ...draft, titulo: event.target.value })} /></label><label className="full">Texto<textarea rows={9} value={draft.texto} onChange={event => setDraft({ ...draft, texto: event.target.value })} /></label></div><div className="admin-editor-actions"><SecondaryBtn small onClick={onClose}>Cancelar</SecondaryBtn><PrimaryBtn small disabled={saving || !draft.tipo || !draft.titulo} onClick={async () => { setSaving(true); const saved = await saveAdminInterpretation(draft); setSaving(false); if (saved) onSaved(saved) }}>Salvar texto</PrimaryBtn></div></div>
}

function PlansPanel({ items, onSaved, onDeleted }: { items: BillingPlan[]; onSaved: (item: BillingPlan) => void; onDeleted: (id: string) => void }) {
  const [editing, setEditing] = useState<Partial<BillingPlan> | null>(null)
  return <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Catálogo comercial</h2><p>Cadastre quantos planos precisar. O status controla o que fica disponível para os usuários.</p></div><PrimaryBtn small onClick={() => setEditing({ slug: '', name: '', description: '', status: 'draft', monthly_price_cents: 0, annual_price_cents: 0, features: [], limits: {}, sort_order: items.length * 10 })}>Novo plano</PrimaryBtn></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Plano</th><th>Status</th><th>Mensal</th><th>Anual</th><th>Stripe</th><th /></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small className="admin-cell-sub">{item.slug}</small></td><td><span className={`admin-status status-${item.status}`}>{item.status}</span></td><td>{money(item.monthly_price_cents)}</td><td>{money(item.annual_price_cents)}</td><td>{item.stripe_product_id ? 'conectado' : 'pendente'}</td><td><button className="admin-row-action" onClick={() => setEditing(item)}>Editar</button><button className="admin-row-action danger" onClick={async () => { if (window.confirm('Remover este plano?')) { if (await deleteAdminPlan(item.id)) onDeleted(item.id) } }}>Excluir</button></td></tr>)}</tbody></table></div>{editing && <PlanEditor value={editing} onClose={() => setEditing(null)} onSaved={item => { onSaved(item); setEditing(null) }} />}</section>
}

function PlanEditor({ value, onClose, onSaved }: { value: Partial<BillingPlan>; onClose: () => void; onSaved: (item: BillingPlan) => void }) {
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const update = (key: string, value: unknown) => setDraft(current => ({ ...current, [key]: value }))
  return <div className="admin-editor"><div className="admin-editor-heading"><h3>{value.id ? 'Editar plano' : 'Novo plano'}</h3><button onClick={onClose} aria-label="Fechar editor">×</button></div><div className="admin-form-grid compact"><label>Slug<input value={draft.slug ?? ''} onChange={event => update('slug', event.target.value)} placeholder="ex: profissional" /></label><label>Nome<input value={draft.name ?? ''} onChange={event => update('name', event.target.value)} /></label><label>Status<select value={draft.status ?? 'draft'} onChange={event => update('status', event.target.value)}><option value="draft">Rascunho</option><option value="active">Ativo</option><option value="archived">Arquivado</option></select></label><label>Ordem<input type="number" value={draft.sort_order ?? 0} onChange={event => update('sort_order', Number(event.target.value))} /></label><label>Preço mensal (centavos)<input type="number" min="0" value={draft.monthly_price_cents ?? 0} onChange={event => update('monthly_price_cents', Number(event.target.value))} /></label><label>Preço anual (centavos)<input type="number" min="0" value={draft.annual_price_cents ?? 0} onChange={event => update('annual_price_cents', Number(event.target.value))} /></label><label className="full">Descrição<input value={draft.description ?? ''} onChange={event => update('description', event.target.value)} /></label><label>Stripe Product ID<input value={draft.stripe_product_id ?? ''} onChange={event => update('stripe_product_id', event.target.value || null)} placeholder="prod_..." /></label><label>Stripe Price mensal<input value={draft.stripe_monthly_price_id ?? ''} onChange={event => update('stripe_monthly_price_id', event.target.value || null)} placeholder="price_..." /></label><label>Stripe Price anual<input value={draft.stripe_annual_price_id ?? ''} onChange={event => update('stripe_annual_price_id', event.target.value || null)} placeholder="price_..." /></label></div><div className="admin-editor-actions"><SecondaryBtn small onClick={onClose}>Cancelar</SecondaryBtn><PrimaryBtn small disabled={saving || !draft.slug || !draft.name} onClick={async () => { setSaving(true); const saved = await saveAdminPlan({ ...draft, slug: draft.slug!, name: draft.name! }); setSaving(false); if (saved) onSaved(saved) }}>Salvar plano</PrimaryBtn></div></div>
}

function TemplatesPanel({ items, onSaved, onDeleted }: { items: GlobalTemplate[]; onSaved: (item: GlobalTemplate) => void; onDeleted: (id: string) => void }) {
  const [editing, setEditing] = useState<Partial<GlobalTemplate> | null>(null)
  return <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Templates globais</h2><p>Modelos oficiais do sistema. Os templates dos consultores continuam isolados no perfil de cada usuário.</p></div><PrimaryBtn small onClick={() => setEditing({ slug: '', name: '', description: '', template_type: 'report', config: {}, is_active: false, is_system: true, sort_order: items.length * 10 })}>Novo template</PrimaryBtn></div><div className="admin-template-grid">{items.map(item => <div className="admin-template-item" key={item.id}><div className="admin-template-preview"><span>V</span></div><div className="admin-template-info"><div><strong>{item.name}</strong><span className={`admin-status ${item.is_active ? 'status-active' : 'status-draft'}`}>{item.is_active ? 'ativo' : 'rascunho'}</span></div><small>{item.description || 'Sem descrição'}</small><div className="admin-template-actions"><button className="admin-row-action" onClick={() => setEditing(item)}>Editar</button>{!item.is_system && <button className="admin-row-action danger" onClick={async () => { if (window.confirm('Remover este template?')) { if (await deleteGlobalTemplate(item.id)) onDeleted(item.id) } }}>Excluir</button>}</div></div></div>)}</div>{editing && <TemplateEditor value={editing} onClose={() => setEditing(null)} onSaved={item => { onSaved(item); setEditing(null) }} />}</section>
}

function TemplateEditor({ value, onClose, onSaved }: { value: Partial<GlobalTemplate>; onClose: () => void; onSaved: (item: GlobalTemplate) => void }) {
  const [draft, setDraft] = useState(value)
  const [json, setJson] = useState(JSON.stringify(value.config ?? {}, null, 2))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  return <div className="admin-editor"><div className="admin-editor-heading"><h3>{value.id ? 'Editar template global' : 'Novo template global'}</h3><button onClick={onClose} aria-label="Fechar editor">×</button></div><div className="admin-form-grid compact"><label>Slug<input value={draft.slug ?? ''} onChange={event => setDraft({ ...draft, slug: event.target.value })} /></label><label>Nome<input value={draft.name ?? ''} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label><label className="full">Descrição<input value={draft.description ?? ''} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label><label>Tipo<select value={draft.template_type ?? 'report'} onChange={event => setDraft({ ...draft, template_type: event.target.value })}><option value="report">Relatório</option><option value="brand">Marca</option><option value="document">Documento</option></select></label><label>Ordem<input type="number" value={draft.sort_order ?? 0} onChange={event => setDraft({ ...draft, sort_order: Number(event.target.value) })} /></label><label className="admin-checkbox"><input type="checkbox" checked={draft.is_active ?? false} onChange={event => setDraft({ ...draft, is_active: event.target.checked })} /> Publicado para consultores</label><label className="full">Configuração JSON<textarea rows={8} value={json} onChange={event => { setJson(event.target.value); setError('') }} /></label></div>{error && <p className="admin-form-error">{error}</p>}<div className="admin-editor-actions"><SecondaryBtn small onClick={onClose}>Cancelar</SecondaryBtn><PrimaryBtn small disabled={saving || !draft.slug || !draft.name} onClick={async () => { try { const config = JSON.parse(json); setSaving(true); const saved = await saveGlobalTemplate({ ...draft, slug: draft.slug!, name: draft.name!, config }); setSaving(false); if (saved) onSaved(saved); else setError('Não foi possível salvar o template.') } catch { setError('A configuração precisa ser um JSON válido.') } }}>Salvar template</PrimaryBtn></div></div>
}

function SettingsPanel({ items, onSaved }: { items: GlobalSetting[]; onSaved: (item: GlobalSetting) => void }) {
  const [editing, setEditing] = useState<GlobalSetting | null>(null)
  const [json, setJson] = useState('')
  const [error, setError] = useState('')
  return <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Configurações globais</h2><p>O início da camada de ordem, design e parâmetros que será consumida pelo workspace.</p></div></div><div className="admin-settings-list">{items.map(item => <button key={item.id} onClick={() => { setEditing(item); setJson(JSON.stringify(item.value, null, 2)); setError('') }}><span><strong>{item.label}</strong><small>{item.category} · {item.setting_key}</small></span><span>Editar →</span></button>)}</div>{editing && <div className="admin-editor"><div className="admin-editor-heading"><h3>{editing.label}</h3><button onClick={() => setEditing(null)} aria-label="Fechar editor">×</button></div><p className="admin-editor-description">{editing.description}</p><textarea className="admin-json-editor" rows={13} value={json} onChange={event => { setJson(event.target.value); setError('') }} />{error && <p className="admin-form-error">{error}</p>}<div className="admin-editor-actions"><SecondaryBtn small onClick={() => setEditing(null)}>Cancelar</SecondaryBtn><PrimaryBtn small onClick={async () => { try { const saved = await saveGlobalSetting({ ...editing, value: JSON.parse(json) }); if (saved) { onSaved(saved); setEditing(null) } } catch { setError('A configuração precisa ser um JSON válido.') } }}>Salvar configuração</PrimaryBtn></div></div>}</section>
}
