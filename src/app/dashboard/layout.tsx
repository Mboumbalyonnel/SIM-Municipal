import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { hasModuleAccess } from '@/lib/utils'

const ROUTE_MODULE_MAP: Record<string, string> = {
  civil:      'civil',
  habitants:  'habitants',
  taxes:      'taxes',
  courriers:  'courriers',
  devlocal:   'devlocal',
  personnel:  'personnel',
  foncier:    'foncier',
  marches:    'marches',
}

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params?: { segments?: string[] }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, mairie:mairies(nom, statut)')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.actif) redirect('/login')

  // Detecter le module depuis l'URL
  if (typeof window === 'undefined') {
    const { headers } = await import('next/headers')
    const headersList = headers()
    const pathname = headersList.get('x-pathname') ?? headersList.get('x-invoke-path') ?? ''
    const segments = pathname.split('/').filter(Boolean)
    const moduleSegment = segments[1] // /dashboard/[module]
    if (moduleSegment && ROUTE_MODULE_MAP[moduleSegment]) {
      const moduleKey = ROUTE_MODULE_MAP[moduleSegment]
      if (!hasModuleAccess(profile.role, profile.modules_autorises, moduleKey)) {
        redirect('/dashboard')
      }
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <Sidebar
        role={profile.role}
        modulesAutorises={profile.modules_autorises}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Topbar
          nom={profile.prenom + ' ' + profile.nom}
          role={profile.role}
          mairie={(profile.mairie as { nom: string } | null)?.nom ?? 'Mairie'}
          avatarUrl={profile.avatar_url}
        />
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {children}
        </main>
      </div>
    </div>
  )
}