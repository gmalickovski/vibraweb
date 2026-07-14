import { ButtonHTMLAttributes } from 'react'
import { t } from '../../lib/tokens'

interface PrimaryBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  small?: boolean
}

export function PrimaryBtn({ children, small, style, ...props }: PrimaryBtnProps) {
  return (
    <button
      {...props}
      style={{
        background: t.gradCta,
        color: t.night2,
        border: 0,
        fontFamily: t.display,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        fontSize: small ? 12 : 14,
        padding: small ? '10px 20px' : '14px 28px',
        borderRadius: 9999,
        cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(253,184,19,.25)',
        whiteSpace: 'nowrap',
        transition: 'transform .15s ease, box-shadow .15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.015)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(253,184,19,.3)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(253,184,19,.25)' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.015)' }}
    >
      {children}
    </button>
  )
}

interface SecondaryBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  small?: boolean
}

export function SecondaryBtn({ children, small, style, ...props }: SecondaryBtnProps) {
  return (
    <button
      {...props}
      style={{
        background: t.pb,
        color: t.fg,
        border: 0,
        fontFamily: t.display,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        fontSize: small ? 12 : 14,
        padding: small ? '10px 20px' : '14px 28px',
        borderRadius: 9999,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background .15s ease, transform .15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = t.wine; e.currentTarget.style.transform = 'scale(1.01)' }}
      onMouseLeave={e => { e.currentTarget.style.background = t.pb; e.currentTarget.style.transform = 'scale(1)' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.01)' }}
    >
      {children}
    </button>
  )
}
