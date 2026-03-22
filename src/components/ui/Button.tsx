'use client'

import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md'

const BASE: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  border: 'none', borderRadius: '6px', cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif', fontWeight: 500,
  transition: 'background 0.15s, opacity 0.15s',
  whiteSpace: 'nowrap',
}

const VARIANTS: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: 'var(--accent)',   color: '#fff' },
  secondary: { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' },
  danger:    { background: 'var(--danger)',    color: '#fff' },
  ghost:     { background: 'transparent',      color: 'var(--text2)', border: '1px solid var(--border)' },
}

const SIZES: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: '12px', padding: '6px 12px' },
  md: { fontSize: '13px', padding: '8px 16px' },
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className,
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(className)}
      style={{
        ...BASE,
        ...VARIANTS[variant],
        ...SIZES[size],
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        ...style,
      }}
      {...props}
    >
      {loading ? 'Chargement...' : children}
    </button>
  )
}
