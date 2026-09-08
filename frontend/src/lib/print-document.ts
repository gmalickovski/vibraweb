// print-document.ts
// Abre uma janela de impressão clonando o HTML já renderizado do preview —
// a estratégia inteira de fidelidade 1:1 é: NÃO recalcular nada aqui, só
// imprimir exatamente o que o preview já decidiu.
//
// Fidelidade preview↔PDF (2026-07-19, ver feature-preview-document.md):
// a paginação (que bloco cai em qual página) é decidida UMA VEZ só, no
// preview (PreviewPage.tsx: `splitIntoPagesReal`, measure-document.tsx —
// medição REAL de DOM de cada bloco E de cada pedaço de divisão) — essa
// função aqui não recalcula nada, só clona
// `.preview-scroll` já renderizado com essa paginação. Como cada
// `.content-section` já é uma página A4 completa e isolada (altura fixa
// 297mm, `overflow:hidden`, o JS garante que o conteúdo cabe), o
// header/footer de cada página (`.doc-page-header`/`.doc-page-footer`,
// `position:absolute` dentro da própria seção, DocumentChrome.tsx) já vem
// certo por seção — não precisa do truque de header/footer `position:fixed`
// no nível do documento (que só faria diferença se o NAVEGADOR fosse
// quebrar uma seção alta em várias páginas físicas sozinho, o que não
// acontece aqui: 1 `.content-section` = exatamente 1 página impressa, nunca
// mais). O número de página também já vem pronto como texto literal
// ("Página N", `PageFooter`), não via `counter(page)` do CSS.
//
// O único requisito de fidelidade que esta função PRECISA garantir sozinha
// é a fonte: se a janela de impressão renderizar ANTES de Inter/Poppins
// carregarem, o texto sai numa fonte de fallback com métricas diferentes —
// pode quebrar linha diferente do preview e estourar o `overflow:hidden`
// de uma seção que cabia perfeitamente antes. Por isso espera
// `document.fonts.ready` de verdade antes de chamar `window.print()`
// (com teto de segurança, ver script no fim do arquivo).

import { COVER_FONTS_GOOGLE_URL, type DocTheme } from './theme-resolver'

