// Resolves the document theme based on user plan and profile settings.
// Pro users get custom colors/logo; Essencial users get Vibraweb branding.

import type { UserProfile } from './neon'

/** Posição vertical do conteúdo dentro de um container da capa — mesmos
 *  termos de Word/PowerPoint/Canva pro alinhamento vertical de texto.
 *  Usado tanto pelo container de Texto pequeno (1 eixo só) quanto como o
 *  eixo vertical de `HorizontalAlign` pro texto-logo/título/cliente
 *  (2 eixos independentes — ver comentário lá). */
export type VerticalAlign = 'top' | 'center' | 'bottom'

/** Posição horizontal — o eixo irmão de `VerticalAlign`. Juntos formam a
 *  posição 2D do texto-logo/título/nome-do-cliente: 2026-07-29 (Guilherme,
 *  depois de eu ter feito um grid único de 5 "âncoras" tipo cruz —
 *  center/left/right/top/bottom, só 5 combinações possíveis, sem diagonais):
 *  "separe posicionamento vertical e posicionamento horizontal, pois eu
 *  posso marcar horizontalmente à esquerda E verticalmente no centro — duas
 *  opções, mas não posso marcar esquerda E direita [do mesmo eixo]" — ou
 *  seja, 2 grupos independentes de seleção única (3 posições cada),
 *  compondo as 9 combinações possíveis (inclusive diagonais), no padrão
 *  profissional de alinhamento 2D (Figma/Sketch/PowerPoint: grupo
 *  horizontal + grupo vertical, nunca um único seletor de 9 pontos). */
export type HorizontalAlign = 'left' | 'center' | 'right'

/** Modo do cabeçalho da CAPA (distinto do cabeçalho geral de página) —
 *  'inherit' usa a config de "Cabeçalho (Páginas)" tal como está; 'custom'
 *  usa logo/texto próprios só da capa; 'none' não mostra cabeçalho na capa
 *  (comportamento de antes desta feature). */
export type CoverHeaderMode = 'inherit' | 'custom' | 'none'

/** Logo da capa como imagem enviada, ou como texto estilizável (fonte,
 *  negrito, itálico, cor, âncora). */
export type LogoMode = 'image' | 'text'

/** Nome do cliente na capa: o nome real da análise (`subject`), ou um texto
 *  fixo customizado (útil pra modelos de demonstração/mockup). */
export type ClientNameMode = 'analysis' | 'custom'

/** Presets visuais oficiais do Vibraweb. Mantemos uma chave estável para que
 * novos estilos possam ser adicionados sem quebrar templates existentes. */
export type ReportStyle = 'vibracao' | 'modern' | 'holistic' | 'minimalist' | 'default'
export type OrnamentDividerKey = 'none' | 'flourish' | 'line'

/** Lista curada de fontes (Google Fonts) pro texto-logo/título/nome-do-
 *  cliente — não um campo de texto livre, pra garantir que a fonte
 *  escolhida sempre carrega igual no preview E no PDF impresso (ver
 *  `COVER_FONTS_GOOGLE_URL`, usado tanto por `index.html` quanto por
 *  `print-document.ts`, fonte única da verdade da lista). */
export const COVER_FONT_OPTIONS = [
  'Poppins', 'Inter', 'Playfair Display', 'Montserrat',
  'Merriweather', 'Lora', 'Raleway', 'Oswald', 'Cinzel',
  'Cormorant Garamond', 'UnifrakturCook', 'Georgia', 'Arial',
] as const

export type CoverFont = typeof COVER_FONT_OPTIONS[number]

