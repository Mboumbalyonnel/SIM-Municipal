'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import type { AuditLog } from '@/types'

const ACTION_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  CREATION:      { label: 'Ajout',         bg: '#E8F5EE', color: '#1A6B3C' },
  MODIFICATION:  { label: 'Modification',  bg: '#E8F0F9', color: '#1A3A5C' },
  DESACTIVATION: { label: 'Desactivation', bg: '#FDECEA', color: '#C0392B' },
  SUPPRESSION:   { label: 'Suppression',   bg: '#FDECEA', color: '#C0392B' },
}

const TABLE_LABELS: Record<string, string> = {
  actes_civils:    'Etat civil',
  habitants:       'Habitants',
  paiements_taxes: 'Taxes',
  courriers:       'Courriers',
  entrepreneurs:   'Entrepreneurs',
  projets:         'Projets',
  agents:          'Personnel',
  conges:          'Conges',
  parcelles:       'Foncier',
  marches:         'Marches publics',
  profiles:        'Comptes utilisateurs',
}

function getDescription(log: AuditLog): string {
  const table = TABLE_LABELS[log.table_cible] ?? log.table_cible
  const after  = log.valeur_apres as Record<string, string> | null
  const before = log.valeur_avant as Record<string, string> | null

  if (log.action === 'CREATION') {
    const nom = after?.nom_principal ?? after?.nom ?? after?.objet ?? after?.intitule ?? after?.numero_acte ?? after?.numero_parcelle ?? after?.numero_marche ?? ''
    if (nom) return `A enregistre "${nom}" dans ${table}`
    return `A ajoute un nouvel enregistrement dans ${table}`
  }

  if (log.action === 'MODIFICATION') {
    const nom = after?.nom_principal ?? after?.nom ?? after?.objet ?? after?.intitule ?? after?.numero_acte ?? ''
    if (nom) return `A modifie "${nom}" dans ${table}`
    return `A modifie un enregistrement dans ${table}`
  }

  if (log.action === 'DESACTIVATION') {
    const nom = before?.nom_principal ?? before?.nom ?? before?.objet ?? before?.intitule ?? ''
    if (nom) return `A desactive "${nom}" dans ${table}`
    return `A desactive un enregistrement dans ${table}`
  }

  return `Action sur ${table}`
}

export default function AuditClient({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterTable, setFilterTable] = useState('')

  const filtered = logs.filter((l) => {
    const s = search.toLowerCase()
    const match = !s ||
      l.utilisateur_nom.toLowerCase().includes(s) ||
      getDescription(l).toLowerCase().includes(s)
    return match &&
      (!filterAction || l.action === filterAction) &&
      (!filterTable  || l.table_cible === filterTable)
  })

  // Fix compatibilite ES target — Array.from au lieu du spread sur Set
  const tables = Array.from(new Set(logs.map((l) => l.table_cible))).sort()

  const nbCreations      = logs.filter((l) => l.action === 'CREATION').length
  const nbModifications  = logs.filter((l) => l.action === 'MODIFICATION').length
  const nbDesactivations = logs.filter((l) => l.action === 'DESACTIVATION' || l.action === 'SUPPRESSION').length
  const nbUtilisateurs   = Array.from(new Set(logs.map((l) => l.utilisateur_id))).length

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Journal d&apos;activite
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '4px', fontWeight: 500 }}>
          Historique de toutes les actions effectuees dans le systeme
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Ajouts',         value: nbCreations,      color: 'var(--success)' },
          { label: 'Modifications',  value: nbModifications,  color: 'var(--info)' },
          { label: 'Desactivations', value: nbDesactivations, color: 'var(--danger)' },
          { label: 'Utilisateurs',   value: nbUtilisateurs,   color: 'var(--text)' },
        ].map((s) => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 18px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '8px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Rechercher par agent ou description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }}
        />
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={{ width: '160px' }}>
          <option value="">Toutes les actions</option>
          <option value="CREATION">Ajouts</option>
          <option value="MODIFICATION">Modifications</option>
          <option value="DESACTIVATION">Desactivations</option>
        </select>
        <select value={filterTable} onChange={(e) => setFilterTable(e.target.value)} style={{ width: '180px' }}>
          <option value="">Tous les modules</option>
          {tables.map((t) => (
            <option key={t} value={t}>{TABLE_LABELS[t] ?? t}</option>
          ))}
        </select>
        {(search || filterAction || filterTable) && (
          <button
            onClick={() => { setSearch(''); setFilterAction(''); setFilterTable('') }}
            style={{ fontSize: '12px', padding: '7px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', background: 'none', cursor: 'pointer', color: 'var(--text2)', fontWeight: 500 }}
          >
            Reinitialiser
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)', fontWeight: 500 }}>
          {filtered.length} action{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text4)', fontSize: '13px', fontWeight: 500 }}>
            Aucune action enregistree
          </div>
        ) : (
          filtered.map((l, i) => {
            const config = ACTION_CONFIG[l.action] ?? { label: l.action, bg: 'var(--surface3)', color: 'var(--text3)' }
            const module = TABLE_LABELS[l.table_cible] ?? l.table_cible
            return (
              <div key={l.id} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '14px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{
                  flexShrink: 0, width: '90px', textAlign: 'center',
                  padding: '3px 0', borderRadius: 'var(--radius-sm)',
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                  background: config.bg, color: config.color,
                }}>
                  {config.label.toUpperCase()}
                </div>

                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--accent-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: 'var(--accent)',
                }}>
                  {l.utilisateur_nom.split(' ').map((n) => n.charAt(0)).slice(0, 2).join('').toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>
                    {l.utilisateur_nom}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: 400 }}>
                    {getDescription(l)}
                  </div>
                </div>

                <div style={{
                  flexShrink: 0, fontSize: '11px', fontWeight: 600,
                  color: 'var(--text3)', background: 'var(--surface2)',
                  border: '1px solid var(--border)', padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  {module}
                </div>

                <div style={{
                  flexShrink: 0, fontSize: '11px', fontWeight: 500,
                  color: 'var(--text4)', textAlign: 'right', minWidth: '110px',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {formatDate(l.created_at, 'dd/MM/yyyy')}<br />
                  <span style={{ fontSize: '10px' }}>{formatDate(l.created_at, 'HH:mm')}</span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}