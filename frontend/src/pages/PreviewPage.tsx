// PreviewPage.tsx — 2 destinos que compartilham a mesma casca visual
// (Guilherme, 2026-07-12):
//   - mode="organizar" (rota /app/preview, botão "Reordenar Blocos") — tela
//     combinada de preview + painel de organização de blocos (Pro).
//   - mode="gerar" (rota /app/gerar, botão "Gerar Análise") — tela cheia só
//     de preview (sem painel, mesmo pra Pro), com o CTA "Gerar PDF" em
//     destaque na barra flutuante.
import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildDocumentBlocks, splitIntoPages, NUMERIC_INTERP_KEYS, STATIC_TEXT_KEYS, type InterpretationMap } from '../lib/document-builder'
import { normalizeBlockOrder, DEFAULT_BLOCK_ORDER, type BlockOrderConfig } from '../lib/block-order'
import { resolveDocTheme } from '../lib/theme-resolver'
import { fetchInterpretation, fetchUserProfile, updateAnalysis, type TextOverrides } from '../lib/supabase'
import { DocumentOrganizerView } from '../components/shared/DocumentOrganizerView'
import { PrimaryBtn } from '../components/shared/Button'
import { printDocument } from '../lib/print-document'
import type { NumerologyMap } from '../lib/numerology'
import type { UserProfile } from '../lib/supabase'
import type { AnalysisTab } from './AppPage'
import { t } from '../lib/tokens'

const SESSION_KEY = 'vw-preview-payload'

export interface PreviewPayload {
  map: NumerologyMap
  tab: AnalysisTab
  subject: string
  dataNascimento: string
  profile: UserProfile | null
  analysisId?: string | null
  textOverrides?: TextOverrides | null
  blockOrder?: BlockOrderConfig | null
  // Override de template específico deste cliente (2026-07-12, ver migration
  // 016) — null/ausente = segue o template ativo global do consultor.
  templateId?: string | null
}

export function savePreviewPayload(payload: PreviewPayload) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

interface Props {
  mode?: 'organizar' | 'gerar'
}

