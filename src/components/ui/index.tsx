'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

// ============================================================
// BADGE
// ============================================================

type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'gray' | 'info'

const BADGE_STYLES: Record<BadgeVariant, { bg: string; color: string }> = {
  green: { bg: '#D8F3DC', color: '#1B4332' },
  red:   { bg: '#FDECEA', color: '#9B2226' },
  amber: { bg: '#FFF3CD', color: '#7D4E00' },
  blue:  { bg: '#E8F0F9', color: '#1B3A5C' },
  gray:  { bg: '#F1EFE8', color: '#6B6960' },
  info:  { bg: '#E8F0F9', color: '#1B3A5C' },
}

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  const s = BADGE_STYLES[variant]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '3px',
      fontSize: '11px',
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

// ============================================================
// STAT CARD
// ============================================================

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  variant?: 'default' | 'danger' | 'warning'
}

export function StatCard({ label, value, sub, variant = 'default' }: StatCardProps) {
  const valueColor = variant === 'danger' ? '#9B2226' : variant === 'warning' ? '#7D4E00' : '#1A1916'
  return (
    <div style={{
      background: '#F9F8F5',
      borderRadius: '6px',
      padding: '14px 16px',
      border: '1px solid #E2E0D8',
    }}>
      <p style={{ fontSize: '11px', color: '#9C9A92', marginBottom: '4px', fontWeight: 500 }}>
        {label}
      </p>
      <p style={{ fontSize: '24px', fontWeight: 600, color: valueColor, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: '11px', color: '#9C9A92', marginTop: '4px' }}>
          {sub}
        </p>
      )}
    </div>
  )
}

// ============================================================
// BUTTON
// ============================================================

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  children: ReactNode
}

const BTN_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary:   { background: '#1B4332', color: '#fff', border: '1px solid #1B4332' },
  secondary: { background: '#fff', color: '#1A1916', border: '1px solid #E2E0D8' },
  danger:    { background: '#9B2226', color: '#fff', border: '1px solid #9B2226' },
  ghost:     { background: 'transparent', color: '#6B6960', border: '1px solid transparent' },
}

export function Button({ variant = 'secondary', size = 'md', children, disabled, style, ...props }: ButtonProps) {
  const base = BTN_STYLES[variant]
  return (
    <button
      disabled={disabled}
      style={{
        ...base,
        padding: size === 'sm' ? '5px 12px' : '8px 16px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 500,
        fontFamily: "'DM Sans', sans-serif",
        borderRadius: '6px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  )
}

// ============================================================
// PAGE HEADER
// ============================================================

interface PageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', marginBottom: '24px',
    }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1A1916', marginBottom: '2px' }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: '13px', color: '#9C9A92' }}>{description}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}

// ============================================================
// TABLE WRAPPER
// ============================================================

interface DataTableProps {
  headers: string[]
  children: ReactNode
  empty?: string
}

export function DataTable({ headers, children, empty }: DataTableProps) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E0D8',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#F9F8F5', borderBottom: '1px solid #E2E0D8' }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: '9px 14px',
                textAlign: 'left',
                fontSize: '11px',
                fontWeight: 600,
                color: '#9C9A92',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty && (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9C9A92', fontSize: '13px' }}>
          {empty}
        </div>
      )}
    </div>
  )
}

// ============================================================
// TABLE ROW
// ============================================================

interface TrProps {
  children: ReactNode
  onClick?: () => void
}

export function Tr({ children, onClick }: TrProps) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #E2E0D8',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = '#F9F8F5' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {children}
    </tr>
  )
}

// ============================================================
// TABLE CELL
// ============================================================

interface TdProps {
  children: ReactNode
  muted?: boolean
  mono?: boolean
  style?: React.CSSProperties
}

export function Td({ children, muted, mono, style }: TdProps) {
  return (
    <td style={{
      padding: '10px 14px',
      fontSize: '13px',
      color: muted ? '#9C9A92' : '#1A1916',
      fontFamily: mono ? "'DM Mono', monospace" : "'DM Sans', sans-serif",
      verticalAlign: 'middle',
      ...style,
    }}>
      {children}
    </td>
  )
}

// ============================================================
// MODAL
// ============================================================

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,25,22,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '10px',
          width: '100%', maxWidth: `${width}px`,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        {/* Header modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #E2E0D8',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1A1916' }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '18px', color: '#9C9A92', lineHeight: 1,
              padding: '2px 6px', borderRadius: '4px',
            }}
          >
            x
          </button>
        </div>
        {/* Contenu */}
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// FORM FIELD
// ============================================================

interface FormFieldProps {
  label: string
  required?: boolean
  children: ReactNode
  error?: string
}

export function FormField({ label, required, children, error }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{
        fontSize: '11px', fontWeight: 600,
        color: '#6B6960', textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        {label}{required && <span style={{ color: '#9B2226', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: '11px', color: '#9B2226', marginTop: '2px' }}>{error}</p>
      )}
    </div>
  )
}

// ============================================================
// PROGRESS BAR
// ============================================================

interface ProgressBarProps {
  value: number
  color?: string
}

export function ProgressBar({ value, color = '#2D6A4F' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div style={{
      background: '#E2E0D8', borderRadius: '3px',
      height: '5px', overflow: 'hidden', width: '100%',
    }}>
      <div style={{
        width: `${clamped}%`, height: '100%',
        background: color, borderRadius: '3px',
        transition: 'width 0.3s',
      }} />
    </div>
  )
}

// ============================================================
// SEARCH INPUT
// ============================================================

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher...' }: SearchInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        padding: '8px 12px',
        fontSize: '13px',
        border: '1px solid #E2E0D8',
        borderRadius: '6px',
        background: '#fff',
        color: '#1A1916',
        outline: 'none',
        width: '240px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    />
  )
}

// ============================================================
// SELECT FILTER
// ============================================================

interface SelectFilterProps {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

export function SelectFilter({ value, onChange, options }: SelectFilterProps) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '8px 12px',
        fontSize: '13px',
        border: '1px solid #E2E0D8',
        borderRadius: '6px',
        background: '#fff',
        color: '#1A1916',
        outline: 'none',
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// ============================================================
// SECTION CARD
// ============================================================

interface SectionCardProps {
  children: ReactNode
  style?: React.CSSProperties
}

export function SectionCard({ children, style }: SectionCardProps) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E0D8',
      borderRadius: '8px',
      padding: '20px',
      ...style,
    }}>
      {children}
    </div>
  )
}
