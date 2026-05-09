self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || 'Summer Meal'
  const options = {
    body: data.body || "Recorda votar per a l'àpat d'avui!",
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: data.url || '/votar' },
    vibrate: [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(event.notification.data?.url || '/votar')
          return
        }
      }
      clients.openWindow(event.notification.data?.url || '/votar')
    })
  )
})
