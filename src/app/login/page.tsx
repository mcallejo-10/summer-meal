'use client'

import { useState, Suspense, useRef } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { ChefHat, Mail, Send, KeyRound } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

/**
 * Per què separem LoginForm en un component apart?
 *
 * Next.js obliga a embolcallar useSearchParams() dins d'un <Suspense>.
 * Si no ho fem, el build falla. És una restricció de Next.js amb SSR.
 */
function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState('')
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const router = useRouter()
  const supabase = createClient()

  // — Pas 1: enviar el codi OTP per correu
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // No passem emailRedirectTo: l'usuari rebrà NOMÉS el codi de 6 dígits,
    // sense link. Això evita el problema d'Apple Mail / Outlook que
    // pre-carreguen el link i "consumeixen" el token abans que l'usuari el cliqui.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // No crear usuaris nous; només els ja registrats
      },
    })

    if (error) {
      console.error('signInWithOtp error:', error)
      setError('No s\'ha pogut enviar el codi. Comprova el correu i torna-ho a provar.')
    } else {
      setStep('otp')
    }

    setLoading(false)
  }

  // — Pas 2: verificar el codi OTP introduït per l'usuari
  const handleVerifyOtp = async (code: string) => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    })

    if (error || !data.user) {
      setError('Codi incorrecte o caducat. Torna a demanar un nou codi.')
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
      setLoading(false)
      return
    }

    // Comprova si l'usuari té accés (existeix a la taula users)
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', data.user.id)
      .single()

    if (!userData) {
      await supabase.auth.signOut()
      setError('No tens accés. Sol·licita una invitació a un administrador.')
      setStep('email')
      setLoading(false)
      return
    }

    router.push(userData.is_admin ? '/admin' : '/votar')
  }

  // Gestiona el canvi a cada casella del codi OTP
  const handleOtpChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = char
    setOtp(newOtp)

    if (char && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    const fullCode = newOtp.join('')
    if (fullCode.length === 6 && !newOtp.includes('')) {
      handleVerifyOtp(fullCode)
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      handleVerifyOtp(paste)
    }
  }

  // — Pantalla: introducció del codi
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Comprova el teu correu</h2>
          <p className="text-gray-600 mb-6">
            Hem enviat un codi de 6 dígits a <strong>{email}</strong>.
            Escriu-lo aquí per entrar.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-center mb-6" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => handleOtpKeyDown(i, e)}
                disabled={loading}
                autoFocus={i === 0}
                className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-100 text-gray-900"
              />
            ))}
          </div>

          {loading && (
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
            </div>
          )}

          <p className="text-sm text-gray-400">
            No has rebut res? Revisa el spam o{' '}
            <button
              onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError('') }}
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

  // — Pantalla: introducció del correu
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

          {urlError === 'invitation_expired' ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg mb-6 text-sm">
              Ja estàs registrat! Introdueix el teu correu i t&apos;enviarem el codi per entrar.
            </div>
          ) : (error || urlError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {urlError === 'no_access'
                ? 'No tens accés. Sol·licita una invitació a un administrador.'
                : error}
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-4">
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
                  Enviar codi d&apos;accés
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Rebràs un codi de 6 dígits al correu. No cal contrasenya.
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
