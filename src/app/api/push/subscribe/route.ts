import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'

async function getAuthenticatedUser() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ error: 'No autenticat' }, { status: 401 })

  const { subscription } = await request.json()
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: 'Subscripció invàlida' }, { status: 400 })
  }

  const { data: appUser } = await createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!appUser) return NextResponse.json({ error: 'Usuari no trobat' }, { status: 404 })

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      { onConflict: 'endpoint' }
    )

  if (error) {
    console.error('Error guardant subscripció push:', error)
    return NextResponse.json({ error: 'Error guardant subscripció' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
