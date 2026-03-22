import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasModuleAccess } from '@/lib/utils'
import MarchesClient from './MarchesClient'

export default async function MarchesPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb
    .from('profiles')
    .select('mairie_id, role, modules_autorises')
    .eq('id', user.id)
    .single()

  if (!profile?.mairie_id) return <div>Profil incomplet.</div>

  if (!hasModuleAccess(profile.role, profile.modules_autorises, 'marches')) {
    redirect('/dashboard')
  }

  const mid = profile.mairie_id

  const { data: marches } = await sb
    .from('marches')
    .select('*')
    .eq('mairie_id', mid)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <MarchesClient
      marches={marches ?? []}
      role={profile.role}
      mairieId={mid}
    />
  )
}