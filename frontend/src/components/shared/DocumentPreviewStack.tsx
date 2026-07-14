// DocumentPreviewStack.tsx — renderiza a pilha de páginas do documento (capa +
// content-sections) usando exatamente as mesmas classes CSS (.a4-page,
// .content-section) e os mesmos componentes de header/footer/capa do preview
// real de geração do PDF (PreviewPage.tsx). Isso garante que os previews de
// Blocos do Relatório e Templates de Marca tenham as MESMAS proporções do
// documento gerado de verdade — só muda a escala (zoom), nunca o CSS.
// Ver Produto/docs/vibra-web/requisitos.md (ajuste de 2026-07-11).

import { splitIntoPages, type DocumentBlock } from '../../lib/document-builder'
import type { DocTheme } from '../../lib/theme-resolver'
import { CoverPage, PageHeader, PageFooter, PAD_TOP_CONTENT, SIDE, PAD_BOT } from './DocumentChrome'
import { DocumentBlockRenderer } from '../app/DocumentBlock'

interface DocumentPreviewStackProps {
  theme: DocTheme
  blocks: DocumentBlock[]
  subject: string
  dataNascimento: string
  tabLabel?: string
  isPro?: boolean
  zoom?: number
}

export function DocumentPreviewStack({
  theme, blocks, subject, dataNascimento, tabLabel = 'Pessoal', isPro = true, zoom = 1,
}: DocumentPreviewStackProps) {
  const docSubject = `${subject} — Mapa ${tabLabel}`
  const pages = splitIntoPages(blocks)
  const contentStyle = { padding: `${PAD_TOP_CONTENT} ${SIDE} ${PAD_BOT}` }

  return (
    <div className="zoom-wrapper" style={{
      transformOrigin: 'top center',
      transform: `scale(${zoom})`,
      transition: 'transform .2s',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      marginBottom: `${(zoom - 1) * -100}%`,
    }}>
      <CoverPage theme={theme} tabLabel={tabLabel} subject={subject} dataNascimento={dataNascimento} isPro={isPro} />

      {pages.map((pageBlocks, pageIdx) => (
        <div key={pageIdx} className="content-section" style={{
          ...contentStyle, position: 'relative', minHeight: '297mm', overflow: 'visible',
        }}>
          {isPro ? null : <div className="watermark">Vibraweb</div>}
          <PageHeader theme={theme} subject={docSubject} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {pageBlocks.map((block: DocumentBlock) => (
              <DocumentBlockRenderer key={block.id} block={block} theme={theme} />
            ))}
          </div>
          <PageFooter theme={theme} />
        </div>
      ))}
    </div>
  )
}
