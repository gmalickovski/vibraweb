import { motion, useScroll, useTransform } from 'framer-motion'
import { t } from '../../lib/tokens'
import { useSiteLayout } from '../../lib/site-layout'
import { Hero, AppMockup, HERO_BAND_H, SITE_HEADER_H } from './Hero'

/* ─── Hero + handoff sequence ────────────────────────────────────────────
   ONE floating mockup lives in the right column and spans both sections.
   It is position:sticky inside this wrapper, so it stays pinned at the
   viewport centre while the Hero scrolls past, then "lands" centred in the
   right column of the section below — pure vertical travel, the horizontal
   position never changes.

     ┌──────────────────────────────┐
     │  Hero title      │  ▢ mockup │  ← sticky, pinned
     ├──────────────────┼───────────┤
     │  Section text    │  ▢ mockup │  ← released, final position
     └──────────────────────────────┘

   The wrapper must NOT set overflow (any value other than visible breaks
   position:sticky).                                                       */

interface Props { onCta: () => void }

/* Shared label styling — rendered inline on desktop, and separately above
   the mockup on the stacked layout. */
const LABEL_STYLE = {
  fontFamily: t.mono, fontWeight: 500, fontSize: 12,
  color: t.gold, letterSpacing: '.16em', textTransform: 'uppercase',
} as const

/* Landing copy — shared by both layouts.
   `showLabel` is false on the stacked layout, where the label lives in the
   gap the drifting mockup opens up.
   `plain` drops the built-in entrance so the caller can drive the reveal
   from scroll instead (stacked layout gates it to a later scroll point). */
