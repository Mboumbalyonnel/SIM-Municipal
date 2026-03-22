import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasModuleAccess } from '@/lib/utils'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('mairie_id, nom, prenom, role, modules_autorises')
    .eq('id', user.id)
    .single()

  if (!profile?.mairie_id) return <div style={{ padding: '32px', color: 'var(--text2)' }}>Profil incomplet.</div>

  const mid = profile.mairie_id
  const modules = profile.modules_autorises as string[] | null
  const role = profile.role

  const [
    { count: nbActes },
    { count: nbHabitants },
    { count: nbRetard },
    { count: nbCourriers },
    { count: nbProjets },
    { count: nbAgents },
    { count: nbParcelles },
    { count: nbMarches },
    { data: recentActes },
    { data: paiementsMois },
    { data: recentProjets },
  ] = await Promise.all([
    hasModuleAccess(role, modules, 'civil')
      ? supabase.from('actes_civils').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).is('deleted_at', null)
      : Promise.resolve({ count: null }),
    hasModuleAccess(role, modules, 'habitants')
      ? supabase.from('habitants').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).is('deleted_at', null)
      : Promise.resolve({ count: null }),
    hasModuleAccess(role, modules, 'taxes')
      ? supabase.from('paiements_taxes').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).eq('statut', 'en_retard').is('deleted_at', null)
      : Promise.resolve({ count: null }),
    supabase.from('courriers').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).eq('statut', 'en_attente').is('deleted_at', null),
    hasModuleAccess(role, modules, 'devlocal')
      ? supabase.from('projets').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).eq('statut', 'en_cours').is('deleted_at', null)
      : Promise.resolve({ count: null }),
    supabase.from('agents').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).eq('statut', 'actif').is('deleted_at', null),
    hasModuleAccess(role, modules, 'foncier')
      ? supabase.from('parcelles').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).is('deleted_at', null)
      : Promise.resolve({ count: null }),
    hasModuleAccess(role, modules, 'marches')
      ? supabase.from('marches').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).is('deleted_at', null)
      : Promise.resolve({ count: null }),
    hasModuleAccess(role, modules, 'civil')
      ? supabase.from('actes_civils').select('numero_acte, type_acte, nom_principal, date_evenement, created_at').eq('mairie_id', mid).is('deleted_at', null).order('created_at', { ascending: false }).limit(6)
      : Promise.resolve({ data: [] }),
    hasModuleAccess(role, modules, 'taxes')
      ? supabase.from('paiements_taxes').select('montant_paye, statut, created_at').eq('mairie_id', mid).is('deleted_at', null).order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] }),
    hasModuleAccess(role, modules, 'devlocal')
      ? supabase.from('projets').select('intitule, statut, avancement, created_at, entrepreneur:entrepreneurs(nom, raison_sociale)').eq('mairie_id', mid).is('deleted_at', null).order('created_at', { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <DashboardClient
      stats={{
        actes:      nbActes     ?? null,
        habitants:  nbHabitants ?? null,
        retard:     nbRetard    ?? null,
        courriers:  nbCourriers ?? 0,
        projets:    nbProjets   ?? null,
        agents:     nbAgents    ?? 0,
        parcelles:  nbParcelles ?? null,
        marches:    nbMarches   ?? null,
      }}
      recentActes={recentActes ?? []}
      paiementsMois={paiementsMois ?? []}
      recentProjets={recentProjets ?? []}
      prenom={profile.prenom}
      modulesAutorises={modules}
      role={role}
    />
  )
}