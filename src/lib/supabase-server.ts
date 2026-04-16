import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from './env'

/**
 * Client de Supabase per a Server Components i Route Handlers.
 * 
 * EN ANGULAR: No existeix un equivalent directe. En Angular tot s'executa
 * al navegador (client). En Next.js, els Server Components s'executen al
 * servidor, per tant necessitem un client diferent que pugui llegir les
 * cookies HTTP (la sessió de l'usuari).
 * 
 * ÉS IMPORTANT perquè:
 * - Les queries a BD es fan al servidor → més ràpid, més segur
 * - Les dades NO s'envien al navegador fins que estan processades
 * - Les cookies HTTP-only no són accessibles des del navegador
 * 
 * ATENCIÓ: Aquesta funció NOMÉS es pot cridar des de Server Components,
 * Route Handlers (/api/...) o middleware. Mai des de fitxers amb 'use client'.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll pot fallar en Server Components (només lectura).
            // Això és normal, les cookies es setejaran des del middleware.
          }
        },
      },
    }
  )
}