export function printDocument(subject: string, theme: DocTheme) {
  const previewEl = document.querySelector('.preview-scroll')
  if (!previewEl) return

  const content = previewEl.innerHTML
  // Inclui Poppins/Inter + a lista curada de fontes da Capa
  // (`COVER_FONT_OPTIONS`, theme-resolver.ts) — fonte única da verdade da
  // URL, ao contrário de index.html (HTML estático não importa TS).
  const fontUrl = COVER_FONTS_GOOGLE_URL

  const pc = theme.primaryColor
  const assetOrigin = window.location.origin
  const styleRules = theme.stylePreset === 'holistic'
    ? `
      .doc-holistic-frame { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
      .doc-holistic-frame-corner { position: absolute; width: 7mm; height: 7mm; object-fit: contain; opacity: .46; }
      .doc-holistic-frame-corner.is-top-left { top: 2.5mm; left: 2.5mm; }
      .doc-holistic-frame-corner.is-top-right { top: 2.5mm; right: 2.5mm; transform: rotate(90deg); }
      .doc-holistic-frame-corner.is-bottom-right { right: 2.5mm; bottom: 2.5mm; transform: rotate(180deg); }
      .doc-holistic-frame-corner.is-bottom-left { bottom: 2.5mm; left: 2.5mm; transform: rotate(270deg); }
      .doc-style-holistic .doc-page-header, .doc-style-holistic .doc-page-footer { z-index: 1; }
      .doc-style-holistic .doc-content-flow, .doc-style-holistic .doc-content-flow p, .doc-style-holistic .doc-content-flow li { font-family: 'Lora', Georgia, serif !important; color: #4A414F !important; line-height: 1.82 !important; }
      .doc-style-holistic .doc-content-flow h1 { font-family: 'Cinzel', Georgia, serif !important; color: #8A5A00 !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: .025em !important; text-align: center !important; }
      .doc-style-holistic .doc-content-flow h2, .doc-style-holistic .doc-content-flow h3, .doc-style-holistic .doc-content-flow h4 { font-family: 'Cormorant Garamond', Georgia, serif !important; color: #4C2A68 !important; font-weight: 600 !important; text-transform: none !important; letter-spacing: .025em !important; }
      .doc-style-holistic.doc-ornament-flourish .doc-content-flow h1::after { content: ''; display: block; width: 100%; height: 12px; margin: 8px 0 12px; background: url('${assetOrigin}/assets/ornament-flourish.svg') center center / 100% 12px no-repeat; opacity: .72; }
      .doc-style-holistic .doc-holistic-callout { position: relative; display: grid; grid-template-columns: 12px minmax(0, 1fr); gap: 10px; margin: 0 0 18px; padding: 13px 17px 13px 14px; border: 1px solid rgba(114,83,138,.34); border-radius: 2px; background: rgba(114,83,138,.035); }
      .doc-style-holistic .doc-holistic-callout-mark { display: block; align-self: stretch; margin: 3px 0 5px; background: url('${assetOrigin}/assets/ornament-side-mark.svg') center top / 10px 42px repeat-y; opacity: .8; }
      .doc-style-holistic .doc-holistic-callout p:last-child { margin-bottom: 0 !important; }
      .doc-style-holistic .doc-holistic-section-intro { margin: 0 0 18px; padding: 0; border: 0; background: transparent; }
      .doc-style-holistic .doc-holistic-section-intro p:last-child { margin-bottom: 0 !important; }
      .doc-style-holistic .doc-holistic-instruction { margin: 0 0 20px; padding: 12px 16px 14px; border-top: 1px solid rgba(138,90,0,.48); border-bottom: 1px solid rgba(138,90,0,.48); background: rgba(138,90,0,.025); }
      .doc-style-holistic .doc-holistic-instruction-label { display: block; margin-bottom: 7px; color: #8A5A00; font: 600 10px 'Cinzel', Georgia, serif; letter-spacing: .06em; text-transform: uppercase; }
      .doc-style-holistic .doc-holistic-instruction p:last-child { margin-bottom: 0 !important; }
      .doc-style-holistic blockquote { position: relative; margin: 0 0 18px !important; padding: 12px 16px !important; border: 1px solid rgba(114,83,138,.34) !important; border-left: 1px solid rgba(114,83,138,.34) !important; border-radius: 2px !important; background: rgba(114,83,138,.025) !important; }
      .doc-style-holistic .doc-holistic-number-entry { display: grid; grid-template-columns: 44px minmax(0,1fr); gap: 20px; align-items: start; }
      .doc-style-holistic .doc-holistic-number { min-height: 52px; display: flex; align-items: center; justify-content: flex-start; border-right: 1px solid rgba(114,83,138,.42); color: #4C2A68; font: 600 34px/1 'Cinzel', Georgia, serif; }
      .doc-style-holistic .doc-holistic-period { margin: 2px 0 9px; color: #66526F; font: italic 10px/1.5 'Lora', Georgia, serif; }
    `
    : theme.stylePreset === 'minimalist'
      ? `
        .doc-style-minimalist .doc-content-flow, .doc-style-minimalist .doc-content-flow p, .doc-style-minimalist .doc-content-flow li { font-family: 'Inter', sans-serif !important; color: #3F444A !important; }
        .doc-style-minimalist .doc-content-flow h1, .doc-style-minimalist .doc-content-flow h2, .doc-style-minimalist .doc-content-flow h3, .doc-style-minimalist .doc-content-flow h4 { font-family: 'Poppins', sans-serif !important; color: #34383D !important; text-transform: none !important; letter-spacing: 0 !important; }
        .doc-style-minimalist.doc-ornament-line .doc-content-flow h1::after, .doc-style-minimalist.doc-ornament-line .doc-content-flow h2::after { content: ''; display: block; width: min(100%, 280px); height: 9px; margin: 7px 0 9px; background: url('${assetOrigin}/assets/ornament-line.svg') left center / 280px 9px no-repeat; opacity: .62; }
      `
      : theme.stylePreset === 'default'
        ? `
          .doc-style-default, .doc-style-default .doc-content-flow, .doc-style-default .doc-content-flow p, .doc-style-default .doc-content-flow li, .doc-style-default .doc-content-flow h1, .doc-style-default .doc-content-flow h2, .doc-style-default .doc-content-flow h3, .doc-style-default .doc-content-flow h4 { font-family: Arial, sans-serif !important; color: #111 !important; letter-spacing: normal !important; text-transform: none !important; }
          .doc-style-default::before, .doc-style-default .doc-content-flow h1::after, .doc-style-default .doc-content-flow h2::after, .doc-style-default .watermark { display: none !important; }
        `
        : ''

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
      padding: 22mm 12mm 14mm !important;
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
      display: grid !important;
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

    ${styleRules}

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
  <base href="${assetOrigin}/">
  <title>${subject} — Mapa Numerológico</title>
  <style>${styles}</style>
</head>
<body>
${content}
<script>
  // Fidelidade 100% com o preview (2026-07-19): a paginação inteira (que
  // bloco cai em qual página) já foi decidida no preview usando a fonte REAL
  // (Inter/Poppins) — se a janela de impressão imprimir ANTES da fonte
  // carregar aqui, o texto renderiza numa fonte de fallback com métricas
  // diferentes, pode quebrar linha diferente do preview e estourar o
  // overflow:hidden de uma .content-section que cabia perfeitamente antes.
  // O setTimeout(1200ms) fixo de antes não garantia isso — troca por
  // esperar document.fonts.ready de verdade, com um teto de segurança (2.5s)
  // pra nunca travar o diálogo de impressão se a fonte falhar ao carregar.
  window.onload = function() {
    var printed = false;
    function doPrint() {
      if (printed) return;
      printed = true;
      window.print();
      window.close();
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(doPrint).catch(doPrint);
      setTimeout(doPrint, 2500);
    } else {
      setTimeout(doPrint, 1200);
    }
  };
<\/script>
</body>
</html>`)

  printWindow.document.close()
}
