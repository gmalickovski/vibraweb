import { useEffect, useRef } from 'react'

interface Ripple {
  x: number
  y: number
  velocity: number
  radius: number
  opacity: number
}

interface Props {
  color?: string
}

export function RippleBackground({ color = 'rgba(88,28,60, 0.4)' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let ripples: Ripple[] = []
    let animationFrameId: number

    // Resize canvas
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    resize()

    // Handle interaction
    const handleAddRipple = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      ripples.push({
        x: clientX - rect.left,
        y: clientY - rect.top,
        velocity: 2,
        radius: 0,
        opacity: 1,
      })
    }

    const onPointerMove = (e: PointerEvent) => handleAddRipple(e.clientX, e.clientY)
    window.addEventListener('pointermove', onPointerMove)

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ripples.forEach((r, i) => {
        r.radius += r.velocity
        r.opacity -= 0.02

        if (r.opacity <= 0) {
          ripples.splice(i, 1)
          return
        }

        ctx.beginPath()
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2)
        ctx.strokeStyle = color.replace(/[\d.]+\)$/g, `${r.opacity})`)
        ctx.lineWidth = 1 + (r.radius / 100)
        ctx.stroke()
        ctx.closePath()
      })

      animationFrameId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
