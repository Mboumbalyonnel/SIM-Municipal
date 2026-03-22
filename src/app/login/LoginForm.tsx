'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MODULES = [
  'Etat civil', 'Habitants', 'Taxes', 'Courriers',
  'Dev. local', 'Personnel', 'Foncier', 'Marches pub.',
]

const COAT_OF_ARMS = 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Coat_of_arms_of_Gamba%2C_Gabon.svg'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [blocked, setBlocked] = useState(false)
  const [blockedUntil, setBlockedUntil] = useState<Date | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('login_theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
    setMounted(true)
    const blockedTs = localStorage.getItem('sim_blocked_until')
    if (blockedTs) {
      const until = new Date(blockedTs)
      if (until > new Date()) { setBlocked(true); setBlockedUntil(until) }
      else { localStorage.removeItem('sim_blocked_until'); localStorage.removeItem('sim_attempts') }
    }
    const savedA = localStorage.getItem('sim_attempts')
    if (savedA) setAttempts(parseInt(savedA))
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('login_theme', next)
  }

  async function handleLogin(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (blocked) return
    setError('')
    if (!email.trim() || !password.trim()) { setError('Veuillez saisir votre email et votre mot de passe.'); return }
    setLoading(true)
    try {
      const sb = createClient()
      const { error: authError } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (authError) {
        const n = attempts + 1
        setAttempts(n)
        localStorage.setItem('sim_attempts', String(n))
        if (n >= 5) {
          const until = new Date(Date.now() + 15 * 60 * 1000)
          setBlocked(true); setBlockedUntil(until)
          localStorage.setItem('sim_blocked_until', until.toISOString())
          setError('Compte bloque apres 5 tentatives. Reessayez dans 15 minutes.')
        } else {
          setError(`Identifiants incorrects. (${n}/5)`)
        }
        setPassword(''); setLoading(false); return
      }
      const { data: { user } } = await sb.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: profile } = await sb.from('profiles').select('actif, role, mairie_id').eq('id', user.id).single()
      if (!profile || !profile.actif) {
        await sb.auth.signOut()
        setError('Ce compte est desactive. Contactez votre administrateur.')
        setLoading(false); return
      }
      if (profile.mairie_id && profile.role !== 'super_admin') {
        const { data: mairie } = await sb.from('mairies').select('statut').eq('id', profile.mairie_id).single()
        if (mairie && mairie.statut !== 'active') {
          await sb.auth.signOut()
          setError("L'acces a cette instance est suspendu.")
          setLoading(false); return
        }
      }
      localStorage.removeItem('sim_attempts')
      localStorage.removeItem('sim_blocked_until')
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Une erreur technique est survenue.')
      setLoading(false)
    }
  }

  function getRemainingTime() {
    if (!blockedUntil) return ''
    return `${Math.ceil((blockedUntil.getTime() - Date.now()) / 60000)} min`
  }

  const dark = theme === 'dark'

  const C = {
    pageBg:       dark ? '#0F1117' : '#F0F2F5',
    leftBg:       dark ? '#13151C' : '#1B3A6B',
    leftBorder:   dark ? '#1E2130' : '#163160',
    rightBg:      dark ? '#1A1D27' : '#FFFFFF',
    rightBorder:  dark ? '#1E2130' : '#E4E8EF',
    accent:       dark ? '#4B7BE5' : '#1B3A6B',
    accentLight:  dark ? 'rgba(75,123,229,0.12)' : 'rgba(27,58,107,0.08)',
    gold:         '#C4A55A',
    logoText:     '#FFFFFF',
    logoSub:      dark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.5)',
    headline:     '#FFFFFF',
    headlineSub:  dark ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.55)',
    chipBg:       dark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
    chipBorder:   dark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.12)',
    chipText:     dark ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.65)',
    footerText:   dark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.3)',
    supportEmail: dark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.6)',
    formTitle:    dark ? '#E8ECF4' : '#0D1526',
    formSub:      '#6B7280',
    label:        '#6B7280',
    inputBg:      dark ? '#0F1117' : '#F8FAFC',
    inputBorder:  dark ? '#2D3148' : '#D1D9E6',
    inputFocus:   dark ? '#4B7BE5' : '#1B3A6B',
    inputColor:   dark ? '#E8ECF4' : '#0D1526',
    remember:     '#6B7280',
    forgot:       dark ? '#4B7BE5' : '#1B3A6B',
    btnBg:        dark ? '#4B7BE5' : '#1B3A6B',
    btnText:      '#FFFFFF',
    secBg:        dark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
    secBorder:    dark ? '#1E2130' : '#E4E8EF',
    secText:      dark ? '#3D4460' : '#9CA3AF',
    secCheck:     dark ? '#4B7BE5' : '#1B3A6B',
    errorBg:      dark ? 'rgba(229,72,77,0.08)' : 'rgba(229,72,77,0.05)',
    errorBorder:  dark ? 'rgba(229,72,77,0.2)' : 'rgba(229,72,77,0.15)',
    errorText:    dark ? '#E5484D' : '#C42B30',
    toggleBg:     dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
    toggleBorder: dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
    toggleText:   'rgba(255,255,255,0.6)',
  }

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F2F5', display: 'grid', gridTemplateColumns: '1.05fr 0.95fr' }}>
        <div style={{ background: '#1B3A6B' }} />
        <div style={{ background: '#FFFFFF' }} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: 'Inter', sans-serif; }
        .login-root { display: grid; grid-template-columns: 1.05fr 0.95fr; min-height: 100vh; }
        .login-left { display: flex; flex-direction: column; padding: 48px 52px; position: relative; }
        .login-right { display: flex; align-items: center; justify-content: center; padding: 48px 56px; position: relative; }
        .theme-toggle { position: absolute; top: 20px; right: 20px; display: flex; align-items: center; gap: 6px; padding: 6px 13px; border-radius: 6px; font-size: 11px; font-weight: 500; cursor: pointer; border: 1px solid; transition: all 0.2s; letter-spacing: 0.02em; font-family: 'Inter', sans-serif; }
        .form-input { width: 100%; padding: 10px 14px; border-radius: 7px; border: 1px solid; font-size: 13px; font-family: 'Inter', sans-serif; outline: none; transition: border-color 0.15s, box-shadow 0.15s; }
        .form-input::placeholder { color: #A0AABB; }
        .login-btn { width: 100%; padding: 11px; border: none; border-radius: 7px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; letter-spacing: 0.01em; transition: all 0.15s; }
        .login-btn:not(:disabled):hover { filter: brightness(1.08); }
        .login-btn:not(:disabled):active { transform: scale(0.99); }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @media (max-width: 768px) { .login-root { grid-template-columns: 1fr; } .login-left { display: none; } }
      `}</style>

      <div className="login-root" style={{ background: C.pageBg }}>

        {/* PANNEAU GAUCHE */}
        <div className="login-left" style={{ background: C.leftBg, borderRight: `1px solid ${C.leftBorder}` }}>

          <button className="theme-toggle" onClick={toggleTheme}
            style={{ background: C.toggleBg, borderColor: C.toggleBorder, color: C.toggleText }}>
            {dark ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                </svg>
                Mode clair
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                Mode sombre
              </>
            )}
          </button>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '52px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: C.logoText, letterSpacing: '-0.01em' }}>
                Systeme de gestion municipale
              </div>
              <div style={{ fontSize: '10px', color: C.logoSub, marginTop: '2px', fontWeight: 400 }}>
                Plateforme numerique
              </div>
            </div>
          </div>

          {/* Contenu principal */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: '34px', fontWeight: 300, color: C.headline, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '8px' }}>
              La commune,
            </div>
            <div style={{ fontSize: '34px', fontWeight: 600, color: C.headline, letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '48px' }}>
              digitalisee.
            </div>

            <div style={{ width: '40px', height: '2px', background: C.gold, borderRadius: '1px', marginBottom: '28px' }} />

            <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.headlineSub, marginBottom: '16px' }}>
              Modules disponibles
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {MODULES.map((m) => (
                <div key={m} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 11px', borderRadius: '6px',
                  background: C.chipBg, border: `1px solid ${C.chipBorder}`,
                }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: C.gold, flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 400, color: C.chipText }}>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: '48px' }}>
            <div style={{ fontSize: '11px', color: C.footerText, marginBottom: '8px' }}>
              Acces restreint au personnel autorise &copy; {new Date().getFullYear()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
              <span style={{ fontSize: '11px', color: C.footerText }}>Support</span>
              <a href="mailto:lyonnelmboumba2003@gmail.com"
                style={{ fontSize: '11px', color: C.supportEmail, textDecoration: 'none', fontWeight: 500 }}>
                lyonnelmboumba2003@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* PANNEAU DROIT */}
        <div className="login-right" style={{ background: C.rightBg, borderLeft: `1px solid ${C.rightBorder}` }}>

          {/* Filigrane sceau de Gamba */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '420px', height: '420px',
            backgroundImage: `url('${COAT_OF_ARMS}')`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            opacity: 0.06,
            pointerEvents: 'none',
            zIndex: 0,
          }} />

          {/* Formulaire */}
          <div style={{ width: '100%', maxWidth: '340px', position: 'relative', zIndex: 1 }}>

            <div style={{ marginBottom: '36px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.accent, marginBottom: '10px' }}>
                Espace securise
              </div>
              <div style={{ fontSize: '26px', fontWeight: 600, color: C.formTitle, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Connexion
              </div>
              <div style={{ fontSize: '13px', color: C.formSub, lineHeight: 1.6 }}>
                Identifiez-vous avec vos identifiants fournis par l&apos;administrateur.
              </div>
            </div>

            <form onSubmit={handleLogin}>
              {error && (
                <div style={{
                  background: C.errorBg, border: `1px solid ${C.errorBorder}`,
                  borderRadius: '7px', padding: '10px 14px',
                  fontSize: '13px', color: C.errorText, marginBottom: '16px', lineHeight: 1.5,
                }}>
                  {error}{blocked && blockedUntil && ` Temps restant : ${getRemainingTime()}.`}
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.label, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Adresse email
                </label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="malonda@mail.com"
                  autoComplete="email"
                  disabled={loading || blocked}
                  required
                  style={{ background: C.inputBg, borderColor: C.inputBorder, color: C.inputColor }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.inputFocus
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accentLight}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.inputBorder
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: C.label, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                  Mot de passe
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  disabled={loading || blocked}
                  required
                  style={{ background: C.inputBg, borderColor: C.inputBorder, color: C.inputColor }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = C.inputFocus
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${C.accentLight}`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = C.inputBorder
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: C.remember, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: '13px', height: '13px', accentColor: C.accent }} />
                  Rester connecte
                </label>
                <a href="/mot-de-passe-oublie" style={{ fontSize: '12px', color: C.forgot, textDecoration: 'none', fontWeight: 500 }}>
                  Mot de passe oublie ?
                </a>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading || blocked}
                style={{ background: C.btnBg, color: C.btnText }}
              >
                {loading ? 'Verification en cours...' : blocked ? 'Acces temporairement bloque' : 'Se connecter'}
              </button>
            </form>

            <div style={{
              marginTop: '24px', padding: '12px 14px',
              background: C.secBg, borderRadius: '7px', border: `1px solid ${C.secBorder}`,
            }}>
              {[
                'Connexion chiffree HTTPS',
                "Session expiree apres 8h d'inactivite",
                'Toute tentative non autorisee est enregistree',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.secText, marginBottom: '5px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.secCheck} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}