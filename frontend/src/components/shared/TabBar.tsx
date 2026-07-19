// TabBar.tsx — abas em pílula numa ÚNICA linha com rolagem horizontal.
// A barra de scroll nativa fica oculta; no desktop, setas sutis nas pontas
// aparecem/desaparecem (fade) conforme há conteúdo escondido daquele lado e
// rolam a lista ao clique. No mobile o toque/arrasto nativo já resolve —
// as setas nem são montadas.

import { useRef, useState, useCallback, useEffect } from 'react'
import { t } from '../../lib/tokens'
import { useIsMobile } from '../../lib/useIsMobile'

export interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  value: string
  onChange: (id: string) => void
}

// Oculta a scrollbar nativa (WebKit precisa de pseudo-elemento, que não
// existe em style inline) — injetado uma única vez no <head>.
const SCROLL_CSS_ID = 'vw-tabbar-scroll-css'
function ensureScrollCss() {
  if (document.getElementById(SCROLL_CSS_ID)) return
  const el = document.createElement('style')
  el.id = SCROLL_CSS_ID
  el.textContent = '.vw-tabbar-scroll{scrollbar-width:none;-ms-overflow-style:none}.vw-tabbar-scroll::-webkit-scrollbar{display:none}'
  document.head.appendChild(el)
}

export function TabBar({ tabs, value, onChange }: Props) {
  const isMobile = useIsMobile()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  useEffect(() => { ensureScrollCss() }, [])

  const updateArrows = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    // Tolerância de 2px evita "seta fantasma" por arredondamento de subpixel.
    setCanLeft(el.scrollLeft > 2)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  // Recalcula quando a largura disponível muda (resize da janela/painel) e
  // quando o conjunto de abas muda.
  useEffect(() => {
    updateArrows()
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateArrows, tabs])

  function scrollBy(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * 180, behavior: 'smooth' })
  }

  const arrowStyle = (side: 'left' | 'right', visible: boolean): React.CSSProperties => ({
    position: 'absolute',
    [side]: 0,
    top: 0,
    bottom: 0,
    width: 28,
    display: 'flex', alignItems: 'center', justifyContent: side === 'left' ? 'flex-start' : 'flex-end',
    border: 'none', padding: 0, cursor: 'pointer',
    color: t.fg3,
    // Degradê pra aba "sumir" suavemente por baixo da seta em vez de cortar seco.
    background: `linear-gradient(to ${side === 'left' ? 'right' : 'left'}, ${t.night} 45%, transparent)`,
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    transition: 'opacity 0.3s ease',
    zIndex: 2,
  })

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <div
        ref={scrollRef}
        className="vw-tabbar-scroll"
        onScroll={updateArrows}
        style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto' }}
      >
        {tabs.map(tab => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                fontFamily: t.display,
                fontWeight: 700,
                fontSize: 12,
                padding: '8px 16px',
                borderRadius: 9999,
                border: `1px solid ${active ? t.gold : t.pb}`,
                background: active ? 'rgba(253,184,19,.08)' : 'transparent',
                color: active ? t.gold : t.fg2,
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all .2s',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {!isMobile && (
        <>
          <button type="button" aria-label="Rolar abas para a esquerda" style={arrowStyle('left', canLeft)} onClick={() => scrollBy(-1)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5 4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" aria-label="Rolar abas para a direita" style={arrowStyle('right', canRight)} onClick={() => scrollBy(1)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5 8 6 4.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </>
      )}
    </div>
  )
}
