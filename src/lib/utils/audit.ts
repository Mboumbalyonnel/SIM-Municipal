import { createClient } from '@/lib/supabase/server'

interface AuditParams {
  action: string
  table_cible: string
  enregistrement_id?: string
  valeur_avant?: Record<string, unknown> | null
  valeur_apres?: Record<string, unknown> | null
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('nom, prenom, mairie_id')
      .eq('id', user.id)
      .single()

    if (!profile) return

    await supabase.from('audit_log').insert({
      utilisateur_id:   user.id,
      utilisateur_nom:  `${profile.prenom} ${profile.nom}`.trim(),
      mairie_id:        profile.mairie_id,
      action:           params.action,
      table_cible:      params.table_cible,
      enregistrement_id: params.enregistrement_id ?? null,
      valeur_avant:     params.valeur_avant ?? null,
      valeur_apres:     params.valeur_apres ?? null,
    })
  } catch {
    // Ne pas bloquer l'action principale si le log echoue
  }
}