export const COVER_FONTS_GOOGLE_URL =
  'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,900;1,700' +
  '&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,600' +
  '&family=Playfair+Display:ital,wght@0,700;0,900;1,700' +
  '&family=Montserrat:ital,wght@0,600;0,700;0,900;1,700' +
  '&family=Merriweather:ital,wght@0,700;0,900;1,700' +
  '&family=Lora:ital,wght@0,600;0,700;1,700' +
  '&family=Raleway:ital,wght@0,600;0,700;0,900;1,700' +
  '&family=Oswald:ital,wght@0,600;0,700' +
  '&family=Cinzel:wght@500;600;700' +
  '&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500;1,600' +
  '&family=UnifrakturCook:wght@400' +
  '&display=swap'

export interface DocTheme {
  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string

  // Cover
  logoUrl: string | null
  coverLogoScale: number
  companyName: string
  companyContact: string
  coverProductTitle: string
  coverTopText: string
  coverTopTextAlign: VerticalAlign

  // Cover: cabeçalho próprio da capa (distinto do cabeçalho geral abaixo)
  coverHeaderMode: CoverHeaderMode
  coverHeaderLogoUrl: string | null
  coverHeaderRightText: string

  // Cover: logo (imagem com posição livre, ou texto estilizável)
  logoMode: LogoMode
  logoPosX: number
  logoPosY: number
  // `coverLogoScale` continua sendo o único controle de tamanho pro modo
  // Imagem (uma escala faz sentido pra imagem — amplia/reduz). Pro modo
  // Texto, 2026-07-29 (Guilherme: "ao invés de escala, no caso de textos
  // vamos usar pt"): `logoTextFontSize` é um valor ABSOLUTO em pt, não
  // mais `24 * coverLogoScale`.
  logoTextFontSize: number
  logoTextFont: CoverFont
  logoTextBold: boolean
  logoTextItalic: boolean
  logoTextUnderline: boolean
  logoTextColor: string
  logoTextAnchorH: HorizontalAlign
  logoTextAnchorV: VerticalAlign

  // Cover: título do produto (fonte/estilo/âncora próprios)
  titleFontSize: number
  titleFont: CoverFont
  titleBold: boolean
  titleItalic: boolean
  titleUnderline: boolean
  titleColor: string
  titleAnchorH: HorizontalAlign
  titleAnchorV: VerticalAlign

  // Cover: nome do cliente (da análise, ou customizado; fonte/estilo/âncora)
  clientNameMode: ClientNameMode
  clientNameCustom: string
  clientFontSize: number
  clientFont: CoverFont
  clientBold: boolean
  clientItalic: boolean
  clientUnderline: boolean
  clientColor: string
  clientAnchorH: HorizontalAlign
  clientAnchorV: VerticalAlign

  // Header — 2026-07-29: ganhou fonte/tamanho/cor/estilo próprios (antes só
  // tinha logo/texto sem nenhum controle de aparência de texto). Um conjunto
  // só, aplicado aos 2 pedaços de texto do cabeçalho (nome/logo-texto à
  // esquerda + texto à direita) — mesmo princípio de unificação já usado
  // pra H3/H4.
  showHeader: boolean
  headerLogoUrl: string | null
  headerRightText: string
  headerFontSize: number
  headerFont: CoverFont
  headerColor: string
  headerBold: boolean
  headerItalic: boolean
  headerUnderline: boolean

  // Footer — mesmo princípio do Header, aplicado às 3 colunas do rodapé.
  showFooter: boolean
  footerColumns: 1 | 2 | 3
  footerLeft: string
  footerCenter: string
  footerRight: string
  footerFontSize: number
  footerFont: CoverFont
  footerColor: string
  footerBold: boolean
  footerItalic: boolean
  footerUnderline: boolean

  // System
  showWatermark: boolean
  showVibrawebBranding: boolean

  // Elements
  stylePreset: ReportStyle
  ornamentDividerKey: OrnamentDividerKey
  ornamentColor: string
  quoteStyle: 'minimal' | 'subtle' | 'accented'

  /** Quando true: sem elementos gráficos (badges de número, barras coloridas,
   *  cards, chips). Usado pelo preset "Texto Puro" — só tipografia e espaçamento. */
  plainTextMode: boolean

