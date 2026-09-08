import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { t } from '../lib/tokens'
import { Sidebar } from '../components/app/Sidebar'
import { InputPanel } from '../components/app/InputPanel'
import { OutputPanel } from '../components/app/OutputPanel'
import { ExportModal } from '../components/app/ExportModal'
import { SaveSuccessModal } from '../components/app/SaveSuccessModal'
import { SavedAnalyses } from '../components/app/SavedAnalyses'
import { CustomTexts } from '../components/app/CustomTexts'
import { PreviewPage, savePreviewPayload } from './PreviewPage'
import {
  fetchUserProfile, saveAnalysis, updateAnalysis, type UserProfile, type TextOverrides,
  overrideTexto, overrideVersoes, overrideData, TEXT_OVERRIDE_VERSION_CAP,
} from '../lib/neon'
import { calcPessoal } from '../lib/numerology'
import type { BlockOrderConfig } from '../lib/block-order'
import { VIBRAWEB_DEFAULTS } from '../lib/theme-resolver'

export type AnalysisTab = 'pessoal'

export interface AnalysisData {
  nome: string
  dob: string
  social: string
}

const defaultData: AnalysisData = {
  nome: '', dob: '', social: '',
}

interface Props {
  onLogout: () => void
}

export function AppPage({ onLogout }: Props) {
  const navigate = useNavigate()
  const [data, setData] = useState<AnalysisData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [savedMode, setSavedMode] = useState(false) // true when viewing a saved analysis
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [lastSavedId, setLastSavedId] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null)

  // Ajuste específico deste cliente (Fase 2, 2026-07-11) — texto por número,
  // ordem de blocos e (2026-07-12) template de marca. Seedado a partir do
  // padrão global do consultor; persistido em analyses.text_overrides /
  // analyses.block_order / analyses.template_id só quando este cliente é
  // salvo, nunca altera o padrão global (user_interpretations / user_profiles).
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [textOverrides, setTextOverrides] = useState<TextOverrides>({})
  const [clientBlockOrder, setClientBlockOrder] = useState<BlockOrderConfig | null>(null)
  const [clientTemplateId, setClientTemplateId] = useState<string | null>(null)

  const location = useLocation()

  // Reset form when navigating to /app/novo
  useEffect(() => {
    if (location.pathname === '/app/novo' || location.pathname === '/app') {
      setData(defaultData)
      setSavedMode(false)
      setSelectedSavedId(null)
      setAnalysisId(null)
      setTextOverrides({})
      setClientBlockOrder(null)
      setClientTemplateId(null)
    }
  }, [location.pathname])

  // Load consultant profile on mount
  useEffect(() => {
    fetchUserProfile().then(setProfile)
  }, [])

  const currentNums = useMemo(() => calcPessoal(data.nome, data.dob), [data])

  const currentSubject = useMemo(() => data.nome || '', [data])

  const isPro = profile?.plan === 'pro' || profile?.role === 'admin'

  // Lista de templates do consultor (mesma fonte que BrandPage.tsx) — usada
  // pelo seletor de template específico desta análise, em OutputPanel. O
  // gradient (mesma fórmula de BrandPage.tsx) alimenta a barra de cor do
  // seletor em formato card.
  const consultantTemplates = useMemo(
    () => ((profile?.brand_config?.templates ?? []) as any[]).map(tpl => ({
      id: tpl.id as string,
      name: tpl.name as string,
      gradient: `linear-gradient(to bottom, ${tpl.config?.primaryColor || VIBRAWEB_DEFAULTS.primaryColor}, ${tpl.config?.accentColor || VIBRAWEB_DEFAULTS.accentColor})`,
    })),
    [profile]
  )

  function templateName(id: string | null | undefined): string {
    if (!id || id === 'default') return 'Padrão Vibraweb'
    return consultantTemplates.find(tpl => tpl.id === id)?.name ?? 'Padrão Vibraweb'
  }

  // Nome do template ativo GLOBALMENTE (definido em /app/marca) — usado como
  // rótulo da opção "seguir padrão do sistema" no seletor.
  const globalTemplateName = templateName(profile?.brand_config?.activeTemplateId)

  // Nome do template que está EFETIVAMENTE valendo pra esta análise agora:
  // o override específico do cliente, se houver, senão o global.
  const effectiveTemplateName = clientTemplateId ? templateName(clientTemplateId) : globalTemplateName

  // Único escritor de text_overrides — todo Salvar/Restaurar do modal de
  // edição por análise passa aqui, que cuida do empilhamento de versões
  // (restauração não-destrutiva, estilo WordPress/Notion: o texto atual vai
  // pro histórico ANTES de ser substituído, nada se perde nunca).
  //   mode 'save'    → grava `texto` como override desta análise
  //   mode 'global'  → limpa o override (cascata revela o texto global do
  //                    consultor, senão o padrão do sistema)
  //   mode 'sistema' → limpa o override E força o padrão do sistema,
  //                    pulando o texto global (marcador `sistema: true`)
  function handleTextOverrideChange(numero: number, tipo: string, texto: string, mode: 'save' | 'global' | 'sistema' = 'save') {
    setTextOverrides(prev => {
      const cur = prev[numero]?.[tipo]
      const curTexto = overrideTexto(cur)
      const versoes = overrideVersoes(cur)
      const newTexto = mode === 'save' ? texto : ''
      // Empilha a versão atual só se havia texto próprio e ele de fato muda —
      // salvar o mesmo texto duas vezes não gera revisão duplicada.
      const newVersoes = (curTexto.trim() && curTexto !== newTexto
        ? [{ texto: curTexto, data: overrideData(cur) ?? new Date().toISOString() }, ...versoes]
        : versoes
      ).slice(0, TEXT_OVERRIDE_VERSION_CAP)
      return {
        ...prev,
        [numero]: {
          ...prev[numero],
          [tipo]: { texto: newTexto, data: new Date().toISOString(), sistema: mode === 'sistema', versoes: newVersoes },
        },
      }
    })
  }

  async function handleSave() {
    if (saving || !currentSubject) return
    setSaving(true)
    let id: string | null
    if (analysisId) {
      await updateAnalysis(analysisId, { text_overrides: textOverrides, template_id: clientTemplateId })
      id = analysisId
    } else {
      id = await saveAnalysis('pessoal', currentSubject, data, currentNums, textOverrides, clientBlockOrder, clientTemplateId)
    }
    setSaving(false)
    if (id) {
      setAnalysisId(id)
      setLastSavedId(id)
      setShowSaveModal(true)
    }
  }

  function handleEditSaved() {
    if (lastSavedId) {
      setSelectedSavedId(lastSavedId)
      setSavedMode(true)
      navigate('/app/salvos')
    }
    setShowSaveModal(false)
  }

  function handleNewAnalysis() {
    setData(defaultData)
    setSavedMode(false)
    setSelectedSavedId(null)
    setAnalysisId(null)
    setTextOverrides({})
    setClientBlockOrder(null)
    setClientTemplateId(null)
    setShowSaveModal(false)
  }

  // Passo unificado de preview (Fase 2, 2026-07-11; dividido em 2 destinos em
  // 2026-07-12): garante que a análise esteja salva/atualizada (cria se ainda
  // não existe, atualiza se já existe) antes de navegar, pra não perder os
  // ajustes de texto/ordem/template feitos até aqui.
  //   - "Reordenar Blocos" (target 'preview') → tela combinada de preview +
  //     organização de blocos (painel lateral, plano Pro).
  //   - "Gerar Análise" (target 'gerar') → tela cheia só de preview, com o
  //     botão flutuante "Gerar PDF" — sem painel de organização.
  async function goToPreview(target: 'preview' | 'gerar') {
    if (!currentSubject) return
    setSaving(true)
    let id = analysisId
    if (!id) {
      id = await saveAnalysis('pessoal', currentSubject, data, currentNums, textOverrides, clientBlockOrder, clientTemplateId)
      if (id) setAnalysisId(id)
    } else {
      await updateAnalysis(id, { text_overrides: textOverrides, template_id: clientTemplateId })
    }
    setSaving(false)

    savePreviewPayload({
      map: currentNums,
      tab: 'pessoal',
      subject: currentSubject,
      dataNascimento: data.dob,
      profile,
      analysisId: id,
      textOverrides,
      blockOrder: clientBlockOrder,
      templateId: clientTemplateId,
    })
    navigate(`/app/${target}`)
  }

  async function handlePreview() { await goToPreview('preview') }
  async function handleGenerate() { await goToPreview('gerar') }

  const consultantName = profile?.consultant_name ?? 'Vibraweb'
  const consultantContact = profile?.consultant_contact ?? 'vibraweb.com.br'

  return (
    <>
      {showSaveModal && (
        <SaveSuccessModal
          onEditSaved={handleEditSaved}
          onNewAnalysis={handleNewAnalysis}
        />
      )}
      <div className="vw-analysis-workspace" style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          <Routes>
            <Route path="salvos" element={
              <div className="vw-saved-analysis" style={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  width: savedMode ? 400 : '100%',
                  flexShrink: 0,
                  transition: 'width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)',
                  borderRight: savedMode ? `1px solid ${t.pb}` : 'none',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <SavedAnalyses
                    selectedId={selectedSavedId}
                    onLoad={(row) => {
                      setData(row.input_data)
                      setSelectedSavedId(row.id)
                      setSavedMode(true)
                      setAnalysisId(row.id)
                      setTextOverrides(row.text_overrides ?? {})
                      setClientBlockOrder(row.block_order ?? null)
                      setClientTemplateId(row.template_id ?? null)
                    }}
                  />
                </div>
                <div style={{
                  flex: savedMode ? 1 : 0,
                  width: savedMode ? 'auto' : 0,
                  transition: 'flex 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s',
                  opacity: savedMode ? 1 : 0,
                  overflow: 'hidden',
                  display: 'flex',
                  background: t.night
                }}>
                  <div style={{ width: '100%', minWidth: 0, display: 'flex' }}>
                    <OutputPanel
                      data={data}
                      consultantName={consultantName}
                      consultantContact={consultantContact}
                      savedMode={savedMode}
                      onNewAnalysis={() => { setSavedMode(false); setData(defaultData); navigate('/app/novo') }}
                      onDismiss={() => { setSavedMode(false); setSelectedSavedId(null); }}
                      onSave={undefined}
                      saving={false}
                      onPreview={handlePreview}
                      onGenerate={handleGenerate}
                      textOverrides={textOverrides}
                      onTextOverrideChange={handleTextOverrideChange}
                      isPro={isPro}
                      templateOptions={consultantTemplates}
                      templateOverride={clientTemplateId}
                      onTemplateOverrideChange={setClientTemplateId}
                      effectiveTemplateName={effectiveTemplateName}
                      globalTemplateName={globalTemplateName}
                    />
                  </div>
                </div>
              </div>
            } />
            <Route path="textos" element={<CustomTexts />} />
            <Route path="preview" element={<PreviewPage />} />
            <Route path="gerar" element={<PreviewPage mode="gerar" />} />
            <Route path="novo" element={
              <>
                <InputPanel data={data} setData={setData} tab="pessoal" setTab={() => {}} />
                <OutputPanel
                  data={data}
                  consultantName={consultantName}
                  consultantContact={consultantContact}
                  savedMode={false}
                  onNewAnalysis={undefined}
                  onSave={handleSave}
                  saving={saving}
                  onPreview={handlePreview}
                  onGenerate={handleGenerate}
                  textOverrides={textOverrides}
                  onTextOverrideChange={handleTextOverrideChange}
                  isPro={isPro}
                  templateOptions={consultantTemplates}
                  templateOverride={clientTemplateId}
                  onTemplateOverrideChange={setClientTemplateId}
                  effectiveTemplateName={effectiveTemplateName}
                  globalTemplateName={globalTemplateName}
                />
              </>
            } />
            <Route path="*" element={
              <>
                <InputPanel data={data} setData={setData} tab="pessoal" setTab={() => {}} />
                <OutputPanel
                  data={data}
                  consultantName={consultantName}
                  consultantContact={consultantContact}
                  savedMode={false}
                  onNewAnalysis={undefined}
                  onSave={handleSave}
                  saving={saving}
                  onPreview={handlePreview}
                  onGenerate={handleGenerate}
                  textOverrides={textOverrides}
                  onTextOverrideChange={handleTextOverrideChange}
                  isPro={isPro}
                  templateOptions={consultantTemplates}
                  templateOverride={clientTemplateId}
                  onTemplateOverrideChange={setClientTemplateId}
                  effectiveTemplateName={effectiveTemplateName}
                  globalTemplateName={globalTemplateName}
                />
              </>
            } />
          </Routes>
        </div>
    </>
  )
}
