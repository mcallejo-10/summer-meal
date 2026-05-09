'use client'

import { useEffect } from 'react'
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

export default function PwaSetup() {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const setup = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Registra el service worker
      const registration = await navigator.serviceWorker.register('/sw.js')

      // Comprova si ja tenim permís
      if (Notification.permission === 'denied') return

      // Subscriu a push notifications
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!publicKey) return

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(publicKey),
      })

      // Envia la subscripció al servidor
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })
    }

    setup().catch(console.error)
  }, [])

  return null
}
