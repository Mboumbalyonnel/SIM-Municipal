interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '24px',
      gap: '16px',
    }}>
      <div>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
            {description}
          </p>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}
