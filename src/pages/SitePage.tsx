import { t } from '../lib/tokens'
import { SiteHeader } from '../components/site/SiteHeader'
import { Hero } from '../components/site/Hero'
import { Analyses } from '../components/site/Analyses'
import { Features } from '../components/site/Features'
import { Pricing } from '../components/site/Pricing'
import { FAQ } from '../components/site/FAQ'
import { SiteFooter } from '../components/site/SiteFooter'

interface Props {
  onEnter: () => void
}

export function SitePage({ onEnter }: Props) {
  return (
    <div style={{ background: t.night, color: t.fg, minHeight: '100vh' }}>
      <SiteHeader onEnter={onEnter} />
      <Hero onCta={onEnter} />
      <Analyses />
      <Features />
      <Pricing onSignup={onEnter} />
      <FAQ />
      <SiteFooter />
    </div>
  )
}
