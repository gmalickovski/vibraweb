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

import { useState, useEffect, useMemo, useRef, useLayoutEffect, type SelectHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchUserProfile, fetchGlobalTemplates, updateUserProfile, uploadBrandLogo, fetchInterpretation, overrideTexto } from '../lib/neon'
import type { UserProfile, TextOverrides } from '../lib/neon'
import { resizeImageForLogo } from '../lib/image-resize'
import { CustomTexts, type TextsAdapter } from '../components/app/CustomTexts'
import { VIBRAWEB_DEFAULTS, resolveDocTheme, wcagStatus, COVER_FONT_OPTIONS, type DocTheme, type HorizontalAlign, type VerticalAlign, type WcagStatus } from '../lib/theme-resolver'
import { buildDocumentBlocks, buildTocEntriesFromPages } from '../lib/document-builder'
import { useMeasuredPages } from '../lib/measure-document'
import type { InterpretationMap } from '../lib/document-builder'
import { DEFAULT_BLOCK_ORDER, getBlockTextTarget, normalizeBlockOrder, type BlockOrderConfig } from '../lib/block-order'
import { loadSampleClient, loadSampleInterpretations, type SampleIdentity } from '../lib/sample-preview'
import type { NumerologyMap } from '../lib/numerology'
import { PrimaryBtn, SecondaryBtn } from '../components/shared/Button'
import { PageTitle } from '../components/shared/PageTitle'
import { DocumentOrganizerView } from '../components/shared/DocumentOrganizerView'
import { EyeIcon, EyeOffIcon, ChevronIcon, BoldIcon, ItalicIcon, UnderlineIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon, InfoIcon, CheckIcon } from '../components/shared/icons'
import { LogoPositionModal } from '../components/app/LogoPositionModal'
import { useConfirm } from '../components/shared/ConfirmDialog'
import { useIsMobile } from '../lib/useIsMobile'
import { t } from '../lib/tokens'
import { useShellHeaderActions } from '../components/app/TopBar'
import { ExpandablePanel } from '../components/shared/ExpandablePanel'

const DOC_BACKGROUND = '#FFFFFF' // fundo do documento — sempre claro, não segue dark mode
// Coluna de edição precisa comportar controles em duas colunas sem criar
// respiro desperdiçado: preserva uma área confortável para o preview ao lado.
const COLUMN_WIDTH = 440
const panelTitleStyle = {
  fontSize: 13, fontWeight: 700, textTransform: 'uppercase' as const,
  letterSpacing: '.05em', color: t.magenta, fontFamily: t.body,
}
const NEW_TEMPLATE_ID = 'novo'
const SYSTEM_TEMPLATE_PREFIX = 'sistema:'

const systemTemplateId = (slug: string) => `${SYSTEM_TEMPLATE_PREFIX}${slug}`
const isSystemTemplateId = (id: string | null) => !!id && id.startsWith(SYSTEM_TEMPLATE_PREFIX)

function visualConfigOnly(config: Record<string, any> | null | undefined): Record<string, any> {
  const { blockOrder: _blockOrder, textOverrides: _textOverrides, ...visual } = config ?? {}
  return visual
}
const cloneConfig = <T,>(config: T): T => JSON.parse(JSON.stringify(config ?? {})) as T

// Toggle de nível superior do editor visual (2026-07-28, Guilherme: "vamos
// separar o sistema por toggle de: Capa, Corpo/Conteúdo, Cabeçalho e
// Rodapé"). "Corpo do Documento" herda o que antes era o accordion "Cores e
// Tipografia" (estiliza o conteúdo das páginas internas). Cabeçalho/Rodapé
// mantêm o conteúdo de antes, só migrando de accordion pra aba própria.
//
// "o toggle é SÓ na primeira divisão — depois de abrir a primeira divisão,
// abre uma janela inteira separada por subtítulo e linhas divisórias e
// espaçamentos" (Guilherme, correção 2026-07-28, depois de eu ter feito
// Cabeçalho da Capa/Logo/Título/Cliente E Fonte/Posição como accordions
// aninhados): só o NÍVEL 1 (`TopTab`) é expansível. Tudo dentro
// dele (Cabeçalho da Capa/Logo/Título/Nome do Cliente, e dentro de cada um,
// Fonte/Posição) é conteúdo ESTÁTICO, sempre visível, organizado só com
// `Section`/`SubSection` (subtítulo + linha divisória + espaçamento — ver
// componentes no fim do arquivo) — sem estado de toggle nenhum.
//
// "Estilos" (2026-07-29, Guilherme: "vamos criar mais um card separador
// principal no início... onde vou criar predefinições do sistema... aos
// poucos vou adicionando outros estilos predefinidos que o usuário pode
// usar pra suas próprias personalizações como base") — 1ª aba, ANTES de
// Capa. Uma galeria de PRESETS (`STYLE_PRESETS`, mais abaixo no arquivo):
// cada um aplica um conjunto de campos de uma vez (via `updateConfig` em
// lote), servindo de ponto de partida pra depois ajustar manualmente nas
// outras abas — não substitui Capa/Corpo/Cabeçalho/Rodapé, só preenche eles.
type TopTab = 'estilos' | 'capa' | 'corpo' | 'cabecalho' | 'rodape' | null

// Aba de nível superior dentro do editor de um modelo — Visual (o que já
// existia) + Blocos e Textos (2026-07-27: personalização de ordenação e de
// textos POR MODELO, ver feature-modelos-de-mapa.md). Navegada pela SIDEBAR
// (gaveta Visual/Blocos/Textos, mesmo padrão de "Alterações Globais"), não
// por abas no topo da página.
type EditorTab = 'visual' | 'blocos' | 'textos'

interface TemplateItem {
  id: string
  name: string
  kind: 'system' | 'personal'
  isSystemDefault: boolean
  gradient: string
  config: Record<string, any>
}

function createSystemSelection(item: TemplateItem) {
  return {
    id: item.id,
    name: item.name,
    config: cloneConfig(item.config),
    systemTemplateSlug: item.id.replace(SYSTEM_TEMPLATE_PREFIX, ''),
  }
}

/** Predefinições da aba "Estilos" — cada uma é só um LOTE de campos de
 *  `brand_config` aplicado de uma vez (`applyPreset`, dentro do
 *  componente), servindo de ponto de partida. Guilherme: "aos poucos vou
 *  adicionando outros estilos predefinidos" — a lista cresce aqui, sem
 *  mexer no resto do editor.
 *
 *  "Vibraweb" = o visual padrão do sistema (cards/badges nos números,
 *  cores de marca) — aplica os mesmos valores de `VIBRAWEB_DEFAULTS`.
 *  "Texto Puro" = só texto preto, sem nenhum elemento visual de card —
 *  por ora só zera as CORES pra preto; a parte de "sem cards/badges" ainda
 *  não existe como opção (precisaria de um novo modo de renderização em
 *  `DocumentBlock.tsx`, fora de escopo por enquanto — Guilherme disse que
 *  vai "aos poucos" refinando isso). */
interface StylePreset {
  id: string
  name: string
  description: string
  apply: Record<string, any>
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'vibracao',
    name: 'Vibração',
    description: 'O estilo padrão do sistema — cores de marca Vibraweb, Poppins nos títulos e Inter no corpo.',
    apply: {
      stylePreset: 'vibracao',
      // Cores
      primaryColor: VIBRAWEB_DEFAULTS.primaryColor,
      secondaryColor: VIBRAWEB_DEFAULTS.secondaryColor,
      accentColor: VIBRAWEB_DEFAULTS.accentColor,
      ornamentColor: VIBRAWEB_DEFAULTS.ornamentColor,
      h1Color: VIBRAWEB_DEFAULTS.h1Color,
      h2Color: VIBRAWEB_DEFAULTS.h2Color,
      h3Color: VIBRAWEB_DEFAULTS.h3Color,
      h4Color: VIBRAWEB_DEFAULTS.h4Color,
      bodyColor: VIBRAWEB_DEFAULTS.bodyColor,
      titleColor: VIBRAWEB_DEFAULTS.titleColor,
      clientColor: VIBRAWEB_DEFAULTS.clientColor,
      logoTextColor: VIBRAWEB_DEFAULTS.logoTextColor,
      headerColor: VIBRAWEB_DEFAULTS.headerColor,
      footerColor: VIBRAWEB_DEFAULTS.footerColor,
      // Fontes Globais
      globalTitleFont: 'Poppins',
      globalBodyFont: 'Inter',
      // Tipografia H1
      h1Font: VIBRAWEB_DEFAULTS.h1Font,
      h1FontSize: VIBRAWEB_DEFAULTS.h1FontSize,
      h1Bold: VIBRAWEB_DEFAULTS.h1Bold,
      h1Italic: VIBRAWEB_DEFAULTS.h1Italic,
      h1Underline: VIBRAWEB_DEFAULTS.h1Underline,
      h1TextAlign: VIBRAWEB_DEFAULTS.h1TextAlign,
      // H2
      h2Font: VIBRAWEB_DEFAULTS.h2Font,
      h2FontSize: VIBRAWEB_DEFAULTS.h2FontSize,
      h2Bold: VIBRAWEB_DEFAULTS.h2Bold,
      h2Italic: VIBRAWEB_DEFAULTS.h2Italic,
      h2Underline: VIBRAWEB_DEFAULTS.h2Underline,
      h2TextAlign: VIBRAWEB_DEFAULTS.h2TextAlign,
      // H3
      h3Font: VIBRAWEB_DEFAULTS.h3Font,
      h3FontSize: VIBRAWEB_DEFAULTS.h3FontSize,
      h3Bold: VIBRAWEB_DEFAULTS.h3Bold,
      h3Italic: VIBRAWEB_DEFAULTS.h3Italic,
      h3Underline: VIBRAWEB_DEFAULTS.h3Underline,
      h3TextAlign: VIBRAWEB_DEFAULTS.h3TextAlign,
      // H4
      h4Font: VIBRAWEB_DEFAULTS.h4Font,
      h4FontSize: VIBRAWEB_DEFAULTS.h4FontSize,
      h4Bold: VIBRAWEB_DEFAULTS.h4Bold,
      h4Italic: VIBRAWEB_DEFAULTS.h4Italic,
      h4Underline: VIBRAWEB_DEFAULTS.h4Underline,
      h4TextAlign: VIBRAWEB_DEFAULTS.h4TextAlign,
      // Body
      bodyFont: VIBRAWEB_DEFAULTS.bodyFont,
      bodyFontSize: VIBRAWEB_DEFAULTS.bodyFontSize,
      bodyBold: VIBRAWEB_DEFAULTS.bodyBold,
      bodyItalic: VIBRAWEB_DEFAULTS.bodyItalic,
      bodyUnderline: VIBRAWEB_DEFAULTS.bodyUnderline,
    },
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Versão contemporânea da Vibraweb, com cards sólidos, cantos arredondados e linhas diretas.',
    apply: {
      stylePreset: 'modern',
      primaryColor: '#581C3C', secondaryColor: '#C0397B', accentColor: '#FDB813', ornamentColor: '#2457C5',
      h1Color: '#581C3C', h2Color: '#581C3C', h3Color: '#C0397B', h4Color: '#4C2A68', bodyColor: '#352632',
      h1Font: 'Poppins', h2Font: 'Poppins', h3Font: 'Poppins', h4Font: 'Poppins', bodyFont: 'Inter',
      h1TextAlign: 'left', plainTextMode: false, quoteStyle: 'accented',
    },
  },
  {
    id: 'texto-puro',
    name: 'Texto Puro',
    description: 'Texto preto em Inter, hierarquia somente por tamanho. Sem badges, barras coloridas ou cards — igual a um documento Word/Docs padrão.',
    apply: {
      // Cores — escala cinza escuro
      primaryColor: '#111111',
      secondaryColor: '#555555',
      accentColor: '#111111',
      ornamentColor: '#111111',
      h1Color: '#111111',
      h2Color: '#222222',
      h3Color: '#333333',
      h4Color: '#444444',
      bodyColor: '#333333',
      titleColor: '#111111',
      clientColor: '#111111',
      logoTextColor: '#111111',
      headerColor: '#555555',
      footerColor: '#888888',
      // Sem elementos gráficos de destaque
      plainTextMode: true,
      quoteStyle: 'minimal',
      // Fontes Globais
      globalTitleFont: 'Inter',
      globalBodyFont: 'Inter',
      // Tipografia H1 — Inter, 20pt, negrito
      h1Font: 'Inter',
      h1FontSize: 20,
      h1Bold: true,
      h1Italic: false,
      h1Underline: false,
      h1TextAlign: 'left',
      // H2 — Inter, 18pt, negrito
      h2Font: 'Inter',
      h2FontSize: 18,
      h2Bold: true,
      h2Italic: false,
      h2Underline: false,
      h2TextAlign: 'left',
      // H3 — Inter, 16pt, negrito
      h3Font: 'Inter',
      h3FontSize: 16,
      h3Bold: true,
      h3Italic: false,
      h3Underline: false,
      h3TextAlign: 'left',
      // H4 — Inter, 14pt, negrito
      h4Font: 'Inter',
      h4FontSize: 14,
      h4Bold: true,
      h4Italic: false,
      h4Underline: false,
      h4TextAlign: 'left',
      // Body — Inter, 11pt, regular
      bodyFont: 'Inter',
      bodyFontSize: 11,
      bodyBold: false,
      bodyItalic: false,
      bodyUnderline: false,
    },
  },
]

