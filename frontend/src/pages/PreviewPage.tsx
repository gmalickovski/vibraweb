// PreviewPage.tsx — Multi-page A4 preview.
// Header/footer use position:absolute so they are ALWAYS at the same
// fixed position from the top/bottom edge — identical in screen and print.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildDocumentBlocks, type InterpretationMap, type DocumentBlock } from '../lib/document-builder'
import { resolveDocTheme, type DocTheme } from '../lib/theme-resolver'
import { fetchInterpretation } from '../lib/supabase'
import { DocumentBlockRenderer } from '../components/app/DocumentBlock'
import type { NumerologyMap } from '../lib/numerology'
import type { UserProfile } from '../lib/supabase'
import type { AnalysisTab } from './AppPage'

const SESSION_KEY = 'vw-preview-payload'

// ── Constants — same values used in index.css and print-document.ts ────────
const SAFE     = '8mm'     // distance from page edge to header/footer
const SIDE     = '12mm'    // left/right padding
// Content padding derived from: SAFE + header/footer height + inner gap
const PAD_TOP_COVER   = '10mm'   // cover has no header — just breathing room at top
const PAD_TOP_CONTENT = '22mm'   // header is 8mm from top + ~8mm height + 6mm gap
const PAD_BOT         = '20mm'   // footer is 8mm from bottom + ~6mm height + 6mm gap

export interface PreviewPayload {
  map: NumerologyMap
  tab: AnalysisTab
  subject: string
  dataNascimento: string
  profile: UserProfile | null
}

export function savePreviewPayload(payload: PreviewPayload) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
}

const INTERP_KEYS = [
  'motivação', 'impressão', 'expressão', 'talento_oculto',
  'psíquico', 'destino', 'missão', 'ano_pessoal',
]

function splitIntoPages(blocks: DocumentBlock[]): DocumentBlock[][] {
  const pages: DocumentBlock[][] = [[]]
  for (const block of blocks) {
    if (block.type === 'cover') continue
    if (block.pageBreakBefore && pages[pages.length - 1].length > 0) {
      pages.push([block])
    } else {
      pages[pages.length - 1].push(block)
    }
  }
  return pages.filter(p => p.length > 0)
}

// ── Shared styles ──────────────────────────────────────────────────────────
const borderColor = (color: string) => `1px solid ${color}22`

