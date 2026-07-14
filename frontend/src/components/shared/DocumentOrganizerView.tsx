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

import { useState, useCallback, type ReactNode } from 'react'
import { DocumentPreviewStack } from './DocumentPreviewStack'
import { BlockOrderPanel } from './BlockOrderPanel'
import { PageTitle } from './PageTitle'
import { PrimaryBtn, SecondaryBtn } from './Button'
import type { DocumentBlock } from '../../lib/document-builder'
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
  subject: string
  dataNascimento: string
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
  panelTitle?: string
  panelInfo?: string
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
  theme, blocks, subject, dataNascimento, isPro, docTitle, pageCount,
  onBack, rightActions, savingIndicator,
  config, onConfigChange, panelTitle, panelInfo,
  isDirty, onSave, saving, footerExtra, onFooterBack, onCancelEdit,
}: Props) {
  const isMobile = useIsMobile()
  const [zoom, setZoom] = useState(0.75)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const zoomIn  = useCallback(() => setZoom(z => Math.min(z + 0.1, 2.0)), [])
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 0.1, 0.3)), [])
  const zoomFit = useCallback(() => setZoom(0.75), [])

  const showPanel = !!config && !!onConfigChange
  const showFooter = showPanel && (!!onSave || !!onFooterBack)

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
          <PageTitle title={panelTitle} info={panelInfo ?? ''} size={16} />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BlockOrderPanel config={config!} onChange={onConfigChange!} />
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

          {onSave && (
            <div style={{
              flex: isDirty ? 1 : 0,
              maxWidth: isDirty ? '100%' : 0,
              opacity: isDirty ? 1 : 0,
              // overflowX só volta a "visible" quando já totalmente expandido —
              // sem isso o leve zoom do hover do botão ficava cortado nas laterais.
              overflowY: 'hidden', overflowX: isDirty ? 'visible' : 'hidden',
              transition: 'flex 0.25s ease, max-width 0.25s ease, opacity 0.2s ease',
            }}>
              {/* Mesma medida do botão "+ Criar Novo Template" (BrandPage.tsx) —
                  padrão único pra qualquer botão dinâmico de Salvar no app. */}
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
        {pageCount} {pageCount === 1 ? 'página' : 'páginas'}
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
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderRadius: 12,
        background: 'rgba(22,15,26,0.88)', backdropFilter: 'blur(8px)',
        border: `1px solid ${t.pb}`, boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}>
        {toolbarContent}
      </div>

      <div className="preview-scroll" style={{
        position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'auto',
        padding: '88px 24px 64px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <DocumentPreviewStack
          theme={theme}
          blocks={blocks}
          subject={subject}
          dataNascimento={dataNascimento}
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
