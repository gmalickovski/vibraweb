// LogoPositionModal.tsx — popup de posicionamento do logo da Capa (Modelos,
// 2026-07-28, Guilherme: "vamos adicionar uma janela popup ao clicar em
// adicionar imagem/logo... com preview do espaço da folha onde posso colocar
// a logo com a função de arrastar... com automatização e ajuda de linhas
// centrais vertical e horizontal e bordas pra me ajudar a centralizar tanto
// na horizontal quanto na vertical, dentro desse popup vai ter o botão pra
// adicionar o logo procurar no computador").
//
// Escopo desta versão: o drag-and-drop com guias de snap é só pra Logo-como-
// IMAGEM (posição livre em 2 eixos, `logoPosX`/`logoPosY`) — Logo-como-TEXTO
// já tem seus próprios controles (fonte/negrito/itálico/cor/âncora) direto
// no painel lateral da subdivisão "Logo" em BrandPage.tsx, sem precisar
// deste popup (texto reflows com a fonte, então 5 âncoras discretas fazem
// mais sentido do que arrastar livremente — mesmo raciocínio do `BoxAnchor`).
//
// Segue o padrão visual dos popups já existentes no app (ConfirmDialog,
// SaveSuccessModal, ExportModal): backdrop blur + card `night2`/`pb`.
//
// 2ª rodada (2026-07-29, Guilherme: "tem 2 botões para adicionar imagem,
// deixe só um botão escrito Adicionar imagem"): o painel lateral
// (BrandPage.tsx) não tem mais um `<input type="file">` PRÓPRIO ao lado do
// botão que abre este popup — só o botão "Adicionar imagem"; o upload de
// verdade acontece só aqui dentro, junto com as instruções de formato/
// resolução e a conversão automática (`resizeImageForLogo`, chamada por
// `uploadLogoFile` em BrandPage.tsx — redimensiona/converte pra PNG antes
// de subir, pra não perder resolução na impressão nem pesar no banco).

import { useEffect, useRef, useState } from 'react'
import { t } from '../../lib/tokens'
import { PrimaryBtn, SecondaryBtn } from '../shared/Button'

const SNAP_THRESHOLD = 4 // % de tolerância pro snap no centro/bordas

// Proporção do espaço do logo na capa — mesma proporção do container real
// (largura útil da página / 1/4 da altura útil), só pra o preview do popup
// ficar fiel ao espaço de verdade.
const CANVAS_ASPECT = 2.8

function snap(raw: number): { value: number; snapped: boolean } {
  if (raw <= SNAP_THRESHOLD) return { value: 0, snapped: true }
  if (raw >= 100 - SNAP_THRESHOLD) return { value: 100, snapped: true }
  if (Math.abs(raw - 50) <= SNAP_THRESHOLD) return { value: 50, snapped: true }
  return { value: Math.max(0, Math.min(100, raw)), snapped: false }
}

interface LogoPositionModalProps {
  logoUrl: string | null
  posX: number
  posY: number
  uploading: boolean
  onChangePosition: (x: number, y: number) => void
  onUpload: (file: File) => void
  onClose: () => void
}

export function LogoPositionModal({ logoUrl, posX, posY, uploading, onChangePosition, onUpload, onClose }: LogoPositionModalProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const [snapXActive, setSnapXActive] = useState(false)
  const [snapYActive, setSnapYActive] = useState(false)

  useEffect(() => {
    if (!dragging) return
    function handleMove(e: PointerEvent) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const rawX = ((e.clientX - rect.left) / rect.width) * 100
      const rawY = ((e.clientY - rect.top) / rect.height) * 100
      const sx = snap(rawX)
      const sy = snap(rawY)
      setSnapXActive(sx.snapped)
      setSnapYActive(sy.snapped)
      onChangePosition(sx.value, sy.value)
    }
    function handleUp() {
      setDragging(false)
      setSnapXActive(false)
      setSnapYActive(false)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        padding: 'max(16px, env(safe-area-inset-top)) max(16px, env(safe-area-inset-right)) max(16px, env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left))',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(480px, 100%)', maxWidth: '100%', background: t.night2, border: `1px solid ${t.pb}`,
          borderRadius: 20, padding: 28, boxShadow: '0 20px 80px rgba(0,0,0,.6)',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 18, color: t.fg, margin: 0 }}>
            Posicionar Logo
          </h2>
          <p style={{ fontFamily: t.body, fontSize: 13, color: t.fg3, margin: '4px 0 0', lineHeight: 1.5 }}>
            Arraste a imagem dentro do espaço do logo. Linhas-guia aparecem ao centralizar ou encostar nas bordas.
          </p>
        </div>

        {/* Instruções de formato/resolução (2026-07-29, Guilherme: "dentro do
            modal vai ter as instruções de formatos e tamanhos mínimos em
            pixel das imagens pra não ficar sem resolução na impressão") —
            a conversão automática (`resizeImageForLogo`, chamada por
            `uploadLogoFile` em BrandPage.tsx) já garante um tamanho/formato
            adequado sozinha, mas o usuário ainda precisa saber o mínimo
            recomendado NA ORIGEM (uma imagem pequena redimensionada pra
            cima não ganha nitidez que não tinha). */}
        <div style={{
          background: 'rgba(255,255,255,.04)', border: `1px solid ${t.pb}`, borderRadius: 8,
          padding: '10px 12px', fontFamily: t.body, fontSize: 12, color: t.fg3, lineHeight: 1.5,
        }}>
          Envie uma imagem em PNG ou JPG, com pelo menos <strong style={{ color: t.fg2 }}>600×600px</strong> —
          imagens menores podem sair borradas na impressão. A imagem é redimensionada e convertida
          automaticamente ao enviar, então não se preocupe em ajustar o tamanho antes.
        </div>

        <div>
          <input
            type="file" accept="image/*"
            onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f) }}
            style={{ fontSize: 12, width: '100%' }}
          />
          {uploading && <span style={{ fontSize: 11, color: t.fg3 }}>Enviando...</span>}
        </div>

        <div
          ref={canvasRef}
          style={{
            position: 'relative', width: '100%', aspectRatio: `${CANVAS_ASPECT}`,
            background: '#fff', border: `1px dashed ${t.pb}`, borderRadius: 8, overflow: 'hidden',
          }}
        >
          {logoUrl ? (
            <img
              src={logoUrl} alt="Logo"
              onPointerDown={e => { e.preventDefault(); setDragging(true) }}
              draggable={false}
              style={{
                position: 'absolute', left: `${posX}%`, top: `${posY}%`,
                transform: 'translate(-50%, -50%)',
                maxWidth: '60%', maxHeight: '60%', objectFit: 'contain',
                cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: t.body, fontSize: 12, color: '#999',
            }}>
              Nenhuma imagem enviada ainda
            </div>
          )}

          {/* Guias de centro (só aparecem enquanto arrasta e encaixa) */}
          {dragging && snapXActive && (
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: t.gold }} />
          )}
          {dragging && snapYActive && (
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: t.gold }} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
          <SecondaryBtn onClick={onClose} style={{ padding: '10px 16px', fontSize: 12 }}>Fechar</SecondaryBtn>
          <PrimaryBtn onClick={onClose} style={{ padding: '10px 16px', fontSize: 12 }}>Salvar</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}
