// SavedAnalyses.tsx — coluna de listagem do "Análises Salvas" (/app/salvos).
// Redesenho (2026-07-12): título solto (h2) virou o mesmo header fixo com
// PageTitle (título + ícone de info) usado em Blocos/Templates/Personalizar
// Textos — mesmo padrão de design em toda a área de edição do app.
// Estrutura agora é header fixo / meio rolável (lista) — igual às outras
// páginas, sem rodapé porque não há ação persistente aqui (a ação de cada
// item é abrir/excluir, já dentro da própria linha da lista).

import { useState, useEffect } from 'react'
import { t } from '../../lib/tokens'
import { listAnalyses, deleteAnalysis, type AnalysisRow } from '../../lib/neon'
import { PageTitle } from '../shared/PageTitle'
import type { AnalysisData, AnalysisTab } from '../../pages/AppPage'

const typeLabel: Record<string, string> = {
  pessoal:   'Mapa Pessoal',
}

const typeColor: Record<string, string> = {
  pessoal:   t.gold,
}

interface Props {
  selectedId?: string | null
  onLoad: (row: AnalysisRow) => void
}

export function SavedAnalyses({ selectedId, onLoad }: Props) {
  const [rows, setRows] = useState<AnalysisRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listAnalyses().then(data => { setRows(data); setLoading(false) })
  }, [])

  async function handleDelete(id: string) {
    await deleteAnalysis(id)
    setRows(prev => prev.filter(r => r.id !== id))
  }

  const headerContent = (
    <div style={{ padding: 20, borderBottom: `1px solid ${t.pb}`, flexShrink: 0 }}>
      <PageTitle
        title="Análises Salvas"
        info="Todas as análises que você salvou aparecem aqui. Clique numa para reabrir, continuar editando ou visualizar o PDF."
        size={16}
      />
    </div>
  )

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.night }}>
        {headerContent}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: t.body, fontSize: 14, color: t.fg3 }}>Carregando análises…</span>
        </div>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.night }}>
        {headerContent}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 32 }}>❋</div>
          <p style={{ fontFamily: t.body, fontSize: 14, color: t.fg3, textAlign: 'center' }}>
            Nenhuma análise salva ainda.<br />Complete uma análise e clique em "Salvar".
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: t.night }}>
      {headerContent}
      <div className="vw-scroll-area" style={{
        flex: 1, padding: 20, overflowY: 'auto',
        backgroundImage: 'radial-gradient(circle at 70% 0%, rgba(88,28,60,.2), transparent 60%)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(row => {
            const isSelected = row.id === selectedId
            return (
            <div
              key={row.id}
              onClick={() => onLoad(row)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px', borderRadius: 16,
                background: isSelected ? 'rgba(253,184,19,.15)' : 'rgba(42,22,32,.35)',
                border: isSelected ? `1px solid ${t.gold}` : `1px solid ${t.pb}`,
                cursor: 'pointer',
                transition: 'background 0.2s, border 0.2s'
              }}>
              <div style={{
                width: 8, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0,
                background: typeColor[row.type] || t.gold,
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: t.display, fontWeight: 700, fontSize: 15, color: t.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.subject || '—'}
                </div>
                <div style={{ fontFamily: t.body, fontSize: 12, color: t.fg3, marginTop: 2 }}>
                  {typeLabel[row.type] || 'Mapa'} · {new Date(row.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(row.id) }}
                style={{
                  background: 'transparent', border: `1px solid ${t.pb}`,
                  color: t.fg4, fontFamily: t.body, fontSize: 12,
                  padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                }}
                title="Excluir análise"
              >
                ✕
              </button>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}
