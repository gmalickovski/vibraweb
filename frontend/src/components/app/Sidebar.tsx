import { useEffect, useRef, useState, type ReactNode } from 'react'
import { t } from '../../lib/tokens'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SortBlocksIcon, TextInputIcon, TemplateIcon, FileNewIcon, FileEditIcon, InfoIcon, CreditCardIcon, GlobalEditsIcon } from '../shared/icons'

// ── Navegação em 2 NÍVEIS, com transição animada ("gaveta") ─────────────────
// Pedido do Guilherme (2026-07-27): agrupar as telas de alteração GLOBAL
// (Textos/Blocos) atrás de um único botão "Alterações Globais" — em vez de
// aparecerem soltas na sidebar, misturadas com Novo Mapa/Mapas/Modelos. Ao
// clicar, a sidebar TROCA de conjunto: os itens de nível raiz somem e os da
// gaveta aparecem (Textos, Blocos, um separador, "Voltar"), ícone por ícone,
// em cascata rápida e sutil. Mesmo padrão de collapse/expand de sempre (ícone
// só / ícone + texto no hover) continua valendo nos dois níveis.
//
// Este é o padrão-BASE reaproveitado em qualquer tela que usaria abas
// superiores em vez de sub-navegação — o 2º caso (2026-07-27) é o editor de
// um Modelo (Visual/Blocos/Textos, ver feature-modelos-de-mapa.md e
// `matchModelosEditor` abaixo), um grupo DINÂMICO: diferente de "Alterações
// Globais" (filhos fixos), os filhos aqui vêm do id do modelo NA PRÓPRIA URL.
//
// Decisão de arquitetura: o nível ativo é DERIVADO da rota atual
// (`activeGroup`), nunca guardado num estado próprio separado. Um estado
// solto tipo `menuAberto` dessincronizaria da URL em qualquer entrada que não
// seja o clique no botão — refresh, voltar do navegador, link direto pra
// /app/textos. Derivando da rota, esses casos caem no nível certo sozinhos,
// sem código extra.
//
// A animação em si usa a técnica de "2 quadros" com CSS transition (sem
// @keyframes): ao entrar num nível novo, os itens nascem no quadro ESCONDIDO
// (opacity 0, deslocados) sem transição; no próximo frame (rAF), viram pro
// quadro visível COM transição e um delay por índice — é o que produz a
// cascata. Sair (clique no grupo ou em "Voltar") faz o inverso ANTES de
// navegar: primeiro anima os itens atuais escondendo em cascata, só then
// troca de rota (senão a rota trocaria instantaneamente e não haveria tempo
// de ver a saída).

// `icon` aceita string (glifo Unicode, a maioria dos itens) OU um componente
// SVG (Blocos/Textos, 2026-07-27 — ver icons.tsx: são os 2 casos em que um
// glifo de texto não conseguia comunicar a ação, então viraram ícones
// próprios no MESMO padrão de traço usado no resto do app). `{row.icon}`
// renderiza os dois do mesmo jeito, sem nenhuma ramificação no JSX.
type NavIcon = string | ReactNode

interface NavItem {
  id: string
  label: string
  icon: NavIcon
  path: string
  pro?: boolean
}

interface NavGroup {
  id: string
  label: string
  icon: NavIcon
  children: NavItem[]
}

type NavEntry = NavItem | NavGroup

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry
}

const rootEntries: NavEntry[] = [
  { id: 'novo',   label: 'Novo Mapa',       icon: <FileNewIcon size={20} />, path: '/app/novo' },
  { id: 'salvos', label: 'Mapas',           icon: <FileEditIcon size={20} />, path: '/app/salvos' },
  { id: 'brand',  label: 'Modelos',         icon: <TemplateIcon size={20} />, pro: true, path: '/app/marca' },
  {
    id: 'globais', label: 'Alterações Globais', icon: '◎',
    children: [
      { id: 'textos', label: 'Textos', icon: <TextInputIcon size={20} />, pro: true, path: '/app/textos' },
      { id: 'blocos', label: 'Blocos', icon: <SortBlocksIcon size={20} />, path: '/app/blocos' },
    ],
  },
  { id: 'settings', label: 'Configurações', icon: '⚙', path: '/app/configuracoes' },
]

