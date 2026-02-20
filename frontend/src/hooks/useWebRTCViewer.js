import { useRef, useCallback, useState } from 'react'
import { ICE_SERVERS } from '@/constants'

export default function useWebRTCViewer(cameraId) {
  const [isConnected, setIsConnected] = useState(false)
  const [remoteStream, setRemoteStream] = useState(null)
  const wsRef = useRef(null)
  const pcRef = useRef(null)

  const connect = useCallback(() => {
    if (!cameraId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/signaling/${cameraId}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ role: 'viewer' }))
    }

    const startViewing = async () => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      pcRef.current = pc

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0])
        setIsConnected(true)
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ice-candidate', data: e.candidate }))
        }
      }

      pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
          setIsConnected(false)
          setRemoteStream(null)
        }
      }

      // Need to add a transceiver to receive video/audio
      pc.addTransceiver('video', { direction: 'recvonly' })
      pc.addTransceiver('audio', { direction: 'recvonly' })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      ws.send(JSON.stringify({ type: 'offer', data: offer }))
    }

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === 'publisher-available' || msg.type === 'publisher-joined') {
        await startViewing()
      } else if (msg.type === 'answer' && pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(msg.data))
      } else if (msg.type === 'ice-candidate' && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(msg.data))
        } catch (e) {
          // ICE candidate error
        }
      } else if (msg.type === 'publisher-left') {
        setIsConnected(false)
        setRemoteStream(null)
        if (pcRef.current) {
          pcRef.current.close()
          pcRef.current = null
        }
      }
    }

    ws.onerror = () => setIsConnected(false)
    ws.onclose = () => {
      setIsConnected(false)
      setRemoteStream(null)
    }
  }, [cameraId])

  const disconnect = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
    setRemoteStream(null)
  }, [])

  return { connect, disconnect, remoteStream, isConnected }
}
