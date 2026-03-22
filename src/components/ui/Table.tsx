interface TableProps {
  headers: string[]
  children: React.ReactNode
  empty?: string
}

export function Table({ headers, children, empty }: TableProps) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: '8px',
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {headers.map((h, i) => (
                <th key={i} style={{
                  padding: '9px 14px', textAlign: 'left',
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--text2)', whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      {!children && empty && (
        <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'var(--text3)' }}>
          {empty}
        </div>
      )}
    </div>
  )
}

interface TrProps {
  children: React.ReactNode
  onClick?: () => void
}

export function Tr({ children, onClick }: TrProps) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.background = '' }}
    >
      {children}
    </tr>
  )
}

interface TdProps {
  children: React.ReactNode
  mono?: boolean
  muted?: boolean
  style?: React.CSSProperties
}

export function Td({ children, mono, muted, style }: TdProps) {
  return (
    <td style={{
      padding: '10px 14px',
      color: muted ? 'var(--text3)' : 'var(--text)',
      fontFamily: mono ? 'DM Mono, monospace' : undefined,
      fontSize: mono ? '12px' : '13px',
      verticalAlign: 'middle',
      ...style,
    }}>
      {children}
    </td>
  )
}
