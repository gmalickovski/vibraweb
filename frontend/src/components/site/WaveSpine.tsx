import { useMemo } from 'react'
import { t } from '../../lib/tokens'

interface Props {
  /** Uniform scale — phones render a smaller spine that the copy sits over. */
  scale?: number
}

export function WaveSpine({ scale = 1 }: Props) {
  const { path, svgWidth, totalHeight } = useMemo(() => {
    const cycles = 14
    const period = 480
    const amp    = 55   // high peaks
    const cx     = 65
    // Control point ratio for smooth sine approximation
    const k      = 0.364

    let d = `M ${cx},0`
    for (let i = 0; i < cycles; i++) {
      const y0   = i * period
      const half = period / 2

      // Right peak: smooth S-curve
      d += ` C ${cx + amp},${(y0 + k * half).toFixed(1)}`
      d += `   ${cx + amp},${(y0 + (1 - k) * half).toFixed(1)}`
      d += `   ${cx},${(y0 + half).toFixed(1)}`

      // Left trough: smooth S-curve
      d += ` C ${cx - amp},${(y0 + half + k * half).toFixed(1)}`
      d += `   ${cx - amp},${(y0 + half + (1 - k) * half).toFixed(1)}`
      d += `   ${cx},${(y0 + period).toFixed(1)}`
    }

    return { path: d, svgWidth: cx + amp + 10, totalHeight: cycles * period }
  }, [])

  return (
    <svg
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: svgWidth,
        height: totalHeight,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: scale < 1 ? 0.24 : 0.32,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: 'left top',
      }}
    >
      <defs>
        <linearGradient id="spineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={t.gold} />
          <stop offset="40%"  stopColor={t.magenta} />
          <stop offset="100%" stopColor={t.wine} />
        </linearGradient>
      </defs>
      <path
        d={path}
        stroke="url(#spineGrad)"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="20 8"
        style={{ animation: 'spineFlow 2.8s linear infinite' }}
      />
    </svg>
  )
}
