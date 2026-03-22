import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasModuleAccess } from '@/lib/utils'
import CivilClient from './CivilClient'

export default async function CivilPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb
    .from('profiles')
    .select('mairie_id, role, modules_autorises')
    .eq('id', user.id)
    .single()

  if (!profile?.mairie_id) return <div>Profil incomplet.</div>

  if (!hasModuleAccess(profile.role, profile.modules_autorises, 'civil')) {
    redirect('/dashboard')
  }

  const { data: mairie } = await sb
    .from('mairies')
    .select('nom, province, pays, sceau_url')
    .eq('id', profile.mairie_id)
    .single()

  const { data: actes } = await sb
    .from('actes_civils')
    .select('*')
    .eq('mairie_id', profile.mairie_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const { count: nbNaissances } = await sb
    .from('actes_civils').select('*', { count: 'exact', head: true })
    .eq('mairie_id', profile.mairie_id).eq('type_acte', 'naissance').is('deleted_at', null)

  const { count: nbMariages } = await sb
    .from('actes_civils').select('*', { count: 'exact', head: true })
    .eq('mairie_id', profile.mairie_id).eq('type_acte', 'mariage').is('deleted_at', null)

  const { count: nbDeces } = await sb
    .from('actes_civils').select('*', { count: 'exact', head: true })
    .eq('mairie_id', profile.mairie_id).eq('type_acte', 'deces').is('deleted_at', null)

  return (
    <CivilClient
      actes={actes ?? []}
      stats={{ naissances: nbNaissances ?? 0, mariages: nbMariages ?? 0, deces: nbDeces ?? 0 }}
      role={profile.role}
      mairieId={profile.mairie_id}
      mairie={{
        nom:       mairie?.nom       ?? 'Mairie',
        province:  mairie?.province  ?? '',
        pays:      mairie?.pays      ?? 'Gabon',
        sceau_url: mairie?.sceau_url ?? null,
      }}
    />
  )
}