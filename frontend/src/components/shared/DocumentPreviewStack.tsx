// DocumentPreviewStack.tsx — renderiza a pilha de páginas do documento (capa +
// content-sections) usando exatamente as mesmas classes CSS (.a4-page,
// .content-section) e os mesmos componentes de header/footer/capa do preview
// real de geração do PDF (PreviewPage.tsx). Isso garante que os previews de
// Blocos do Relatório e Templates de Marca tenham as MESMAS proporções do
// documento gerado de verdade — só muda a escala (zoom), nunca o CSS.
// Ver Produto/docs/vibra-web/requisitos.md (ajuste de 2026-07-11).
//
// Ajuste 2026-07-18: numeração de páginas — cada content-section recebe
// pageNumber sequencial (1, 2, 3…). Capa não é contada nem numerada (ABNT).

import { useEffect, useRef, useState } from 'react'
import { splitIntoPages, type DocumentBlock, type TocEntry } from '../../lib/document-builder'
import type { DocTheme } from '../../lib/theme-resolver'
import { CoverPage, DocumentFrame, PageHeader, PageFooter, PAD_TOP_CONTENT, SIDE, PAD_BOT, docStyleClass } from './DocumentChrome'
import { DocumentBlockRenderer } from '../app/DocumentBlock'

interface DocumentPreviewStackProps {
  theme: DocTheme
  blocks: DocumentBlock[]
  // Páginas pré-computadas com altura REAL medida (PreviewPage.tsx via
  // measure-document.tsx) — quando ausente (previews de amostra em
  // Blocos/Templates, sample-preview.ts), cai pro cálculo heurístico local
  // de splitIntoPages (sem medição real, mais barato pra um preview mockado).
  pages?: DocumentBlock[][]
  subject: string
  dataNascimento: string
  /** Permite ocultar o nome no cabeçalho quando necessário. */
  showSubjectInHeader?: boolean
  tabLabel?: string
  isPro?: boolean
  zoom?: number
  // Entradas do sumário computadas após paginação (PreviewPage.tsx).
  // Quando presentes, insere uma ou mais páginas de SUMÁRIO entre a capa e o
  // conteúdo numerado. As páginas de sumário não exibem número (ABNT).
  tocEntries?: TocEntry[]
  onTocPageCountChange?: (count: number) => void
}

