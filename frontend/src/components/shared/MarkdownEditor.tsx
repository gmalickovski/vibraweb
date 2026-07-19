// MarkdownEditor.tsx — editor WYSIWYG (o que o consultor vê já é o resultado
// formatado: negrito aparece em negrito, não "**negrito**"). Por baixo dos
// panos continua guardando/entregando markdown puro via `value`/`onChange`
// (mesmo formato lido por Markdown.tsx no preview e no PDF — editor = fonte
// da verdade da formatação), mas a CAIXA em si é um <div contentEditable>
// em vez de <textarea>: digitar "**palavra**" e fechar o segundo "**"
// converte a palavra pra negrito na hora (ver tryAutoFormat), e a barra de
// formatação aplica negrito/itálico/sublinhado/título/alinhamento
// diretamente no texto selecionado sem o consultor nunca ver os marcadores.
//
// Implementação via `document.execCommand` — API depreciada na spec do HTML
// mas ainda plenamente suportada em todos os navegadores Chromium atuais;
// escolhida de propósito aqui porque ela já resolve corretamente toda a
// complexidade de Range/Selection (dividir/unir nós de texto ao (des)aplicar
// negrito parcial, mover o cursor, undo/redo nativo) que seria arriscado
// reimplementar à mão para uma ferramenta interna. Se algum dia for removida
// dos navegadores, a substituição é reimplementar toggleInline/applyAlign/
// toggleHeading com Range/Selection manuais — a serialização (htmlToMarkdown)
// e a montagem inicial (markdownToHtml) não mudam.
//
// Desktop: barra flutuante aparece em cima da seleção (negrito, itálico,
// sublinhado, título) + alinhamento de parágrafo (esquerda, centro, direita,
// justificado). Mobile: os mesmos controles numa barra fixa acima da caixa
// (a flutuante-sobre-seleção não funciona bem em touch). Substitui o
// <textarea> puro nas duas caixas de edição de texto do app (Personalizar
// Textos e o ajuste pontual por análise em OutputPanel).

import { useState, useRef, useEffect, useCallback, type CSSProperties, type ReactNode, type ClipboardEvent as ReactClipboardEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { t } from '../../lib/tokens'
import { useIsMobile } from '../../lib/useIsMobile'
import { parseInlineAst, parseMarkdownBlocks, ALIGN_TOKEN_BY_VALUE, SUBTITLE_TOKEN, type InlineNode } from './Markdown'
import {
  BoldIcon, ItalicIcon, UnderlineIcon, HeadingIcon, ListBulletIcon, ListNumberedIcon,
  AlignLeftIcon, AlignCenterIcon, AlignRightIcon, AlignJustifyIcon,
} from './icons'

// Classe + folha de estilo injetada uma única vez (mesmo padrão de
// TabBar.tsx) pro recuo/respiro de <ul>/<ol>/<li> — cobre TANTO as listas
// que markdownToHtml gera na carga inicial QUANTO as que o navegador cria
// sozinho via execCommand('insertUnorderedList'/'insertOrderedList') ao
// digitar, já que ambas são descendentes do mesmo container com essa classe.
const LIST_CSS_ID = 'vw-markdown-editor-list-css'
const EDITABLE_LIST_CLASS = 'vw-md-editable'
function ensureListCss() {
  if (document.getElementById(LIST_CSS_ID)) return
  const el = document.createElement('style')
  el.id = LIST_CSS_ID
  el.textContent = `.${EDITABLE_LIST_CLASS} ul,.${EDITABLE_LIST_CLASS} ol{margin:10px 0;padding-left:20px}.${EDITABLE_LIST_CLASS} li{margin-bottom:4px}`
  document.head.appendChild(el)
}

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  style?: CSSProperties
}

// ── markdown → HTML (carga inicial / mudança externa do valor) ─────────────

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineAstToHtml(nodes: InlineNode[]): string {
  return nodes.map(node => {
    if (node.type === 'text') return escapeHtml(node.value)
    const inner = inlineAstToHtml(node.children)
    if (node.type === 'bold') return `<b>${inner}</b>`
    if (node.type === 'underline') return `<u>${inner}</u>`
    return `<i>${inner}</i>`
  }).join('')
}

