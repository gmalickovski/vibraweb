import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let initialized = false
let installed = false
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach(listener => listener())
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function initPwa() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  installed = isStandalone()

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    installed = true
    notify()
  })

  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // PWA is an enhancement; an unavailable service worker must not block auth.
    })
  }
}

export function usePwaInstall() {
  const [, setVersion] = useState(0)

  useEffect(() => {
    const listener = () => setVersion(version => version + 1)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    const prompt = deferredPrompt
    deferredPrompt = null
    await prompt.prompt()
    const choice = await prompt.userChoice
    notify()
    return choice.outcome === 'accepted'
  }, [])

  return {
    canInstall: deferredPrompt !== null && !installed,
    installed,
    install,
  }
}
