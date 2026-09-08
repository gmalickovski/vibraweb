// Neon client — uses Neon Auth + Data API.
// Storage writes go through Neon Functions so S3 credentials never touch the browser.
// All user data access is protected by Row Level Security policies on the database.

import { createClient, SupabaseAuthAdapter } from '@neondatabase/neon-js'
import type { NumerologyMap } from './numerology'
import type { AnalysisData } from '../pages/AppPage'
import type { BlockOrderConfig } from './block-order'

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL as string
const neonDataApiUrl = import.meta.env.VITE_NEON_DATA_API_URL as string
const neonFunctionApiUrl = import.meta.env.VITE_NEON_FUNCTION_API_URL as string

export const neon = createClient({
  auth: {
    adapter: SupabaseAuthAdapter(),
    url: neonAuthUrl,
    allowAnonymous: true,
  },
  dataApi: {
    url: neonDataApiUrl,
  },
})

export type AnalysisType = 'pessoal' | 'bebe' | 'empresa' | 'previsoes'

// Override de texto de interpretação específico de UM cliente/análise —
// persistido em analyses.text_overrides (JSONB, migration 014). Shape do
// valor de cada campo evoluiu em 2026-07-18 pra suportar HISTÓRICO DE
// VERSÕES + destino de restauração explícito (mesmo modelo de camadas do
// VS Code/CSS + revisões do WordPress/Notion):
//
//   string                → formato legado (análises antigas): só o texto do
//                           override. Continua lido normalmente.
//   { texto, data,        → formato atual. `texto` vazio = sem override
//     sistema?, versoes? }  próprio (cai na cascata abaixo); `sistema: true`
//                           força o PADRÃO DO SISTEMA, pulando o texto global
//                           do consultor (o "revert" do CSS — sem esse
//                           marcador seria impossível, porque a ausência de
//                           override sempre revela a camada global primeiro);
//                           `versoes` = pilha das últimas versões salvas
//                           (mais recente primeiro, cap VERSION_CAP) — cada
//                           Salvar/Restaurar empilha a anterior, nada se
//                           perde (restauração não-destrutiva, igual
//                           WordPress: restaurar também vira revisão).
//
// Cascata de resolução (resolveInterpretation): texto do override →
// [sistema? padrão do sistema] → texto global do consultor
// (user_interpretations) → padrão do sistema (interpretacoes).
export interface TextOverrideVersion { texto: string; data: string }
export interface TextOverrideEntryObj {
  texto: string
  data?: string
  sistema?: boolean
  versoes?: TextOverrideVersion[]
}
export type TextOverrideEntry = string | TextOverrideEntryObj
export type TextOverrides = Record<number, Record<string, TextOverrideEntry>>

/** Máximo de versões guardadas por campo — mesmo espírito do WP_POST_REVISIONS. */
export const TEXT_OVERRIDE_VERSION_CAP = 10

/** Texto próprio do override ('' quando não há — NUNCA usar truthiness no entry cru: objeto é sempre truthy). */
export function overrideTexto(entry: TextOverrideEntry | undefined | null): string {
  if (!entry) return ''
  return typeof entry === 'string' ? entry : entry.texto ?? ''
}

/** true quando o campo está travado no padrão do sistema (ignora o texto global do consultor). */
export function overrideSistema(entry: TextOverrideEntry | undefined | null): boolean {
  return !!entry && typeof entry !== 'string' && !!entry.sistema
}

export function overrideVersoes(entry: TextOverrideEntry | undefined | null): TextOverrideVersion[] {
  if (!entry || typeof entry === 'string') return []
  return entry.versoes ?? []
}

export function overrideData(entry: TextOverrideEntry | undefined | null): string | undefined {
  if (!entry || typeof entry === 'string') return undefined
  return entry.data
}

// ---------- Helpers ----------
let getUserPromise: ReturnType<typeof neon.auth.getUser> | null = null

async function getAuthUser() {
  if (!getUserPromise) {
    getUserPromise = neon.auth.getUser()
    getUserPromise.finally(() => {
      // Clear cache shortly after resolving to allow fresh fetches later
      setTimeout(() => { getUserPromise = null }, 50)
    })
  }
  return getUserPromise
}

