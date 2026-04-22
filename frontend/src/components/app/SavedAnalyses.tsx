import { useState, useEffect } from 'react'
import { t } from '../../lib/tokens'
import { listAnalyses, deleteAnalysis, type AnalysisRow } from '../../lib/supabase'
import type { AnalysisData, AnalysisTab } from '../../pages/AppPage'

const typeLabel: Record<AnalysisTab, string> = {
  pessoal:   'Mapa Pessoal',
  bebe:      'Mapa do Bebê',
  empresa:   'Mapa da Empresa',
  previsoes: 'Mapa de Previsões',
}

const typeColor: Record<AnalysisRow['type'], string> = {
  pessoal:   t.gold,
  bebe:      t.coral,
  empresa:   t.magenta,
  previsoes: t.wine,
}

interface Props {
  onLoad: (row: { input_data: AnalysisData; type: AnalysisTab }) => void
}

export function SavedAnalyses({ onLoad }: Props) {
  const [rows, setRows] = useState<AnalysisRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAnalyses().then(data => { setRows(data); setLoading(false) })
  }, [])

  async function handleDelete(id: string) {
    await deleteAnalysis(id)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.night }}>
        <span style={{ fontFamily: t.body, fontSize: 14, color: t.fg3 }}>Carregando análises…</span>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: t.night }}>
        <div style={{ fontSize: 32 }}>❋</div>
        <p style={{ fontFamily: t.body, fontSize: 14, color: t.fg3, textAlign: 'center' }}>
          Nenhuma análise salva ainda.<br />Complete uma análise e clique em "Salvar".
        </p>
      </div>
    )
  }

  return (
    <div style={{
      flex: 1, padding: 28, overflowY: 'auto',
      background: t.night,
      backgroundImage: 'radial-gradient(circle at 70% 0%, rgba(88,28,60,.2), transparent 60%)',
    }}>
      <h2 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 20, color: t.fg, marginBottom: 20 }}>
        Análises Salvas
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(row => (
          <div key={row.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '16px 20px', borderRadius: 16,
            background: 'rgba(42,22,32,.35)', border: `1px solid ${t.pb}`,
          }}>
            <div style={{
              width: 8, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0,
              background: typeColor[row.type],
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: t.display, fontWeight: 700, fontSize: 15, color: t.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.subject || '—'}
              </div>
              <div style={{ fontFamily: t.body, fontSize: 12, color: t.fg3, marginTop: 2 }}>
                {typeLabel[row.type]} · {new Date(row.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
            <button
              onClick={() => onLoad({ input_data: row.input_data, type: row.type })}
              style={{
                background: 'rgba(253,184,19,.08)', border: `1px solid ${t.gold}`,
                color: t.gold, fontFamily: t.body, fontSize: 12, fontWeight: 600,
                padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
              }}
            >
              Abrir
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              style={{
                background: 'transparent', border: `1px solid ${t.pb}`,
                color: t.fg4, fontFamily: t.body, fontSize: 12,
                padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
