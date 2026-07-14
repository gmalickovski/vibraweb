// print-document.ts
// Opens a clean print window with captured preview HTML.
// Screen uses flexible content-section divs (grow with content, no clipping).
// Print uses CSS page-break rules + break-inside:avoid so browser handles pagination.

import type { DocTheme } from './theme-resolver'

export function printDocument(subject: string, theme: DocTheme) {
  const previewEl = document.querySelector('.preview-scroll')
  if (!previewEl) return

  const content = previewEl.innerHTML
  const fontUrl = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap'

  const pc = theme.primaryColor
  const ac = theme.accentColor

  const styles = `
    @import url('${fontUrl}');

    *, *::before, *::after { box-sizing: border-box; }

    /*
     * Page setup — margins reserve room for header (top) and footer (bottom).
     * Constants (match PreviewPage.tsx):
     *   SAFE = 8mm  SIDE = 12mm
     *   PAD_TOP_CONTENT = 22mm  PAD_BOT = 20mm
     */
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

    /* ── Cover page — fixed A4 height, centered content ──────────── */
    .a4-page.doc-cover {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10mm 12mm 20mm;
      position: relative;
      overflow: hidden;
      box-shadow: none !important;
      border-radius: 0 !important;
      page-break-after: always;
      break-after: page;
    }

    /* ── Content sections — flexible height, break-before each ───── */
    /* Each section = one major document block (Bloco 2, 3, 4, 5).   */
    /* Content flows naturally; browser splits across pages if needed. */
    .content-section {
      width: 210mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
      padding: 22mm 12mm 20mm;
      box-shadow: none !important;
      border-radius: 0 !important;
      /* Force a new page before each major block */
      page-break-before: always;
      break-before: page;
      /* Allow content to flow across pages without hard clipping */
      overflow: visible;
    }

    /* ── Header — absolutely pinned to top of each section ────────── */
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

    /* ── Footer — absolutely pinned to bottom of each section ─────── */
    .doc-page-footer {
      position: absolute !important;
      bottom: 8mm !important;
      left: 12mm !important;
      right: 12mm !important;
      padding-top: 3mm;
      border-top: 1px solid ${pc}22;
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 4px;
    }

    /* ── Watermark ──────────────────────────────────────────────────── */
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

    /* ── Typography ──────────────────────────────────────────────────── */
    h1 { font-family: 'Poppins', sans-serif; margin: 0; color: ${theme.h1Color}; }
    h2 { font-family: 'Poppins', sans-serif; margin: 0; color: ${theme.h2Color}; }
    h3 { font-family: 'Poppins', sans-serif; margin: 0; color: ${theme.h3Color}; }
    h4 { font-family: 'Poppins', sans-serif; margin: 0; color: ${theme.h3Color}; }
    p  { margin: 0; color: ${theme.bodyColor}; }

    /* ── Prevent individual blocks from being cut in half ───────────── */
    /* number-entry: the grid container with the large number box */
    div[style*="grid-template-columns: 72px"] {
      display: grid !important;
      grid-template-columns: 72px 1fr !important;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Keep each number-entry (title + blockquote + grid) together */
    .content-section > div > div {
      break-inside: avoid;
      page-break-inside: avoid;
    }

    /* Cycles / summary grids */
    div[style*="repeat(3, 1fr)"],
    div[style*="repeat(4, 1fr)"],
    div[style*="repeat(2, 1fr)"] {
      display: grid !important;
    }

    /* ── Zoom / scroll wrapper — reset for print ─────────────────────── */
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

    /* ── Hide screen-only toolbar ────────────────────────────────────── */
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
