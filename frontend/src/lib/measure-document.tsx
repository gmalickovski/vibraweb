// measure-document.tsx — paginação com medição REAL de altura via DOM.
//
// Em vez de estimar a altura dos blocos por contagem de caracteres
// (estimateBlockHeight, que é imprecisa e causa espaços sobrando / textos
// cortados), este módulo renderiza cada bloco off-screen com o mesmo CSS
// do documento final, mede a altura real via getBoundingClientRect(), e
// distribui os blocos em páginas usando essas medidas reais.
//
// Algoritmo de paginação:
//   1. "Joga" todos os blocos sequencialmente na página
//   2. Quando um bloco ultrapassa o limite do rodapé:
//      a. Se sobram menos de ~3 linhas de espaço → bloco inteiro vai pra
//         próxima página (evita títulos ou frases órfãs no final)
//      b. Se sobra espaço suficiente → tenta dividir o bloco via splitBlock()
//         e preenche o máximo possível da página atual
//   3. Continua até todos os blocos estarem distribuídos
//
// Usado por PreviewPage.tsx via hook useMeasuredPages().

import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import React from 'react'
import {
  flattenDocumentBlocks,
  splitBlock,
  MAX_PAGE_HEIGHT_MM,
  PX_PER_MM,
  type DocumentBlock,
} from './document-builder'
import { DocumentBlockRenderer } from '../components/app/DocumentBlock'
import { docStyleClass } from '../components/shared/DocumentChrome'
import type { DocTheme } from './theme-resolver'

// Margem de segurança do orçamento de página. MAX_PAGE_HEIGHT_MM (261mm) é a
// área real da folha; descontamos uma folga contra variação de métrica de
// fonte/arredondamento sub-pixel entre a medição off-screen e o render final
// — especialmente relevante em blocos-lista LONGOS (Dia Pessoal/Meses/Dias
// Favoráveis/Arcanos, com muitas linhas), onde um desvio pequeno por linha
// pode se tornar visível no total.
//
// HISTÓRICO (2026-07-23, 3 rodadas):
// 1. Chegou a 8mm como band-aid pro bug de texto SUMINDO nesses blocos-lista
//    longos.
// 2. Reduzido pra 3mm sob a hipótese de que a causa raiz (dois CAMINHOS de
//    medição divergentes, já corrigida via `measureFullPx` — medição ISOLADA
//    e ÚNICA pra toda decisão) tornava os 8mm puro desperdício, e que os 8mm
//    eram a causa da "palavra órfã sozinha" (`duradouros.`, `vida.`).
// 3. **ERRADO** — confirmado ao vivo (Guilherme): reduzir pra 3mm reabriu o
//    bug de texto SUMINDO nesses mesmos blocos (ex.: "Dia Pessoal 11" cortado
//    no rodapé, resto do parágrafo nunca aparece em nenhuma página). A causa
//    raiz do bug de "palavra órfã" nunca foi o tamanho desta margem.
//    (CORREÇÃO 2026-07-25: nem era a falta de guarda em `cutBoundaryText`,
//    como esta nota afirmava — `cutBoundaryText` NÃO tem guarda de mínimo na
//    continuação, só no prefixo. A causa real era a divergência
//    "cabe?" (com marginBottom) × "corte" (sem marginBottom), corrigida no
//    check `tailFitPx` em splitIntoPagesReal.) **Restaurado pra 8mm** — as duas
//    correções (esta margem E a guarda em `cutBoundaryText`) são
//    INDEPENDENTES e as DUAS precisam existir: a margem evita texto sumindo
//    em blocos-lista longos; a guarda evita órfã de 1 palavra. Reduzir só a
//    margem (sem a guarda) resolve órfã mas reabre sumiço; a guarda sozinha
//    (sem a margem) não é suficiente pra blocos MUITO longos. Se o detector
//    de overflow em DocumentPreviewStack voltar a acusar corte, investigar a
//    causa antes de mexer neste número de novo — já foi ajustado 3x nesta
//    mesma sessão por suposições que não se confirmaram ao vivo.
const PAGE_SAFETY_MM = 8

// Altura útil da página em pixels (área real − margem de segurança, a 96dpi)
const PAGE_HEIGHT_PX = (MAX_PAGE_HEIGHT_MM - PAGE_SAFETY_MM) * PX_PER_MM

// Espaço mínimo restante para manter conteúdo na página (~3 linhas de texto
// a 11px * 1.8 line-height ≈ 20px/linha → 60px). Abaixo disso, o bloco
// inteiro vai pra próxima página pra evitar título/frase órfã no final.
const MIN_REMAIN_PX = 3 * 20


