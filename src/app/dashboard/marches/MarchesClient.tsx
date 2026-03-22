'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge, { badgeStatutMarche } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatDate, LABELS_STATUT_MARCHE, formatMontant, generateReference, SERVICES_MAIRIE } from '@/lib/utils'
import type { Marche, RoleUtilisateur } from '@/types'

const EMPTY = {
  numero_marche: '', objet: '', type_marche: 'appel_offres', prestataire: '',
  montant_fcfa: '', date_attribution: '', date_debut: '', date_fin_prevue: '',
  avancement: '0', statut: 'preparation', service_concerne: '', observations: '',
}

export default function MarchesClient({ marches: init, role, mairieId }: {
  marches: Marche[]; role: RoleUtilisateur; mairieId: string
}) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [marches, setMarches] = useState<Marche[]>(init)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const canWrite = role === 'admin' || role === 'senior'
  const filtered = marches.filter((m) => {
    const s = search.toLowerCase()
    const match = !s || m.objet.toLowerCase().includes(s) || m.numero_marche.toLowerCase().includes(s) ||
      (m.prestataire ?? '').toLowerCase().includes(s)
    return match && (!filterStatut || m.statut === filterStatut)
  })

  function f(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  async function save() {
    setErr('')
    if (!form.objet.trim()) { setErr("L'objet du marche est obligatoire."); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }
    const ref = form.numero_marche.trim() || generateReference('M')
    const { data, error } = await sb.from('marches').insert({
      ...form, numero_marche: ref,
      avancement: parseInt(form.avancement),
      montant_fcfa: form.montant_fcfa ? parseFloat(form.montant_fcfa) : null,
      date_attribution: form.date_attribution || null,
      date_debut: form.date_debut || null,
      date_fin_prevue: form.date_fin_prevue || null,
      mairie_id: mairieId, created_by: user.id,
    }).select().single()
    if (error) { setErr(error.message); setSaving(false); return }
    setMarches((p) => [data as Marche, ...p])
    setModalOpen(false); setForm({ ...EMPTY }); setSaving(false)
    startT(() => router.refresh())
  }

  async function updateAvancement(id: string, avancement: number) {
    const sb = createClient()
    const statut = avancement === 100 ? 'termine' : 'en_cours'
    await sb.from('marches').update({ avancement, statut }).eq('id', id)
    setMarches((p) => p.map((m) => m.id === id ? { ...m, avancement, statut: statut as Marche['statut'] } : m))
  }

  const enCours  = marches.filter((m) => m.statut === 'en_cours').length
  const ouverts  = marches.filter((m) => m.statut === 'ouvert').length
  const budget   = marches.filter((m) => m.montant_fcfa).reduce((s, m) => s + (m.montant_fcfa ?? 0), 0)

  return (
    <div>
      <PageHeader title="Marches publics" description="Contrats, appels d'offres et suivi d'avancement."
        action={canWrite ? <Button onClick={() => { setModalOpen(true); setErr('') }}>+ Nouveau marche</Button> : undefined}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Budget total engage" value={formatMontant(budget)} sub={`${marches.length} marches`} />
        <StatCard label="Appels d'offres ouverts" value={ouverts} />
        <StatCard label="En cours" value={enCours} />
        <StatCard label="Termines" value={marches.filter((m) => m.statut === 'termine').length} />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Objet, reference, prestataire..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ width: '160px' }}>
          <option value="">Tous statuts</option>
          <option value="preparation">Preparation</option>
          <option value="ouvert">Ouvert</option>
          <option value="attribue">Attribue</option>
          <option value="en_cours">En cours</option>
          <option value="termine">Termine</option>
          <option value="annule">Annule</option>
        </select>
        {(search || filterStatut) && <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatut('') }}>Reinitialiser</Button>}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>{filtered.length} resultat{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <Table headers={['Reference', 'Objet', 'Prestataire', 'Montant', 'Debut', 'Fin prevue', 'Avancement', 'Statut', '']} empty="Aucun marche enregistre">
        {filtered.map((m) => (
          <Tr key={m.id}>
            <Td mono style={{ fontSize: '11px' }}>{m.numero_marche}</Td>
            <Td><span style={{ fontWeight: 500 }}>{m.objet}</span></Td>
            <Td muted>{m.prestataire ?? <span style={{ color: 'var(--text3)' }}>-</span>}</Td>
            <Td muted>{formatMontant(m.montant_fcfa)}</Td>
            <Td muted>{formatDate(m.date_debut)}</Td>
            <Td muted>{formatDate(m.date_fin_prevue)}</Td>
            <Td style={{ minWidth: '120px' }}><ProgressBar value={m.avancement} showLabel /></Td>
            <Td><Badge variant={badgeStatutMarche(m.statut)}>{LABELS_STATUT_MARCHE[m.statut]}</Badge></Td>
            <Td>
              {canWrite && m.statut === 'en_cours' && (
                <Button variant="ghost" size="sm" onClick={() => updateAvancement(m.id, Math.min(100, m.avancement + 10))}>+10%</Button>
              )}
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Enregistrer un marche" size="lg"
        footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button><Button onClick={save} loading={saving}>Enregistrer</Button></>}>
        {err && <div style={{ background: '#FDECEA', border: '1px solid #F1AEAD', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>{err}</div>}
        <Field label="Objet du marche" required>
          <input type="text" value={form.objet} onChange={(e) => f('objet', e.target.value)} />
        </Field>
        <FieldRow>
          <Field label="Type de marche" required half>
            <select value={form.type_marche} onChange={(e) => f('type_marche', e.target.value)}>
              <option value="appel_offres">Appel d'offres</option>
              <option value="gre_a_gre">Gre a gre</option>
              <option value="direct">Direct</option>
            </select>
          </Field>
          <Field label="Reference" half>
            <input type="text" value={form.numero_marche} onChange={(e) => f('numero_marche', e.target.value)} placeholder="Auto-genere si vide" style={{ fontFamily: 'DM Mono, monospace' }} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Prestataire" half><input type="text" value={form.prestataire} onChange={(e) => f('prestataire', e.target.value)} /></Field>
          <Field label="Montant (FCFA)" half><input type="number" value={form.montant_fcfa} onChange={(e) => f('montant_fcfa', e.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Statut" required half>
            <select value={form.statut} onChange={(e) => f('statut', e.target.value)}>
              <option value="preparation">Preparation</option>
              <option value="ouvert">Ouvert</option>
              <option value="attribue">Attribue</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Termine</option>
              <option value="annule">Annule</option>
            </select>
          </Field>
          <Field label="Service concerne" half>
            <select value={form.service_concerne} onChange={(e) => f('service_concerne', e.target.value)}>
              <option value="">-</option>
              {SERVICES_MAIRIE.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Date d'attribution" half><input type="date" value={form.date_attribution} onChange={(e) => f('date_attribution', e.target.value)} /></Field>
          <Field label="Date de debut" half><input type="date" value={form.date_debut} onChange={(e) => f('date_debut', e.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Fin prevue" half><input type="date" value={form.date_fin_prevue} onChange={(e) => f('date_fin_prevue', e.target.value)} /></Field>
          <Field label="Avancement (%)" half><input type="number" min="0" max="100" value={form.avancement} onChange={(e) => f('avancement', e.target.value)} /></Field>
        </FieldRow>
        <Field label="Observations"><textarea value={form.observations} onChange={(e) => f('observations', e.target.value)} style={{ height: '60px' }} /></Field>
      </Modal>
    </div>
  )
}
