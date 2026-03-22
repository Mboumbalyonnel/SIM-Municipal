import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AuditClient from './AuditClient'

export default async function AuditPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await sb.from('profiles').select('mairie_id, role').eq('id', user.id).single()
  if (!profile?.mairie_id) return <div>Profil incomplet.</div>
  if (!['admin', 'super_admin'].includes(profile.role)) redirect('/dashboard')
  const { data: logs } = await sb.from('audit_log').select('*').eq('mairie_id', profile.mairie_id).order('created_at', { ascending: false }).limit(200)
  return <AuditClient logs={logs ?? []} />
}
