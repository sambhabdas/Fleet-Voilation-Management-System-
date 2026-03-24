import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '@/services'
import { registerFCM, unregisterFCM, onForegroundMessage } from '@/services/fcm'
import { notification } from 'antd'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set up foreground FCM message handler
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const { title, body } = payload.notification || {}
      notification.warning({
        message: title || 'Fleet Violation Alert',
        description: body || 'A new violation has been detected.',
        placement: 'topRight',
        duration: 6,
      })
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authService.getMe()
        .then((res) => {
          setUser(res.data)
          // Register FCM token on session restore
          registerFCM().catch(() => {})
        })
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const res = await authService.login(username, password)
    localStorage.setItem('access_token', res.data.access_token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    // Register FCM token after login
    registerFCM().catch(() => {})
    return res.data
  }

  const logout = () => {
    unregisterFCM().catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
