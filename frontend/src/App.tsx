import { Routes, Route, useNavigate } from 'react-router-dom'
import { SitePage } from './pages/SitePage'
import { LoginPage } from './pages/LoginPage'
import { AppPage } from './pages/AppPage'

export function App() {
  const navigate = useNavigate()

  return (
    <Routes>
      <Route path="/" element={<SitePage onEnter={() => navigate('/login')} />} />
      <Route path="/login" element={<LoginPage onSuccess={() => navigate('/app/novo')} onBack={() => navigate('/')} />} />
      <Route path="/app/*" element={<AppPage onLogout={() => navigate('/')} />} />
    </Routes>
  )
}
