interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  variant?: 'default' | 'danger' | 'warning'
}

export default function StatCard({ label, value, sub, variant = 'default' }: StatCardProps) {
  const valueColor = variant === 'danger' ? 'var(--danger)' : variant === 'warning' ? 'var(--warning)' : 'var(--text)'

  return (
    <div style={{
      background: 'var(--surface2)',
      borderRadius: '8px',
      padding: '14px 16px',
      border: '1px solid var(--border)',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 500, color: valueColor, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}
