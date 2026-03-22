'use client'

import { formatDate, hasModuleAccess } from '@/lib/utils'

interface Stats {
  actes:     number | null
  habitants: number | null
  retard:    number | null
  courriers: number
  projets:   number | null
  agents:    number
  parcelles: number | null
  marches:   number | null
}

const TYPE_LABELS: Record<string, string> = {
  naissance: 'Naissance',
  mariage:   'Mariage',
  deces:     'Deces',
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  naissance: { bg: 'var(--info-light)',    color: 'var(--info)' },
  mariage:   { bg: 'var(--success-light)', color: 'var(--success)' },
  deces:     { bg: 'var(--surface3)',      color: 'var(--text3)' },
}

const STATUT_COLORS: Record<string, { bg: string; color: string }> = {
  demarrage: { bg: 'var(--info-light)',    color: 'var(--info)' },
  en_cours:  { bg: 'var(--success-light)', color: 'var(--success)' },
  termine:   { bg: 'var(--surface3)',      color: 'var(--text3)' },
  suspendu:  { bg: 'var(--warning-light)', color: 'var(--warning)' },
}

export default function DashboardClient({
  stats,
  recentActes,
  paiementsMois,
  recentProjets,
  prenom,
  modulesAutorises,
  role,
}: {
  stats: Stats
  recentActes: Record<string, string>[]
  paiementsMois: Record<string, string>[]
  recentProjets: Record<string, unknown>[]
  prenom: string
  modulesAutorises: string[] | null
  role: string
}) {
  const totalEncaisse = paiementsMois
    .filter((p) => p.statut === 'paye')
    .reduce((s, p) => s + parseFloat(p.montant_paye ?? '0'), 0)

  const now = new Date()
  const heure = now.getHours()
  const salutation = heure < 12 ? 'Bonjour' : heure < 18 ? 'Bon apres-midi' : 'Bonsoir'

  const showCivil    = hasModuleAccess(role, modulesAutorises, 'civil')
  const showHabitants= hasModuleAccess(role, modulesAutorises, 'habitants')
  const showTaxes    = hasModuleAccess(role, modulesAutorises, 'taxes')
  const showDevlocal = hasModuleAccess(role, modulesAutorises, 'devlocal')
  const showFoncier  = hasModuleAccess(role, modulesAutorises, 'foncier')
  const showMarches  = hasModuleAccess(role, modulesAutorises, 'marches')

  const allCards = [
    { key: 'civil',      show: showCivil,     label: 'Actes civils',     value: stats.actes,     sub: 'enregistres',      variant: 'default' },
    { key: 'habitants',  show: showHabitants, label: 'Habitants',        value: stats.habitants,  sub: 'dans le registre', variant: 'default' },
    { key: 'taxes',      show: showTaxes,     label: 'Taxes en retard',  value: stats.retard,     sub: 'a relancer',       variant: (stats.retard ?? 0) > 0 ? 'danger' : 'default' },
    { key: 'courriers',  show: true,          label: 'Courriers',        value: stats.courriers,  sub: 'en attente',       variant: stats.courriers > 0 ? 'warning' : 'default' },
    { key: 'devlocal',   show: showDevlocal,  label: 'Projets en cours', value: stats.projets,    sub: 'dev. local',       variant: 'default' },
    { key: 'personnel',  show: true,          label: 'Agents actifs',    value: stats.agents,     sub: 'personnel',        variant: 'default' },
    { key: 'foncier',    show: showFoncier,   label: 'Parcelles',        value: stats.parcelles,  sub: 'enregistrees',     variant: 'default' },
    { key: 'marches',    show: showMarches,   label: 'Marches publics',  value: stats.marches,    sub: 'enregistres',      variant: 'default' },
  ]

  const visibleCards = allCards.filter((c) => c.show)
  const cols = Math.min(visibleCards.length, 4)

  const moisLabels = ['Oct', 'Nov', 'Dec', 'Jan', 'Fev', 'Mar']
  const barData = [3, 7, 5, 9, 6, recentActes.length]
  const maxBar = Math.max(...barData, 1)

  return (
    <div style={{ maxWidth: '1200px' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {salutation}, {prenom}
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px', fontWeight: 500 }}>
          {formatDate(new Date().toISOString(), 'EEEE d MMMM yyyy')} &bull; Tableau de bord
        </p>
      </div>

      {/* Stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '14px',
        marginBottom: '28px',
      }}>
        {visibleCards.map((card) => (
          <div key={card.key} style={{
            background: 'var(--surface)',
            border: `1px solid ${card.variant === 'danger' ? 'var(--danger)' : card.variant === 'warning' ? 'var(--warning)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            boxShadow: 'var(--shadow-sm)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: card.variant === 'danger' ? 'var(--danger)' : card.variant === 'warning' ? 'var(--warning)' : 'var(--accent)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            }} />
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '10px' }}>
              {card.label}
            </div>
            <div style={{
              fontSize: '32px', fontWeight: 700,
              color: card.variant === 'danger' ? 'var(--danger)' : card.variant === 'warning' ? 'var(--warning)' : 'var(--text)',
              letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {card.value !== null ? (card.value ?? 0).toLocaleString() : '-'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text4)', marginTop: '6px', fontWeight: 500 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      {(showCivil || showTaxes || showDevlocal) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: [showCivil, showTaxes, showDevlocal].filter(Boolean).length === 1 ? '1fr' : '1fr 1fr',
          gap: '14px',
          marginBottom: '28px',
        }}>

          {/* Actes civils */}
          {showCivil && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Actes enregistres</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', fontWeight: 500 }}>6 derniers mois</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                {barData.map((val, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text3)' }}>{val}</div>
                    <div style={{
                      width: '100%', borderRadius: '4px 4px 0 0',
                      height: `${Math.max((val / maxBar) * 90, 4)}px`,
                      background: i === barData.length - 1 ? 'var(--accent)' : 'var(--border)',
                      transition: 'height 0.3s ease',
                    }} />
                    <div style={{ fontSize: '10px', color: 'var(--text4)', fontWeight: 600 }}>{moisLabels[i]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recettes taxes */}
          {showTaxes && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Recettes encaissees</div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', fontWeight: 500 }}>50 derniers paiements</div>
              </div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: 'var(--success)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {totalEncaisse.toLocaleString('fr-FR')}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text3)', marginTop: '4px' }}>FCFA</div>
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'var(--text3)', marginBottom: '6px' }}>
                  <span>Taux de recouvrement</span>
                  <span>{paiementsMois.length > 0 ? Math.round((paiementsMois.filter((p) => p.statut === 'paye').length / paiementsMois.length) * 100) : 0}%</span>
                </div>
                <div style={{ height: '6px', background: 'var(--surface3)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '3px', background: 'var(--success)',
                    width: `${paiementsMois.length > 0 ? Math.round((paiementsMois.filter((p) => p.statut === 'paye').length / paiementsMois.length) * 100) : 0}%`,
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* Projets recents devlocal */}
          {showDevlocal && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Projets recents</div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', fontWeight: 500 }}>Dev. local</div>
                </div>
                <a href="/dashboard/devlocal" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', padding: '3px 8px', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)' }}>
                  VOIR TOUT
                </a>
              </div>
              {recentProjets.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text4)', textAlign: 'center', padding: '20px 0' }}>
                  Aucun projet enregistre
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentProjets.map((p, i) => {
                    const projet = p as Record<string, unknown>
                    const entrep = projet.entrepreneur as Record<string, string> | null
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < recentProjets.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{projet.intitule as string}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                            {entrep?.raison_sociale ?? entrep?.nom ?? '-'}
                          </div>
                        </div>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          ...STATUT_COLORS[projet.statut as string] ?? { bg: 'var(--surface3)', color: 'var(--text3)' },
                        }}>
                          {projet.statut as string}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Derniers actes civils */}
      {showCivil && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>Derniers actes civils</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', fontWeight: 500 }}>Activite recente</div>
            </div>
            <a href="/dashboard/civil" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', letterSpacing: '0.03em', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent)' }}>
              VOIR TOUT
            </a>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)' }}>
                {['N. ACTE', 'NOM', 'TYPE', 'DATE'].map((h) => (
                  <th key={h} style={{ padding: '9px 20px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text4)', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentActes.map((a, i) => (
                <tr key={a.numero_acte} style={{ borderBottom: i < recentActes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <td style={{ padding: '11px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text3)', fontWeight: 500 }}>{a.numero_acte}</td>
                  <td style={{ padding: '11px 20px', fontWeight: 600, color: 'var(--text)' }}>{a.nom_principal}</td>
                  <td style={{ padding: '11px 20px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-sm)', letterSpacing: '0.03em', ...TYPE_COLORS[a.type_acte] }}>
                      {TYPE_LABELS[a.type_acte] ?? a.type_acte}
                    </span>
                  </td>
                  <td style={{ padding: '11px 20px', color: 'var(--text3)', fontSize: '12px', fontWeight: 500 }}>{formatDate(a.date_evenement)}</td>
                </tr>
              ))}
              {recentActes.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text4)', fontSize: '13px', fontWeight: 500 }}>
                    Aucun acte enregistre pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Message si aucun module graphique */}
      {!showCivil && !showTaxes && !showDevlocal && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px', textAlign: 'center', color: 'var(--text3)', fontSize: '13px', boxShadow: 'var(--shadow-sm)' }}>
          Tableau de bord configure selon vos modules autorises.
        </div>
      )}
    </div>
  )
}