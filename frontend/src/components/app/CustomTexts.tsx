// CustomTexts.tsx — /app/textos (Item 3, Fase 1)
// Redesenho (2026-07-12): as abas Pessoal/Bebê/Empresa saíram (Bebê/Empresa
// nunca tiveram uso real no resto do app — só "pessoal" existe de fato, ver
// AnalysisTab em AppPage.tsx). No lugar entraram 3 modos de edição, cada um
// com sua própria chave no Supabase (mesma tabela user_interpretations):
//   - "Números"              → grade categoria × número (como já existia)
//   - "Introduções de Categoria" → texto de abertura de cada número no
//     relatório (chave `estatico_def_<categoria>`, numero=1) — só as 9
//     categorias que document-builder.ts realmente lê (defKey), pra não
//     deixar o consultor "configurar" algo que nunca aparece no PDF.
//   - "Textos Gerais do Relatório" → Orientação / Importante / Resumo /
//     Conclusão (chaves fixas `estatico_orientacao` etc., numero=1) — também
//     lidas direto em document-builder.ts.
// Os 3 modos ficam como abas dentro do header do painel esquerdo (ao lado do
// título), que agora segue o padrão fixo/rolável/fixo (header/meio/rodapé) —
// mesma convenção de BlocosPage/BrandPage/DocumentOrganizerView. O painel da
// direita (editor de texto) virou o mesmo padrão de rodapé dinâmico usado na
// organização de blocos: "Salvar" só aparece com edição pendente, "Restaurar
// Padrão" só aparece quando já existe uma versão personalizada salva.
// Ver Produto/docs/vibra-web/requisitos.md, seção 3.

import { useState, useEffect, useMemo, useCallback } from 'react'
import { t } from '../../lib/tokens'
import { fetchInterpretation, saveUserInterpretation, listUserInterpretations, deleteAllUserInterpretations, listDefaultInterpretationKeys } from '../../lib/supabase'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'
import { TabBar } from '../shared/TabBar'
import { PageTitle } from '../shared/PageTitle'
import { ChevronIcon, CloseIcon } from '../shared/icons'
import { MarkdownEditor } from '../shared/MarkdownEditor'
import { useIsMobile } from '../../lib/useIsMobile'

// Ids SEM acento — viram `pessoal_${id}` e precisam bater exatamente com o
// `tipo` gravado no banco (interpretacoes/user_interpretations). Corrigido em
// 2026-07-12: os ids acentuados ('motivação', 'missão'...) nunca bateram com
// as chaves reais ('pessoal_motivacao', 'pessoal_missao'...), fazendo a
// grade inteira mostrar "sem texto" e o editor nunca achar o texto padrão
// pra Motivação/Impressão/Expressão/Missão — mesmo com os textos já
// existindo no banco. "Arcano Atual" saiu daqui (ver ARCANOS_LIST abaixo) —
// Arcano Regente, Sequência de Arcanos e Arcano Atual são todos a MESMA
// lista de 99 textos (tipo 'pessoal_arcano'), não cabem numa grade 0-22.
const CATEGORIES: { id: string; label: string }[] = [
  { id: 'motivacao', label: 'Motivação' },
  { id: 'impressao', label: 'Impressão' },
  { id: 'expressao', label: 'Expressão' },
  { id: 'dia_natalicio', label: 'Dia Natalício' },
  { id: 'psiquico', label: 'Número Psíquico' },
  { id: 'destino', label: 'Destino' },
  { id: 'missao', label: 'Missão' },
  { id: 'talentoOculto', label: 'Talento Oculto' },
  { id: 'aptidoes', label: 'Aptidões Profissionais' },
  { id: 'licao_carmica', label: 'Lição Cármica' },
  { id: 'desafio', label: 'Desafio' },
  { id: 'ciclo', label: 'Ciclo' },
  { id: 'respostaSubconsciente', label: 'Resposta Subconsciente' },
  { id: 'harmoniaConjugal', label: 'Harmonia Conjugal' },
  { id: 'anoPessoal', label: 'Ano Pessoal' },
  { id: 'mesPessoal', label: 'Mês Pessoal' },
  { id: 'diaPessoal', label: 'Dia Pessoal' },
]
// Categorias que não cabem na grade CATEGORIES × NUMBERS (0-9/11/22): cada
// uma tem seu próprio conjunto de números válidos, renderizado como uma
// linha extra logo abaixo da grade principal, na mesma tabela/estilo de
// quadradinhos (ver EXTRA_ROWS / extraRowsView) — não como uma linha comum
// da grade, que ficaria permanentemente "sem texto" em quase todas as colunas.
const DEBITOS_CARMICOS_NUMEROS = [13, 14, 16, 19]
// Dias Favoráveis do mês (calcDiasFavoraveis em numerology.ts) variam de 1 a
// 31 — nenhum texto padrão existe ainda pra esses números (0 de 31,
// aparecem todos como "sem texto" até serem escritos em Textos).
const DIAS_FAVORAVEIS_NUMEROS = Array.from({ length: 31 }, (_, i) => i + 1)
const EXTRA_ROWS: { label: string; tipo: string; numeros: number[] }[] = [
  { label: 'Débitos Cármicos', tipo: 'pessoal_debito_carmico', numeros: DEBITOS_CARMICOS_NUMEROS },
  { label: 'Dias Favoráveis', tipo: 'pessoal_dia_favoravel', numeros: DIAS_FAVORAVEIS_NUMEROS },
]
// "0" entra como coluna real (não mais um workaround de numero=10) desde a
// migration 021 — é resultado numerológico válido pra Desafio e Resposta
// Subconsciente; nas demais categorias simplesmente não existe texto padrão
// pra ele, e a grade mostra "sem texto" normalmente.
const NUMBERS = [0, ...Array.from({ length: 9 }, (_, i) => i + 1), 11, 22]
const TOTAL_CELLS = CATEGORIES.length * NUMBERS.length + EXTRA_ROWS.reduce((sum, r) => sum + r.numeros.length, 0)

