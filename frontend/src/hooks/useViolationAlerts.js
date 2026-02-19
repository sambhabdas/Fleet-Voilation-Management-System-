import { useRef, useCallback, useState } from 'react'

export default function useViolationAlerts() {
  const [isAlerting, setIsAlerting] = useState(false)
  const audioCtxRef = useRef(null)
  const oscillatorRef = useRef(null)
  const flashRef = useRef(null)
  const timeoutRef = useRef(null)

  const triggerAlert = useCallback((severity = 'high') => {
    setIsAlerting(true)

    // Audio siren
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (severity === 'high' || severity === 'critical') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3)
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.6)
        osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.9)
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 1.2)
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
      } else {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.5)
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 1.0)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
      }

      osc.start()
      osc.stop(ctx.currentTime + 1.5)
      oscillatorRef.current = osc
      osc.onended = () => {
        ctx.close()
        audioCtxRef.current = null
      }
    } catch (e) {
      // Audio may not be available
    }

    // Visual flash overlay
    if (!flashRef.current) {
      const flash = document.createElement('div')
      flash.id = 'violation-flash-overlay'
      flash.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255, 0, 0, 0.3); z-index: 9999;
        pointer-events: none; animation: flashPulse 0.5s ease-in-out 3;
      `
      // Add keyframes if not already present
      if (!document.getElementById('flash-keyframes')) {
        const style = document.createElement('style')
        style.id = 'flash-keyframes'
        style.textContent = `
          @keyframes flashPulse {
            0%, 100% { opacity: 0; }
            50% { opacity: 1; }
          }
        `
        document.head.appendChild(style)
      }
      document.body.appendChild(flash)
      flashRef.current = flash
      setTimeout(() => {
        if (flashRef.current) {
          flashRef.current.remove()
          flashRef.current = null
        }
      }, 2000)
    }

    // Vibration
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }

    // Auto-stop alert state after 2s
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setIsAlerting(false)
    }, 2000)
  }, [])

  const stopAlert = useCallback(() => {
    setIsAlerting(false)
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop() } catch (e) { /* already stopped */ }
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close() } catch (e) { /* already closed */ }
    }
    if (flashRef.current) {
      flashRef.current.remove()
      flashRef.current = null
    }
    if (navigator.vibrate) navigator.vibrate(0)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  return { triggerAlert, stopAlert, isAlerting }
}
