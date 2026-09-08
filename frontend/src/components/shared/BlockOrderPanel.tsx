// Árvore única para organizar blocos nativos e autorais em todos os escopos.
import { useState, type DragEvent } from 'react'
import {
  BLOCK_DEFS,
  getBlockTitle,
  isCustomBlockId,
  normalizeBlockOrder,
  type BlockDef,
  type BlockOrderConfig,
  type CustomBlock,
} from '../../lib/block-order'
import { CloseIcon, CollapseIcon, ExpandIcon, EyeIcon, EyeOffIcon, FileEditIcon } from './icons'
import { PrimaryBtn, SecondaryBtn } from './Button'
import { MarkdownEditor } from './MarkdownEditor'
import { t } from '../../lib/tokens'

interface Props {
  config: BlockOrderConfig
  onChange: (next: BlockOrderConfig) => void
  standardTexts?: Record<string, string>
  onEditSystemText?: (blockId: string) => void
}
interface DragItem { id: string; parentId?: string; custom: boolean }
interface EditorState { id?: string; title: string; text: string; fallback?: string; standardText?: string }

const rowButtonStyle: React.CSSProperties = {
  width: 30, height: 30, padding: 0, border: 'none', borderRadius: 6,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', color: t.fg3, cursor: 'pointer', flexShrink: 0,
}

function cloneConfig(config: BlockOrderConfig): BlockOrderConfig {
  return {
    ...config, order: [...config.order], hidden: [...config.hidden],
    children: Object.fromEntries(Object.entries(config.children ?? {}).map(([id, child]) => [id, { order: [...child.order], hidden: [...child.hidden] }])),
    titleOverrides: { ...(config.titleOverrides ?? {}) },
    customBlocks: (config.customBlocks ?? []).map(block => ({ ...block })),
  }
}

function newCustomBlockId() {
  return `custom-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`
}

