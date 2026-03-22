interface ProgressBarProps {
  value: number
  showLabel?: boolean
}

export default function ProgressBar({ value, showLabel }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const color = clamped === 100 ? 'var(--accent3)' : clamped >= 50 ? 'var(--accent2)' : 'var(--accent)'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{
        flex: 1, height: '5px', borderRadius: '3px',
        background: 'var(--border)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: '3px',
          width: `${clamped}%`,
          background: color,
          transition: 'width 0.3s ease',
        }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: '11px', color: 'var(--text3)', minWidth: '28px', textAlign: 'right' }}>
          {clamped}%
        </span>
      )}
    </div>
  )
}