// ---------- Interpretações (public read via RLS) ----------
//
// Cache em memória (module-level singleton, sobrevive a toda navegação
// dentro da mesma aba/sessão — só reseta num reload completo da página).
// Antes, CADA `fetchInterpretation()` disparava de 2 a 4 round-trips de rede
// (getAuthUser + user_interpretations + interpretacoes + fallback), e telas
// como o preview de exemplo (sample-preview.ts), PreviewPage.tsx e a grade
// de Personalizar Textos chamam essa função uma vez por chave — centenas de
// vezes por carregamento. Resultado: telas de texto/preview extremamente
// lentas pra carregar. Agora: UMA carga bulk (2 queries: todas as
// `interpretacoes` do sistema — não deletáveis, sempre as mesmas pra todo
// mundo — + todas as `user_interpretations` do consultor logado) alimenta
// dois Maps; toda chamada subsequente de fetchInterpretation/
// listUserInterpretations/listDefaultInterpretationKeys é só um lookup
// síncrono, sem rede. saveUserInterpretation/deleteAllUserInterpretations
// atualizam o cache (write-through) pra não precisar recarregar do zero
// depois de salvar/restaurar um texto.
export interface InterpretationRow {
  numero: number
  tipo: string
  titulo: string
  texto: string
}

function interpCacheKey(numero: number, tipo: string): string {
  return `${numero}__${tipo}`
}

interface InterpretationCacheState {
  defaults: Map<string, InterpretationRow>
  userOverrides: Map<string, InterpretationRow>
  loaded: boolean
  loadingPromise: Promise<void> | null
}

const interpCache: InterpretationCacheState = {
  defaults: new Map(),
  userOverrides: new Map(),
  loaded: false,
  loadingPromise: null,
}

async function ensureInterpretationsCache(): Promise<void> {
  if (interpCache.loaded) return
  if (interpCache.loadingPromise) return interpCache.loadingPromise

  interpCache.loadingPromise = (async () => {
    const [{ data: defaultsData }, { data: { user } }] = await Promise.all([
      neon.from('interpretacoes').select('numero, tipo, titulo, texto'),
      getAuthUser(),
    ])
    ;(defaultsData ?? []).forEach(row => {
      interpCache.defaults.set(interpCacheKey(row.numero, row.tipo), row as InterpretationRow)
    })

    if (user) {
      const { data: userData } = await neon
        .from('user_interpretations')
        .select('numero, tipo, texto')
        .eq('user_id', user.id)
      ;(userData ?? []).forEach(row => {
        interpCache.userOverrides.set(interpCacheKey(row.numero, row.tipo), {
          ...row, titulo: `Personalizado: ${row.tipo}`,
        } as InterpretationRow)
      })
    }

    interpCache.loaded = true
  })()

  return interpCache.loadingPromise
}

export async function fetchInterpretation(
  numero: number,
  tipo: string
): Promise<InterpretationRow | null> {
  // numero=0 é um resultado numerológico válido (Desafio 0, Resposta
  // Subconsciente 0) — "!numero" tratava 0 como ausente e sempre retornava
  // null antes de sequer consultar o banco. Corrigido 2026-07-12.
  if (numero === null || numero === undefined || isNaN(numero)) return null

  await ensureInterpretationsCache()

  // 1) Override do consultor (user_interpretations) — sempre vence.
  const custom = interpCache.userOverrides.get(interpCacheKey(numero, tipo))
  if (custom) return custom

  // A camada global ativa do Admin fica acima do padrão do sistema e abaixo
  // da personalização própria do consultor. Isso mantém a cascata antiga e
  // adiciona o template oficial sem duplicar a tabela de interpretações.
  const globalTemplate = await fetchActiveGlobalTemplate()
  const globalEntry = (globalTemplate?.config?.textOverrides as TextOverrides | undefined)?.[numero]?.[tipo]
  const globalText = overrideTexto(globalEntry)
  if (globalText) {
    const base = systemInterpretation(numero, tipo)
    return base
      ? { ...base, titulo: `Personalizado: ${base.titulo}`, texto: globalText }
      : { numero, tipo, titulo: `Personalizado: ${tipo}`, texto: globalText }
  }

  return systemInterpretation(numero, tipo)
}

