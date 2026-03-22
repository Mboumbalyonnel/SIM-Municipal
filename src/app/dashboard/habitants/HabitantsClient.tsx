'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import { formatDate } from '@/lib/utils'
import type { Habitant, RoleUtilisateur } from '@/types'

const EMPTY = {
  nom: '', prenom: '', date_naissance: '', lieu_naissance: '', nationalite: 'Gabonaise',
  sexe: '', situation_familiale: '', profession: '', numero_cni: '',
  numero_passeport: '', quartier: '', rue: '', telephone: '', email: '', observations: '',
}

export default function HabitantsClient({ habitants: init, role, mairieId }: {
  habitants: Habitant[]; role: RoleUtilisateur; mairieId: string
}) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [habitants, setHabitants] = useState<Habitant[]>(init)
  const [search, setSearch] = useState('')
  const [filterQuartier, setFilterQuartier] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editHabitant, setEditHabitant] = useState<Habitant | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const canWrite = ['admin', 'senior', 'saisie'].includes(role)
  const canEdit  = role === 'admin' || role === 'senior'

  const quartiersUniq = [...new Set(habitants.map((h) => h.quartier).filter(Boolean))] as string[]

  const filtered = habitants.filter((h) => {
    const s = search.toLowerCase()
    const match = !s || h.nom.toLowerCase().includes(s) || h.prenom.toLowerCase().includes(s) ||
      (h.numero_cni ?? '').toLowerCase().includes(s)
    return match && (!filterQuartier || h.quartier === filterQuartier)
  })

  function f(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })) }

  function openNew() {
    setEditHabitant(null)
    setForm({ ...EMPTY })
    setErr('')
    setModalOpen(true)
  }

  function openEdit(h: Habitant) {
    setEditHabitant(h)
    setForm({
      nom:               h.nom,
      prenom:            h.prenom,
      date_naissance:    h.date_naissance ?? '',
      lieu_naissance:    h.lieu_naissance ?? '',
      nationalite:       h.nationalite ?? 'Gabonaise',
      sexe:              h.sexe ?? '',
      situation_familiale: h.situation_familiale ?? '',
      profession:        h.profession ?? '',
      numero_cni:        h.numero_cni ?? '',
      numero_passeport:  h.numero_passeport ?? '',
      quartier:          h.quartier ?? '',
      rue:               h.rue ?? '',
      telephone:         h.telephone ?? '',
      email:             h.email ?? '',
      observations:      h.observations ?? '',
    })
    setErr('')
    setModalOpen(true)
  }

  async function save() {
    setErr('')
    if (!form.nom.trim()) { setErr('Le nom est obligatoire.'); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      nom:               form.nom.trim(),
      prenom:            form.prenom.trim(),
      date_naissance:    form.date_naissance || null,
      lieu_naissance:    form.lieu_naissance || null,
      nationalite:       form.nationalite || null,
      sexe:              form.sexe || null,
      situation_familiale: form.situation_familiale || null,
      profession:        form.profession || null,
      numero_cni:        form.numero_cni || null,
      numero_passeport:  form.numero_passeport || null,
      quartier:          form.quartier || null,
      rue:               form.rue || null,
      telephone:         form.telephone || null,
      email:             form.email || null,
      observations:      form.observations || null,
    }

    if (editHabitant) {
      const { data, error } = await sb
        .from('habitants').update(payload).eq('id', editHabitant.id).select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setHabitants((p) => p.map((h) => h.id === editHabitant.id ? data as Habitant : h))
    } else {
      const { data, error } = await sb
        .from('habitants').insert({ ...payload, mairie_id: mairieId, created_by: user.id }).select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setHabitants((p) => [...p, data as Habitant].sort((a, b) => a.nom.localeCompare(b.nom)))
    }

    setModalOpen(false)
    setEditHabitant(null)
    setForm({ ...EMPTY })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function softDelete(id: string) {
    if (!confirm('Desactiver cette fiche ?')) return
    const sb = createClient()
    await sb.from('habitants').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setHabitants((p) => p.filter((h) => h.id !== id))
  }

  return (
    <div>
      <PageHeader
        title="Registre des habitants"
        description="Fiches individuelles des habitants enregistres a la mairie."
        action={canWrite ? <Button onClick={openNew}>+ Nouvel habitant</Button> : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Habitants enregistres" value={habitants.length} />
        <StatCard label="Quartiers couverts" value={quartiersUniq.length} />
        <StatCard label="Resultat filtre" value={filtered.length} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Nom, prenom ou numero CNI..." value={search}
          onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
        <select value={filterQuartier} onChange={(e) => setFilterQuartier(e.target.value)} style={{ width: '180px' }}>
          <option value="">Tous les quartiers</option>
          {quartiersUniq.map((q) => <option key={q} value={q}>{q}</option>)}
        </select>
        {(search || filterQuartier) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterQuartier('') }}>Reinitialiser</Button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
          {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Table headers={['Nom complet', 'Date naissance', 'Quartier', 'Situation', 'N. CNI', 'Telephone', '']} empty="Aucun habitant enregistre">
        {filtered.map((h) => (
          <Tr key={h.id}>
            <Td><span style={{ fontWeight: 600 }}>{h.nom} {h.prenom}</span></Td>
            <Td muted>{formatDate(h.date_naissance)}</Td>
            <Td muted>{h.quartier ?? '-'}</Td>
            <Td>{h.situation_familiale ? <Badge variant="gray">{h.situation_familiale}</Badge> : '-'}</Td>
            <Td mono muted style={{ fontSize: '11px' }}>{h.numero_cni ?? '-'}</Td>
            <Td muted>{h.telephone ?? '-'}</Td>
            <Td>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => openEdit(h)}>Modifier</Button>
                )}
                {role === 'admin' && (
                  <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => softDelete(h.id)}>Desactiver</Button>
                )}
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditHabitant(null) }}
        title={editHabitant ? 'Modifier la fiche habitant' : 'Ajouter un habitant'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditHabitant(null) }}>Annuler</Button>
            <Button onClick={save} loading={saving}>{editHabitant ? 'Enregistrer les modifications' : 'Enregistrer'}</Button>
          </>
        }
      >
        {err && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {err}
          </div>
        )}
        <FieldRow>
          <Field label="Nom" required half><input type="text" value={form.nom} onChange={(e) => f('nom', e.target.value)} /></Field>
          <Field label="Prenom(s)" half><input type="text" value={form.prenom} onChange={(e) => f('prenom', e.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Date de naissance" half><input type="date" value={form.date_naissance} onChange={(e) => f('date_naissance', e.target.value)} /></Field>
          <Field label="Lieu de naissance" half><input type="text" value={form.lieu_naissance} onChange={(e) => f('lieu_naissance', e.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Sexe" half>
            <select value={form.sexe} onChange={(e) => f('sexe', e.target.value)}>
              <option value="">-</option>
              <option value="M">Masculin</option>
              <option value="F">Feminin</option>
            </select>
          </Field>
          <Field label="Situation familiale" half>
            <select value={form.situation_familiale} onChange={(e) => f('situation_familiale', e.target.value)}>
              <option value="">-</option>
              <option value="celibataire">Celibataire</option>
              <option value="marie">Marie(e)</option>
              <option value="divorce">Divorce(e)</option>
              <option value="veuf">Veuf / Veuve</option>
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Profession" half><input type="text" value={form.profession} onChange={(e) => f('profession', e.target.value)} /></Field>
          <Field label="Nationalite" half><input type="text" value={form.nationalite} onChange={(e) => f('nationalite', e.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Numero CNI" half>
            <input type="text" value={form.numero_cni} onChange={(e) => f('numero_cni', e.target.value)} style={{ fontFamily: 'JetBrains Mono, monospace' }} />
          </Field>
          <Field label="Numero passeport" half>
            <input type="text" value={form.numero_passeport} onChange={(e) => f('numero_passeport', e.target.value)} style={{ fontFamily: 'JetBrains Mono, monospace' }} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Quartier" half>
            <input type="text" value={form.quartier} onChange={(e) => f('quartier', e.target.value)} placeholder="Saisir le quartier" />
          </Field>
          <Field label="Rue / Adresse" half>
            <input type="text" value={form.rue} onChange={(e) => f('rue', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Telephone" half><input type="tel" value={form.telephone} onChange={(e) => f('telephone', e.target.value)} /></Field>
          <Field label="Email" half><input type="email" value={form.email} onChange={(e) => f('email', e.target.value)} /></Field>
        </FieldRow>
        <Field label="Observations">
          <textarea value={form.observations} onChange={(e) => f('observations', e.target.value)} style={{ height: '60px' }} />
        </Field>
      </Modal>
    </div>
  )
}