// ── Page Header — absolutely positioned at top ────────────────────────────
function PageHeader({ theme, subject }: { theme: DocTheme; subject: string }) {
  return (
    <div className="doc-page-header" style={{
      position: 'absolute',
      top: SAFE, left: SIDE, right: SIDE,
      display: 'flex', alignItems: 'center', gap: 10,
      paddingBottom: '3mm',
      borderBottom: borderColor(theme.primaryColor),
    }}>
      {theme.logoUrl ? (
        <img src={theme.logoUrl} alt="Logo"
          style={{ maxHeight: 22, maxWidth: 64, objectFit: 'contain' }} />
      ) : (
        <span style={{
          fontFamily: "'Poppins', sans-serif", fontWeight: 700,
          fontSize: 12, color: theme.primaryColor, whiteSpace: 'nowrap',
        }}>
          {theme.companyName}
        </span>
      )}
      <div style={{
        marginLeft: 'auto', fontSize: 8, color: '#aaa',
        fontFamily: "'Inter', sans-serif", textAlign: 'right', lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}>
        {subject}
      </div>
    </div>
  )
}

// ── Page Footer — absolutely positioned at bottom (all pages) ─────────────
function PageFooter({ theme, isPro }: { theme: DocTheme; isPro: boolean }) {
  const date = new Date().toLocaleDateString('pt-BR')
  const cols = [
    theme.companyName,
    theme.companyContact,
    isPro ? date : 'vibraweb.com.br',
  ]

  return (
    <div className="doc-page-footer" style={{
      position: 'absolute',
      bottom: SAFE, left: SIDE, right: SIDE,
      paddingTop: '3mm',
      borderTop: borderColor(theme.primaryColor),
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 4,
    }}>
      {cols.map((col, i) => (
        <div key={i} style={{
          fontSize: 8, color: '#999',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'center', lineHeight: 1.4,
        }}>
          {col}
        </div>
      ))}
    </div>
  )
}

export function PreviewPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [payload, setPayload] = useState<PreviewPayload | null>(null)
  const [interp, setInterp] = useState<InterpretationMap>({})

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) { navigate('/app/novo'); return }
    const p: PreviewPayload = JSON.parse(raw)
    setPayload(p)

    async function loadInterps() {
      const mapNums = [
        p.map.motivacao, p.map.impressao, p.map.expressao, p.map.talentoOculto,
        p.map.psiquico, p.map.destino, p.map.missao, p.map.anoPessoal,
      ]
      const entries = await Promise.all(
        INTERP_KEYS.map(async (key, idx) => {
          const num = mapNums[idx]
          if (!num) return null
          const fullKey = `${p.tab}_${key}`
          const row = await fetchInterpretation(num, fullKey)
          return row ? { key: fullKey, titulo: row.titulo, texto: row.texto } : null
        })
      )
      const map: InterpretationMap = {}
      entries.forEach(e => { if (e) map[e.key] = { titulo: e.titulo, texto: e.texto } })
      setInterp(map)
      setLoading(false)
    }
    loadInterps()
  }, [navigate])

  if (loading || !payload) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, color: '#9CA3AF', fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ fontSize: 40 }}>📄</div>
        <div style={{ fontSize: 14 }}>Montando documento...</div>
      </div>
    )
  }

  const theme = resolveDocTheme(payload.profile)
  const blocks = buildDocumentBlocks(payload.map, payload.tab, payload.subject, payload.dataNascimento, interp)
  const isPro = payload.profile?.plan === 'pro'
  const tabLabel = payload.tab === 'bebe' ? 'do Bebê' : payload.tab === 'empresa' ? 'da Empresa' : 'Pessoal'
  const docSubject = `${payload.subject} — Mapa Pessoal`
  const pages = splitIntoPages(blocks)

  // Shared page style override (padding controlled here to align with absolute header/footer)
  const coverStyle = { padding: `${PAD_TOP_COVER} ${SIDE} ${PAD_BOT}` }
  const contentStyle = { padding: `${PAD_TOP_CONTENT} ${SIDE} ${PAD_BOT}` }

  return (
    <div className="preview-scroll" style={{
      flex: 1, overflowY: 'auto', overflowX: 'hidden',
      background: '#0e0810',
      padding: '32px 24px 64px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* ── COVER — no header, footer at fixed bottom position ──────── */}
      <div className="a4-page doc-cover" style={coverStyle}>
        {isPro ? null : <div className="watermark">Vibraweb</div>}

        {/* Centered cover body */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', gap: 20, position: 'relative', zIndex: 1,
        }}>
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt="Logo"
              style={{ maxHeight: 80, maxWidth: 200, objectFit: 'contain' }} />
          ) : (
            <div style={{
              fontFamily: "'Poppins', sans-serif", fontWeight: 900,
              fontSize: 20, color: theme.primaryColor,
            }}>
              {theme.companyName}
            </div>
          )}
          <div style={{ width: 48, height: 3, background: theme.accentColor, borderRadius: 2 }} />
          <h1 style={{
            fontFamily: "'Poppins', sans-serif", fontWeight: 900,
            fontSize: 30, color: '#1C1016', margin: 0, lineHeight: 1.2,
          }}>
            Mapa Numerológico<br />
            <span style={{ color: theme.primaryColor }}>{tabLabel}</span>
          </h1>
          <div style={{ width: 48, height: 3, background: theme.accentColor, borderRadius: 2 }} />
          <div>
            <div style={{
              fontFamily: "'Poppins', sans-serif", fontWeight: 700,
              fontSize: 20, color: '#1C1016',
            }}>
              {payload.subject}
            </div>
            {payload.dataNascimento && (
              <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                Nascimento: {payload.dataNascimento}
              </div>
            )}
          </div>
        </div>

        {/* Footer always at same bottom position */}
        <PageFooter theme={theme} isPro={isPro} />
      </div>

      {/* ── CONTENT PAGES — header + content + footer ───────────────── */}
      {pages.map((pageBlocks, pageIdx) => (
        <div key={pageIdx} className="a4-page content-page" style={contentStyle}>
          {isPro ? null : <div className="watermark">Vibraweb</div>}

          {/* Header always at same top position */}
          <PageHeader theme={theme} subject={docSubject} />

          {/* Scrollable content area between header and footer */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden' }}>
            {pageBlocks.map((block: DocumentBlock) => (
              <DocumentBlockRenderer key={block.id} block={block} theme={theme} />
            ))}
          </div>

          {/* Footer always at same bottom position */}
          <PageFooter theme={theme} isPro={isPro} />
        </div>
      ))}

    </div>
  )
}
