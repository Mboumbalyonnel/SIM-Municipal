import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PersonnelClient from './PersonnelClient'

export default async function PersonnelPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await sb.from('profiles').select('mairie_id, role').eq('id', user.id).single()
  if (!profile?.mairie_id) return <div>Profil incomplet.</div>
  const mid = profile.mairie_id
  const { data: agents } = await sb.from('agents').select('*').eq('mairie_id', mid).is('deleted_at', null).order('nom')
  const { data: conges } = await sb.from('conges').select('*, agent:agents(nom, prenom)').eq('mairie_id', mid).is('deleted_at', null).order('created_at', { ascending: false }).limit(20)
  return <PersonnelClient agents={agents ?? []} conges={conges ?? []} role={profile.role} mairieId={mid} />
}
