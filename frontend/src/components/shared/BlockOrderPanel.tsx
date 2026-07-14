// BlockOrderPanel.tsx — painel de reordenação/visibilidade dos blocos do
// relatório (arrastar + ocultar). Extraído de BlocosPage.tsx em 2026-07-11
// (Fase 2) para ser reaproveitado em 2 lugares:
//   1. /app/blocos (BlocosPage.tsx) — padrão GLOBAL do consultor.
//   2. Passo de organização por cliente, dentro do fluxo de criação — opera
//      sobre um BlockOrderConfig LOCAL daquele cliente, não persiste sozinho.
// Quem decide onde persistir é o chamador, via onChange.

import { useState, type DragEvent } from 'react'
import { BLOCK_DEFS, DEFAULT_BLOCK_ORDER, type BlockOrderConfig } from '../../lib/block-order'
import { EyeIcon, EyeOffIcon } from './icons'
import { t } from '../../lib/tokens'

interface Props {
  config: BlockOrderConfig
  onChange: (next: BlockOrderConfig) => void
}

export function BlockOrderPanel({ config, onChange }: Props) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragChild, setDragChild] = useState<{ parentId: string; id: string } | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const defsById = new Map(BLOCK_DEFS.map(d => [d.id, d]))
  const orderedTop = config.order.filter(id => defsById.has(id))
  BLOCK_DEFS.forEach(d => { if (!orderedTop.includes(d.id)) orderedTop.push(d.id) })
  const reorderableIds = orderedTop.filter(id => !defsById.get(id)?.lockedVisible)

  function toggleCollapse(id: string) {
    setCollapsedGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function moveTop(id: string, targetId: string) {
    if (id === targetId) return
    const order = [...config.order]
    const from = order.indexOf(id)
    const to = order.indexOf(targetId)
    if (from === -1 || to === -1) return
    order.splice(from, 1)
    order.splice(to, 0, id)
    onChange({ ...config, order })
  }

  function toggleHiddenTop(id: string) {
    const hidden = config.hidden.includes(id) ? config.hidden.filter(h => h !== id) : [...config.hidden, id]
    onChange({ ...config, hidden })
  }

  function moveChild(parentId: string, id: string, targetId: string) {
    if (id === targetId) return
    const childrenConfig = config.children || {}
    const groupConfig = childrenConfig[parentId] || { order: [], hidden: [] }
    const order = [...groupConfig.order]
    const from = order.indexOf(id)
    const to = order.indexOf(targetId)
    if (from === -1 || to === -1) return
    order.splice(from, 1)
    order.splice(to, 0, id)

    onChange({
      ...config,
      children: {
        ...childrenConfig,
        [parentId]: {
          ...groupConfig,
          order,
        }
      }
    })
  }

  function toggleHiddenChild(parentId: string, id: string) {
    const childrenConfig = config.children || {}
    const groupConfig = childrenConfig[parentId] || { order: [], hidden: [] }
    const hidden = groupConfig.hidden.includes(id)
      ? groupConfig.hidden.filter(h => h !== id)
      : [...groupConfig.hidden, id]

    onChange({
      ...config,
      children: {
        ...childrenConfig,
        [parentId]: {
          ...groupConfig,
          hidden,
        }
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Capa — linha fixa, não reordenável nem ocultável */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: 'rgba(255,255,255,0.015)', border: `1px dashed ${t.pb}`, borderRadius: 10,
      }}>
        <span style={{ color: t.fg4, fontSize: 16, width: 16, textAlign: 'center' }}>📌</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: t.fg2, fontFamily: t.body }}>Capa</div>
          <div style={{ fontSize: 11, color: t.fg4 }}>Sempre a 1ª página — fixa</div>
        </div>
      </div>

      {reorderableIds.map(id => {
        const def = defsById.get(id)!
        const hidden = config.hidden.includes(id)
        const hasChildren = def.children && def.children.length > 0

        // Recupera sub-blocos ordenados
        const groupChildren = config.children?.[def.id] || { order: [], hidden: [] }
        const childDefs = def.children || []
        const orderedChildIds = groupChildren.order.filter(cid => childDefs.some(c => c.id === cid))
        childDefs.forEach(c => { if (!orderedChildIds.includes(c.id)) orderedChildIds.push(c.id) })

        return (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <BlockRow
              label={def.label}
              description={def.description}
              hidden={hidden}
              onDragStart={() => setDragId(id)}
              onDragOver={(e: DragEvent) => e.preventDefault()}
              onDrop={() => { if (dragId) moveTop(dragId, id) }}
              onToggleHidden={() => toggleHiddenTop(id)}
              isGroup={hasChildren}
              isCollapsed={!!collapsedGroups[id]}
              onToggleCollapse={() => toggleCollapse(id)}
            />
            {hasChildren && !collapsedGroups[id] && (
              <div style={{
                marginLeft: 28, display: 'flex', flexDirection: 'column', gap: 6,
                borderLeft: `2px solid ${t.pb}`, paddingLeft: 12,
                opacity: hidden ? 0.45 : 1,
                pointerEvents: hidden ? 'none' : 'auto',
              }}>
                {orderedChildIds.map(cid => {
                  const cdef = childDefs.find(c => c.id === cid)
                  if (!cdef) return null
                  const chidden = groupChildren.hidden.includes(cid)
                  return (
                    <BlockRow
                      key={cid}
                      small
                      label={cdef.label}
                      description={cdef.description}
                      hidden={chidden}
                      onDragStart={() => setDragChild({ parentId: def.id, id: cid })}
                      onDragOver={(e: DragEvent) => e.preventDefault()}
                      onDrop={() => {
                        if (dragChild && dragChild.parentId === def.id) {
                          moveChild(def.id, dragChild.id, cid)
                        }
                      }}
                      onToggleHidden={() => toggleHiddenChild(def.id, cid)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function BlockRow({
  label,
  description,
  hidden,
  small,
  onDragStart,
  onDragOver,
  onDrop,
  onToggleHidden,
  isGroup,
  isCollapsed,
  onToggleCollapse
}: {
  label: string
  description: string
  hidden: boolean
  small?: boolean
  onDragStart: () => void
  onDragOver: (e: DragEvent) => void
  onDrop: () => void
  onToggleHidden: () => void
  isGroup?: boolean
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: small ? '10px 12px' : '14px 16px',
        background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.pb}`, borderRadius: 10,
        opacity: hidden ? 0.5 : 1, cursor: 'grab',
      }}
    >
      <span style={{ color: t.fg4, fontSize: 16, lineHeight: 1, flexShrink: 0, width: 16, textAlign: 'center' }}>⠿</span>
      {isGroup && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleCollapse?.()
          }}
          title={isCollapsed ? 'Expandir seção' : 'Colapsar seção'}
          style={{
            background: 'transparent', border: 'none', color: t.fg3,
            cursor: 'pointer', flexShrink: 0, padding: 4, display: 'flex', alignItems: 'center',
            fontSize: 9, transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
            transition: 'transform 0.15s ease-out'
          }}
        >
          ▶
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: small ? 13 : 14, fontWeight: 600, color: t.fg, fontFamily: t.body }}>{label}</div>
        <div style={{
          fontSize: 11, color: t.fg3, marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {description}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleHidden()
        }}
        title={hidden ? 'Exibir bloco' : 'Ocultar bloco'}
        style={{
          background: 'transparent', border: 'none', color: hidden ? t.fg4 : t.gold,
          cursor: 'pointer', flexShrink: 0, padding: 4, display: 'flex', alignItems: 'center',
        }}
      >
        {hidden ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
      </button>
    </div>
  )
}
