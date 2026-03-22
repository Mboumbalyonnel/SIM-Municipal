'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LABELS_ROLE } from '@/lib/utils'
import type { Profile } from '@/types'

export default function ProfilClient({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [saving, setSaving] = useState(false)
  const [nom, setNom] = useState(profile.nom)
  const [prenom, setPrenom] = useState(profile.prenom)
  const [telephone, setTelephone] = useState('')
  const [success, setSuccess] = useState('')
  const [err, setErr] = useState('')

  const initiales = `${profile.prenom.charAt(0)}${profile.nom.charAt(0)}`.toUpperCase()

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setErr('La photo ne doit pas depasser 2 MB.')
      return
    }

    setUploading(true)
    setErr('')

    const sb = createClient()
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/avatar.${ext}`

    const { error: uploadError } = await sb.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setErr('Erreur lors de l\'upload : ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data } = sb.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl + '?t=' + Date.now()

    await sb.from('profiles').update({ avatar_url: url }).eq('id', profile.id)
    setAvatarUrl(url)
    setUploading(false)
    setSuccess('Photo mise a jour.')
    router.refresh()
  }

  async function handleSaveProfil() {
    setErr('')
    setSuccess('')
    if (!nom.trim() || !prenom.trim()) {
      setErr('Nom et prenom sont obligatoires.')
      return
    }
    setSaving(true)
    const sb = createClient()
    const { error } = await sb.from('profiles')
      .update({ nom: nom.trim(), prenom: prenom.trim() })
      .eq('id', profile.id)
    if (error) { setErr(error.message); setSaving(false); return }
    setSuccess('Profil mis a jour.')
    setSaving(false)
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Mon profil
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px', fontWeight: 500 }}>
          Modifiez vos informations personnelles et votre photo
        </p>
      </div>

      {/* Messages */}
      {success && (
        <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--success)', marginBottom: '20px', fontWeight: 500 }}>
          {success}
        </div>
      )}
      {err && (
        <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '20px', fontWeight: 500 }}>
          {err}
        </div>
      )}

      {/* Photo de profil */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px',
        marginBottom: '16px', boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '20px' }}>
          Photo de profil
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{
                  width: '80px', height: '80px', borderRadius: '50%',
                  objectFit: 'cover', border: '3px solid var(--border)',
                }}
              />
            ) : (
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', fontWeight: 700, color: 'white',
                border: '3px solid var(--border)',
              }}>
                {initiales}
              </div>
            )}
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
          </div>

          {/* Upload */}
          <div>
            <label style={{
              display: 'inline-block', padding: '8px 16px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600,
              color: 'var(--text)', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {uploading ? 'Upload en cours...' : 'Changer la photo'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
            <div style={{ fontSize: '11px', color: 'var(--text4)', marginTop: '8px', fontWeight: 500 }}>
              JPG, PNG ou WebP. Maximum 2 MB.
            </div>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px',
        marginBottom: '16px', boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '20px' }}>
          Informations personnelles
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>
              Nom
            </label>
            <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>
              Prenom
            </label>
            <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input type="email" value={profile.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>
              Poste
            </label>
            <input type="text" value={profile.poste ?? ''} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>
              Role
            </label>
            <input type="text" value={LABELS_ROLE[profile.role] ?? profile.role} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        </div>

        <button
          onClick={handleSaveProfil}
          disabled={saving}
          style={{
            padding: '9px 20px', fontSize: '13px', fontWeight: 600,
            background: 'var(--accent)', color: 'white',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}