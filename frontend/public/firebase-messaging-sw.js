/* eslint-disable no-undef */
// Firebase Messaging Service Worker for background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// Firebase config will be sent via messaging.getToken() — the SW auto-configures
// But we need a minimal init for the compat SDK
firebase.initializeApp({
  // These values must match your Firebase project config.
  // They are safe to expose in client-side code (they are not secrets).
  // Replace with your actual Firebase project values.
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  const notificationTitle = title || 'Fleet Violation Alert'
  const notificationOptions = {
    body: body || 'A new violation has been detected.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
    tag: 'violation-' + (payload.data?.violation_id || Date.now()),
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click — open the violations page
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const violationId = event.notification.data?.violation_id
  const url = violationId ? `/violations/${violationId}` : '/violations'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
