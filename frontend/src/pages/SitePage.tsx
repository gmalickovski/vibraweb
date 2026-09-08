import { SiteHeader }  from '../components/site/SiteHeader'
import { HeroSequence } from '../components/site/HeroSequence'
import { Analyses }     from '../components/site/Analyses'
import { Features }     from '../components/site/Features'
import { Pricing }      from '../components/site/Pricing'
import { FAQ }          from '../components/site/FAQ'
import { Contact }      from '../components/site/Contact'
import { SiteFooter }   from '../components/site/SiteFooter'
import { WaveDivider }  from '../components/site/WaveDivider'
import { WaveSpine }    from '../components/site/WaveSpine'
import { useSiteLayout } from '../lib/site-layout'
import { t }            from '../lib/tokens'

interface Props {
  onEnter: () => void
}

/* ─── Section card ──────────────────────────────────────────────────────
   Plain visual wrapper: rounded top edge + shadow, so each block reads as
   a separate sheet. No sticky/z-index — these scroll normally.          */
function SectionCard({ children, bg, rounded = true }: {
  children: React.ReactNode
  bg: string
  rounded?: boolean
}) {
  return (
    <div style={{
      borderRadius: rounded ? '28px 28px 0 0' : 0,
      overflow: 'hidden',
      background: bg,
      boxShadow: '0 -18px 48px rgba(0,0,0,.65)',
    }}>
      {children}
    </div>
  )
}

export function SitePage({ onEnter }: Props) {
  const { mobile } = useSiteLayout()
  const spineScale = mobile ? 0.55 : 1
  // Phones drop the wave dividers entirely: their fill (rgb(21,9,18)) differs
  // from the section background (#120A10), so at small sizes they read as
  // stray horizontal bands instead of a wave. Flat background, simple joins.
  const showDividers = !mobile
  return (
    /*
     * overflow-x: clip — clips horizontal bleed WITHOUT creating a scroll
     * container (unlike overflow:hidden which would break position:sticky).
     * Supported in all modern browsers (Chrome 90+, FF 81+, Safari 15+).
     */
    <div style={{ background: t.night, color: t.fg, minHeight: '100vh', position: 'relative', overflowX: 'clip' }}>

      <SiteHeader onEnter={onEnter} />

      {/* ── WAVE ERA — the "sheet" ──────────────────────────────────────
          Opaque, stacked ABOVE the Pricing block (zIndex 2 vs 1), so while
          this whole block scrolls up it hides Pricing behind it and then
          lifts away like a page, revealing Pricing underneath.
          The spine lives inside so it ends exactly with the wave era.    */}
      <div style={{ position: 'relative', zIndex: 2, background: t.night }}>

        {/* Wave spine — contained in its own clip wrapper so its fixed SVG
            height never creates extra vertical scroll space.             */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: 130 * spineScale, overflow: 'hidden', pointerEvents: 'none',
          // Layer order: page/section backgrounds → spine → content.
          // z-index 1 lifts the spine over every section background (those are
          // painted as positioned-auto blocks); each section's content sits at
          // z-index 2 so cards, mockups and copy still cover the spine.
          zIndex: 1,
        }}>
          <WaveSpine scale={spineScale} />
        </div>

        <HeroSequence onCta={onEnter} />

        {showDividers && <WaveDivider fillColor="rgb(21,9,18)" flip />}
        <Analyses />

        {showDividers && <WaveDivider fillColor={t.night} />}
        <Features />

        {/* Final wave closes the wave era — the sheet's bottom edge */}
        {showDividers && <WaveDivider fillColor="rgb(21,9,18)" flip />}
      </div>

      {/* ── PRICING REVEAL ──────────────────────────────────────────────
          Pulled up one viewport so it sits BEHIND the wave era's last
          screen, then pinned for exactly that one viewport of scrolling —
          the sheet above slides off and uncovers it. The trailing spacer
          is what gives the pin its duration; -100svh + 100svh cancel out,
          so nothing below shifts.                                        */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: '-100svh' }}>
        <div style={{ position: 'sticky', top: 0 }}>
          <SectionCard bg={t.bandPurple}><Pricing onSignup={onEnter} /></SectionCard>
        </div>
        <div aria-hidden style={{ height: '100svh' }} />
      </div>

      {/* ── NORMAL SECTIONS — no stacking from here on ─────────────────
          Bands alternate: Pricing (purple) · FAQ (night) · Contact (purple),
          continuing the rhythm started at the "4 blocos" section.        */}
      <SectionCard bg={t.night}><FAQ /></SectionCard>
      <SectionCard bg={t.bandPurple}><Contact onEnter={onEnter} /></SectionCard>
      <SectionCard bg="#0d0810" rounded={false}><SiteFooter onEnter={onEnter} /></SectionCard>

    </div>
  )
}
