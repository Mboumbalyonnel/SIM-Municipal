'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/ui/PageHeader'
import StatCard from '@/components/ui/StatCard'
import { Table, Tr, Td } from '@/components/ui/Table'
import Badge, { badgeTypeActe } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal, { Field, FieldRow } from '@/components/ui/Modal'
import { formatDate, LABELS_TYPE_ACTE } from '@/lib/utils'
import type { ActeCivil, RoleUtilisateur } from '@/types'

interface MairieInfo { nom: string; province: string; pays: string; sceau_url: string | null }
interface Props {
  actes: ActeCivil[]
  stats: { naissances: number; mariages: number; deces: number }
  role: RoleUtilisateur
  mairieId: string
  mairie: MairieInfo
}

const EMPTY = {
  numero_acte: '', type_acte: 'naissance', date_evenement: '',
  page_registre: '', annee_registre: new Date().getFullYear().toString(),
  nom_principal: '', prenom_principal: '', date_naissance: '',
  lieu_naissance: '', nationalite: 'Gabonaise',
  nom_pere: '', nom_mere: '', nom_conjoint: '', prenom_conjoint: '',
  declarant: '', temoin1: '', temoin2: '', observations: '',
}

export default function CivilClient({ actes: init, stats, role, mairieId, mairie }: Props) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [actes, setActes] = useState<ActeCivil[]>(init)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editActe, setEditActe] = useState<ActeCivil | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [recepisseActe, setRecepisseActe] = useState<ActeCivil | null>(null)

  const canWrite = ['admin', 'senior', 'saisie'].includes(role)
  const canEdit  = role === 'admin' || role === 'senior'

  const filtered = actes.filter((a) => {
    const s = search.toLowerCase()
    const matchS = !s || a.nom_principal.toLowerCase().includes(s) ||
      a.numero_acte.toLowerCase().includes(s) ||
      (a.prenom_principal ?? '').toLowerCase().includes(s)
    return matchS && (!filterType || a.type_acte === filterType)
  })

  function f(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  function openNew() {
    setEditActe(null)
    setForm({ ...EMPTY })
    setErr('')
    setModalOpen(true)
  }

  function openEdit(acte: ActeCivil) {
    setEditActe(acte)
    setForm({
      numero_acte:      acte.numero_acte,
      type_acte:        acte.type_acte,
      date_evenement:   acte.date_evenement,
      page_registre:    acte.page_registre,
      annee_registre:   String(acte.annee_registre),
      nom_principal:    acte.nom_principal,
      prenom_principal: acte.prenom_principal ?? '',
      date_naissance:   acte.date_naissance ?? '',
      lieu_naissance:   acte.lieu_naissance ?? '',
      nationalite:      acte.nationalite ?? 'Gabonaise',
      nom_pere:         acte.nom_pere ?? '',
      nom_mere:         acte.nom_mere ?? '',
      nom_conjoint:     acte.nom_conjoint ?? '',
      prenom_conjoint:  acte.prenom_conjoint ?? '',
      declarant:        acte.declarant ?? '',
      temoin1:          acte.temoin1 ?? '',
      temoin2:          acte.temoin2 ?? '',
      observations:     acte.observations ?? '',
    })
    setErr('')
    setModalOpen(true)
  }

  async function save() {
    setErr('')
    if (!form.numero_acte.trim())    { setErr("Le numero d'acte est obligatoire."); return }
    if (!form.date_evenement)         { setErr("La date est obligatoire."); return }
    if (!form.nom_principal.trim())   { setErr("Le nom est obligatoire."); return }
    if (!form.page_registre.trim())   { setErr("La page du registre est obligatoire."); return }
    setSaving(true)
    const sb = createClient()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) { setSaving(false); return }

    const payload = {
      ...form,
      annee_registre:   parseInt(form.annee_registre),
      prenom_principal: form.prenom_principal || null,
      date_naissance:   form.date_naissance || null,
      lieu_naissance:   form.lieu_naissance || null,
      nom_pere:         form.type_acte === 'deces' ? null : form.nom_pere || null,
      nom_mere:         form.type_acte === 'deces' ? null : form.nom_mere || null,
      nom_conjoint:     form.type_acte === 'mariage' ? form.nom_conjoint || null : null,
      prenom_conjoint:  form.type_acte === 'mariage' ? form.prenom_conjoint || null : null,
      declarant:        form.declarant || null,
      temoin1:          form.type_acte === 'deces' ? null : form.temoin1 || null,
      temoin2:          form.type_acte === 'deces' ? null : form.temoin2 || null,
      observations:     form.observations || null,
    }

    if (editActe) {
      const { data, error } = await sb
        .from('actes_civils').update(payload).eq('id', editActe.id).select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setActes((p) => p.map((a) => a.id === editActe.id ? data as ActeCivil : a))
    } else {
      const { data, error } = await sb
        .from('actes_civils')
        .insert({ ...payload, mairie_id: mairieId, created_by: user.id })
        .select().single()
      if (error) { setErr(error.message); setSaving(false); return }
      setActes((p) => [data as ActeCivil, ...p])
    }

    setModalOpen(false)
    setEditActe(null)
    setForm({ ...EMPTY })
    setSaving(false)
    startT(() => router.refresh())
  }

  async function softDelete(id: string) {
    if (!confirm('Desactiver cet acte ?')) return
    const sb = createClient()
    await sb.from('actes_civils').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    setActes((p) => p.filter((a) => a.id !== id))
  }

  async function marquerImprime(acte: ActeCivil) {
    const sb = createClient()
    await sb.from('actes_civils')
      .update({ recepisse_imprime: true, recepisse_date: new Date().toISOString() })
      .eq('id', acte.id)
    setActes((p) => p.map((a) => a.id === acte.id ? { ...a, recepisse_imprime: true } : a))
  }

  return (
    <div>
      <PageHeader
        title="Etat civil"
        description="Enregistrement des naissances, mariages et deces. L'acte original reste manuscrit."
        action={canWrite ? <Button onClick={openNew}>+ Nouvel acte</Button> : undefined}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard label="Naissances"  value={stats.naissances} sub="total" />
        <StatCard label="Mariages"    value={stats.mariages}   sub="total" />
        <StatCard label="Deces"       value={stats.deces}      sub="total" />
        <StatCard label="Total actes" value={stats.naissances + stats.mariages + stats.deces} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Rechercher par nom ou numero..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px', maxWidth: '380px' }} />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: '150px' }}>
          <option value="">Tous types</option>
          <option value="naissance">Naissances</option>
          <option value="mariage">Mariages</option>
          <option value="deces">Deces</option>
        </select>
        {(search || filterType) && (
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setFilterType('') }}>Reinitialiser</Button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)' }}>
          {filtered.length} resultat{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <Table headers={['N. acte', 'Type', 'Nom', 'Date', 'Registre', 'Recepisse', '']} empty="Aucun acte enregistre">
        {filtered.map((a) => (
          <Tr key={a.id}>
            <Td mono>{a.numero_acte}</Td>
            <Td><Badge variant={badgeTypeActe(a.type_acte)}>{LABELS_TYPE_ACTE[a.type_acte]}</Badge></Td>
            <Td>
              <span style={{ fontWeight: 600 }}>{a.nom_principal}</span>
              {a.prenom_principal && <span style={{ color: 'var(--text3)', marginLeft: '6px' }}>{a.prenom_principal}</span>}
            </Td>
            <Td muted>{formatDate(a.date_evenement)}</Td>
            <Td mono muted>p.{a.page_registre} / {a.annee_registre}</Td>
            <Td>{a.recepisse_imprime ? <Badge variant="green">Imprime</Badge> : <Badge variant="amber">En attente</Badge>}</Td>
            <Td>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                <Button variant="ghost" size="sm" onClick={() => setRecepisseActe(a)}>Recepisse</Button>
                {canEdit && <Button variant="ghost" size="sm" onClick={() => openEdit(a)}>Modifier</Button>}
                {role === 'admin' && (
                  <Button variant="ghost" size="sm" style={{ color: 'var(--danger)' }} onClick={() => softDelete(a.id)}>
                    Desactiver
                  </Button>
                )}
              </div>
            </Td>
          </Tr>
        ))}
      </Table>

      {/* Modal saisie / modification */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditActe(null) }}
        title={editActe ? "Modifier l'acte" : "Enregistrer un nouvel acte"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditActe(null) }}>Annuler</Button>
            <Button onClick={save} loading={saving}>
              {editActe ? 'Enregistrer les modifications' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        {err && (
          <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: '13px', color: 'var(--danger)', marginBottom: '16px' }}>
            {err}
          </div>
        )}

        {/* Informations de base */}
        <FieldRow>
          <Field label="Type d'acte" required half>
            <select value={form.type_acte} onChange={(e) => f('type_acte', e.target.value)}>
              <option value="naissance">Naissance</option>
              <option value="mariage">Mariage</option>
              <option value="deces">Deces</option>
            </select>
          </Field>
          <Field label="Numero d'acte" required half>
            <input type="text" value={form.numero_acte} onChange={(e) => f('numero_acte', e.target.value)}
              placeholder="ex: 2025-148" style={{ fontFamily: 'JetBrains Mono, monospace' }} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label={form.type_acte === 'deces' ? 'Date du deces' : "Date de l'evenement"} required half>
            <input type="date" value={form.date_evenement} onChange={(e) => f('date_evenement', e.target.value)} />
          </Field>
          <Field label="Page registre papier" required half>
            <input type="text" value={form.page_registre} onChange={(e) => f('page_registre', e.target.value)} placeholder="34" />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Annee du registre" required half>
            <input type="number" value={form.annee_registre} onChange={(e) => f('annee_registre', e.target.value)} />
          </Field>
          <Field label="Nationalite" half>
            <input type="text" value={form.nationalite} onChange={(e) => f('nationalite', e.target.value)} />
          </Field>
        </FieldRow>

        {/* Personne concernee */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', paddingTop: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            {form.type_acte === 'deces' ? 'Personne decedee' : 'Personne concernee'}
          </div>
          <FieldRow>
            <Field label="Nom" required half>
              <input type="text" value={form.nom_principal} onChange={(e) => f('nom_principal', e.target.value)} />
            </Field>
            <Field label="Prenom(s)" half>
              <input type="text" value={form.prenom_principal} onChange={(e) => f('prenom_principal', e.target.value)} />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Date de naissance" half>
              <input type="date" value={form.date_naissance} onChange={(e) => f('date_naissance', e.target.value)} />
            </Field>
            <Field label={form.type_acte === 'deces' ? 'Lieu du deces' : 'Lieu de naissance'} half>
              <input type="text" value={form.lieu_naissance} onChange={(e) => f('lieu_naissance', e.target.value)}
                placeholder={form.type_acte === 'deces' ? 'Lieu ou est survenu le deces' : ''} />
            </Field>
          </FieldRow>

          {/* Pere et mere : uniquement pour naissance et mariage */}
          {form.type_acte !== 'deces' && (
            <FieldRow>
              <Field label="Nom du pere" half>
                <input type="text" value={form.nom_pere} onChange={(e) => f('nom_pere', e.target.value)} />
              </Field>
              <Field label="Nom de la mere" half>
                <input type="text" value={form.nom_mere} onChange={(e) => f('nom_mere', e.target.value)} />
              </Field>
            </FieldRow>
          )}
        </div>

        {/* Conjoint : uniquement pour mariage */}
        {form.type_acte === 'mariage' && (
          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              Conjoint(e)
            </div>
            <FieldRow>
              <Field label="Nom du conjoint" half>
                <input type="text" value={form.nom_conjoint} onChange={(e) => f('nom_conjoint', e.target.value)} />
              </Field>
              <Field label="Prenom du conjoint" half>
                <input type="text" value={form.prenom_conjoint} onChange={(e) => f('prenom_conjoint', e.target.value)} />
              </Field>
            </FieldRow>
          </div>
        )}

        {/* Declaration et temoins */}
        <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0', paddingTop: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            {form.type_acte === 'deces' ? 'Declaration' : 'Temoins et declaration'}
          </div>
          <FieldRow>
            <Field label="Declarant" required half>
              <input type="text" value={form.declarant} onChange={(e) => f('declarant', e.target.value)} />
            </Field>
            {form.type_acte !== 'deces' && (
              <Field label="Temoin 1" half>
                <input type="text" value={form.temoin1} onChange={(e) => f('temoin1', e.target.value)} />
              </Field>
            )}
          </FieldRow>
          {form.type_acte !== 'deces' && (
            <FieldRow>
              <Field label="Temoin 2" half>
                <input type="text" value={form.temoin2} onChange={(e) => f('temoin2', e.target.value)} />
              </Field>
            </FieldRow>
          )}
          <Field label="Observations">
            <textarea value={form.observations} onChange={(e) => f('observations', e.target.value)} style={{ height: '60px' }} />
          </Field>
        </div>
      </Modal>

      {/* Recepisse */}
      {recepisseActe && (
        <RecepisseModal
          acte={recepisseActe}
          mairie={mairie}
          onClose={() => setRecepisseActe(null)}
          onPrint={() => marquerImprime(recepisseActe)}
        />
      )}
    </div>
  )
}

