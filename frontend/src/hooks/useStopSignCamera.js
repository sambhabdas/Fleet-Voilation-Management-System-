/**
 * Stop Sign Camera Detection Hook
 * Uses TensorFlow.js and COCO-SSD model for real-time stop sign detection
 */

import { useEffect, useRef, useCallback } from 'react'
import * as cocoSsd from '@tensorflow-models/coco-ssd'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'

// Detection configuration (see DriverCamera / fusion — ~300ms loop, multi-frame confirm)
const CONFIG = {
  DETECTION_INTERVAL: 300,
  CONFIDENCE_THRESHOLD: 0.55,
  CONSECUTIVE_DETECTIONS: 2,
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

  // Load COCO-SSD model
  const loadModel = useCallback(async () => {
    if (modelRef.current || isModelLoadingRef.current) return

    isModelLoadingRef.current = true
    try {
      console.log('[StopSignCamera] Loading COCO-SSD model...')
      await tf.setBackend('webgl')
      await tf.ready()
      modelRef.current = await cocoSsd.load({
        base: 'mobilenet_v2',
      })
      console.log('[StopSignCamera] Model loaded successfully')
    } catch (error) {
      console.error('[StopSignCamera] Failed to load model:', error)
    } finally {
      isModelLoadingRef.current = false
    }
  }, [])

  // Detect stop signs in video frame
  const detectFrame = useCallback(async () => {
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
      const predictions = await modelRef.current.detect(videoRef.current)

      // Log all predictions for debugging
      if (predictions.length > 0) {
        console.log('[StopSignCamera] Predictions:', predictions.map(p => `${p.class}(${(p.score * 100).toFixed(1)}%)`).join(', '))
      }

      // Find stop sign predictions (COCO-SSD class: "stop sign" or "traffic light")
      const stopSign = predictions.find(
        (p) =>
          (p.class === 'stop sign' || p.class === 'traffic light') &&
          p.score > CONFIG.CONFIDENCE_THRESHOLD
      )

      if (stopSign) {
        if (bboxOverlayRef) {
          bboxOverlayRef.current = {
            bbox: stopSign.bbox,
            label: stopSign.class === 'stop sign' ? 'STOP SIGN' : 'TRAFFIC LIGHT',
          }
        }
        console.log('[StopSignCamera] Stop sign found!', stopSign.class, 'confidence:', (stopSign.score * 100).toFixed(1) + '%')
        consecutiveDetectionsRef.current++
        console.log('[StopSignCamera] Consecutive detections:', consecutiveDetectionsRef.current, '/', CONFIG.CONSECUTIVE_DETECTIONS)

        // Only trigger after consecutive detections to reduce false positives
        if (consecutiveDetectionsRef.current >= CONFIG.CONSECUTIVE_DETECTIONS) {
          const detectionInfo = {
            type: stopSign.class === 'stop sign' ? 'STOP_SIGN' : 'TRAFFIC_LIGHT',
            confidence: stopSign.score,
            bbox: stopSign.bbox, // [x, y, width, height]
            timestamp: Date.now(),
          }

          // Only call onDetect if this is a new detection or significantly different
          if (
            !lastDetectionRef.current ||
            lastDetectionRef.current.type !== detectionInfo.type ||
            Math.abs(lastDetectionRef.current.confidence - detectionInfo.confidence) > 0.2
          ) {
            console.log('[StopSignCamera] Triggering onDetect callback!', detectionInfo)
            lastDetectionRef.current = detectionInfo
            onDetect?.(detectionInfo)
          }
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

  const isModelReady = !!modelRef.current
  const isModelLoading = isModelLoadingRef.current

  return {
    isModelReady,
    isModelLoading,
    startDetection,
    stopDetection,
    isDetecting: isDetectingRef.current,
  }
}
