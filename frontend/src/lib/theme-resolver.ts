// Resolves the document theme based on user plan and profile settings.
// Pro users get custom colors/logo; Essencial users get Vibraweb branding.

import type { UserProfile } from './supabase'

export interface DocTheme {
  // Colors
  primaryColor: string
  accentColor: string
  h1Color: string
  h2Color: string
  h3Color: string
  bodyColor: string

  // Cover
  logoUrl: string | null
  coverLogoScale: number
  companyName: string
  companyContact: string

  // Header
  showHeader: boolean
  headerLogoUrl: string | null
  headerRightText: string

  // Footer
  showFooter: boolean
  footerColumns: 1 | 2 | 3
  footerLeft: string
  footerCenter: string
  footerRight: string

  // System
  showWatermark: boolean
  showVibrawebBranding: boolean

  // Elements
  quoteStyle: 'minimal' | 'subtle' | 'accented'
}

export const VIBRAWEB_DEFAULTS: DocTheme = {
  primaryColor: '#C0397B',
  accentColor: '#FDB813',
  h1Color: '#1C1016',
  h2Color: '#C0397B',
  h3Color: '#C0397B',
  bodyColor: '#333333',

  logoUrl: null,
  coverLogoScale: 1,
  companyName: 'Vibraweb',
  companyContact: 'vibraweb.com.br',

  showHeader: true,
  headerLogoUrl: null,
  headerRightText: '',

  showFooter: true,
  footerColumns: 3,
  footerLeft: 'Vibraweb',
  footerCenter: 'vibraweb.com.br',
  footerRight: 'vibraweb.com.br',

  showWatermark: true,
  showVibrawebBranding: true,

  quoteStyle: 'accented',
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

  if (!isPro || !profile) {
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

  return {
    primaryColor: config.primaryColor || VIBRAWEB_DEFAULTS.primaryColor,
    accentColor: config.accentColor || VIBRAWEB_DEFAULTS.accentColor,
    h1Color: config.h1Color || VIBRAWEB_DEFAULTS.h1Color,
    h2Color: config.h2Color || (config.primaryColor || VIBRAWEB_DEFAULTS.h2Color),
    h3Color: config.h3Color || (config.primaryColor || VIBRAWEB_DEFAULTS.h3Color),
    bodyColor: config.bodyColor || VIBRAWEB_DEFAULTS.bodyColor,

    logoUrl: config.logoUrl ?? profile.logo_url ?? VIBRAWEB_DEFAULTS.logoUrl,
    coverLogoScale: config.coverLogoScale ?? VIBRAWEB_DEFAULTS.coverLogoScale,
    companyName: config.companyName ?? profile.consultant_name ?? VIBRAWEB_DEFAULTS.companyName,
    companyContact: config.companyContact ?? profile.consultant_contact ?? VIBRAWEB_DEFAULTS.companyContact,

    showHeader: config.showHeader ?? VIBRAWEB_DEFAULTS.showHeader,
    headerLogoUrl: config.headerLogoUrl ?? VIBRAWEB_DEFAULTS.headerLogoUrl,
    headerRightText: config.headerRightText ?? VIBRAWEB_DEFAULTS.headerRightText,

    showFooter: config.showFooter ?? VIBRAWEB_DEFAULTS.showFooter,
    footerColumns: config.footerColumns ?? VIBRAWEB_DEFAULTS.footerColumns,
    footerLeft: config.footerLeft ?? (config.companyName ?? profile.consultant_name ?? VIBRAWEB_DEFAULTS.footerLeft),
    footerCenter: config.footerCenter ?? (config.companyContact ?? profile.consultant_contact ?? VIBRAWEB_DEFAULTS.footerCenter),
    footerRight: config.footerRight ?? VIBRAWEB_DEFAULTS.footerRight,

    showWatermark: false,
    showVibrawebBranding: false,

    quoteStyle: config.quoteStyle ?? VIBRAWEB_DEFAULTS.quoteStyle,
  }
}
