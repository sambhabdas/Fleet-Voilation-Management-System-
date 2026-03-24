import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { FIREBASE_CONFIG, FIREBASE_VAPID_KEY } from '@/constants'

let messagingInstance = null

function getMessagingInstance() {
  if (messagingInstance) return messagingInstance
  if (!FIREBASE_CONFIG.apiKey) return null
  try {
    const app = initializeApp(FIREBASE_CONFIG)
    messagingInstance = getMessaging(app)
    return messagingInstance
  } catch {
    return null
  }
}

/**
 * Request notification permission and register FCM token with backend.
 */
export async function registerFCM() {
  const messaging = getMessagingInstance()
  if (!messaging) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const token = await getToken(messaging, { vapidKey: FIREBASE_VAPID_KEY })
    if (!token) return null

    // Register token with backend
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      await fetch('/api/fcm/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      })
    }

    return token
  } catch {
    return null
  }
}

/**
 * Unregister FCM token from backend.
 */
export async function unregisterFCM() {
  try {
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      await fetch('/api/fcm/register', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    }
  } catch {
    // Ignore errors on logout
  }
}

/**
 * Listen for foreground FCM messages. Returns unsubscribe function.
 */
export function onForegroundMessage(callback) {
  const messaging = getMessagingInstance()
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    callback(payload)
  })
}