// Reset de margem inline (evita as margens padrão do navegador pra <p>/<h4>
// empilharem estranho dentro da caixa) + a fonte "levemente maior" do título
// único permitido, sempre em `em` pra escalar com o fontSize que o
// consumidor passar em `style` (15px em Personalizar Textos/ajuste por
// cliente — não fixo, ao contrário do H4 do documento, que sempre é 12.5px).
// O TAMANHO da fonte do título não é regulável (nunca aparece um controle
// pra isso na barra) — é a única coisa fixa da ferramenta "Título". O
// NEGRITO é despachado como `font-weight:400` aqui de propósito: <h4> já
// vem em negrito por padrão no stylesheet nativo do navegador, e sem essa
// neutralização explícita o negrito ficaria "grudado" no bloco (impossível
// de desligar). O negrito de verdade do título vem de um <b> real dentro do
// conteúdo — aplicado automaticamente ao criar o título (toggleHeading) mas
// independente e desligável depois com o botão Negrito, como qualquer texto.
// CSS puro (sem o wrapper `style="..."`) — única fonte de verdade reusada
// tanto na carga inicial (markdownToHtml/blockStyleAttr) quanto ao aplicar
// título AO VIVO via toolbar (toggleHeading): `execCommand('formatBlock')`
// só troca a tag do elemento, não carrega nenhum CSS customizado — sem
// reaplicar isso explicitamente depois do formatBlock, um título criado na
// hora fica sem o espaçamento/tamanho até a caixa recarregar do zero
// (trocar de campo e voltar, Restaurar Padrão etc.).
function blockStyleCss(align: CSSProperties['textAlign'], heading: boolean): string {
  const parts = ['margin:0 0 8px']
  if (align && align !== 'left') parts.push(`text-align:${align}`)
  // Espaçamento generoso ANTES e DEPOIS do título — bem maior que o gap
  // normal entre parágrafos (8px), pra separar visualmente do texto acima e
  // abaixo, igual Word/Google Docs tratam um heading.
  if (heading) parts.push('font-weight:400', 'font-size:1.15em', 'margin-top:22px', 'margin-bottom:14px')
  return parts.join(';')
}

function blockStyleAttr(align: CSSProperties['textAlign'], heading: boolean): string {
  return ` style="${blockStyleCss(align, heading)}"`
}

function markdownToHtml(text: string): string {
  const blocks = parseMarkdownBlocks(text)
  if (blocks.length === 0) return '<p><br></p>'
  return blocks.map(block => {
    if (block.list) {
      const tag = block.list === 'ordered' ? 'ol' : 'ul'
      const itemsHtml = block.lines.map(item => `<li>${inlineAstToHtml(parseInlineAst(item))}</li>`).join('')
      return `<${tag}>${itemsHtml}</${tag}>`
    }
    const tag = block.heading ? 'h4' : 'p'
    const linesHtml = block.lines.map(line => inlineAstToHtml(parseInlineAst(line))).join('<br>')
    return `<${tag}${blockStyleAttr(block.align, block.heading)}>${linesHtml || '<br>'}</${tag}>`
  }).join('')
}

// ── HTML → markdown (serialização a cada edição) ────────────────────────────

function serializeInlineNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ''
  const el = node as HTMLElement
  if (el.tagName === 'BR') return '\n'
  const inner = Array.from(el.childNodes).map(serializeInlineNode).join('')
  if (!inner) return ''
  switch (el.tagName) {
    case 'B': case 'STRONG': return `**${inner}**`
    case 'I': case 'EM': return `*${inner}*`
    case 'U': return `__${inner}__`
    default: return inner // DIV/SPAN/FONT etc. que o navegador eventualmente injete — desembrulha
  }
}

/** null quando o bloco está vazio (ex.: <p><br></p>) — descartado na serialização final. */
function serializeBlock(el: HTMLElement): string | null {
  const inner = Array.from(el.childNodes).map(serializeInlineNode).join('')
  if (!inner.trim()) return null
  const isHeading = el.tagName === 'H4'
  const alignToken = el.style.textAlign ? ALIGN_TOKEN_BY_VALUE[el.style.textAlign] : undefined
  const prefix = (alignToken ? `${alignToken} ` : '') + (isHeading ? SUBTITLE_TOKEN : '')
  return prefix + inner
}

