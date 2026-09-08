import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Outlet, Navigate } from 'react-router-dom'
import { SitePage } from './pages/SitePage'
import { LoginPage } from './pages/LoginPage'
import { AppPage } from './pages/AppPage'
import { PreviewPage } from './pages/PreviewPage'
import BrandPage from './pages/BrandPage'
import BlocosPage from './pages/BlocosPage'
import { Sidebar } from './components/app/Sidebar'
import { BottomNav } from './components/app/BottomNav'
import { ShellHeaderProvider, TopBar } from './components/app/TopBar'
import { fetchUserProfile, type UserProfile } from './lib/neon'
import { useIsMobile } from './lib/useIsMobile'
import { t } from './lib/tokens'
import { ConfirmProvider } from './components/shared/ConfirmDialog'
import AdminPage from './pages/AdminPage'
import { getAppSurface, redirectToApp, surfaceHome } from './lib/app-context'

// TopBar (breadcrumb + toggle de tema + avatar) — fixo em TODAS as rotas
// /app/* (Guilherme, 2026-07-12: "esse header deve sempre permanecer nas
// páginas com as mesmas funcionalidades em todas as páginas"). Antes vivia
// dentro de AppPage.tsx, que só cobre a rota catch-all (novo/salvos/textos/
// preview) — Blocos e Templates são rotas irmãs registradas direto aqui em
// App.tsx e ficavam sem o header. Movido pro nível mais alto (AppLayout)
// pra cobrir as duas.
function AppLayout() {
  // Tablets portrait and narrow split-screen layouts need the same touch-first
  // navigation as phones. The content itself remains fluid above this shell.
  const isMobile = useIsMobile(900)
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
      <ShellHeaderProvider>
        <div className="vw-app-shell vw-app-shell-mobile" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: t.night, color: t.fg, overflow: 'hidden' }}>
          <TopBar consultantName={workspaceName} theme={theme} onToggleTheme={toggleTheme} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <Outlet />
          </div>
          <BottomNav />
        </div>
      </ShellHeaderProvider>
    )
  }

  return (
    <ShellHeaderProvider>
      <div className="vw-app-shell" style={{ display: 'flex', height: '100vh', background: t.night, color: t.fg, overflow: 'hidden' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopBar consultantName={workspaceName} theme={theme} onToggleTheme={toggleTheme} />
          <Outlet />
        </div>
      </div>
    </ShellHeaderProvider>
  )
}

export function App() {
  const navigate = useNavigate()
  const surface = getAppSurface()

  function handleLoginSuccess() {
    navigate(surface === 'admin' ? '/admin' : '/app/novo')
  }

  return (
    // ConfirmProvider envolve o app inteiro — qualquer tela abaixo pode pedir
    // confirmação de ação via useConfirm() sem precisar de um <ConfirmDialog>
    // próprio (substitui o window.confirm() nativo do navegador em todo o sistema).
    <ConfirmProvider>
      <Routes>
        <Route path="/" element={surface === 'public' ? <SitePage onEnter={() => navigate('/login')} /> : <Navigate to={surfaceHome(surface)} replace />} />
        <Route path="/login" element={surface === 'public' ? <PublicLogin onSuccess={handleLoginSuccess} onBack={() => navigate('/')} /> : <LoginPage mode={surface === 'admin' ? 'admin' : 'workspace'} onSuccess={handleLoginSuccess} onBack={() => navigate(surface === 'admin' ? '/login' : '/')} />} />
        <Route path="/app" element={<AppLayout />}>
          {/* "marca/*": a URL passa a carregar o templateId + a aba (visual/
              blocos/textos) editados, ex. /app/marca/<id>/blocos — mesmo
              componente BrandPage o tempo todo (nunca remonta ao trocar de
              aba ou de template), só o "splat" (useParams()['*']) muda. É o
              que permite a Sidebar mostrar a gaveta Visual/Blocos/Textos
              (ver Sidebar.tsx) puramente a partir da rota, sem estado à parte. */}
          <Route path="marca/*" element={<BrandPage />} />
          <Route path="blocos" element={<BlocosPage />} />
          <Route path="*" element={<AppPage onLogout={() => navigate('/')} />} />
        </Route>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/*" element={<AdminPage />} />
      </Routes>
    </ConfirmProvider>
  )
}

function PublicLogin({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  // Quando o DNS existir, a superfície pública não mantém uma segunda cópia
  // da tela de autenticação: ela entrega o login ao app.vibraweb.com.
  if (window.location.hostname.toLowerCase() === 'vibraweb.com') {
    redirectToApp('/login')
    return <div style={{ padding: 32, color: t.fg }}>Abrindo o workspace...</div>
  }
  return <LoginPage onSuccess={onSuccess} onBack={onBack} />
}