// Só a camada do SISTEMA (interpretacoes), ignorando o texto global do
// consultor — usada quando um override de análise tem `sistema: true`
// (destino "Usar padrão do sistema" no modal de edição por análise).
function systemInterpretation(numero: number, tipo: string): InterpretationRow | null {
  // Tipo exato no padrão do sistema
  const exact = interpCache.defaults.get(interpCacheKey(numero, tipo))
  if (exact) return exact

  // Fallback: strip the tab prefix (e.g. "pessoal_destino" → "destino")
  const baseTipo = tipo.includes('_') ? tipo.split('_').slice(1).join('_') : null
  if (baseTipo && baseTipo !== tipo) {
    const fallback = interpCache.defaults.get(interpCacheKey(numero, baseTipo))
    if (fallback) return fallback
  }

  return null
}

export async function fetchSystemInterpretation(
  numero: number,
  tipo: string
): Promise<InterpretationRow | null> {
  if (numero === null || numero === undefined || isNaN(numero)) return null
  await ensureInterpretationsCache()
  return systemInterpretation(numero, tipo)
}

// Resolução COMPLETA da cascata de um campo de análise (override da análise →
// [sistema forçado] → global do consultor → padrão do sistema) — único ponto
// de verdade usado por PreviewPage (preview/PDF) e OutputPanel (modal), pra
// nenhum consumidor precisar conhecer o shape interno de TextOverrideEntry.
export async function resolveInterpretation(
  numero: number,
  tipo: string,
  overrides?: TextOverrides | null
): Promise<InterpretationRow | null> {
  const entry = overrides?.[numero]?.[tipo]
  const texto = overrideTexto(entry)
  if (texto) return { numero, tipo, titulo: 'Personalizado', texto }
  if (overrideSistema(entry)) return fetchSystemInterpretation(numero, tipo)
  return fetchInterpretation(numero, tipo)
}

// Lista compacta (numero, tipo) de TODAS as interpretações customizadas do usuário —
// usada pela grade de Personalizar Textos (Item 3, Fase 1) para pintar quais células já
// foram customizadas e para o contador-resumo, sem precisar de 1 query por célula.
export interface UserInterpretationKey {
  numero: number
  tipo: string
}

export async function listUserInterpretations(): Promise<UserInterpretationKey[]> {
  await ensureInterpretationsCache()
  return Array.from(interpCache.userOverrides.values()).map(r => ({ numero: r.numero, tipo: r.tipo }))
}

// TODAS as (numero, tipo) da tabela pública `interpretacoes` (236 linhas,
// tranquilo trazer de uma vez) — usada pela grade de Personalizar Textos pra
// distinguir célula "sem texto nenhum" (nem padrão nem personalizado) de
// célula "só com o padrão do sistema". O chamador deve aplicar o MESMO
// fallback de fetchInterpretation (tipo exato, senão tipo sem o 1º prefixo
// `_`) pra decidir se uma célula tem padrão — os `tipo` reais aqui são
// inconsistentes entre si (ex: `pessoal_motivacao` sem acento vs. `destino`
// sem prefixo), então checar só o tipo "óbvio" dá falso negativo.
export async function listDefaultInterpretationKeys(): Promise<UserInterpretationKey[]> {
  await ensureInterpretationsCache()
  return Array.from(interpCache.defaults.values()).map(r => ({ numero: r.numero, tipo: r.tipo }))
}

export async function saveUserInterpretation(
  numero: number,
  tipo: string,
  texto: string | null
): Promise<boolean> {
  const { data: { user } } = await getAuthUser()
  if (!user) return false

  if (!texto) {
    // Drop the custom if user restores default
    const { error } = await neon
      .from('user_interpretations')
      .delete()
      .eq('user_id', user.id)
      .eq('numero', numero)
      .eq('tipo', tipo)
    if (!error) interpCache.userOverrides.delete(interpCacheKey(numero, tipo))
    return !error
  }

  const { error } = await neon
    .from('user_interpretations')
    .upsert(
      { user_id: user.id, numero, tipo, texto, updated_at: new Date().toISOString() },
      { onConflict: 'user_id, numero, tipo' }
    )
  if (!error) {
    interpCache.userOverrides.set(interpCacheKey(numero, tipo), {
      numero, tipo, texto, titulo: `Personalizado: ${tipo}`,
    })
  }
  return !error
}

