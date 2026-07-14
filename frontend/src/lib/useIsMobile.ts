// useIsMobile.ts — breakpoint helper usado pelas telas que agora precisam ser
// responsivas (Item 4, Navegação global — Fase 1): AppLayout (sidebar vs. bottom nav),
// Blocos do Relatório, Templates de Marca, Personalizar Textos.
import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  )

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const handler = () => setIsMobile(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return isMobile
}
