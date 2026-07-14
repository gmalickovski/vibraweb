// caret-position.ts — calcula a posição em pixels de um índice de caractere
// dentro de um <textarea>, pra poder posicionar a barra flutuante de
// formatação em cima da seleção. Técnica padrão: espelha o textarea num div
// invisível com os mesmos estilos computados, mede onde um <span> marcador
// cai dentro dele.

const MIRRORED_PROPERTIES: (keyof CSSStyleDeclaration)[] = [
  'boxSizing', 'width', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
  'borderStyle', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'lineHeight', 'fontFamily',
  'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize',
]

export interface CaretCoords {
  top: number
  left: number
  height: number
}

/** Coordenadas do caractere `position` relativas ao próprio textarea (sem contar scroll). */
export function getCaretCoordinates(el: HTMLTextAreaElement, position: number): CaretCoords {
  const div = document.createElement('div')
  document.body.appendChild(div)
  const style = div.style
  const computed = window.getComputedStyle(el)

  style.position = 'absolute'
  style.visibility = 'hidden'
  style.whiteSpace = 'pre-wrap'
  style.wordWrap = 'break-word'
  style.top = '0'
  style.left = '-9999px'

  MIRRORED_PROPERTIES.forEach(prop => {
    // @ts-expect-error — copiando propriedades de CSSStyleDeclaration dinamicamente
    style[prop] = computed[prop]
  })

  div.textContent = el.value.substring(0, position)
  const span = document.createElement('span')
  // conteúdo não pode ficar vazio, senão offsetTop/Left do span não é confiável
  span.textContent = el.value.substring(position) || '.'
  div.appendChild(span)

  const coords: CaretCoords = {
    top: span.offsetTop + parseInt(computed.borderTopWidth || '0', 10),
    left: span.offsetLeft + parseInt(computed.borderLeftWidth || '0', 10),
    height: span.offsetHeight,
  }

  document.body.removeChild(div)
  return coords
}

/** Coordenadas do meio da seleção atual, já ajustadas pro scroll do textarea, relativas ao próprio elemento. */
export function getSelectionMidpoint(el: HTMLTextAreaElement): { top: number; left: number } {
  const start = getCaretCoordinates(el, el.selectionStart)
  const end = getCaretCoordinates(el, el.selectionEnd)
  // Seleção pode cruzar linhas — usa o topo mais alto (menor top) entre os dois pontos.
  const top = Math.min(start.top, end.top) - el.scrollTop
  const left = (start.top === end.top ? (start.left + end.left) / 2 : start.left) - el.scrollLeft
  return { top, left }
}
