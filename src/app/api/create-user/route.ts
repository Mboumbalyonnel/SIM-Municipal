import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email, password, nom, prenom,
      poste, service, role, mairie_id, modules_autorises,
    } = body

    const supabase = createAdminClient()

    // Creer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    // Creer le profil manuellement
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        nom,
        prenom,
        poste: poste || null,
        service: service || null,
        role,
        mairie_id,
        modules_autorises: role === 'admin' ? null : modules_autorises,
        actif: true,
      })
      .select()
      .single()

    if (profileError) {
      // Supprimer l'utilisateur auth si le profil echoue
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ profile }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}