// Apaga TODAS as personalizações de texto do usuário de uma vez (Números,
// Introduções de Categoria e Textos Gerais moram na mesma tabela) — usado
// pelo botão "Redefinir todos os textos ao padrão" em Personalizar Textos
// (2026-07-12). Ação destrutiva — o chamador deve confirmar antes de invocar.
export async function deleteAllUserInterpretations(): Promise<boolean> {
  const { data: { user } } = await getAuthUser()
  if (!user) return false
  const { error } = await neon
    .from('user_interpretations')
    .delete()
    .eq('user_id', user.id)
  if (!error) interpCache.userOverrides.clear()
  return !error
}

// ---------- User profiles (authenticated, own row only via RLS) ----------

export interface UserProfile {
  id: string
  consultant_name: string
  consultant_contact: string
  logo_url: string | null
  plan: 'free' | 'pro'
  role: 'user' | 'admin' | 'teste'
  brand_config: any | null // JSONB
  block_order: any | null // JSONB — ver lib/block-order.ts (Item 1, Fase 1)
}

export interface BillingPlan {
  id: string
  slug: string
  name: string
  description: string
  status: 'draft' | 'active' | 'archived'
  currency: 'BRL'
  monthly_price_cents: number
  annual_price_cents: number
  stripe_product_id: string | null
  stripe_monthly_price_id: string | null
  stripe_annual_price_id: string | null
  features: string[]
  limits: Record<string, unknown>
  sort_order: number
  updated_at: string
}

export interface GlobalSetting {
  id: string
  setting_key: string
  category: string
  label: string
  description: string
  value: Record<string, unknown>
  updated_at: string
}

export interface GlobalTemplate {
  id: string
  slug: string
  name: string
  description: string
  template_type: string
  config: Record<string, unknown>
  is_active: boolean
  is_system: boolean
  sort_order: number
  updated_at: string
}

export interface AdminInterpretation {
  id: number
  numero: number
  tipo: string
  titulo: string
  texto: string
  created_at: string
}

export async function fetchAdminPlans(): Promise<BillingPlan[]> {
  const { data, error } = await neon.from('billing_plans').select('*').order('sort_order')
  return error ? [] : (data ?? []) as BillingPlan[]
}

export async function saveAdminPlan(plan: Partial<BillingPlan> & Pick<BillingPlan, 'slug' | 'name'>): Promise<BillingPlan | null> {
  const { data: { user } } = await getAuthUser()
  if (!user) return null
  const payload = { ...plan, updated_by: user.id, updated_at: new Date().toISOString() }
  const query = plan.id
    ? neon.from('billing_plans').update(payload).eq('id', plan.id)
    : neon.from('billing_plans').insert(payload)
  const { data, error } = await query.select('*').single()
  return error ? null : data as BillingPlan
}

export async function deleteAdminPlan(id: string): Promise<boolean> {
  const { error } = await neon.from('billing_plans').delete().eq('id', id)
  return !error
}

export async function fetchGlobalSettings(): Promise<GlobalSetting[]> {
  const { data, error } = await neon.from('global_settings').select('*').order('category').order('label')
  return error ? [] : (data ?? []) as GlobalSetting[]
}

export async function saveGlobalSetting(setting: Partial<GlobalSetting> & Pick<GlobalSetting, 'setting_key' | 'label'>): Promise<GlobalSetting | null> {
  const { data: { user } } = await getAuthUser()
  if (!user) return null
  const payload = { ...setting, updated_by: user.id, updated_at: new Date().toISOString() }
  const query = setting.id
    ? neon.from('global_settings').update(payload).eq('id', setting.id)
    : neon.from('global_settings').insert(payload)
  const { data, error } = await query.select('*').single()
  return error ? null : data as GlobalSetting
}

export async function fetchGlobalTemplates(): Promise<GlobalTemplate[]> {
  const { data, error } = await neon.from('global_templates').select('*').order('sort_order').order('name')
  return error ? [] : (data ?? []) as GlobalTemplate[]
}

