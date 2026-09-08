import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { t } from '../../lib/tokens'
import { useSiteLayout } from '../../lib/site-layout'
import { PrimaryBtn } from '../shared/Button'

/* ─── Wave parameters ────────────────────────────────────────────────────
   Both the visual ring and the displacement map use the same wall-clock
   formula:  radius(t) = t_seconds × WAVE_SPEED_PX
   This guarantees perfect sync regardless of frame rate.                  */
const SW             = 256   // displacement canvas width
const SH             = 160   // displacement canvas height
const WAVE_SPEED_PX  = 320   // hero-px per second (crosses 1920px in ~6 s)
const RING_HW_PX     = 160   // half-width of displacement ring in hero-px
                              //   → total ring thickness ≈ 320 px on screen
const DISPL_AMP_PX   = 6     // max displacement in SCREEN PIXELS at ring crest
const DISPL_SCALE    = 18    // feDisplacementMap scale attr (screen-px per unit)
const WAVE_LIFE_MS   = 7000  // ms until a wave is retired

/* Shared band height. HeroSequence's landing section and its floating
   sticky mockup MUST use the same value, otherwise the mockup no longer
   lands vertically centred in that section. */
export const HERO_BAND_H = '90svh'

/* The site header is position:fixed, so it covers the top of every band.
   Every centred band applies this as padding-top (box-sizing is border-box
   globally, so the band height is unaffected) — content then reads as
   optically centred between the header's bottom edge and the band's end. */
export const SITE_HEADER_H = 67

interface Props {
  onCta: () => void
  /* When false, the right column is left empty so a shared mockup rendered
     by HeroSequence can float through it and down into the next section. */
  showMockup?: boolean
}

interface Wave {
  hx: number    // origin in hero-local px
  hy: number
  born: number  // performance.now() timestamp
  big: boolean  // click = true, auto = false
}

