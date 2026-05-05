import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * MIDDLEWARE de Next.js
 * 
 * S'executa ABANS de processar qualsevol petició a les rutes configurades.
 * 
 * EN ANGULAR: Equivalent als Route Guards (canActivate).
 * La diferència és que en Angular el guard s'executa al navegador (l'usuari
 * ja ha descarregat el JS). Aquí s'executa al SERVIDOR, abans d'enviar res.
 * 
 * Funcions:
 * 1. Refresca la sessió de Supabase (les cookies expiren, cal renovar-les)
 * 2. Protegeix /admin i /votar: si no tens sessió, et redirigeix a /login
 * 3. Si ja tens sessió i vas a /login, et redirigeix a /votar (evita pantalla de login innecessària)
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: NO eliminar aquesta línia. Refresca la sessió de l'usuari.
  // Si no la cridem, la sessió pot expirar i l'usuari es desconnecta.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/votar')

  const isLoginPage = request.nextUrl.pathname === '/login'

  // Si la ruta requereix auth i no hi ha sessió → redirigir a /login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si ja estàs logat i vas a /login → redirigir a /votar directament
  if (isLoginPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/votar'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

/**
 * CONFIG: A quines rutes s'aplica el middleware.
 * 
 * El matcher diu: "executa el middleware per a TOTES les rutes EXCEPTE
 * les que comencen per _next/static, _next/image, favicon.ico, o
 * fitxers estàtics (svg, png, etc.)"
 * 
 * Això és important perquè NO volem que el middleware processi
 * imatges, CSS, JS... només pàgines HTML reals.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
