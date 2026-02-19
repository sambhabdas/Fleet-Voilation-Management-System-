import { useRef, useCallback, useState } from 'react'

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }]

export default function useWebRTCPublisher(cameraId) {
  const [isPublishing, setIsPublishing] = useState(false)
  const [peerCount, setPeerCount] = useState(0)
  const wsRef = useRef(null)
  const peersRef = useRef({}) // viewer_idx -> RTCPeerConnection
  const streamRef = useRef(null)

  const publish = useCallback((localStream) => {
    if (!cameraId || !localStream) return
    streamRef.current = localStream

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/ws/signaling/${cameraId}`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ role: 'publisher' }))
      setIsPublishing(true)
    }

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)
      const viewerIdx = msg.viewer_idx ?? 0

      if (msg.type === 'offer') {
        // Viewer initiated, create answer
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
        peersRef.current[viewerIdx] = pc
        setPeerCount(Object.keys(peersRef.current).length)

        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream))

        pc.onicecandidate = (e) => {
          if (e.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ice-candidate',
              data: e.candidate,
              target: viewerIdx,
            }))
          }
        }

        pc.onconnectionstatechange = () => {
          if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
            pc.close()
            delete peersRef.current[viewerIdx]
            setPeerCount(Object.keys(peersRef.current).length)
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(msg.data))
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        ws.send(JSON.stringify({ type: 'answer', data: answer, target: viewerIdx }))
      } else if (msg.type === 'ice-candidate' && peersRef.current[viewerIdx]) {
        try {
          await peersRef.current[viewerIdx].addIceCandidate(new RTCIceCandidate(msg.data))
        } catch (e) {
          // ICE candidate error
        }
      }
    }

    ws.onerror = () => setIsPublishing(false)
    ws.onclose = () => setIsPublishing(false)
  }, [cameraId])

  const unpublish = useCallback(() => {
    Object.values(peersRef.current).forEach((pc) => pc.close())
    peersRef.current = {}
    setPeerCount(0)
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsPublishing(false)
  }, [])

  return { publish, unpublish, isPublishing, peerCount }
}