/* ──────────────────────────────────────────────────────────────────────── */
export function Hero({ onCta, showMockup = true }: Props) {
  const { stack, pad, padFor } = useSiteLayout()
  const heroPad = padFor(1180)
  const stickyRef    = useRef<HTMLDivElement>(null)
  const displCanvasRef = useRef<HTMLCanvasElement>(null)
  const ringCanvasRef  = useRef<HTMLCanvasElement>(null)
  const feImgRef       = useRef<SVGFEImageElement>(null)
  const rafRef         = useRef<number>(0)
  const autoTimerRef   = useRef<ReturnType<typeof setTimeout>>(0 as unknown as ReturnType<typeof setTimeout>)
  const waves          = useRef<Wave[]>([])
  const lastWaveMs     = useRef(performance.now()) // enforce min gap

  useEffect(() => {
    const sticky      = stickyRef.current
    const displCanvas  = displCanvasRef.current
    const ringCanvas   = ringCanvasRef.current
    if (!sticky || !displCanvas || !ringCanvas) return

    const displCtx = displCanvas.getContext('2d', { willReadFrequently: true })
    const ringCtx  = ringCanvas.getContext('2d')
    if (!displCtx || !ringCtx) return

    /* ── Resize ring canvas to its CSS display size ── */
    const resizeRing = () => {
      ringCanvas.width  = ringCanvas.offsetWidth
      ringCanvas.height = ringCanvas.offsetHeight
    }
    const ro = new ResizeObserver(resizeRing)
    ro.observe(ringCanvas)
    resizeRing()

    /* ── Start with neutral displacement (no distortion) ── */
    displCtx.fillStyle = 'rgb(128,128,128)'
    displCtx.fillRect(0, 0, SW, SH)
    feImgRef.current?.setAttribute('href', displCanvas.toDataURL())

    /* ── Add one wave.  MIN_GAP prevents two auto-drops close together. ── */
    const MIN_GAP_MS = 10000
    const addWave = (hx: number, hy: number, big: boolean) => {
      const now = performance.now()
      if (!big && now - lastWaveMs.current < MIN_GAP_MS) return
      lastWaveMs.current = now
      waves.current.push({ hx, hy, born: now, big })
    }

    /* ── Build displacement map from analytic ring formula ────────────────
       For every active wave, each canvas pixel near the ring band gets a
       radial displacement.  The ring center is computed from wall-clock time
       using the SAME formula as drawRings → perfect sync, any frame rate.

       Profile:  diff = dist − ringR  (negative = inside, positive = outside)
         outside (diff > 0): outward push, cos² falloff to zero
         inside  (diff < 0): slight inward pull  (water trough behind crest)
         |diff| ≥ RING_HW_PX: no displacement                               */
    let displNeedsReset = false

    const buildDisplMap = (now: number) => {
      const heroW = sticky.offsetWidth  || 1920
      const heroH = sticky.offsetHeight || 900
      const sx = SW / heroW   // canvas-px per hero-px (X axis)
      const sy = SH / heroH   // canvas-px per hero-px (Y axis)
      // feDisplacementMap: channel value maps to displacement via:
      //   screen_displ = (channel/255 − 0.5) × scale
      // So 1 screen pixel = 255/DISPL_SCALE channel units
      const chanPerPx = 255 / DISPL_SCALE

      const img = displCtx.createImageData(SW, SH)
      const d   = img.data

      // neutral baseline (no displacement)
      for (let i = 0; i < d.length; i += 4) {
        d[i] = 128; d[i + 1] = 128; d[i + 2] = 128; d[i + 3] = 255
      }

      let anyActive = false

      for (const w of waves.current) {
        const age   = (now - w.born) / 1000
        const decay = Math.max(0, 1 - (now - w.born) / WAVE_LIFE_MS)
        if (decay <= 0) continue
        anyActive = true

        const ringR = age * WAVE_SPEED_PX   // ring radius in hero-px
        const hw    = RING_HW_PX            // ring half-width in hero-px

        // Wave centre in canvas coords
        const cx = w.hx * sx
        const cy = w.hy * sy

        // Bounding box: (ringR ± hw) scaled independently per axis
        const crx = ringR * sx; const hwx = hw * sx
        const cry = ringR * sy; const hwy = hw * sy

        if (ringR - hw > Math.sqrt(heroW * heroW + heroH * heroH)) continue

        const x0 = Math.max(0, Math.floor(cx - crx - hwx))
        const x1 = Math.min(SW - 1, Math.ceil(cx + crx + hwx))
        const y0 = Math.max(0, Math.floor(cy - cry - hwy))
        const y1 = Math.min(SH - 1, Math.ceil(cy + cry + hwy))

        for (let py = y0; py <= y1; py++) {
          for (let px = x0; px <= x1; px++) {
            // Convert canvas coords back to hero-px for a true circular distance
            const dx_h = (px - cx) / sx
            const dy_h = (py - cy) / sy
            const dist = Math.sqrt(dx_h * dx_h + dy_h * dy_h)  // hero-px
            const diff = dist - ringR   // hero-px; < 0 inside, > 0 outside

            if (Math.abs(diff) >= hw || dist < 0.5) continue

            const t2   = diff / hw
            const bell = 1 - t2 * t2
            const sign = diff >= 0 ? 1.0 : -0.32
            // displ in screen pixels → encode into channel units
            const displ = DISPL_AMP_PX * bell * sign * decay

            const angle = Math.atan2(dy_h, dx_h)
            const idx   = (py * SW + px) * 4
            d[idx]     = Math.max(0, Math.min(255, d[idx]     + displ * Math.cos(angle) * chanPerPx))
            d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + displ * Math.sin(angle) * chanPerPx))
          }
        }
      }

      displCtx.putImageData(img, 0, 0)
      feImgRef.current?.setAttribute('href', displCanvas.toDataURL())

      if (!anyActive && !displNeedsReset) return
      if (!anyActive) {
        displCtx.fillStyle = 'rgb(128,128,128)'
        displCtx.fillRect(0, 0, SW, SH)
        feImgRef.current?.setAttribute('href', displCanvas.toDataURL())
        displNeedsReset = false
      } else {
        displNeedsReset = true
      }
    }

    /* ── Visual ring glow (wall-clock based, same formula as displacement) ─ */
    const drawRings = (now: number) => {
      ringCtx.clearRect(0, 0, ringCanvas.width, ringCanvas.height)

      const heroW = sticky.offsetWidth  || 1920
      const heroH = sticky.offsetHeight || 900
      const rw    = ringCanvas.width
      const rh    = ringCanvas.height

      for (const w of waves.current) {
        const age    = (now - w.born) / 1000
        const decay  = Math.max(0, 1 - (now - w.born) / WAVE_LIFE_MS)
        if (decay <= 0) continue

        const ringR  = age * WAVE_SPEED_PX                      // hero-px
        const falloff = Math.max(0, 1 - ringR / (heroW * 0.85)) // fade at distance
        const opac   = (w.big ? 0.28 : 0.13) * decay * falloff
        if (opac < 0.003) continue

        ringCtx.beginPath()
        ringCtx.arc(
          w.hx / heroW * rw,
          w.hy / heroH * rh,
          ringR / heroW * rw,
          0, Math.PI * 2,
        )
        ringCtx.strokeStyle = `rgba(253,184,19,${opac.toFixed(3)})`
        ringCtx.lineWidth   = 1.5
        ringCtx.stroke()
      }
    }

    /* ── Main animation loop ── */
    let frame = 0

    const loop = (_ts: number) => {
      frame++
      const now = performance.now()

      // Retire expired waves
      waves.current = waves.current.filter(w => now - w.born < WAVE_LIFE_MS + 200)

      // Rebuild displacement map every 2 frames (≈30 fps) to limit PNG cost
      if (frame % 2 === 0) buildDisplMap(now)

      // Ring glow at full frame rate
      drawRings(now)

      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    /* ── Pointer: inject wave from exact click position ── */
    const onDown = (e: PointerEvent) => {
      const rect = sticky.getBoundingClientRect()
      addWave(e.clientX - rect.left, e.clientY - rect.top, true)
    }
    sticky.addEventListener('pointerdown', onDown)

    /* ── Auto-vibrations ─────────────────────────────────────────────────
       First wave after 20 s, then one every 12–18 s at a random position.
       addWave's MIN_GAP guard is a secondary safety net.                   */
    const scheduleAuto = () => {
      const delay = 12000 + Math.random() * 6000
      autoTimerRef.current = setTimeout(() => {
        const rect    = sticky.getBoundingClientRect()
        const visible = rect.bottom > 0 && rect.top < window.innerHeight
        if (visible) {
          addWave(
            sticky.offsetWidth  * (0.15 + Math.random() * 0.70),
            sticky.offsetHeight * (0.15 + Math.random() * 0.70),
            false,
          )
        }
        scheduleAuto()
      }, delay)
    }
    autoTimerRef.current = setTimeout(scheduleAuto, 20000)

    return () => {
      sticky.removeEventListener('pointerdown', onDown)
      cancelAnimationFrame(rafRef.current)
      clearTimeout(autoTimerRef.current)
      ro.disconnect()
    }
  }, [])

  /* ── Shared pieces (identical in both layouts) ── */
  const waveDefs = (
    <>
      {/* Hidden displacement map canvas */}
      <canvas ref={displCanvasRef} width={SW} height={SH} style={{ display: 'none' }} aria-hidden />

      {/* SVG filter — updated every ~33 ms with canvas PNG */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden>
        <defs>
          <filter
            id="hero-wave"
            x="0" y="0"
            width="100%" height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feImage ref={feImgRef} preserveAspectRatio="none" result="wave-map" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="wave-map"
              scale={String(DISPL_SCALE)}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
    </>
  )

  const backdrop = (
    <div aria-hidden style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: `
        radial-gradient(ellipse 60% 70% at 36% 50%, rgba(88,28,60,.58) 0%, transparent 62%),
        radial-gradient(ellipse 40% 35% at 18% 74%, rgba(192,57,123,.10) 0%, transparent 55%),
        radial-gradient(ellipse 45% 40% at 72% 30%, rgba(253,184,19,.06) 0%, transparent 55%)
      `,
    }} />
  )

  const ringCanvas = (
    <canvas ref={ringCanvasRef} aria-hidden style={{
      position: 'absolute', inset: 0,
      width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 1,
    }} />
  )

  const titleBlock = (
    <>
      <motion.h1
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: [.16, 1, .3, 1] }}
        style={{
          fontFamily: t.display, fontWeight: 900,
          // Stacked tiers scale with the viewport; desktop keeps its own ramp
          // so 13"/14" laptops shrink the title instead of wrapping it.
          fontSize: stack ? 'clamp(30px, 7vw, 52px)' : 'clamp(36px, 4.8vw, 70px)',
          lineHeight: 1.05, letterSpacing: '-.03em',
          color: t.fg, margin: stack ? '0 0 32px' : '0 0 44px',
        }}
      >
        Mapa Numerológico<br />
        <span style={{ WebkitTextStroke: `2px ${t.gold}`, WebkitTextFillColor: 'transparent' }}>
          Cabalístico
        </span>{' '}
        Completo.
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.45, duration: 0.6, ease: [.16, 1, .3, 1] }}
        style={{ pointerEvents: 'auto' }}
      >
        <PrimaryBtn
          onClick={onCta}
          style={{
            fontSize: stack ? 14 : 15,
            padding: stack ? '16px 30px' : '18px 44px',
            boxShadow: '0 0 50px rgba(253,184,19,.28), 0 0 80px rgba(232,93,4,.12)',
          }}
        >
          Criar Meu Primeiro Mapa
        </PrimaryBtn>
        <p style={{
          fontFamily: t.body, fontSize: 13, color: t.fg4,
          marginTop: 16, letterSpacing: '.05em',
        }}>
          7 dias gratuitos · Sem cartão de crédito
        </p>
      </motion.div>
    </>
  )

  /* ── Stacked layout: phones and portrait tablets ─────────────────────
     Normal flow, no pinning and no ghost grid — the title sits on top and
     HeroSequence renders the shared mockup directly below it. The filtered
     layer spans the whole wave box (padding lives INSIDE it) so the
     displacement map stays aligned with what the canvas measured.        */
  if (stack) {
    return (
      <section style={{ position: 'relative' }}>
        {waveDefs}
        <div
          ref={stickyRef}
          style={{ position: 'relative', overflow: 'hidden', cursor: 'crosshair' }}
        >
          {backdrop}
          {ringCanvas}
          <div style={{
            position: 'relative', zIndex: 10,
            padding: `${SITE_HEADER_H + 36}px 0 28px`,
            filter: 'url(#hero-wave)', willChange: 'filter',
          }}>
            <div style={{
              maxWidth: 1180, margin: '0 auto', padding: pad, width: '100%',
              textAlign: 'center',   // stacked tiers read centred
            }}>
              {titleBlock}
            </div>
          </div>
        </div>
      </section>
    )
  }

  /* ── JSX ── */
  return (
    <section style={{ minHeight: HERO_BAND_H, position: 'relative' }}>

      {waveDefs}

      {/* ── Sticky container: bg + ring canvas + MOCKUP ─────────────────────
          Uses the same grid as the text layer below so the mockup sits in
          exactly the right column while the text div scrolls away.          */}
      <div
        ref={stickyRef}
        style={{
          position: 'sticky', top: 0,
          height: HERO_BAND_H, overflow: 'hidden',
          cursor: 'crosshair',
          display: 'flex', alignItems: 'center',
          paddingTop: SITE_HEADER_H,   // centre below the fixed header
        }}
      >
        {backdrop}
        {ringCanvas}

        {/* Ghost grid — mirrors the text grid; left column is empty so the
            text layer above shows through; right column holds the mockup.   */}
        <div style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 1180,
          margin: '0 auto', padding: heroPad,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 56, alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {/* Left: invisible spacer — text layer paints here */}
          <div />

          {/* Right: mockup, unaffected by wave filter. Omitted when the
              shared floating mockup (HeroSequence) takes over this slot.  */}
          {showMockup ? (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 1, ease: [.16, 1, .3, 1] }}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              <div aria-hidden style={{
                position: 'absolute',
                width: 360, height: 360, borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(253,184,19,.12) 0%, transparent 70%)',
                filter: 'blur(40px)',
              }} />
              <motion.div
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ position: 'relative' }}
              >
                <AppMockup />
              </motion.div>
            </motion.div>
          ) : <div />}
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1.4, duration: 1 }}
          style={{ position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 3 }}
          aria-hidden
        >
          <div style={{
            width: 22, height: 36, borderRadius: 11,
            border: '1px solid rgba(253,184,19,.3)',
            display: 'flex', justifyContent: 'center', paddingTop: 6,
          }}>
            <motion.div
              animate={{ y: [0, 9, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 3, height: 7, borderRadius: 99, background: t.gold }}
            />
          </div>
        </motion.div>

        {/* Wave edge into next section */}
        <svg
          viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden
          style={{ position: 'absolute', bottom: -1, left: 0, width: '100%', height: 80, zIndex: 4, pointerEvents: 'none' }}
        >
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={t.night} />
        </svg>

      </div>

      {/* ── Text layer: scrolls normally with the page ────────────────────
          Full-width + 100svh keeps feDisplacementMap coordinates aligned
          with the displacement canvas (both span the full hero viewport).
          Same grid as sticky so text sits exactly in the left column.
          pointerEvents:none lets clicks fall through to the sticky div.     */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: HERO_BAND_H,
          display: 'flex', alignItems: 'center',
          paddingTop: SITE_HEADER_H,   // matches the sticky layer's offset
          zIndex: 10,
          filter: 'url(#hero-wave)', willChange: 'filter',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: heroPad,
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 56, alignItems: 'center',
        }}>
          {/* Left column: title + CTA */}
          <div>{titleBlock}</div>

          {/* Right column: empty — mockup in sticky shows through */}
          <div />
        </div>
      </div>

    </section>
  )
}

