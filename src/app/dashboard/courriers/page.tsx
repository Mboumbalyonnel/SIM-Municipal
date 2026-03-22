import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourriersClient from './CourriersClient'

export default async function CourriersPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await sb.from('profiles').select('mairie_id, role').eq('id', user.id).single()
  if (!profile?.mairie_id) return <div>Profil incomplet.</div>
  const mid = profile.mairie_id
  const { data: courriers } = await sb.from('courriers').select('*').eq('mairie_id', mid).is('deleted_at', null).order('created_at', { ascending: false })
  const { count: nbAttente } = await sb.from('courriers').select('*', { count: 'exact', head: true }).eq('mairie_id', mid).eq('statut', 'en_attente').is('deleted_at', null)
  return <CourriersClient courriers={courriers ?? []} stats={{ enAttente: nbAttente ?? 0 }} role={profile.role} mairieId={mid} />
}
