// site-layout.ts — responsive layout primitives shared by every marketing
// section, so breakpoints and container metrics live in ONE place.
//
//   ≤ 640px  → phones                    : tightest padding, spine overlapped
//   ≤ 1024px → portrait tablets (iPad,    : single column ("empilhamento")
//              iPad mini, MatePad mini)
//   > 1024px → laptops (MBP 13"/14") and  : two columns, fluid type scaling
//              wide desktops                via clamp()
import { useEffect, useState } from 'react'

export const SITE_STACK_BP  = 1024  // at or below → stack everything in one column
export const SITE_MOBILE_BP = 640   // at or below → phone-tier spacing/scale

/** Left rail the WaveSpine occupies (130px) plus breathing room. Desktop copy
 *  must never cross it — on laptops the centred container alone is not enough,
 *  because its side margin shrinks as the viewport narrows. */
export const SPINE_SAFE_X = 138

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = () => setMatches(mq.matches)
    handler()
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])

  return matches
}

export interface SiteLayout {
  /** Portrait tablets and phones — one column, elements stacked. */
  stack: boolean
  /** Phones — tightest gutters; content may overlap the wave spine. */
  mobile: boolean
  /** Ready-made grid props for a "content + visual" two-column section. */
  cols: string
  gap: number
  /** Horizontal gutter — use for stacked tiers or spine-free containers. */
  pad: string
  /**
   * Padding for a centred container of `maxW`, guaranteeing its content
   * starts past the spine on desktop. As the viewport narrows the container's
   * own margin shrinks, so the left padding grows to compensate — capped at
   * SPINE_SAFE_X, floored at the normal 48px gutter on wide screens.
   */
  padFor: (maxW: number) => string
}

export function useSiteLayout(): SiteLayout {
  const stack  = useMediaQuery(`(max-width: ${SITE_STACK_BP}px)`)
  const mobile = useMediaQuery(`(max-width: ${SITE_MOBILE_BP}px)`)

  // Phones reclaim the rail and simply sit over the scaled-down spine.
  const pad = mobile ? '0 20px' : stack ? '0 32px' : '0 48px'

  const padFor = (maxW: number) =>
    stack
      ? pad
      : `0 48px 0 min(${SPINE_SAFE_X}px, max(48px, calc(${SPINE_SAFE_X}px - (100vw - ${maxW}px) / 2)))`

  return {
    stack,
    mobile,
    cols: stack ? '1fr' : '1fr 1fr',
    gap: stack ? (mobile ? 36 : 48) : 80,
    pad,
    padFor,
  }
}
