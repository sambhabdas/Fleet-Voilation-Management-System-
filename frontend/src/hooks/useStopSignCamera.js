/**
 * Stop Sign Camera Detection Hook
 * Uses COCO-SSD for real-time stop sign detection
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

// Detection configuration (see DriverCamera / fusion — ~250ms loop, multi-frame confirm)
const CONFIG = {
  DETECTION_INTERVAL: 250,
  CONFIDENCE_THRESHOLD: 0.28,
  ZOOM_CONFIDENCE_THRESHOLD: 0.22,
  CONSECUTIVE_DETECTIONS: 2,
  MAX_DETECTIONS: 12,
  ZOOM_FACTOR: 2,
}

/**
 * Hook for stop sign detection using camera feed
 * @param {React.RefObject<HTMLVideoElement>} videoRef - Reference to video element
 * @param {Function} onDetect - Callback when stop sign is detected (passes detection info)
 * @param {Function} onLost - Callback when stop sign is no longer visible
 * @param {React.MutableRefObject} bboxOverlayRef - Optional ref for latest bbox draw info { bbox, label }
 * @returns {Object} Detection state and controls
 */
export default function useStopSignCamera(videoRef, onDetect, onLost, bboxOverlayRef) {
  const modelRef = useRef(null)
  const detectionIntervalRef = useRef(null)
  const isDetectingRef = useRef(false)
  const consecutiveDetectionsRef = useRef(0)
  const lastDetectionRef = useRef(null)
  const isModelLoadingRef = useRef(false)
  const zoomCanvasRef = useRef(null)
  const [isModelReady, setIsModelReady] = useState(false)
  const [isModelLoading, setIsModelLoading] = useState(false)

  const detectFrameRunningRef = useRef(false)

  // Load COCO-SSD model.
  const loadModel = useCallback(async () => {
    if (modelRef.current || isModelLoadingRef.current) return

    isModelLoadingRef.current = true
    setIsModelLoading(true)

    try {
      console.log('[StopSignCamera] Loading COCO-SSD model...')
      await tf.setBackend('webgl')
      await tf.ready()

      const loadedModel = await cocoSsd.load({ base: 'mobilenet_v2' })
      modelRef.current = loadedModel
      setIsModelReady(true)
      console.log('[StopSignCamera] COCO-SSD model ready')
    } catch (error) {
      console.error('[StopSignCamera] Failed to load model:', error)
    } finally {
      isModelLoadingRef.current = false
      setIsModelLoading(false)
    }
  }, [])

  // Detect stop signs in video frame
  const detectFrame = useCallback(async () => {
    if (detectFrameRunningRef.current) {
      return
    }

    if (!modelRef.current) {
      console.log('[StopSignCamera] detectFrame: model not ready')
      return
    }
    if (!videoRef.current) {
      console.log('[StopSignCamera] detectFrame: video ref not ready')
      return
    }
    if (!isDetectingRef.current) {
      console.log('[StopSignCamera] detectFrame: detection not enabled')
      return
    }

    // Check video readiness
    if (videoRef.current.readyState < 2) {
      console.log('[StopSignCamera] detectFrame: video not ready, state:', videoRef.current.readyState)
      return
    }

    try {
      detectFrameRunningRef.current = true

      const detectStopSign = async (input, threshold) => {
        const detections = await modelRef.current.detect(input, CONFIG.MAX_DETECTIONS, threshold)
        return detections
          .filter((d) => d.class === 'stop sign' && d.score >= threshold)
          .sort((a, b) => b.score - a.score)[0] || null
      }

      let stopSign = await detectStopSign(videoRef.current, CONFIG.CONFIDENCE_THRESHOLD)
      let mappedBbox = null

      if (!stopSign) {
        const videoEl = videoRef.current
        const frameW = videoEl.videoWidth
        const frameH = videoEl.videoHeight

        if (frameW > 0 && frameH > 0) {
          if (!zoomCanvasRef.current) {
            zoomCanvasRef.current = document.createElement('canvas')
          }

          const zoomCanvas = zoomCanvasRef.current
          zoomCanvas.width = frameW
          zoomCanvas.height = frameH

          const cropW = frameW / CONFIG.ZOOM_FACTOR
          const cropH = frameH / CONFIG.ZOOM_FACTOR
          const sx = (frameW - cropW) / 2
          const sy = (frameH - cropH) / 2

          const ctx = zoomCanvas.getContext('2d')
          if (!ctx) {
            return
          }
          ctx.drawImage(videoEl, sx, sy, cropW, cropH, 0, 0, frameW, frameH)

          const zoomHit = await detectStopSign(zoomCanvas, CONFIG.ZOOM_CONFIDENCE_THRESHOLD)
          if (zoomHit) {
            const [zx, zy, zw, zh] = zoomHit.bbox
            mappedBbox = [
              sx + (zx / frameW) * cropW,
              sy + (zy / frameH) * cropH,
              (zw / frameW) * cropW,
              (zh / frameH) * cropH,
            ]
            stopSign = { ...zoomHit, bbox: mappedBbox }
          }
        }
      }

      if (stopSign) {
        const [x, y, width, height] = mappedBbox || stopSign.bbox
        if (bboxOverlayRef) {
          bboxOverlayRef.current = {
            bbox: [x, y, width, height],
            label: 'STOP SIGN',
          }
        }

        console.log('[StopSignCamera] Stop sign found! confidence:', `${(stopSign.score * 100).toFixed(1)}%`)
        consecutiveDetectionsRef.current++

        // Only trigger after consecutive detections to reduce false positives
        if (consecutiveDetectionsRef.current >= CONFIG.CONSECUTIVE_DETECTIONS) {
          const detectionInfo = {
            type: 'STOP_SIGN',
            confidence: stopSign.score,
            bbox: [x, y, width, height], // [x, y, width, height]
            timestamp: Date.now(),
          }

          // Emit at detection cadence once confirmed; fusion layer handles cooldown.
          lastDetectionRef.current = detectionInfo
          onDetect?.(detectionInfo)
        }
      } else {
        if (bboxOverlayRef) {
          bboxOverlayRef.current = null
        }
        // No stop sign detected
        if (consecutiveDetectionsRef.current >= CONFIG.CONSECUTIVE_DETECTIONS) {
          // Sign was lost after being detected
          onLost?.(lastDetectionRef.current)
        }
        consecutiveDetectionsRef.current = 0
        lastDetectionRef.current = null
      }
    } catch (error) {
      console.error('[StopSignCamera] Detection error:', error)
    } finally {
      detectFrameRunningRef.current = false
    }
  }, [videoRef, onDetect, onLost, bboxOverlayRef])

  // Keep a ref to detectFrame so interval always uses latest version
  const detectFrameRef = useRef(detectFrame)
  useEffect(() => {
    detectFrameRef.current = detectFrame
  }, [detectFrame])

  // Initialize model on mount
  useEffect(() => {
    loadModel()

    return () => {
      // Cleanup
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [loadModel])

  // Control methods - start/stop the interval directly
  const startDetection = useCallback(async () => {
    if (isDetectingRef.current) return

    // Wait for model to load if not ready
    if (!modelRef.current) {
      console.log('[StopSignCamera] Model not ready, loading...')
      await loadModel()
      // Wait a bit for model to be assigned
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    if (!modelRef.current) {
      console.error('[StopSignCamera] Failed to load model, cannot start detection')
      return
    }

    console.log('[StopSignCamera] Starting detection')
    isDetectingRef.current = true
    // Start the detection interval - use ref wrapper so it always calls latest detectFrame
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
    }
    detectionIntervalRef.current = setInterval(() => {
      detectFrameRef.current()
    }, CONFIG.DETECTION_INTERVAL)
  }, [loadModel])

  const stopDetection = useCallback(() => {
    console.log('[StopSignCamera] Stopping detection')
    isDetectingRef.current = false
    consecutiveDetectionsRef.current = 0
    lastDetectionRef.current = null
    // Stop the detection interval
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current)
      detectionIntervalRef.current = null
    }
  }, [])

  return {
    isModelReady,
    isModelLoading,
    startDetection,
    stopDetection,
    isDetecting: isDetectingRef.current,
  }
}
