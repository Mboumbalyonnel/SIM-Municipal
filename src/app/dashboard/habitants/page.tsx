import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasModuleAccess } from '@/lib/utils'
import HabitantsClient from './HabitantsClient'

export default async function HabitantsPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb
    .from('profiles')
    .select('mairie_id, role, modules_autorises')
    .eq('id', user.id)
    .single()

  if (!profile?.mairie_id) return <div>Profil incomplet.</div>

  if (!hasModuleAccess(profile.role, profile.modules_autorises, 'habitants')) {
    redirect('/dashboard')
  }

  const mid = profile.mairie_id
  const { data: habitants } = await sb
    .from('habitants')
    .select('*')
    .eq('mairie_id', mid)
    .is('deleted_at', null)
    .order('nom')

  return <HabitantsClient habitants={habitants ?? []} role={profile.role} mairieId={mid} />
}