/* ─── App analysis screen mockup (CSS only) ──────────────────────────── */
export function AppMockup() {
  return (
    <div style={{
      width: '100%', maxWidth: 340, background: '#0f0616',
      borderRadius: 20,
      border: '1px solid rgba(253,184,19,.18)',
      overflow: 'hidden',
      boxShadow: `0 50px 100px rgba(0,0,0,.65), 0 0 0 0.5px rgba(255,255,255,.06), 0 0 60px rgba(253,184,19,.06)`,
      transform: 'rotate(1.8deg)',
    }}>
      {/* Window chrome */}
      <div style={{ height: 30, background: '#180b1a', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => (
          <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
        ))}
        <div style={{ flex: 1, height: 15, borderRadius: 4, background: 'rgba(255,255,255,.05)', margin: '0 12px' }} />
      </div>

      <div style={{ padding: '16px 14px 18px' }}>
        {/* Name input */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: '10px 13px', marginBottom: 12, border: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,.35)', marginBottom: 3, letterSpacing: '.08em', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>Nome completo</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.88)', fontFamily: 'sans-serif', fontWeight: 600 }}>Maria Silva</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontFamily: 'sans-serif', marginTop: 2 }}>22 / 03 / 1992</div>
        </div>

        {/* Number chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 7, marginBottom: 12 }}>
          {[
            { n: '7',  label: 'Expressão', color: '#fdb813' },
            { n: '9',  label: 'Motivação', color: '#e85d04' },
            { n: '3',  label: 'Impressão', color: '#a855f7' },
            { n: '22', label: 'Destino',   color: '#c0396a' },
          ].map(({ n, label, color }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 9, padding: '8px 4px 7px', textAlign: 'center', border: `1px solid ${color}40` }}>
              <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,.38)', marginTop: 3, fontFamily: 'sans-serif', letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Cycle section */}
        <div style={{ background: 'rgba(253,184,19,.06)', borderRadius: 10, padding: '10px 13px', marginBottom: 10, border: '1px solid rgba(253,184,19,.13)' }}>
          <div style={{ fontSize: 8, color: 'rgba(253,184,19,.55)', marginBottom: 7, letterSpacing: '.1em', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>Ciclo de Vida Atual</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#fdb813', fontFamily: 'Georgia, serif', lineHeight: 1 }}>34</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,.3)', fontFamily: 'sans-serif' }}>Período II</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,.3)', fontFamily: 'sans-serif' }}>67%</span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,.07)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: '67%', height: '100%', background: 'linear-gradient(90deg, #fdb813, #e85d04)', borderRadius: 99 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Personal year/month/day */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[['Ano','6','#fdb813'],['Mês','3','#e85d04'],['Dia','9','#a855f7']].map(([lbl,val,clr]) => (
            <div key={lbl} style={{ flex: 1, background: 'rgba(255,255,255,.04)', borderRadius: 8, padding: '8px 6px', textAlign: 'center', border: '1px solid rgba(255,255,255,.06)' }}>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,.3)', fontFamily: 'sans-serif', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 2 }}>{lbl}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: clr, fontFamily: 'Georgia, serif', lineHeight: 1 }}>{val}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, #fdb813 0%, #e85d04 100%)', borderRadius: 9, padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#1a0900', fontFamily: 'sans-serif', letterSpacing: '.04em' }}>
          Gerar Mapa Completo PDF
        </div>
      </div>
    </div>
  )
}
