// Validación de variables de entorno
// Estas variables se cargan desde .env.local (ver .env.example)
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

// Verificar que las variables críticas estén definidas (solo lanza error en runtime, no en build)
if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}
