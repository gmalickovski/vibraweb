// MarkdownEditor.tsx — <textarea> com barra flutuante de formatação: aparece
// em cima da seleção (negrito, itálico, sublinhado) e dá acesso a alinhamento
// de parágrafo (esquerda, centro, direita, justificado). Substitui o
// <textarea> puro nas duas caixas de edição de texto do app (Personalizar
// Textos e o ajuste pontual por análise em OutputPanel), pra manter os mesmos
// controles nos dois lugares.
//
// A barra só cobre negrito/itálico/sublinhado + alinhamento — de propósito,
// poucas opções (Guilherme, 2026-07-12: "eu acho que só esses"). O texto em
// si continua sendo markdown puro (**negrito**, __sublinhado__, [centro] no
// início do parágrafo) — ver Markdown.tsx, que é quem de fato renderiza isso
// no preview e no PDF gerado.

import { useState, useRef, useCallback, type CSSProperties } from 'react'
import { t } from '../../lib/tokens'
import { getSelectionMidpoint } from '../../lib/caret-position'
import { ALIGN_TOKENS } from './Markdown'
import {
  BoldIcon, ItalicIcon, UnderlineIcon,
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
} from './icons'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  style?: CSSProperties
}

interface ToolbarPos {
  top: number
  left: number
}

const ALIGN_BY_LABEL: Record<'esquerda' | 'centro' | 'direita' | 'justificado', string> = {
  esquerda: '[esquerda]',
  centro: '[centro]',
  direita: '[direita]',
  justificado: '[justificado]',
}

export function MarkdownEditor({ value, onChange, placeholder, disabled, style }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [toolbarPos, setToolbarPos] = useState<ToolbarPos | null>(null)

  const updateToolbar = useCallback(() => {
    const ta = taRef.current
    if (!ta) { setToolbarPos(null); return }
    if (ta.selectionStart === ta.selectionEnd) { setToolbarPos(null); return }
    const mid = getSelectionMidpoint(ta)
    setToolbarPos({ top: mid.top, left: mid.left })
  }, [])

  // Envolve a seleção com `before`/`after` (ex: ** ** pra negrito). Se a
  // seleção já estiver exatamente envolvida, remove em vez de duplicar
  // (toggle) — clicar 2x em negrito desfaz o negrito.
  function toggleWrap(before: string, after: string = before) {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    if (start === end) return
    const selected = value.slice(start, end)
    const alreadyWrapped =
      value.slice(Math.max(0, start - before.length), start) === before &&
      value.slice(end, end + after.length) === after

    let next: string, newStart: number, newEnd: number
    if (alreadyWrapped) {
      next = value.slice(0, start - before.length) + selected + value.slice(end + after.length)
      newStart = start - before.length
      newEnd = end - before.length
    } else {
      next = value.slice(0, start) + before + selected + after + value.slice(end)
      newStart = start + before.length
      newEnd = end + before.length
    }
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(newStart, newEnd)
      updateToolbar()
    })
  }

  // Aplica o marcador de alinhamento ao parágrafo (bloco entre linhas em
  // branco) que contém o cursor — troca qualquer marcador já existente.
  function setAlign(label: keyof typeof ALIGN_BY_LABEL) {
    const ta = taRef.current
    if (!ta) return
    const pos = ta.selectionStart
    let start = value.lastIndexOf('\n\n', Math.max(0, pos - 1))
    start = start === -1 ? 0 : start + 2
    while (value[start] === '\n') start++
    let end = value.indexOf('\n\n', pos)
    if (end === -1) end = value.length

    const paragraph = value.slice(start, end)
    let stripped = paragraph
    for (const token of ALIGN_TOKENS) {
      if (stripped.startsWith(token)) { stripped = stripped.slice(token.length).replace(/^\s+/, ''); break }
    }
    // "esquerda" é o padrão — não precisa de marcador explícito no texto.
    const nextParagraph = label === 'esquerda' ? stripped : `${ALIGN_BY_LABEL[label]} ${stripped}`
    const next = value.slice(0, start) + nextParagraph + value.slice(end)
    const delta = nextParagraph.length - paragraph.length

    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(pos + delta, pos + delta)
      setToolbarPos(null)
    })
  }

  const btnStyle: CSSProperties = {
    width: 26, height: 26, borderRadius: 6, flexShrink: 0,
    background: 'transparent', border: 'none', color: t.fg2,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  }

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <textarea
        ref={taRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onSelect={updateToolbar}
        onKeyUp={updateToolbar}
        onMouseUp={updateToolbar}
        onScroll={() => setToolbarPos(null)}
        onBlur={() => setToolbarPos(null)}
        disabled={disabled}
        placeholder={placeholder}
        style={style}
      />

      {toolbarPos && (
        <div
          // onMouseDown com preventDefault evita que o clique na barra tire o
          // foco/seleção do textarea antes do onClick do botão disparar.
          onMouseDown={e => e.preventDefault()}
          style={{
            position: 'absolute',
            top: Math.max(0, toolbarPos.top - 44),
            left: Math.max(0, toolbarPos.left - 60),
            zIndex: 30,
            display: 'flex', alignItems: 'center', gap: 2,
            background: t.night2, border: `1px solid ${t.pb}`, borderRadius: 8,
            padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
          }}
        >
          <button type="button" title="Negrito" style={btnStyle} onClick={() => toggleWrap('**')}><BoldIcon size={13} /></button>
          <button type="button" title="Itálico" style={btnStyle} onClick={() => toggleWrap('*')}><ItalicIcon size={13} /></button>
          <button type="button" title="Sublinhado" style={btnStyle} onClick={() => toggleWrap('__')}><UnderlineIcon size={13} /></button>
          <div style={{ width: 1, alignSelf: 'stretch', background: t.pb, margin: '0 2px' }} />
          <button type="button" title="Alinhar à esquerda" style={btnStyle} onClick={() => setAlign('esquerda')}><AlignLeftIcon size={13} /></button>
          <button type="button" title="Centralizar" style={btnStyle} onClick={() => setAlign('centro')}><AlignCenterIcon size={13} /></button>
          <button type="button" title="Alinhar à direita" style={btnStyle} onClick={() => setAlign('direita')}><AlignRightIcon size={13} /></button>
          <button type="button" title="Justificado" style={btnStyle} onClick={() => setAlign('justificado')}><AlignJustifyIcon size={13} /></button>
        </div>
      )}
    </div>
  )
}
