import { useEffect, useRef, useCallback } from 'react'

const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000

export default function useRealtimeUpdates(onEvent) {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)
  const reconnectDelayRef = useRef(RECONNECT_BASE_DELAY)
  const onEventRef = useRef(onEvent)

  useEffect(() => { onEventRef.current = onEvent }, [onEvent])

  const connect = useCallback(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    // Build WebSocket URL from current location
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${proto}//${window.location.host}/api/ws/notifications?token=${encodeURIComponent(token)}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectDelayRef.current = RECONNECT_BASE_DELAY
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.type && msg.type !== 'connected' && onEventRef.current) {
          onEventRef.current(msg.type, msg.data)
        }
      } catch {
        // Ignore parse errors
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      // Reconnect with exponential backoff
      const delay = reconnectDelayRef.current
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectDelayRef.current = Math.min(delay * 2, RECONNECT_MAX_DELAY)
        connect()
      }, delay)
    }

    ws.onerror = () => {
      // onclose will fire after onerror
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // Prevent reconnect on intentional close
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])
}
