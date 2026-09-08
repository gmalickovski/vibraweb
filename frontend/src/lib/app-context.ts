export type AppSurface = 'public' | 'app' | 'admin'

const configuredPublicHost = (import.meta.env.VITE_PUBLIC_HOST as string | undefined)?.toLowerCase()
const configuredAppHost = (import.meta.env.VITE_APP_HOST as string | undefined)?.toLowerCase()
const configuredAdminHost = (import.meta.env.VITE_ADMIN_HOST as string | undefined)?.toLowerCase()

function hostname(): string {
  return window.location.hostname.toLowerCase()
}

export function getAppSurface(): AppSurface {
  const current = hostname()
  if (configuredAdminHost && current === configuredAdminHost) return 'admin'
  if (configuredAppHost && current === configuredAppHost) return 'app'
  if (current.startsWith('admin.')) return 'admin'
  if (current.startsWith('app.')) return 'app'
  return 'public'
}

export function isVibrawebProductionHost(): boolean {
  return hostname() === 'vibraweb.com' || hostname().endsWith('.vibraweb.com')
}

export function appOrigin(): string {
  if (configuredAppHost) return `${window.location.protocol}//${configuredAppHost}`
  if (isVibrawebProductionHost()) return `${window.location.protocol}//app.vibraweb.com`
  return window.location.origin
}

export function adminOrigin(): string {
  if (configuredAdminHost) return `${window.location.protocol}//${configuredAdminHost}`
  if (isVibrawebProductionHost()) return `${window.location.protocol}//admin.vibraweb.com`
  return window.location.origin
}

export function redirectToApp(path = '/login'): void {
  const target = `${appOrigin()}${path.startsWith('/') ? path : `/${path}`}`
  if (target !== window.location.href) window.location.assign(target)
}

export function surfaceHome(surface: AppSurface = getAppSurface()): string {
  if (surface === 'admin') return '/admin'
  if (surface === 'app') return '/app/novo'
  return '/'
}
