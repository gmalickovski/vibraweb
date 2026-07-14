// Markdown.tsx — suporte mínimo de markdown pros textos do documento
// (Personalizar Textos, ajuste por cliente em OutputPanel) refletirem no
// preview real e no PDF gerado. Único renderizador usado por DocumentBlock.tsx,
// que por sua vez é o único componente que desenha tanto a tela de preview
// quanto o documento impresso/exportado (print-document.ts clona o HTML já
// renderizado) — corrigir aqui cobre os dois lugares de uma vez.
//
// Suporta: parágrafos (linha em branco separa), quebra de linha simples
// dentro de um parágrafo, **negrito**, *itálico*/_itálico_, __sublinhado__, e
// alinhamento de parágrafo via marcador no início da linha ([centro],
// [direita], [esquerda], [justificado] — inseridos pela barra flutuante do
// MarkdownEditor). Emojis e símbolos unicode não precisam de tratamento —
// passam direto como texto. O template (cores, containers, hierarquia de
// títulos) nunca mexe nessa formatação — ela vem só do que o consultor
// escreve nas caixas de texto (Personalizar Textos ou o ajuste por análise).

import type { CSSProperties, ReactNode } from 'react'

// Ordem importa: alternativas de 2 caracteres ("**", "__") precisam ser
// tentadas antes das de 1 caractere ("*", "_"), senão "__x__" quebraria em
// itálicos soltos por causa do "_" sozinho casando primeiro.
const INLINE_REGEX = /(\*\*.+?\*\*|__.+?__|\*.+?\*|_.+?_)/g

// Marcador de alinhamento no início do parágrafo → CSS text-align. Ordem no
// map não importa pra leitura, mas ALIGN_TOKENS (usado pelo MarkdownEditor
// pra inserir/remover) precisa listar todos.
const ALIGN_MAP: Record<string, CSSProperties['textAlign']> = {
  '[centro]': 'center',
  '[direita]': 'right',
  '[esquerda]': 'left',
  '[justificado]': 'justify',
}
export const ALIGN_TOKENS = Object.keys(ALIGN_MAP)

function stripAlignToken(paragraph: string): { align?: CSSProperties['textAlign']; rest: string } {
  for (const token of ALIGN_TOKENS) {
    if (paragraph.startsWith(token)) {
      return { align: ALIGN_MAP[token], rest: paragraph.slice(token.length).replace(/^\s+/, '') }
    }
  }
  return { rest: paragraph }
}

function parseInline(text: string): ReactNode[] {
  return text.split(INLINE_REGEX).filter(part => part !== '').map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      return <u key={i}>{part.slice(2, -2)}</u>
    }
    if (part.length >= 2 && (
      (part.startsWith('*') && part.endsWith('*')) ||
      (part.startsWith('_') && part.endsWith('_'))
    )) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

interface MarkdownParagraphsProps {
  text: string | null | undefined
  style?: CSSProperties
  emptyFallback?: ReactNode
}

/** Divide o texto em parágrafos (linha em branco) e aplica negrito/itálico dentro de cada um. */
export function MarkdownParagraphs({ text, style, emptyFallback }: MarkdownParagraphsProps) {
  const trimmed = (text ?? '').trim()
  if (!trimmed) return emptyFallback != null ? <>{emptyFallback}</> : null

  return (
    <>
      {trimmed.split(/\n\s*\n/).map((rawParagraph, i) => {
        if (!rawParagraph.trim()) return null
        const { align, rest: paragraph } = stripAlignToken(rawParagraph)
        const lines = paragraph.split('\n')
        return (
          <p key={i} style={align ? { ...style, textAlign: align } : style}>
            {lines.map((line, j) => (
              <span key={j}>
                {parseInline(line)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}

/** Aplica só negrito/itálico inline, sem quebrar em parágrafos — pra rótulos e legendas curtas de 1 linha. */
export function MarkdownInline({ text }: { text: string | null | undefined }) {
  return <>{parseInline(text ?? '')}</>
}