export async function saveGlobalTemplate(template: Partial<GlobalTemplate> & Pick<GlobalTemplate, 'slug' | 'name'>): Promise<GlobalTemplate | null> {
  const { data: { user } } = await getAuthUser()
  if (!user) return null
  const payload = { ...template, updated_by: user.id, updated_at: new Date().toISOString() }
  const query = template.id
    ? neon.from('global_templates').update(payload).eq('id', template.id)
    : neon.from('global_templates').insert(payload)
  const { data, error } = await query.select('*').single()
  if (!error) activeGlobalTemplateCache = { value: null, promise: null }
  return error ? null : data as GlobalTemplate
}

export async function deleteGlobalTemplate(id: string): Promise<boolean> {
  const { error } = await neon.from('global_templates').delete().eq('id', id)
  if (!error) activeGlobalTemplateCache = { value: null, promise: null }
  return !error
}

let activeGlobalTemplateCache: { value: GlobalTemplate | null; promise: Promise<GlobalTemplate | null> | null } = {
  value: null, promise: null,
}

/** Template global publicado que serve como fallback para novos workspaces. */
export async function fetchActiveGlobalTemplate(): Promise<GlobalTemplate | null> {
  if (activeGlobalTemplateCache.value) return activeGlobalTemplateCache.value
  if (activeGlobalTemplateCache.promise) return activeGlobalTemplateCache.promise
  activeGlobalTemplateCache.promise = (async () => {
    const { data, error } = await neon
      .from('global_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .limit(1)
      .maybeSingle()
    const value = error ? null : data as GlobalTemplate | null
    activeGlobalTemplateCache.value = value
    activeGlobalTemplateCache.promise = null
    return value
  })()
  return activeGlobalTemplateCache.promise
}

/** Publica um único template global e retira o status dos demais. */
export async function activateGlobalTemplate(id: string): Promise<GlobalTemplate | null> {
  const { error: clearError } = await neon
    .from('global_templates')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .neq('id', id)
  if (clearError) return null
  const { data, error } = await neon
    .from('global_templates')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()
  if (!error) activeGlobalTemplateCache = { value: data as GlobalTemplate, promise: null }
  return error ? null : data as GlobalTemplate
}

export async function fetchAdminInterpretations(): Promise<AdminInterpretation[]> {
  const { data, error } = await neon.from('interpretacoes').select('id, numero, tipo, titulo, texto, created_at').order('tipo').order('numero')
  return error ? [] : (data ?? []) as AdminInterpretation[]
}

export async function saveAdminInterpretation(item: Partial<AdminInterpretation> & Pick<AdminInterpretation, 'numero' | 'tipo' | 'titulo' | 'texto'>): Promise<AdminInterpretation | null> {
  const query = item.id
    ? neon.from('interpretacoes').update({ numero: item.numero, tipo: item.tipo, titulo: item.titulo, texto: item.texto }).eq('id', item.id)
    : neon.from('interpretacoes').insert({ numero: item.numero, tipo: item.tipo, titulo: item.titulo, texto: item.texto })
  const { data, error } = await query.select('id, numero, tipo, titulo, texto, created_at').single()
  return error ? null : data as AdminInterpretation
}

export async function deleteAdminInterpretation(id: number): Promise<boolean> {
  const { error } = await neon.from('interpretacoes').delete().eq('id', id)
  return !error
}

// Cache em memória (module-level, mesma ideia do cache de interpretações
// acima) — `fetchUserProfile()` era chamado de novo em CADA navegação
// (AppLayout, BlocosPage, BrandPage, AppPage todos chamam no próprio mount),
// refazendo a mesma query de rede toda vez mesmo sem o perfil ter mudado.
// Isso inclui os templates de marca (`brand_config`) e a ordem de blocos
// (`block_order`), ambos JSONB numa única linha — agora carregados uma vez
// e reaproveitados; `updateUserProfile` atualiza o cache (write-through)
// pra próxima leitura já vir com o valor novo, sem round-trip.
let profileCache: { value: UserProfile | null; promise: Promise<UserProfile | null> | null; loaded: boolean; userId: string | null } = {
  value: null, promise: null, loaded: false, userId: null,
}

export function resetUserProfileCache() {
  profileCache = { value: null, promise: null, loaded: false, userId: null }
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await getAuthUser()
  const userId = user?.id ?? null

  if (profileCache.loaded && profileCache.userId === userId) return profileCache.value
  if (profileCache.promise && profileCache.userId === userId) return profileCache.promise

  profileCache.promise = (async () => {
    if (!user) {
      profileCache.loaded = true
      profileCache.userId = null
      profileCache.value = null
      return null
    }
    const { data, error } = await neon
      .from('user_profiles')
      .select('id, consultant_name, consultant_contact, logo_url, plan, role, brand_config, block_order')
      .eq('id', user.id)
      .single()
    profileCache.loaded = true
    profileCache.userId = user.id
    if (error) {
      profileCache.value = null
      return null
    }

    const profile = data as UserProfile
    const globalTemplate = await fetchActiveGlobalTemplate()
    const globalConfig = globalTemplate?.config ?? {}
    const hasOwnBrandConfig = !!profile.brand_config && (
      !!profile.brand_config.activeTemplateId
      || (Array.isArray(profile.brand_config.templates) && profile.brand_config.templates.length > 0)
      || !!profile.brand_config.primaryColor
    )

    // A personal template/order always wins. Empty legacy profiles inherit the
    // published global template transparently, including future fields.
    profileCache.value = {
      ...profile,
      brand_config: hasOwnBrandConfig
        ? profile.brand_config
        : { activeTemplateId: 'global', templates: [{ id: 'global', config: globalConfig }] },
      block_order: profile.block_order ?? globalConfig.blockOrder ?? null,
    }
    return profileCache.value
  })()

  return profileCache.promise
}

export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'consultant_name' | 'consultant_contact' | 'logo_url' | 'brand_config' | 'block_order'>>
): Promise<boolean> {
  const { data: { user } } = await getAuthUser()
  if (!user) return false
  const { error } = await neon
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (!error && profileCache.value) {
    profileCache.value = { ...profileCache.value, ...updates }
  }
  return !error
}

