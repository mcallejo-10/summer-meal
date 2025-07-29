import { createBrowserClient } from '@supabase/ssr'
import { env } from './env'

// Instancia global de cliente para evitar múltiples instancias
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

export const supabase = createClient()
