// Resolves the document theme based on user plan and profile settings.
// Pro users get custom colors/logo; Essencial users get Vibraweb branding.

import type { UserProfile } from './supabase'

export interface DocTheme {
  primaryColor: string
  accentColor: string
  logoUrl: string | null
  companyName: string
  companyContact: string
  showWatermark: boolean
  showVibrawebBranding: boolean
}

const VIBRAWEB_DEFAULTS: DocTheme = {
  primaryColor: '#C0397B',
  accentColor: '#FDB813',
  logoUrl: null,
  companyName: 'Vibraweb',
  companyContact: 'vibraweb.com.br',
  showWatermark: true,
  showVibrawebBranding: true,
}

export function resolveDocTheme(profile: UserProfile | null): DocTheme {
  const isPro = profile?.plan === 'pro'

  if (!isPro || !profile) {
    return {
      ...VIBRAWEB_DEFAULTS,
      companyName: profile?.consultant_name ?? VIBRAWEB_DEFAULTS.companyName,
      companyContact: profile?.consultant_contact ?? VIBRAWEB_DEFAULTS.companyContact,
    }
  }

  // Pro plan: use user's custom branding if set, fallback gracefully
  return {
    primaryColor: '#7C3AED',   // Will be user-configurable via "Minha Marca" later
    accentColor: '#D4AF37',
    logoUrl: profile.logo_url ?? null,
    companyName: profile.consultant_name || 'Vibraweb',
    companyContact: profile.consultant_contact || 'vibraweb.com.br',
    showWatermark: false,
    showVibrawebBranding: false,
  }
}