function RecepisseModal({ acte, mairie, onClose, onPrint }: {
  acte: ActeCivil
  mairie: MairieInfo
  onClose: () => void
  onPrint: () => void
}) {
  return (
    <Modal open onClose={onClose} title="Recepisse de declaration" size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fermer</Button>
          <Button onClick={() => { onPrint(); window.print() }}>Imprimer</Button>
        </>
      }
    >
      <div id="recepisse-content" style={{ fontFamily: 'sans-serif', fontSize: '13px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', borderBottom: '2px solid #1B4332', paddingBottom: '14px', marginBottom: '18px' }}>
          {mairie.sceau_url && (
            <img src={mairie.sceau_url} alt="Sceau officiel"
              style={{ width: '70px', height: '70px', objectFit: 'contain', flexShrink: 0 }} />
          )}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B6960', marginBottom: '2px' }}>
              {mairie.pays}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1B4332' }}>{mairie.nom}</div>
            <div style={{ fontSize: '11px', color: '#6B6960', marginBottom: '10px' }}>
              Province de {mairie.province}
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1A1916', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recepisse de declaration
            </div>
            <div style={{ marginTop: '6px', display: 'inline-block', background: '#FFF3CD', color: '#7D4E00', padding: '3px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>
              DOCUMENT NON OFFICIEL
            </div>
          </div>
        </div>

        <div style={{ lineHeight: 2 }}>
          {[
            { l: "Type d'acte",   v: LABELS_TYPE_ACTE[acte.type_acte] },
            { l: "Numero d'acte", v: acte.numero_acte, mono: true },
            { l: "Date",          v: formatDate(acte.date_evenement, 'd MMMM yyyy') },
            { l: "Nom complet",   v: `${acte.nom_principal}${acte.prenom_principal ? ' ' + acte.prenom_principal : ''}` },
            acte.date_naissance ? { l: "Date de naissance", v: formatDate(acte.date_naissance, 'd MMMM yyyy') } : null,
            acte.lieu_naissance ? { l: acte.type_acte === 'deces' ? 'Lieu du deces' : 'Lieu de naissance', v: acte.lieu_naissance } : null,
            acte.nom_pere       ? { l: "Nom du pere",       v: acte.nom_pere } : null,
            acte.nom_mere       ? { l: "Nom de la mere",    v: acte.nom_mere } : null,
            acte.nom_conjoint   ? { l: "Conjoint(e)",       v: `${acte.nom_conjoint} ${acte.prenom_conjoint ?? ''}`.trim() } : null,
          ].filter(Boolean).map((row) => row && (
            <div key={row.l} style={{ display: 'flex', gap: '8px' }}>
              <span style={{ width: '150px', flexShrink: 0, color: '#6B6960', fontSize: '12px' }}>{row.l}</span>
              <span style={{ fontWeight: 600, fontFamily: row.mono ? 'monospace' : undefined }}>{row.v}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #E2E0D8', margin: '8px 0' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <span style={{ width: '150px', flexShrink: 0, color: '#6B6960', fontSize: '12px' }}>Registre papier</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>Page {acte.page_registre} / {acte.annee_registre}</span>
          </div>
        </div>

        <div style={{ marginTop: '18px', padding: '10px 14px', background: '#F9F8F5', border: '1px solid #E2E0D8', borderRadius: '6px', fontSize: '11px', color: '#6B6960', lineHeight: 1.6 }}>
          Ce recepisse atteste de l&apos;enregistrement numerique uniquement. L&apos;acte officiel se trouve page{' '}
          <strong style={{ fontFamily: 'monospace' }}>{acte.page_registre}</strong> du registre {acte.annee_registre},
          signe par l&apos;officier d&apos;etat civil de {mairie.nom}.
        </div>

        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <div style={{ display: 'inline-block', textAlign: 'center', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#6B6960', marginBottom: '36px' }}>
              Delivre le {formatDate(new Date().toISOString(), 'd MMMM yyyy')}
            </div>
            <div style={{ borderTop: '1px solid #1A1916', paddingTop: '4px', fontSize: '11px', color: '#6B6960' }}>
              L&apos;Officier d&apos;etat civil
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #recepisse-content {
            display: block !important;
            background: white !important;
            color: black !important;
            padding: 20px;
          }
          #recepisse-content img {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </Modal>
  )
}