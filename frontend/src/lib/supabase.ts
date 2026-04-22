// Supabase client — uses the anon (publishable) key only.
// The service role key NEVER touches the browser; it lives only in Edge Functions.
// All data access is protected by Row Level Security policies on the database.

import { createClient } from '@supabase/supabase-js'
import type { NumerologyMap } from './numerology'
import type { AnalysisData } from '../pages/AppPage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type AnalysisType = 'pessoal' | 'bebe' | 'empresa' | 'previsoes'

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
  if (!numero) return null
  
  // 1) First check if user has a custom override
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: customData, error: customErr } = await supabase
      .from('user_interpretations')
      .select('numero, tipo, texto')
      .eq('user_id', user.id)
      .eq('numero', numero)
      .eq('tipo', tipo)
      .single()
      
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
    .single()
  if (!error && data) return data as InterpretationRow

  // 3) Fallback: strip the tab prefix (e.g. "pessoal_destino" → "destino")
  const baseTipo = tipo.includes('_') ? tipo.split('_').slice(1).join('_') : null
  if (baseTipo && baseTipo !== tipo) {
    const { data: fallback, error: fallbackErr } = await supabase
      .from('interpretacoes')
      .select('numero, tipo, titulo, texto')
      .eq('numero', numero)
      .eq('tipo', baseTipo)
      .single()
    if (!fallbackErr && fallback) return fallback as InterpretationRow
  }

  return null
}

export async function saveUserInterpretation(
  numero: number,
  tipo: string,
  texto: string | null
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
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

// ---------- User profiles (authenticated, own row only via RLS) ----------

export interface UserProfile {
  id: string
  consultant_name: string
  consultant_contact: string
  logo_url: string | null
  plan: 'free' | 'pro'
  role: 'user' | 'admin' | 'teste'
}

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, consultant_name, consultant_contact, logo_url, plan, role')
    .eq('id', user.id)
    .single()
  if (error) return null
  return data as UserProfile
}

export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'consultant_name' | 'consultant_contact' | 'logo_url'>>
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
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
  created_at: string
  updated_at: string
}

export async function saveAnalysis(
  type: AnalysisType,
  subject: string,
  inputData: AnalysisData,
  resultData: NumerologyMap
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      user_id: user.id,
      type,
      subject,
      input_data: inputData,
      result_data: resultData,
    })
    .select('id')
    .single()
  if (error) return null
  return (data as { id: string }).id
}

export async function listAnalyses(): Promise<AnalysisRow[]> {
  const { data, error } = await supabase
    .from('analyses')
    .select('id, type, subject, input_data, result_data, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) return []
  return (data ?? []) as AnalysisRow[]
}

export async function deleteAnalysis(id: string): Promise<boolean> {
  const { error } = await supabase.from('analyses').delete().eq('id', id)
  return !error
}