export function PreviewPage({ mode = 'organizar' }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<PreviewPayload | null>(null)
  const [interp, setInterp] = useState<InterpretationMap>({})

  // `config` = edição local em andamento; `savedConfig` = último valor
  // persistido em analyses.block_order (referência pra saber se há mudança
  // não salva). Ajuste 2026-07-12 (8ª rodada): parou de salvar
  // automaticamente a cada mudança — segue o mesmo padrão de BlocosPage.tsx.
  const [config, setConfig] = useState<BlockOrderConfig>(DEFAULT_BLOCK_ORDER)
  const [savedConfig, setSavedConfig] = useState<BlockOrderConfig>(DEFAULT_BLOCK_ORDER)
  const [savingOrder, setSavingOrder] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) { navigate('/app/novo'); return }
    const p: PreviewPayload = JSON.parse(raw)
    setPayload(p)
    const normalized = normalizeBlockOrder(p.blockOrder ?? p.profile?.block_order)
    setConfig(normalized)
    setSavedConfig(normalized)

    async function loadInterps() {
      const entries = await Promise.all(
        NUMERIC_INTERP_KEYS.map(async ({ mapKey, tipoSuffix }) => {
          const numero = (p.map as any)[mapKey]
          if (numero === null || numero === undefined) return null
          const fullKey = `${p.tab}_${tipoSuffix}`
          // Override específico deste cliente (editado inline em OutputPanel,
          // persistido em analyses.text_overrides) tem prioridade sobre o
          // texto padrão/global do Supabase.
          const overrideTexto = p.textOverrides?.[numero]?.[fullKey]
          if (overrideTexto) return { key: fullKey, titulo: 'Personalizado', texto: overrideTexto }
          const row = await fetchInterpretation(numero, fullKey)
          return row ? { key: fullKey, titulo: row.titulo, texto: row.texto } : null
        })
      )
      // Textos estáticos (Orientação/Importante/Resumo/Conclusão + introdução
      // de cada categoria) — chave fixa, numero=1, sem override por cliente
      // (só existem editáveis em "Textos", nunca em OutputPanel). Faltava
      // completamente aqui antes: o documento gerado nunca mostrava nenhuma
      // introdução de categoria nem os textos gerais, mesmo já configurados.
      const staticEntries = await Promise.all(
        STATIC_TEXT_KEYS.map(async key => {
          const row = await fetchInterpretation(1, key)
          return row ? { key, titulo: row.titulo, texto: row.texto } : null
        })
      )
      const licoesEntries = await Promise.all(
        (p.map.licoesCarmicas || []).map(async (v) => {
          const fullKey = `${p.tab}_licao_carmica`
          const overrideTexto = p.textOverrides?.[v]?.[fullKey]
          if (overrideTexto) return { key: `${fullKey}_${v}`, titulo: 'Personalizado', texto: overrideTexto }
          const row = await fetchInterpretation(v, fullKey)
          return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
        })
      )
      const debitosEntries = await Promise.all(
        (p.map.debitosCarmicos || []).map(async (v) => {
          const fullKey = `${p.tab}_debito_carmica`
          const overrideTexto = p.textOverrides?.[v]?.[fullKey]
          if (overrideTexto) return { key: `${fullKey}_${v}`, titulo: 'Personalizado', texto: overrideTexto }
          const row = await fetchInterpretation(v, fullKey)
          return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
        })
      )
      const tendenciasEntries = await Promise.all(
        (p.map.tendenciasOcultas || []).map(async (v) => {
          const fullKey = `${p.tab}_tendenciaOculta`
          const overrideTexto = p.textOverrides?.[v]?.[fullKey]
          if (overrideTexto) return { key: `${fullKey}_${v}`, titulo: 'Personalizado', texto: overrideTexto }
          const row = await fetchInterpretation(v, fullKey)
          return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
        })
      )

      const ciclosEntries = await Promise.all(
        (p.map.ciclosDeVida || []).map(async (c) => {
          const fullKey = `${p.tab}_ciclo`
          const overrideTexto = p.textOverrides?.[c.regente]?.[fullKey]
          if (overrideTexto) return { key: `${fullKey}_${c.regente}`, titulo: 'Personalizado', texto: overrideTexto }
          const row = await fetchInterpretation(c.regente, fullKey)
          return row ? { key: `${fullKey}_${c.regente}`, titulo: row.titulo, texto: row.texto } : null
        })
      )
      const desafiosList = p.map.desafios
        ? [p.map.desafios.desafio1, p.map.desafios.desafio2, p.map.desafios.desafioPrincipal]
        : []
      const desafiosEntries = await Promise.all(
        desafiosList.map(async (v) => {
          const fullKey = `${p.tab}_desafio`
          const overrideTexto = p.textOverrides?.[v]?.[fullKey]
          if (overrideTexto) return { key: `${fullKey}_${v}`, titulo: 'Personalizado', texto: overrideTexto }
          const row = await fetchInterpretation(v, fullKey)
          return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
        })
      )
      const momentosList = p.map.momentosDecisivos
        ? [p.map.momentosDecisivos.momento1, p.map.momentosDecisivos.momento2, p.map.momentosDecisivos.momento3, p.map.momentosDecisivos.momento4]
        : []
      const momentosEntries = await Promise.all(
        momentosList.map(async (v) => {
          const fullKey = `${p.tab}_momentoDecisivo`
          const overrideTexto = p.textOverrides?.[v]?.[fullKey]
          if (overrideTexto) return { key: `${fullKey}_${v}`, titulo: 'Personalizado', texto: overrideTexto }
          const row = await fetchInterpretation(v, fullKey)
          return row ? { key: `${fullKey}_${v}`, titulo: row.titulo, texto: row.texto } : null
        })
      )

      const map: InterpretationMap = {}
      entries.forEach(e => { if (e) map[e.key] = { titulo: e.titulo, texto: e.texto } })
      staticEntries.forEach(e => { if (e) map[e.key] = { titulo: e.titulo, texto: e.texto } })
      licoesEntries.forEach(e => { if (e) map[e.key] = { titulo: e.titulo, texto: e.texto } })
      debitosEntries.forEach(e => { if (e) map[e.key] = { titulo: e.titulo, texto: e.texto } })
      tendenciasEntries.forEach(e => { if (e) map[e.key] = { titulo: e.titulo, texto: e.texto } })
      ciclosEntries.forEach(e => { if (e) map[`${p.tab}_ciclo_${e.key.split('_').pop()}`] = { titulo: e.titulo, texto: e.texto } })
      desafiosEntries.forEach(e => { if (e) map[`${p.tab}_desafio_${e.key.split('_').pop()}`] = { titulo: e.titulo, texto: e.texto } })
      momentosEntries.forEach(e => { if (e) map[`${p.tab}_momentoDecisivo_${e.key.split('_').pop()}`] = { titulo: e.titulo, texto: e.texto } })

      setInterp(map)
      setLoading(false)
    }
    loadInterps()
  }, [navigate])

  const isDirty = JSON.stringify(config) !== JSON.stringify(savedConfig)

  // Salvar aqui grava a ordem só para ESTE cliente/análise (analyses.block_order)
  // — se o usuário não mexer em nada, o mapa continua seguindo o padrão global
  // configurado em "Blocos" (Personalização Geral). Depois de salvar, volta
  // para a tela anterior (o mapa com os números), pois esse é só um passo de
  // organização, não uma tela final (2026-07-12, pedido do Guilherme).
  const handleSaveOrder = useCallback(async () => {
    if (!payload?.analysisId) return
    setSavingOrder(true)
    await updateAnalysis(payload.analysisId, { block_order: config })
    setSavedConfig(config)
    setSavingOrder(false)
    navigate(-1)
  }, [payload, config, navigate])

  if (loading || !payload) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: t.fg2 }}>
        Montando documento...
      </div>
    )
  }

  // Override de template desta análise (2026-07-12): quando presente, resolve
  // o tema a partir de um profile "mockado" com esse template forçado como
  // ativo — igual ao truque já usado em BrandPage.tsx pro preview ao vivo do
  // editor — sem alterar o template ativo global do consultor.
  const effectiveProfile = payload.templateId
    ? {
        ...(payload.profile as UserProfile),
        brand_config: { ...(payload.profile?.brand_config ?? {}), activeTemplateId: payload.templateId },
      }
    : payload.profile

  const theme = resolveDocTheme(effectiveProfile)
  const isPro = payload.profile?.plan === 'pro' || payload.profile?.role === 'admin'
  const showPanel = isPro && mode === 'organizar'
  const effectiveOrder = isPro ? config : normalizeBlockOrder(payload.profile?.block_order)
  const blocks = buildDocumentBlocks(payload.map, payload.subject, payload.dataNascimento, interp, effectiveOrder)
  const pageCount = splitIntoPages(blocks).length + 1
  const docSubject = `${payload.subject} — Mapa Pessoal`

  return (
    <DocumentOrganizerView
      theme={theme}
      blocks={blocks}
      subject={payload.subject}
      dataNascimento={payload.dataNascimento}
      isPro={isPro}
      docTitle={docSubject}
      pageCount={pageCount}
      onBack={() => navigate(-1)}
      config={showPanel ? config : undefined}
      onConfigChange={showPanel ? setConfig : undefined}
      panelTitle="Organizar Blocos deste Cliente"
      panelInfo={`Vale só para ${payload.subject}. Não muda o seu padrão em "Blocos".`}
      isDirty={showPanel ? isDirty : undefined}
      saving={savingOrder}
      onSave={showPanel ? handleSaveOrder : undefined}
      onFooterBack={showPanel ? () => navigate(-1) : undefined}
      onCancelEdit={showPanel ? () => setConfig(savedConfig) : undefined}
      // Botão de PDF só existe no modo "gerar" (rota /app/gerar) — no modo
      // "organizar" essa barra não precisa de ação de exportação, já que o
      // Salvar dinâmico do painel à esquerda é a única ação desta tela.
      rightActions={
        mode === 'gerar' ? (
          <PrimaryBtn onClick={() => printDocument(docSubject, theme)} style={{ padding: '10px 20px', fontSize: 12 }}>
            Gerar PDF
          </PrimaryBtn>
        ) : undefined
      }
    />
  )
}