/**
 * Cria um container off-screen que REPLICA EXATAMENTE o contexto de layout da
 * `.content-section` real (mesma largura de folha + padding ⇒ mesma área de
 * conteúdo de 186mm, mesma font-family/font-size herdada), e devolve o div
 * interno onde os blocos são montados — o equivalente ao wrapper
 * `height:100%` de DocumentPreviewStack. Sem essa réplica, o container ficava
 * pendurado direto no `document.body` e herdava fonte/contexto diferentes da
 * folha, o que podia fazer o texto quebrar em menos linhas na medição do que no
 * render final → altura subestimada → conteúdo cortado pelo overflow:hidden.
 */
function createMeasureContainer(): HTMLDivElement {
  const sheet = document.createElement('div')
  sheet.setAttribute('data-measure-sheet', '')
  sheet.style.cssText = [
    'position: absolute',
    'left: -9999px',
    'top: 0',
    'width: 210mm',              // = .content-section
    'padding: 22mm 12mm 14mm',   // = .content-section (⇒ área de conteúdo 186mm)
    'box-sizing: border-box',
    "font-family: 'Inter', sans-serif", // = .content-section
    'font-size: 11px',
    'line-height: 1.8',
    'visibility: hidden',
    'pointer-events: none',
    'z-index: -1',
  ].join(';')
  const inner = document.createElement('div') // = wrapper height:100% dos blocos
  inner.style.width = '100%'
  sheet.appendChild(inner)
  document.body.appendChild(sheet)
  return inner
}

/** Remove o container de medição (o div de folha externo, pai do `inner`). */
function destroyMeasureContainer(inner: HTMLDivElement) {
  inner.parentElement?.remove()
}

/**
 * Mede a altura de um único bloco (usado para medir partes após split).
 */
function measureSingleBlock(
  block: DocumentBlock,
  theme: DocTheme,
  container: HTMLDivElement,
  excludeTrailingMargin = false,
): number {
  const mountEl = document.createElement('div')
  mountEl.style.overflow = 'hidden'
  container.appendChild(mountEl)
  const root = createRoot(mountEl)

  flushSync(() => {
    root.render(
      React.createElement(
        'div',
        { className: docStyleClass(theme) },
        React.createElement(
          'div',
          { className: 'doc-content-flow' },
          React.createElement(DocumentBlockRenderer, { block, theme }),
        ),
      ),
    )
  })

  // Mede 2x, forçando um reflow no meio, e usa a MAIOR leitura — protege
  // contra uma leitura transitoriamente MENOR na 1ª passada (ex.: a variante
  // BOLD de uma fonte — como o prefixo "Desafio:" que TODO card de arcano
  // usa — ainda não totalmente aplicada no primeiro layout, mesmo depois de
  // `document.fonts.ready`; a Promise resolve quando as fontes JÁ
  // requisitadas terminam de carregar, não garante que um NOVO peso/estilo
  // usado pela primeira vez neste candidato específico já esteja pronto).
  // Confirmado ao vivo (Guilherme): cards de arcano com o corpo inteiro
  // cortado — só o título aparecia — mesmo com margem de segurança alta;
  // como cada card sempre tem um trecho em negrito, é o padrão mais exposto
  // a essa classe de discrepância.
  let height = mountEl.getBoundingClientRect().height
  void mountEl.offsetHeight // força reflow antes da 2ª leitura
  const height2 = mountEl.getBoundingClientRect().height
  if (height2 > height) height = height2

  // Para decidir se um PEDAÇO cabe no fim de uma página, a margem inferior do
  // bloco é espaço morto (fica embaixo da última linha, encostando no rodapé) —
  // contá-la fazia o corte parar ~2 linhas cedo demais, desperdiçando o pé da
  // página. Descontamos essa marginBottom só na medição de ajuste; na medição
  // normal (espaço ENTRE blocos) ela conta de verdade e é mantida.
  if (excludeTrailingMargin) {
    const child = mountEl.firstElementChild as HTMLElement | null
    if (child) height -= parseFloat(getComputedStyle(child).marginBottom) || 0
  }

  root.unmount()
  container.removeChild(mountEl)
  return height
}

/**
 * Distribui blocos em páginas usando alturas reais medidas no DOM.
 *
 * Algoritmo principal:
 * - Percorre os blocos achatados (flatBlocks) sequencialmente
 * - Acumula altura na página atual
 * - Quando um bloco não cabe:
 *   • Se sobra < 3 linhas → pula pra próxima página
 *   • Se sobra >= 3 linhas → tenta splitBlock() para preencher o máximo
 * - page-break forçados (blocos-pai com pageBreakBefore) iniciam nova página
 */
