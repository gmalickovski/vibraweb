// DocumentOrganizerView.tsx — casca visual única para "ver + organizar" o
// documento, reaproveitada em 3 lugares (Guilherme, 2026-07-11/12):
//   1. BlocosPage.tsx (/app/blocos) — padrão GLOBAL do consultor, usando o
//      cliente-modelo (sample_client) como dado de exemplo.
//   2. PreviewPage.tsx (passo "Visualizar e Organizar", dentro da criação) —
//      dados REAIS do cliente sendo criado/reaberto.
//   3. BrandPage.tsx (/app/marca) — preview do template sendo visualizado.
//
// Ajuste (2026-07-12, 6ª rodada): o cartão com cantos arredondados (chrome do
// antigo PdfViewer) foi REMOVIDO de novo — Guilherme pediu pra deixar só o
// fundo disponível com a folha solta nele, e a toolbar (título, contador de
// páginas, zoom, ações) flutuando por cima como uma barra, em vez de presa
// como cabeçalho de um card fechado. Isso dá mais espaço horizontal pra
// folha (resolve o corte de página) e deixa a tela mais limpa.
//
// Ajuste (2026-07-12, 7ª rodada): o header do painel de organização de blocos
// (título + descrição) agora usa o mesmo componente PageTitle da página de
// Templates — nome + ícone "i" que revela a descrição, em vez do parágrafo
// sempre visível.
//
// Ajuste (2026-07-12, 8ª rodada): o painel virou o mesmo layout de 3 linhas
// (header fixo / meio com scroll / rodapé fixo) usado no editor de Templates
// em BrandPage.tsx — agora padrão pra qualquer página com função de edição
// similar (Guilherme: "isso vai virar um padrão para todas as páginas com
// função de edição similares"). O botão "Salvar" mora no rodapé e só aparece
// (via animação de altura/opacidade) quando existe alguma mudança não salva
// (`isDirty`); `footerExtra` reserva espaço pra ações extras nesse mesmo
// rodapé (ex: "Restaurar padrão" em BlocosPage), que a própria página decide
// quando mostrar.

import { useState, useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { DocumentPreviewStack } from './DocumentPreviewStack'
import { BlockOrderPanel } from './BlockOrderPanel'
import { PageTitle, type Scope } from './PageTitle'
import { PrimaryBtn, SecondaryBtn } from './Button'
import { SECTION_ANCHOR_MAP, type DocumentBlock, type TocEntry } from '../../lib/document-builder'
import type { BlockOrderConfig } from '../../lib/block-order'
import type { DocTheme } from '../../lib/theme-resolver'
import { useIsMobile } from '../../lib/useIsMobile'
import { t } from '../../lib/tokens'

const zoomBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6,
  background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
  color: '#D1D5DB', cursor: 'pointer', fontSize: 15,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'Inter', sans-serif",
}

interface Props {
  theme: DocTheme
  blocks: DocumentBlock[]
  // Páginas já paginadas com altura REAL medida (PreviewPage.tsx,
  // measure-document.tsx) — quando ausente, DocumentPreviewStack cai pro
  // cálculo heurístico de estimateBlockHeight (previews de amostra em
  // Blocos/Templates, onde a medição real não vale o custo assíncrono).
  pages?: DocumentBlock[][]
  // Entradas do sumário computadas em PreviewPage após paginação.
  // Ausente nos previews de amostra (sem numeração de página real).
  tocEntries?: TocEntry[]
  subject: string
  dataNascimento: string
  showSubjectInHeader?: boolean
  isPro: boolean
  docTitle: string
  pageCount: number
  onBack?: () => void
  rightActions?: ReactNode
  savingIndicator?: ReactNode
  // Painel de organização de blocos — omitido (undefined) esconde o painel
  // inteiro (ex: plano Essencial no passo por cliente, que só vê o preview).
  config?: BlockOrderConfig
  onConfigChange?: (next: BlockOrderConfig) => void
  /** Abre o editor de Textos no campo nativo correspondente ao bloco. */
  onEditBlockText?: (blockId: string) => void
  panelTitle?: string
  panelInfo?: string
  /** Alcance da edição (global / modelo / análise) — mostra o ScopeBanner. */
  scope?: Scope
  // Rodapé fixo do painel (padrão 9ª rodada, 2026-07-12: Voltar/Cancelar +
  // Salvar dinâmico) — "Voltar" é o botão padrão (sem destaque) quando não há
  // mudança pendente; ao editar (`isDirty`), "Salvar" aparece ao lado
  // dividindo o espaço igualmente, e o botão da esquerda vira "Cancelar"
  // (descarta a edição via `onCancelEdit`, revertendo pro estado salvo — o
  // "Salvar" some de novo e volta a ficar só o "Voltar"). `footerExtra` é um
  // slot livre pra ações extras (ex: "Restaurar padrão"), sempre visível
  // quando passado, antes do par Voltar/Cancelar+Salvar.
  isDirty?: boolean
  onSave?: () => void | Promise<void>
  saving?: boolean
  footerExtra?: ReactNode
  onFooterBack?: () => void
  onCancelEdit?: () => void
}

