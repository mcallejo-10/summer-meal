import { createBrowserClient } from '@supabase/ssr'
import { env } from './env'

/**
 * Client de Supabase per al NAVEGADOR (components amb 'use client').
 * 
 * EN ANGULAR: Seria com el HttpClient configurat al AppModule.
 * Només hi ha una instància (singleton) per evitar crear connexions duplicades.
 * 
 * IMPORTANT: Només usar en fitxers amb 'use client' al principi.
 * Per a Server Components, usar supabase-server.ts
 */
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabaseInstance
}