// ---------- Analyses (authenticated, own rows only via RLS) ----------

export interface AnalysisRow {
  id: string
  type: AnalysisType
  subject: string | null
  input_data: AnalysisData
  result_data: NumerologyMap | null
  text_overrides: TextOverrides | null // Fase 2, 2026-07-11 — ver migration 014
  block_order: BlockOrderConfig | null // Fase 2, 2026-07-11 — ver migration 014
  template_id: string | null // 2026-07-12 — ver migration 016
  created_at: string
  updated_at: string
}

export async function saveAnalysis(
  type: AnalysisType,
  subject: string,
  inputData: AnalysisData,
  resultData: NumerologyMap,
  textOverrides?: TextOverrides | null,
  blockOrder?: BlockOrderConfig | null,
  templateId?: string | null
): Promise<string | null> {
  const { data: { user } } = await getAuthUser()
  if (!user) return null
  const { data, error } = await neon
    .from('analyses')
    .insert({
      user_id: user.id,
      type,
      subject,
      input_data: inputData,
      result_data: resultData,
      text_overrides: textOverrides ?? null,
      block_order: blockOrder ?? null,
      template_id: templateId ?? null,
    })
    .select('id')
    .single()
  if (error) return null
  return (data as { id: string }).id
}

// Atualiza só os campos específicos de UM cliente (texto/ordem de blocos/
// template) de uma análise já salva — usado pelo passo de organização dentro
// da criação/reabertura (Fase 2, 2026-07-11; template_id em 2026-07-12), sem
// precisar recriar a análise inteira.
export async function updateAnalysis(
  id: string,
  updates: Partial<{ text_overrides: TextOverrides | null; block_order: BlockOrderConfig | null; template_id: string | null }>
): Promise<boolean> {
  const { error } = await neon
    .from('analyses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function listAnalyses(): Promise<AnalysisRow[]> {
  const { data, error } = await neon
    .from('analyses')
    .select('id, type, subject, input_data, result_data, text_overrides, block_order, template_id, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []) as AnalysisRow[]
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const { error } = await neon.from('analyses').delete().eq('id', id)
  return !error
}

export async function uploadBrandLogo(file: File): Promise<string | null> {
  const { data: { session } } = await neon.auth.getSession()
  if (!session?.access_token) return null

  const body = new FormData()
  body.append('file', file)

  const response = await fetch(`${neonFunctionApiUrl}/upload-brand-logo`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body,
  })

  if (!response.ok) {
    console.error('Error uploading logo:', await response.text())
    return null
  }

  const data = await response.json() as { url?: string }
  return data.url ?? null
}
