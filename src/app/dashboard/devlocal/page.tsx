import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasModuleAccess } from '@/lib/utils'
import DevLocalClient from './DevLocalClient'

export default async function DevLocalPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb
    .from('profiles')
    .select('mairie_id, role, modules_autorises')
    .eq('id', user.id)
    .single()

  if (!profile?.mairie_id) return <div>Profil incomplet.</div>

  if (!hasModuleAccess(profile.role, profile.modules_autorises, 'devlocal')) {
    redirect('/dashboard')
  }

  const mid = profile.mairie_id

  const { data: entrepreneurs } = await sb
    .from('entrepreneurs')
    .select('*')
    .eq('mairie_id', mid)
    .is('deleted_at', null)
    .order('nom')

  const { data: projets } = await sb
    .from('projets')
    .select('*, entrepreneur:entrepreneurs(nom, raison_sociale)')
    .eq('mairie_id', mid)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <DevLocalClient
      entrepreneurs={entrepreneurs ?? []}
      projets={projets ?? []}
      role={profile.role}
      mairieId={mid}
    />
  )
}