import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { hasModuleAccess } from '@/lib/utils'
import FoncierClient from './FoncierClient'

export default async function FoncierPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await sb
    .from('profiles')
    .select('mairie_id, role, modules_autorises')
    .eq('id', user.id)
    .single()

  if (!profile?.mairie_id) return <div>Profil incomplet.</div>

  if (!hasModuleAccess(profile.role, profile.modules_autorises, 'foncier')) {
    redirect('/dashboard')
  }

  const mid = profile.mairie_id

  const { data: parcelles } = await sb
    .from('parcelles')
    .select('*')
    .eq('mairie_id', mid)
    .is('deleted_at', null)
    .order('numero_parcelle')

  const { count: nbLitiges } = await sb
    .from('parcelles')
    .select('*', { count: 'exact', head: true })
    .eq('mairie_id', mid)
    .eq('statut', 'litige')
    .is('deleted_at', null)

  return (
    <FoncierClient
      parcelles={parcelles ?? []}
      stats={{ litiges: nbLitiges ?? 0 }}
      role={profile.role}
      mairieId={mid}
    />
  )
}