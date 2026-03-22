'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LABELS_ROLE } from '@/lib/utils'
import type { RoleUtilisateur } from '@/types'

interface TopbarProps {
  nom: string
  role: RoleUtilisateur
  mairie: string
  avatarUrl?: string | null
}

export default function Topbar({ nom, role, mairie, avatarUrl }: TopbarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initiales = nom
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <header style={{
      height: '54px',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      flexShrink: 0,
      boxShadow: 'var(--shadow-sm)',
    }}>

      {/* Instance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', flexShrink: 0 }} />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text3)' }}>
          Instance
        </span>
        <span style={{
          fontSize: '12px', fontWeight: 600, color: 'var(--text)',
          fontFamily: 'JetBrains Mono, monospace',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          padding: '2px 8px', borderRadius: 'var(--radius-sm)',
        }}>
          {mairie}
        </span>
      </div>

      {/* Profil + deconnexion */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

        <a href="/dashboard/profil" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {initiales}
            </div>
          )}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
              {nom}
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {LABELS_ROLE[role] ?? role}
            </div>
          </div>
        </a>

        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '12px', fontWeight: 500, color: 'var(--text3)',
            background: 'none', border: '1px solid transparent',
            cursor: 'pointer', padding: '5px 10px',
            borderRadius: 'var(--radius-md)', transition: 'all 0.15s',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--danger-light)'
            e.currentTarget.style.color = 'var(--danger)'
            e.currentTarget.style.borderColor = 'var(--danger)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.color = 'var(--text3)'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Deconnexion
        </button>
      </div>
    </header>
  )
}