  // Corpo do documento — H1 (título de seção), H2 (sub-título), H3 (nível 3), H4 (nível 4) e Parágrafo
  // cada um com fonte, tamanho, estilo (negrito/itálico/sublinhado), cor e alinhamento próprios.
  h1FontSize: number
  h1Font: CoverFont
  h1Bold: boolean
  h1Italic: boolean
  h1Underline: boolean
  h1Color: string
  h1TextAlign: 'left' | 'center' | 'right'

  h2FontSize: number
  h2Font: CoverFont
  h2Bold: boolean
  h2Italic: boolean
  h2Underline: boolean
  h2Color: string
  h2TextAlign: 'left' | 'center' | 'right'

  h3FontSize: number
  h3Font: CoverFont
  h3Bold: boolean
  h3Italic: boolean
  h3Underline: boolean
  h3Color: string
  h3TextAlign: 'left' | 'center' | 'right'

  h4FontSize: number
  h4Font: CoverFont
  h4Bold: boolean
  h4Italic: boolean
  h4Underline: boolean
  h4Color: string
  h4TextAlign: 'left' | 'center' | 'right'

  bodyFontSize: number
  bodyFont: CoverFont
  bodyBold: boolean
  bodyItalic: boolean
  bodyUnderline: boolean
  bodyColor: string
}

export const VIBRAWEB_DEFAULTS: DocTheme = {
  primaryColor: '#581C3C',
  secondaryColor: '#C0397B',
  accentColor: '#FDB813',

  logoUrl: '/assets/logo-vibraweb.svg',
  coverLogoScale: 1,
  companyName: 'Vibraweb',
  companyContact: 'vibraweb.com.br',
  coverProductTitle: 'Mapa Numerológico Pessoal',
  coverTopText: '',
  coverTopTextAlign: 'top',

  coverHeaderMode: 'none',
  coverHeaderLogoUrl: null,
  coverHeaderRightText: '',

  logoMode: 'image',
  logoPosX: 50,
  logoPosY: 50,
  logoTextFontSize: 24,
  logoTextFont: 'Poppins',
  logoTextBold: true,
  logoTextItalic: false,
  logoTextUnderline: false,
  logoTextColor: '#C0397B',
  logoTextAnchorH: 'center',
  logoTextAnchorV: 'center',

  titleFontSize: 30,
  titleFont: 'Poppins',
  titleBold: true,
  titleItalic: false,
  titleUnderline: false,
  titleColor: '#581C3C',
  titleAnchorH: 'center',
  titleAnchorV: 'center',

  clientNameMode: 'analysis',
  clientNameCustom: '',
  clientFontSize: 20,
  clientFont: 'Poppins',
  clientBold: true,
  clientItalic: false,
  clientUnderline: false,
  clientColor: '#C0397B',
  clientAnchorH: 'center',
  clientAnchorV: 'center',

  showHeader: true,
  headerLogoUrl: '/assets/logo-vibraweb.svg',
  headerRightText: '',
  headerFontSize: 12,
  headerFont: 'Poppins',
  headerColor: '#C0397B',
  headerBold: true,
  headerItalic: false,
  headerUnderline: false,

  showFooter: true,
  footerColumns: 2,
  footerLeft: 'contato@vibraweb.com.br',
  footerCenter: '',
  footerRight: 'vibraweb.com.br',
  footerFontSize: 8,
  footerFont: 'Inter',
  footerColor: '#999999',
  footerBold: false,
  footerItalic: false,
  footerUnderline: false,

  showWatermark: true,
  showVibrawebBranding: true,

  stylePreset: 'vibracao',
  ornamentDividerKey: 'none',
  ornamentColor: '#2457C5',
  quoteStyle: 'accented',
  plainTextMode: false,

  h1FontSize: 20,
  h1Font: 'Poppins',
  h1Bold: true,
  h1Italic: false,
  h1Underline: false,
  h1Color: '#9A5A00',
  h1TextAlign: 'center',

  h2FontSize: 18,
  h2Font: 'Poppins',
  h2Bold: true,
  h2Italic: false,
  h2Underline: false,
  h2Color: '#C0397B',
  h2TextAlign: 'left',

  h3FontSize: 16,
  h3Font: 'Poppins',
  h3Bold: true,
  h3Italic: false,
  h3Underline: false,
  h3Color: '#C0397B',
  h3TextAlign: 'left',

  h4FontSize: 14,
  h4Font: 'Poppins',
  h4Bold: true,
  h4Italic: false,
  h4Underline: false,
  h4Color: '#4C2A68',
  h4TextAlign: 'left',

  bodyFontSize: 11,
  bodyFont: 'Inter',
  bodyBold: false,
  bodyItalic: false,
  bodyUnderline: false,
  bodyColor: '#352632',
}

