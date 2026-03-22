'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge, { badgeStatutCourrier } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import { formatDate, LABELS_STATUT_COURRIER, generateReference, SERVICES_MAIRIE } from '@/lib/utils'
import type { Courrier, RoleUtilisateur } from '@/types'

const EMPTY = {
  numero_reference: '', type_courrier: 'entrant',
  date_reception: new Date().toISOString().split('T')[0],
  date_envoi: '', objet: '', expediteur: '', destinataire: '',
  service_concerne: '', statut: 'en_attente', priorite: 'normale',
  reponse_requise: 'false', date_limite_reponse: '', observations: '',
}

export default function CourriersClient({ courriers: init, stats, role, mairieId }: {
  courriers: Courrier[]
  stats: { enAttente: number }
  role: RoleUtilisateur
  mairieId: string
}) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [courriers, setCourriers] = useState<Courrier[]>(init)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editCourrier, setEditCourrier] = useState<Courrier | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const canWrite = ['admin', 'senior', 'saisie'].includes(role)
  const canEdit  = role === 'admin' || role === 'senior'

  const filtered = courriers.filter((c) => {
    const s = search.toLowerCase()
    const match = !s || c.objet.toLowerCase().includes(s) ||
      c.numero_reference.toLowerCase().includes(s) ||
      (c.expediteur ?? '').toLowerCase().includes(s)
    return match &&
      (!filterStatut || c.statut === filterStatut) &&
      (!filterType || c.type_courrier === filterType)
  })

  function f(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function openNew() {
    setEditCourrier(null)
    setForm({ ...EMPTY })
    setErr('')
    setModalOpen(true)
  }

  function openEdit(c: Courrier) {
    setEditCourrier(c)
    setForm({
      numero_reference:     c.numero_reference,
      type_courrier:        c.type_courrier,
      date_reception:       c.date_reception ?? '',
      date_envoi:           c.date_envoi ?? '',
      objet:                c.objet,
      expediteur:           c.expediteur ?? '',
      destinataire:         c.destinataire ?? '',
      service_concerne:     c.service_concerne ?? '',
      statut:               c.statut,
      priorite:             c.priorite,
      reponse_requise:      String(c.reponse_requise),
      date_limite_reponse:  c.date_limite_reponse ?? '',
      observations:         c.observations ?? '',
    })
    setErr('')
    setModalOpen(true)
  }

  async function save() {
    setErr('')
    if (!form.objet.trim()) { setErr("L'objet est obligatoire."); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      numero_reference:    form.numero_reference.trim() || generateReference('C'),
      type_courrier:       form.type_courrier,
      objet:               form.objet.trim(),
      expediteur:          form.expediteur || null,
      destinataire:        form.destinataire || null,
      service_concerne:    form.service_concerne || null,
      statut:              form.statut,
      priorite:            form.priorite,
      reponse_requise:     form.reponse_requise === 'true',
      date_reception:      form.type_courrier === 'entrant' ? form.date_reception || null : null,
      date_envoi:          form.type_courrier === 'sortant' ? form.date_envoi || null : null,
      date_limite_reponse: form.date_limite_reponse || null,
      observations:        form.observations || null,
    }

    if (editCourrier) {
      const { data, error } = await sb
        .from('courriers').update(payload).eq('id', editCourrier.id).select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setCourriers((p) => p.map((c) => c.id === editCourrier.id ? data as Courrier : c))
    } else {
      const { data, error } = await sb
        .from('courriers')
        .insert({ ...payload, mairie_id: mairieId, created_by: user.id })
        .select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setCourriers((p) => [data as Courrier, ...p])
    }

    setModalOpen(false)
    setEditCourrier(null)
    setForm({ ...EMPTY })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function changerStatut(id: string, statut: string) {
    const sb = createClient()
    await sb.from('courriers').update({ statut }).eq('id', id)
    setCourriers((p) => p.map((c) => c.id === id ? { ...c, statut: statut as Courrier['statut'] } : c))
  }

  const enAttente = courriers.filter((c) => c.statut === 'en_attente').length
  const enCours   = courriers.filter((c) => c.statut === 'en_cours').length
  const entrants  = courriers.filter((c) => c.type_courrier === 'entrant').length
  const sortants  = courriers.filter((c) => c.type_courrier === 'sortant').length

  return (
    <div>
      <PageHeader
        title="Courriers"
        description="Suivi des courriers administratifs entrants et sortants."
        action={canWrite ? <Button onClick={openNew}>+ Nouveau courrier</Button> : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="En attente" value={enAttente} variant={enAttente > 0 ? 'warning' : 'default'} />
        <StatCard label="En cours"   value={enCours} />
        <StatCard label="Entrants"   value={entrants} />
        <StatCard label="Sortants"   value={sortants} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Rechercher par objet, reference, expediteur..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: '130px' }}>
          <option value="">Tous types</option>
          <option value="entrant">Entrants</option>
          <option value="sortant">Sortants</option>
        </select>
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ width: '150px' }}>
          <option value="">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="en_cours">En cours</option>
          <option value="traite">Traite</option>
          <option value="archive">Archive</option>
        </select>
        {(search || filterStatut || filterType) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatut(''); setFilterType('') }}>
            Reinitialiser
          </Button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
          {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Table
        headers={['Reference', 'Type', 'Objet', 'Expediteur', 'Date', 'Priorite', 'Statut', '']}
        empty="Aucun courrier enregistre"
      >
        {filtered.map((c) => (
          <Tr key={c.id}>
            <Td mono style={{ fontSize: '11px' }}>{c.numero_reference}</Td>
            <Td>
              <Badge variant={c.type_courrier === 'entrant' ? 'blue' : 'gray'}>
                {c.type_courrier === 'entrant' ? 'Entrant' : 'Sortant'}
              </Badge>
            </Td>
            <Td><span style={{ fontWeight: 600 }}>{c.objet}</span></Td>
            <Td muted>{c.expediteur ?? '-'}</Td>
            <Td muted>{formatDate(c.date_reception ?? c.date_envoi)}</Td>
            <Td>
              {c.priorite === 'urgente'       && <Badge variant="red">Urgent</Badge>}
              {c.priorite === 'confidentielle' && <Badge variant="amber">Confid.</Badge>}
              {c.priorite === 'normale'        && <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Normale</span>}
            </Td>
            <Td>
              {canEdit ? (
                <select
                  value={c.statut}
                  onChange={(e) => changerStatut(c.id, e.target.value)}
                  style={{
                    fontSize: '11px', fontWeight: 600, padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer',
                  }}
                >
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="traite">Traite</option>
                  <option value="archive">Archive</option>
                </select>
              ) : (
                <Badge variant={badgeStatutCourrier(c.statut)}>
                  {LABELS_STATUT_COURRIER[c.statut]}
                </Badge>
              )}
            </Td>
            <Td>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Modifier</Button>
                )}
                {role === 'admin' && (
                  <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }}
                    onClick={async () => {
                      if (!confirm('Desactiver ce courrier ?')) return
                      const sb = createClient()
                      await sb.from('courriers').update({ deleted_at: new Date().toISOString() }).eq('id', c.id)
                      setCourriers((p) => p.filter((x) => x.id !== c.id))
                    }}>
                    Desactiver
                  </Button>
                )}
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditCourrier(null) }}
        title={editCourrier ? 'Modifier le courrier' : 'Enregistrer un courrier'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditCourrier(null) }}>Annuler</Button>
            <Button onClick={save} loading={saving}>
              {editCourrier ? 'Enregistrer les modifications' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        {err && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {err}
          </div>
        )}

        <FieldRow>
          <Field label="Type" required half>
            <select value={form.type_courrier} onChange={(e) => f('type_courrier', e.target.value)}>
              <option value="entrant">Entrant</option>
              <option value="sortant">Sortant</option>
            </select>
          </Field>
          <Field label="Reference" half>
            <input type="text" value={form.numero_reference}
              onChange={(e) => f('numero_reference', e.target.value)}
              placeholder="Auto-genere si vide"
              style={{ fontFamily: 'JetBrains Mono, monospace' }} />
          </Field>
        </FieldRow>

        <Field label="Objet" required>
          <input type="text" value={form.objet} onChange={(e) => f('objet', e.target.value)}
            placeholder="Objet du courrier" />
        </Field>

        <FieldRow>
          <Field label="Expediteur" half>
            <input type="text" value={form.expediteur} onChange={(e) => f('expediteur', e.target.value)} />
          </Field>
          <Field label="Destinataire" half>
            <input type="text" value={form.destinataire} onChange={(e) => f('destinataire', e.target.value)} />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label={form.type_courrier === 'entrant' ? 'Date de reception' : "Date d'envoi"} half>
            <input type="date"
              value={form.type_courrier === 'entrant' ? form.date_reception : form.date_envoi}
              onChange={(e) => f(form.type_courrier === 'entrant' ? 'date_reception' : 'date_envoi', e.target.value)} />
          </Field>
          <Field label="Service concerne" half>
            <select value={form.service_concerne} onChange={(e) => f('service_concerne', e.target.value)}>
              <option value="">-</option>
              {SERVICES_MAIRIE.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="Priorite" half>
            <select value={form.priorite} onChange={(e) => f('priorite', e.target.value)}>
              <option value="normale">Normale</option>
              <option value="urgente">Urgente</option>
              <option value="confidentielle">Confidentielle</option>
            </select>
          </Field>
          <Field label="Statut" half>
            <select value={form.statut} onChange={(e) => f('statut', e.target.value)}>
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="traite">Traite</option>
              <option value="archive">Archive</option>
            </select>
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="Reponse requise" half>
            <select value={form.reponse_requise} onChange={(e) => f('reponse_requise', e.target.value)}>
              <option value="false">Non</option>
              <option value="true">Oui</option>
            </select>
          </Field>
          {form.reponse_requise === 'true' && (
            <Field label="Date limite de reponse" half>
              <input type="date" value={form.date_limite_reponse}
                onChange={(e) => f('date_limite_reponse', e.target.value)} />
            </Field>
          )}
        </FieldRow>

        <Field label="Observations">
          <textarea value={form.observations} onChange={(e) => f('observations', e.target.value)}
            style={{ height: '60px' }} />
        </Field>
      </Modal>
    </div>
  )
}