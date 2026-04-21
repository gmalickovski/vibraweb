import { useState } from 'react'
import { SitePage } from './pages/SitePage'
import { LoginPage } from './pages/LoginPage'
import { AppPage } from './pages/AppPage'

type Screen = 'site' | 'login' | 'app'

export function App() {
  const [screen, setScreen] = useState<Screen>('site')

  if (screen === 'login') {
    return (
      <LoginPage
        onSuccess={() => setScreen('app')}
        onBack={() => setScreen('site')}
      />
    )
  }

  if (screen === 'app') {
    return <AppPage onLogout={() => setScreen('site')} />
  }

  return <SitePage onEnter={() => setScreen('login')} />
}
