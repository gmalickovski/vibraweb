interface Props {
  fillColor: string
  flip?: boolean
  height?: number
}

export function WaveDivider({ fillColor, flip = false, height = 80 }: Props) {
  const path = flip
    ? 'M0,40 C360,0 1080,80 1440,40 L1440,0 L0,0 Z'
    : 'M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z'

  return (
    <div aria-hidden style={{ position: 'relative', height, overflow: 'hidden', pointerEvents: 'none', flexShrink: 0 }}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{
          position: 'absolute', inset: 0, width: '200%', height: '100%',
          animation: 'waveDrift 14s ease-in-out infinite',
          transformOrigin: 'left center',
        }}
      >
        <path d={path} fill={fillColor} />
        {/* Second phase — offset wave fills the 200% width seamlessly */}
        <path d={flip
          ? 'M1440,40 C1800,0 2520,80 2880,40 L2880,0 L1440,0 Z'
          : 'M1440,40 C1800,80 2520,0 2880,40 L2880,80 L1440,80 Z'
        } fill={fillColor} />
      </svg>
    </div>
  )
}
