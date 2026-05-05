/**
 * RUTA: /auth/callback
 *
 * Per què existeix?
 * Supabase Auth no pot guardar la sessió directament al navegador per seguretat.
 * En comptes, envia l'usuari aquí amb un codi o token temporal.
 * Aquesta ruta l'intercanvia per una sessió real i redirigeix l'usuari.
 *
 * Quan s'usa:
 * - Quan algú accepta una invitació (type=invite)
 * - Quan algú fa login amb magic link (type=magiclink)
 * - Quan algú confirma el seu email (type=email)
 *
 * EN ANGULAR: seria com un AuthCallbackComponent amb ActivatedRoute
 * que llegeix els query params i crida AuthService.handleCallback().
 * Aquí és una Route Handler (només s'executa al servidor, no és una pàgina).
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Flux 1: OAuth o magic link amb "code" (PKCE flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL('/votar', requestUrl.origin))
    }
  }

  // Flux 2: Invitació o email confirmation amb token_hash (OTP flow)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'invite' | 'magiclink' | 'email' | 'recovery' | 'signup',
    })

    if (!error && data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()

      const redirectTo = userData?.is_admin ? '/admin' : '/votar'
      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
    }
  }

  // Si alguna cosa ha fallat, redirigim al login amb missatge d'error
  return NextResponse.redirect(
    new URL('/login?error=invitation_expired', requestUrl.origin)
  )
}