export function splitIntoPagesReal(
  blocks: DocumentBlock[],
  theme: DocTheme,
): DocumentBlock[][] {
  const flatBlocks = flattenDocumentBlocks(blocks)

  // Container reutilizável (réplica da folha) pra TODAS as medições.
  const measureContainer = createMeasureContainer()

  // Altura CHEIA de um bloco (inclui a marginBottom = espaço entre blocos),
  // memoizada por id. Medida com o MESMO método isolado usado no corte
  // (measureSingleBlock) — antes a decisão "cabe inteiro?" vinha de uma medição
  // em LOTE (measureBlockHeights), um caminho diferente; qualquer divergência
  // fazia um bloco "caber" por engano e estourar o overflow:hidden, cortando o
  // texto. Agora a decisão de caber e a de cortar usam exatamente a mesma conta.
  const fullPxCache = new Map<string, number>()
  const measureFullPx = (b: DocumentBlock): number => {
    const cached = fullPxCache.get(b.id)
    if (cached !== undefined) return cached
    const h = measureSingleBlock(b, theme, measureContainer, false)
    fullPxCache.set(b.id, h)
    return h
  }

  // Altura de AJUSTE (sem a marginBottom final — espaço morto no pé da página),
  // usada pra achar o ponto de corte por linha dentro de splitBlock.
  const measureMM = (b: DocumentBlock): number =>
    measureSingleBlock(b, theme, measureContainer, /* excludeTrailingMargin */ true) / PX_PER_MM

  // Altura em PX pela MESMA medida que o corte usa (sem a marginBottom final).
  // Toda decisão de "isto cabe no que resta da página?" tem de usar ESTA conta
  // quando o bloco for o ÚLTIMO da página — senão a margem (espaço morto no pé,
  // que o corte desconta) faz o paginador cortar por ~28px que não existem.
  // Sem cache: `splitBlock` reaproveita o id `${id}-part2` com CONTEÚDO
  // diferente a cada volta do re-split, então cachear por id daria altura errada.
  const tailPxOf = (b: DocumentBlock): number =>
    measureSingleBlock(b, theme, measureContainer, /* excludeTrailingMargin */ true)

  const pages: DocumentBlock[][] = []
  let currentPage: DocumentBlock[] = []
  let currentHeightPx = 0

  function pushPage() {
    if (currentPage.length > 0) {
      pages.push(currentPage)
      currentPage = []
      currentHeightPx = 0
    }
  }

  for (const block of flatBlocks) {
    // page-break forçado → nova página
    if (block.type === 'page-break') {
      pushPage()
      continue
    }

    const bhPx = measureFullPx(block)

    // Bloco cabe na página atual → adiciona
    if (currentHeightPx + bhPx <= PAGE_HEIGHT_PX) {
      currentPage.push(block)
      currentHeightPx += bhPx
      continue
    }

    // Bloco NÃO cabe — calcula espaço disponível
    const availablePx = PAGE_HEIGHT_PX - currentHeightPx
    const availableMM = availablePx / PX_PER_MM

    // BUG CORRIGIDO (2026-07-25) — "palavra órfã sozinha no topo da página
    // seguinte" (`duradouras.`, `significativos.`), mesmo sobrando espaço na
    // ÚLTIMA LINHA da página de cima.
    //
    // Causa raiz: as duas decisões usavam medidas DIFERENTES do mesmo bloco.
    //   • "cabe?" (acima)  → measureFullPx, que INCLUI a marginBottom
    //     (DOC_GAP = 28px) — espaço morto que ficaria embaixo da última linha,
    //     encostando no rodapé.
    //   • o corte (splitBlock/measureMM) → altura SEM essa marginBottom.
    // Existe então uma janela de 28px (> 1 linha de 19.8px) em que o bloco
    // "não cabe" pela 1ª conta mas o texto INTEIRO cabe pela 2ª. Nessa janela
    // a busca binária de `cutBoundaryText` acha que todas as palavras cabem —
    // mas seu teto é `hi = offs.length - 1`, ou seja, ela NUNCA pode devolver
    // o texto inteiro. O melhor corte possível vira "tudo menos a última
    // palavra", e essa última palavra é despejada sozinha na próxima página.
    //
    // Correção: antes de tentar cortar, testar o bloco INTEIRO com a MESMA
    // medida que o corte usa (sem a marginBottom final). Se ele cabe, não há
    // nada a cortar — mantém o bloco inteiro aqui e fecha a página. É uma
    // comparação direta sobre o bloco todo (não sobre part1), então não há
    // risco de overflow, e a paginação dos demais casos fica intocada. De
    // quebra é mais rápido: pula o splitBlock inteiro quando acerta.
    const tailFitPx = tailPxOf(block)
    if (tailFitPx <= availablePx) {
      currentPage.push(block)
      pushPage()
      continue
    }

    // Espaço restante < 3 linhas → não vale a pena cortar aqui,
    // move o bloco inteiro pra próxima página
    if (availablePx < MIN_REMAIN_PX) {
      pushPage()
      currentPage.push(block)
      currentHeightPx = bhPx
      continue
    }

    // Tenta dividir o bloco para preencher o espaço restante (corte por linha
    // real via measureMM — não a heurística de contagem de caracteres)
    //
    // TENTATIVA (2026-07-25) E REVERTIDA: dar um "troco" da margem de
    // segurança (splitBlock com o teto FÍSICO real, sem PAGE_SAFETY_MM) só
    // pro ponto de corte principal, verificando com medição real antes de
    // aceitar. Objetivo: recuperar os ~40px que sobram no pé da página
    // quando só falta 1 palavra ("significativos."/"duradouras."). Testado
    // AO VIVO: causou o preview a travar em "Montando preview..." por 60s+
    // (nova chamada de splitBlock em blocos-lista longos dobra o custo de
    // medição React off-screen por ponto de corte). Revertido antes de
    // investigar mais a fundo — não mexer aqui de novo sem confirmar ao
    // vivo que não reabre essa lentidão.
    const split = splitBlock(block, availableMM, measureMM)

    if (split) {
      const [part1, part2] = split

      // BUG CORRIGIDO (2026-07-23): antes, um `pushPage()` INCONDICIONAL
      // fechava a página logo depois de part1 — mesmo quando part1 usava só
      // uma FRAÇÃO do espaço disponível (ex.: number-entry Nível 3 corta a
      // definição e devolve um part1 pequeno, "defHeadOnly"; ou o corte por
      // palavra de um item de lista deixa só 1 palavra de resto em part2).
      // Isso desperdiçava TODO o resto da página de part1 — sempre forçando
      // part2 (às vezes uma única palavra órfã) pra uma folha nova inteira,
      // mesmo sobrando bastante espaço logo abaixo de part1. Relatado ao vivo
      // (Guilherme, prints): "Expressão" cortava a definição faltando 1
      // palavra e a folha ficava quase toda em branco; "significativos."
      // sozinha abria página nova antes de "Dia Pessoal". Corrigido: mede a
      // altura REAL de part1 (pode ser menor que o orçamento usado no corte)
      // e só fecha a página se part2 realmente não couber no que sobrou —
      // exatamente a mesma lógica usada pra qualquer bloco "normal" que seja
      // o PRÓXIMO da fila, agora também aplicada ao part2 de um split.
      currentPage.push(part1)
      const part1Height = measureSingleBlock(part1, theme, measureContainer)
      currentHeightPx += part1Height

      const part2Height = measureSingleBlock(part2, theme, measureContainer)
      if (currentHeightPx + part2Height <= PAGE_HEIGHT_PX) {
        currentPage.push(part2)
        currentHeightPx += part2Height
        continue
      }

      // REVERTIDO (2026-07-25) — aqui NÃO se aplica o mesmo "troco" da
      // marginBottom que o caminho principal usa (check `tailFitPx`). Tentado
      // e confirmado ao vivo como REGRESSÃO: reclamar os 28px neste ramo (e no
      // loop de re-split abaixo) faz um pedaço de LISTA LONGA ocupar a página
      // inteira em vez de ser fatiado, e listas longas são exatamente as que a
      // medição SUBESTIMA (é a razão de `PAGE_SAFETY_MM` ser 8mm — ver
      // histórico no topo). Resultado: o guia do Dia Pessoal voltou a ser
      // CORTADO no rodapé, perdendo itens (print do Guilherme). Texto sumindo é
      // muito pior que uma palavra órfã — este ramo fica conservador.
      pushPage()

      // Se part2 ainda é maior que uma página inteira, precisa dividir de novo
      if (part2Height > PAGE_HEIGHT_PX) {
        // Tenta dividir recursivamente (max 20 iterações pra segurança — cobre
        // listas bem longas, ex.: Arcanos/Dias Favoráveis de alguém mais velho,
        // sem deixar o PIOR CASO (bloco muito longo que nunca converge) travar
        // a página por muitas rodadas de medição síncrona. Já foi 8 (baixo
        // demais pra sequências de arcanos mais longas — esgotava o teto e
        // despejava vários cards não posicionados) e chegou a 40 (alto demais:
        // combinado com o corte por palavra SEM guarda de órfã — ver
        // cutBoundaryText — o pior caso passou a levar 60-90s+ pra computar).
        // 20 é o meio-termo: cobre sequências de arcanos realistas (dezenas de
        // cards) sem multiplicar o pior caso.
        let remaining = part2
        let remainingH = part2Height
        let safety = 0
        while (remainingH > PAGE_HEIGHT_PX && safety < 20) {
          // BUG CORRIGIDO (2026-07-23): o orçamento usado aqui tinha um fator
          // `* 0.9` sem justificativa — reduzia o orçamento de uma folha NOVA
          // (que deveria ser o mesmo `MAX_PAGE_HEIGHT_MM - PAGE_SAFETY_MM`
          // usado em toda folha fresca) em ~25mm/~95px À TOA. Quando o próximo
          // item não cabia nesse orçamento artificialmente menor, `splitBlock`
          // devolvia null, o loop desistia (`break`), e o restante — que podia
          // ainda ter VÁRIOS itens não divididos — era jogado inteiro na
          // página sem caber, sumindo no `overflow:hidden` (Meses Pessoais,
          // Dias Favoráveis, Arcanos: relatado ao vivo, confirmado por
          // detector de overflow no console: +206 a +334px, batendo com ~2-3
          // itens presos juntos por essa margem perdida à toa).
          const reSplit = splitBlock(remaining, MAX_PAGE_HEIGHT_MM - PAGE_SAFETY_MM, measureMM)
          if (!reSplit) break
          const [rp1, rp2] = reSplit
          currentPage.push(rp1)
          pushPage()
          remaining = rp2
          remainingH = measureSingleBlock(remaining, theme, measureContainer)
          safety++
        }
        // Rede de segurança: se mesmo assim `remaining` ainda não coube (ex.:
        // um item atômico sozinho mais alto que 1 página inteira — cycles-entry,
        // conjugal-entry, arcano regente/vigente), pelo menos garante que ele
        // comece numa página PRÓPRIA (nunca acumulado com algo que já estoure)
        // — não elimina o overflow desse caso-limite, mas evita piorá-lo.
        if (remainingH > PAGE_HEIGHT_PX && currentPage.length > 0) pushPage()
        currentPage.push(remaining)
        currentHeightPx = remainingH
      } else {
        currentPage.push(part2)
        currentHeightPx = part2Height
      }
    } else {
      // Não conseguiu dividir → bloco inteiro vai pra próxima página
      pushPage()
      currentPage.push(block)
      currentHeightPx = bhPx
    }
  }

  pushPage()
  destroyMeasureContainer(measureContainer)

  return pages.filter(p => p.length > 0)
}