export function DocumentOrganizerView({
  theme, blocks, pages, tocEntries, subject, dataNascimento, showSubjectInHeader, isPro, docTitle, pageCount,
  onBack, rightActions, savingIndicator,
  config, onConfigChange, onEditBlockText, panelTitle, panelInfo, scope,
  isDirty, onSave, saving, footerExtra, onFooterBack, onCancelEdit,
}: Props) {
  const isMobile = useIsMobile()
  const [zoom, setZoom] = useState(0.75)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)
  const [tocPageCount, setTocPageCount] = useState(tocEntries?.length ? 1 : 0)

  const zoomIn  = useCallback(() => setZoom(z => Math.min(z + 0.1, 2.0)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 0.1, 0.3)), [])
  const zoomFit = useCallback(() => setZoom(0.75), [])

  const showPanel = !!config && !!onConfigChange
  // Algumas telas (como Blocos dentro de um Modelo) usam o cabeçalho como
  // único ponto de salvamento. Elas podem manter no rodapé somente uma ação
  // contextual de redefinição, sem duplicar Salvar/Voltar/Cancelar.
  const showFooter = showPanel && (!!onSave || !!onFooterBack || !!footerExtra)
  const renderedPageCount = pageCount - (tocEntries?.length ? 1 : 0) + tocPageCount

  useEffect(() => {
    setTocPageCount(tocEntries?.length ? 1 : 0)
  }, [tocEntries])

  const standardTexts = useMemo(() => {
    const findBlock = (items: DocumentBlock[], id: string): DocumentBlock | undefined => {
      for (const item of items) {
        if (item.id === id) return item
        const nested = item.children ? findBlock(item.children, id) : undefined
        if (nested) return nested
      }
      return undefined
    }
    return Object.fromEntries(Object.entries(SECTION_ANCHOR_MAP).map(([externalId, internalId]) => {
      const data = findBlock(blocks, internalId)?.data ?? {}
      const text = [data.introTexto, data.definicaoTexto, data.textoOrientacao, data.texto]
        .find(value => typeof value === 'string' && value.trim())
      return [externalId, typeof text === 'string' ? text : 'Este bloco não possui um texto de introdução configurado.']
    })) as Record<string, string>
  }, [blocks])

  const panel = showPanel ? (
    <div style={{
      width: isMobile ? '100%' : 380, flexShrink: 0, // 380 = mesma largura da coluna de cards em Templates (BrandPage.tsx)
      borderRight: isMobile ? 'none' : `1px solid ${t.pb}`,
      borderBottom: isMobile ? `1px solid ${t.pb}` : 'none',
      display: 'flex', flexDirection: 'column',
      background: t.night,
      maxHeight: isMobile ? '40vh' : 'none',
      overflow: 'hidden',
    }}>
      {panelTitle && (
        <div style={{ padding: 20, borderBottom: `1px solid ${t.pb}`, flexShrink: 0 }}>
          <PageTitle title={panelTitle} info={panelInfo ?? ''} size={16} scope={scope} />
        </div>
      )}

      <div className="vw-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BlockOrderPanel config={config!} onChange={onConfigChange!} standardTexts={standardTexts} onEditSystemText={onEditBlockText} />
      </div>

      {showFooter && (
        <div style={{
          flexShrink: 0,
          borderTop: `1px solid ${t.pb}`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {footerExtra}

          {/* Botão padrão (sem destaque): "Voltar" quando não há mudança
              pendente; vira "Cancelar" (descarta via onCancelEdit) quando
              isDirty — nesse caso divide o espaço igualmente com "Salvar". */}
          {onFooterBack && (
            <SecondaryBtn
              onClick={isDirty ? onCancelEdit : onFooterBack}
              style={{ padding: '10px', fontSize: 12, flex: 1, justifyContent: 'center' }}
            >
              {isDirty ? 'Cancelar' : 'Voltar'}
            </SecondaryBtn>
          )}

          {onSave && isDirty && (
            <div style={{ flex: 1 }}>
              <PrimaryBtn onClick={onSave} disabled={saving} style={{ padding: '10px', fontSize: 12, width: '100%', justifyContent: 'center', whiteSpace: 'nowrap' }}>
                {saving ? 'Salvando...' : 'Salvar'}
              </PrimaryBtn>
            </div>
          )}
        </div>
      )}
    </div>
  ) : null

  // Conteúdo da barra flutuante: título, contador, zoom, ações. A barra em si
  // (fundo, borda, sombra) é aplicada por quem a posiciona (dentro do canvas).
  const toolbarContent = (
    <>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'transparent', border: `1px solid ${t.pb}`,
            color: t.fg3, padding: '5px 12px', borderRadius: 7,
            cursor: 'pointer', fontFamily: t.body, fontSize: 12,
            display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0,
          }}
        >
          Voltar
        </button>
      )}

      <span style={{
        fontFamily: t.body, fontSize: 13, color: t.fg2, flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {docTitle}
      </span>

      {savingIndicator}

      <span style={{ fontSize: 11, color: t.fg4, fontFamily: t.mono, flexShrink: 0 }}>
        {renderedPageCount} {renderedPageCount === 1 ? 'página' : 'páginas'}
      </span>

      {/* Zoom controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <button onClick={zoomOut} title="Diminuir" style={zoomBtnStyle}>−</button>
        <span style={{ fontFamily: t.body, fontSize: 12, color: t.fg3, minWidth: 40, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={zoomIn}  title="Aumentar" style={zoomBtnStyle}>+</button>
        <button onClick={zoomFit} title="Ajustar" style={{ ...zoomBtnStyle, fontSize: 10 }}>Fit</button>
      </div>

      {isMobile && showPanel && !mobilePreviewOpen && (
        <button
          onClick={() => setMobilePreviewOpen(true)}
          style={{
            background: t.gold, border: 'none', borderRadius: 7, color: t.night,
            fontFamily: t.body, fontWeight: 700, fontSize: 12, padding: '6px 14px', cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Ver Preview
        </button>
      )}

      {isMobile && showPanel && mobilePreviewOpen && (
        <button
          onClick={() => setMobilePreviewOpen(false)}
          title="Fechar preview"
          style={{
            background: 'transparent', border: `1px solid ${t.pb}`, borderRadius: 7,
            color: t.fg2, padding: '6px 10px', fontFamily: t.body, fontSize: 13, cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}

      {rightActions}
    </>
  )

  // Canvas: fundo disponível com a folha solta + barra flutuando por cima
  // (sem cartão/borda envolvendo tudo — pedido explícito de Guilherme,
  // 2026-07-12, pra dar mais espaço horizontal e deixar a tela mais limpa).
  const canvas = (
    <div style={{ flex: 1, position: 'relative', minHeight: 0, background: '#0e0810' }}>
      <div style={{
        position: 'absolute', top: 16, left: 16, right: 16, zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 16px', borderRadius: 12,
        background: 'rgba(22,15,26,0.88)', backdropFilter: 'blur(8px)',
        border: `1px solid ${t.pb}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}>
        {toolbarContent}
      </div>

      <div className="preview-scroll vw-scroll-area" style={{
        position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'auto',
        padding: '88px 24px 64px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <DocumentPreviewStack
          theme={theme}
          blocks={blocks}
          pages={pages}
          tocEntries={tocEntries}
          onTocPageCountChange={setTocPageCount}
          subject={subject}
          dataNascimento={dataNascimento}
          showSubjectInHeader={showSubjectInHeader}
          isPro={isPro}
          zoom={zoom}
        />
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: 0, overflow: 'hidden' }}>
      {panel}

      {/* ── Canvas — escondido no mobile quando o painel está disputando a tela ─── */}
      {(!isMobile || !showPanel) && (
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {canvas}
        </div>
      )}

      {/* Preview — mobile, tela cheia (só quando existe painel disputando espaço) */}
      {isMobile && showPanel && mobilePreviewOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          {canvas}
        </div>
      )}
    </div>
  )
}
