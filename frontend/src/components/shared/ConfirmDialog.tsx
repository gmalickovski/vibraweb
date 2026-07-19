// ConfirmDialog.tsx — modal flutuante de confirmação, substitui o
// `window.confirm()` padrão do navegador em todo o sistema. UM componente
// só, montado uma vez perto da raiz (`<ConfirmProvider>` em App.tsx);
// qualquer tela pede confirmação via `useConfirm()`, passando o texto e os
// rótulos dos botões de acordo com a ação — mesmo visual sempre, conteúdo
// muda por chamada.
//
// Uso:
//   const confirm = useConfirm()
//   async function handleDelete() {
//     const ok = await confirm({
//       title: 'Excluir template',
//       message: 'Essa ação não pode ser desfeita.',
//       confirmLabel: 'Excluir',
//       danger: true,
//     })
//     if (!ok) return
//     ...
//   }
// `confirm('mensagem simples')` também funciona (vira { message: 'mensagem simples' }).
//
// Mesma casca visual de SaveSuccessModal.tsx (overlay com blur + card
// night2/pb centralizado) — reaproveita PrimaryBtn/SecondaryBtn.

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { t } from '../../lib/tokens'
import { PrimaryBtn, SecondaryBtn } from './Button'

export interface ConfirmOptions {
  title?: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Ações destrutivas/irreversíveis (excluir, apagar personalização, redefinir tudo) — pinta o botão de confirmar em tom de alerta (vinho) em vez do gradiente padrão. */
  danger?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void
}

type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback<ConfirmFn>((options) => {
    const opts = typeof options === 'string' ? { message: options } : options
    return new Promise<boolean>(resolve => {
      setPending({ ...opts, resolve })
    })
  }, [])

  function settle(result: boolean) {
    pending?.resolve(result)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          // Clicar fora do card cancela — mesmo comportamento de "Esc"/clicar
          // fora de qualquer confirm() nativo.
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
            zIndex: 500,
          }}
          onClick={() => settle(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 420,
              maxWidth: '100%',
              background: t.night2,
              borderRadius: 20,
              border: `1px solid ${pending.danger ? t.wine : t.pb}`,
              padding: 28,
              boxShadow: '0 20px 80px rgba(0,0,0,.6)',
            }}
          >
            {pending.title && (
              <h3 style={{ fontFamily: t.display, fontWeight: 700, fontSize: 18, color: t.fg, margin: 0 }}>
                {pending.title}
              </h3>
            )}
            <p style={{
              fontFamily: t.body, fontSize: 14, color: t.fg3, lineHeight: 1.6,
              margin: pending.title ? '10px 0 0' : 0,
            }}>
              {pending.message}
            </p>

            <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <SecondaryBtn onClick={() => settle(false)} small>
                {pending.cancelLabel ?? 'Cancelar'}
              </SecondaryBtn>
              <PrimaryBtn
                onClick={() => settle(true)}
                small
                style={pending.danger ? { background: t.wine, boxShadow: 'none' } : undefined}
              >
                {pending.confirmLabel ?? 'Confirmar'}
              </PrimaryBtn>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

/** Substitui `window.confirm()`: `if (!(await confirm({...}))) return`. Precisa estar dentro de `<ConfirmProvider>` (montado em App.tsx). */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm() precisa estar dentro de <ConfirmProvider>')
  return ctx
}