/**
 * Hook React que computa páginas com medição real.
 *
 * Retorna `null` enquanto mede (primeira renderização), depois retorna
 * as páginas medidas. O componente pai deve mostrar loading enquanto null.
 *
 * Re-mede automaticamente quando `blocks` ou `theme` mudam.
 */
export function useMeasuredPages(
  blocks: DocumentBlock[],
  theme: DocTheme | null,
): DocumentBlock[][] | null {
  const [pages, setPages] = useState<DocumentBlock[][] | null>(null)

  useEffect(() => {
    if (!blocks?.length || !theme) {
      setPages(null)
      return
    }

    let cancelled = false

    const run = () => {
      if (cancelled) return
      try {
        const measured = splitIntoPagesReal(blocks, theme)
        if (!cancelled) setPages(measured)
      } catch (e) {
        console.error('[measure-document] Erro na medição, usando heurística:', e)
        // Fallback: importa splitIntoPages diretamente pra evitar loop
        import('./document-builder').then(({ splitIntoPages }) => {
          if (!cancelled) setPages(splitIntoPages(blocks))
        })
      }
    }

    // CRÍTICO: medir só DEPOIS das fontes (Inter/Poppins) carregarem. Se a
    // medição rodar com a fonte de fallback do sistema, as métricas (largura de
    // caractere, altura de linha) diferem da fonte final → toda a paginação sai
    // calculada com alturas erradas e não bate com o render nem com o PDF (que
    // já espera document.fonts.ready em print-document.ts). requestAnimationFrame
    // ainda garante que o DOM/CSS estão prontos antes de medir.
    const fontsReady: Promise<unknown> | undefined = (document as Document & {
      fonts?: { ready: Promise<unknown> }
    }).fonts?.ready

    if (fontsReady) {
      fontsReady.then(() => requestAnimationFrame(run))
    } else {
      requestAnimationFrame(run)
    }

    return () => { cancelled = true }
  }, [blocks, theme])

  return pages
}