// <ul>/<ol> — cada <li> vira uma linha própria com o marcador ("- " ou
// "N. ") na frente; o número gravado é sempre a posição sequencial real
// (não importa o que a marcação HTML "diria" — <ol> não guarda números,
// quem numera é o CSS do navegador). Listas aninhadas (Tab pra indentar
// dentro de um item) não são suportadas — o <ul>/<ol> interno cai no galho
// "default" de serializeInlineNode e vira texto corrido dentro da linha do
// item pai, sem os próprios marcadores (limitação aceita, não é um recurso
// pedido).
function serializeListBlock(el: HTMLElement): string | null {
  const ordered = el.tagName === 'OL'
  const items = Array.from(el.children).filter((c): c is HTMLElement => c.tagName === 'LI')
  const lines = items
    .map(li => Array.from(li.childNodes).map(serializeInlineNode).join(''))
    .filter(line => line.trim())
  if (lines.length === 0) return null

  const alignToken = el.style.textAlign ? ALIGN_TOKEN_BY_VALUE[el.style.textAlign] : undefined
  return lines.map((line, idx) => {
    const marker = ordered ? `${idx + 1}. ` : '- '
    const alignPrefix = idx === 0 && alignToken ? `${alignToken} ` : ''
    return alignPrefix + marker + line
  }).join('\n')
}

// Chrome às vezes ANINHA o <ul>/<ol> dentro do <p> em vez de substituí-lo,
// ao converter uma seleção que atravessa vários parágrafos que têm `style`
// inline próprio (nosso caso — cada bloco tem `style="margin:..."`) — o
// <p> vira um wrapper "fantasma" sem texto próprio, só a lista dentro.
// Confirmado testando ao vivo: `execCommand('insertOrderedList')` numa
// seleção de 3 <p> produz `<p><ol><li>...</li></ol></p>` em vez de um <ol>
// solto. Sem essa detecção, serializeBlock trataria o <p> como parágrafo
// normal e a lista viraria texto corrido sem marcadores.
function findWrappedList(el: HTMLElement): HTMLElement | null {
  const listChild = Array.from(el.children).find(c => c.tagName === 'UL' || c.tagName === 'OL') as HTMLElement | undefined
  if (!listChild) return null
  const textOutsideList = Array.from(el.childNodes)
    .filter(n => n !== listChild)
    .map(n => n.textContent ?? '')
    .join('')
    .trim()
  return textOutsideList === '' ? listChild : null
}

function htmlToMarkdown(container: HTMLElement): string {
  const blocks = Array.from(container.children) as HTMLElement[]
  return blocks
    .map(el => {
      if (el.tagName === 'UL' || el.tagName === 'OL') return serializeListBlock(el)
      const wrappedList = findWrappedList(el)
      if (wrappedList) return serializeListBlock(wrappedList)
      return serializeBlock(el)
    })
    .filter((b): b is string => b !== null)
    .join('\n\n')
}

// ── formatação ao digitar (Notion-style: "**palavra**" vira negrito assim
// que o marcador de fechamento é digitado) ──────────────────────────────────

const AUTO_FORMAT_PATTERNS: { re: RegExp; tag: 'b' | 'u' | 'i' }[] = [
  { re: /\*\*([^*\n]+)\*\*$/, tag: 'b' },
  { re: /__([^_\n]+)__$/, tag: 'u' },
  { re: /\*([^*\n]+)\*$/, tag: 'i' },
  { re: /_([^_\n]+)_$/, tag: 'i' },
]

