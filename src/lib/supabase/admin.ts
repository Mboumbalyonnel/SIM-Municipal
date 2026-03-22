import { createClient } from '@supabase/supabase-js'

// Client avec service_role — uniquement cote serveur
// Ne jamais exposer cote client
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
