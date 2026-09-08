// InputPanel.tsx — coluna de entrada de dados do "Novo Mapa" (/app/novo).
// Redesenho (2026-07-12): título solto (h1 + parágrafo) virou o mesmo header
// fixo com PageTitle (título + ícone de info) usado em Blocos/Templates/
// Personalizar Textos — mesmo padrão de design em toda a área de edição do
// app. Estrutura agora é header fixo / meio rolável (campos) / rodapé fixo
// (aviso de auto-save), igual às outras páginas.

import { t } from '../../lib/tokens'
import { Field } from '../shared/Field'
import { PageTitle } from '../shared/PageTitle'
import type { AnalysisData, AnalysisTab } from '../../pages/AppPage'
import { useIsMobile } from '../../lib/useIsMobile'

interface Props {
  data: AnalysisData
  setData: (d: AnalysisData) => void
  tab: AnalysisTab
  setTab: (tab: AnalysisTab) => void
}

export function InputPanel({ data, setData }: Props) {
  const isMobile = useIsMobile(900)
  const set = (k: keyof AnalysisData) => (val: string) => setData({ ...data, [k]: val })

  const handleDobChange = (val: string) => {
    let v = val.replace(/\D/g, '')
    if (v.length > 8) v = v.slice(0, 8)
    if (v.length > 4) v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4)
    else if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2)
    setData({ ...data, dob: v })
  }

  return (
    <div style={{
      flex: isMobile ? '0 0 auto' : '0 0 420px',
      width: isMobile ? '100%' : undefined,
      maxHeight: isMobile ? '42vh' : undefined,
      background: t.night2,
      borderRight: isMobile ? 'none' : `1px solid ${t.pb}`,
      borderBottom: isMobile ? `1px solid ${t.pb}` : 'none',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ padding: 20, borderBottom: `1px solid ${t.pb}`, flexShrink: 0 }}>
        <PageTitle
          title="Mapa Pessoal"
          info="Mapa numerológico pessoal. Preencha os campos abaixo com os dados do seu cliente para realizar a análise e gerar o relatório em PDF."
          size={16}
        />
      </div>

      <div className="vw-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Field label="Nome Completo de Nascimento" value={data.nome} onChange={set('nome')} placeholder="Digite o nome completo" />
        <Field label="Data de Nascimento" value={data.dob} onChange={handleDobChange} placeholder="DD/MM/AAAA" />
      </div>

      <div style={{ padding: 20, flexShrink: 0 }}>
        <div style={{
          padding: 14, borderRadius: 12,
          border: `1px dashed ${t.pb}`,
          background: 'rgba(46,163,106,.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: t.success, fontWeight: 700 }}>✓</span>
            <span style={{ fontFamily: t.body, fontSize: 12, color: t.success, fontWeight: 600 }}>
              Cálculo em tempo real · auto-save
            </span>
          </div>
          <p style={{ fontFamily: t.body, fontSize: 11, color: t.fg3, margin: '6px 0 0', lineHeight: 1.5 }}>
            Os números atualizam a cada toque. Exportação libera após todos os campos válidos.
          </p>
        </div>
      </div>
    </div>
  )
}