export function BlockOrderPanel({ config, onChange, standardTexts = {}, onEditSystemText }: Props) {
  const [dragItem, setDragItem] = useState<DragItem | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const [editor, setEditor] = useState<EditorState | null>(null)
  const defsById = new Map(BLOCK_DEFS.map(def => [def.id, def]))
  const customBlocks = config.customBlocks ?? []
  const customById = new Map(customBlocks.map(block => [block.id, block]))
  const topIds = config.order.filter(id => defsById.has(id) || (!!customById.get(id) && !customById.get(id)?.parentId))

  function parentOf(id: string): string | undefined {
    const custom = customById.get(id)
    if (custom) return custom.parentId
    return BLOCK_DEFS.find(def => def.children?.some(child => child.id === id))?.id
  }

  function childrenOf(parentId: string) {
    const native = defsById.get(parentId)?.children ?? []
    const custom = customBlocks.filter(block => block.parentId === parentId)
    const byId = new Map<string, BlockDef | CustomBlock>()
    native.forEach(block => byId.set(block.id, block))
    custom.forEach(block => byId.set(block.id, block))
    const order = config.children?.[parentId]?.order ?? []
    return order.map(id => byId.get(id)).filter((block): block is BlockDef | CustomBlock => !!block)
  }

  function commit(next: BlockOrderConfig) { onChange(normalizeBlockOrder(next)) }

  function moveItem(id: string, targetParentId: string | undefined, beforeId?: string) {
    const currentParentId = parentOf(id)
    const isCustom = isCustomBlockId(id)
    // Só blocos criados pelo consultor podem mudar de pai e alternar H1/H2.
    if (!isCustom && currentParentId !== targetParentId) return
    const next = cloneConfig(config)
    if (currentParentId) {
      const currentChildren = next.children?.[currentParentId]
      if (currentChildren) {
        currentChildren.order = currentChildren.order.filter(item => item !== id)
        currentChildren.hidden = currentChildren.hidden.filter(item => item !== id)
      }
    } else {
      next.order = next.order.filter(item => item !== id)
      next.hidden = next.hidden.filter(item => item !== id)
    }
    if (targetParentId) {
      const target = next.children?.[targetParentId] ?? { order: [], hidden: [] }
      const at = beforeId ? target.order.indexOf(beforeId) : -1
      target.order.splice(at >= 0 ? at : target.order.length, 0, id)
      next.children = { ...(next.children ?? {}), [targetParentId]: target }
    } else {
      const at = beforeId ? next.order.indexOf(beforeId) : -1
      next.order.splice(at >= 0 ? at : next.order.length, 0, id)
    }
    if (isCustom) {
      next.customBlocks = (next.customBlocks ?? []).map(block => {
        if (block.id !== id) return block
        if (targetParentId) return { ...block, parentId: targetParentId }
        const { parentId: _parentId, ...rootBlock } = block
        return rootBlock
      })
    }
    commit(next)
  }

  function toggleHidden(id: string, parentId?: string) {
    const next = cloneConfig(config)
    if (parentId) {
      const child = next.children?.[parentId] ?? { order: [], hidden: [] }
      child.hidden = child.hidden.includes(id) ? child.hidden.filter(item => item !== id) : [...child.hidden, id]
      next.children = { ...(next.children ?? {}), [parentId]: child }
    } else next.hidden = next.hidden.includes(id) ? next.hidden.filter(item => item !== id) : [...next.hidden, id]
    commit(next)
  }

  function openEditor(id: string, fallback: string, custom?: CustomBlock) {
    setEditor({ id, title: custom?.title ?? getBlockTitle(config, id, fallback), text: custom?.text ?? '', fallback, standardText: standardTexts[id] })
  }

  function saveEditor() {
    if (!editor) return
    const title = editor.title.trim()
    if (!title) return
    if (!editor.id && !editor.text.trim()) return
    const next = cloneConfig(config)
    if (!editor.id) {
      const id = newCustomBlockId()
      next.customBlocks = [...(next.customBlocks ?? []), { id, title, text: editor.text.trim() }]
      next.order.push(id)
    } else if (isCustomBlockId(editor.id)) {
      next.customBlocks = (next.customBlocks ?? []).map(block => block.id === editor.id ? { ...block, title, text: editor.text.trim() } : block)
    } else next.titleOverrides = { ...(next.titleOverrides ?? {}), [editor.id]: title }
    commit(next)
    setEditor(null)
  }

  function deleteCustomBlock(id: string) {
    const next = cloneConfig(config)
    const idsToRemove = new Set<string>([id])
    let found = true
    while (found) {
      found = false
      ;(next.customBlocks ?? []).forEach(block => {
        if (block.parentId && idsToRemove.has(block.parentId) && !idsToRemove.has(block.id)) { idsToRemove.add(block.id); found = true }
      })
    }
    next.customBlocks = (next.customBlocks ?? []).filter(block => !idsToRemove.has(block.id))
    next.order = next.order.filter(item => !idsToRemove.has(item))
    next.hidden = next.hidden.filter(item => !idsToRemove.has(item))
    next.children = Object.fromEntries(Object.entries(next.children ?? {})
      .filter(([parentId]) => !idsToRemove.has(parentId))
      .map(([parentId, child]) => [parentId, { order: child.order.filter(item => !idsToRemove.has(item)), hidden: child.hidden.filter(item => !idsToRemove.has(item)) }]))
    commit(next)
  }

  function dragStart(event: DragEvent, item: DragItem) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', item.id)
    setDragItem(item)
  }
  function finishDrag() { setDragItem(null); setDropTarget(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button type="button" onClick={() => setEditor({ title: '', text: '' })} style={{ minHeight: 42, border: `1px dashed ${t.gold}88`, borderRadius: 8, background: 'rgba(253,184,19,.06)', color: t.gold, fontFamily: t.body, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Adicionar bloco</button>
      <div style={{ fontSize: 11, color: t.fg4, lineHeight: 1.45, padding: '0 2px 4px' }}>Arraste blocos autorais para reorganizar ou solte dentro de uma seção para transformá-los em sub-blocos.</div>
      {topIds.map(id => {
        const def = defsById.get(id)
        const custom = customById.get(id)
        const label = custom?.title ?? getBlockTitle(config, id, def?.label ?? 'Bloco')
        const description = custom?.text || def?.description || 'Bloco personalizado'
        const hidden = config.hidden.includes(id)
        const canReceiveChildren = id !== 'capa'
        const childItems = childrenOf(id)
        const isGroup = canReceiveChildren && (Boolean(def?.children?.length) || Boolean(custom) || childItems.length > 0)
        const collapsed = !!collapsedGroups[id]
        return (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <DropMarker visible={!!dragItem} active={dropTarget === `root:${id}`} onDragEnter={() => setDropTarget(`root:${id}`)} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragItem) moveItem(dragItem.id, undefined, id); finishDrag() }} />
            <BlockRow id={id} label={label} description={description} hidden={hidden} locked={id === 'capa'} custom={!!custom} isGroup={isGroup} isCollapsed={collapsed} dragging={dragItem?.id === id} onDragStart={event => dragStart(event, { id, custom: !!custom })} onDragEnd={finishDrag} onToggleCollapse={() => setCollapsedGroups(current => ({ ...current, [id]: !current[id] }))} onToggleHidden={() => toggleHidden(id)} onEdit={() => openEditor(id, def?.label ?? label, custom)} onDelete={custom ? () => deleteCustomBlock(id) : undefined} />
            {canReceiveChildren && dragItem?.custom && dragItem.id !== id && <DropInto active={dropTarget === `inside:${id}`} onDragEnter={() => setDropTarget(`inside:${id}`)} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragItem) moveItem(dragItem.id, id); finishDrag() }} />}
            {isGroup && !collapsed && <div style={{ marginLeft: 26, display: 'flex', flexDirection: 'column', gap: 6, borderLeft: `2px solid ${t.pb}`, paddingLeft: 12, opacity: hidden ? .45 : 1, pointerEvents: hidden ? 'none' : 'auto' }}>
              {childItems.map(child => {
                const childCustom = isCustomBlockId(child.id) ? customById.get(child.id) : undefined
                const childDef = child as BlockDef
                const childLabel = childCustom?.title ?? getBlockTitle(config, child.id, childDef.label)
                const childDescription = childCustom?.text || childDef.description || 'Bloco personalizado'
                const childHidden = config.children?.[id]?.hidden.includes(child.id) ?? false
                return <div key={child.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <DropMarker visible={!!dragItem} active={dropTarget === `child:${id}:${child.id}`} onDragEnter={() => setDropTarget(`child:${id}:${child.id}`)} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragItem) moveItem(dragItem.id, id, child.id); finishDrag() }} />
                  <BlockRow id={child.id} label={childLabel} description={childDescription} hidden={childHidden} small custom={!!childCustom} dragging={dragItem?.id === child.id} onDragStart={event => dragStart(event, { id: child.id, parentId: id, custom: !!childCustom })} onDragEnd={finishDrag} onToggleHidden={() => toggleHidden(child.id, id)} onEdit={() => openEditor(child.id, childDef.label ?? childLabel, childCustom)} onDelete={childCustom ? () => deleteCustomBlock(child.id) : undefined} />
                </div>
              })}
              <DropMarker visible={!!dragItem} active={dropTarget === `child:${id}:end`} onDragEnter={() => setDropTarget(`child:${id}:end`)} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragItem) moveItem(dragItem.id, id); finishDrag() }} />
            </div>}
          </div>
        )
      })}
      <DropMarker visible={!!dragItem} active={dropTarget === 'root:end'} onDragEnter={() => setDropTarget('root:end')} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragItem) moveItem(dragItem.id, undefined); finishDrag() }} />
      {editor && <BlockEditorModal editor={editor} isCustom={!!editor.id && isCustomBlockId(editor.id)} onChange={setEditor} onClose={() => setEditor(null)} onSave={saveEditor} onEditSystemText={editor.id && !isCustomBlockId(editor.id) ? onEditSystemText : undefined} />}
    </div>
  )
}