// Página de sumário: links clicáveis no PDF via âncoras HTML (#id).
// Cada entrada aponta para o `id` HTML do primeiro bloco da seção/subseção,
// adicionado aos wrappers em DocumentBlock.tsx.
function TocPageContent({ entries, theme, continuation }: { entries: TocEntry[]; theme: DocTheme; continuation: boolean }) {
  return (
    <div>
      {!continuation && (
        <>
          <h1 style={{
            fontSize: theme.h1FontSize,
            fontWeight: theme.h1Bold ? 700 : 400,
            letterSpacing: '.1em',
            color: theme.h1Color,
            margin: '0 0 8px',
            fontFamily: `'${theme.h1Font}', sans-serif`,
            fontStyle: theme.h1Italic ? 'italic' : 'normal',
            textDecoration: theme.h1Underline ? 'underline' : 'none',
        textAlign: theme.h1TextAlign,
        display: continuation ? 'none' : undefined,
          }}>
            SUMÁRIO
          </h1>
      {!continuation && theme.stylePreset === 'vibracao' && <div style={{ height: 2, width: 48, background: theme.accentColor, borderRadius: 2, marginBottom: 28 }} />}
      {!continuation && theme.stylePreset === 'modern' && <div style={{ height: 2, width: 72, background: theme.primaryColor, borderRadius: 1, marginBottom: 28 }} />}
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {entries.map(entry => (
          <a
            key={entry.id}
            href={`#${entry.anchor}`}
            data-toc-entry
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 4,
              paddingLeft: entry.level === 2 ? 18 : 0,
              marginBottom: entry.level === 1 ? 9 : 4,
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <span style={{
              fontSize: entry.level === 1 ? theme.h2FontSize : theme.bodyFontSize,
              fontWeight: entry.level === 1 ? (theme.h2Bold ? 700 : 600) : 400,
              color: entry.level === 1 ? theme.h2Color : theme.bodyColor,
              fontFamily: entry.level === 1 ? `'${theme.h2Font}', sans-serif` : `'${theme.bodyFont}', sans-serif`,
              minWidth: 0,
              lineHeight: 1.35,
            }}>
              {entry.label}
            </span>
            <span style={{
              flex: 1,
              borderBottom: '1px dotted',
              borderColor: `${theme.bodyColor}30`,
              marginBottom: 3,
              minWidth: 12,
            }} />
            <span style={{
              fontSize: entry.level === 1 ? theme.h2FontSize : theme.bodyFontSize,
              fontWeight: entry.level === 1 ? (theme.h2Bold ? 700 : 600) : 400,
              color: entry.level === 1 ? theme.h2Color : theme.bodyColor,
              fontFamily: `'${theme.bodyFont}', sans-serif`,
              whiteSpace: 'nowrap',
            }}>
              {entry.pageNumber}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

export function DocumentPreviewStack({
  theme, blocks, pages: pagesProp, subject, dataNascimento, showSubjectInHeader = true, tabLabel = 'Pessoal', isPro = true, zoom = 1,
  tocEntries, onTocPageCountChange,
}: DocumentPreviewStackProps) {
  const docSubject = showSubjectInHeader && subject.trim()
    ? `Mapa Pessoal Numerológico - ${subject.trim()}`
    : 'Mapa Pessoal Numerológico'
  const pages = pagesProp ?? splitIntoPages(blocks)
  const contentStyle = { padding: `${PAD_TOP_CONTENT} ${SIDE} ${PAD_BOT}` }
  const hasToc = !!tocEntries && tocEntries.length > 0
  const tocSignature = tocEntries?.map(entry => `${entry.id}:${entry.pageNumber}:${entry.label}`).join('|') ?? ''
  const [tocPages, setTocPages] = useState<TocEntry[][]>(() => hasToc ? [tocEntries!] : [])
  const renderedTocPages = hasToc ? (tocPages.length ? tocPages : [tocEntries!]) : []

  // Detector de overflow: se alguma folha estiver cortando conteúdo (a altura
  // real do fluxo passou da área útil → o overflow:hidden "come" o texto), avisa
  // no console qual página e por quantos px. É a FONTE DA VERDADE quando a
  // medição subestima algum bloco — dá pra ajustar PAGE_SAFETY_MM (measure-
  // document.tsx) ou o split do tipo específico a partir desse número.
  const rootRef = useRef<HTMLDivElement>(null)

  // O índice é medido dentro da própria folha A4 já renderizada. Assim, uma
  // alteração de fonte, zoom de preview ou título longo não depende de um
  // limite fixo de linhas: o restante segue automaticamente para outra folha.
  useEffect(() => {
    setTocPages(hasToc ? [tocEntries!] : [])
  }, [hasToc, tocSignature])

  useEffect(() => {
    if (!hasToc || tocPages.length !== 1) return

    let frame = 0
    const measureAndSplit = () => {
      const flow = rootRef.current?.querySelector<HTMLElement>('[data-toc-flow]')
      const rows = flow ? Array.from(flow.querySelectorAll<HTMLElement>('[data-toc-entry]')) : []
      if (!flow || rows.length !== tocEntries!.length || !rows.length) return

      const firstRowTop = rows[0].offsetTop
      const availableHeight = flow.clientHeight - firstRowTop
      if (availableHeight <= 0) return

      const rowHeights = rows.map((row, index) => {
        const next = rows[index + 1]
        if (next) return next.offsetTop - row.offsetTop
        const marginBottom = Number.parseFloat(window.getComputedStyle(row).marginBottom) || 0
        return row.offsetHeight + marginBottom
      })

      const nextPages: TocEntry[][] = []
      let currentPage: TocEntry[] = []
      let currentHeight = 0
      tocEntries!.forEach((entry, index) => {
        const rowHeight = rowHeights[index]
        if (currentPage.length && currentHeight + rowHeight > availableHeight) {
          nextPages.push(currentPage)
          currentPage = []
          currentHeight = 0
        }
        currentPage.push(entry)
        currentHeight += rowHeight
      })
      if (currentPage.length) nextPages.push(currentPage)

      if (nextPages.length > 1) setTocPages(nextPages)
    }

    frame = requestAnimationFrame(measureAndSplit)
    return () => cancelAnimationFrame(frame)
  }, [hasToc, tocEntries, tocPages.length, tocSignature])

  useEffect(() => {
    onTocPageCountChange?.(renderedTocPages.length)
  }, [onTocPageCountChange, renderedTocPages.length])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const raf = requestAnimationFrame(() => {
      const bad: string[] = []
      root.querySelectorAll('.content-section .doc-content-flow').forEach((flow, i) => {
        const el = flow as HTMLElement
        const over = el.scrollHeight - el.clientHeight
        if (over > 2) bad.push(`pág ${i + 1} (+${Math.round(over)}px)`)
      })
      if (bad.length) console.warn('[vibraweb-pagination] conteúdo cortando (overflow) em:', bad.join(', '))
    })
    return () => cancelAnimationFrame(raf)
  }, [pages, theme])

  return (
    <div ref={rootRef} className="zoom-wrapper" style={{
      transformOrigin: 'top center',
      transform: `scale(${zoom})`,
      transition: 'transform .2s',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginBottom: `${(zoom - 1) * -100}%`,
    }}>
      <CoverPage theme={theme} subject={subject} headerSubject={docSubject} dataNascimento={dataNascimento} isPro={isPro} />

      {/* Sumário: uma ou mais folhas, sempre antes do conteúdo e sem número. */}
      {renderedTocPages.map((tocPageEntries, tocPageIndex) => (
        <div className={`content-section ${docStyleClass(theme)}`} style={{
          ...contentStyle,
          position: 'relative',
          width: '210mm',
          height: '297mm',
          maxHeight: '297mm',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          {isPro ? null : <div className="watermark">Vibraweb</div>}
          <DocumentFrame theme={theme} />
          <PageHeader theme={theme} subject={docSubject} />
          <div data-toc-flow className="doc-content-flow" style={{ position: 'relative', zIndex: 1, height: '100%', overflow: 'hidden' }}>
            <TocPageContent entries={tocPageEntries} theme={theme} continuation={tocPageIndex > 0} />
          </div>
          {/* Sumário: contado mas não numerado (ABNT NBR 14724) */}
          <PageFooter theme={theme} pageNumber={null} />
        </div>
      ))}

      {pages.map((pageBlocks, pageIdx) => (
        <div key={pageIdx} className={`content-section ${docStyleClass(theme)}`} style={{
          ...contentStyle,
          position: 'relative',
          width: '210mm',
          height: '297mm',
          maxHeight: '297mm',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}>
          {isPro ? null : <div className="watermark">Vibraweb</div>}
          <DocumentFrame theme={theme} />
          <PageHeader theme={theme} subject={docSubject} />
          <div className="doc-content-flow" style={{ position: 'relative', zIndex: 1, height: '100%', overflow: 'hidden' }}>
            {pageBlocks.map((block: DocumentBlock) => (
              <DocumentBlockRenderer key={block.id} block={block} theme={theme} />
            ))}
          </div>
          {/* Numeração ABNT: capa = não contada/numerada; content pages = 1, 2, 3… */}
          <PageFooter theme={theme} pageNumber={pageIdx + 1} />
        </div>
      ))}
    </div>
  )
}