function LandingCopy({ stack, showLabel = true, plain = false }: {
  stack: boolean
  showLabel?: boolean
  plain?: boolean
}) {
  const entrance = plain ? {} : {
    initial: { opacity: 0, y: 32 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-120px' },
    transition: { duration: 0.8, ease: [.16, 1, .3, 1] as const },
  }
  return (
    <motion.div
      {...entrance}
      style={stack ? { textAlign: 'center' } : undefined}
    >
      <p style={{ ...LABEL_STYLE, marginBottom: 14, display: showLabel ? undefined : 'none' }}>
        Área de Análise
      </p>
      <h2 style={{
        fontFamily: t.display, fontWeight: 900,
        fontSize: stack ? 'clamp(24px, 5.6vw, 38px)' : 'clamp(28px, 3.4vw, 46px)',
        lineHeight: 1.1, letterSpacing: '-.02em', color: t.fg,
        margin: '0 0 20px',
      }}>
        Texto provisório desta seção,<br />definimos o conteúdo depois.
      </h2>
      <p style={{
        fontFamily: t.body, fontSize: 15, color: t.fg3,
        lineHeight: 1.7, maxWidth: 440,
        margin: stack ? '0 auto' : undefined,
      }}>
        Placeholder para o conteúdo real, que será escrito junto com o
        layout final desta seção.
      </p>
    </motion.div>
  )
}

/* Vertical travel of the stacked mockup, in px. Also the height of the gap
   that opens above it, which is where the "Área de Análise" label appears. */
const DRIFT_PX = 132

/* ── Stacked sequence: phones and portrait tablets ────────────────────
   Everything is one column: Hero title → mockup (full row) → landing
   copy. Scrolling down drifts the mockup downward so it pulls away from
   the hero title; a spacer right below it grows by the same amount, so
   the mockup physically PUSHES every following section down. Scrolling
   back up shrinks it again and they ride back up. Driven by raw scrollY
   so the motion is symmetric and independent of section heights.
   No pinning — that would fight touch scroll.

   The growing spacer reflows the content below by design: that push IS
   the effect. It is bounded (132px over 420px of scroll) and mobile-only.

   The "Área de Análise" label is absolutely placed in the gap the drift
   opens above the mockup, fading in as it widens — so it is revealed on the
   way down and folds away again on the way back up. Being absolute, it
   never reserves layout space, so at rest the mockup still sits tight
   under the hero title.                                                   */
function StackedSequence({ onCta, pad }: { onCta: () => void; pad: string }) {
  const { scrollY } = useScroll()
  const drift        = useTransform(scrollY, [0, 420], [0, DRIFT_PX])
  // The label rides INSIDE the drifting wrapper (see below), so its distance
  // to the mockup is fixed by construction — only its opacity is animated.
  const labelOpacity = useTransform(scrollY, [50, 210], [0, 1])
  // Body copy starts resolving as soon as the scroll begins, gradually.
  const copyOpacity  = useTransform(scrollY, [40, 330], [0, 1])
  const copyY        = useTransform(scrollY, [40, 330], [26, 0])

  return (
    <div style={{ position: 'relative' }}>
      <Hero onCta={onCta} showMockup={false} />

      {/* Mockup — occupies a full row between the two blocks of copy.
          zIndex 2 keeps it above the wave spine (which sits at 1).       */}
      <div style={{ background: t.night, padding: '4px 0' }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: pad,
          display: 'flex', justifyContent: 'center',
          position: 'relative', zIndex: 2,
        }}>
          <motion.div style={{ y: drift, position: 'relative', width: '100%', maxWidth: 340 }}>
            {/* Inside the drifting wrapper, anchored to the mockup's top edge:
                it travels in lockstep and the gap stays fixed at 18px. */}
            <motion.p
              style={{
                ...LABEL_STYLE,
                opacity: labelOpacity,
                position: 'absolute', bottom: '100%', left: 0, right: 0,
                margin: '0 0 38px', textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              Área de Análise
            </motion.p>

            <div aria-hidden style={{
              position: 'absolute', inset: '-12% -8%',
              background: 'radial-gradient(ellipse, rgba(253,184,19,.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }} />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ position: 'relative' }}
            >
              <AppMockup />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Grows with the drift — this is what pushes every section below down */}
      <motion.div aria-hidden style={{ height: drift, background: t.night }} />

      {/* Landing copy — sits well clear of the mockup and is revealed only
          once the scroll has carried past it.                             */}
      <section style={{ position: 'relative', background: t.night, padding: '46px 0 48px' }}>
        <motion.div
          style={{
            maxWidth: 1180, margin: '0 auto', padding: pad,
            position: 'relative', zIndex: 2,
            opacity: copyOpacity, y: copyY,
          }}
        >
          {/* Label omitted here — it lives in the gap above the mockup */}
          <LandingCopy stack showLabel={false} plain />
        </motion.div>
      </section>
    </div>
  )
}

export function HeroSequence({ onCta }: Props) {
  const { stack, pad, padFor } = useSiteLayout()

  if (stack) return <StackedSequence onCta={onCta} pad={pad} />

  const GRID = {
    maxWidth: 1180,
    padding: padFor(1180),
    gridTemplateColumns: '1fr 1fr',
    gap: 56,
  } as const

  return (
    <div style={{ position: 'relative' }}>

      {/* Hero renders without its own mockup — the shared one floats above */}
      <Hero onCta={onCta} showMockup={false} />

      {/* Landing section — same band height as the Hero, so the sticky
          mockup releases with the section centred on screen.              */}
      <section style={{
        position: 'relative', background: t.night,
        height: HERO_BAND_H, display: 'flex', alignItems: 'center',
        paddingTop: SITE_HEADER_H,   // centre below the fixed header
      }}>
        <div style={{
          width: '100%', margin: '0 auto', display: 'grid', alignItems: 'center',
          ...GRID,
        }}>
          <LandingCopy stack={false} />

          {/* Right column stays empty — the floating mockup lands here */}
          <div />
        </div>
      </section>

      {/* ── The shared floating mockup ──────────────────────────────────
          Absolute overlay spanning the whole wrapper, mirroring the same
          grid so the mockup sits in the right column. Inside it, a sticky
          box pins the mockup to the viewport centre until the wrapper ends. */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', height: '100%', margin: '0 auto', display: 'grid',
          ...GRID,
        }}>
          <div />
          <div style={{ position: 'relative', height: '100%' }}>
            <div style={{
              position: 'sticky', top: 0, height: HERO_BAND_H,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingTop: SITE_HEADER_H,   // keeps the mockup aligned with the text
            }}>
              <div style={{
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
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
