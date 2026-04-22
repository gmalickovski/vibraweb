// print-document.ts
// Opens a clean print window with the captured A4 page HTML.
// Each .a4-page already contains its own header/footer from the React preview.
// No position:fixed tricks — the HTML is a 1:1 copy of the screen preview.

import type { DocTheme } from './theme-resolver'

export interface BrandConfig {
  primaryColor: string
  accentColor: string
  h1Color: string
  h2Color: string
  h3Color: string
  bodyColor: string
  bodyFontSize: number

  showHeader: boolean
  headerHeight: number
  headerLogoUrl: string | null
  headerRightText: string
  headerFontSize: number

  showFooter: boolean
  footerHeight: number
  footerLeft: string
  footerCenter: string
  footerRight: string

  companyName: string
  companyContact: string
  logoUrl: string | null
  showVibrawebBranding: boolean
}

export function printDocument(subject: string, theme: DocTheme, _brandConfig?: BrandConfig) {
  const previewEl = document.querySelector('.preview-scroll')
  if (!previewEl) return

  const content = previewEl.innerHTML
  const fontUrl = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap'

  const pc = theme.primaryColor
  const ac = theme.accentColor

  const styles = `
    @import url('${fontUrl}');

    *, *::before, *::after { box-sizing: border-box; }

    @page {
      size: A4;
      margin: 0; /* safe area handled by position:absolute header/footer at 8mm */
    }

    html, body {
      margin: 0; padding: 0;
      background: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 11px;
      color: #333;
    }

    /*
     * Constants (must match PreviewPage.tsx):
     * SAFE = 8mm, SIDE = 12mm
     * PAD_TOP_COVER = 10mm, PAD_TOP_CONTENT = 22mm, PAD_BOT = 20mm
     */

    /* Base page */
    .a4-page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      background: #fff;
      color: #1C1016;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
      box-shadow: none !important;
      border-radius: 0 !important;
      page-break-after: always;
      break-after: page;
    }

    .a4-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Cover: no header — smaller top padding */
    .a4-page.doc-cover {
      padding: 10mm 12mm 20mm;
      align-items: center;
    }

    /* Content pages */
    .a4-page.content-page {
      padding: 22mm 12mm 20mm;
    }

    /* Header — absolutely pinned to top */
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

    /* Footer — absolutely pinned to bottom (same on all pages) */
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

    /* Watermark */
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

    /* Typography */
    h1, h2, h3, h4 { font-family: 'Poppins', sans-serif; margin: 0; }
    p { margin: 0; }

    /* Section heading */
    div[style*="text-transform: uppercase"] h2,
    h2 { color: ${pc}; }

    /* Number entry grid */
    div[style*="grid-template-columns: 72px"] {
      display: grid !important;
      grid-template-columns: 72px 1fr !important;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Summary cards */
    div[style*="repeat(4, 1fr)"] {
      display: grid !important;
      grid-template-columns: repeat(4, 1fr) !important;
    }

    /* Cycles grid */
    div[style*="repeat(3, 1fr)"] {
      display: grid !important;
      grid-template-columns: repeat(3, 1fr) !important;
    }

    /* Footer grid */
    div[style*="repeat(2, 1fr)"],
    div[style*="repeat(3, 1fr)"] {
      display: grid !important;
    }

    /* Avoid cutting a single block in half */
    .a4-page > div > div { page-break-inside: avoid; break-inside: avoid; }

    /* Content inner div — must NOT clip in print */
    .a4-page.content-page > div[style] {
      overflow: visible !important;
    }

    /* preview-scroll wrapper: reset to plain block flow for print */
    .preview-scroll {
      background: #fff !important;
      display: block !important;
      padding: 0 !important;
      align-items: unset !important;
    }
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
