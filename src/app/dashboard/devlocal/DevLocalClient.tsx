'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge, { badgeStatutProjet } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatDate, LABELS_STATUT_PROJET, SECTEURS } from '@/lib/utils'
import type { Entrepreneur, Projet, RoleUtilisateur } from '@/types'

const EMPTY_ENTREP = {
  nom: '', prenom: '', raison_sociale: '', secteur: 'Commerce',
  numero_rccm: '', adresse: '', telephone: '', email: '', observations: '',
}

const EMPTY_PROJET = {
  entrepreneur_id: '', intitule: '', description: '', secteur: 'Commerce',
  date_debut: '', date_fin_prevue: '', avancement: '0',
  statut: 'demarrage', montant_estime: '', observations: '',
}

export default function DevLocalClient({ entrepreneurs: initE, projets: initP, role, mairieId }: {
  entrepreneurs: Entrepreneur[]
  projets: Projet[]
  role: RoleUtilisateur
  mairieId: string
}) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [entrepreneurs, setEntrepreneurs] = useState<Entrepreneur[]>(initE)
  const [projets, setProjets] = useState<Projet[]>(initP)
  const [tab, setTab] = useState<'projets' | 'entrepreneurs'>('projets')

  const [searchP, setSearchP] = useState('')
  const [filterStatutP, setFilterStatutP] = useState('')

  const [searchE, setSearchE] = useState('')
  const [filterSecteur, setFilterSecteur] = useState('')

  const [modalEntrepOpen, setModalEntrepOpen] = useState(false)
  const [editEntrep, setEditEntrep] = useState<Entrepreneur | null>(null)
  const [formE, setFormE] = useState({ ...EMPTY_ENTREP })

  const [modalProjetOpen, setModalProjetOpen] = useState(false)
  const [editProjet, setEditProjet] = useState<Projet | null>(null)
  const [formP, setFormP] = useState({ ...EMPTY_PROJET })

  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const canWrite = ['admin', 'senior', 'saisie'].includes(role)
  const canEdit  = role === 'admin' || role === 'senior'

  const filteredProjets = projets.filter((p) => {
    const s = searchP.toLowerCase()
    const entrep = p.entrepreneur as unknown as Entrepreneur | null
    const match = !s || p.intitule.toLowerCase().includes(s) ||
      (entrep?.nom ?? '').toLowerCase().includes(s)
    return match && (!filterStatutP || p.statut === filterStatutP)
  })

  const filteredEntrepreneurs = entrepreneurs.filter((e) => {
    const s = searchE.toLowerCase()
    const match = !s ||
      e.nom.toLowerCase().includes(s) ||
      (e.prenom ?? '').toLowerCase().includes(s) ||
      (e.raison_sociale ?? '').toLowerCase().includes(s)
    return match && (!filterSecteur || e.secteur === filterSecteur)
  })

  function fE(k: string, v: string) { setFormE((p) => ({ ...p, [k]: v })) }
  function fP(k: string, v: string) { setFormP((p) => ({ ...p, [k]: v })) }

  function openNewEntrep() {
    setEditEntrep(null)
    setFormE({ ...EMPTY_ENTREP })
    setErr('')
    setModalEntrepOpen(true)
  }

  function openEditEntrep(e: Entrepreneur) {
    setEditEntrep(e)
    setFormE({
      nom:            e.nom,
      prenom:         e.prenom ?? '',
      raison_sociale: e.raison_sociale ?? '',
      secteur:        e.secteur,
      numero_rccm:    e.numero_rccm ?? '',
      adresse:        e.adresse ?? '',
      telephone:      e.telephone ?? '',
      email:          e.email ?? '',
      observations:   e.observations ?? '',
    })
    setErr('')
    setModalEntrepOpen(true)
  }

  function openNewProjet() {
    setEditProjet(null)
    setFormP({ ...EMPTY_PROJET })
    setErr('')
    setModalProjetOpen(true)
  }

  function openEditProjet(p: Projet) {
    setEditProjet(p)
    setFormP({
      entrepreneur_id: p.entrepreneur_id,
      intitule:        p.intitule,
      description:     p.description ?? '',
      secteur:         p.secteur ?? 'Commerce',
      date_debut:      p.date_debut,
      date_fin_prevue: p.date_fin_prevue ?? '',
      avancement:      String(p.avancement),
      statut:          p.statut,
      montant_estime:  p.montant_estime ? String(p.montant_estime) : '',
      observations:    p.observations ?? '',
    })
    setErr('')
    setModalProjetOpen(true)
  }

  async function saveEntrepreneur() {
    setErr('')
    if (!formE.nom.trim()) { setErr('Le nom est obligatoire.'); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      nom:            formE.nom.trim(),
      prenom:         formE.prenom || null,
      raison_sociale: formE.raison_sociale || null,
      secteur:        formE.secteur,
      numero_rccm:    formE.numero_rccm || null,
      adresse:        formE.adresse || null,
      telephone:      formE.telephone || null,
      email:          formE.email || null,
      observations:   formE.observations || null,
    }

    if (editEntrep) {
      const { data, error } = await sb
        .from('entrepreneurs')
        .update(payload)
        .eq('id', editEntrep.id)
        .eq('mairie_id', mairieId)
        .select()
        .single()
      if (error) { setErr(error.message); setSaving(false); return }
      setEntrepreneurs((p) => p.map((e) => e.id === editEntrep.id ? data as Entrepreneur : e))
    } else {
      const { data, error } = await sb
        .from('entrepreneurs')
        .insert({ ...payload, mairie_id: mairieId, created_by: user.id })
        .select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setEntrepreneurs((p) => [...p, data as Entrepreneur].sort((a, b) => a.nom.localeCompare(b.nom)))
    }

    setModalEntrepOpen(false)
    setEditEntrep(null)
    setFormE({ ...EMPTY_ENTREP })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function saveProjet() {
    setErr('')
    if (!formP.entrepreneur_id) { setErr('Selectionnez un entrepreneur.'); return }
    if (!formP.intitule.trim()) { setErr("L'intitule est obligatoire."); return }
    if (!formP.date_debut)      { setErr('La date de debut est obligatoire.'); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      entrepreneur_id: formP.entrepreneur_id,
      intitule:        formP.intitule.trim(),
      description:     formP.description || null,
      secteur:         formP.secteur || null,
      date_debut:      formP.date_debut,
      date_fin_prevue: formP.date_fin_prevue || null,
      avancement:      parseInt(formP.avancement),
      statut:          formP.statut,
      montant_estime:  formP.montant_estime ? parseFloat(formP.montant_estime) : null,
      observations:    formP.observations || null,
    }

    if (editProjet) {
      const { data, error } = await sb
        .from('projets')
        .update(payload)
        .eq('id', editProjet.id)
        .eq('mairie_id', mairieId)
        .select('*, entrepreneur:entrepreneurs(nom, raison_sociale)')
        .single()
      if (error) { setErr(error.message); setSaving(false); return }
      setProjets((p) => p.map((x) => x.id === editProjet.id ? data as Projet : x))
    } else {
      const { data, error } = await sb
        .from('projets')
        .insert({ ...payload, mairie_id: mairieId, created_by: user.id })
        .select('*, entrepreneur:entrepreneurs(nom, raison_sociale)')
        .single()
      if (error) { setErr(error.message); setSaving(false); return }
      setProjets((p) => [data as Projet, ...p])
    }

    setModalProjetOpen(false)
    setEditProjet(null)
    setFormP({ ...EMPTY_PROJET })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function changerStatutProjet(id: string, statut: string) {
    const sb = createClient()
    const avancement = statut === 'termine' ? 100 : undefined
    await sb.from('projets').update({
      statut,
      ...(avancement !== undefined ? { avancement } : {}),
    }).eq('id', id)
    setProjets((p) => p.map((x) => x.id === id ? {
      ...x,
      statut: statut as Projet['statut'],
      avancement: avancement ?? x.avancement,
    } : x))
  }

  const enCours   = projets.filter((p) => p.statut === 'en_cours').length
  const termines  = projets.filter((p) => p.statut === 'termine').length
  const suspendus = projets.filter((p) => p.statut === 'suspendu').length

  return (
    <div>
      <PageHeader
        title="Developpement local"
        description="Registre des entrepreneurs et suivi de leurs projets."
        action={canWrite ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={openNewEntrep}>+ Entrepreneur</Button>
            <Button onClick={openNewProjet}>+ Projet</Button>
          </div>
        ) : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Entrepreneurs"    value={entrepreneurs.length} />
        <StatCard label="Projets en cours" value={enCours} />
        <StatCard label="Projets termines" value={termines} />
        <StatCard label="Suspendus"        value={suspendus} variant={suspendus > 0 ? 'warning' : 'default'} />
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
        {(['projets', 'entrepreneurs'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', fontSize: '13px', border: 'none', background: 'none',
            cursor: 'pointer', fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--accent)' : 'var(--text2)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {t === 'projets' ? 'Projets' : 'Entrepreneurs'}
          </button>
        ))}
      </div>

      {tab === 'projets' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Rechercher par intitule ou entrepreneur..."
              value={searchP} onChange={(e) => setSearchP(e.target.value)}
              style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
            <select value={filterStatutP} onChange={(e) => setFilterStatutP(e.target.value)} style={{ width: '150px' }}>
              <option value="">Tous statuts</option>
              <option value="demarrage">Demarrage</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Termine</option>
              <option value="suspendu">Suspendu</option>
            </select>
            {(searchP || filterStatutP) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchP(''); setFilterStatutP('') }}>
                Reinitialiser
              </Button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
              {filteredProjets.length} projet{filteredProjets.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Table
            headers={['Intitule', 'Entrepreneur', 'Secteur', 'Debut', 'Fin prevue', 'Avancement', 'Statut', '']}
            empty="Aucun projet enregistre"
          >
            {filteredProjets.map((p) => {
              const entrep = p.entrepreneur as unknown as Entrepreneur | null
              return (
                <Tr key={p.id}>
                  <Td><span style={{ fontWeight: 600 }}>{p.intitule}</span></Td>
                  <Td muted>{entrep?.raison_sociale ?? entrep?.nom ?? '-'}</Td>
                  <Td muted>{p.secteur ?? '-'}</Td>
                  <Td muted>{formatDate(p.date_debut)}</Td>
                  <Td muted>{formatDate(p.date_fin_prevue)}</Td>
                  <Td style={{ minWidth: '120px' }}>
                    <ProgressBar value={p.avancement} showLabel />
                  </Td>
                  <Td>
                    {canEdit ? (
                      <select
                        value={p.statut}
                        onChange={(e) => changerStatutProjet(p.id, e.target.value)}
                        style={{
                          fontSize: '11px', fontWeight: 600, padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                          background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer',
                        }}
                      >
                        <option value="demarrage">Demarrage</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Termine</option>
                        <option value="suspendu">Suspendu</option>
                      </select>
                    ) : (
                      <Badge variant={badgeStatutProjet(p.statut)}>
                        {LABELS_STATUT_PROJET[p.statut]}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => openEditProjet(p)}>Modifier</Button>
                    )}
                  </Td>
                </Tr>
              )
            })}
          </Table>
        </>
      )}

      {tab === 'entrepreneurs' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Rechercher par nom ou raison sociale..."
              value={searchE} onChange={(e) => setSearchE(e.target.value)}
              style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
            <select value={filterSecteur} onChange={(e) => setFilterSecteur(e.target.value)} style={{ width: '160px' }}>
              <option value="">Tous secteurs</option>
              {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {(searchE || filterSecteur) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearchE(''); setFilterSecteur('') }}>
                Reinitialiser
              </Button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
              {filteredEntrepreneurs.length} entrepreneur{filteredEntrepreneurs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Table
            headers={['Nom / Raison sociale', 'Secteur', 'N. RCCM', 'Telephone', 'Email', '']}
            empty="Aucun entrepreneur enregistre"
          >
            {filteredEntrepreneurs.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <span style={{ fontWeight: 600 }}>
                    {e.raison_sociale ?? `${e.nom}${e.prenom ? ' ' + e.prenom : ''}`}
                  </span>
                  {e.raison_sociale && (
                    <span style={{ color: 'var(--text2)', fontSize: '12px', display: 'block' }}>
                      {e.nom} {e.prenom}
                    </span>
                  )}
                </Td>
                <Td muted>{e.secteur}</Td>
                <Td mono muted style={{ fontSize: '11px' }}>{e.numero_rccm ?? '-'}</Td>
                <Td muted>{e.telephone ?? '-'}</Td>
                <Td muted>{e.email ?? '-'}</Td>
                <Td>
                  {canEdit && (
                    <Button variant="ghost" size="sm" onClick={() => openEditEntrep(e)}>Modifier</Button>
                  )}
                </Td>
              </Tr>
            ))}
          </Table>
        </>
      )}

      <Modal
        open={modalEntrepOpen}
        onClose={() => { setModalEntrepOpen(false); setEditEntrep(null) }}
        title={editEntrep ? "Modifier l'entrepreneur" : 'Ajouter un entrepreneur'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalEntrepOpen(false); setEditEntrep(null) }}>Annuler</Button>
            <Button onClick={saveEntrepreneur} loading={saving}>
              {editEntrep ? 'Enregistrer les modifications' : 'Enregistrer'}
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
          <Field label="Nom" required half><input type="text" value={formE.nom} onChange={(e) => fE('nom', e.target.value)} /></Field>
          <Field label="Prenom" half><input type="text" value={formE.prenom} onChange={(e) => fE('prenom', e.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Raison sociale" half><input type="text" value={formE.raison_sociale} onChange={(e) => fE('raison_sociale', e.target.value)} /></Field>
          <Field label="Secteur" required half>
            <select value={formE.secteur} onChange={(e) => fE('secteur', e.target.value)}>
              {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Numero RCCM" half>
            <input type="text" value={formE.numero_rccm} onChange={(e) => fE('numero_rccm', e.target.value)} style={{ fontFamily: 'JetBrains Mono, monospace' }} />
          </Field>
          <Field label="Telephone" half><input type="tel" value={formE.telephone} onChange={(e) => fE('telephone', e.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Email" half><input type="email" value={formE.email} onChange={(e) => fE('email', e.target.value)} /></Field>
          <Field label="Adresse" half><input type="text" value={formE.adresse} onChange={(e) => fE('adresse', e.target.value)} /></Field>
        </FieldRow>
        <Field label="Observations">
          <textarea value={formE.observations} onChange={(e) => fE('observations', e.target.value)} style={{ height: '60px' }} />
        </Field>
      </Modal>

      <Modal
        open={modalProjetOpen}
        onClose={() => { setModalProjetOpen(false); setEditProjet(null) }}
        title={editProjet ? 'Modifier le projet' : 'Ajouter un projet'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalProjetOpen(false); setEditProjet(null) }}>Annuler</Button>
            <Button onClick={saveProjet} loading={saving}>
              {editProjet ? 'Enregistrer les modifications' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        {err && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {err}
          </div>
        )}
        <Field label="Entrepreneur" required>
          <select value={formP.entrepreneur_id} onChange={(e) => fP('entrepreneur_id', e.target.value)}
            disabled={!!editProjet}>
            <option value="">Selectionner...</option>
            {entrepreneurs.map((e) => (
              <option key={e.id} value={e.id}>
                {e.raison_sociale ?? `${e.nom} ${e.prenom ?? ''}`.trim()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Intitule du projet" required>
          <input type="text" value={formP.intitule} onChange={(e) => fP('intitule', e.target.value)} />
        </Field>
        <FieldRow>
          <Field label="Secteur" half>
            <select value={formP.secteur} onChange={(e) => fP('secteur', e.target.value)}>
              {SECTEURS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Statut" half>
            <select value={formP.statut} onChange={(e) => fP('statut', e.target.value)}>
              <option value="demarrage">Demarrage</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Termine</option>
              <option value="suspendu">Suspendu</option>
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Date de debut" required half>
            <input type="date" value={formP.date_debut} onChange={(e) => fP('date_debut', e.target.value)} />
          </Field>
          <Field label="Fin prevue" half>
            <input type="date" value={formP.date_fin_prevue} onChange={(e) => fP('date_fin_prevue', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Avancement (%)" half>
            <input type="number" min="0" max="100" value={formP.avancement}
              onChange={(e) => fP('avancement', e.target.value)} />
          </Field>
          <Field label="Montant estime (FCFA)" half>
            <input type="number" value={formP.montant_estime}
              onChange={(e) => fP('montant_estime', e.target.value)} />
          </Field>
        </FieldRow>
        <Field label="Description">
          <textarea value={formP.description} onChange={(e) => fP('description', e.target.value)} style={{ height: '60px' }} />
        </Field>
        <Field label="Observations">
          <textarea value={formP.observations} onChange={(e) => fP('observations', e.target.value)} style={{ height: '60px' }} />
        </Field>
      </Modal>
    </div>
  )
}