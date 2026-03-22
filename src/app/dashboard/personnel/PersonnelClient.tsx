'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge, { badgeStatutAgent } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import { formatDate, LABELS_STATUT_AGENT, SERVICES_MAIRIE } from '@/lib/utils'
import type { Agent, Conge, RoleUtilisateur } from '@/types'

const EMPTY_AGENT = {
  nom: '', prenom: '', date_naissance: '', numero_matricule: '', poste: '',
  service: 'Administration generale', type_contrat: 'CDD', date_embauche: '',
  date_fin_contrat: '', telephone: '', email: '', adresse: '', statut: 'actif', observations: '',
}

const EMPTY_CONGE = {
  agent_id: '', type_conge: 'annuel', date_debut: '', date_fin: '',
  nombre_jours: '', motif: '', observations: '',
}

export default function PersonnelClient({ agents: initA, conges: initC, role, mairieId }: {
  agents: Agent[]
  conges: Conge[]
  role: RoleUtilisateur
  mairieId: string
}) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [agents, setAgents] = useState<Agent[]>(initA)
  const [conges, setConges] = useState<Conge[]>(initC)
  const [tab, setTab] = useState<'agents' | 'conges'>('agents')

  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [filterService, setFilterService] = useState('')

  const [modalAgentOpen, setModalAgentOpen] = useState(false)
  const [editAgent, setEditAgent] = useState<Agent | null>(null)
  const [formA, setFormA] = useState({ ...EMPTY_AGENT })

  const [modalCongeOpen, setModalCongeOpen] = useState(false)
  const [editConge, setEditConge] = useState<Conge | null>(null)
  const [formC, setFormC] = useState({ ...EMPTY_CONGE })

  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const canWrite = role === 'admin' || role === 'senior'

  // Fix compatibilite ES target
  const servicesUniq = Array.from(new Set(agents.map((a) => a.service))).sort()

  const filtered = agents.filter((a) => {
    const s = search.toLowerCase()
    const match = !s ||
      a.nom.toLowerCase().includes(s) ||
      a.prenom.toLowerCase().includes(s) ||
      a.poste.toLowerCase().includes(s) ||
      a.service.toLowerCase().includes(s)
    return match &&
      (!filterStatut  || a.statut  === filterStatut) &&
      (!filterService || a.service === filterService)
  })

  function fA(k: string, v: string) { setFormA((p) => ({ ...p, [k]: v })) }
  function fC(k: string, v: string) { setFormC((p) => ({ ...p, [k]: v })) }

  function openNewAgent() {
    setEditAgent(null)
    setFormA({ ...EMPTY_AGENT })
    setErr('')
    setModalAgentOpen(true)
  }

  function openEditAgent(a: Agent) {
    setEditAgent(a)
    setFormA({
      nom:              a.nom,
      prenom:           a.prenom,
      date_naissance:   a.date_naissance ?? '',
      numero_matricule: a.numero_matricule ?? '',
      poste:            a.poste,
      service:          a.service,
      type_contrat:     a.type_contrat,
      date_embauche:    a.date_embauche,
      date_fin_contrat: a.date_fin_contrat ?? '',
      telephone:        a.telephone ?? '',
      email:            a.email ?? '',
      adresse:          a.adresse ?? '',
      statut:           a.statut,
      observations:     a.observations ?? '',
    })
    setErr('')
    setModalAgentOpen(true)
  }

  function openNewConge() {
    setEditConge(null)
    setFormC({ ...EMPTY_CONGE })
    setErr('')
    setModalCongeOpen(true)
  }

  function openEditConge(c: Conge) {
    setEditConge(c)
    setFormC({
      agent_id:     c.agent_id,
      type_conge:   c.type_conge,
      date_debut:   c.date_debut,
      date_fin:     c.date_fin,
      nombre_jours: c.nombre_jours ? String(c.nombre_jours) : '',
      motif:        c.motif ?? '',
      observations: c.observations ?? '',
    })
    setErr('')
    setModalCongeOpen(true)
  }

  async function saveAgent() {
    setErr('')
    if (!formA.nom.trim() || !formA.poste.trim() || !formA.date_embauche) {
      setErr("Nom, poste et date d'embauche sont obligatoires.")
      return
    }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      nom:              formA.nom.trim(),
      prenom:           formA.prenom.trim(),
      date_naissance:   formA.date_naissance || null,
      numero_matricule: formA.numero_matricule || null,
      poste:            formA.poste.trim(),
      service:          formA.service,
      type_contrat:     formA.type_contrat,
      date_embauche:    formA.date_embauche,
      date_fin_contrat: formA.date_fin_contrat || null,
      telephone:        formA.telephone || null,
      email:            formA.email || null,
      adresse:          formA.adresse || null,
      statut:           formA.statut,
      observations:     formA.observations || null,
    }

    if (editAgent) {
      const { data, error } = await sb
        .from('agents').update(payload).eq('id', editAgent.id).select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setAgents((p) => p.map((a) => a.id === editAgent.id ? data as Agent : a))
    } else {
      const { data, error } = await sb
        .from('agents')
        .insert({ ...payload, mairie_id: mairieId, created_by: user.id })
        .select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setAgents((p) => [...p, data as Agent].sort((a, b) => a.nom.localeCompare(b.nom)))
    }

    setModalAgentOpen(false)
    setEditAgent(null)
    setFormA({ ...EMPTY_AGENT })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function saveConge() {
    setErr('')
    if (!formC.agent_id)   { setErr("Selectionnez un agent."); return }
    if (!formC.date_debut) { setErr("La date de debut est obligatoire."); return }
    if (!formC.date_fin)   { setErr("La date de fin est obligatoire."); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      agent_id:     formC.agent_id,
      type_conge:   formC.type_conge,
      date_debut:   formC.date_debut,
      date_fin:     formC.date_fin,
      nombre_jours: formC.nombre_jours ? parseInt(formC.nombre_jours) : null,
      motif:        formC.motif || null,
      observations: formC.observations || null,
      statut:       'demande',
    }

    if (editConge) {
      const { data, error } = await sb
        .from('conges')
        .update(payload)
        .eq('id', editConge.id)
        .select('*, agent:agents(nom, prenom)')
        .single()
      if (error) { setErr(error.message); setSaving(false); return }
      setConges((p) => p.map((c) => c.id === editConge.id ? data as Conge : c))
    } else {
      const { data, error } = await sb
        .from('conges')
        .insert({ ...payload, mairie_id: mairieId, created_by: user.id })
        .select('*, agent:agents(nom, prenom)')
        .single()
      if (error) { setErr(error.message); setSaving(false); return }
      setConges((p) => [data as Conge, ...p])
    }

    setModalCongeOpen(false)
    setEditConge(null)
    setFormC({ ...EMPTY_CONGE })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function changerStatutAgent(id: string, statut: string) {
    const sb = createClient()
    await sb.from('agents').update({ statut }).eq('id', id)
    setAgents((p) => p.map((a) => a.id === id ? { ...a, statut: statut as Agent['statut'] } : a))
  }

  async function changerStatutConge(id: string, statut: string) {
    const sb = createClient()
    const conge = conges.find((c) => c.id === id)
    if (!conge) return

    await sb.from('conges').update({ statut }).eq('id', id)

    if (statut === 'approuve') {
      await sb.from('agents').update({ statut: 'conge' }).eq('id', conge.agent_id)
      setAgents((p) => p.map((a) =>
        a.id === conge.agent_id ? { ...a, statut: 'conge' as Agent['statut'] } : a
      ))
      setConges((p) => p.map((c) => c.id === id ? { ...c, statut: statut as Conge['statut'] } : c))
    } else if (statut === 'refuse' || statut === 'annule') {
      const agent = agents.find((a) => a.id === conge.agent_id)
      if (agent && agent.statut === 'conge') {
        await sb.from('agents').update({ statut: 'actif' }).eq('id', conge.agent_id)
        setAgents((p) => p.map((a) =>
          a.id === conge.agent_id ? { ...a, statut: 'actif' as Agent['statut'] } : a
        ))
      }
      setConges((p) => p.map((c) => c.id === id ? { ...c, statut: statut as Conge['statut'] } : c))
    }
  }

  async function supprimerConge(id: string) {
    if (!confirm("Supprimer cette demande de conge ? Cette action est irreversible.")) return
    const sb = createClient()
    const conge = conges.find((c) => c.id === id)
    if (!conge) return

    await sb.from('conges').update({ deleted_at: new Date().toISOString() }).eq('id', id)

    if (conge.statut === 'approuve') {
      await sb.from('agents').update({ statut: 'actif' }).eq('id', conge.agent_id)
      setAgents((p) => p.map((a) =>
        a.id === conge.agent_id ? { ...a, statut: 'actif' as Agent['statut'] } : a
      ))
    }

    setConges((p) => p.filter((c) => c.id !== id))
  }

  async function cloturerConge(id: string) {
    if (!confirm("Cloturer ce conge ? L'agent repassera automatiquement a Actif.")) return
    const sb = createClient()
    const conge = conges.find((c) => c.id === id)
    if (!conge) return

    await sb.from('conges').update({ deleted_at: new Date().toISOString(), statut: 'annule' }).eq('id', id)
    await sb.from('agents').update({ statut: 'actif' }).eq('id', conge.agent_id)

    setConges((p) => p.filter((c) => c.id !== id))
    setAgents((p) => p.map((a) =>
      a.id === conge.agent_id ? { ...a, statut: 'actif' as Agent['statut'] } : a
    ))
  }

  async function softDeleteAgent(id: string) {
    if (!confirm('Retirer cet agent ? Il passera en statut "Quitte" et ne sera plus visible. Ses donnees sont conservees.')) return
    const sb = createClient()
    await sb.from('agents').update({ deleted_at: new Date().toISOString(), statut: 'quitte' }).eq('id', id)
    setAgents((p) => p.filter((a) => a.id !== id))
  }

  const actifs        = agents.filter((a) => a.statut === 'actif').length
  const enConge       = agents.filter((a) => a.statut === 'conge').length
  const demandesConge = conges.filter((c) => c.statut === 'demande').length

  return (
    <div>
      <PageHeader
        title="Personnel"
        description="Gestion des agents municipaux, contrats et conges."
        action={canWrite ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={openNewConge}>+ Demande de conge</Button>
            <Button onClick={openNewAgent}>+ Ajouter un agent</Button>
          </div>
        ) : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Agents enregistres" value={agents.length} />
        <StatCard label="Actifs"             value={actifs} />
        <StatCard label="En conge"           value={enConge} />
        <StatCard label="Demandes conge"     value={demandesConge} variant={demandesConge > 0 ? 'warning' : 'default'} />
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '16px' }}>
        {(['agents', 'conges'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 18px', fontSize: '13px', border: 'none', background: 'none',
            cursor: 'pointer', fontWeight: tab === t ? 600 : 400,
            color: tab === t ? 'var(--accent)' : 'var(--text2)',
            borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>
            {t === 'agents' ? `Agents (${agents.length})` : `Conges (${conges.length})`}
          </button>
        ))}
      </div>

      {tab === 'agents' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input type="text" placeholder="Nom, poste, service..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: '220px', maxWidth: '360px' }} />
            <select value={filterService} onChange={(e) => setFilterService(e.target.value)} style={{ width: '180px' }}>
              <option value="">Tous services</option>
              {servicesUniq.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} style={{ width: '140px' }}>
              <option value="">Tous statuts</option>
              <option value="actif">Actif</option>
              <option value="conge">En conge</option>
              <option value="suspendu">Suspendu</option>
              <option value="quitte">Quitte</option>
            </select>
            {(search || filterStatut || filterService) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterStatut(''); setFilterService('') }}>
                Reinitialiser
              </Button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
              {filtered.length} agent{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          <Table headers={['Nom complet', 'Poste', 'Service', 'Contrat', 'Embauche', 'Statut', '']} empty="Aucun agent enregistre">
            {filtered.map((a) => (
              <Tr key={a.id}>
                <Td>
                  <span style={{ fontWeight: 600 }}>{a.nom} {a.prenom}</span>
                  {a.numero_matricule && (
                    <span style={{ color: 'var(--text3)', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', marginLeft: '8px' }}>
                      {a.numero_matricule}
                    </span>
                  )}
                </Td>
                <Td muted>{a.poste}</Td>
                <Td muted>{a.service}</Td>
                <Td><Badge variant="gray">{a.type_contrat}</Badge></Td>
                <Td muted>{formatDate(a.date_embauche)}</Td>
                <Td>
                  {canWrite ? (
                    <select
                      value={a.statut}
                      onChange={(e) => changerStatutAgent(a.id, e.target.value)}
                      style={{
                        fontSize: '11px', fontWeight: 600, padding: '3px 8px',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer',
                      }}
                    >
                      <option value="actif">Actif</option>
                      <option value="conge">En conge</option>
                      <option value="suspendu">Suspendu</option>
                      <option value="quitte">Quitte</option>
                    </select>
                  ) : (
                    <Badge variant={badgeStatutAgent(a.statut)}>{LABELS_STATUT_AGENT[a.statut]}</Badge>
                  )}
                </Td>
                <Td>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {canWrite && (
                      <Button variant="ghost" size="sm" onClick={() => openEditAgent(a)}>Modifier</Button>
                    )}
                    {role === 'admin' && (
                      <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => softDeleteAgent(a.id)}>
                        Retirer
                      </Button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))}
          </Table>
        </>
      )}

      {tab === 'conges' && (
        <>
          <div style={{
            background: 'var(--info-light)', border: '1px solid var(--info)',
            borderRadius: 'var(--radius-md)', padding: '10px 14px',
            fontSize: '12px', color: 'var(--info)', marginBottom: '16px', fontWeight: 500,
          }}>
            Approuver un conge passe l&apos;agent en &quot;En conge&quot;.
            Refuser ou annuler repasse l&apos;agent a &quot;Actif&quot;.
            Vous pouvez supprimer une demande refuse ou annulee pour la retirer definitivement de la liste.
          </div>

          <Table headers={['Agent', 'Type', 'Debut', 'Fin', 'Jours', 'Statut', '']} empty="Aucune demande de conge">
            {conges.map((c) => {
              const agent = c.agent as unknown as { nom: string; prenom: string } | null
              return (
                <Tr key={c.id}>
                  <Td><span style={{ fontWeight: 600 }}>{agent?.nom} {agent?.prenom}</span></Td>
                  <Td muted>{c.type_conge}</Td>
                  <Td muted>{formatDate(c.date_debut)}</Td>
                  <Td muted>{formatDate(c.date_fin)}</Td>
                  <Td muted>{c.nombre_jours ?? '-'}</Td>
                  <Td>
                    {canWrite ? (
                      <select
                        value={c.statut}
                        onChange={(e) => changerStatutConge(c.id, e.target.value)}
                        style={{
                          fontSize: '11px', fontWeight: 600, padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                          background: 'var(--surface2)', color: 'var(--text)', cursor: 'pointer',
                        }}
                      >
                        <option value="demande">Demande</option>
                        <option value="approuve">Approuve</option>
                        <option value="refuse">Refuse</option>
                        <option value="annule">Annule</option>
                      </select>
                    ) : (
                      <Badge variant={
                        c.statut === 'approuve' ? 'green' :
                        c.statut === 'refuse'   ? 'red'   :
                        c.statut === 'demande'  ? 'amber' : 'gray'
                      }>
                        {c.statut}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {canWrite && (
                        <Button variant="ghost" size="sm" onClick={() => openEditConge(c)}>Modifier</Button>
                      )}
                      {canWrite && c.statut === 'approuve' && (
                        <Button variant="ghost" size="sm" style={{ color: 'var(--success)' }}
                          onClick={() => cloturerConge(c.id)}>
                          Fin de conge
                        </Button>
                      )}
                      {canWrite && (c.statut === 'refuse' || c.statut === 'annule') && (
                        <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }}
                          onClick={() => supprimerConge(c.id)}>
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </Table>
        </>
      )}

      {/* Modal Agent */}
      <Modal
        open={modalAgentOpen}
        onClose={() => { setModalAgentOpen(false); setEditAgent(null) }}
        title={editAgent ? "Modifier l'agent" : 'Ajouter un agent'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalAgentOpen(false); setEditAgent(null) }}>Annuler</Button>
            <Button onClick={saveAgent} loading={saving}>
              {editAgent ? 'Enregistrer les modifications' : 'Enregistrer'}
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
          <Field label="Nom" required half><input type="text" value={formA.nom} onChange={(e) => fA('nom', e.target.value)} /></Field>
          <Field label="Prenom" half><input type="text" value={formA.prenom} onChange={(e) => fA('prenom', e.target.value)} /></Field>
        </FieldRow>
        <FieldRow>
          <Field label="Poste" required half><input type="text" value={formA.poste} onChange={(e) => fA('poste', e.target.value)} /></Field>
          <Field label="Service" required half>
            <select value={formA.service} onChange={(e) => fA('service', e.target.value)}>
              {SERVICES_MAIRIE.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Type de contrat" required half>
            <select value={formA.type_contrat} onChange={(e) => fA('type_contrat', e.target.value)}>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="stage">Stage</option>
              <option value="vacation">Vacation</option>
            </select>
          </Field>
          <Field label="Numero matricule" half>
            <input type="text" value={formA.numero_matricule} onChange={(e) => fA('numero_matricule', e.target.value)} style={{ fontFamily: 'JetBrains Mono, monospace' }} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Date d'embauche" required half>
            <input type="date" value={formA.date_embauche} onChange={(e) => fA('date_embauche', e.target.value)} />
          </Field>
          <Field label="Fin de contrat" half>
            <input type="date" value={formA.date_fin_contrat} onChange={(e) => fA('date_fin_contrat', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Statut" half>
            <select value={formA.statut} onChange={(e) => fA('statut', e.target.value)}>
              <option value="actif">Actif</option>
              <option value="conge">En conge</option>
              <option value="suspendu">Suspendu</option>
              <option value="quitte">Quitte / Retraite</option>
            </select>
          </Field>
          <Field label="Date de naissance" half>
            <input type="date" value={formA.date_naissance} onChange={(e) => fA('date_naissance', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Telephone" half><input type="tel" value={formA.telephone} onChange={(e) => fA('telephone', e.target.value)} /></Field>
          <Field label="Email" half><input type="email" value={formA.email} onChange={(e) => fA('email', e.target.value)} /></Field>
        </FieldRow>
        <Field label="Observations">
          <textarea value={formA.observations} onChange={(e) => fA('observations', e.target.value)} style={{ height: '60px' }} />
        </Field>
      </Modal>

      {/* Modal Conge */}
      <Modal
        open={modalCongeOpen}
        onClose={() => { setModalCongeOpen(false); setEditConge(null) }}
        title={editConge ? 'Modifier le conge' : 'Nouvelle demande de conge'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalCongeOpen(false); setEditConge(null) }}>Annuler</Button>
            <Button onClick={saveConge} loading={saving}>
              {editConge ? 'Enregistrer les modifications' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        {err && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {err}
          </div>
        )}
        <Field label="Agent" required>
          <select value={formC.agent_id} onChange={(e) => fC('agent_id', e.target.value)} disabled={!!editConge}>
            <option value="">Selectionner un agent...</option>
            {agents.filter((a) => a.statut === 'actif' || a.statut === 'conge').map((a) => (
              <option key={a.id} value={a.id}>{a.nom} {a.prenom} - {a.poste}</option>
            ))}
          </select>
        </Field>
        <FieldRow>
          <Field label="Type de conge" required half>
            <select value={formC.type_conge} onChange={(e) => fC('type_conge', e.target.value)}>
              <option value="annuel">Annuel</option>
              <option value="maladie">Maladie</option>
              <option value="maternite">Maternite</option>
              <option value="paternite">Paternite</option>
              <option value="exceptionnel">Exceptionnel</option>
              <option value="sans_solde">Sans solde</option>
            </select>
          </Field>
          <Field label="Nombre de jours" half>
            <input type="number" value={formC.nombre_jours} onChange={(e) => fC('nombre_jours', e.target.value)} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Date de debut" required half>
            <input type="date" value={formC.date_debut} onChange={(e) => fC('date_debut', e.target.value)} />
          </Field>
          <Field label="Date de fin" required half>
            <input type="date" value={formC.date_fin} onChange={(e) => fC('date_fin', e.target.value)} />
          </Field>
        </FieldRow>
        <Field label="Motif">
          <input type="text" value={formC.motif} onChange={(e) => fC('motif', e.target.value)} />
        </Field>
        <Field label="Observations">
          <textarea value={formC.observations} onChange={(e) => fC('observations', e.target.value)} style={{ height: '60px' }} />
        </Field>
      </Modal>
    </div>
  )
}