function DropMarker({ visible, active, onDragEnter, onDragOver, onDrop }: { visible: boolean; active: boolean; onDragEnter: () => void; onDragOver: (event: DragEvent) => void; onDrop: () => void }) {
  return <div onDragEnter={onDragEnter} onDragOver={onDragOver} onDrop={onDrop} style={{ display: 'grid', gridTemplateRows: visible ? (active ? '32px' : '12px') : '0px', transition: 'grid-template-rows .16s ease' }}><div style={{ overflow: 'hidden', display: 'flex', alignItems: 'center' }}><div style={{ width: '100%', borderTop: `2px solid ${active ? t.gold : 'transparent'}`, boxShadow: active ? `0 0 0 3px ${t.gold}18` : 'none', transition: 'border-color .16s ease, box-shadow .16s ease' }} /></div></div>
}

function DropInto({ active, onDragEnter, onDragOver, onDrop }: { active: boolean; onDragEnter: () => void; onDragOver: (event: DragEvent) => void; onDrop: () => void }) {
  return <div onDragEnter={onDragEnter} onDragOver={onDragOver} onDrop={onDrop} style={{ height: 32, border: `1px dashed ${active ? t.gold : t.pb}`, borderRadius: 7, color: active ? t.gold : t.fg4, background: active ? `${t.gold}10` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, transition: 'border-color .16s ease, color .16s ease, background .16s ease' }}>Soltar dentro desta seção</div>
}

