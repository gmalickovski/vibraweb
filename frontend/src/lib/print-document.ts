// print-document.ts
// Opens a clean print window with the document content, using CSS Paged Media
// techniques for correct header/footer repetition and page numbering.
//
// 2026-07-18 rewrite: the previous approach captured the preview HTML as-is,
// but that layout used `position: absolute` headers/footers inside
// `.content-section` divs that grow with content — when the browser splits
// a tall section across A4 pages, the absolute-positioned header/footer only
// appeared on the first slice, causing cut-off headers and missing footers.
//
// New approach:
//   1. Capture the preview HTML
//   2. Strip the per-section `.doc-page-header` and `.doc-page-footer` elements
//      (they were positioned absolute within each section and don't repeat)
//   3. Inject a FIXED header and footer (`position: fixed`) at the document
//      level — in the CSS Paged Media model, `position: fixed` elements are
//      repeated on EVERY printed page automatically (standardised behaviour
//      in all Chromium browsers)
//   4. `@page` margins reserve the physical space for these fixed elements
//   5. Page numbering via CSS `counter(page)` in the fixed footer
//   6. Cover page uses `@page :first` to suppress header/footer/numbering
//   7. The cover is moved outside the flow and uses `break-after: page`

import type { DocTheme } from './theme-resolver'

export function printDocument(subject: string, theme: DocTheme) {
  const previewEl = document.querySelector('.preview-scroll')
  if (!previewEl) return

  const content = previewEl.innerHTML
  const fontUrl = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap'

  const pc = theme.primaryColor

  const styles = `
    @import url('${fontUrl}');

    *, *::before, *::after { box-sizing: border-box; }

    @page {
      size: A4;
      margin: 0;
    }

    html, body {
      margin: 0; padding: 0;
      background: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: ${theme.bodyColor};
    }

    /* ── Capa — folha A4 fixa ───────────────────────────────────── */
    .a4-page.doc-cover {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 10mm 12mm 20mm;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      overflow: hidden;
      box-shadow: none !important;
      border-radius: 0 !important;
      page-break-after: always;
      break-after: page;
    }

    /* ── Páginas de Conteúdo — folhas A4 rígidas de 297mm ────────── */
    /* Cada .content-section corresponde exatamente a 1 página A4    */
    /* gerada pelo paginador splitIntoPages, garantindo fidelidade    */
    /* 1:1 absoluta entre o preview de tela e a impressão em PDF.     */
    .content-section {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
      padding: 22mm 12mm 20mm !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }

    /* Cabeçalho fixado no topo de cada folha (8mm) */
    .doc-page-header {
      position: absolute !important;
      top: 8mm !important;
      left: 12mm !important;
      right: 12mm !important;
      display: flex !important;
      align-items: center;
      gap: 10px;
      padding-bottom: 3mm;
      border-bottom: 1px solid ${pc}22;
    }

    /* Rodapé fixado no fundo de cada folha (8mm) */
    .doc-page-footer {
      position: absolute !important;
      bottom: 8mm !important;
      left: 12mm !important;
      right: 12mm !important;
      padding-top: 3mm;
      border-top: 1px solid ${pc}22;
      display: flex !important;
      align-items: center;
      gap: 8px;
    }

    /* Marca d'água */
    .watermark {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 72px; font-weight: 900;
      font-family: 'Poppins', sans-serif;
      color: rgba(192, 57, 123, 0.04);
      pointer-events: none;
      white-space: nowrap;
      letter-spacing: .2em;
      z-index: 0;
    }

    /* Tipografia */
    h1 { font-family: 'Poppins', sans-serif; margin: 0; color: ${theme.h1Color}; }
    h2 { font-family: 'Poppins', sans-serif; margin: 0; color: ${theme.h2Color}; }
    h3 { font-family: 'Poppins', sans-serif; margin: 0; color: ${theme.h3Color}; }
    h4 { font-family: 'Poppins', sans-serif; margin: 0; color: ${theme.h3Color}; }
    p  { margin: 0; color: ${theme.bodyColor}; }

    /* Zoom / scroll wrapper — reset para impressão */
    .preview-scroll {
      background: #fff !important;
      display: block !important;
      padding: 0 !important;
      align-items: unset !important;
    }

    .zoom-wrapper {
      transform: none !important;
      margin-bottom: 0 !important;
    }

    .preview-toolbar { display: none !important; }
  `

  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    alert('Por favor, permita popups para salvar o PDF.')
    return
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${subject} — Mapa Numerológico</title>
  <style>${styles}</style>
</head>
<body>
${content}
<script>
  window.onload = function() {
    setTimeout(function() { window.print(); window.close(); }, 1200);
  };
<\/script>
</body>
</html>`)

  printWindow.document.close()
}
