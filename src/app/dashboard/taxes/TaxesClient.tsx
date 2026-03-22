'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge, { badgeStatutPaiement } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import { formatDate, formatMontant, LABELS_TYPE_TAXE, LABELS_STATUT_PAIEMENT, generateReference } from '@/lib/utils'
import type { PaiementTaxe, RoleUtilisateur } from '@/types'

interface Contribuable { id: string; nom: string; type_contribuable: string }

interface Props {
  paiements: PaiementTaxe[]
  paiementsAnnee: Record<string, string>[]
  annee: number
  stats: { retard: number; paye: number; total: number }
  role: RoleUtilisateur
  mairieId: string
}

const MONTANTS_DEFAUT: Record<string, number> = {
  patente: 85000, fonciere: 12000, occupation: 8500, autre: 0,
}

const MOIS_LABELS = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec']

const EMPTY = {
  nom_contribuable: '',
  type_contribuable: 'particulier',
  type_taxe: 'patente',
  annee_exercice: new Date().getFullYear().toString(),
  montant_du: '85000',
  montant_paye: '',
  date_paiement: new Date().toISOString().split('T')[0],
  mode_paiement: 'especes',
  statut: 'paye',
  date_echeance: '',
  observations: '',
}

export default function TaxesClient({ paiements: init, paiementsAnnee, annee, stats, role, mairieId }: Props) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [paiements, setPaiements] = useState<PaiementTaxe[]>(init)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editPaiement, setEditPaiement] = useState<PaiementTaxe | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [recuPaiement, setRecuPaiement] = useState<PaiementTaxe | null>(null)
  const [tab, setTab] = useState<'liste' | 'mensuel'>('liste')

  const canWrite = ['admin', 'senior', 'saisie'].includes(role)
  const canEdit  = role === 'admin' || role === 'senior'

  // Calcul tableau mensuel
  const tableauMensuel = MOIS_LABELS.map((label, i) => {
    const moisNum = String(i + 1).padStart(2, '0')
    const paiementsMois = paiementsAnnee.filter((p) => {
      const date = p.date_paiement ?? p.created_at
      return date && date.startsWith(`${annee}-${moisNum}`)
    })
    const total = paiementsMois.reduce((s, p) => s + parseFloat(p.montant_paye ?? '0'), 0)
    return { label, mois: moisNum, total, nb: paiementsMois.length }
  })

  const totalAnnee = tableauMensuel.reduce((s, m) => s + m.total, 0)
  const moisEnCours = new Date().getMonth()
  const totalMoisEnCours = tableauMensuel[moisEnCours]?.total ?? 0

  const filtered = paiements.filter((p) => {
    const contrib = p.contribuable as unknown as Contribuable | null
    const nom = contrib?.nom ?? ''
    const matchS = !search || nom.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference_recu ?? '').toLowerCase().includes(search.toLowerCase())
    return matchS && (!filterStatut || p.statut === filterStatut)
  })

  function f(field: string, value: string) {
    setForm((p) => {
      const next = { ...p, [field]: value }
      if (field === 'type_taxe') next.montant_du = String(MONTANTS_DEFAUT[value] ?? 0)
      return next
    })
  }

  function openNew() {
    setEditPaiement(null)
    setForm({ ...EMPTY })
    setErr('')
    setModalOpen(true)
  }

  function openEdit(p: PaiementTaxe) {
    const contrib = p.contribuable as unknown as Contribuable | null
    setEditPaiement(p)
    setForm({
      nom_contribuable:  contrib?.nom ?? '',
      type_contribuable: contrib?.type_contribuable ?? 'particulier',
      type_taxe:         p.type_taxe,
      annee_exercice:    String(p.annee_exercice),
      montant_du:        String(p.montant_du),
      montant_paye:      String(p.montant_paye ?? p.montant_du),
      date_paiement:     p.date_paiement ?? new Date().toISOString().split('T')[0],
      mode_paiement:     p.mode_paiement ?? 'especes',
      statut:            p.statut,
      date_echeance:     p.date_echeance ?? '',
      observations:      p.observations ?? '',
    })
    setErr('')
    setModalOpen(true)
  }

  async function save() {
    setErr('')
    if (!form.nom_contribuable.trim()) { setErr('Le nom du contribuable est obligatoire.'); return }
    if (!form.montant_du)              { setErr('Le montant est obligatoire.'); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    if (editPaiement) {
      // Modification
      const { data, error } = await sb
        .from('paiements_taxes')
        .update({
          type_taxe:      form.type_taxe,
          annee_exercice: parseInt(form.annee_exercice),
          montant_du:     parseFloat(form.montant_du),
          montant_paye:   form.montant_paye ? parseFloat(form.montant_paye) : null,
          date_paiement:  form.statut === 'paye' ? form.date_paiement : null,
          mode_paiement:  form.mode_paiement,
          statut:         form.statut,
          date_echeance:  form.date_echeance || null,
          observations:   form.observations || null,
        })
        .eq('id', editPaiement.id)
        .select('*, contribuable:contribuables(nom, type_contribuable)')
        .single()
      if (error) { setErr(error.message); setSaving(false); return }
      setPaiements((p) => p.map((x) => x.id === editPaiement.id ? data as PaiementTaxe : x))
    } else {
      // Creation : on cree d'abord le contribuable
      const { data: contrib, error: contribErr } = await sb
        .from('contribuables')
        .insert({
          nom:               form.nom_contribuable.trim(),
          type_contribuable: form.type_contribuable,
          mairie_id:         mairieId,
          created_by:        user.id,
        })
        .select()
        .single()
      if (contribErr) { setErr(contribErr.message); setSaving(false); return }

      const ref = form.statut === 'paye' ? generateReference('R') : null
      const { data, error } = await sb
        .from('paiements_taxes')
        .insert({
          contribuable_id: contrib.id,
          type_taxe:       form.type_taxe,
          annee_exercice:  parseInt(form.annee_exercice),
          montant_du:      parseFloat(form.montant_du),
          montant_paye:    form.montant_paye ? parseFloat(form.montant_paye) : null,
          date_paiement:   form.statut === 'paye' ? form.date_paiement : null,
          mode_paiement:   form.mode_paiement,
          reference_recu:  ref,
          statut:          form.statut,
          date_echeance:   form.date_echeance || null,
          observations:    form.observations || null,
          mairie_id:       mairieId,
          created_by:      user.id,
        })
        .select('*, contribuable:contribuables(nom, type_contribuable)')
        .single()
      if (error) { setErr(error.message); setSaving(false); return }
      setPaiements((p) => [data as PaiementTaxe, ...p])
    }

    setModalOpen(false)
    setEditPaiement(null)
    setForm({ ...EMPTY })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function softDelete(id: string) {
    if (!confirm('Desactiver ce paiement ?')) return
    const sb = createClient()
    await sb.from('paiements_taxes').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setPaiements((p) => p.filter((x) => x.id !== id))
  }

  const maxMensuel = Math.max(...tableauMensuel.map((m) => m.total), 1)

  return (
    <div>
      <PageHeader
        title="Taxes et recettes"
        description="Enregistrement des paiements, suivi des contribuables, tableau mensuel."
        action={canWrite ? <Button onClick={openNew}>+ Enregistrer paiement</Button> : undefined}
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label={`Encaisse en ${MOIS_LABELS[moisEnCours]}`} value={formatMontant(totalMoisEnCours)} sub="mois en cours" />
        <StatCard label={`Total ${annee}`} value={formatMontant(totalAnnee)} sub="annee en cours" />
        <StatCard label="En retard" value={stats.retard} sub="a relancer" variant={stats.retard > 0 ? 'danger' : 'default'} />
        <StatCard label="Paiements enregistres" value={stats.total} />
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        {(['liste', 'mensuel'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', fontSize: '13px', border: 'none', background: 'none',
            cursor: 'pointer', fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--accent)' : 'var(--text2)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {t === 'liste' ? 'Liste des paiements' : `Tableau mensuel ${annee}`}
          </button>
        ))}
      </div>

      {/* ONGLET LISTE */}
      {tab === 'liste' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Rechercher par nom ou reference..." value={search}
              onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ width: '160px' }}>
              <option value="">Tous statuts</option>
              <option value="paye">Paye</option>
              <option value="en_attente">En attente</option>
              <option value="en_retard">En retard</option>
              <option value="exonere">Exonere</option>
            </select>
            {(search || filterStatut) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatut('') }}>Reinitialiser</Button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
              {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Table
            headers={['Contribuable', 'Type', 'Annee', 'Montant du', 'Montant paye', 'Date', 'Reference', 'Statut', '']}
            empty="Aucun paiement enregistre"
          >
            {filtered.map((p) => {
              const contrib = p.contribuable as unknown as Contribuable | null
              return (
                <Tr key={p.id}>
                  <Td><span style={{ fontWeight: 600 }}>{contrib?.nom ?? '-'}</span></Td>
                  <Td muted>{LABELS_TYPE_TAXE[p.type_taxe] ?? p.type_taxe}</Td>
                  <Td mono muted>{p.annee_exercice}</Td>
                  <Td>{formatMontant(p.montant_du)}</Td>
                  <Td>{p.montant_paye ? formatMontant(p.montant_paye) : <span style={{ color: 'var(--text3)' }}>-</span>}</Td>
                  <Td muted>{formatDate(p.date_paiement)}</Td>
                  <Td mono muted style={{ fontSize: '11px' }}>{p.reference_recu ?? '-'}</Td>
                  <Td><Badge variant={badgeStatutPaiement(p.statut)}>{LABELS_STATUT_PAIEMENT[p.statut]}</Badge></Td>
                  <Td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {p.statut === 'paye' && (
                        <Button variant="ghost" size="sm" onClick={() => setRecuPaiement(p)}>Recu</Button>
                      )}
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Modifier</Button>
                      )}
                      {role === 'admin' && (
                        <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => softDelete(p.id)}>Desactiver</Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </Table>
        </>
      )}

      {/* ONGLET MENSUEL */}
      {tab === 'mensuel' && (
        <div>
          {/* Graphique barres */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '20px',
            marginBottom: '20px', boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>
              Recettes mensuelles {annee}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px' }}>
              {tableauMensuel.map((m, i) => (
                <div key={m.mois} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                  {m.total > 0 && (
                    <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {Math.round(m.total / 1000)}k
                    </div>
                  )}
                  <div style={{
                    width: '100%', borderRadius: '3px 3px 0 0',
                    height: `${Math.max((m.total / maxMensuel) * 90, m.total > 0 ? 4 : 2)}px`,
                    background: i === moisEnCours ? 'var(--accent)' : m.total > 0 ? 'var(--accent3)' : 'var(--border)',
                    transition: 'height 0.3s ease',
                    opacity: i > moisEnCours ? 0.4 : 1,
                  }} />
                  <div style={{ fontSize: '9px', color: i === moisEnCours ? 'var(--accent)' : 'var(--text4)', fontWeight: i === moisEnCours ? 700 : 400 }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tableau detail */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  {['Mois', 'Paiements', 'Total encaisse', 'Vs mois precedent'].map((h) => (
                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text3)', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableauMensuel.map((m, i) => {
                  const precedent = i > 0 ? tableauMensuel[i - 1].total : null
                  const diff = precedent !== null && precedent > 0
                    ? Math.round(((m.total - precedent) / precedent) * 100)
                    : null
                  const isCurrent = i === moisEnCours
                  return (
                    <tr key={m.mois} style={{
                      borderBottom: '1px solid var(--border)',
                      background: isCurrent ? 'rgba(44,62,80,0.03)' : 'transparent',
                    }}>
                      <td style={{ padding: '12px 18px', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--accent)' : 'var(--text)' }}>
                        {m.label} {annee}
                        {isCurrent && (
                          <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, background: 'var(--accent)', color: 'white', padding: '1px 6px', borderRadius: '3px' }}>
                            EN COURS
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px', color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                        {m.nb > 0 ? m.nb : <span style={{ color: 'var(--text4)' }}>0</span>}
                      </td>
                      <td style={{ padding: '12px 18px', fontWeight: m.total > 0 ? 600 : 400, color: m.total > 0 ? 'var(--success)' : 'var(--text4)' }}>
                        {m.total > 0 ? formatMontant(m.total) : '-'}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {diff !== null ? (
                          <span style={{
                            fontSize: '12px', fontWeight: 600,
                            color: diff >= 0 ? 'var(--success)' : 'var(--danger)',
                          }}>
                            {diff >= 0 ? '+' : ''}{diff}%
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text4)', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {/* Total annee */}
                <tr style={{ background: 'var(--surface2)', borderTop: '2px solid var(--border)' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text)' }}>Total {annee}</td>
                  <td style={{ padding: '12px 18px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', fontWeight: 700 }}>
                    {tableauMensuel.reduce((s, m) => s + m.nb, 0)}
                  </td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--success)' }}>
                    {formatMontant(totalAnnee)}
                  </td>
                  <td style={{ padding: '12px 18px' }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal saisie */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditPaiement(null) }}
        title={editPaiement ? 'Modifier le paiement' : 'Enregistrer un paiement'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditPaiement(null) }}>Annuler</Button>
            <Button onClick={save} loading={saving}>{editPaiement ? 'Enregistrer les modifications' : 'Enregistrer'}</Button>
          </>
        }
      >
        {err && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {err}
          </div>
        )}

        <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '14px', paddingBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Contribuable
          </div>
          <FieldRow>
            <Field label="Nom ou raison sociale" required half>
              <input
                type="text"
                value={form.nom_contribuable}
                onChange={(e) => f('nom_contribuable', e.target.value)}
                placeholder="ex: Mouele Jean-Pierre ou Commerce Ondo"
                disabled={!!editPaiement}
              />
            </Field>
            <Field label="Type" required half>
              <select value={form.type_contribuable} onChange={(e) => f('type_contribuable', e.target.value)} disabled={!!editPaiement}>
                <option value="particulier">Particulier</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </Field>
          </FieldRow>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Paiement
        </div>
        <FieldRow>
          <Field label="Type de taxe" required half>
            <select value={form.type_taxe} onChange={(e) => f('type_taxe', e.target.value)}>
              <option value="patente">Patente commerciale</option>
              <option value="fonciere">Taxe fonciere</option>
              <option value="occupation">Occupation espace</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
          <Field label="Annee d'exercice" required half>
            <input type="number" value={form.annee_exercice} onChange={(e) => f('annee_exercice', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Montant du (FCFA)" required half>
            <input type="number" value={form.montant_du} onChange={(e) => f('montant_du', e.target.value)} />
          </Field>
          <Field label="Montant paye (FCFA)" half>
            <input type="number" value={form.montant_paye} onChange={(e) => f('montant_paye', e.target.value)} placeholder={form.montant_du} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Statut" required half>
            <select value={form.statut} onChange={(e) => f('statut', e.target.value)}>
              <option value="paye">Paye</option>
              <option value="en_attente">En attente</option>
              <option value="en_retard">En retard</option>
              <option value="exonere">Exonere</option>
            </select>
          </Field>
          <Field label="Mode de paiement" half>
            <select value={form.mode_paiement} onChange={(e) => f('mode_paiement', e.target.value)}>
              <option value="especes">Especes</option>
              <option value="virement">Virement</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="cheque">Cheque</option>
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Date de paiement" half>
            <input type="date" value={form.date_paiement} onChange={(e) => f('date_paiement', e.target.value)} />
          </Field>
          <Field label="Date d'echeance" half>
            <input type="date" value={form.date_echeance} onChange={(e) => f('date_echeance', e.target.value)} />
          </Field>
        </FieldRow>
        <Field label="Observations">
          <textarea value={form.observations} onChange={(e) => f('observations', e.target.value)} style={{ height: '60px' }} />
        </Field>
      </Modal>

      {/* Recu officiel */}
      {recuPaiement && (
        <RecuModal paiement={recuPaiement} onClose={() => setRecuPaiement(null)} />
      )}
    </div>
  )
}

function RecuModal({ paiement: p, onClose }: { paiement: PaiementTaxe; onClose: () => void }) {
  const contrib = p.contribuable as unknown as Contribuable | null
  return (
    <Modal open onClose={onClose} title="Recu de paiement" size="md"
      footer={<><Button variant="ghost" onClick={onClose}>Fermer</Button><Button onClick={() => window.print()}>Imprimer</Button></>}
    >
      <div id="recu-content" style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #1B4332', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6960' }}>Republique Gabonaise</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1B4332' }}>Mairie</div>
          <div style={{ marginTop: '10px', fontSize: '16px', fontWeight: 700 }}>RECU DE PAIEMENT</div>
          <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#1B4332', fontWeight: 700, marginTop: '4px' }}>{p.reference_recu}</div>
        </div>
        <div style={{ lineHeight: 2 }}>
          {[
            { l: 'Contribuable',     v: contrib?.nom ?? '-' },
            { l: 'Type de taxe',     v: LABELS_TYPE_TAXE[p.type_taxe] ?? p.type_taxe },
            { l: "Annee d'exercice", v: String(p.annee_exercice) },
            { l: 'Montant du',       v: formatMontant(p.montant_du) },
            { l: 'Montant paye',     v: formatMontant(p.montant_paye ?? p.montant_du) },
            { l: 'Mode de paiement', v: p.mode_paiement ?? '-' },
            { l: 'Date de paiement', v: formatDate(p.date_paiement, 'd MMMM yyyy') },
          ].map(({ l, v }) => (
            <div key={l} style={{ display: 'flex', gap: '8px' }}>
              <span style={{ width: '160px', flexShrink: 0, color: '#6B6960', fontSize: '12px' }}>{l}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <div style={{ display: 'inline-block', textAlign: 'center', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#6B6960', marginBottom: '36px' }}>
              Delivre le {formatDate(new Date().toISOString(), 'd MMMM yyyy')}
            </div>
            <div style={{ borderTop: '1px solid #1A1916', paddingTop: '4px', fontSize: '11px', color: '#6B6960' }}>
              Le Receveur municipal
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #recu-content { display: block !important; background: white !important; color: black !important; padding: 20px; }
        }
      `}</style>
    </Modal>
  )
}