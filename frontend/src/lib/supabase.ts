// Supabase client — uses the anon (publishable) key only.
// The service role key NEVER touches the browser; it lives only in Edge Functions.
// All data access is protected by Row Level Security policies on the database.

import { createClient } from '@supabase/supabase-js'
import type { NumerologyMap } from './numerology'
import type { AnalysisData } from '../pages/AppPage'
import type { BlockOrderConfig } from './block-order'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AnalysisType = 'pessoal' | 'bebe' | 'empresa' | 'previsoes'

// Override de texto de interpretação específico de UM cliente/análise — shape:
// { [numero]: { [tipo]: texto } }. Ver migration 014 (analyses.text_overrides,
// Fase 2, 2026-07-11). Null/ausente em qualquer nível cai no padrão do
// consultor (user_interpretations) e depois no padrão global (interpretacoes).
export type TextOverrides = Record<number, Record<string, string>>

// ---------- Helpers ----------
let getUserPromise: ReturnType<typeof supabase.auth.getUser> | null = null

async function getAuthUser() {
  if (!getUserPromise) {
    getUserPromise = supabase.auth.getUser()
    getUserPromise.finally(() => {
      // Clear cache shortly after resolving to allow fresh fetches later
      setTimeout(() => { getUserPromise = null }, 50)
    })
  }
  return getUserPromise
}

// ---------- Interpretações (public read via RLS) ----------

export interface InterpretationRow {
  numero: number
  tipo: string
  titulo: string
  texto: string
}

export async function fetchInterpretation(
  numero: number,
  tipo: string
): Promise<InterpretationRow | null> {
  // numero=0 é um resultado numerológico válido (Desafio 0, Resposta
  // Subconsciente 0) — "!numero" tratava 0 como ausente e sempre retornava
  // null antes de sequer consultar o banco. Corrigido 2026-07-12.
  if (numero === null || numero === undefined || isNaN(numero)) return null

  // 1) First check if user has a custom override
  const { data: { user } } = await getAuthUser()
  if (user) {
    const { data: customData, error: customErr } = await supabase
      .from('user_interpretations')
      .select('numero, tipo, texto')
      .eq('user_id', user.id)
      .eq('numero', numero)
      .eq('tipo', tipo)
      .maybeSingle()

    if (!customErr && customData) {
      return { ...customData, titulo: `Personalizado: ${tipo}` } as InterpretationRow
    }
  }

  // 2) Try the exact tipo in the defaults table
  const { data, error } = await supabase
    .from('interpretacoes')
    .select('numero, tipo, titulo, texto')
    .eq('numero', numero)
    .eq('tipo', tipo)
    .maybeSingle()
  if (!error && data) return data as InterpretationRow

  // 3) Fallback: strip the tab prefix (e.g. "pessoal_destino" → "destino")
  const baseTipo = tipo.includes('_') ? tipo.split('_').slice(1).join('_') : null
  if (baseTipo && baseTipo !== tipo) {
    const { data: fallback, error: fallbackErr } = await supabase
      .from('interpretacoes')
      .select('numero, tipo, titulo, texto')
      .eq('numero', numero)
      .eq('tipo', baseTipo)
      .maybeSingle()
    if (!fallbackErr && fallback) return fallback as InterpretationRow
  }

  return null
}

// Lista compacta (numero, tipo) de TODAS as interpretações customizadas do usuário —
// usada pela grade de Personalizar Textos (Item 3, Fase 1) para pintar quais células já
// foram customizadas e para o contador-resumo, sem precisar de 1 query por célula.
export interface UserInterpretationKey {
  numero: number
  tipo: string
}

export async function listUserInterpretations(): Promise<UserInterpretationKey[]> {
  const { data: { user } } = await getAuthUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('user_interpretations')
    .select('numero, tipo')
    .eq('user_id', user.id)
  if (error || !data) return []
  return data as UserInterpretationKey[]
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
  const { data, error } = await supabase
    .from('interpretacoes')
    .select('numero, tipo')
  if (error || !data) return []
  return data as UserInterpretationKey[]
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
    const { error } = await supabase
      .from('user_interpretations')
      .delete()
      .eq('user_id', user.id)
      .eq('numero', numero)
      .eq('tipo', tipo)
    return !error
  }

  const { error } = await supabase
    .from('user_interpretations')
    .upsert(
      { user_id: user.id, numero, tipo, texto, updated_at: new Date().toISOString() },
      { onConflict: 'user_id, numero, tipo' }
    )
  return !error
}

// Apaga TODAS as personalizações de texto do usuário de uma vez (Números,
// Introduções de Categoria e Textos Gerais moram na mesma tabela) — usado
// pelo botão "Redefinir todos os textos ao padrão" em Personalizar Textos
// (2026-07-12). Ação destrutiva — o chamador deve confirmar antes de invocar.
export async function deleteAllUserInterpretations(): Promise<boolean> {
  const { data: { user } } = await getAuthUser()
  if (!user) return false
  const { error } = await supabase
    .from('user_interpretations')
    .delete()
    .eq('user_id', user.id)
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

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await getAuthUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, consultant_name, consultant_contact, logo_url, plan, role, brand_config, block_order')
    .eq('id', user.id)
    .single()
  if (error) return null
  return data as UserProfile
}

export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'consultant_name' | 'consultant_contact' | 'logo_url' | 'brand_config' | 'block_order'>>
): Promise<boolean> {
  const { data: { user } } = await getAuthUser()
  if (!user) return false
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
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
  const { data, error } = await supabase
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
  const { error } = await supabase
    .from('analyses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function listAnalyses(): Promise<AnalysisRow[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, type, subject, input_data, result_data, text_overrides, block_order, template_id, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []) as AnalysisRow[]
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const { error } = await supabase.from('analyses').delete().eq('id', id)
  return !error
}

export async function uploadBrandLogo(file: File): Promise<string | null> {
  const { data: { user } } = await getAuthUser()
  if (!user) return null

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('brand-assets')
    .upload(filePath, file)

  if (uploadError) {
    console.error('Error uploading logo:', uploadError)
    return null
  }

  const { data } = supabase.storage
    .from('brand-assets')
    .getPublicUrl(filePath)

  return data.publicUrl
}
