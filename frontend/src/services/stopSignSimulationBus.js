const CHANNEL_NAME = 'fleet-stop-sign-simulation'
const STORAGE_KEY = 'fleet-stop-sign-simulation:last-event'

function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function publishStopSignSimulation(event) {
  const payload = {
    id: event?.id || createEventId(),
    source: 'simulation',
    timestamp: event?.timestamp || new Date().toISOString(),
    ...event,
  }

  if (typeof window === 'undefined') {
    return payload
  }

  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.postMessage(payload)
    channel.close()
  } else {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch (error) {
      console.warn('[StopSignSim] Failed to persist simulation event:', error)
    }
  }

  return payload
}

export function subscribeStopSignSimulation(handler) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  let channel = null
  const onMessage = (event) => handler(event.data)
  const onStorage = (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return

    try {
      handler(JSON.parse(event.newValue))
    } catch (error) {
      console.warn('[StopSignSim] Failed to parse simulation event:', error)
    }
  }

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME)
    channel.addEventListener('message', onMessage)
  } else {
    window.addEventListener('storage', onStorage)
  }

  return () => {
    if (channel) {
      channel.removeEventListener('message', onMessage)
      channel.close()
    } else {
      window.removeEventListener('storage', onStorage)
    }
  }
}