function BlockRow({ label, description, hidden, locked, custom, small, isGroup, isCollapsed, dragging, onDragStart, onDragEnd, onToggleCollapse, onToggleHidden, onEdit, onDelete }: { id: string; label: string; description: string; hidden: boolean; locked?: boolean; custom?: boolean; small?: boolean; isGroup?: boolean; isCollapsed?: boolean; dragging?: boolean; onDragStart: (event: DragEvent) => void; onDragEnd: () => void; onToggleCollapse?: () => void; onToggleHidden: () => void; onEdit: () => void; onDelete?: () => void }) {
  return <div draggable={!locked} onDragStart={onDragStart} onDragEnd={onDragEnd} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: small ? '10px 11px' : '13px 14px', background: custom ? 'rgba(253,184,19,.045)' : 'rgba(255,255,255,.03)', border: `1px solid ${custom ? 'rgba(253,184,19,.32)' : t.pb}`, borderRadius: 9, opacity: hidden ? .5 : dragging ? .42 : 1, cursor: locked ? 'default' : 'grab', transform: dragging ? 'scale(.985)' : 'translateY(0)', transition: 'opacity .15s ease, transform .15s ease, border-color .15s ease' }}>
    <span style={{ color: t.fg4, fontSize: 16, lineHeight: 1, flexShrink: 0, width: 14, textAlign: 'center' }}>{locked ? '•' : '⠿'}</span>
    {isGroup && <button type="button" onClick={onToggleCollapse} title={isCollapsed ? 'Expandir seção' : 'Recolher seção'} style={{ ...rowButtonStyle, width: 22, height: 22, fontSize: 10, transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform .15s ease' }}>▶</button>}
    <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ fontSize: small ? 13 : 14, fontWeight: 650, color: t.fg, fontFamily: t.body, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>{custom && <span style={{ color: t.gold, fontSize: 9, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', flexShrink: 0 }}>Novo</span>}</div><div style={{ fontSize: 11, color: t.fg3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{description || 'Sem texto'}</div></div>
    {!locked && <button type="button" onClick={onEdit} title={custom ? 'Editar título e texto' : 'Editar título'} style={rowButtonStyle}><FileEditIcon size={15} /></button>}
    {!locked && <button type="button" onClick={onToggleHidden} title={hidden ? 'Exibir bloco' : 'Ocultar bloco'} style={{ ...rowButtonStyle, color: hidden ? t.fg4 : t.gold }}>{hidden ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}</button>}
    {onDelete && <button type="button" onClick={onDelete} title="Excluir bloco" style={{ ...rowButtonStyle, color: '#E23E57' }}><CloseIcon size={14} /></button>}
  </div>
}

function BlockEditorModal({ editor, isCustom, onChange, onClose, onSave, onEditSystemText }: { editor: EditorState; isCustom: boolean; onChange: (next: EditorState) => void; onClose: () => void; onSave: () => void; onEditSystemText?: (blockId: string) => void }) {
  const [writingMode, setWritingMode] = useState(false)
  const creating = !editor.id
  const canEditText = creating || isCustom
  const canCreate = Boolean(editor.title.trim() && editor.text.trim())
  const editorStyle: React.CSSProperties = {
    minHeight: writingMode ? 0 : 220,
    height: writingMode ? '100%' : undefined,
    borderRadius: 8,
    border: `1px solid ${t.pb}`,
    background: t.night,
    color: t.fg,
    padding: writingMode ? '20px clamp(18px, 4vw, 58px)' : 11,
    fontFamily: t.body,
    fontSize: 14,
    lineHeight: 1.7,
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div onMouseDown={onClose} style={{ position: 'fixed', inset: 0, zIndex: 600, padding: writingMode ? 16 : 20, background: 'rgba(7,4,7,.68)', backdropFilter: 'blur(7px)', display: 'grid', placeItems: 'center' }}>
      <div
        onMouseDown={event => event.stopPropagation()}
        style={{
          width: writingMode ? 'min(100%, 1160px)' : 'min(100%, 540px)',
          height: writingMode ? 'min(900px, calc(100dvh - 32px))' : 'auto',
          maxHeight: writingMode ? 'calc(100dvh - 32px)' : 'min(720px, calc(100dvh - 40px))',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          background: t.night2, border: `1px solid ${t.pb}`, borderRadius: 12,
          boxShadow: '0 24px 64px rgba(0,0,0,.5)', padding: writingMode ? 20 : 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: writingMode ? 14 : 22, flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, color: t.fg, fontFamily: t.display }}>{creating ? 'Novo bloco' : isCustom ? 'Editar bloco' : 'Editar título'}</h2>
            <p style={{ marginTop: 5, fontSize: 12, color: t.fg3, lineHeight: 1.5 }}>{canEditText ? 'O texto será exibido somente neste bloco e seguirá a hierarquia do escopo atual.' : 'O conteúdo oficial permanece na página de Textos; aqui você altera somente o título exibido.'}</p>
          </div>
          {canEditText && <button type="button" onClick={() => setWritingMode(active => !active)} title={writingMode ? 'Reduzir área de escrita' : 'Ampliar área de escrita'} aria-label={writingMode ? 'Reduzir área de escrita' : 'Ampliar área de escrita'} style={{ ...rowButtonStyle, width: 40, height: 40, border: `1px solid ${t.pb}`, borderRadius: 8, color: writingMode ? t.gold : t.fg2 }}>
            {writingMode ? <CollapseIcon size={17} /> : <ExpandIcon size={17} />}
          </button>}
          <button type="button" onClick={onClose} title="Fechar" aria-label="Fechar" style={{ ...rowButtonStyle, width: 40, height: 40 }}><CloseIcon size={16} /></button>
        </div>

        <label style={{ display: 'block', color: t.fg2, fontSize: 12, marginBottom: 14, flexShrink: 0 }}>
          Título
          <input autoFocus value={editor.title} onChange={event => onChange({ ...editor, title: event.target.value })} placeholder="Ex.: Orientação complementar" style={{ width: '100%', minHeight: 40, marginTop: 6, borderRadius: 8, border: `1px solid ${t.pb}`, background: t.night, color: t.fg, padding: '9px 11px', font: `13px ${t.body}`, outline: 'none' }} />
        </label>

        {canEditText ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: writingMode ? 1 : 'none', minHeight: writingMode ? 0 : 220, width: '100%', maxWidth: writingMode ? 794 : 'none', alignSelf: 'center' }}>
            <span style={{ display: 'block', color: t.fg2, fontSize: 12, marginBottom: 6, flexShrink: 0 }}>Texto</span>
            <MarkdownEditor value={editor.text} onChange={text => onChange({ ...editor, text })} placeholder="Escreva o conteúdo deste bloco..." style={editorStyle} />
          </div>
        ) : (
          <div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}><span style={{ color: t.fg2, fontSize: 12 }}>Texto do bloco</span>{onEditSystemText && <button type="button" onClick={() => { onEditSystemText(editor.id!); onClose() }} style={{ border: 0, background: 'transparent', color: t.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Editar em Textos</button>}</div><MarkdownEditor value={editor.standardText ?? 'Este bloco não possui um texto de introdução configurado.'} onChange={() => {}} disabled style={{ minHeight: 160, borderRadius: 8, border: `1px solid ${t.pb}`, background: 'rgba(255,255,255,.025)', color: t.fg3, padding: 11, fontFamily: t.body, fontSize: 13, lineHeight: 1.6, boxSizing: 'border-box' }} /></div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: writingMode ? 14 : 22, flexShrink: 0 }}><SecondaryBtn onClick={onClose} style={{ padding: '10px 18px', fontSize: 12 }}>{canEditText ? 'Cancelar' : 'Fechar'}</SecondaryBtn>{(!creating || canCreate) && <PrimaryBtn onClick={onSave} disabled={!editor.title.trim()} style={{ padding: '10px 18px', fontSize: 12 }}>{creating ? 'Criar bloco' : 'Salvar'}</PrimaryBtn>}</div>
      </div>
    </div>
  )
}