// Categorias com introdução real (defKey lido em document-builder.ts,
// numEntry()/list-entry/cycles-entry/conjugal-entry/timeline-entry) — todas
// as categorias que aparecem na grade de Números (CATEGORIES acima) têm um
// defKey correspondente aqui, 1 pra 1 (2026-07-13: expandido de 9 pra 18
// categorias, cobrindo os itens adicionados nesta sessão).
const CATEGORY_DEFS: { id: string; label: string }[] = [
  { id: 'motivacao', label: 'Motivação' },
  { id: 'impressao', label: 'Impressão' },
  { id: 'expressao', label: 'Expressão' },
  { id: 'talento_oculto', label: 'Talento Oculto' },
  { id: 'aptidoes', label: 'Aptidões' },
  { id: 'dia_natalicio', label: 'Dia Natalício' },
  { id: 'psiquico', label: 'Número Psíquico' },
  { id: 'destino', label: 'Destino' },
  { id: 'missao', label: 'Missão' },
  { id: 'licao_carmica', label: 'Lição Cármica' },
  { id: 'debito_carmico', label: 'Débito Cármico' },
  { id: 'desafio', label: 'Desafio' },
  { id: 'ciclo', label: 'Ciclo' },
  { id: 'resposta_subconsciente', label: 'Resposta Subconsciente' },
  { id: 'harmonia_conjugal', label: 'Harmonia Conjugal' },
  { id: 'ano_pessoal', label: 'Ano Pessoal' },
  { id: 'mes_pessoal', label: 'Mês Pessoal' },
  { id: 'dia_pessoal', label: 'Dia Pessoal' },
]

// Textos gerais do relatório — chave própria fixa (não depende de categoria
// nem número), lidos direto em document-builder.ts (blocos Orientação,
// Importante, resumo de "Os Seus Números" e Conclusão).
const GENERAL_TEXTS: { id: string; label: string }[] = [
  { id: 'estatico_orientacao', label: 'Orientação' },
  { id: 'estatico_importante', label: 'Importante' },
  { id: 'estatico_importante_resumo', label: 'Importante — Resumo (Os Seus Números)' },
  { id: 'estatico_conclusao', label: 'Conclusão' },
]

