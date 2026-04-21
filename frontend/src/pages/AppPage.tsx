import { useState, useEffect, useMemo } from 'react'
import { t } from '../lib/tokens'
import { Sidebar } from '../components/app/Sidebar'
import { TopBar } from '../components/app/TopBar'
import { InputPanel } from '../components/app/InputPanel'
import { OutputPanel } from '../components/app/OutputPanel'
import { ExportModal } from '../components/app/ExportModal'
import { SavedAnalyses } from '../components/app/SavedAnalyses'
import {
  fetchUserProfile, saveAnalysis, type UserProfile,
} from '../lib/supabase'
import { calcPessoal, calcEmpresa, calcBebe, calcPrevisoes } from '../lib/numerology'

export type AnalysisTab = 'pessoal' | 'bebe' | 'empresa' | 'previsoes'

export interface AnalysisData {
  nome: string
  dob: string
  social: string
  empresa: string
  fantasia: string
  fundacao: string
  socio: string
  bebeNome: string
  bebeNome2: string
  bebeNome3: string
  bebeSobrenome: string
  bebeDob: string
  anoRef: string
}

const defaultData: AnalysisData = {
  nome: '', dob: '', social: '',
  empresa: '', fantasia: '', fundacao: '', socio: '',
  bebeNome: '', bebeNome2: '', bebeNome3: '', bebeSobrenome: '', bebeDob: '',
  anoRef: '',
}

interface Props {
  onLogout: () => void
}

export function AppPage({ onLogout }: Props) {
  const [active, setActive] = useState<'new' | 'saved' | 'templates' | 'brand' | 'settings'>('new')
  const [tab, setTab] = useState<AnalysisTab>('pessoal')
  const [data, setData] = useState<AnalysisData>(defaultData)
  const [showExport, setShowExport] = useState(false)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('vw-theme') as 'dark' | 'light') || 'dark'
  )

  // Load consultant profile on mount
  useEffect(() => {
    fetchUserProfile().then(setProfile)
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('vw-theme', next)
  }

  // Compute current nums for save action
  const currentNums = useMemo(() => {
    if (tab === 'empresa')   return calcEmpresa(data.empresa, data.fundacao)
    if (tab === 'bebe')      return calcBebe(data.bebeNome, data.bebeSobrenome, data.bebeDob)
    if (tab === 'previsoes') return calcPrevisoes(data.nome, data.dob, data.anoRef)
    return calcPessoal(data.nome, data.dob)
  }, [data, tab])

  const currentSubject = useMemo(() => {
    if (tab === 'empresa') return data.fantasia || data.empresa || ''
    if (tab === 'bebe')    return [data.bebeNome, data.bebeSobrenome].filter(Boolean).join(' ')
    return data.social || data.nome || ''
  }, [data, tab])

  async function handleSave() {
    if (saving || !currentSubject) return
    setSaving(true)
    await saveAnalysis(tab, currentSubject, data, currentNums)
    setSaving(false)
  }

  const consultantName = profile?.consultant_name ?? 'Vibraweb'
  const consultantContact = profile?.consultant_contact ?? 'vibraweb.com.br'
  const roleTag = profile?.role === 'admin' ? '[Admin]' : profile?.role === 'teste' ? '[Teste]' : ''
  const workspaceName = `${consultantName} · ${profile?.plan === 'pro' ? 'Pro' : 'Essencial'} ${roleTag}`.trim()

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      background: t.night,
      color: t.fg,
      overflow: 'hidden',
    }}>
      <Sidebar active={active} onChange={setActive} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          consultantName={workspaceName}
          theme={theme}
          onToggleTheme={toggleTheme}
          onExport={() => setShowExport(true)}
          onSave={handleSave}
          saving={saving}
        />

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {active === 'saved' ? (
            <SavedAnalyses
              onLoad={(row) => {
                setData(row.input_data)
                setTab(row.type)
                setActive('new')
              }}
            />
          ) : (
            <>
              <InputPanel data={data} setData={setData} tab={tab} setTab={setTab} />
              <OutputPanel
                data={data}
                tab={tab}
                consultantName={consultantName}
                consultantContact={consultantContact}
              />
            </>
          )}
        </div>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  )
}