function InfoButton({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  const updateCoords = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const width = 250
      let left = rect.left
      if (left + width > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - width - 16)
      }
      setCoords({
        top: rect.bottom + 6,
        left,
      })
    }
  }

  const handleMouseEnter = () => {
    updateCoords()
    setOpen(true)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateCoords()
    setOpen(o => !o)
  }

  useEffect(() => {
    if (open) {
      const handleScrollOrResize = () => updateCoords()
      window.addEventListener('scroll', handleScrollOrResize, true)
      window.addEventListener('resize', handleScrollOrResize)
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true)
        window.removeEventListener('resize', handleScrollOrResize)
      }
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        onClick={handleClick}
        aria-label="Informações"
        style={{
          width: 18, height: 18, borderRadius: '50%',
          border: 'none', background: 'transparent',
          color: open ? t.fg2 : t.fg4,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0, flexShrink: 0,
          transition: 'color 0.15s ease',
        }}
      >
        <InfoIcon size={14} />
      </button>
      {open && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: 250,
            padding: '10px 12px',
            borderRadius: 8,
            background: '#1c1522',
            border: `1px solid ${t.pb}`,
            color: t.fg2,
            fontFamily: t.body,
            fontSize: 12,
            lineHeight: 1.5,
            zIndex: 99999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            textTransform: 'none',
            fontWeight: 400,
          }}
        >
          {text}
        </div>,
        document.body
      )}
    </>
  )
}