// Os 99 arcanos (tipo fixo 'pessoal_arcano', numero = o próprio arcano) —
// Arcano Regente, Sequência de Arcanos (Triângulo da Vida) e Arcano Atual em
// OutputPanel.tsx todos apontam pra essa mesma lista; não há "Arcano Atual"
// como categoria separada, só o número do arcano em foco muda.
const ARCANOS_LIST: { numero: number; nome: string }[] = [
  { numero: 1, nome: 'O Mago' }, { numero: 2, nome: 'A Papisa' }, { numero: 3, nome: 'A Imperatriz' },
  { numero: 4, nome: 'O Imperador' }, { numero: 5, nome: 'O Papa' }, { numero: 6, nome: 'Os Enamorados' },
  { numero: 7, nome: 'O Carro' }, { numero: 8, nome: 'A Justiça' }, { numero: 9, nome: 'O Eremita' },
  { numero: 10, nome: 'A Roda da Fortuna' }, { numero: 11, nome: 'A Força' }, { numero: 12, nome: 'O Enforcado' },
  { numero: 13, nome: 'A Morte' }, { numero: 14, nome: 'A Temperança' }, { numero: 15, nome: 'O Diabo' },
  { numero: 16, nome: 'A Torre' }, { numero: 17, nome: 'A Estrela' }, { numero: 18, nome: 'A Lua' },
  { numero: 19, nome: 'O Sol' }, { numero: 20, nome: 'O Julgamento' }, { numero: 21, nome: 'O Mundo' },
  { numero: 22, nome: 'O Louco' },
  { numero: 23, nome: 'Rei de Paus' }, { numero: 24, nome: 'Rainha de Paus' }, { numero: 25, nome: 'Cavaleiro de Paus' },
  { numero: 26, nome: 'Valete de Paus' }, { numero: 27, nome: 'Dez de Paus' }, { numero: 28, nome: 'Nove de Paus' },
  { numero: 29, nome: 'Oito de Paus' }, { numero: 30, nome: 'Sete de Paus' }, { numero: 31, nome: 'Seis de Paus' },
  { numero: 32, nome: 'Cinco de Paus' }, { numero: 33, nome: 'Quatro de Paus' }, { numero: 34, nome: 'Três de Paus' },
  { numero: 35, nome: 'Dois de Paus' }, { numero: 36, nome: 'Ás de Paus' },
  { numero: 37, nome: 'Rei de Copas' }, { numero: 38, nome: 'Rainha de Copas' }, { numero: 39, nome: 'Cavaleiro de Copas' },
  { numero: 40, nome: 'Valete de Copas' }, { numero: 41, nome: 'Dez de Copas' }, { numero: 42, nome: 'Nove de Copas' },
  { numero: 43, nome: 'Oito de Copas' }, { numero: 44, nome: 'Sete de Copas' }, { numero: 45, nome: 'Seis de Copas' },
  { numero: 46, nome: 'Cinco de Copas' }, { numero: 47, nome: 'Quatro de Copas' }, { numero: 48, nome: 'Três de Copas' },
  { numero: 49, nome: 'Dois de Copas' }, { numero: 50, nome: 'Ás de Copas' },
  { numero: 51, nome: 'Rei de Espadas' }, { numero: 52, nome: 'Rainha de Espadas' }, { numero: 53, nome: 'Cavaleiro de Espadas' },
  { numero: 54, nome: 'Valete de Espadas' }, { numero: 55, nome: 'Dez de Espadas' }, { numero: 56, nome: 'Nove de Espadas' },
  { numero: 57, nome: 'Oito de Espadas' }, { numero: 58, nome: 'Sete de Espadas' }, { numero: 59, nome: 'Seis de Espadas' },
  { numero: 60, nome: 'Cinco de Espadas' }, { numero: 61, nome: 'Quatro de Espadas' }, { numero: 62, nome: 'Três de Espadas' },
  { numero: 63, nome: 'Dois de Espadas' }, { numero: 64, nome: 'Ás de Espadas' },
  { numero: 65, nome: 'Rei de Ouros' }, { numero: 66, nome: 'Rainha de Ouros' }, { numero: 67, nome: 'Cavaleiro de Ouros' },
  { numero: 68, nome: 'Valete de Ouros' }, { numero: 69, nome: 'Dez de Ouros' }, { numero: 70, nome: 'Nove de Ouros' },
  { numero: 71, nome: 'Oito de Ouros' }, { numero: 72, nome: 'Sete de Ouros' }, { numero: 73, nome: 'Seis de Ouros' },
  { numero: 74, nome: 'Cinco de Ouros' }, { numero: 75, nome: 'Quatro de Ouros' }, { numero: 76, nome: 'Três de Ouros' },
  { numero: 77, nome: 'Dois de Ouros' }, { numero: 78, nome: 'Ás de Ouros' },
  ...Array.from({ length: 21 }, (_, i) => ({ numero: 79 + i, nome: `Arcano Complementar ${79 + i}` })),
]

const LEFT_TABS = [
  { id: 'numeros', label: 'Números' },
  { id: 'categorias', label: 'Introduções de Categoria' },
  { id: 'gerais', label: 'Textos Gerais' },
  { id: 'arcanos', label: 'Arcanos' },
]

type LeftView = 'numeros' | 'categorias' | 'gerais' | 'arcanos'

interface Selection {
  tipo: string
  numero: number
  title: string
}

function keyOf(tipo: string, numero: number) {
  return `${tipo}__${numero}`
}

