// Markdown.tsx — suporte mínimo de markdown pros textos do documento
// (Personalizar Textos, ajuste por cliente em OutputPanel) refletirem no
// preview real e no PDF gerado. Único renderizador usado por DocumentBlock.tsx,
// que por sua vez é o único componente que desenha tanto a tela de preview
// quanto o documento impresso/exportado (print-document.ts clona o HTML já
// renderizado) — corrigir aqui cobre os dois lugares de uma vez.
//
// Suporta: parágrafos (linha em branco separa), quebra de linha simples
// dentro de um parágrafo, **negrito**, *itálico*/_itálico_, __sublinhado__
// (aninháveis entre si — ver parseInlineAst), alinhamento de parágrafo via
// marcador no início da linha ([centro], [direita], [esquerda],
// [justificado]), UM nível de subtítulo (parágrafo iniciado por "#### " vira
// <h4> — de propósito só h4, pra nunca competir com os títulos h2/h3 que o
// template do documento reserva pra si) e listas: bloco onde TODA linha
// começa com "- " vira <ul>, ou TODA linha começa com "N. " vira <ol> (bloco
// misto — só algumas linhas com marcador — fica como parágrafo normal,
// mesma regra que editores como Word aplicam). Emojis e símbolos unicode não
// precisam de tratamento — passam direto como texto. O template (cores,
// containers, hierarquia de títulos) nunca mexe nessa formatação — ela vem
// só do que o consultor escreve nas caixas de texto (Personalizar Textos ou
// o ajuste por análise), e todo bloco herda `style` (cor, fonte, tamanho) de
// quem chama `MarkdownParagraphs` — respeita o template escolhido
// automaticamente, sem cor/fonte hardcoded aqui. O editor é a fonte da
// verdade da formatação: nenhum bloco do documento força mais itálico.
//
// MarkdownEditor.tsx (WYSIWYG) usa os mesmos parsers (parseInlineAst,
// parseMarkdownBlocks) pra converter markdown → HTML editável, e o processo
// inverso (DOM → markdown) na hora de salvar — garante que o que o
// consultor vê no editor é EXATAMENTE o que aparece no preview e no PDF.

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

// Caminho inverso de ALIGN_MAP — usado pelo MarkdownEditor pra serializar o
// text-align do bloco de volta pro marcador. "left" fica de fora de
// propósito: é o padrão, não leva marcador no texto.
export const ALIGN_TOKEN_BY_VALUE: Record<string, string> = {
  center: '[centro]',
  right: '[direita]',
  justify: '[justificado]',
}

// Marcador de subtítulo (único nível permitido — h4). Usado também pelo
// MarkdownEditor pra inserir/remover via botão "Título".
export const SUBTITLE_TOKEN = '#### '

// Marcadores de item de lista, no início de CADA linha do bloco (não do
// bloco inteiro, como os de cima) — "- " pra lista com marcadores, "N. "
// (qualquer número) pra lista numerada. O número literal não importa pra
// renderização (sempre renumera 1,2,3... na ordem), só precisa bater o
// formato pra reconhecer a linha como item de lista numerada.
const BULLET_RE = /^-\s+/
const ORDERED_RE = /^\d+\.\s+/

function stripAlignToken(paragraph: string): { align?: CSSProperties['textAlign']; rest: string } {
  for (const token of ALIGN_TOKENS) {
    if (paragraph.startsWith(token)) {
      return { align: ALIGN_MAP[token], rest: paragraph.slice(token.length).replace(/^\s+/, '') }
    }
  }
  return { rest: paragraph }
}

// ── AST inline (negrito/itálico/sublinhado, aninháveis) ─────────────────────
// Parser recursivo: cada marcador casado tem seu CONTEÚDO reprocessado pelo
// mesmo parser, então "**_texto_**" vira bold contendo italic (em vez de
// mostrar os underscores literalmente). Consumido tanto pelo renderer React
// (renderInlineAst, abaixo) quanto pelo builder de HTML do editor
// (MarkdownEditor.tsx) — uma única fonte de verdade pro formato inline.
export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'bold' | 'italic' | 'underline'; children: InlineNode[] }

export function parseInlineAst(text: string): InlineNode[] {
  return text.split(INLINE_REGEX).filter(part => part !== '').map((part): InlineNode => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return { type: 'bold', children: parseInlineAst(part.slice(2, -2)) }
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      return { type: 'underline', children: parseInlineAst(part.slice(2, -2)) }
    }
    if (part.length >= 2 && (
      (part.startsWith('*') && part.endsWith('*')) ||
      (part.startsWith('_') && part.endsWith('_'))
    )) {
      return { type: 'italic', children: parseInlineAst(part.slice(1, -1)) }
    }
    return { type: 'text', value: part }
  })
}

function renderInlineAst(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, i) => {
    if (node.type === 'text') return node.value
    const inner = renderInlineAst(node.children)
    if (node.type === 'bold') return <strong key={i}>{inner}</strong>
    if (node.type === 'underline') return <u key={i}>{inner}</u>
    return <em key={i}>{inner}</em>
  })
}

