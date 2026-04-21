import { useState } from 'react'
import { t } from '../../lib/tokens'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'

interface Props {
  onClose: () => void
}

const formats = [
  { id: 'pdf',  label: 'PDF',  desc: 'Pronto para entrega' },
  { id: 'docx', label: 'DOCX', desc: 'Editável no Word e Google Docs' },
]

export function ExportModal({ onClose }: Props) {
  const [fmt, setFmt] = useState<'pdf' | 'docx'>('pdf')

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480,
          background: t.night2,
          borderRadius: 20,
          border: `1px solid ${t.pb}`,
          padding: 28,
          boxShadow: '0 20px 80px rgba(0,0,0,.6)',
        }}
      >
        <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 20, color: t.fg, margin: 0 }}>
          Exportar Relatório
        </h3>
        <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, marginTop: 4 }}>
          Escolha o formato e o template da sua marca.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
          {formats.map(o => {
            const on = fmt === o.id
            return (
              <button
                key={o.id}
                onClick={() => setFmt(o.id as 'pdf' | 'docx')}
                style={{
                  padding: 16, borderRadius: 14, textAlign: 'left', cursor: 'pointer',
                  background: on ? 'rgba(253,184,19,.08)' : 'rgba(42,22,32,.35)',
                  border: `1px solid ${on ? t.gold : t.pb}`,
                  fontFamily: t.body, color: t.fg,
                  transition: 'all .2s',
                }}
              >
                <div style={{ fontFamily: t.display, fontWeight: 700, fontSize: 16, color: on ? t.gold : t.fg }}>
                  {o.label}
                </div>
                <div style={{ fontSize: 12, color: t.fg3, marginTop: 4 }}>{o.desc}</div>
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <SecondaryBtn onClick={onClose}>Cancelar</SecondaryBtn>
          <PrimaryBtn onClick={onClose} small>Gerar {fmt.toUpperCase()}</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}
