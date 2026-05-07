/**
 * RUTA: /api/admin/users
 *
 * Gestió d'usuaris des del panell d'administració.
 *
 * Per què una API Route i no des del client directament?
 * Les operacions com convidar o eliminar usuaris d'Auth requereixen
 * la SERVICE_ROLE KEY. Aquesta clau mai pot estar al navegador
 * (qualsevol podria veure-la i tenir control total de la BD).
 * Per tant, totes les operacions privilegiades passen per aquí.
 *
 * EN ANGULAR: seria com un controller de Spring Boot — el frontend
 * crida /api/admin/users i el servidor fa l'operació real.
 *
 * Operacions:
 * - GET    → llista tots els usuaris de public.users
 * - POST   → convida un nou usuari (envia email + crea registre)
 * - PATCH  → actualitza nom o rol d'un usuari existent
 * - DELETE → elimina un usuari (en cascada des d'auth.users)
 */

import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

// ── Client admin (service role) ───────────────────────────────────────────────
// SERVICE_ROLE KEY → bypassa les Row Level Security policies de la BD.
// autoRefreshToken/persistSession: false → no guarda res, és un client de servidor.
//
// EN ANGULAR: com un HttpClient configurat amb un token de servei secret
// que l'usuari final mai veu.
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Helper: verificar que el requestor és admin ───────────────────────────────
// Llegeix la sessió de les cookies de la petició (igual que el middleware).
// Retorna l'usuari autenticat si és admin, null en qualsevol altre cas.
//
// Dos passos de seguretat:
//   1. Té sessió vàlida? (JWT verificat per Supabase)
//   2. Té is_admin = true a la taula users?
async function requireAdmin() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return data?.is_admin ? user : null
}

// ── GET: llista tots els usuaris ──────────────────────────────────────────────
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── POST: convidar un nou usuari ──────────────────────────────────────────────
// inviteUserByEmail fa dues coses alhora:
//   1. Crea un registre a auth.users (pendent de confirmació)
//   2. Envia un email amb el link d'activació
//
// El trigger SQL `handle_new_user` (setup-database-v2.sql) escolta els inserts
// a auth.users i crea automàticament el registre a public.users amb el nom
// i is_admin que passem com a `data` (raw_user_meta_data a la BD).
export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { name, email, is_admin } = await request.json()
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "El nom i l'email són obligatoris" },
      { status: 400 }
    )
  }

  // L'origen de la petició determina la URL de callback del magic link
  const origin = new URL(request.url).origin
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { name: name.trim(), is_admin: is_admin ?? false },
    redirectTo: `${origin}/auth/callback`,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data.user })
}

// ── PATCH: actualitzar nom o rol d'un usuari ──────────────────────────────────
export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { id, name, is_admin } = await request.json()
  if (!id) return NextResponse.json({ error: "Falta l'id" }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ name, is_admin })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// ── DELETE: eliminar un usuari ────────────────────────────────────────────────
// deleteUser elimina de auth.users.
// La FK ON DELETE CASCADE elimina automàticament de public.users i tots els seus vots.
export async function DELETE(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: "Falta l'id" }, { status: 400 })

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
