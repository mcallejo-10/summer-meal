'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output.buffer as ArrayBuffer
}

async function subscribeAndSave() {
  const registration = await navigator.serviceWorker.ready
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) return

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToArrayBuffer(publicKey),
  })

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  })
}

export default function PwaSetup() {
  // null = carregant, true = mostrar banner, false = no mostrar
  const [showBanner, setShowBanner] = useState<boolean>(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) return

    navigator.serviceWorker.register('/sw.js').catch(console.error)

    // Si ja tenim permís, subscriure's automàticament (sense gesture)
    if (Notification.permission === 'granted') {
      subscribeAndSave().catch(console.error)
      return
    }

    // Si ja ha denegat, no fer res
    if (Notification.permission === 'denied') return

    // Permís 'default': comprovar si l'usuari és autenticat per mostrar el banner
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setShowBanner(true)
    }
    checkUser().catch(console.error)
  }, [])

  const handleEnableNotifications = async () => {
    setShowBanner(false)
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        await subscribeAndSave()
      }
    } catch (err) {
      console.error('Error activant notificacions:', err)
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
      <p className="text-sm font-medium">
        🔔 Vols rebre recordatoris per votar el menú?
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setShowBanner(false)}
          className="text-sm px-3 py-1 rounded border border-white/50 hover:bg-orange-600 transition-colors"
        >
          Ara no
        </button>
        <button
          onClick={handleEnableNotifications}
          className="text-sm px-3 py-1 rounded bg-white text-orange-500 font-semibold hover:bg-orange-50 transition-colors"
        >
          Activar
        </button>
      </div>
    </div>
  )
}
