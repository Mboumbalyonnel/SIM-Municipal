import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UtilisateursClient from './UtilisateursClient'

export default async function UtilisateursPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('mairie_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.mairie_id) return <div>Profil incomplet.</div>
  if (!['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  const { data: agents } = await supabase
    .from('profiles')
    .select('*')
    .eq('mairie_id', profile.mairie_id)
    .is('deleted_at', null)
    .order('nom')

  return (
    <UtilisateursClient
      agents={agents ?? []}
      mairieId={profile.mairie_id}
      currentUserId={user.id}
    />
  )
}