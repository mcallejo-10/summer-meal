import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createAdminClient } from '@supabase/supabase-js'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return data?.is_admin ? user : null
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autoritzat' }, { status: 403 })

  const { userIds, title, body } = await request.json()
  if (!userIds?.length) {
    return NextResponse.json({ error: 'Cal especificar userIds' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: subscriptions, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', userIds)

  if (error || !subscriptions?.length) {
    return NextResponse.json({ sent: 0, message: 'Cap subscripció trobada' })
  }

  const payload = JSON.stringify({
    title: title || 'Summer Meal 🍽️',
    body: body || "Encara no has votat per a l'àpat d'avui. Fes-ho ara!",
    url: '/votar',
  })

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  )

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.length - sent

  // Elimina subscripcions invàlides (410 Gone)
  const expiredEndpoints = subscriptions
    .filter((_, i) => {
      const result = results[i]
      return result.status === 'rejected' &&
        (result.reason as { statusCode?: number })?.statusCode === 410
    })
    .map((s) => s.endpoint)

  if (expiredEndpoints.length) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .in('endpoint', expiredEndpoints)
  }

  return NextResponse.json({ sent, failed })
}