const adminRootEntries: NavEntry[] = [
  { id: 'overview', label: 'Visão geral', icon: <InfoIcon size={20} />, path: '/admin' },
  {
    id: 'system-base', label: 'Base do Sistema', icon: <GlobalEditsIcon size={20} />,
    children: [
      { id: 'system-visual', label: 'Estilos', icon: <TemplateIcon size={20} />, path: '/admin/base/visual' },
      { id: 'system-blocks', label: 'Blocos', icon: <SortBlocksIcon size={20} />, path: '/admin/base/blocos' },
      { id: 'system-texts', label: 'Textos', icon: <TextInputIcon size={20} />, path: '/admin/base/textos' },
    ],
  },
  { id: 'plans', label: 'Planos e cobrança', icon: <CreditCardIcon size={20} />, path: '/admin/plans' },
  { id: 'settings', label: 'Configurações', icon: <SortBlocksIcon size={20} />, path: '/admin/settings' },
]

// Grupo DINÂMICO (2026-07-27): dentro do editor de UM Modelo específico
// (/app/marca/<id>[/blocos|/textos]), a sidebar mostra Visual/Blocos/Textos
// DAQUELE modelo — diferente dos grupos estáticos acima (Alterações Globais),
// os filhos aqui não são uma lista fixa: o id vem da própria URL. 'default'
// (Padrão Vibraweb) fica de fora — não é um modelo salvo, não tem onde
// guardar bloco/texto próprios (ver ModeloBlocosTab em BrandPage.tsx),
// então continua sem gaveta, só a mensagem de "sem customização".
function matchModelosEditor(pathname: string): { id: string; items: NavItem[]; backTo: string } | null {
  const m = pathname.match(/^\/app\/marca\/([^/]+)(?:\/(blocos|textos))?\/?$/)
  if (!m || m[1] === 'default') return null
  const base = `/app/marca/${m[1]}`
  return {
    id: `modelos:${m[1]}`,
    backTo: '/app/marca',
    items: [
      { id: 'visual', label: 'Aparência', icon: '▣', path: base },
      { id: 'blocos', label: 'Blocos', icon: <SortBlocksIcon size={20} />, path: `${base}/blocos` },
      { id: 'textos', label: 'Textos', icon: <TextInputIcon size={20} />, pro: true, path: `${base}/textos` },
    ],
  }
}

type Row =
  | { kind: 'link'; id: string; label: string; icon: NavIcon; path: string; pro?: boolean }
  | { kind: 'group'; id: string; label: string; icon: NavIcon; group: NavGroup }
  | { kind: 'back'; id: string; label: string; icon: NavIcon; backTo: string }

// Duração/atraso da cascata — rápida e sutil, não um efeito chamativo.
const STAGGER_MS = 22
const DURATION_MS = 170

