import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Outlet } from 'react-router-dom'
import { SitePage } from './pages/SitePage'
import { LoginPage } from './pages/LoginPage'
import { AppPage } from './pages/AppPage'
import { PreviewPage } from './pages/PreviewPage'
import BrandPage from './pages/BrandPage'
import BlocosPage from './pages/BlocosPage'
import { Sidebar } from './components/app/Sidebar'
import { BottomNav } from './components/app/BottomNav'
import { TopBar } from './components/app/TopBar'
import { fetchUserProfile, type UserProfile } from './lib/supabase'
import { useIsMobile } from './lib/useIsMobile'
import { t } from './lib/tokens'

// TopBar (breadcrumb + toggle de tema + avatar) — fixo em TODAS as rotas
// /app/* (Guilherme, 2026-07-12: "esse header deve sempre permanecer nas
// páginas com as mesmas funcionalidades em todas as páginas"). Antes vivia
// dentro de AppPage.tsx, que só cobre a rota catch-all (novo/salvos/textos/
// preview) — Blocos e Templates são rotas irmãs registradas direto aqui em
// App.tsx e ficavam sem o header. Movido pro nível mais alto (AppLayout)
// pra cobrir as duas.
function AppLayout() {
  const isMobile = useIsMobile()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('vw-theme') as 'dark' | 'light') || 'dark'
  )

  useEffect(() => {
    fetchUserProfile().then(setProfile)
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('vw-theme', next)
  }

  const consultantName = profile?.consultant_name ?? 'Vibraweb'
  const roleTag = profile?.role === 'admin' ? '[Admin]' : profile?.role === 'teste' ? '[Teste]' : ''
  const workspaceName = `${consultantName} · ${profile?.plan === 'pro' ? 'Pro' : 'Essencial'} ${roleTag}`.trim()

  if (isMobile) {
    // Mobile: sidebar (hover-only, não existe em touch) vira bottom nav de 5 itens fixos.
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: t.night, color: t.fg, overflow: 'hidden' }}>
        <TopBar consultantName={workspaceName} theme={theme} onToggleTheme={toggleTheme} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          <Outlet />
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: t.night, color: t.fg, overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar consultantName={workspaceName} theme={theme} onToggleTheme={toggleTheme} />
        <Outlet />
      </div>
    </div>
  )
}

export function App() {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route path="/" element={<SitePage onEnter={() => navigate('/login')} />} />
      <Route path="/login" element={<LoginPage onSuccess={() => navigate('/app/novo')} onBack={() => navigate('/')} />} />
      <Route path="/app" element={<AppLayout />}>
        <Route path="marca" element={<BrandPage />} />
        <Route path="blocos" element={<BlocosPage />} />
        <Route path="*" element={<AppPage onLogout={() => navigate('/')} />} />
      </Route>
    </Routes>
  )
}
