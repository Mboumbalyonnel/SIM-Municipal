'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!email.trim()) { setErr('Saisissez votre adresse email.'); return }
    setLoading(true)
    const sb = createClient()
    const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/dashboard`,
    })
    if (error) { setErr(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '380px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '36px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: 'var(--text)' }}>Mot de passe oublie</h1>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '24px' }}>
          Saisissez votre adresse email. Si un compte existe, vous recevrez un lien de reinitialisation.
        </p>
        {sent ? (
          <div style={{ background: '#D8F3DC', border: '1px solid #95D5B2', borderRadius: '6px', padding: '14px', fontSize: '13px', color: '#1B4332' }}>
            Email envoye. Verifiez votre boite de reception et vos spams.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {err && <div style={{ background: '#FDECEA', border: '1px solid #F1AEAD', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '14px' }}>{err}</div>}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Adresse email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@mairie-gamba.ga" required />
            </div>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Envoi...' : 'Envoyer le lien'}
            </button>
          </form>
        )}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <a href="/login" style={{ fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Retour a la connexion</a>
        </div>
      </div>
    </div>
  )
}