export function Sidebar({ mode = 'workspace' }: { mode?: 'workspace' | 'admin' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  // 'hidden' = quadro inicial escondido (sem transição, só no frame de
  // montagem); 'idle' = quadro visível (com transição); 'leaving' = escondendo
  // ANTES de trocar de rota (clique no grupo ou em Voltar).
  const [phase, setPhase] = useState<'hidden' | 'idle' | 'leaving'>('idle')

  const collapsedWidth = 72
  const expandedWidth = 240

  // Última página de nível raiz visitada — "Voltar" de um grupo ESTÁTICO
  // (Alterações Globais) retorna pra ela (não sempre pra "Novo Mapa"), então
  // sair da gaveta devolve ao lugar de onde o consultor veio. Grupos
  // DINÂMICOS (editor de Modelo) têm seu próprio destino fixo (a lista de
  // modelos) — não faz sentido "voltar" pra onde você estava antes de nem
  // ter entrado em Modelos.
  const entries = mode === 'admin' ? adminRootEntries : rootEntries
  const lastRootPathRef = useRef(mode === 'admin' ? '/admin' : '/app/novo')

  const staticGroup = entries.find(
    (e): e is NavGroup => isGroup(e) && e.children.some(c => location.pathname.startsWith(c.path))
  )
  const modelosEditor = mode === 'workspace' && !staticGroup ? matchModelosEditor(location.pathname) : null
  const active = staticGroup
    ? { id: staticGroup.id, items: staticGroup.children, backTo: lastRootPathRef.current }
    : modelosEditor
  const level = active?.id ?? 'root'

  useEffect(() => {
    if (level === 'root') lastRootPathRef.current = location.pathname
  }, [location.pathname, level])

  // Troca de nível (raiz → grupo ou grupo → raiz, incluindo entradas diretas
  // por URL/refresh/voltar do navegador) sempre passa pelo quadro escondido
  // antes do visível — é isso que produz a entrada em cascata mesmo quando a
  // troca de rota já aconteceu (não deu tempo de animar a SAÍDA).
  //
  // setTimeout, NÃO requestAnimationFrame: confirmado ao vivo que o rAF fica
  // PARADO PARA SEMPRE quando a aba não está sendo pintada na tela (mesma
  // causa já vista no spike do Paged.js) — o `phase` travava em 'hidden' e a
  // cascata de entrada nunca completava. setTimeout dispara de qualquer jeito,
  // e um atraso mínimo já é suficiente pro navegador aplicar o quadro
  // escondido antes de começar a transição pro visível.
  const prevLevelRef = useRef(level)
  useEffect(() => {
    if (prevLevelRef.current !== level) {
      prevLevelRef.current = level
      setPhase('hidden')
      const id = window.setTimeout(() => setPhase('idle'), 20)
      return () => window.clearTimeout(id)
    }
  }, [level])

  const leaveTimer = useRef<number | null>(null)
  useEffect(() => () => { if (leaveTimer.current) window.clearTimeout(leaveTimer.current) }, [])

  const rows: Row[] = active
    ? [
        ...active.items.map(c => ({ kind: 'link' as const, ...c })),
        { kind: 'back' as const, id: 'voltar', label: 'Voltar', icon: '←', backTo: active.backTo },
      ]
    : entries.map(e =>
        isGroup(e)
          ? { kind: 'group' as const, id: e.id, label: e.label, icon: e.icon, group: e }
          : { kind: 'link' as const, ...e }
      )

  // BUG CORRIGIDO (2026-07-27): qual link está "aceso" era decidido por
  // `startsWith` isolado por linha — funciona pra itens de raiz (caminhos que
  // nunca são prefixo um do outro), mas quebra dentro do grupo dinâmico de um
  // Modelo: "Aparência" (`/app/marca/<id>`) é literalmente um PREFIXO de
  // "Textos" (`/app/marca/<id>/textos`), então as DUAS acendiam ao mesmo
  // tempo na aba Textos (relatado pelo Guilherme, print). Corrigido: entre
  // todos os links da linha atual, só o de caminho MAIS ESPECÍFICO (mais
  // longo) que bate com a URL fica aceso — os demais, mesmo batendo por
  // prefixo, perdem.
  const linkPaths = rows.filter((r): r is Extract<Row, { kind: 'link' }> => r.kind === 'link').map(r => r.path)
  const activeLinkPath = linkPaths
    .filter(p => location.pathname === p || location.pathname.startsWith(`${p}/`) || (p === '/app/novo' && location.pathname === '/app'))
    .sort((a, b) => b.length - a.length)[0]

  // Anima a SAÍDA do conjunto atual e só troca de rota depois — sem isso a
  // rota mudaria no mesmo tick do clique e não haveria cascata de saída
  // nenhuma pra ver.
  function transitionTo(path: string) {
    if (phase !== 'idle') return // ignora clique duplo durante a animação
    setPhase('leaving')
    const total = rows.length * STAGGER_MS + DURATION_MS
    leaveTimer.current = window.setTimeout(() => navigate(path), total)
  }

  function itemMotionStyle(index: number): React.CSSProperties {
    const delay = `${index * STAGGER_MS}ms`
    if (phase === 'hidden') {
      return { opacity: 0, transform: 'translateY(4px)', transition: 'none' }
    }
    if (phase === 'leaving') {
      return {
        opacity: 0,
        transform: 'translateX(-6px)',
        transition: `opacity ${DURATION_MS}ms ease ${delay}, transform ${DURATION_MS}ms ease ${delay}`,
      }
    }
    return {
      opacity: 1,
      transform: 'translateY(0)',
      transition: `opacity ${DURATION_MS}ms ease ${delay}, transform ${DURATION_MS}ms ease ${delay}`,
    }
  }

  return (
    <div style={{ width: collapsedWidth, flexShrink: 0, position: 'relative', zIndex: 100 }}>
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: hovered ? expandedWidth : collapsedWidth,
          background: t.night2,
          borderRight: `1px solid ${t.pb}`,
          padding: '24px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'box-shadow 0.2s ease',
          overflow: 'hidden',
          boxShadow: hovered ? '10px 0 20px rgba(0,0,0,0.4)' : 'none',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 20px 24px',
          whiteSpace: 'nowrap'
        }}>
          <img src="/assets/logo-vibraweb-mark.svg" alt="Vibraweb" style={{ width: 32, height: 32, minWidth: 32 }} />
          <span style={{
            fontFamily: t.display,
            fontWeight: 700,
            fontSize: 18,
            color: t.fg,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s',
            visibility: hovered ? 'visible' : 'hidden'
          }}>Vibraweb</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px' }}>
          {rows.map((row, index) => {
            if (row.kind === 'back') {
              return (
                <div key={row.id}>
                  <div style={{ height: 1, background: t.pb, margin: '8px 12px' }} />
                  <button
                    onClick={() => transitionTo(row.backTo)}
                    style={{
                      display: 'flex', alignItems: 'center', width: '100%',
                      padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer',
                      color: t.fg3, fontFamily: t.body, fontSize: 14, fontWeight: 500,
                      borderRadius: 12, whiteSpace: 'nowrap', textAlign: 'left',
                      ...itemMotionStyle(index),
                    }}
                  >
                    <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 24, minWidth: 24, fontSize: 18 }}>
                      {row.icon}
                    </span>
                    <span style={{
                      marginLeft: 16, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
                      visibility: hovered ? 'visible' : 'hidden', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {row.label}
                    </span>
                  </button>
                </div>
              )
            }

            if (row.kind === 'group') {
              return (
                <button
                  key={row.id}
                  onClick={() => transitionTo(row.group.children[0].path)}
                  style={{
                    display: 'flex', alignItems: 'center', width: '100%',
                    padding: '12px', background: 'transparent', border: 'none', cursor: 'pointer',
                    color: t.fg2, fontFamily: t.body, fontSize: 14, fontWeight: 500,
                    borderRadius: 12, whiteSpace: 'nowrap', textAlign: 'left',
                    transition: 'background .15s, color .15s',
                    ...itemMotionStyle(index),
                  }}
                >
                  <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 24, minWidth: 24, fontSize: 20, opacity: 0.8 }}>
                    {row.icon}
                  </span>
                  <span style={{
                    marginLeft: 16, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
                    visibility: hovered ? 'visible' : 'hidden', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {row.label}
                  </span>
                  {/* seta indicando "isto abre uma gaveta" — só some/aparece com o hover, igual ao PRO */}
                  <span style={{
                    fontSize: 12, color: t.fg4, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
                    visibility: hovered ? 'visible' : 'hidden', flexShrink: 0,
                  }}>
                    ›
                  </span>
                </button>
              )
            }

            const on = row.path === activeLinkPath
            return (
              <Link
                key={row.id}
                to={row.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: on ? 'rgba(253,184,19,.08)' : 'transparent',
                  color: on ? t.gold : t.fg2,
                  textDecoration: 'none',
                  fontFamily: t.body,
                  fontSize: 14,
                  fontWeight: 500,
                  borderRadius: 12,
                  whiteSpace: 'nowrap',
                  transition: 'background .15s, color .15s',
                  ...itemMotionStyle(index),
                }}
              >
                <span style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: 24,
                  minWidth: 24,
                  fontSize: 20,
                  opacity: on ? 1 : 0.8
                }}>
                  {row.icon}
                </span>

                <span style={{
                  marginLeft: 16,
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.2s',
                  visibility: hovered ? 'visible' : 'hidden',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {row.label}
                </span>

                {row.pro && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '.08em',
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: t.gradCta,
                    color: t.night2,
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    visibility: hovered ? 'visible' : 'hidden',
                    flexShrink: 0
                  }}>PRO</span>
                )}
              </Link>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          padding: 16,
          margin: '0 12px',
          border: `1px solid ${t.pb}`,
          borderRadius: 12,
          background: 'rgba(42,22,32,.5)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
          visibility: hovered ? 'visible' : 'hidden',
          whiteSpace: 'normal',
          minWidth: expandedWidth - 24,
        }}>
          <div style={{
            fontFamily: t.display,
            fontSize: 13,
            fontWeight: 700,
            background: t.gradText,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: 4,
          }}>Upgrade para Pro</div>
          <p style={{ fontSize: 11, color: t.fg3, margin: 0, lineHeight: 1.5, fontFamily: t.body }}>
            White-label, logo próprio e relatórios ilimitados.
          </p>
        </div>
      </aside>
    </div>
  )
}
