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
        transition: 'transform .2s, box-shadow .2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(253,184,19,.4)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(253,184,19,.25)' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
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
        transition: 'background .2s, transform .2s, box-shadow .2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...style,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = t.wine; e.currentTarget.style.transform = 'scale(1.02)' }}
      onMouseLeave={e => { e.currentTarget.style.background = t.pb; e.currentTarget.style.transform = 'scale(1)' }}
      onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.98)' }}
      onMouseUp={e => { e.currentTarget.style.transform = 'scale(1.02)' }}
    >
      {children}
    </button>
  )
}
