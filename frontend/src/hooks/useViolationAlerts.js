import { useRef, useCallback, useState } from 'react'

export default function useViolationAlerts() {
  const [isAlerting, setIsAlerting] = useState(false)
  const audioCtxRef = useRef(null)
  const oscillatorRef = useRef(null)
  const flashRef = useRef(null)
  const timeoutRef = useRef(null)
  const speechQueueRef = useRef([])
  const isSpeakingRef = useRef(false)

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

  /**
   * Voice announcement using Web Speech API
   * @param {string} message - Text to speak
   * @param {Object} options - Speech options
   */
  const speak = useCallback((message, options = {}) => {
    const {
      rate = 1.0, // Speech rate (0.1 - 10)
      pitch = 1.0, // Pitch (0 - 2)
      volume = 1.0, // Volume (0 - 1)
      priority = false, // If true, interrupt current speech
    } = options

    if (!('speechSynthesis' in window)) {
      console.warn('[VoiceAlert] Speech synthesis not supported')
      return
    }

    // Cancel current speech if high priority
    if (priority) {
      window.speechSynthesis.cancel()
      speechQueueRef.current = []
      isSpeakingRef.current = false
    }

    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    // Try to use a natural English voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(
      (voice) => voice.lang.startsWith('en') && voice.localService
    ) || voices.find((voice) => voice.lang.startsWith('en'))

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => {
      isSpeakingRef.current = true
    }

    utterance.onend = () => {
      isSpeakingRef.current = false
      // Process next in queue
      if (speechQueueRef.current.length > 0) {
        const next = speechQueueRef.current.shift()
        window.speechSynthesis.speak(next)
      }
    }

    utterance.onerror = (event) => {
      console.error('[VoiceAlert] Speech error:', event)
      isSpeakingRef.current = false
    }

    // Queue or speak immediately
    if (isSpeakingRef.current && !priority) {
      speechQueueRef.current.push(utterance)
    } else {
      window.speechSynthesis.speak(utterance)
    }
  }, [])

  /**
   * Stop current voice announcement
   */
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      speechQueueRef.current = []
      isSpeakingRef.current = false
    }
  }, [])

  /**
   * Trigger alert with voice announcement for stop signs
   * @param {string} message - Voice message to announce
   * @param {string} severity - Alert severity
   */
  const triggerVoiceAlert = useCallback((message, severity = 'high') => {
    // Trigger visual/audio alert
    triggerAlert(severity)

    // Announce voice message
    speak(message, {
      rate: 0.9, // Slightly slower for clarity
      pitch: severity === 'high' || severity === 'critical' ? 0.9 : 1.0,
      volume: 1.0,
      priority: true, // Interrupt any current speech
    })
  }, [triggerAlert, speak])

  return {
    triggerAlert,
    stopAlert,
    isAlerting,
    speak,
    stopSpeaking,
    triggerVoiceAlert,
    isSpeaking: isSpeakingRef.current,
  }
}
