import { t } from '../../lib/tokens'
import { Field } from '../shared/Field'
import { TabBar } from '../shared/TabBar'
import type { AnalysisData, AnalysisTab } from '../../pages/AppPage'

interface Props {
  data: AnalysisData
  setData: (d: AnalysisData) => void
  tab: AnalysisTab
  setTab: (tab: AnalysisTab) => void
}

const TABS = [
  { id: 'pessoal',   label: 'Pessoal' },
  { id: 'bebe',      label: 'Bebê' },
  { id: 'empresa',   label: 'Empresa' },
  { id: 'previsoes', label: 'Previsões' },
]

export function InputPanel({ data, setData, tab, setTab }: Props) {
  const set = (k: keyof AnalysisData) => (val: string) => setData({ ...data, [k]: val })

  return (
    <div style={{
      flex: '0 0 420px',
      background: t.night2,
      borderRight: `1px solid ${t.pb}`,
      padding: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 22,
      overflowY: 'auto',
    }}>
      <div>
        <h1 style={{
          fontFamily: t.display, fontWeight: 900, fontSize: 22,
          color: t.fg, letterSpacing: '-.02em',
        }}>Nova Análise</h1>
        <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, marginTop: 4, lineHeight: 1.5 }}>
          Digite e veja os números surgirem em tempo real.
        </p>
      </div>

      <TabBar tabs={TABS} value={tab} onChange={v => setTab(v as AnalysisTab)} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {tab === 'pessoal' && (
          <>
            <Field label="Nome Completo de Nascimento" value={data.nome} onChange={set('nome')} placeholder="Digite seu nome completo" />
            <Field label="Data de Nascimento" value={data.dob} onChange={set('dob')} placeholder="DD/MM/AAAA" />
            <Field label="Nome Social" value={data.social} onChange={set('social')} optional placeholder="Nome que você usa hoje" />
          </>
        )}

        {tab === 'bebe' && (
          <>
            <Field label="Nome Sugerido para o Bebê" value={data.bebeNome} onChange={set('bebeNome')} placeholder="Digite o nome pretendido" />
            <Field label="Sobrenome(s) da Família" value={data.bebeSobrenome} onChange={set('bebeSobrenome')} placeholder="Sobrenomes completos" />
            <Field label="Data Prevista de Nascimento" value={data.bebeDob} onChange={set('bebeDob')} placeholder="DD/MM/AAAA" />
            <div style={{
              padding: 10, borderRadius: 10,
              background: 'rgba(253,184,19,.06)',
              border: `1px dashed ${t.pb}`,
              fontFamily: t.body, fontSize: 11, color: t.fg3, lineHeight: 1.5,
            }}>
              Teste até <strong style={{ color: t.gold }}>3 variações</strong> de nome para comparar vibrações antes de decidir.
              Use a aba de comparação abaixo.
            </div>

            <CompareBebeSection data={data} setData={setData} />
          </>
        )}

        {tab === 'empresa' && (
          <>
            <Field label="Razão Social" value={data.empresa} onChange={set('empresa')} placeholder="Ex.: Studio MLK Ltda." />
            <Field label="Nome Fantasia" value={data.fantasia} onChange={set('fantasia')} optional placeholder="Como a empresa é conhecida" />
            <Field label="Data de Fundação" value={data.fundacao} onChange={set('fundacao')} placeholder="DD/MM/AAAA" />
            <Field label="Sócio Principal" value={data.socio} onChange={set('socio')} optional placeholder="Nome completo do sócio" />
          </>
        )}

        {tab === 'previsoes' && (
          <>
            <Field label="Nome Completo" value={data.nome} onChange={set('nome')} placeholder="Digite seu nome completo" />
            <Field label="Data de Nascimento" value={data.dob} onChange={set('dob')} placeholder="DD/MM/AAAA" />
            <Field label="Ano de Referência" value={data.anoRef || String(new Date().getFullYear())} onChange={set('anoRef')} placeholder="2026" />
          </>
        )}
      </div>

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
  )
}

function CompareBebeSection({ data, setData }: { data: AnalysisData; setData: (d: AnalysisData) => void }) {
  const set = (k: keyof AnalysisData) => (val: string) => setData({ ...data, [k]: val })
  return (
    <div style={{
      borderTop: `1px solid ${t.pb}`,
      paddingTop: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ fontFamily: t.body, fontWeight: 600, fontSize: 11, color: t.fg3, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Comparar Variações (opcional)
      </div>
      <Field label="Variação 2" value={data.bebeNome2} onChange={set('bebeNome2')} optional placeholder="Segunda opção de nome" />
      <Field label="Variação 3" value={data.bebeNome3} onChange={set('bebeNome3')} optional placeholder="Terceira opção de nome" />
    </div>
  )
}
