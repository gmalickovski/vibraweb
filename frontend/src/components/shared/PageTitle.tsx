// PageTitle.tsx — título de página + ícone "i" (hover/toque mostra explicação).
// Substitui o padrão antigo de subtítulo fixo (Item 4, Navegação global — Fase 1).
// Usado em Blocos do Relatório, Templates (Marca) e Personalizar Textos.
//
// `scope` (2026-07-27): o ALCANCE da edição daquela tela — global, do modelo ou
// só daquela análise. Nasceu como um selo fixo abaixo do título, mas poluía a
// interface; ficou melhor DENTRO deste popup, em destaque acima do texto
// explicativo. O ícone "i" é dourado (cor de destaque do produto) justamente
// para convidar ao clique, já que agora ele carrega a informação de alcance.

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { InfoIcon } from './icons'
import { t } from '../../lib/tokens'

/**
 * Alcance da alteração. `admin` é a nascente publicada para todos os
 * workspaces; `global` continua sendo o padrão do workspace do consultor.
 */
export type Scope = 'admin' | 'global' | 'modelo' | 'analise'

const SCOPE_COPY: Record<Scope, { rotulo: string; texto: string }> = {
  admin: {
    rotulo: 'Base oficial do sistema',
    texto: 'Esta é a nascente oficial do Vibraweb e a base de todos os workspaces. Cada consultor, modelo ou análise pode criar uma personalização por cima, sem alterar este padrão.',
  },
  global: {
    rotulo: 'Personalização do workspace',
    texto: 'O que você salvar aqui cria uma versão própria para este workspace. O padrão global oficial do Vibraweb permanece preservado; um modelo ou uma análise específica pode sobrescrever pontualmente.',
  },
  modelo: {
    rotulo: 'Neste modelo',
    texto: 'Vale apenas para as análises que usarem este modelo. Sobrescreve o padrão global; o que não for alterado aqui continua herdado dele.',
  },
  analise: {
    rotulo: 'Somente nesta análise',
    texto: 'Vale apenas para este cliente. Sobrescreve o modelo e o padrão global, sem alterar nenhum dos dois.',
  },
}

interface PageTitleProps {
  title: string
  info: string
  size?: number
  scope?: Scope
}

export function PageTitle({ title, info, size = 20, scope }: PageTitleProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const sc = scope ? SCOPE_COPY[scope] : null

  const updateCoords = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const width = Math.min(300, window.innerWidth - 32)
      let left = rect.left
      if (left + width > window.innerWidth - 16) {
        left = Math.max(16, window.innerWidth - width - 16)
      }
      setCoords({
        top: rect.bottom + 6,
        left,
      })
    }
  }

  const handleMouseEnter = () => {
    updateCoords()
    setOpen(true)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateCoords()
    setOpen(o => !o)
  }

  useEffect(() => {
    if (open) {
      const handleScrollOrResize = () => updateCoords()
      window.addEventListener('scroll', handleScrollOrResize, true)
      window.addEventListener('resize', handleScrollOrResize)
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true)
        window.removeEventListener('resize', handleScrollOrResize)
      }
    }
  }, [open])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
      <h1 style={{ fontSize: size, fontWeight: 700, margin: 0, fontFamily: t.display, color: t.fg }}>
        {title}
      </h1>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setOpen(false)}
        onClick={handleClick}
        aria-label={`Sobre ${title}`}
        style={{
          width: 20, height: 20, borderRadius: '50%',
          border: 'none', background: 'transparent',
          color: open ? t.fg2 : t.fg4,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, padding: 0,
          transition: 'color 0.15s ease',
        }}
      >
        <InfoIcon size={16} />
      </button>
      {open && createPortal(
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: 'min(300px, calc(100vw - 32px))',
            padding: '12px 14px',
            borderRadius: 8,
            background: '#1c1522',
            border: `1px solid ${t.pb}`,
            color: t.fg2,
            fontFamily: t.body,
            fontSize: 12,
            lineHeight: 1.5,
            zIndex: 99999,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        >
          {sc && (
            <>
              <div style={{
                fontSize: 9, fontWeight: 800, letterSpacing: '.1em',
                textTransform: 'uppercase', color: t.gold, marginBottom: 6,
              }}>
                {sc.rotulo}
              </div>
              <p style={{ margin: '0 0 10px', color: t.fg, fontSize: 12, lineHeight: 1.5 }}>
                {sc.texto}
              </p>
              <div style={{ height: 1, background: t.pb, margin: '0 0 10px' }} />
            </>
          )}
          {info}
        </div>,
        document.body
      )}
    </div>
  )
}