function parseInline(text: string): ReactNode[] {
  return renderInlineAst(parseInlineAst(text))
}

// ── AST de blocos (parágrafos) ──────────────────────────────────────────────
// Um bloco = um parágrafo (linha em branco separa) já com o marcador de
// alinhamento e o de subtítulo extraídos, e o texto restante quebrado em
// linhas (quebra de linha simples dentro do parágrafo). Consumido por
// MarkdownParagraphs (abaixo) e por MarkdownEditor.tsx (markdown → HTML
// editável, na carga inicial e sempre que o valor muda de fora, ex.:
// "Restaurar Padrão"/"Limpar").
export interface MarkdownBlock {
  align: CSSProperties['textAlign']
  heading: boolean
  /** null = parágrafo normal; senão, `lines` passa a ser 1 item de lista por entrada (não quebras de linha soltas). */
  list: 'bullet' | 'ordered' | null
  lines: string[]
}

export function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const trimmed = (text ?? '').trim()
  if (!trimmed) return []
  return trimmed.split(/\n\s*\n/).filter(p => p.trim()).map((rawParagraph): MarkdownBlock => {
    const { align, rest } = stripAlignToken(rawParagraph)

    if (rest.startsWith(SUBTITLE_TOKEN)) {
      const body = rest.slice(SUBTITLE_TOKEN.length)
      // Subtítulo é sempre 1 linha só — quebras internas viram espaço.
      return { align, heading: true, list: null, lines: [body.replace(/\n/g, ' ').trim()] }
    }

    const rawLines = rest.split('\n').filter(l => l.trim())
    const isBullet = rawLines.length > 0 && rawLines.every(l => BULLET_RE.test(l))
    const isOrdered = !isBullet && rawLines.length > 0 && rawLines.every(l => ORDERED_RE.test(l))
    if (isBullet || isOrdered) {
      const items = rawLines.map(l => l.replace(isBullet ? BULLET_RE : ORDERED_RE, ''))
      return { align, heading: false, list: isBullet ? 'bullet' : 'ordered', lines: items }
    }

    return { align, heading: false, list: null, lines: rest.split('\n') }
  })
}

interface MarkdownParagraphsProps {
  text: string | null | undefined
  style?: CSSProperties
  emptyFallback?: ReactNode
}

/** Divide o texto em parágrafos (linha em branco) e aplica negrito/itálico/sublinhado dentro de cada um. */
export function MarkdownParagraphs({ text, style, emptyFallback }: MarkdownParagraphsProps) {
  const blocks = parseMarkdownBlocks(text ?? '')
  if (blocks.length === 0) return emptyFallback != null ? <>{emptyFallback}</> : null

  return (
    <>
      {blocks.map((block, i) => {
        if (block.heading) {
          return (
            <h4 key={i} style={{
              ...style,
              fontSize: 12.5,
              // Sem negrito forçado aqui — <h4> é negrito por padrão no
              // stylesheet nativo do navegador, então precisa neutralizar
              // explicitamente (400) pra o negrito vir SÓ de um **marcador**
              // de verdade no texto (mesma regra de qualquer parágrafo). O
              // editor (MarkdownEditor.tsx) já aplica esse marcador
              // automaticamente ao criar um título — mas o consultor pode
              // desligar depois, e esse desligamento precisa se refletir
              // aqui igual. O tamanho da fonte (único traço fixo do título)
              // continua sempre 12.5 — não é regulável.
              fontWeight: 400,
              fontStyle: 'normal',
              // Espaçamento generoso ANTES e DEPOIS — bem maior que o gap
              // normal entre parágrafos (~6-8px de `style.margin`, definido
              // por quem chama), pra separar visualmente o título do texto
              // acima e abaixo, igual Word/Google Docs tratam um heading.
              margin: '20px 0 10px',
              ...(block.align ? { textAlign: block.align } : null),
            }}>
              {parseInline(block.lines[0])}
            </h4>
          )
        }

        if (block.list) {
          const ListTag = block.list === 'ordered' ? 'ol' : 'ul'
          return (
            <ListTag key={i} style={{
              ...style,
              // Recuo lateral + respiro vertical padrão de lista (mesma
              // proporção usada por processadores de texto — a marcação
              // herda cor/fonte de `style`, então já sai na cor do template).
              margin: '10px 0', paddingLeft: 20,
              ...(block.align ? { textAlign: block.align } : null),
            }}>
              {block.lines.map((item, j) => (
                <li key={j} style={{ marginBottom: 4 }}>{parseInline(item)}</li>
              ))}
            </ListTag>
          )
        }

        return (
          <p key={i} style={block.align ? { ...style, textAlign: block.align } : style}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {parseInline(line)}
                {j < block.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </>
  )
}

/** Aplica só negrito/itálico/sublinhado inline, sem quebrar em parágrafos — pra rótulos e legendas curtas de 1 linha. */
export function MarkdownInline({ text }: { text: string | null | undefined }) {
  return <>{parseInline(text ?? '')}</>
}
