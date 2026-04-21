import { t } from '../../lib/tokens'

export function SiteFooter() {
  return (
    <footer style={{
      background: 'rgba(28,16,22,.7)',
      borderTop: `1px solid ${t.pb}`,
      padding: '40px 32px',
      textAlign: 'center',
    }}>
      <img src="/assets/logo-vibraweb-mark.svg" alt="" style={{ width: 42, marginBottom: 10 }} />
      <p style={{ fontFamily: t.body, fontSize: 12, color: t.fg4, margin: 0 }}>
        © {new Date().getFullYear()} Vibraweb · Sua assinatura em harmonia com os números. · by Studio MLK
      </p>
    </footer>
  )
}