export default function BrandPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile(900)
  const confirm = useConfirm()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [templates, setTemplates] = useState<any[]>([])
  const [globalTemplates, setGlobalTemplates] = useState<any[]>([])
  const [activeTemplateId, setActiveTemplateId] = useState<string>('')

  // previewId: qual template aparece no preview (clicar num card só muda isso).
  //
  // editingId/editingTab: DERIVADOS da URL (/app/marca/<id>/<aba>), não guardados
  // em estado próprio — mesmo motivo documentado na Sidebar: um estado solto
  // dessincronizaria em refresh/link direto/voltar do navegador. `null` = mostra
  // a lista de cards; um id = o MESMO container desliza pro editor daquele
  // template, e a Sidebar mostra a gaveta Visual/Blocos/Textos.
  const params = useParams()
  const splat = (params['*'] ?? '').split('/').filter(Boolean)
  const editingId = splat[0] || null
  const editingTab: EditorTab = splat[1] === 'blocos' ? 'blocos' : splat[1] === 'textos' ? 'textos' : 'visual'

  const [previewId, setPreviewId] = useState<string>('default')
  const [editingConfig, setEditingConfig] = useState<any>({})
  const [originalConfig, setOriginalConfig] = useState<any>({})
  const [activeTab, setActiveTab] = useState<TopTab>('capa')
  const [openModelGroup, setOpenModelGroup] = useState<'system' | 'personal' | null>('system')
  const [logoModalOpen, setLogoModalOpen] = useState(false)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const draftConfigRef = useRef<Record<string, any>>({})

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

  // Carrega a config do template quando `editingId` muda (entrar no editor,
  // trocar de template direto de dentro dele, ou chegar já numa URL de editor
  // via link direto/refresh). NÃO depende de `editingTab` — trocar de aba
  // (Visual/Blocos/Textos) do MESMO template não deve recarregar nem resetar
  // a edição em andamento.
  useEffect(() => {
    if (loading || !editingId) return
    if (editingId === NEW_TEMPLATE_ID) {
      const cfg = cloneConfig(draftConfigRef.current)
      setEditingConfig(cfg)
      setOriginalConfig(cfg)
      setPreviewId(editingId)
      setActiveTab('estilos')
      return
    }
    const cfg = templates.find(tpl => tpl.id === editingId)?.config || {}
    setEditingConfig(cfg)
    setOriginalConfig(cfg)
    setPreviewId(editingId)
    setActiveTab('capa')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, loading])

  useEffect(() => {
    loadSampleClient().then(({ identity, map }) => {
      setSampleIdentity(identity)
      setSampleMap(map)
      loadSampleInterpretations(map).then(setInterp)
    })
  }, [])

  useEffect(() => {
    Promise.all([fetchUserProfile(), fetchGlobalTemplates()]).then(([p, systemTemplates]) => {
      if (!p) { navigate('/app'); return }
      if (p.plan !== 'pro' && p.role !== 'admin') {
        alert('A página "Modelos" é exclusiva para assinantes do plano Pro.')
        navigate('/app')
        return
      }

      setProfile(p)
      const reportTemplates = systemTemplates.filter(template => template.template_type === 'report')
      const publishedTemplate = reportTemplates.find(template => template.is_active) ?? reportTemplates[0]
      const systemDefaultId = publishedTemplate ? systemTemplateId(publishedTemplate.slug) : systemTemplateId('default')
      setGlobalTemplates(reportTemplates)
      const configData = p.brand_config || {}
      let loadedTemplates: any[] = []
      let loadedActiveId = systemDefaultId

      if (configData.activeTemplateId && Array.isArray(configData.templates)) {
        const inheritedGlobal = configData.activeTemplateId === 'global'
          && configData.templates.length === 1
          && configData.templates[0]?.id === 'global'
        if (!inheritedGlobal) {
          loadedTemplates = configData.templates
          loadedActiveId = configData.activeTemplateId === 'default' ? systemDefaultId : configData.activeTemplateId
        }
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

  // Modelos do Vibraweb são somente leitura: servem como ponto de partida e
  // continuam iguais para toda a base. Os modelos pessoais são cópias que o
  // consultor pode editar, ativar ou remover sem afetar o catálogo oficial.
  const allItems: TemplateItem[] = useMemo(() => {
    const systemItems = globalTemplates.map(template => ({
      id: systemTemplateId(template.slug),
      name: template.name,
      kind: 'system' as const,
      isSystemDefault: template.is_active,
      gradient: `linear-gradient(to bottom, ${template.config?.primaryColor || VIBRAWEB_DEFAULTS.primaryColor}, ${template.config?.accentColor || VIBRAWEB_DEFAULTS.accentColor})`,
      config: templates.find(saved => saved.systemTemplateSlug === template.slug)?.config ?? template.config ?? {},
    }))
    const fallback = systemItems.length ? [] : [{
      id: systemTemplateId('default'), name: 'Vibração', kind: 'system' as const, isSystemDefault: true,
      gradient: `linear-gradient(to bottom, ${VIBRAWEB_DEFAULTS.primaryColor}, ${VIBRAWEB_DEFAULTS.accentColor})`, config: {},
    }]
    return [
      ...systemItems,
      ...fallback,
      ...templates.filter(tpl => !tpl.systemTemplateSlug).map(tpl => ({
        id: tpl.id, name: tpl.name, kind: 'personal' as const, isSystemDefault: false,
        gradient: `linear-gradient(to bottom, ${tpl.config?.primaryColor || VIBRAWEB_DEFAULTS.primaryColor}, ${tpl.config?.accentColor || VIBRAWEB_DEFAULTS.accentColor})`,
        config: tpl.config ?? {},
      })),
    ]
  }, [globalTemplates, templates])

  // O catálogo oficial vem do banco. Cada aplicação abaixo grava somente no
  // template pessoal que o consultor está editando; o template global fica
  // protegido como base do sistema para todos os demais usuários.
  const styleCatalog: StylePreset[] = useMemo(() => {
    if (!globalTemplates.length) return STYLE_PRESETS
    return globalTemplates.map(template => ({
      id: `global-${template.slug}`,
      name: template.name,
      description: template.description ?? 'Estilo oficial do sistema.',
      apply: template.config ?? {},
    }))
  }, [globalTemplates])

  // A redefinição visual de um modelo usa sempre o template global publicado.
  // Blocos e textos continuam sendo camadas próprias e não participam disso.
  const globalVisualConfig = useMemo(() => {
    const published = globalTemplates.find(template => template.is_active) ?? globalTemplates[0]
    return visualConfigOnly(published?.config ?? VIBRAWEB_DEFAULTS)
  }, [globalTemplates])

  const hasVisualCustomization = useMemo(
    () => JSON.stringify(visualConfigOnly(editingConfig)) !== JSON.stringify(globalVisualConfig),
    [editingConfig, globalVisualConfig],
  )

  function resetVisualToGlobal() {
    setEditingConfig((current: any) => ({
      ...globalVisualConfig,
      ...(current.blockOrder !== undefined ? { blockOrder: current.blockOrder } : {}),
      ...(current.textOverrides !== undefined ? { textOverrides: current.textOverrides } : {}),
    }))
  }

  function restoreSavedModel() {
    setEditingConfig(cloneConfig(originalConfig))
  }

  const sortedItems = useMemo(() => {
    const systemItems = allItems.filter(item => item.kind === 'system')
    const personalItems = allItems.filter(item => item.kind === 'personal')
    const activeIdx = personalItems.findIndex(item => item.id === activeTemplateId)
    if (activeIdx <= 0) return [...systemItems, ...personalItems]
    const active = personalItems[activeIdx]
    return [...systemItems, active, ...personalItems.filter((_, index) => index !== activeIdx)]
  }, [allItems, activeTemplateId])

  const systemModelItems = useMemo(
    () => sortedItems.filter(item => item.kind === 'system'),
    [sortedItems],
  )
  const personalModelItems = useMemo(
    () => sortedItems.filter(item => item.kind === 'personal'),
    [sortedItems],
  )

  useEffect(() => {
    if (openModelGroup === 'personal' && personalModelItems.length === 0) {
      setOpenModelGroup('system')
    }
  }, [openModelGroup, personalModelItems.length])

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

  // ── Preview do template paginado pelo motor REAL (measure-document) ───────
  // Mesma paginação por medição de DOM do preview FINAL do cliente, pra o
  // preview do template bater 100% com o documento gerado. Hoisted acima do
  // early return de "Carregando" pra respeitar as regras de hooks; `theme` fica
  // `| null` até o profile existir (o guard de loading abaixo o estreita).
  const previewTemplateConfig = useMemo(() => {
    const savedCfg = allItems.find(item => item.id === previewId)?.config || {}
    return editingId ? editingConfig : savedCfg
  }, [previewId, editingId, editingConfig, allItems])

  const theme = useMemo<DocTheme | null>(() => {
    if (!profile) return null
    const previewProfile = { ...profile, brand_config: { activeTemplateId: 'mock', templates: [{ id: 'mock', config: previewTemplateConfig }] } }
    return resolveDocTheme(previewProfile)
  }, [profile, previewTemplateConfig])

  const previewBlockOrder = useMemo(
    () => normalizeBlockOrder(previewTemplateConfig.blockOrder ?? profile?.block_order ?? DEFAULT_BLOCK_ORDER),
    [previewTemplateConfig, profile?.block_order],
  )

  const previewBlocks = useMemo(
    () => (sampleMap && interp && sampleIdentity
      ? buildDocumentBlocks(sampleMap, sampleIdentity.subject, sampleIdentity.dataNascimento, interp, previewBlockOrder)
      : []),
    [sampleMap, interp, sampleIdentity, previewBlockOrder],
  )

  const previewPages = useMeasuredPages(previewBlocks, theme)
  const previewTocEntries = useMemo(
    () => previewPages ? buildTocEntriesFromPages(previewBlockOrder, previewPages) : undefined,
    [previewBlockOrder, previewPages],
  )

  const isEditingDraft = editingId === NEW_TEMPLATE_ID
  const isEditingSystem = isSystemTemplateId(editingId) || editingId === 'default'
  const isDirty = JSON.stringify(editingConfig) !== JSON.stringify(originalConfig)
  const hasPendingSave = isEditingDraft || isDirty
  const headerActions = useMemo(() => (
    editingId && !isEditingSystem && hasPendingSave ? [{
      id: 'save-model',
      label: saving ? 'Salvando...' : 'Salvar modelo',
      icon: <CheckIcon size={16} />,
      onClick: () => { void handleSave() },
      disabled: saving || uploading,
      tone: 'accent' as const,
    }] : []
  ), [editingId, hasPendingSave, isEditingSystem, saving, uploading])
  useShellHeaderActions(headerActions)

  if (loading || !profile || !theme) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: t.night, color: t.fg2 }}>
        Carregando...
      </div>
    )
  }

  // --- Actions ---

  const handleCreateTemplateClick = () => {
    const source = allItems.find(item => item.id === previewId)
      ?? allItems.find(item => item.isSystemDefault)
      ?? allItems[0]
    draftConfigRef.current = cloneConfig(source?.config ?? {})
    setNewTemplateName('')
    navigate(`/app/marca/${NEW_TEMPLATE_ID}`)
  }

  const confirmCreateTemplate = async () => {
    if (!newTemplateName.trim()) return
    setCreateModalOpen(false)

    const newId = crypto.randomUUID()
    const newTemplate = { id: newId, name: newTemplateName.trim(), config: editingConfig }
    const updated = [...templates, newTemplate]
    const success = await persistTemplates(updated, activeTemplateId)
    if (!success) return
    draftConfigRef.current = {}
    setPreviewId(newId)
    navigate(`/app/marca/${newId}`)
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
    if (editingId && !isSystemTemplateId(id) && id !== 'default') {
      openEditor(id)
    }
  }

  // Navega pro editor daquele template — a config é carregada pelo efeito
  // acima (reage a `editingId` mudar). `templateList` deixou de ser
  // necessário: com `editingId` vindo da URL, não há mais uma chamada
  // "no mesmo tick da criação" que precisasse do array ainda não commitado
  // no state (ver confirmCreateTemplate).
  function openEditor(id: string) {
    navigate(`/app/marca/${id}`)
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

  async function handleActivateSystem(item: TemplateItem) {
    captureRectsForFlip()
    const selectedSystem = createSystemSelection(item)
    const updated = [
      ...templates.filter(template => !template.systemTemplateSlug),
      selectedSystem,
    ]
    await persistTemplates(updated, item.id)
  }

  const handleDeleteTemplate = async (id: string) => {
    const ok = await confirm({
      title: 'Excluir modelo',
      message: 'Tem certeza que deseja excluir este template? Essa ação não pode ser desfeita.',
      confirmLabel: 'Excluir',
      danger: true,
    })
    if (!ok) return

    let updated = templates.filter(tpl => tpl.id !== id)

    let newActiveId = activeTemplateId
    if (activeTemplateId === id) {
      const fallbackSystem = systemModelItems.find(item => item.isSystemDefault) ?? systemModelItems[0]
      newActiveId = fallbackSystem?.id ?? systemTemplateId('default')
      if (fallbackSystem) {
        updated = [
          ...updated.filter(template => !template.systemTemplateSlug),
          createSystemSelection(fallbackSystem),
        ]
      }
      setActiveTemplateId(newActiveId)
    }
    setTemplates(updated)
    if (previewId === id) setPreviewId(newActiveId)
    if (editingId === id) navigate('/app/marca')

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

  async function handleSave(): Promise<boolean> {
    if (isEditingSystem || !editingId) return false
    if (isEditingDraft) {
      setCreateModalOpen(true)
      return false
    }
    const updated = templates.map(tpl => tpl.id === editingId ? { ...tpl, config: editingConfig } : tpl)
    return persistTemplates(updated, activeTemplateId)
  }

  // Redimensiona/converte no cliente ANTES de subir (2026-07-29, Guilherme:
  // "um conversor pra sempre converter pra um tamanho e formato adequado,
  // pra não perder resolução na impressão... e também pra não pesar no meu
  // banco de dados") — aplicado nos 3 campos de logo (capa, cabeçalho de
  // página, cabeçalho da capa), não só no popup de posicionamento.
  const uploadLogoFile = async (file: File, field: 'logoUrl' | 'headerLogoUrl' | 'coverHeaderLogoUrl') => {
    setUploading(true)
    try {
      const resized = await resizeImageForLogo(file)
      const finalFile = new File([resized], 'logo.png', { type: 'image/png' })
      const url = await uploadBrandLogo(finalFile)
      if (url) {
        setEditingConfig((prev: any) => ({ ...prev, [field]: url }))
      } else {
        alert('Erro ao fazer upload da imagem.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro ao processar a imagem.')
    }
    setUploading(false)
  }

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'headerLogoUrl' | 'coverHeaderLogoUrl') => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadLogoFile(file, field)
  }

  const updateConfig = (key: string, value: any) => {
    setEditingConfig((prev: any) => ({ ...prev, [key]: value }))
  }

  const applyPreset = (preset: StylePreset) => {
    setEditingConfig((prev: any) => ({ ...prev, ...preset.apply }))
  }

  // Textos, aparência e ordem de blocos fazem parte do mesmo rascunho. O
  // botão da tela de textos confirma a alteração naquele rascunho; a gravação
  // no banco acontece somente em "Salvar modelo", no cabeçalho do editor.
  async function stageTextOverrides(next: TextOverrides) {
    setEditingConfig((prev: any) => ({ ...prev, textOverrides: next }))
  }

  // Blocos/Textos do editor de um Modelo (2026-07-27) — TELA CHEIA,
  // reaproveitando a MESMA casca de /app/blocos e /app/textos (pedido
  // explícito do Guilherme, confirmado): não cabem na coluna estreita onde a
  // "Aparência" vive, e tanto o painel quanto o preview trocam por completo
  // ao alternar de aba (a Sidebar já cuida da navegação entre elas — ver
  // `matchModelosEditor` em Sidebar.tsx). Só entra aqui com um modelo REAL
  // (nunca 'default', que não tem onde guardar personalização própria — a
  // Sidebar já exclui 'default' do grupo dinâmico pelo mesmo motivo).
  if (editingId && !isEditingSystem && editingTab !== 'visual') {
    const modelName = isEditingDraft
      ? 'Novo modelo'
      : (templates.find(tpl => tpl.id === editingId)?.name ?? 'Modelo')
    return editingTab === 'blocos' ? (
      <ModeloBlocosTab
        theme={theme}
        profile={profile}
        editingConfig={editingConfig}
        modelId={editingId}
        modelName={modelName}
        isDirty={isDirty}
        isEditingDraft={isEditingDraft}
        onRestoreSaved={restoreSavedModel}
        onChangeBlockOrder={next => updateConfig('blockOrder', next)}
      />
    ) : (
      <ModeloTextosTab
        modelName={modelName}
        textOverrides={editingConfig.textOverrides ?? {}}
        onPersist={stageTextOverrides}
      />
    )
  }

  // --- Theme resolution ---
  // Com o editor aberto, o preview segue o editingConfig (ao vivo, com
  // alterações ainda não salvas). Com o editor fechado, segue o config JÁ
  // SALVO do template selecionado pra preview (previewId).
  const h1Status = wcagStatus(theme.h1Color, DOC_BACKGROUND, true)
  const h2Status = wcagStatus(theme.h2Color, DOC_BACKGROUND, true)
  const h3Status = wcagStatus(theme.h3Color, DOC_BACKGROUND, false)
  const h4Status = wcagStatus(theme.h4Color, DOC_BACKGROUND, false)
  const bodyStatus = wcagStatus(theme.bodyColor, DOC_BACKGROUND, false)

  const previewReady = !!(sampleMap && interp && sampleIdentity && previewPages)
  const previewPageCount = previewPages ? previewPages.length + 1 + (previewTocEntries?.length ? 1 : 0) : 0

  const previewingLabel = isEditingDraft
    ? 'Novo modelo'
    : (allItems.find(item => item.id === previewId)?.name ?? 'Modelo')

  const previewContent = previewReady ? (
    <DocumentOrganizerView
      theme={theme}
      blocks={previewBlocks}
      pages={previewPages ?? undefined}
      tocEntries={previewTocEntries}
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
          title="Modelos"
          info="Cada modelo guarda cores, logo, cabeçalho e rodapé do seu PDF white-label — e, dentro do editor, também pode ter sua própria ordenação de blocos. Clique num card pra ver o preview; use o lápis pra editar."
          size={16}
        />
      </div>
      <div className="vw-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ExpandablePanel
          title={<span style={{ fontSize: 12, color: t.fg2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Modelos Vibraweb</span>}
          open={openModelGroup === 'system'}
          onToggle={() => setOpenModelGroup(openModelGroup === 'system' ? null : 'system')}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {systemModelItems.map(item => (
              <TemplateCard
                key={item.id}
                cardRef={el => registerCardRef(item.id, el)}
                label={item.name}
                isActive={item.id === activeTemplateId}
                isSelected={previewId === item.id}
                gradient={item.gradient}
                onSelect={() => selectCard(item.id)}
                onActivate={item.id !== activeTemplateId ? () => handleActivateSystem(item) : undefined}
                activeLabel="Padrão selecionado"
              />
            ))}
          </div>
        </ExpandablePanel>
        {personalModelItems.length > 0 && (
          <ExpandablePanel
            title={<span style={{ fontSize: 12, color: t.fg2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Meus modelos</span>}
            open={openModelGroup === 'personal'}
            onToggle={() => setOpenModelGroup(openModelGroup === 'personal' ? null : 'personal')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {personalModelItems.map(item => (
                <TemplateCard
                  key={item.id}
                  cardRef={el => registerCardRef(item.id, el)}
                  label={item.name}
                  isActive={item.id === activeTemplateId}
                  isSelected={previewId === item.id}
                  gradient={item.gradient}
                  onSelect={() => selectCard(item.id)}
                  onEdit={() => openEditor(item.id)}
                  onActivate={item.id !== activeTemplateId ? () => handleActivate(item.id) : undefined}
                  onDelete={() => handleDeleteTemplate(item.id)}
                />
              ))}
            </div>
          </ExpandablePanel>
        )}
      </div>
      <div style={{ padding: 16, borderTop: `1px solid ${t.pb}`, flexShrink: 0 }}>
        <PrimaryBtn onClick={handleCreateTemplateClick} style={{ padding: '10px', fontSize: 12, width: '100%', justifyContent: 'center' }}>
          + Criar Novo Modelo
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
          {isEditingDraft ? 'Novo modelo' : (isEditingSystem ? allItems.find(item => item.id === editingId)?.name : templates.find(tpl => tpl.id === editingId)?.name)}
        </h1>
      </div>

      <div className="vw-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
      {isEditingSystem ? (
        <div style={{ padding: 24, fontSize: 13, color: t.fg3, fontFamily: t.body, lineHeight: 1.6 }}>
          Este é um modelo oficial do Vibraweb. Ele serve como base visual e permanece protegido. Crie um novo modelo para personalizar cores, capa, cabeçalho, rodapé, blocos e textos.
        </div>
      ) : (
        <div style={{ padding: '8px 14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Reestruturação em abas (2026-07-28) — 2ª correção do Guilherme:
              "ainda está errado, a janela toggle é só na PRIMEIRA divisão —
              depois de abrir a primeira divisão, abre uma JANELA INTEIRA que
              é separada por SUBTÍTULO e linhas divisórias e espaçamentos
              usados nas regras de UI/UX design" (a 1ª correção tinha ido
              longe demais na direção oposta, aninhando painéis expansíveis
              em 3 níveis). Agora só o NÍVEL 1 (`activeTab`:
              Capa/Corpo/Cabeçalho/Rodapé) é expansível de verdade — tudo
              dentro dele é conteúdo ESTÁTICO sempre visível, organizado só
              com `Section`/`SubSection` (subtítulo + linha divisória +
              espaçamento, ver componentes no fim do arquivo), sem nenhum
              estado de toggle além do nível 1. */}
          <ExpandablePanel
            title={<><span style={panelTitleStyle}>Estilos</span><InfoButton text="Predefinições de estilo como ponto de partida rápido. Aplicar um estilo preenche cores e fontes automaticamente." /></>}
            open={activeTab === 'estilos'}
            onToggle={() => setActiveTab(activeTab === 'estilos' ? null : 'estilos')}
            bodyPadding={10}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {styleCatalog.map(preset => {
                const isSelected = preset.apply.stylePreset
                  ? editingConfig.stylePreset === preset.apply.stylePreset
                  : preset.id === 'texto-puro'
                    ? !!(editingConfig.plainTextMode ?? theme.plainTextMode)
                    : !(editingConfig.plainTextMode ?? theme.plainTextMode)

                return (
                  <div key={preset.id} style={{ display: 'flex', flexDirection: 'column', gap: isSelected ? 0 : 8 }}>
                    <div
                      onClick={() => applyPreset(preset)}
                      style={{
                        padding: '12px 14px', border: `1px solid ${isSelected ? t.gold : t.pb}`,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(253,184,19,.08)' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: isSelected ? 700 : 500, color: isSelected ? t.gold : t.fg }}>
                          {preset.name}
                        </span>
                        <InfoButton text={preset.description} />
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: t.gold, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                          Selecionado
                        </span>
                      )}
                    </div>

                    {isSelected && (
                      <div style={{ padding: '14px 4px 4px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: t.fg2, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                            5 Cores Globais
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 156px), 1fr))', gap: 12 }}>
                            <ColorPicker
                              label="Cor Principal"
                              value={theme.primaryColor}
                              onChange={c => setEditingConfig((prev: any) => ({ ...prev, primaryColor: c, h1Color: c, h2Color: c, h3Color: c, logoTextColor: c, clientColor: c }))}
                            />
                            <ColorPicker
                              label="Cor Secundária"
                              value={theme.secondaryColor}
                              onChange={c => setEditingConfig((prev: any) => ({ ...prev, secondaryColor: c, titleColor: c }))}
                            />
                            <ColorPicker
                              label="Cor de Destaque"
                              value={theme.accentColor}
                              onChange={c => updateConfig('accentColor', c)}
                            />
                            <ColorPicker
                              label="Cor das Fontes"
                              value={theme.bodyColor}
                              onChange={c => updateConfig('bodyColor', c)}
                            />
                            <ColorPicker
                              label="Cor Complementar"
                              value={theme.ornamentColor}
                              onChange={c => updateConfig('ornamentColor', c)}
                            />
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: t.fg2, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
                            2 Fontes Globais
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 12 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 11, color: t.fg2, marginBottom: 4 }}>Títulos (H1–H4)</label>
                              <SelectControl
                                value={editingConfig.globalTitleFont ?? editingConfig.h1Font ?? theme.h1Font}
                                onChange={e => {
                                  const font = e.target.value
                                  setEditingConfig((prev: any) => ({
                                    ...prev,
                                    globalTitleFont: font,
                                    h1Font: font,
                                    h2Font: font,
                                    h3Font: font,
                                    h4Font: font,
                                  }))
                                }}
                              >
                                {COVER_FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                              </SelectControl>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 11, color: t.fg2, marginBottom: 4 }}>Parágrafos (Corpo)</label>
                              <SelectControl
                                value={editingConfig.globalBodyFont ?? editingConfig.bodyFont ?? theme.bodyFont}
                                onChange={e => {
                                  const font = e.target.value
                                  setEditingConfig((prev: any) => ({
                                    ...prev,
                                    globalBodyFont: font,
                                    bodyFont: font,
                                  }))
                                }}
                              >
                                {COVER_FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                              </SelectControl>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </ExpandablePanel>

          <ExpandablePanel title={<span style={panelTitleStyle}>Capa</span>} open={activeTab === 'capa'} onToggle={() => setActiveTab(activeTab === 'capa' ? null : 'capa')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Section title="Cabeçalho da capa">
                <PillSelect
                  options={[
                    { value: 'none', label: 'Nenhum' },
                    { value: 'inherit', label: 'Geral' },
                    { value: 'custom', label: 'Personalizado' },
                  ]}
                  value={editingConfig.coverHeaderMode ?? theme.coverHeaderMode}
                  onChange={v => updateConfig('coverHeaderMode', v)}
                />
                {(editingConfig.coverHeaderMode ?? theme.coverHeaderMode) === 'custom' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Logo Menor (Esq.)</label>
                      <input type="file" accept="image/*" onChange={e => handleUploadLogo(e, 'coverHeaderLogoUrl')} style={{ fontSize: 12, width: '100%' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto Lado Direito</label>
                      <input type="text" value={editingConfig.coverHeaderRightText ?? ''}
                        onChange={e => updateConfig('coverHeaderRightText', e.target.value)}
                        style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }}
                        placeholder="Ex: Nome do Cliente — Mapa" />
                    </div>
                  </>
                )}
              </Section>

              <Section title="Logo">
                <PillSelect
                  options={[
                    { value: 'image', label: 'Imagem' },
                    { value: 'text', label: 'Texto' },
                  ]}
                  value={editingConfig.logoMode ?? theme.logoMode}
                  onChange={v => updateConfig('logoMode', v)}
                />

                {(editingConfig.logoMode ?? theme.logoMode) === 'image' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <SecondaryBtn onClick={() => setLogoModalOpen(true)} style={{ padding: '8px 12px', fontSize: 12 }}>
                        Adicionar imagem
                      </SecondaryBtn>
                    </div>
                    <div>
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
                ) : (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto do logo</label>
                      <input type="text" value={editingConfig.companyName ?? profile.consultant_name}
                        onChange={e => updateConfig('companyName', e.target.value)}
                        style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }}
                        placeholder="Nome da Marca" />
                    </div>
                    <SubSection title="Fonte">
                      <FontControls
                        size={editingConfig.logoTextFontSize ?? theme.logoTextFontSize} onSize={v => updateConfig('logoTextFontSize', v)} sizeMin={14} sizeMax={48}
                        font={editingConfig.logoTextFont ?? theme.logoTextFont} onFont={v => updateConfig('logoTextFont', v)}
                        color={editingConfig.logoTextColor ?? theme.logoTextColor} onColor={c => updateConfig('logoTextColor', c)}
                        bold={editingConfig.logoTextBold ?? theme.logoTextBold} onBold={() => updateConfig('logoTextBold', !(editingConfig.logoTextBold ?? theme.logoTextBold))}
                        italic={editingConfig.logoTextItalic ?? theme.logoTextItalic} onItalic={() => updateConfig('logoTextItalic', !(editingConfig.logoTextItalic ?? theme.logoTextItalic))}
                        underline={editingConfig.logoTextUnderline ?? theme.logoTextUnderline} onUnderline={() => updateConfig('logoTextUnderline', !(editingConfig.logoTextUnderline ?? theme.logoTextUnderline))}
                      />
                    </SubSection>
                    <SubSection title="Posição">
                      <AnchorPicker
                        h={editingConfig.logoTextAnchorH ?? theme.logoTextAnchorH} onH={v => updateConfig('logoTextAnchorH', v)}
                        v={editingConfig.logoTextAnchorV ?? theme.logoTextAnchorV} onV={v => updateConfig('logoTextAnchorV', v)}
                      />
                    </SubSection>
                  </>
                )}
              </Section>

              <Section title="Título">
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Nome do Produto (título da capa)</label>
                  <input type="text" value={editingConfig.coverProductTitle ?? theme.coverProductTitle}
                    onChange={e => updateConfig('coverProductTitle', e.target.value)}
                    style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }}
                    placeholder="Mapa Numerológico Pessoal" />
                </div>
                <SubSection title="Fonte">
                  <FontControls
                    size={editingConfig.titleFontSize ?? theme.titleFontSize} onSize={v => updateConfig('titleFontSize', v)} sizeMin={14} sizeMax={48}
                    font={editingConfig.titleFont ?? theme.titleFont} onFont={v => updateConfig('titleFont', v)}
                    color={editingConfig.titleColor ?? theme.titleColor} onColor={c => updateConfig('titleColor', c)}
                    bold={editingConfig.titleBold ?? theme.titleBold} onBold={() => updateConfig('titleBold', !(editingConfig.titleBold ?? theme.titleBold))}
                    italic={editingConfig.titleItalic ?? theme.titleItalic} onItalic={() => updateConfig('titleItalic', !(editingConfig.titleItalic ?? theme.titleItalic))}
                    underline={editingConfig.titleUnderline ?? theme.titleUnderline} onUnderline={() => updateConfig('titleUnderline', !(editingConfig.titleUnderline ?? theme.titleUnderline))}
                  />
                </SubSection>
                <SubSection title="Posição">
                  <AnchorPicker
                    h={editingConfig.titleAnchorH ?? theme.titleAnchorH} onH={v => updateConfig('titleAnchorH', v)}
                    v={editingConfig.titleAnchorV ?? theme.titleAnchorV} onV={v => updateConfig('titleAnchorV', v)}
                  />
                </SubSection>
              </Section>

              <Section title="Nome do cliente">
                <PillSelect
                  options={[
                    { value: 'analysis', label: 'Análise' },
                    { value: 'custom', label: 'Personalizado' },
                  ]}
                  value={editingConfig.clientNameMode ?? theme.clientNameMode}
                  onChange={v => updateConfig('clientNameMode', v)}
                />
                {(editingConfig.clientNameMode ?? theme.clientNameMode) === 'custom' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Nome personalizado</label>
                    <input type="text" value={editingConfig.clientNameCustom ?? theme.clientNameCustom}
                      onChange={e => updateConfig('clientNameCustom', e.target.value)}
                      style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }}
                      placeholder="Ex: Cliente Exemplo" />
                  </div>
                )}
                <SubSection title="Fonte">
                  <FontControls
                    size={editingConfig.clientFontSize ?? theme.clientFontSize} onSize={v => updateConfig('clientFontSize', v)} sizeMin={12} sizeMax={32}
                    font={editingConfig.clientFont ?? theme.clientFont} onFont={v => updateConfig('clientFont', v)}
                    color={editingConfig.clientColor ?? theme.clientColor} onColor={c => updateConfig('clientColor', c)}
                    bold={editingConfig.clientBold ?? theme.clientBold} onBold={() => updateConfig('clientBold', !(editingConfig.clientBold ?? theme.clientBold))}
                    italic={editingConfig.clientItalic ?? theme.clientItalic} onItalic={() => updateConfig('clientItalic', !(editingConfig.clientItalic ?? theme.clientItalic))}
                    underline={editingConfig.clientUnderline ?? theme.clientUnderline} onUnderline={() => updateConfig('clientUnderline', !(editingConfig.clientUnderline ?? theme.clientUnderline))}
                  />
                </SubSection>
                <SubSection title="Posição">
                  <AnchorPicker
                    h={editingConfig.clientAnchorH ?? theme.clientAnchorH} onH={v => updateConfig('clientAnchorH', v)}
                    v={editingConfig.clientAnchorV ?? theme.clientAnchorV} onV={v => updateConfig('clientAnchorV', v)}
                  />
                </SubSection>
              </Section>
            </div>
          </ExpandablePanel>

          <ExpandablePanel title={<span style={panelTitleStyle}>Corpo do documento</span>} open={activeTab === 'corpo'} onToggle={() => setActiveTab(activeTab === 'corpo' ? null : 'corpo')}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Section title="Configurações Globais (Cores e Fontes)" info="Ajuste as cores e fontes principais do documento de forma geral. As alterações aqui cascateiam para todos os títulos e parágrafos.">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <SubSection title="5 Cores Globais">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
                      <ColorPicker
                        label="Cor Principal (H1–H3)"
                        value={theme.primaryColor}
                        onChange={c => setEditingConfig((prev: any) => ({ ...prev, primaryColor: c, h1Color: c, h2Color: c, h3Color: c, logoTextColor: c, clientColor: c }))}
                      />
                      <ColorPicker
                        label="Cor Secundária (Intros)"
                        value={theme.secondaryColor}
                        onChange={c => updateConfig('secondaryColor', c)}
                      />
                      <ColorPicker
                        label="Cor de Destaque (Badges)"
                        value={theme.accentColor}
                        onChange={c => updateConfig('accentColor', c)}
                      />
                      <ColorPicker
                        label="Cor das Fontes (Corpo)"
                        value={theme.bodyColor}
                        onChange={c => updateConfig('bodyColor', c)}
                      />
                      <ColorPicker
                        label="Cor Complementar"
                        value={theme.ornamentColor}
                        onChange={c => updateConfig('ornamentColor', c)}
                      />
                    </div>
                  </SubSection>
                  <SubSection title="2 Fontes Globais">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 12 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Fonte dos Títulos (H1–H4)</label>
                        <SelectControl
                          value={editingConfig.globalTitleFont ?? editingConfig.h1Font ?? theme.h1Font}
                          onChange={e => {
                            const font = e.target.value
                            setEditingConfig((prev: any) => ({
                              ...prev,
                              globalTitleFont: font,
                              h1Font: font,
                              h2Font: font,
                              h3Font: font,
                              h4Font: font,
                            }))
                          }}
                        >
                          {COVER_FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </SelectControl>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Fonte dos Parágrafos (Corpo)</label>
                        <SelectControl
                          value={editingConfig.globalBodyFont ?? editingConfig.bodyFont ?? theme.bodyFont}
                          onChange={e => {
                            const font = e.target.value
                            setEditingConfig((prev: any) => ({
                              ...prev,
                              globalBodyFont: font,
                              bodyFont: font,
                            }))
                          }}
                        >
                          {COVER_FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                        </SelectControl>
                      </div>
                    </div>
                  </SubSection>
                </div>
              </Section>

              <Section title="Título de seção (H1)">
                <FontControls
                  size={editingConfig.h1FontSize ?? theme.h1FontSize} onSize={v => updateConfig('h1FontSize', v)} sizeMin={14} sizeMax={28}
                  font={editingConfig.h1Font ?? theme.h1Font} onFont={v => updateConfig('h1Font', v)}
                  color={editingConfig.h1Color ?? theme.h1Color} colorStatus={h1Status} onColor={c => updateConfig('h1Color', c)}
                  bold={editingConfig.h1Bold ?? theme.h1Bold} onBold={() => updateConfig('h1Bold', !(editingConfig.h1Bold ?? theme.h1Bold))}
                  italic={editingConfig.h1Italic ?? theme.h1Italic} onItalic={() => updateConfig('h1Italic', !(editingConfig.h1Italic ?? theme.h1Italic))}
                  underline={editingConfig.h1Underline ?? theme.h1Underline} onUnderline={() => updateConfig('h1Underline', !(editingConfig.h1Underline ?? theme.h1Underline))}
                />
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 6 }}>Posição do texto</label>
                  <TextAlignPicker value={editingConfig.h1TextAlign ?? theme.h1TextAlign} onChange={v => updateConfig('h1TextAlign', v)} />
                </div>
              </Section>

              <Section title="Sub-título (H2)">
                <FontControls
                  size={editingConfig.h2FontSize ?? theme.h2FontSize} onSize={v => updateConfig('h2FontSize', v)} sizeMin={12} sizeMax={24}
                  font={editingConfig.h2Font ?? theme.h2Font} onFont={v => updateConfig('h2Font', v)}
                  color={editingConfig.h2Color ?? theme.h2Color} colorStatus={h2Status} onColor={c => updateConfig('h2Color', c)}
                  bold={editingConfig.h2Bold ?? theme.h2Bold} onBold={() => updateConfig('h2Bold', !(editingConfig.h2Bold ?? theme.h2Bold))}
                  italic={editingConfig.h2Italic ?? theme.h2Italic} onItalic={() => updateConfig('h2Italic', !(editingConfig.h2Italic ?? theme.h2Italic))}
                  underline={editingConfig.h2Underline ?? theme.h2Underline} onUnderline={() => updateConfig('h2Underline', !(editingConfig.h2Underline ?? theme.h2Underline))}
                />
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 6 }}>Posição do texto</label>
                  <TextAlignPicker value={editingConfig.h2TextAlign ?? theme.h2TextAlign} onChange={v => updateConfig('h2TextAlign', v)} />
                </div>
              </Section>

              <Section title="Nível 3 (H3)">
                <FontControls
                  size={editingConfig.h3FontSize ?? theme.h3FontSize} onSize={v => updateConfig('h3FontSize', v)} sizeMin={10} sizeMax={18}
                  font={editingConfig.h3Font ?? theme.h3Font} onFont={v => updateConfig('h3Font', v)}
                  color={editingConfig.h3Color ?? theme.h3Color} colorStatus={h3Status} onColor={c => updateConfig('h3Color', c)}
                  bold={editingConfig.h3Bold ?? theme.h3Bold} onBold={() => updateConfig('h3Bold', !(editingConfig.h3Bold ?? theme.h3Bold))}
                  italic={editingConfig.h3Italic ?? theme.h3Italic} onItalic={() => updateConfig('h3Italic', !(editingConfig.h3Italic ?? theme.h3Italic))}
                  underline={editingConfig.h3Underline ?? theme.h3Underline} onUnderline={() => updateConfig('h3Underline', !(editingConfig.h3Underline ?? theme.h3Underline))}
                />
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 6 }}>Posição do texto</label>
                  <TextAlignPicker value={editingConfig.h3TextAlign ?? theme.h3TextAlign} onChange={v => updateConfig('h3TextAlign', v)} />
                </div>
              </Section>

              <Section title="Nível 4 (H4)">
                <FontControls
                  size={editingConfig.h4FontSize ?? theme.h4FontSize} onSize={v => updateConfig('h4FontSize', v)} sizeMin={9} sizeMax={16}
                  font={editingConfig.h4Font ?? theme.h4Font} onFont={v => updateConfig('h4Font', v)}
                  color={editingConfig.h4Color ?? theme.h4Color} colorStatus={h4Status} onColor={c => updateConfig('h4Color', c)}
                  bold={editingConfig.h4Bold ?? theme.h4Bold} onBold={() => updateConfig('h4Bold', !(editingConfig.h4Bold ?? theme.h4Bold))}
                  italic={editingConfig.h4Italic ?? theme.h4Italic} onItalic={() => updateConfig('h4Italic', !(editingConfig.h4Italic ?? theme.h4Italic))}
                  underline={editingConfig.h4Underline ?? theme.h4Underline} onUnderline={() => updateConfig('h4Underline', !(editingConfig.h4Underline ?? theme.h4Underline))}
                />
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 6 }}>Posição do texto</label>
                  <TextAlignPicker value={editingConfig.h4TextAlign ?? theme.h4TextAlign} onChange={v => updateConfig('h4TextAlign', v)} />
                </div>
              </Section>

              <Section title="Parágrafo">
                <FontControls
                  size={editingConfig.bodyFontSize ?? theme.bodyFontSize} onSize={v => updateConfig('bodyFontSize', v)} sizeMin={10} sizeMax={14}
                  font={editingConfig.bodyFont ?? theme.bodyFont} onFont={v => updateConfig('bodyFont', v)}
                  color={editingConfig.bodyColor ?? theme.bodyColor} colorStatus={bodyStatus} onColor={c => updateConfig('bodyColor', c)}
                  bold={editingConfig.bodyBold ?? theme.bodyBold} onBold={() => updateConfig('bodyBold', !(editingConfig.bodyBold ?? theme.bodyBold))}
                  italic={editingConfig.bodyItalic ?? theme.bodyItalic} onItalic={() => updateConfig('bodyItalic', !(editingConfig.bodyItalic ?? theme.bodyItalic))}
                  underline={editingConfig.bodyUnderline ?? theme.bodyUnderline} onUnderline={() => updateConfig('bodyUnderline', !(editingConfig.bodyUnderline ?? theme.bodyUnderline))}
                />
              </Section>

              <Section title="Cores dos elementos gráficos" info="Cores de destaque aplicadas aos elementos gráficos do documento: badges de números, linhas divisórias, destaques do rodapé e molduras de cards.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 16 }}>
                  <ColorPicker label="Cor Principal" value={theme.primaryColor} onChange={c => updateConfig('primaryColor', c)} />
                  <ColorPicker label="Cor Secundária" value={theme.secondaryColor} onChange={c => updateConfig('secondaryColor', c)} />
                  <ColorPicker label="Cor de Destaque" value={theme.accentColor} onChange={c => updateConfig('accentColor', c)} />
                  <ColorPicker label="Cor Complementar" value={theme.ornamentColor} onChange={c => updateConfig('ornamentColor', c)} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, gridColumn: '1 / -1', marginTop: 8 }}>
                    <label style={{ fontSize: 12, color: t.fg2 }}>Estilo de Citação (Textos Explicativos)</label>
                    <SelectControl
                      value={editingConfig.quoteStyle ?? theme.quoteStyle}
                      onChange={e => updateConfig('quoteStyle', e.target.value)}
                    >
                      <option value="minimal">Minimalista (Apenas Itálico)</option>
                      <option value="subtle">Discreto (Fundo Translúcido)</option>
                      <option value="accented">Destaque (Com Borda Lateral)</option>
                    </SelectControl>
                  </div>
                </div>
              </Section>
            </div>
          </ExpandablePanel>

          <ExpandablePanel
            title={<span style={panelTitleStyle}>Cabeçalho</span>}
            open={activeTab === 'cabecalho'}
            onToggle={() => setActiveTab(activeTab === 'cabecalho' ? null : 'cabecalho')}
            actionSlot={
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
                <SubSection title="Fonte">
                  <FontControls
                    size={editingConfig.headerFontSize ?? theme.headerFontSize} onSize={v => updateConfig('headerFontSize', v)} sizeMin={8} sizeMax={14}
                    font={editingConfig.headerFont ?? theme.headerFont} onFont={v => updateConfig('headerFont', v)}
                    color={editingConfig.headerColor ?? theme.headerColor} onColor={c => updateConfig('headerColor', c)}
                    bold={editingConfig.headerBold ?? theme.headerBold} onBold={() => updateConfig('headerBold', !(editingConfig.headerBold ?? theme.headerBold))}
                    italic={editingConfig.headerItalic ?? theme.headerItalic} onItalic={() => updateConfig('headerItalic', !(editingConfig.headerItalic ?? theme.headerItalic))}
                    underline={editingConfig.headerUnderline ?? theme.headerUnderline} onUnderline={() => updateConfig('headerUnderline', !(editingConfig.headerUnderline ?? theme.headerUnderline))}
                  />
                </SubSection>
              </div>
            )}
          </ExpandablePanel>

          <ExpandablePanel
            title={<span style={panelTitleStyle}>Rodapé</span>}
            open={activeTab === 'rodape'}
            onToggle={() => setActiveTab(activeTab === 'rodape' ? null : 'rodape')}
            actionSlot={
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
                  <SelectControl
                    value={editingConfig.footerColumns ?? theme.footerColumns}
                    onChange={e => updateConfig('footerColumns', parseInt(e.target.value))}
                  >
                    <option value={1}>1 Espaço (Centralizado)</option>
                    <option value={2}>2 Espaços (Esq, Dir)</option>
                    <option value={3}>3 Espaços (Esq, Centro, Dir)</option>
                  </SelectControl>
                </div>
                {(editingConfig.footerColumns ?? theme.footerColumns) >= 1 && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto Esquerda (ou Único)</label>
                    <input type="text" value={editingConfig.footerLeft ?? theme.footerLeft} onChange={e => updateConfig('footerLeft', e.target.value)} style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }} />
                  </div>
                )}
                {(editingConfig.footerColumns ?? theme.footerColumns) >= 3 && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto Centro</label>
                    <input type="text" value={editingConfig.footerCenter ?? theme.footerCenter} onChange={e => updateConfig('footerCenter', e.target.value)} style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }} />
                  </div>
                )}
                {(editingConfig.footerColumns ?? theme.footerColumns) >= 2 && (
                  <div>
                    <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Texto Direita</label>
                    <input type="text" value={editingConfig.footerRight ?? theme.footerRight} onChange={e => updateConfig('footerRight', e.target.value)} style={{ background: t.night, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 14, width: '100%', color: t.fg, boxSizing: 'border-box' }} />
                  </div>
                )}
                <SubSection title="Fonte">
                  <FontControls
                    size={editingConfig.footerFontSize ?? theme.footerFontSize} onSize={v => updateConfig('footerFontSize', v)} sizeMin={8} sizeMax={14}
                    font={editingConfig.footerFont ?? theme.footerFont} onFont={v => updateConfig('footerFont', v)}
                    color={editingConfig.footerColor ?? theme.footerColor} onColor={c => updateConfig('footerColor', c)}
                    bold={editingConfig.footerBold ?? theme.footerBold} onBold={() => updateConfig('footerBold', !(editingConfig.footerBold ?? theme.footerBold))}
                    italic={editingConfig.footerItalic ?? theme.footerItalic} onItalic={() => updateConfig('footerItalic', !(editingConfig.footerItalic ?? theme.footerItalic))}
                    underline={editingConfig.footerUnderline ?? theme.footerUnderline} onUnderline={() => updateConfig('footerUnderline', !(editingConfig.footerUnderline ?? theme.footerUnderline))}
                  />
                </SubSection>
              </div>
            )}
          </ExpandablePanel>
        </div>
      )}
      </div>

      {(hasVisualCustomization && (!isEditingDraft || isDirty) || (!isEditingDraft && isDirty) || isMobile) && (
        <div style={{
          flexShrink: 0,
          borderTop: `1px solid ${t.pb}`,
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {(hasVisualCustomization && (!isEditingDraft || isDirty) || (!isEditingDraft && isDirty)) && (
            <div style={{ display: 'flex', gap: 10 }}>
              {hasVisualCustomization && (!isEditingDraft || isDirty) && (
                <SecondaryBtn onClick={resetVisualToGlobal} style={{ padding: '10px', fontSize: 12, flex: 1, justifyContent: 'center' }}>
                  Redefinir para o padrão global
                </SecondaryBtn>
              )}
              {!isEditingDraft && isDirty && (
                <SecondaryBtn onClick={restoreSavedModel} style={{ padding: '10px', fontSize: 12, flex: 1, justifyContent: 'center' }}>
                  Restaurar versão salva
                </SecondaryBtn>
              )}
            </div>
          )}
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
      )}
    </>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

      {logoModalOpen && (
        <LogoPositionModal
          logoUrl={theme.logoUrl}
          posX={editingConfig.logoPosX ?? theme.logoPosX}
          posY={editingConfig.logoPosY ?? theme.logoPosY}
          uploading={uploading}
          onChangePosition={(x, y) => { updateConfig('logoPosX', x); updateConfig('logoPosY', y) }}
          onUpload={file => uploadLogoFile(file, 'logoUrl')}
          onClose={() => setLogoModalOpen(false)}
        />
      )}

      {createModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: t.night2, padding: 32, borderRadius: 12, width: 400, maxWidth: '90vw', border: `1px solid rgba(255,255,255,0.1)` }}>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, color: t.fg }}>Nomeie seu modelo</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: t.fg3, lineHeight: 1.5 }}>As alterações serão salvas como um novo modelo pessoal.</p>
            <input
              type="text"
              value={newTemplateName}
              onChange={e => setNewTemplateName(e.target.value)}
              placeholder="Nome do Modelo"
              style={{ width: '100%', padding: '12px', background: t.night, border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, color: t.fg, marginBottom: 24, fontSize: 14, boxSizing: 'border-box' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreateModalOpen(false)} style={modalBtnSecondary}>Cancelar</button>
              <button onClick={confirmCreateTemplate} disabled={!newTemplateName.trim()} style={{ ...modalBtnPrimary, opacity: !newTemplateName.trim() ? 0.5 : 1 }}>Salvar modelo</button>
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

function TemplateCard({ label, isActive, isSelected, gradient, onSelect, onEdit, onActivate, onDelete, activeLabel, cardRef }: {
  label: string
  isActive: boolean
  isSelected: boolean
  gradient: string
  onSelect: () => void
  onEdit?: () => void
  onActivate?: () => void
  onDelete?: () => void
  activeLabel?: string
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
        title={isActive ? (activeLabel ?? 'Este é o padrão geral ativo') : 'Tornar este o padrão geral'}
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

// Aba "Blocos" do editor de um Modelo (2026-07-27, ver feature-modelos-de-mapa.md
// Fase 1 — REFEITA em tela cheia, reaproveitando a MESMA casca de /app/blocos,
// `DocumentOrganizerView`, em vez da mini-lista comprimida da 1ª versão desta
// aba). `editingConfig.blockOrder` ausente = este modelo HERDA a ordem/
// visibilidade GLOBAL; presente = ordem PRÓPRIA, independente do que o
// consultor mudar depois no padrão global (tudo-ou-nada — uma lista não tem
// um "meio-termo" óbvio como texto tem).
//
// Design: o painel SEMPRE mostra a ordem EFETIVA (própria, ou uma cópia do
// global enquanto herdando) — arrastar/ocultar qualquer bloco PROMOVE
// automaticamente pra "própria" (grava em `blockOrder`, mesmo que ainda
// idêntica ao global no instante da 1ª mudança). O botão extra do rodapé
// ("Herdar do padrão global") só aparece quando já personalizado, e é o único
// jeito de sair da personalização — sem um passo explícito de "ativar"
// separado, ficando mais fiel à própria página /app/blocos (que também não
// tem esse conceito).
function ModeloBlocosTab({ theme, profile, editingConfig, modelId, modelName, isDirty, isEditingDraft, onRestoreSaved, onChangeBlockOrder }: {
  theme: DocTheme
  profile: UserProfile
  editingConfig: any
  modelId: string
  modelName: string
  isDirty: boolean
  isEditingDraft: boolean
  onRestoreSaved: () => void
  onChangeBlockOrder: (next: BlockOrderConfig | undefined) => void
}) {
  const navigate = useNavigate()
  const [sampleIdentity, setSampleIdentity] = useState<SampleIdentity | null>(null)
  const [sampleMap, setSampleMap] = useState<NumerologyMap | null>(null)
  const [interp, setInterp] = useState<InterpretationMap | null>(null)

  useEffect(() => {
    loadSampleClient().then(({ identity, map }) => {
      setSampleIdentity(identity)
      setSampleMap(map)
      loadSampleInterpretations(map).then(setInterp)
    })
  }, [])

  const globalOrder = useMemo(() => normalizeBlockOrder(profile.block_order), [profile.block_order])
  const value: BlockOrderConfig | null = editingConfig.blockOrder ?? null
  const effectiveConfig = value ?? globalOrder

  const previewReady = !!(sampleMap && interp && sampleIdentity)
  const blocks = useMemo(
    () => (previewReady ? buildDocumentBlocks(sampleMap!, sampleIdentity!.subject, sampleIdentity!.dataNascimento, interp!, effectiveConfig) : []),
    [previewReady, sampleMap, sampleIdentity, interp, effectiveConfig],
  )
  const pages = useMeasuredPages(blocks, theme)
  const tocEntries = useMemo(() => pages ? buildTocEntriesFromPages(effectiveConfig, pages) : undefined, [effectiveConfig, pages])

  if (!previewReady || !pages) {
    return (
      <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: t.fg3, fontFamily: t.body, fontSize: 13 }}>
        Montando preview...
      </div>
    )
  }

  return (
    <DocumentOrganizerView
      theme={theme}
      blocks={blocks}
      pages={pages}
      tocEntries={tocEntries}
      subject={sampleIdentity!.subject}
      dataNascimento={sampleIdentity!.dataNascimento}
      isPro
      docTitle={`${sampleIdentity!.subject} — Blocos (${modelName})`}
      pageCount={pages.length + 1 + (tocEntries?.length ? 1 : 0)}
      config={effectiveConfig}
      onConfigChange={onChangeBlockOrder}
      onEditBlockText={blockId => {
        const target = getBlockTextTarget(blockId)
        if (target) navigate(`/app/marca/${modelId}/textos?tipo=${encodeURIComponent(target.tipo)}&view=${target.view}`)
      }}
      panelTitle="Blocos deste Modelo"
      panelInfo="Arraste para reordenar e clique no olho para ocultar ou exibir um bloco no PDF gerado com este modelo. Qualquer mudança aqui passa a valer só para este modelo — o padrão global e os demais modelos continuam intactos."
      scope="modelo"
      footerExtra={value !== null || (!isEditingDraft && isDirty) ? (
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {value !== null && <SecondaryBtn onClick={() => onChangeBlockOrder(undefined)} style={{ padding: '10px', fontSize: 12, flex: 1, justifyContent: 'center' }}>
            Redefinir para o padrão global
          </SecondaryBtn>}
          {!isEditingDraft && isDirty && <SecondaryBtn onClick={onRestoreSaved} style={{ padding: '10px', fontSize: 12, flex: 1, justifyContent: 'center' }}>
            Restaurar versão salva
          </SecondaryBtn>}
        </div>
      ) : undefined}
    />
  )
}

// Aba "Textos" do editor de um Modelo — placeholder desta etapa (Fase 2 do
// plano, ver feature-modelos-de-mapa.md: a cascata de resolução de textos
// precisa primeiro generalizar o marcador `sistema: boolean` pra um alvo de 3
// vias antes de ganhar uma camada nova sem ambiguidade no "restaurar"). Vai
// virar tela cheia reaproveitando a grade de /app/textos, igual ao Blocos.
// Aba "Textos" do editor de um Modelo (2026-07-27, Fase 2 do plano) —
// reaproveita o MESMO componente `CustomTexts` de /app/textos (grade,
// categorias, editor, versionamento — nada duplicado), só trocando ONDE ele
// lê e grava via um `TextsAdapter` (ver CustomTexts.tsx): as personalizações
// deste modelo SOBREPÕEM a cascata global inteira (personalização global,
// e o padrão do sistema quando não há personalização global) — sem override
// do modelo pra uma célula, `fetchEffective` cai direto em `fetchInterpretation`
// (a MESMA função que resolve a cascata global hoje), então o editor sempre
// mostra e edita o valor EFETIVO, venha de onde vier.
function makeModeloTextsAdapter(overrides: TextOverrides, onPersist: (next: TextOverrides) => Promise<void>): TextsAdapter {
  return {
    async fetchEffective(numero, tipo) {
      const local = overrideTexto(overrides?.[numero]?.[tipo])
      if (local) return { texto: local, isOverridden: true }
      const res = await fetchInterpretation(numero, tipo)
      return res ? { texto: res.texto, isOverridden: false } : null
    },
    async saveOverride(numero, tipo, texto) {
      const byNumero = { ...(overrides[numero] ?? {}) }
      if (texto === null) {
        delete byNumero[tipo]
      } else {
        byNumero[tipo] = texto
      }
      const next = { ...overrides }
      if (Object.keys(byNumero).length === 0) delete next[numero]
      else next[numero] = byNumero
      await onPersist(next)
    },
    async listOverrideKeys() {
      const keys: { numero: number; tipo: string }[] = []
      Object.entries(overrides ?? {}).forEach(([numeroStr, byTipo]) => {
        Object.keys(byTipo ?? {}).forEach(tipo => keys.push({ numero: Number(numeroStr), tipo }))
      })
      return keys
    },
    async clearAllOverrides() {
      await onPersist({})
    },
  }
}

function ModeloTextosTab({ modelName, textOverrides, onPersist }: {
  modelName: string
  textOverrides: TextOverrides
  onPersist: (next: TextOverrides) => Promise<void>
}) {
  const adapter = useMemo(() => makeModeloTextsAdapter(textOverrides, onPersist), [textOverrides, onPersist])
  return (
    <CustomTexts
      adapter={adapter}
      scope="modelo"
      title={`Textos — ${modelName}`}
      info={`Sobrepõe, só para o modelo "${modelName}", qualquer texto do padrão global. Nesta tela, Salvar adiciona o texto ao rascunho do modelo; use "Salvar modelo" no cabeçalho para gravar aparência, blocos e textos de uma vez.`}
      restoreTargetLabel={`ao que está definido em "Alterações Globais → Textos" (a personalização global, ou o padrão do sistema)`}
    />
  )
}

function Section({ title, info, children }: { title: string; info?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 13, fontWeight: 700,
        color: t.magenta, fontFamily: t.body,
        paddingBottom: 8, marginBottom: 12, borderBottom: `1px solid ${t.pb}`,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{title}</span>
        {info && <InfoButton text={info} />}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

/** Subdivisão de 2º nível (dentro de uma `Section`) — "Fonte"/"Posição"
 *  dentro de Logo/Título/Nome do Cliente. 2026-07-29: ganhou estilo PRÓPRIO
 *  (Guilherme: "para outros subtítulos dentro dos separadores, adicionar um
 *  outro estilo, talvez diminuir o tamanho da fonte") — 10px (era 11px) e
 *  sem uppercase/letter-spacing, pra diferenciar claramente dos 2 níveis
 *  acima só por tamanho, não por maiúsculas. */
function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  // 12px (era 10px) — Guilherme, 2026-07-29: "os títulos do sub-separador
  // [Fonte/Posição] usem um tamanho de fonte maior, porém levemente menos
  // que o sub-separador anterior [Section, 13px]" — 12 fica entre os dois.
  return (
    <div>
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: t.fg3, fontFamily: t.body,
        paddingBottom: 6, marginBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function SelectControl({ children, style, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <select
        {...props}
        style={{
          appearance: 'none', width: '100%', minHeight: 36,
          background: t.night, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
          padding: '7px 38px 7px 10px', fontSize: 13, color: t.fg,
          cursor: props.disabled ? 'default' : 'pointer', outline: 'none', boxSizing: 'border-box',
          ...style,
        }}
      >
        {children}
      </select>
      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', color: t.fg3, pointerEvents: 'none' }}>
        <ChevronIcon open={false} size={14} />
      </span>
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

/** Botão de estilo (negrito/itálico) tipo toggle — pill que acende quando
 *  ativo, mesmo princípio visual do `TabBar` (borda+fundo dourados). */
/** Botão quadrado padronizado (32px × 32px) compartilhado para seleção de
 *  propriedades de texto (negrito, itálico, sublinhado), alinhamento de texto e
 *  posicionamento (âncora). */
function SquarePropertyBtn({
  active,
  onClick,
  title,
  edge,
  children,
  size = 32,
}: {
  active: boolean
  onClick: () => void
  title: string
  edge?: 'left' | 'right' | 'top' | 'bottom' | 'center'
  children?: React.ReactNode
  size?: number
}) {
  const accent = active ? t.gold : t.fg4
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 4,
    padding: 0,
    cursor: 'pointer',
    border: `1px solid ${active ? t.gold : t.pb}`,
    background: active ? 'rgba(253,184,19,.12)' : 'transparent',
    color: active ? t.gold : t.fg2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
  if (edge === 'left') style.borderLeft = `2px solid ${accent}`
  if (edge === 'right') style.borderRight = `2px solid ${accent}`
  if (edge === 'top') style.borderTop = `2px solid ${accent}`
  if (edge === 'bottom') style.borderBottom = `2px solid ${accent}`

  return (
    <button type="button" title={title} onClick={onClick} style={style}>
      {edge === 'center' ? <span style={{ width: 6, height: 6, borderRadius: 1, background: accent }} /> : children}
    </button>
  )
}

function StyleToggleBtn({ active, onClick, title, children }: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <SquarePropertyBtn active={active} onClick={onClick} title={title}>
      {children}
    </SquarePropertyBtn>
  )
}

/** Seletor de opção única, lado a lado, estilo pill (2026-07-29, Guilherme:
 *  "as opções de escolha de cabeçalho e de usar texto ou imagem com logo
 *  devem ser feitas com checkbox, marcar a opção, e não toggle [select] que
 *  desce com as opções... deve ficar lado a lado se couber, use palavras
 *  únicas sucintas... não precisa repetir o que se refere, pois o subtítulo
 *  do separador já diz a que parte se refere") — substitui os `<select>` de
 *  Cabeçalho da Capa/Tipo de Logo/Nome do Cliente. Mesmo princípio visual
 *  do `StyleToggleBtn` (borda+fundo dourados quando ativo). */
function PillSelect<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value} type="button" onClick={() => onChange(opt.value)}
            style={{
              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${active ? t.gold : t.pb}`,
              background: active ? 'rgba(253,184,19,.12)' : 'transparent',
              color: active ? t.gold : t.fg2,
              fontSize: 13, fontFamily: t.body, fontWeight: active ? 700 : 400,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function AnchorSquare({ active, edge, onClick, title }: {
  active: boolean
  edge: 'left' | 'right' | 'top' | 'bottom' | 'center'
  onClick: () => void
  title: string
}) {
  return <SquarePropertyBtn active={active} edge={edge} onClick={onClick} title={title} />
}

function AnchorPicker({ h, onH, v, onV }: {
  h: HorizontalAlign; onH: (v: HorizontalAlign) => void
  v: VerticalAlign; onV: (v: VerticalAlign) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div>
        <div style={{ fontSize: 10, color: t.fg4, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.03em' }}>Horizontal</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <AnchorSquare active={h === 'left'} edge="left" onClick={() => onH('left')} title="Esquerda" />
          <AnchorSquare active={h === 'center'} edge="center" onClick={() => onH('center')} title="Centro" />
          <AnchorSquare active={h === 'right'} edge="right" onClick={() => onH('right')} title="Direita" />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: t.fg4, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.03em' }}>Vertical</div>
        <div style={{ display: 'flex', gap: 4 }}>
          <AnchorSquare active={v === 'top'} edge="top" onClick={() => onV('top')} title="Topo" />
          <AnchorSquare active={v === 'center'} edge="center" onClick={() => onV('center')} title="Centro" />
          <AnchorSquare active={v === 'bottom'} edge="bottom" onClick={() => onV('bottom')} title="Base" />
        </div>
      </div>
    </div>
  )
}

function FontSizeSlider({ value, onChange, min, max }: {
  value: number; onChange: (v: number) => void
  min: number; max: number
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 12, color: t.fg2 }}>Tamanho da fonte</label>
        <span style={{ fontSize: 12, color: t.magenta, fontWeight: 600 }}>{value}pt</span>
      </div>
      <input
        type="range" min={min} max={max} step={1}
        value={value} onChange={e => onChange(parseInt(e.target.value, 10))}
        style={{ width: '100%', cursor: 'pointer' }}
      />
    </div>
  )
}

function FontControls({ size, onSize, sizeMin, sizeMax, font, onFont, color, onColor, colorStatus, bold, onBold, italic, onItalic, underline, onUnderline }: {
  size: number; onSize: (v: number) => void; sizeMin: number; sizeMax: number
  font: string; onFont: (v: string) => void
  color: string; onColor: (v: string) => void
  colorStatus?: WcagStatus
  bold: boolean; onBold: () => void
  italic: boolean; onItalic: () => void
  underline: boolean; onUnderline: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <FontSizeSlider value={size} onChange={onSize} min={sizeMin} max={sizeMax} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: t.fg2, marginBottom: 4 }}>Estilo de fonte</label>
          <SelectControl
            value={font} onChange={e => onFont(e.target.value)}
          >
            {COVER_FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </SelectControl>
        </div>
        <ColorPicker label="Cor da fonte" value={color} status={colorStatus} onChange={onColor} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <StyleToggleBtn active={bold} onClick={onBold} title="Negrito"><BoldIcon size={14} /></StyleToggleBtn>
        <StyleToggleBtn active={underline} onClick={onUnderline} title="Sublinhado"><UnderlineIcon size={14} /></StyleToggleBtn>
        <StyleToggleBtn active={italic} onClick={onItalic} title="Itálico"><ItalicIcon size={14} /></StyleToggleBtn>
      </div>
    </div>
  )
}

function TextAlignPicker({ value, onChange }: {
  value: 'left' | 'center' | 'right'
  onChange: (v: 'left' | 'center' | 'right') => void
}) {
  const options: { value: 'left' | 'center' | 'right'; label: string; icon: React.ReactNode }[] = [
    { value: 'left', label: 'Esquerda', icon: <AlignLeftIcon size={14} /> },
    { value: 'center', label: 'Centro', icon: <AlignCenterIcon size={14} /> },
    { value: 'right', label: 'Direita', icon: <AlignRightIcon size={14} /> },
  ]
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map(opt => (
        <SquarePropertyBtn
          key={opt.value}
          active={value === opt.value}
          onClick={() => onChange(opt.value)}
          title={opt.label}
        >
          {opt.icon}
        </SquarePropertyBtn>
      ))}
    </div>
  )
}
