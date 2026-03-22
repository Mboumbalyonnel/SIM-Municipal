import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasModuleAccess } from '@/lib/utils'
import TaxesClient from './TaxesClient'

export default async function TaxesPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb
    .from('profiles')
    .select('mairie_id, role, modules_autorises')
    .eq('id', user.id)
    .single()

  if (!profile?.mairie_id) return <div>Profil incomplet.</div>

  if (!hasModuleAccess(profile.role, profile.modules_autorises, 'taxes')) {
    redirect('/dashboard')
  }

  const mid = profile.mairie_id
  const now = new Date()
  const annee = now.getFullYear()

  const { data: paiements } = await sb
    .from('paiements_taxes')
    .select('*, contribuable:contribuables(nom, type_contribuable)')
    .eq('mairie_id', mid)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { count: nbRetard } = await sb
    .from('paiements_taxes').select('*', { count: 'exact', head: true })
    .eq('mairie_id', mid).eq('statut', 'en_retard').is('deleted_at', null)

  const { count: nbPaye } = await sb
    .from('paiements_taxes').select('*', { count: 'exact', head: true })
    .eq('mairie_id', mid).eq('statut', 'paye').is('deleted_at', null)

  const { data: paiementsAnnee } = await sb
    .from('paiements_taxes')
    .select('montant_paye, statut, created_at, date_paiement')
    .eq('mairie_id', mid)
    .eq('statut', 'paye')
    .is('deleted_at', null)
    .gte('date_paiement', `${annee}-01-01`)
    .lte('date_paiement', `${annee}-12-31`)

  return (
    <TaxesClient
      paiements={paiements ?? []}
      paiementsAnnee={paiementsAnnee ?? []}
      annee={annee}
      stats={{
        retard: nbRetard ?? 0,
        paye:   nbPaye ?? 0,
        total:  (paiements ?? []).length,
      }}
      role={profile.role}
      mairieId={mid}
    />
  )
}