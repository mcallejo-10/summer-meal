'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ChefHat, Mail, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

/**
 * Per què separem LoginForm en un component apart?
 * 
 * Next.js obliga a embolcallar useSearchParams() dins d'un <Suspense>.
 * Si no ho fem, el build falla. És una restricció de Next.js amb SSR.
 * EN ANGULAR: seria com un component lazy-loaded que es resol asincronament.
 */
function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }

    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa el teu correu</h2>
          <p className="text-gray-600 mb-6">
            Hem enviat un link d&apos;accés a <strong>{email}</strong>.
            Clica el link per entrar a l&apos;aplicació.
          </p>
          <p className="text-sm text-gray-400">
            No has rebut res? Revisa la carpeta de spam o{' '}
            <button
              onClick={() => setSent(false)}
              className="text-orange-600 hover:text-orange-800 font-medium"
            >
              torna a intentar-ho
            </button>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Summer Meal</h2>
            <p className="text-gray-500 mt-1">Entra el teu correu per accedir</p>
          </div>

          {(error || urlError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {urlError === 'invitation_expired'
                ? 'El link ha caducat. Sol·licita un nou link d’accés.'
                : error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correu electrònic
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800"
                  placeholder="el.teu@correu.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar link d&apos;accés
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Rebràs un link al correu per entrar directament.
            No cal contrasenya.
          </p>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-orange-600 hover:text-orange-800">
            ← Tornar a l&apos;inici
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
