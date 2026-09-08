import { t } from '../../lib/tokens'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'

interface Props {
  onEditSaved: () => void
  onNewAnalysis: () => void
}

export function SaveSuccessModal({ onEditSaved, onNewAnalysis }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
        overflowY: 'auto',
        zIndex: 50,
      }}
      onClick={onNewAnalysis}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 100%)',
          background: t.night2,
          borderRadius: 20,
          border: `1px solid ${t.pb}`,
          padding: 32,
          boxShadow: '0 20px 80px rgba(0,0,0,.6)',
        }}
      >
        <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 22, color: t.fg, margin: 0 }}>
          Mapa Salvo!
        </h3>
        <p style={{ fontFamily: t.body, fontSize: 14, color: t.fg3, marginTop: 8, lineHeight: 1.6 }}>
          Seu mapa foi salvo com sucesso. O que deseja fazer agora?
        </p>

        <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <SecondaryBtn onClick={onNewAnalysis}>Iniciar Nova Análise</SecondaryBtn>
          <PrimaryBtn onClick={onEditSaved} small>Editar Mapa Salvo</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}