/**
 * Roda a cada `input`; se o texto logo antes do cursor fecha um marcador
 * válido, converte pra elemento formatado. No-op silencioso em qualquer
 * estrutura que não reconheça.
 *
 * O último caractere digitado precisa NÃO ser ele mesmo um marcador (* ou
 * _) — senão "*itálico*" dispararia assim que o usuário digita UM
 * asterisco de fechamento, sem dar chance de virar "**negrito**" com o
 * segundo (mesmo problema com "_itálico_" vs "__sublinhado__"). Por isso
 * espera 1 caractere "de confirmação" depois do marcador de fechamento —
 * o mesmo padrão de qualquer editor com atalho markdown (Notion, Slack):
 * fecha o marcador, digita mais um caractere (espaço, pontuação, letra
 * seguinte), e SÓ ENTÃO converte.
 */
function tryAutoFormat(containerEl: HTMLElement) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return
  const node = sel.anchorNode
  if (!node || node.nodeType !== Node.TEXT_NODE || !containerEl.contains(node)) return

  const text = node.textContent ?? ''
  const offset = sel.anchorOffset
  if (offset === 0) return

  const confirmChar = text[offset - 1]
  if (confirmChar === '*' || confirmChar === '_') return

  const before = text.slice(0, offset - 1)

  for (const { re, tag } of AUTO_FORMAT_PATTERNS) {
    const m = before.match(re)
    if (!m || !m[1] || m.index === undefined) continue

    const beforeText = text.slice(0, m.index)
    const afterText = confirmChar + text.slice(offset) // recoloca o caractere de confirmação depois do elemento
    const parent = node.parentNode
    if (!parent) return

    const wrapper = document.createElement(tag)
    wrapper.textContent = m[1]
    const afterNode = document.createTextNode(afterText)

    parent.replaceChild(afterNode, node)
    parent.insertBefore(wrapper, afterNode)
    parent.insertBefore(document.createTextNode(beforeText), wrapper)

    // Cursor logo depois do caractere de confirmação (posição 1 do novo nó).
    const range = document.createRange()
    range.setStart(afterNode, 1)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    return
  }
}

// Estado "ligado/desligado" de cada botão da barra — reflete a seleção
// atual (ou o estado de digitação pendente, com o cursor colapsado e nada
// selecionado) pra dar a mesma pista visual que Word/Google Docs/Notion dão:
// o botão Negrito acende quando o texto selecionado (ou o que vai ser
// digitado a seguir) já está em negrito. `align` sempre tem um valor
// ('left' é o padrão sem marcador no texto).
interface ActiveFormats {
  bold: boolean
  italic: boolean
  underline: boolean
  heading: boolean
  list: 'bullet' | 'ordered' | null
  align: CSSProperties['textAlign']
}
const DEFAULT_ACTIVE_FORMATS: ActiveFormats = { bold: false, italic: false, underline: false, heading: false, list: null, align: 'left' }