// ── Contraste WCAG (Item 2, Fase 1) ─────────────────────────────────────────
// Não existia em theme-resolver.ts até agora — usado pelo badge "AA — ok" /
// "AA — atenção" no editor de Cores e Tipografia (BrandPage). Cálculo client-side,
// puramente visual (não persiste nada). Ver Produto/docs/vibra-web/requisitos.md, seção 2.

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim()
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean
  const num = parseInt(full, 16)
  if (isNaN(num) || full.length !== 6) return [0, 0, 0]
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const linear = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const [rl, gl, bl] = [linear(r), linear(g), linear(b)]
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/** Razão de contraste WCAG (1 a 21) entre duas cores hex. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA))
  const lB = relativeLuminance(hexToRgb(hexB))
  const lighter = Math.max(lA, lB)
  const darker = Math.min(lA, lB)
  return (lighter + 0.05) / (darker + 0.05)
}

export type WcagStatus = 'ok' | 'atencao'

/** largeText = true para H1/H2 (limiar 3:1); false para corpo de texto (limiar 4.5:1). */
export function wcagStatus(foreground: string, background: string, largeText = false): WcagStatus {
  const ratio = contrastRatio(foreground, background)
  const threshold = largeText ? 3 : 4.5
  return ratio >= threshold ? 'ok' : 'atencao'
}

