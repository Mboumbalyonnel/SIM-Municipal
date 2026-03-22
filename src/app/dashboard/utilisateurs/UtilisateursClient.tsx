'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import { LABELS_ROLE } from '@/lib/utils'
import type { Profile, RoleUtilisateur } from '@/types'

const MODULES_LISTE = [
  { key: 'civil',      label: 'Etat civil' },
  { key: 'habitants',  label: 'Habitants' },
  { key: 'taxes',      label: 'Taxes' },
  { key: 'courriers',  label: 'Courriers' },
  { key: 'devlocal',   label: 'Dev. local' },
  { key: 'personnel',  label: 'Personnel' },
  { key: 'foncier',    label: 'Foncier' },
  { key: 'marches',    label: 'Marches pub.' },
]

const EMPTY = {
  nom: '', prenom: '', email: '', poste: '', service: '',
  role: 'saisie' as RoleUtilisateur,
  password: '',
  modules: ['civil','habitants','taxes','courriers','devlocal','personnel','foncier','marches'],
}

export default function UtilisateursClient({
  agents: init,
  mairieId,
  currentUserId,
}: {
  agents: Profile[]
  mairieId: string
  currentUserId: string
}) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [agents, setAgents] = useState<Profile[]>(init)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function f(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })) }

  function toggleModule(key: string) {
    setForm((p) => ({
      ...p,
      modules: p.modules.includes(key)
        ? p.modules.filter((m) => m !== key)
        : [...p.modules, key],
    }))
  }

  async function save() {
    setErr('')
    if (!form.nom.trim())    { setErr('Le nom est obligatoire.'); return }
    if (!form.email.trim())  { setErr("L'email est obligatoire."); return }
    if (!form.password.trim()) { setErr('Le mot de passe est obligatoire.'); return }
    if (form.password.length < 8) { setErr('Le mot de passe doit faire au moins 8 caracteres.'); return }

    setSaving(true)
    const sb = createClient()

    // Creer l'utilisateur via l'API Supabase Admin
    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        nom:      form.nom.trim(),
        prenom:   form.prenom.trim(),
        poste:    form.poste,
        service:  form.service,
        role:     form.role,
        mairie_id: mairieId,
        modules_autorises: form.role === 'admin' ? null : form.modules,
      }),
    })

    const result = await res.json()
    if (!res.ok) { setErr(result.error ?? 'Erreur lors de la creation.'); setSaving(false); return }

    setAgents((p) => [...p, result.profile as Profile].sort((a, b) => a.nom.localeCompare(b.nom)))
    setModalOpen(false)
    setForm({ ...EMPTY })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function toggleActif(agent: Profile) {
    const sb = createClient()
    const newActif = !agent.actif
    await sb.from('profiles').update({ actif: newActif }).eq('id', agent.id)
    setAgents((p) => p.map((a) => a.id === agent.id ? { ...a, actif: newActif } : a))
  }

  return (
    <div>
      <PageHeader
        title="Gestion des agents"
        description="Creez les comptes des agents et definissez leurs acces par module."
        action={<Button onClick={() => { setModalOpen(true); setErr('') }}>+ Nouvel agent</Button>}
      />

      <Table
        headers={['Nom', 'Email', 'Poste', 'Role', 'Modules autorises', 'Statut', '']}
        empty="Aucun agent enregistre"
      >
        {agents.map((a) => (
          <Tr key={a.id}>
            <Td>
              <span style={{ fontWeight: 500 }}>{a.prenom} {a.nom}</span>
            </Td>
            <Td muted>{a.email}</Td>
            <Td muted>{a.poste ?? '-'}</Td>
            <Td>
              <Badge variant={a.role === 'admin' ? 'green' : a.role === 'senior' ? 'blue' : 'gray'}>
                {LABELS_ROLE[a.role] ?? a.role}
              </Badge>
            </Td>
            <Td>
              {a.role === 'admin' || a.role === 'super_admin' ? (
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Tous les modules</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {(a.modules_autorises ?? []).map((m: string) => (
                    <span key={m} style={{
                      fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
                      background: 'rgba(27,67,50,0.08)', color: 'var(--accent)', fontWeight: 500,
                    }}>
                      {MODULES_LISTE.find((x) => x.key === m)?.label ?? m}
                    </span>
                  ))}
                </div>
              )}
            </Td>
            <Td>
              <Badge variant={a.actif ? 'green' : 'red'}>
                {a.actif ? 'Actif' : 'Desactive'}
              </Badge>
            </Td>
            <Td>
              {a.id !== currentUserId && (
                <Button
                  variant="ghost" size="sm"
                  style={{ color: a.actif ? 'var(--danger)' : 'var(--accent)' }}
                  onClick={() => toggleActif(a)}
                >
                  {a.actif ? 'Desactiver' : 'Reactiver'}
                </Button>
              )}
            </Td>
          </Tr>
        ))}
      </Table>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Creer un nouvel agent"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button onClick={save} loading={saving}>Creer le compte</Button>
          </>
        }
      >
        {err && (
          <div style={{ background: '#FDECEA', border: '1px solid #F1AEAD', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {err}
          </div>
        )}

        <FieldRow>
          <Field label="Nom" required half>
            <input type="text" value={form.nom} onChange={(e) => f('nom', e.target.value)} />
          </Field>
          <Field label="Prenom" half>
            <input type="text" value={form.prenom} onChange={(e) => f('prenom', e.target.value)} />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="Email" required half>
            <input type="email" value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="agent@mairie-gamba.ga" />
          </Field>
          <Field label="Mot de passe" required half>
            <input type="password" value={form.password} onChange={(e) => f('password', e.target.value)} placeholder="8 caracteres minimum" />
          </Field>
        </FieldRow>

        <FieldRow>
          <Field label="Poste" half>
            <input type="text" value={form.poste} onChange={(e) => f('poste', e.target.value)} placeholder="ex: Agent d'etat civil" />
          </Field>
          <Field label="Service" half>
            <input type="text" value={form.service} onChange={(e) => f('service', e.target.value)} placeholder="ex: Etat civil" />
          </Field>
        </FieldRow>

        <Field label="Role" required>
          <select value={form.role} onChange={(e) => f('role', e.target.value as RoleUtilisateur)}>
            <option value="admin">Administrateur (acces total)</option>
            <option value="senior">Agent senior (lecture + ecriture)</option>
            <option value="saisie">Agent de saisie (saisie uniquement)</option>
          </select>
        </Field>

        {form.role !== 'admin' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{
              fontSize: '11px', fontWeight: 600, color: 'var(--text2)',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px',
            }}>
              Modules autorises
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {MODULES_LISTE.map((m) => (
                <label key={m.key} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                  border: `1px solid ${form.modules.includes(m.key) ? 'var(--accent)' : 'var(--border)'}`,
                  background: form.modules.includes(m.key) ? 'rgba(27,67,50,0.06)' : 'var(--surface)',
                }}>
                  <input
                    type="checkbox"
                    checked={form.modules.includes(m.key)}
                    onChange={() => toggleModule(m.key)}
                    style={{ accentColor: 'var(--accent)', width: '14px', height: '14px' }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text)', fontWeight: form.modules.includes(m.key) ? 500 : 400 }}>
                    {m.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}