export function MarkdownEditor({ value, onChange, placeholder, disabled, style }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEmpty, setIsEmpty] = useState(!value.trim())
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(DEFAULT_ACTIVE_FORMATS)
  const isMobile = useIsMobile()

  // Só a "fonte da verdade" precisa saber se o `value` que chegou de fora é
  // eco de uma edição nossa (não re-renderiza o DOM, preservaria o cursor à
  // toa) ou uma mudança externa de verdade (trocou de item na grade,
  // Restaurar Padrão, Limpar) — aí sim precisa re-montar o HTML do zero.
  const lastEmittedRef = useRef<string | null>(null)

  useEffect(() => {
    // Separador de parágrafo do navegador: Enter cria <p> novo (bloco),
    // Shift+Enter insere <br> (quebra de linha simples dentro do parágrafo)
    // — mesmo modelo que Markdown.tsx espera (parseMarkdownBlocks).
    document.execCommand('defaultParagraphSeparator', false, 'p')
    ensureListCss()
  }, [])

  useEffect(() => {
    if (value === lastEmittedRef.current) return
    if (containerRef.current) containerRef.current.innerHTML = markdownToHtml(value)
    lastEmittedRef.current = value
    setIsEmpty(!value.trim())
  }, [value])

  const handleInput = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    tryAutoFormat(el)
    const md = htmlToMarkdown(el)
    lastEmittedRef.current = md
    setIsEmpty(!md.trim())
    onChange(md)
    updateActiveFormats()
  }, [onChange])

  const handlePaste = useCallback((e: ReactClipboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    if (!text) return
    // Colar no meio de um parágrafo já existente: só formatação inline
    // (negrito/itálico/sublinhado) + quebras de linha — marcadores de bloco
    // (alinhamento/título) não fazem sentido no meio de um parágrafo.
    const html = inlineAstToHtml(parseInlineAst(text)).replace(/\n/g, '<br>')
    document.execCommand('insertHTML', false, html)
    handleInput()
  }, [handleInput])

  // Recalcula quais botões devem aparecer "ligados" — negrito/itálico/
  // sublinhado/lista via document.queryCommandState (API nativa: reflete
  // tanto uma seleção quanto o estado de digitação pendente com o cursor
  // colapsado, exatamente o mesmo mecanismo por trás do "negrito antes de
  // escrever"); título e alinhamento via inspeção do bloco atual (não têm
  // queryCommandState equivalente — formatBlock não tem "consulta" nativa).
  const updateActiveFormats = useCallback(() => {
    const containerEl = containerRef.current
    const sel = window.getSelection()
    if (!containerEl || !sel || !sel.anchorNode || !containerEl.contains(sel.anchorNode)) return
    const blockEl = getBlockElement(sel.anchorNode, containerEl)
    const list: ActiveFormats['list'] =
      document.queryCommandState('insertUnorderedList') ? 'bullet'
      : document.queryCommandState('insertOrderedList') ? 'ordered'
      : null
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      heading: blockEl?.tagName === 'H4',
      list,
      align: (blockEl?.style.textAlign || 'left') as CSSProperties['textAlign'],
    })
  }, [])

  // selectionchange é global (não escopado ao elemento) — cada instância
  // filtra sozinha via containerEl.contains(...) dentro de
  // updateActiveFormats, então múltiplos editores montados ao mesmo tempo
  // não interferem entre si. Mantém os indicadores de estado ativo da barra
  // (fixa no header no desktop, fixa no rodapé da tela no mobile) sempre em
  // dia com a seleção/cursor atual.
  useEffect(() => {
    document.addEventListener('selectionchange', updateActiveFormats)
    return () => document.removeEventListener('selectionchange', updateActiveFormats)
  }, [updateActiveFormats])

  function toggleInline(cmd: 'bold' | 'italic' | 'underline') {
    document.execCommand(cmd)
    handleInput()
    updateActiveFormats()
  }

  function applyAlign(cmd: 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'justifyFull') {
    document.execCommand(cmd)
    handleInput()
    updateActiveFormats()
  }

  // insertOrderedList/insertUnorderedList — mesma técnica documentada de
  // qualquer editor rich-text em contentEditable: o navegador cria a
  // estrutura <ul>/<ol><li> sozinho e já trata Enter (novo item), Enter
  // duplo (sai da lista) e Backspace no início (desfaz item) nativamente,
  // sem precisar reimplementar nada disso à mão.
  function toggleList(cmd: 'insertUnorderedList' | 'insertOrderedList') {
    document.execCommand(cmd)
    handleInput()
    updateActiveFormats()
  }

  function getBlockElement(node: Node | null, container: HTMLElement): HTMLElement | null {
    let el: Node | null = node
    let guard = 0
    while (el && el !== container && el.parentNode !== container) {
      el = el.parentNode
      if (++guard > 50) return null
    }
    return el && el !== container ? (el as HTMLElement) : null
  }

  function toggleHeading() {
    const containerEl = containerRef.current
    const sel = window.getSelection()
    if (!containerEl || !sel || sel.rangeCount === 0) return

    // Índice dos blocos afetados (não a referência do elemento em si!) —
    // `execCommand('formatBlock')` troca a tag recriando o elemento, então
    // qualquer referência a blockEl capturada ANTES da chamada fica órfã
    // (desconectada do DOM) logo depois. Índice na lista de filhos diretos
    // do container continua válido porque formatBlock só retroca a tag de
    // cada bloco selecionado, nunca adiciona/remove blocos.
    const childrenBefore = Array.from(containerEl.children) as HTMLElement[]
    const anchorBlock = getBlockElement(sel.anchorNode, containerEl)
    const focusBlock = getBlockElement(sel.focusNode, containerEl)
    const anchorIdx = anchorBlock ? childrenBefore.indexOf(anchorBlock) : -1
    const focusIdx = focusBlock ? childrenBefore.indexOf(focusBlock) : anchorIdx
    if (anchorIdx < 0) return
    const isHeading = anchorBlock?.tagName === 'H4'

    let [from, to] = anchorIdx <= focusIdx ? [anchorIdx, focusIdx] : [focusIdx, anchorIdx]

    // Triple-click (e seleções "até o fim da linha" em geral) frequentemente
    // fecham a seleção logo no INÍCIO do bloco seguinte (offset 0) ou no FIM
    // do bloco anterior, mesmo sem nenhum caractere de lá realmente
    // selecionado — quirk conhecido de Selection/Range em contentEditable.
    // `range.start*`/`range.end*` refletem SEMPRE a ordem no documento (não
    // a direção do arraste do usuário — isso é anchor/focus, coisa da
    // Selection, não da Range), então o limite "de cima" (`to`) sempre
    // corresponde a `range.end*`, e o "de baixo" (`from`) a `range.start*`.
    // Sem esse ajuste, selecionar só o 1º parágrafo (triple-click) e clicar
    // em Título também convertia o 2º.
    if (to > from) {
      const range = sel.getRangeAt(0)
      const probeEnd = document.createRange()
      probeEnd.setStart(childrenBefore[to], 0)
      probeEnd.setEnd(range.endContainer, range.endOffset)
      if (probeEnd.toString().length === 0) to -= 1
    }
    if (to > from) {
      const range = sel.getRangeAt(0)
      const probeStart = document.createRange()
      probeStart.setStart(range.startContainer, range.startOffset)
      probeStart.setEnd(childrenBefore[from], childrenBefore[from].childNodes.length)
      if (probeStart.toString().length === 0) from += 1
    }

    // Reduz a seleção de verdade ao intervalo já corrigido ANTES de chamar
    // execCommand — senão o comando NATIVO do navegador (não só o nosso
    // código de reestilização abaixo) também formataria o bloco extra.
    // formatBlock trata o bloco inteiro da mesma forma com seleção total ou
    // parcial, então re-selecionar o(s) bloco(s) inteiro(s) aqui é equivalente
    // pro que o comando faz, sem efeito colateral.
    const trimmedRange = document.createRange()
    trimmedRange.setStart(childrenBefore[from], 0)
    trimmedRange.setEnd(childrenBefore[to], childrenBefore[to].childNodes.length)
    sel.removeAllRanges()
    sel.addRange(trimmedRange)

    document.execCommand('formatBlock', false, isHeading ? 'P' : 'H4')

    // Uma seleção pode cobrir vários parágrafos — formatBlock converte
    // TODOS eles, então reestiliza cada um, não só o que a seleção começou.
    const childrenAfter = Array.from(containerEl.children) as HTMLElement[]
    const affected = childrenAfter.slice(from, to + 1)

    // execCommand só troca a tag (H4↔P) — não carrega o CSS customizado do
    // editor (espaçamento/tamanho do título). Sem isso, um título criado ao
    // vivo pela toolbar ficava sem o espaçamento extra até a caixa recarregar
    // do zero (trocar de campo e voltar). Ver blockStyleCss.
    affected.forEach(el => {
      const align = (el.style.textAlign || undefined) as CSSProperties['textAlign']
      el.setAttribute('style', blockStyleCss(align, el.tagName === 'H4'))
    })

    // Ao CRIAR um título, o negrito vem ligado por padrão (pré-definido —
    // "título" já nasce em negrito) — mas é um <b> de verdade em volta do
    // texto inteiro do bloco, não uma imposição do CSS: o consultor pode
    // clicar em Negrito de novo depois pra desligar só essa propriedade,
    // sem perder a fonte maior do título (que é o único traço realmente
    // fixo). Ao desfazer o título (virar parágrafo de novo), o negrito
    // aplicado fica como está — é independente do tipo de bloco a partir daí.
    // Envolve o conteúdo num <b> diretamente via DOM em vez de
    // execCommand('bold'): confirmado ao vivo que o próprio execCommand
    // 'limpa'/reescreve o atributo style do bloco como efeito colateral —
    // ele estava APAGANDO o font-weight:400 que acabamos de aplicar acima,
    // deixando o <h4> sem o CSS customizado do editor (voltava a depender só
    // do negrito nativo do navegador, sem <b> real nenhum no conteúdo).
    if (!isHeading) {
      affected.forEach(el => {
        const alreadyFullyBold = el.children.length === 1
          && (el.firstElementChild?.tagName === 'B' || el.firstElementChild?.tagName === 'STRONG')
          && el.firstElementChild.textContent === el.textContent
        if (!alreadyFullyBold && el.textContent?.trim()) {
          const b = document.createElement('b')
          while (el.firstChild) b.appendChild(el.firstChild)
          el.appendChild(b)
        }
      })
    }

    // Mantém o(s) bloco(s) afetado(s) selecionados no fim (não colapsa o
    // cursor) — o botão "H" da barra fica aceso sobre a seleção como
    // confirmação visual imediata do que acabou de acontecer.
    if (affected.length > 0) {
      const finalRange = document.createRange()
      finalRange.setStart(affected[0], 0)
      finalRange.setEnd(affected[affected.length - 1], affected[affected.length - 1].childNodes.length)
      sel.removeAllRanges()
      sel.addRange(finalRange)
    }

    handleInput()
    updateActiveFormats()
  }

  // Atalhos Ctrl/Cmd+B, +I, +U — escolher a formatação ANTES de escrever um
  // texto novo (sem precisar selecionar nada primeiro): comportamento nativo
  // do navegador, o mesmo usado por Google Docs/Word/Notion. execCommand com
  // seleção colapsada (só o cursor, nada selecionado) deixa o "estado de
  // digitação" ligado — os próximos caracteres digitados já saem formatados,
  // até o atalho ser apertado de novo pra desligar. Não precisa reimplementar
  // nada disso à mão; só expor o atalho (o navegador não faz esse bind
  // sozinho pra uma <div contentEditable> comum, diferente de <textarea>).
  function handleKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const mod = e.ctrlKey || e.metaKey
    if (!mod) return
    const key = e.key.toLowerCase()
    if (key === 'b') { e.preventDefault(); toggleInline('bold') }
    else if (key === 'i') { e.preventDefault(); toggleInline('italic') }
    else if (key === 'u') { e.preventDefault(); toggleInline('underline') }
  }

  // Mobile usa alvos de toque maiores; desktop mantém a barra compacta.
  const btnSize = isMobile ? 34 : 26
  const iconSize = isMobile ? 15 : 13

  // Botão "ligado" (negrito/itálico/sublinhado/título ativos na seleção
  // atual, ou alinhamento correspondente ao bloco atual) ganha um fundo e
  // ícone destacados — mesma pista visual que Word/Google Docs/Notion dão
  // (ver ActiveFormats acima). `active` default false pros que não têm
  // estado (nenhum, hoje todos têm).
  function getBtnStyle(active: boolean): CSSProperties {
    return {
      width: btnSize, height: btnSize, borderRadius: 6, flexShrink: 0,
      background: active ? 'rgba(253,184,19,.18)' : 'transparent',
      border: 'none', color: active ? t.gold : t.fg2,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    }
  }

  const divider = <div style={{ width: 1, flexShrink: 0, alignSelf: 'stretch', background: t.pb, margin: '0 2px' }} />

  const buttons: ReactNode = (
    <>
      <button type="button" title="Negrito (Ctrl+B)" style={getBtnStyle(activeFormats.bold)} onClick={() => toggleInline('bold')}><BoldIcon size={iconSize} /></button>
      <button type="button" title="Itálico (Ctrl+I)" style={getBtnStyle(activeFormats.italic)} onClick={() => toggleInline('italic')}><ItalicIcon size={iconSize} /></button>
      <button type="button" title="Sublinhado (Ctrl+U)" style={getBtnStyle(activeFormats.underline)} onClick={() => toggleInline('underline')}><UnderlineIcon size={iconSize} /></button>
      <button
        type="button"
        title="Título (fonte maior, com mais espaço acima/abaixo — negrito vem ligado por padrão, mas pode desligar)"
        style={getBtnStyle(activeFormats.heading)}
        onClick={toggleHeading}
      >
        <HeadingIcon size={iconSize} />
      </button>
      {divider}
      <button type="button" title="Lista com marcadores" style={getBtnStyle(activeFormats.list === 'bullet')} onClick={() => toggleList('insertUnorderedList')}><ListBulletIcon size={iconSize} /></button>
      <button type="button" title="Lista numerada" style={getBtnStyle(activeFormats.list === 'ordered')} onClick={() => toggleList('insertOrderedList')}><ListNumberedIcon size={iconSize} /></button>
      {divider}
      <button type="button" title="Alinhar à esquerda" style={getBtnStyle(activeFormats.align === 'left')} onClick={() => applyAlign('justifyLeft')}><AlignLeftIcon size={iconSize} /></button>
      <button type="button" title="Centralizar" style={getBtnStyle(activeFormats.align === 'center')} onClick={() => applyAlign('justifyCenter')}><AlignCenterIcon size={iconSize} /></button>
      <button type="button" title="Alinhar à direita" style={getBtnStyle(activeFormats.align === 'right')} onClick={() => applyAlign('justifyRight')}><AlignRightIcon size={iconSize} /></button>
      <button type="button" title="Justificado" style={getBtnStyle(activeFormats.align === 'justify')} onClick={() => applyAlign('justifyFull')}><AlignJustifyIcon size={iconSize} /></button>
    </>
  )

  return (
    <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Desktop: barra FIXA no header da caixa de texto (não mais flutuante
          sobre a seleção) — sempre visível, colada no topo da caixa como um
          cabeçalho (mesmo modelo de Word/Google Docs). Emenda visual com a
          caixa: cantos de baixo retos + sem borda inferior própria; a borda
          de cima da caixa (do `style` do chamador) faz a linha divisória. */}
      {!isMobile && !disabled && (
        <div
          // onMouseDown com preventDefault evita que o clique na barra tire o
          // foco/seleção da caixa antes do onClick do botão disparar.
          onMouseDown={e => e.preventDefault()}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
            background: t.night2, border: `1px solid ${t.pb}`, borderBottom: 'none',
            borderRadius: '8px 8px 0 0', padding: 4,
          }}
        >
          {buttons}
        </div>
      )}
      <div ref={boxRef} style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          ref={containerRef}
          className={EDITABLE_LIST_CLASS}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          style={!isMobile && !disabled
            ? { ...style, borderTopLeftRadius: 0, borderTopRightRadius: 0 }
            : style}
        />
        {isEmpty && placeholder && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
            padding: style?.padding, fontSize: style?.fontSize, lineHeight: style?.lineHeight,
            fontFamily: style?.fontFamily, boxSizing: style?.boxSizing, color: t.fg4,
          }}>
            {placeholder}
          </div>
        )}
      </div>

      {/* Mobile: barra fixa colada no rodapé da TELA (não da caixa de texto) —
          fica bem onde a navegação inferior do app normalmente fica (some
          atrás de qualquer modal em tela cheia enquanto o texto está sendo
          editado); rola na horizontal se os botões não couberem na largura.
          Monta/desmonta junto com o próprio MarkdownEditor — como este só
          existe enquanto a tela/modal de edição está aberta, a barra
          aparece/some junto automaticamente. Portal pro document.body pelo
          mesmo motivo do de cima: nunca fica presa atrás do modal (zIndex 200
          em CustomTexts.tsx) ou de qualquer overflow de ancestral. */}
      {isMobile && !disabled && createPortal(
        <div
          onMouseDown={e => e.preventDefault()}
          onTouchStart={e => e.stopPropagation()}
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 400,
            display: 'flex', alignItems: 'center', gap: 2,
            overflowX: 'auto', overflowY: 'hidden', flexWrap: 'nowrap',
            background: t.night2, borderTop: `1px solid ${t.pb}`,
            padding: '6px 8px', paddingBottom: 'calc(6px + env(safe-area-inset-bottom, 0px))',
          }}
        >
          {buttons}
        </div>,
        document.body
      )}
    </div>
  )
}
