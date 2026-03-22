'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from '@/lib/hooks/useTheme'
import type { RoleUtilisateur } from '@/types'

const ALL_MODULES = [
  { label: 'Tableau de bord', href: '/dashboard',           key: 'dashboard' },
  { label: 'Etat civil',      href: '/dashboard/civil',     key: 'civil' },
  { label: 'Habitants',       href: '/dashboard/habitants', key: 'habitants' },
  { label: 'Taxes',           href: '/dashboard/taxes',     key: 'taxes' },
  { label: 'Courriers',       href: '/dashboard/courriers', key: 'courriers' },
  { label: 'Dev. local',      href: '/dashboard/devlocal',  key: 'devlocal' },
  { label: 'Personnel',       href: '/dashboard/personnel', key: 'personnel' },
  { label: 'Foncier',         href: '/dashboard/foncier',   key: 'foncier' },
  { label: 'Marches pub.',    href: '/dashboard/marches',   key: 'marches' },
]

export default function Sidebar({
  role,
  modulesAutorises,
}: {
  role: RoleUtilisateur
  modulesAutorises?: string[] | null
}) {
  const pathname = usePathname()
  const { theme, toggle } = useTheme()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const isAdmin = role === 'admin' || role === 'super_admin'

  const visibleModules = ALL_MODULES.filter((m) => {
    if (m.key === 'dashboard') return true
    if (isAdmin) return true
    if (!modulesAutorises) return false
    return modulesAutorises.includes(m.key)
  })

  return (
    <aside style={{
      width: '228px',
      minWidth: '228px',
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-sm)',
    }}>

      {/* Logo */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '7px',
            background: 'var(--accent)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(44,62,80,0.25)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
              SIM Municipal
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px', fontWeight: 500, letterSpacing: '0.02em' }}>
              GESTION MUNICIPALE
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 10px', flex: 1, overflowY: 'auto' }}>

        <div style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text4)',
          padding: '8px 10px 4px',
        }}>
          Navigation
        </div>

        {visibleModules.map((item) => (
          <Link key={item.href} href={item.href} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 10px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            marginBottom: '1px',
            textDecoration: 'none',
            fontWeight: isActive(item.href) ? 600 : 400,
            color: isActive(item.href) ? 'var(--accent)' : 'var(--text2)',
            background: isActive(item.href) ? 'var(--accent-light)' : 'transparent',
            borderLeft: isActive(item.href) ? '2px solid var(--accent)' : '2px solid transparent',
            transition: 'all 0.1s',
          }}>
            <span style={{
              width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0,
              background: isActive(item.href) ? 'var(--accent)' : 'var(--border2)',
            }} />
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <div style={{ marginTop: '20px' }}>
            <div style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: 'var(--text4)',
              padding: '8px 10px 4px',
            }}>
              Administration
            </div>

            {[
              { label: 'Journal d\'audit',   href: '/dashboard/audit' },
              { label: 'Gestion des agents', href: '/dashboard/utilisateurs' },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md)',
                fontSize: '13px',
                marginBottom: '1px',
                textDecoration: 'none',
                fontWeight: isActive(item.href) ? 600 : 400,
                color: isActive(item.href) ? 'var(--accent)' : 'var(--text2)',
                background: isActive(item.href) ? 'var(--accent-light)' : 'transparent',
                borderLeft: isActive(item.href) ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.1s',
              }}>
                <span style={{
                  width: '4px', height: '4px', borderRadius: '50%', flexShrink: 0,
                  background: isActive(item.href) ? 'var(--accent)' : 'var(--border2)',
                }} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Theme toggle + version */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '10px', color: 'var(--text4)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }}>
          v1.0.0
        </span>
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            color: 'var(--text2)',
            fontSize: '11px', fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.03em',
            transition: 'all 0.15s',
          }}
        >
          {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        </button>
      </div>
    </aside>
  )
}