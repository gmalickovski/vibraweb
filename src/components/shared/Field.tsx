import { InputHTMLAttributes, useState } from 'react'
import { t } from '../../lib/tokens'

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string
  value: string
  onChange: (val: string) => void
  optional?: boolean
}

export function Field({ label, value, onChange, optional, placeholder, type = 'text', ...rest }: FieldProps) {
  const [focus, setFocus] = useState(false)
  const filled = value.length > 2

  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{
        fontFamily: t.body, fontWeight: 600, fontSize: 11,
        color: t.fg3, textTransform: 'uppercase', letterSpacing: '.06em',
      }}>
        {label}
        {optional && <span style={{ color: t.fg4, marginLeft: 6 }}>(opcional)</span>}
      </span>
      <div style={{ position: 'relative' }}>
        <input
          {...rest}
          value={value}
          type={type}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            width: '100%',
            background: 'rgba(42,22,32,.45)',
            border: `1px solid ${focus ? t.gold : t.pb}`,
            borderRadius: 12,
            padding: '12px 40px 12px 14px',
            fontFamily: t.body,
            fontSize: 15,
            color: t.fg,
            outline: 'none',
            boxShadow: focus ? '0 0 0 3px rgba(253,184,19,.18)' : 'none',
            transition: 'border-color .2s, box-shadow .2s',
          }}
        />
        {filled && (
          <span style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: t.success, fontSize: 16, fontWeight: 700, pointerEvents: 'none',
          }}>✓</span>
        )}
      </div>
    </label>
  )
}
