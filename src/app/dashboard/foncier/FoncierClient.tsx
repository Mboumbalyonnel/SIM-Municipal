'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge, { badgeStatutParcelle } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import { formatDate, LABELS_STATUT_PARCELLE } from '@/lib/utils'
import type { Parcelle, RoleUtilisateur } from '@/types'

const EMPTY = {
  numero_parcelle: '', quartier: '', superficie_m2: '', proprietaire: '',
  numero_titre: '', date_titre: '', statut: 'en_cours',
  description_litige: '', valeur_estimee: '', usage: '',
  coordonnees_gps: '', observations: '',
}

export default function FoncierClient({ parcelles: init, stats, role, mairieId }: {
  parcelles: Parcelle[]
  stats: { litiges: number }
  role: RoleUtilisateur
  mairieId: string
}) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [parcelles, setParcelles] = useState<Parcelle[]>(init)
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editParcelle, setEditParcelle] = useState<Parcelle | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const canWrite = ['admin', 'senior', 'saisie'].includes(role)
  const canEdit  = role === 'admin' || role === 'senior'

  const filtered = parcelles.filter((p) => {
    const s = search.toLowerCase()
    const match = !s ||
      p.numero_parcelle.toLowerCase().includes(s) ||
      (p.proprietaire ?? '').toLowerCase().includes(s) ||
      (p.quartier ?? '').toLowerCase().includes(s)
    return match && (!filterStatut || p.statut === filterStatut)
  })

  function f(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function openNew() {
    setEditParcelle(null)
    setForm({ ...EMPTY })
    setErr('')
    setModalOpen(true)
  }

  function openEdit(p: Parcelle) {
    setEditParcelle(p)
    setForm({
      numero_parcelle:    p.numero_parcelle,
      quartier:           p.quartier ?? '',
      superficie_m2:      p.superficie_m2 ? String(p.superficie_m2) : '',
      proprietaire:       p.proprietaire ?? '',
      numero_titre:       p.numero_titre ?? '',
      date_titre:         p.date_titre ?? '',
      statut:             p.statut,
      description_litige: p.description_litige ?? '',
      valeur_estimee:     p.valeur_estimee ? String(p.valeur_estimee) : '',
      usage:              p.usage ?? '',
      coordonnees_gps:    p.coordonnees_gps ?? '',
      observations:       p.observations ?? '',
    })
    setErr('')
    setModalOpen(true)
  }

  async function save() {
    setErr('')
    if (!form.numero_parcelle.trim()) { setErr('Le numero de parcelle est obligatoire.'); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      numero_parcelle:    form.numero_parcelle.trim(),
      quartier:           form.quartier || null,
      superficie_m2:      form.superficie_m2 ? parseFloat(form.superficie_m2) : null,
      proprietaire:       form.proprietaire || null,
      numero_titre:       form.numero_titre || null,
      date_titre:         form.date_titre || null,
      statut:             form.statut,
      description_litige: form.statut === 'litige' ? form.description_litige || null : null,
      valeur_estimee:     form.valeur_estimee ? parseFloat(form.valeur_estimee) : null,
      usage:              form.usage || null,
      coordonnees_gps:    form.coordonnees_gps || null,
      observations:       form.observations || null,
    }

    if (editParcelle) {
      const { data, error } = await sb
        .from('parcelles').update(payload).eq('id', editParcelle.id).select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setParcelles((p) => p.map((x) => x.id === editParcelle.id ? data as Parcelle : x))
    } else {
      const { data, error } = await sb
        .from('parcelles')
        .insert({ ...payload, mairie_id: mairieId, created_by: user.id })
        .select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setParcelles((p) => [...p, data as Parcelle].sort((a, b) => a.numero_parcelle.localeCompare(b.numero_parcelle)))
    }

    setModalOpen(false)
    setEditParcelle(null)
    setForm({ ...EMPTY })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function softDelete(id: string) {
    if (!confirm('Desactiver cette parcelle ?')) return
    const sb = createClient()
    await sb.from('parcelles').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setParcelles((p) => p.filter((x) => x.id !== id))
  }

  const titrees = parcelles.filter((p) => p.statut === 'titree').length

  return (
    <div>
      <PageHeader
        title="Foncier"
        description="Registre des parcelles, titres fonciers et litiges."
        action={canWrite ? <Button onClick={openNew}>+ Nouvelle parcelle</Button> : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Parcelles enregistrees" value={parcelles.length} />
        <StatCard label="Titrees"                value={titrees} />
        <StatCard label="Litiges en cours"       value={stats.litiges} variant={stats.litiges > 0 ? 'danger' : 'default'} />
        <StatCard label="En cours de traitement" value={parcelles.filter((p) => p.statut === 'en_cours').length} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Numero parcelle, proprietaire, quartier..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
        <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ width: '160px' }}>
          <option value="">Tous statuts</option>
          <option value="titree">Titree</option>
          <option value="en_cours">En cours</option>
          <option value="litige">Litige</option>
          <option value="libre">Libre</option>
        </select>
        {(search || filterStatut) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatut('') }}>Reinitialiser</Button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
          {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Table
        headers={['N. parcelle', 'Proprietaire', 'Quartier', 'Surface m2', 'N. titre', 'Date titre', 'Statut', '']}
        empty="Aucune parcelle enregistree"
      >
        {filtered.map((p) => (
          <Tr key={p.id}>
            <Td mono>{p.numero_parcelle}</Td>
            <Td><span style={{ fontWeight: 600 }}>{p.proprietaire ?? '-'}</span></Td>
            <Td muted>{p.quartier ?? '-'}</Td>
            <Td muted>{p.superficie_m2 ? `${p.superficie_m2} m2` : '-'}</Td>
            <Td mono muted style={{ fontSize: '11px' }}>{p.numero_titre ?? '-'}</Td>
            <Td muted>{formatDate(p.date_titre)}</Td>
            <Td>
              <Badge variant={badgeStatutParcelle(p.statut)}>{LABELS_STATUT_PARCELLE[p.statut]}</Badge>
              {p.statut === 'litige' && p.description_litige && (
                <div style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '2px' }}>
                  {p.description_litige.substring(0, 40)}{p.description_litige.length > 40 ? '...' : ''}
                </div>
              )}
            </Td>
            <Td>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                {canEdit && (
                  <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Modifier</Button>
                )}
                {role === 'admin' && (
                  <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => softDelete(p.id)}>
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
        onClose={() => { setModalOpen(false); setEditParcelle(null) }}
        title={editParcelle ? 'Modifier la parcelle' : 'Enregistrer une parcelle'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditParcelle(null) }}>Annuler</Button>
            <Button onClick={save} loading={saving}>
              {editParcelle ? 'Enregistrer les modifications' : 'Enregistrer'}
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
          <Field label="Numero de parcelle" required half>
            <input type="text" value={form.numero_parcelle} onChange={(e) => f('numero_parcelle', e.target.value)} style={{ fontFamily: 'JetBrains Mono, monospace' }} />
          </Field>
          <Field label="Quartier" half>
            <input type="text" value={form.quartier} onChange={(e) => f('quartier', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Proprietaire" half>
            <input type="text" value={form.proprietaire} onChange={(e) => f('proprietaire', e.target.value)} />
          </Field>
          <Field label="Superficie (m2)" half>
            <input type="number" value={form.superficie_m2} onChange={(e) => f('superficie_m2', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Numero de titre" half>
            <input type="text" value={form.numero_titre} onChange={(e) => f('numero_titre', e.target.value)} style={{ fontFamily: 'JetBrains Mono, monospace' }} />
          </Field>
          <Field label="Date du titre" half>
            <input type="date" value={form.date_titre} onChange={(e) => f('date_titre', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Statut" required half>
            <select value={form.statut} onChange={(e) => f('statut', e.target.value)}>
              <option value="titree">Titree</option>
              <option value="en_cours">En cours</option>
              <option value="litige">Litige</option>
              <option value="libre">Libre</option>
            </select>
          </Field>
          <Field label="Usage" half>
            <select value={form.usage} onChange={(e) => f('usage', e.target.value)}>
              <option value="">-</option>
              <option value="residentiel">Residentiel</option>
              <option value="commercial">Commercial</option>
              <option value="agricole">Agricole</option>
              <option value="industriel">Industriel</option>
              <option value="autre">Autre</option>
            </select>
          </Field>
        </FieldRow>
        {form.statut === 'litige' && (
          <Field label="Description du litige">
            <textarea value={form.description_litige} onChange={(e) => f('description_litige', e.target.value)} style={{ height: '60px' }} />
          </Field>
        )}
        <FieldRow>
          <Field label="Valeur estimee (FCFA)" half>
            <input type="number" value={form.valeur_estimee} onChange={(e) => f('valeur_estimee', e.target.value)} />
          </Field>
          <Field label="Coordonnees GPS" half>
            <input type="text" value={form.coordonnees_gps} onChange={(e) => f('coordonnees_gps', e.target.value)} placeholder="ex: -2.123, 9.456" />
          </Field>
        </FieldRow>
        <Field label="Observations">
          <textarea value={form.observations} onChange={(e) => f('observations', e.target.value)} style={{ height: '60px' }} />
        </Field>
      </Modal>
    </div>
  )
}