export function CustomTexts() {
  const isMobile = useIsMobile()
  const [leftView, setLeftView] = useState<LeftView>('numeros')
  const [selected, setSelected] = useState<Selection | null>(
    isMobile ? null : { tipo: `pessoal_${CATEGORIES[0].id}`, numero: NUMBERS[0], title: `${CATEGORIES[0].label} — Número ${NUMBERS[0]}` }
  )
  const [customKeys, setCustomKeys] = useState<Set<string>>(new Set())
  const [customLoaded, setCustomLoaded] = useState(false)
  const [defaultKeys, setDefaultKeys] = useState<Set<string>>(new Set())
  const [defaultsLoaded, setDefaultsLoaded] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(CATEGORIES[0].id)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resettingAll, setResettingAll] = useState(false)
  const [text, setText] = useState('')
  const [savedText, setSavedText] = useState('')
  const [isCustom, setIsCustom] = useState(false)

  const refreshCustomKeys = useCallback(async () => {
    const rows = await listUserInterpretations()
    setCustomKeys(new Set(rows.map(r => keyOf(r.tipo, r.numero))))
    setCustomLoaded(true)
  }, [])

  useEffect(() => { refreshCustomKeys() }, [refreshCustomKeys])

  // Textos PADRÃO (tabela pública `interpretacoes`) que de fato existem —
  // usado só pra pintar a célula "sem texto nenhum" na grade de Números
  // (nem padrão, nem personalizado). Estático: não muda com save/restore.
  useEffect(() => {
    async function load() {
      const rows = await listDefaultInterpretationKeys()
      setDefaultKeys(new Set(rows.map(r => keyOf(r.tipo, r.numero))))
      setDefaultsLoaded(true)
    }
    load()
  }, [])

  // Mesmo fallback do fetchInterpretation (lib/supabase.ts): tipo exato
  // primeiro, senão o tipo sem o 1º prefixo ("pessoal_motivacao" → "motivacao").
  // Precisa disso porque os `tipo` reais na tabela não seguem 1 padrão único.
  const hasDefaultText = useCallback((tipo: string, numero: number) => {
    if (defaultKeys.has(keyOf(tipo, numero))) return true
    const base = tipo.includes('_') ? tipo.split('_').slice(1).join('_') : null
    return !!(base && base !== tipo && defaultKeys.has(keyOf(base, numero)))
  }, [defaultKeys])

  // Trocar de aba (Números/Categorias/Gerais/Arcanos) reseta a seleção pro 1º
  // item daquele modo — no mobile começa sem seleção (mostra a lista primeiro).
  function switchLeftView(next: LeftView) {
    setLeftView(next)
    if (isMobile) { setSelected(null); return }
    if (next === 'numeros') {
      setSelected({ tipo: `pessoal_${CATEGORIES[0].id}`, numero: NUMBERS[0], title: `${CATEGORIES[0].label} — Número ${NUMBERS[0]}` })
    } else if (next === 'categorias') {
      setSelected({ tipo: `estatico_def_${CATEGORY_DEFS[0].id}`, numero: 1, title: `Introdução — ${CATEGORY_DEFS[0].label}` })
    } else if (next === 'arcanos') {
      setSelected({ tipo: 'pessoal_arcano', numero: ARCANOS_LIST[0].numero, title: `Arcano ${ARCANOS_LIST[0].numero} — ${ARCANOS_LIST[0].nome}` })
    } else {
      setSelected({ tipo: GENERAL_TEXTS[0].id, numero: 1, title: `Texto Geral — ${GENERAL_TEXTS[0].label}` })
    }
  }

  // Fetch text for the selected cell
  useEffect(() => {
    if (!selected) return
    let active = true
    async function load() {
      setLoading(true)
      const res = await fetchInterpretation(selected!.numero, selected!.tipo)
      if (active) {
        const value = res?.texto || ''
        setText(value)
        setSavedText(value)
        setIsCustom(!!res?.titulo?.startsWith('Personalizado:'))
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [selected])

  const isDirty = text !== savedText
  const showFooter = isCustom || isDirty

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    await saveUserInterpretation(selected.numero, selected.tipo, text)
    setSavedText(text)
    setIsCustom(true)
    setSaving(false)
    refreshCustomKeys()
  }

  // Fecha o editor e volta pra lista (ícone "✕" no header do painel — 2026-07-12,
  // 10ª rodada: o rodapé perdeu o botão "Voltar" fixo; agora só mostra "Limpar"
  // e "Salvar", os dois dinâmicos, some/aparecem juntos conforme `isDirty`).
  function handleClose() {
    setSelected(null)
  }

  function handleCancelEdit() {
    setText(savedText)
  }

  // Apaga TODAS as personalizações do consultor de uma vez (Números,
  // Introduções de Categoria e Textos Gerais) — botão no rodapé do painel
  // esquerdo, ver deleteAllUserInterpretations em lib/supabase.ts.
  async function handleResetAll() {
    const total = customKeys.size
    if (!total) return
    if (!confirm(`Isso vai apagar as ${total} personalizações salvas e restaurar todos os textos ao padrão do Vibraweb. Essa ação não pode ser desfeita. Continuar?`)) return
    setResettingAll(true)
    await deleteAllUserInterpretations()
    setCustomKeys(new Set())
    if (selected) {
      const res = await fetchInterpretation(selected.numero, selected.tipo)
      const value = res?.texto || ''
      setText(value)
      setSavedText(value)
      setIsCustom(false)
    }
    setResettingAll(false)
  }

  async function handleRestore() {
    if (!selected) return
    if (!confirm('Deseja apagar sua versão e restaurar o texto padrão do Vibraweb?')) return
    setSaving(true)
    await saveUserInterpretation(selected.numero, selected.tipo, null)
    const res = await fetchInterpretation(selected.numero, selected.tipo)
    const value = res?.texto || ''
    setText(value)
    setSavedText(value)
    setIsCustom(false)
    setSaving(false)
    refreshCustomKeys()
  }

  const numerosCount = useMemo(() => {
    if (!customLoaded) return 0
    let count = 0
    CATEGORIES.forEach(cat => NUMBERS.forEach(n => { if (customKeys.has(keyOf(`pessoal_${cat.id}`, n))) count++ }))
    EXTRA_ROWS.forEach(row => row.numeros.forEach(n => { if (customKeys.has(keyOf(row.tipo, n))) count++ }))
    return count
  }, [customKeys, customLoaded])

  const categoriasCount = useMemo(() => {
    if (!customLoaded) return 0
    return CATEGORY_DEFS.filter(c => customKeys.has(keyOf(`estatico_def_${c.id}`, 1))).length
  }, [customKeys, customLoaded])

  const geraisCount = useMemo(() => {
    if (!customLoaded) return 0
    return GENERAL_TEXTS.filter(g => customKeys.has(keyOf(g.id, 1))).length
  }, [customKeys, customLoaded])

  const arcanosCount = useMemo(() => {
    if (!customLoaded) return 0
    return ARCANOS_LIST.filter(a => customKeys.has(keyOf('pessoal_arcano', a.numero))).length
  }, [customKeys, customLoaded])

  // ── Painel de edição (direita) — header fixo / textarea rolável / rodapé
  // fixo com "Salvar" (só aparece com edição pendente) e "Restaurar Padrão"
  // (só aparece quando já existe uma versão personalizada) — mesma regra da
  // organização de blocos (DocumentOrganizerView / BlocosPage).
  const editorPanel = selected && (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: t.night }}>
      {/* Título direto acima da caixa de texto, sem linha divisória (Guilherme,
          2026-07-12: "o título não deve ficar num header... bem posicionado
          sem a linha divisória"). */}
      <div style={{
        padding: '20px 20px 12px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap',
      }}>
        <h1 style={{
          fontSize: 16, fontWeight: 700, margin: 0, fontFamily: t.display, color: t.fg,
          flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {selected.title}
        </h1>
        {isCustom && (
          <span style={{ fontSize: 11, padding: '4px 8px', background: t.wine, color: t.fg, borderRadius: 4, fontFamily: t.body, flexShrink: 0 }}>
            Texto Personalizado Ativo
          </span>
        )}
        {/* "✕" só existe no mobile, onde o editor cobre a tela inteira e
            precisa de uma saída — no desktop o painel do editor é sempre
            visível ao lado da lista, sem função de fechar (Guilherme,
            2026-07-12: "sempre deve ficar visível a caixa de texto lateral
            como padrão"). */}
        {isMobile && (
          <button
            onClick={handleClose}
            title="Fechar e voltar pra lista"
            style={{
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: 'transparent', border: `1px solid ${t.pb}`, color: t.fg3,
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>

      {/* O scroll mora só dentro da própria caixa de texto (textarea), nunca
          no wrapper — sem isso a barra de rolagem aparecia fora da caixa. */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 20px 8px', display: 'flex', flexDirection: 'column' }}>
        <MarkdownEditor
          value={text}
          onChange={setText}
          disabled={loading}
          placeholder="Carregando ou nenhum texto disponível..."
          style={{
            flex: 1, minHeight: 0, width: '100%', resize: 'none',
            background: 'rgba(0,0,0,0.2)', border: `1px solid ${t.pb}`,
            borderRadius: 8, color: t.fg, fontFamily: t.body, fontSize: 15, lineHeight: 1.6, padding: 16,
            outline: 'none', boxSizing: 'border-box', overflowY: 'auto',
          }}
        />
        <div style={{ fontSize: 11, color: t.fg4, fontFamily: t.body, marginTop: 6, flexShrink: 0 }}>
          Selecione um trecho pra formatar (negrito, itálico, sublinhado, alinhamento). Reflete no preview e no PDF gerado.
        </div>
      </div>

      {/* Rodapé colapsa a 0 (sem padding/borda) quando não há nada pra mostrar
          (nem "Restaurar Padrão", nem edição pendente) — a caixa de texto
          acima (flex: 1) toma esse espaço de volta automaticamente. Ao digitar
          (isDirty), o rodapé se abre de novo e a caixa cede o espaço. */}
      <div style={{
        flexShrink: 0,
        borderTop: `1px solid ${showFooter ? t.pb : 'transparent'}`,
        padding: showFooter ? '16px 20px' : '0 20px',
        maxHeight: showFooter ? 64 : 0,
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'max-height 0.25s ease, padding 0.25s ease, border-color 0.25s ease',
      }}>
        {isCustom && (
          <SecondaryBtn onClick={handleRestore} disabled={saving} style={{ padding: '10px', fontSize: 12, flexShrink: 0 }}>
            Restaurar Padrão
          </SecondaryBtn>
        )}
        <div style={{ flex: 1 }} />
        {/* "Limpar" e "Salvar" são dinâmicos: só existem enquanto há edição
            pendente (isDirty) e somem juntos assim que ela é descartada ou
            salva — sem botão "Voltar" fixo (esse saiu pro "✕" do header). */}
        <div style={{
          flex: isDirty ? 1 : 0,
          maxWidth: isDirty ? 160 : 0,
          opacity: isDirty ? 1 : 0,
          overflowY: 'hidden', overflowX: isDirty ? 'visible' : 'hidden',
          transition: 'flex 0.25s ease, max-width 0.25s ease, opacity 0.2s ease',
        }}>
          <SecondaryBtn onClick={handleCancelEdit} style={{ padding: '10px', fontSize: 12, width: '100%', justifyContent: 'center', whiteSpace: 'nowrap' }}>
            Limpar
          </SecondaryBtn>
        </div>
        <div style={{
          flex: isDirty ? 1 : 0,
          maxWidth: isDirty ? '100%' : 0,
          opacity: isDirty ? 1 : 0,
          overflowY: 'hidden', overflowX: isDirty ? 'visible' : 'hidden',
          transition: 'flex 0.25s ease, max-width 0.25s ease, opacity 0.2s ease',
        }}>
          <PrimaryBtn onClick={handleSave} disabled={saving || !text.trim()} style={{ padding: '10px', fontSize: 12, width: '100%', justifyContent: 'center', whiteSpace: 'nowrap' }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )

  // ── Conteúdo do meio (rolável) do painel esquerdo, por modo ──────────────
  // Sem wrapper com overflowX próprio: o scroll horizontal da tabela acontece
  // no container do meio (ver abaixo), pra barra de rolagem ficar coladinha
  // na borda inferior do painel em vez de flutuar no meio do conteúdo.
  // Débitos Cármicos e Dias Favoráveis: números fora do range 0-9/11/22 da
  // grade principal (13-19 e 1-31 respectivamente) — cada um vira uma linha
  // extra logo abaixo, na MESMA marcação de célula/botão da grade principal
  // (mesma <td padding:3> + <button 36×30>), só que numa tabela própria sem
  // cabeçalho — garante os quadradinhos ficarem visualmente idênticos aos
  // da grade em vez de uma lista de chips solta (ver EXTRA_ROWS acima).
  const extraRowsView = (
    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720, marginTop: 16 }}>
      <tbody>
        {EXTRA_ROWS.map(row => (
          <tr key={row.tipo}>
            <td style={{
              position: 'sticky', left: 0, zIndex: 1, background: t.night,
              padding: '6px 8px', fontSize: 12, color: t.fg2, fontFamily: t.body, whiteSpace: 'nowrap',
            }}>
              {row.label}
            </td>
            {row.numeros.map(n => {
              const custom = customKeys.has(keyOf(row.tipo, n))
              const empty = defaultsLoaded && !custom && !hasDefaultText(row.tipo, n)
              const active = selected?.tipo === row.tipo && selected?.numero === n
              return (
                <td key={n} style={{ padding: 3 }}>
                  <button
                    onClick={() => setSelected({ tipo: row.tipo, numero: n, title: `${row.label} — Número ${n}` })}
                    title={`${row.label} — Número ${n}${empty ? ' (sem texto)' : ''}`}
                    style={{
                      width: 36, height: 30, borderRadius: 6,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      border: active ? `2px solid ${t.gold}` : `1px solid ${t.pb}`,
                      background: custom ? 'rgba(192,57,123,.35)' : 'rgba(255,255,255,0.03)',
                      color: custom ? t.fg : t.fg4,
                      cursor: 'pointer', fontSize: 11, fontFamily: t.body,
                    }}
                  >
                    {empty ? <CloseIcon size={10} /> : n}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )

  const numerosGridView = (
    <>
    <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720 }}>
      <thead>
        <tr>
          {/* Coluna dos nomes fica fixa (sticky) — só a grade de quadradinhos
              rola horizontalmente (Guilherme, 2026-07-12). */}
          <th style={{
            position: 'sticky', left: 0, zIndex: 2, background: t.night,
            textAlign: 'left', padding: '6px 8px', fontSize: 11, color: t.fg3, fontFamily: t.body,
          }} />
          {NUMBERS.map(n => (
            <th key={n} style={{ padding: '6px 4px', fontSize: 11, color: t.fg3, fontFamily: t.body, fontWeight: 600 }}>
              {n}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CATEGORIES.map(cat => (
          <tr key={cat.id}>
            <td style={{
              position: 'sticky', left: 0, zIndex: 1, background: t.night,
              padding: '6px 8px', fontSize: 12, color: t.fg2, fontFamily: t.body, whiteSpace: 'nowrap',
            }}>
              {cat.label}
            </td>
            {NUMBERS.map(n => {
              const tipo = `pessoal_${cat.id}`
              const custom = customKeys.has(keyOf(tipo, n))
              // "Sem texto": nem personalizado nem padrão do sistema — só dá
              // pra saber depois que defaultKeys carrega (evita piscar "vazio"
              // em toda a grade enquanto a query ainda não voltou).
              const empty = defaultsLoaded && !custom && !hasDefaultText(tipo, n)
              const active = selected?.tipo === tipo && selected?.numero === n
              return (
                <td key={n} style={{ padding: 3 }}>
                  <button
                    onClick={() => setSelected({ tipo, numero: n, title: `${cat.label} — Número ${n}` })}
                    title={`${cat.label} — Número ${n}${empty ? ' (sem texto)' : ''}`}
                    style={{
                      width: 36, height: 30, borderRadius: 6,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      border: active ? `2px solid ${t.gold}` : `1px solid ${t.pb}`,
                      background: custom ? 'rgba(192,57,123,.35)' : 'rgba(255,255,255,0.03)',
                      color: custom ? t.fg : t.fg4,
                      cursor: 'pointer', fontSize: 11, fontFamily: t.body,
                    }}
                  >
                    {empty && <CloseIcon size={10} />}
                  </button>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
    {extraRowsView}
    </>
  )

  const categoriasListView = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {CATEGORY_DEFS.map(cat => {
        const tipo = `estatico_def_${cat.id}`
        const custom = customKeys.has(keyOf(tipo, 1))
        const active = selected?.tipo === tipo
        return (
          <ListRow
            key={cat.id}
            label={cat.label}
            active={active}
            custom={custom}
            onClick={() => setSelected({ tipo, numero: 1, title: `Introdução — ${cat.label}` })}
          />
        )
      })}
    </div>
  )

  const geraisListView = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {GENERAL_TEXTS.map(g => {
        const custom = customKeys.has(keyOf(g.id, 1))
        const active = selected?.tipo === g.id
        return (
          <ListRow
            key={g.id}
            label={g.label}
            active={active}
            custom={custom}
            onClick={() => setSelected({ tipo: g.id, numero: 1, title: `Texto Geral — ${g.label}` })}
          />
        )
      })}
    </div>
  )

  // Lista dos 99 arcanos — mesma lista serve Arcano Regente, Sequência de
  // Arcanos e Arcano Atual (ver comentário em ARCANOS_LIST). Todos já têm
  // texto padrão (migrations 023-025), então não existe estado "sem texto"
  // aqui como na grade de Números.
  const arcanosListView = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {ARCANOS_LIST.map(a => {
        const custom = customKeys.has(keyOf('pessoal_arcano', a.numero))
        const active = selected?.tipo === 'pessoal_arcano' && selected?.numero === a.numero
        return (
          <ListRow
            key={a.numero}
            label={`${a.numero} — ${a.nome}`}
            active={active}
            custom={custom}
            onClick={() => setSelected({ tipo: 'pessoal_arcano', numero: a.numero, title: `Arcano ${a.numero} — ${a.nome}` })}
          />
        )
      })}
    </div>
  )

  // Mobile: cada modo vira uma lista simples (Números continua em acordeão
  // por categoria, com chips de número dentro); tocar num item abre o editor
  // em tela cheia (mesmo editorPanel de cima).
  const mobileListView = (
    <>
      {leftView === 'numeros' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map(cat => {
            const open = expandedCategory === cat.id
            return (
              <div key={cat.id} style={{ border: `1px solid ${t.pb}`, borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => setExpandedCategory(open ? null : cat.id)}
                  style={{
                    width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: 'none',
                    color: t.fg, fontFamily: t.body, fontSize: 14, fontWeight: 600,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                  }}
                >
                  {cat.label}
                  <span style={{ color: t.fg3, display: 'flex' }}><ChevronIcon open={open} size={12} /></span>
                </button>
                {open && (
                  <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {NUMBERS.map(n => {
                      const tipo = `pessoal_${cat.id}`
                      const custom = customKeys.has(keyOf(tipo, n))
                      const empty = defaultsLoaded && !custom && !hasDefaultText(tipo, n)
                      return (
                        <button
                          key={n}
                          onClick={() => setSelected({ tipo, numero: n, title: `${cat.label} — Número ${n}` })}
                          style={{
                            padding: '8px 14px', borderRadius: 999,
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            border: `1px solid ${custom ? t.magenta : t.pb}`,
                            background: custom ? 'rgba(192,57,123,.25)' : 'transparent',
                            color: empty ? t.fg4 : t.fg, fontFamily: t.body, fontSize: 13, cursor: 'pointer',
                          }}
                        >
                          {n}
                          {empty && <CloseIcon size={9} />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {EXTRA_ROWS.map(row => (
            <div key={row.tipo} style={{ border: `1px solid ${t.pb}`, borderRadius: 10, overflow: 'hidden' }}>
              <button
                onClick={() => setExpandedCategory(expandedCategory === row.tipo ? null : row.tipo)}
                style={{
                  width: '100%', padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: 'none',
                  color: t.fg, fontFamily: t.body, fontSize: 14, fontWeight: 600,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                }}
              >
                {row.label}
                <span style={{ color: t.fg3, display: 'flex' }}><ChevronIcon open={expandedCategory === row.tipo} size={12} /></span>
              </button>
              {expandedCategory === row.tipo && (
                <div style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {row.numeros.map(n => {
                    const custom = customKeys.has(keyOf(row.tipo, n))
                    const empty = defaultsLoaded && !custom && !hasDefaultText(row.tipo, n)
                    return (
                      <button
                        key={n}
                        onClick={() => setSelected({ tipo: row.tipo, numero: n, title: `${row.label} — Número ${n}` })}
                        style={{
                          padding: '8px 14px', borderRadius: 999,
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          border: `1px solid ${custom ? t.magenta : t.pb}`,
                          background: custom ? 'rgba(192,57,123,.25)' : 'transparent',
                          color: empty ? t.fg4 : t.fg, fontFamily: t.body, fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        {n}
                        {empty && <CloseIcon size={9} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {leftView === 'categorias' && categoriasListView}
      {leftView === 'gerais' && geraisListView}
      {leftView === 'arcanos' && arcanosListView}
    </>
  )

  // ── Rodapé fixo do painel esquerdo — sem linha divisória (Guilherme,
  // 2026-07-12: "tire a linha de divisão... só deixe o texto abaixo da
  // legenda de marcações"). Legenda primeiro (só existe no modo Números),
  // contador sempre por último, embaixo dela.
  const footerContent = (
    <div style={{ padding: '10px 20px 16px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {leftView === 'numeros' && (
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: t.fg3, fontFamily: t.body }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(192,57,123,.35)', display: 'inline-block' }} />
            Personalizado
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.pb}`, display: 'inline-block' }} />
            Padrão do sistema
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 12, height: 12, borderRadius: 3, background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.pb}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: t.fg4,
            }}>
              <CloseIcon size={7} />
            </span>
            Sem texto
          </span>
        </div>
      )}
      <span style={{ fontSize: 12, color: t.fg2, fontFamily: t.body }}>
        {leftView === 'numeros' && `${customLoaded ? numerosCount : '…'} de ${TOTAL_CELLS} personalizados`}
        {leftView === 'categorias' && `${customLoaded ? categoriasCount : '…'} de ${CATEGORY_DEFS.length} configuradas`}
        {leftView === 'gerais' && `${customLoaded ? geraisCount : '…'} de ${GENERAL_TEXTS.length} configurados`}
        {leftView === 'arcanos' && `${customLoaded ? arcanosCount : '…'} de ${ARCANOS_LIST.length} personalizados`}
      </span>
      {/* Reset global — apaga toda personalização do consultor de uma vez, em
          todos os modos (Números, Categorias, Gerais e Arcanos), não só a
          aba aberta. Fica no rodapé do painel esquerdo, junto do contador. */}
      <SecondaryBtn
        onClick={handleResetAll}
        disabled={resettingAll || !customKeys.size}
        style={{ padding: '8px 10px', fontSize: 11, alignSelf: 'flex-start' }}
      >
        {resettingAll ? 'Redefinindo...' : 'Redefinir Todos os Textos'}
      </SecondaryBtn>
    </div>
  )

  // ── Header fixo do painel esquerdo — título + as 3 abas de modo, lado a
  // lado (Guilherme, 2026-07-12: "posicionar esse 3 novos botão ao lado do
  // título dentro do header padrão").
  const headerContent = (
    <div style={{
      padding: 20, borderBottom: `1px solid ${t.pb}`, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
    }}>
      <PageTitle
        title="Personalizar Textos"
        info="Números: grade categoria × número — cada célula é um texto por cliente. Introduções de Categoria: o texto de abertura de cada número no relatório. Textos Gerais: Orientação, Importante, Resumo e Conclusão. Tudo pode ser restaurado ao padrão do Vibraweb a qualquer momento."
        size={16}
      />
      <TabBar tabs={LEFT_TABS} value={leftView} onChange={id => switchLeftView(id as LeftView)} />
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0, overflow: 'hidden' }}>
      {/* Painel esquerdo: header fixo / meio rolável (a "caixa") / rodapé fixo */}
      {(!isMobile || !selected) && (
        <div style={{
          flex: isMobile ? undefined : 1, minWidth: 0,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRight: isMobile ? 'none' : `1px solid ${t.pb}`,
          background: t.night,
        }}>
          {headerContent}
          {/* Scroll horizontal da grade (modo Números) acontece aqui, coladinho
              na borda inferior do painel, em vez de flutuar dentro de um
              wrapper próprio com espaço sobrando abaixo dele. */}
          <div style={{
            flex: 1, overflowY: 'auto',
            overflowX: (!isMobile && leftView === 'numeros') ? 'auto' : 'hidden',
            padding: (!isMobile && leftView === 'numeros') ? '16px 16px 6px' : 16,
          }}>
            {isMobile ? mobileListView : (
              <>
                {leftView === 'numeros' && numerosGridView}
                {leftView === 'categorias' && categoriasListView}
                {leftView === 'gerais' && geraisListView}
                {leftView === 'arcanos' && arcanosListView}
              </>
            )}
          </div>
          {footerContent}
        </div>
      )}

      {/* Painel direito: editor — desktop ao lado, mobile em tela cheia */}
      {!isMobile && editorPanel}
      {/* Mobile: o próprio rodapé do editor (Voltar) já deseleciona o campo e
          fecha essa tela — não precisa mais de um botão "Fechar" extra aqui. */}
      {isMobile && selected && (
        <div style={{ position: 'fixed', inset: 0, background: t.night, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          {editorPanel}
        </div>
      )}
    </div>
  )
}

function ListRow({ label, active, custom, onClick }: {
  label: string
  active: boolean
  custom: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${active ? t.gold : 'rgba(255,255,255,0.05)'}`,
        background: active ? 'rgba(253,184,19,.06)' : t.night2,
        color: t.fg, fontFamily: t.body, fontSize: 13,
      }}
    >
      <span>{label}</span>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
        background: custom ? 'rgba(46,163,106,.15)' : 'rgba(255,255,255,0.06)',
        color: custom ? t.success : t.fg3, fontFamily: t.body, textTransform: 'uppercase', letterSpacing: '.03em',
        flexShrink: 0,
      }}>
        {custom ? 'Configurado' : 'Não configurado'}
      </span>
    </button>
  )
}
