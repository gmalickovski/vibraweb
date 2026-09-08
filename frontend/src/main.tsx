import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { App } from './App'
import { getAppSurface } from './lib/app-context'
import { initPwa } from './lib/pwa'

const pwaBySurface = {
  public: { manifest: '/manifest.json', icon: '/assets/pwa-icon-192.png', title: 'Vibraweb' },
  app: { manifest: '/app-manifest.json', icon: '/assets/pwa-icon-192.png', title: 'Vibraweb Workspace' },
  admin: { manifest: '/admin-manifest.json', icon: '/assets/pwa-admin-icon-192.png', title: 'Vibraweb Admin' },
} as const

const pwaSurface = pwaBySurface[getAppSurface()]
document.querySelector<HTMLLinkElement>('#vw-manifest')?.setAttribute('href', pwaSurface.manifest)
document.querySelector<HTMLLinkElement>('#vw-apple-icon')?.setAttribute('href', pwaSurface.icon)
document.title = pwaSurface.title
initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