export function resolveDocTheme(profile: UserProfile | null): DocTheme {
  const isPro = profile?.plan === 'pro' || profile?.role === 'admin'
  const isGlobalTemplate = profile?.brand_config?.activeTemplateId === 'global'

  if ((!isPro && !isGlobalTemplate) || !profile) {
    return {
      ...VIBRAWEB_DEFAULTS,
      companyName: profile?.consultant_name ?? VIBRAWEB_DEFAULTS.companyName,
      companyContact: profile?.consultant_contact ?? VIBRAWEB_DEFAULTS.companyContact,
    }
  }

  // Pro plan: merge brand_config with defaults
  let config = profile.brand_config || {}
  
  // Backwards compatibility and template structure support
  if (config.activeTemplateId === 'default') {
    config = {} // Use default colors
  } else if (config.activeTemplateId && Array.isArray(config.templates)) {
    const activeTpl = config.templates.find((t: any) => t.id === config.activeTemplateId)
    if (activeTpl) {
      config = activeTpl.config || {}
    } else if (config.templates.length > 0) {
      config = config.templates[0].config || {}
    } else {
      config = {}
    }
  } else if (!config.activeTemplateId && !config.primaryColor) {
    // Blank profile without any settings, treat as default
    config = {}
  }

  // Resolve global font cascades: globalTitleFont → h1-h4, globalBodyFont → body
  const resolvedTitleFont = config.globalTitleFont || null
  const resolvedBodyFont = config.globalBodyFont || null
  // O template global entrega a identidade do Vibraweb, mas a marca que o
  // consultor cadastrou no próprio perfil assume o lugar dela automaticamente.
  // Em modelos pessoais, uma logo salva no modelo continua tendo prioridade.
  const useProfileLogo = isGlobalTemplate && !!profile.logo_url
  const resolvedLogoUrl = useProfileLogo
    ? profile.logo_url
    : config.logoUrl ?? profile.logo_url ?? VIBRAWEB_DEFAULTS.logoUrl
  const resolvedHeaderLogoUrl = useProfileLogo
    ? profile.logo_url
    : config.headerLogoUrl ?? profile.logo_url ?? VIBRAWEB_DEFAULTS.headerLogoUrl

  return {
    primaryColor: config.primaryColor || VIBRAWEB_DEFAULTS.primaryColor,
    secondaryColor: config.secondaryColor || VIBRAWEB_DEFAULTS.secondaryColor,
    accentColor: config.accentColor || VIBRAWEB_DEFAULTS.accentColor,
    h1Color: config.h1Color || (config.primaryColor || VIBRAWEB_DEFAULTS.h1Color),
    h2Color: config.h2Color || (config.primaryColor || VIBRAWEB_DEFAULTS.h2Color),
    h3Color: config.h3Color || (config.primaryColor || VIBRAWEB_DEFAULTS.h3Color),
    h4Color: config.h4Color || VIBRAWEB_DEFAULTS.h4Color,
    bodyColor: config.bodyColor || VIBRAWEB_DEFAULTS.bodyColor,

    logoUrl: resolvedLogoUrl,
    coverLogoScale: config.coverLogoScale ?? VIBRAWEB_DEFAULTS.coverLogoScale,
    companyName: config.companyName ?? profile.consultant_name ?? VIBRAWEB_DEFAULTS.companyName,
    companyContact: config.companyContact ?? profile.consultant_contact ?? VIBRAWEB_DEFAULTS.companyContact,
    coverProductTitle: config.coverProductTitle ?? VIBRAWEB_DEFAULTS.coverProductTitle,
    coverTopText: config.coverTopText ?? VIBRAWEB_DEFAULTS.coverTopText,
    coverTopTextAlign: config.coverTopTextAlign ?? VIBRAWEB_DEFAULTS.coverTopTextAlign,

    coverHeaderMode: config.coverHeaderMode ?? VIBRAWEB_DEFAULTS.coverHeaderMode,
    coverHeaderLogoUrl: config.coverHeaderLogoUrl ?? VIBRAWEB_DEFAULTS.coverHeaderLogoUrl,
    coverHeaderRightText: config.coverHeaderRightText ?? VIBRAWEB_DEFAULTS.coverHeaderRightText,

    logoMode: config.logoMode ?? VIBRAWEB_DEFAULTS.logoMode,
    logoPosX: config.logoPosX ?? VIBRAWEB_DEFAULTS.logoPosX,
    logoPosY: config.logoPosY ?? VIBRAWEB_DEFAULTS.logoPosY,
    logoTextFontSize: config.logoTextFontSize ?? VIBRAWEB_DEFAULTS.logoTextFontSize,
    logoTextFont: config.logoTextFont ?? VIBRAWEB_DEFAULTS.logoTextFont,
    logoTextBold: config.logoTextBold ?? VIBRAWEB_DEFAULTS.logoTextBold,
    logoTextItalic: config.logoTextItalic ?? VIBRAWEB_DEFAULTS.logoTextItalic,
    logoTextUnderline: config.logoTextUnderline ?? VIBRAWEB_DEFAULTS.logoTextUnderline,
    logoTextColor: config.logoTextColor ?? (config.primaryColor || VIBRAWEB_DEFAULTS.logoTextColor),
    logoTextAnchorH: config.logoTextAnchorH ?? VIBRAWEB_DEFAULTS.logoTextAnchorH,
    logoTextAnchorV: config.logoTextAnchorV ?? VIBRAWEB_DEFAULTS.logoTextAnchorV,

    titleFontSize: config.titleFontSize ?? VIBRAWEB_DEFAULTS.titleFontSize,
    titleFont: config.titleFont ?? VIBRAWEB_DEFAULTS.titleFont,
    titleBold: config.titleBold ?? VIBRAWEB_DEFAULTS.titleBold,
    titleItalic: config.titleItalic ?? VIBRAWEB_DEFAULTS.titleItalic,
    titleUnderline: config.titleUnderline ?? VIBRAWEB_DEFAULTS.titleUnderline,
    titleColor: config.titleColor ?? (config.secondaryColor || VIBRAWEB_DEFAULTS.titleColor),
    titleAnchorH: config.titleAnchorH ?? VIBRAWEB_DEFAULTS.titleAnchorH,
    titleAnchorV: config.titleAnchorV ?? VIBRAWEB_DEFAULTS.titleAnchorV,

    clientNameMode: config.clientNameMode ?? VIBRAWEB_DEFAULTS.clientNameMode,
    clientNameCustom: config.clientNameCustom ?? VIBRAWEB_DEFAULTS.clientNameCustom,
    clientFontSize: config.clientFontSize ?? VIBRAWEB_DEFAULTS.clientFontSize,
    clientFont: config.clientFont ?? VIBRAWEB_DEFAULTS.clientFont,
    clientBold: config.clientBold ?? VIBRAWEB_DEFAULTS.clientBold,
    clientItalic: config.clientItalic ?? VIBRAWEB_DEFAULTS.clientItalic,
    clientUnderline: config.clientUnderline ?? VIBRAWEB_DEFAULTS.clientUnderline,
    clientColor: config.clientColor ?? (config.primaryColor || VIBRAWEB_DEFAULTS.clientColor),
    clientAnchorH: config.clientAnchorH ?? VIBRAWEB_DEFAULTS.clientAnchorH,
    clientAnchorV: config.clientAnchorV ?? VIBRAWEB_DEFAULTS.clientAnchorV,

    showHeader: config.showHeader ?? VIBRAWEB_DEFAULTS.showHeader,
    headerLogoUrl: resolvedHeaderLogoUrl,
    headerRightText: config.headerRightText ?? VIBRAWEB_DEFAULTS.headerRightText,
    headerFontSize: config.headerFontSize ?? VIBRAWEB_DEFAULTS.headerFontSize,
    headerFont: config.headerFont ?? VIBRAWEB_DEFAULTS.headerFont,
    headerColor: config.headerColor ?? (config.primaryColor || VIBRAWEB_DEFAULTS.headerColor),
    headerBold: config.headerBold ?? VIBRAWEB_DEFAULTS.headerBold,
    headerItalic: config.headerItalic ?? VIBRAWEB_DEFAULTS.headerItalic,
    headerUnderline: config.headerUnderline ?? VIBRAWEB_DEFAULTS.headerUnderline,

    showFooter: config.showFooter ?? VIBRAWEB_DEFAULTS.showFooter,
    footerColumns: config.footerColumns ?? VIBRAWEB_DEFAULTS.footerColumns,
    footerLeft: config.footerLeft ?? VIBRAWEB_DEFAULTS.footerLeft,
    footerCenter: config.footerCenter ?? VIBRAWEB_DEFAULTS.footerCenter,
    footerRight: config.footerRight ?? VIBRAWEB_DEFAULTS.footerRight,
    footerFontSize: config.footerFontSize ?? VIBRAWEB_DEFAULTS.footerFontSize,
    footerFont: config.footerFont ?? VIBRAWEB_DEFAULTS.footerFont,
    footerColor: config.footerColor ?? VIBRAWEB_DEFAULTS.footerColor,
    footerBold: config.footerBold ?? VIBRAWEB_DEFAULTS.footerBold,
    footerItalic: config.footerItalic ?? VIBRAWEB_DEFAULTS.footerItalic,
    footerUnderline: config.footerUnderline ?? VIBRAWEB_DEFAULTS.footerUnderline,

    // Global templates can shape the shared report for every workspace, but
    // Essential users still retain the plan watermark and Vibraweb branding.
    showWatermark: !isPro,
    showVibrawebBranding: !isPro,

    stylePreset: config.stylePreset ?? VIBRAWEB_DEFAULTS.stylePreset,
    ornamentDividerKey: config.ornamentDividerKey ?? VIBRAWEB_DEFAULTS.ornamentDividerKey,
    ornamentColor: config.ornamentColor ?? VIBRAWEB_DEFAULTS.ornamentColor,
    quoteStyle: config.quoteStyle ?? VIBRAWEB_DEFAULTS.quoteStyle,
    plainTextMode: config.plainTextMode ?? VIBRAWEB_DEFAULTS.plainTextMode,

    h1FontSize: config.h1FontSize ?? VIBRAWEB_DEFAULTS.h1FontSize,
    h1Font: config.h1Font ?? resolvedTitleFont ?? VIBRAWEB_DEFAULTS.h1Font,
    h1Bold: config.h1Bold ?? VIBRAWEB_DEFAULTS.h1Bold,
    h1Italic: config.h1Italic ?? VIBRAWEB_DEFAULTS.h1Italic,
    h1Underline: config.h1Underline ?? VIBRAWEB_DEFAULTS.h1Underline,
    h1TextAlign: config.h1TextAlign ?? VIBRAWEB_DEFAULTS.h1TextAlign,

    h2FontSize: config.h2FontSize ?? VIBRAWEB_DEFAULTS.h2FontSize,
    h2Font: config.h2Font ?? resolvedTitleFont ?? VIBRAWEB_DEFAULTS.h2Font,
    h2Bold: config.h2Bold ?? VIBRAWEB_DEFAULTS.h2Bold,
    h2Italic: config.h2Italic ?? VIBRAWEB_DEFAULTS.h2Italic,
    h2Underline: config.h2Underline ?? VIBRAWEB_DEFAULTS.h2Underline,
    h2TextAlign: config.h2TextAlign ?? VIBRAWEB_DEFAULTS.h2TextAlign,

    h3FontSize: config.h3FontSize ?? VIBRAWEB_DEFAULTS.h3FontSize,
    h3Font: config.h3Font ?? resolvedTitleFont ?? VIBRAWEB_DEFAULTS.h3Font,
    h3Bold: config.h3Bold ?? VIBRAWEB_DEFAULTS.h3Bold,
    h3Italic: config.h3Italic ?? VIBRAWEB_DEFAULTS.h3Italic,
    h3Underline: config.h3Underline ?? VIBRAWEB_DEFAULTS.h3Underline,
    h3TextAlign: config.h3TextAlign ?? VIBRAWEB_DEFAULTS.h3TextAlign,

    h4FontSize: config.h4FontSize ?? VIBRAWEB_DEFAULTS.h4FontSize,
    h4Font: config.h4Font ?? resolvedTitleFont ?? VIBRAWEB_DEFAULTS.h4Font,
    h4Bold: config.h4Bold ?? VIBRAWEB_DEFAULTS.h4Bold,
    h4Italic: config.h4Italic ?? VIBRAWEB_DEFAULTS.h4Italic,
    h4Underline: config.h4Underline ?? VIBRAWEB_DEFAULTS.h4Underline,
    h4TextAlign: config.h4TextAlign ?? VIBRAWEB_DEFAULTS.h4TextAlign,

    bodyFontSize: config.bodyFontSize ?? VIBRAWEB_DEFAULTS.bodyFontSize,
    bodyFont: config.bodyFont ?? resolvedBodyFont ?? VIBRAWEB_DEFAULTS.bodyFont,
    bodyBold: config.bodyBold ?? VIBRAWEB_DEFAULTS.bodyBold,
    bodyItalic: config.bodyItalic ?? VIBRAWEB_DEFAULTS.bodyItalic,
    bodyUnderline: config.bodyUnderline ?? VIBRAWEB_DEFAULTS.bodyUnderline,
  }
}
