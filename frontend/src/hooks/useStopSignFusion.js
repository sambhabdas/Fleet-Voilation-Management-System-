/**
 * Stop Sign Fusion Engine
 * Combines camera detection, GPS data, and OSM data to make intelligent alert decisions
 */

import { useRef, useCallback, useEffect } from 'react'
import { getNearbySigns, getDistance, getTimeToReach } from '../utils/geo'

// Alert configuration
const CONFIG = {
  // Distance thresholds (in meters)
  EARLY_WARNING_DISTANCE: 150, // Initial alert distance
  MEDIUM_WARNING_DISTANCE: 100, // Stronger alert
  CLOSE_WARNING_DISTANCE: 50, // Urgent alert

  // Speed thresholds (km/h)
  LOW_SPEED_THRESHOLD: 15, // Below this = likely stopped/stopping
  HIGH_SPEED_THRESHOLD: 30, // Above this at close range = violation

  // Cooldowns (ms)
  ALERT_COOLDOWN: 5000, // Time between same-sign alerts
  VIOLATION_COOLDOWN: 10000, // Time between violation records

  // Camera detection weight
  CAMERA_DETECTION_RADIUS: 50, // Only trust camera if OSM sign is within this range
}

// Alert priority levels
const ALERT_PRIORITY = {
  NONE: 0,
  INFO: 1,
  WARNING: 2,
  URGENT: 3,
  VIOLATION: 4,
}

function detectionTypeMatchesSign(detectionType, osmSign) {
  if (detectionType === 'STOP_SIGN') return osmSign.type === 'stop_sign'
  if (detectionType === 'TRAFFIC_LIGHT') return osmSign.type === 'traffic_light'
  return false
}

/**
 * Fusion engine hook for stop sign alerts
 * @param {Object} params
 * @param {Function} params.getLocation - Returns current location {lat, lng, heading?}
 * @param {Function} params.getSpeed - Returns current speed in km/h
 * @param {Function} params.triggerViolation - Called to record a violation
 * @param {Array} params.trafficSigns - Array of traffic signs from OSM
 */
export default function useStopSignFusion({
  getLocation,
  getSpeed,
  triggerViolation,
  trafficSigns = [],
}) {
  const lastAlertRef = useRef({}) // Map of signId -> last alert time
  const alertedSignsRef = useRef(new Set()) // Signs currently being alerted
  const passedSignsRef = useRef(new Set()) // Signs already passed
  const cameraDetectionRef = useRef(null) // Latest camera detection

  /**
   * Determine alert priority based on distance and speed
   */
  const getAlertPriority = useCallback((distance, speed) => {
    if (distance > CONFIG.EARLY_WARNING_DISTANCE) {
      return ALERT_PRIORITY.NONE
    }

    // High speed at close range = violation
    if (distance < CONFIG.CLOSE_WARNING_DISTANCE && speed > CONFIG.HIGH_SPEED_THRESHOLD) {
      return ALERT_PRIORITY.VIOLATION
    }

    // Close range = urgent
    if (distance < CONFIG.CLOSE_WARNING_DISTANCE) {
      return ALERT_PRIORITY.URGENT
    }

    // Medium range with decent speed = warning
    if (distance < CONFIG.MEDIUM_WARNING_DISTANCE && speed > CONFIG.LOW_SPEED_THRESHOLD) {
      return ALERT_PRIORITY.WARNING
    }

    // Early warning
    if (speed > CONFIG.LOW_SPEED_THRESHOLD) {
      return ALERT_PRIORITY.INFO
    }

    return ALERT_PRIORITY.NONE
  }, [])

  /**
   * Get alert message based on priority and sign type
   */
  const getAlertMessage = useCallback((sign, priority, timeToReach) => {
    const signName = sign.label || 'Traffic sign'
    const timeStr = timeToReach ? `in ${Math.round(timeToReach)} seconds` : ''

    switch (priority) {
      case ALERT_PRIORITY.VIOLATION:
        return `VIOLATION: ${signName} ahead - you're not slowing down!`
      case ALERT_PRIORITY.URGENT:
        return `Stop! ${signName} very close ahead ${timeStr}`
      case ALERT_PRIORITY.WARNING:
        return `${signName} ahead ${timeStr} - prepare to stop`
      case ALERT_PRIORITY.INFO:
      default:
        return `${signName} ahead ${timeStr}`
    }
  }, [])

  /**
   * Check if we should alert for a sign (cooldown check)
   */
  const shouldAlert = useCallback((signId, priority) => {
    const now = Date.now()
    const lastAlert = lastAlertRef.current[signId]
    const cooldown = priority === ALERT_PRIORITY.VIOLATION
      ? CONFIG.VIOLATION_COOLDOWN
      : CONFIG.ALERT_COOLDOWN

    if (lastAlert && now - lastAlert < cooldown) {
      return false
    }

    return true
  }, [])

  /**
   * Process GPS-based sign detection
   */
  const processGPS = useCallback(() => {
    const location = getLocation()
    const speed = getSpeed()

    if (!location || !trafficSigns.length) {
      return []
    }

    // Get nearby signs
    const nearby = getNearbySigns(location, trafficSigns, CONFIG.EARLY_WARNING_DISTANCE)
    const alerts = []

    nearby.forEach((sign) => {
      // Skip if already passed (sign is behind us)
      if (passedSignsRef.current.has(sign.id)) {
        return
      }

      // Check if we should alert
      const priority = getAlertPriority(sign.distance, speed)
      if (priority === ALERT_PRIORITY.NONE) {
        return
      }

      if (!shouldAlert(sign.id, priority)) {
        return
      }

      // Update last alert time
      lastAlertRef.current[sign.id] = Date.now()

      // Calculate time to reach
      const timeToReach = getTimeToReach(sign.distance, speed)

      // Create alert
      const alert = {
        type: 'GPS',
        sign,
        priority,
        distance: sign.distance,
        speed,
        timeToReach,
        message: getAlertMessage(sign, priority, timeToReach),
        timestamp: Date.now(),
      }

      alerts.push(alert)

      // Trigger violation if needed
      if (priority === ALERT_PRIORITY.VIOLATION) {
        triggerViolation('STOP_SIGN_VIOLATION', {
          latitude: sign.lat,
          longitude: sign.lng,
          speed,
          signType: sign.type,
          signLabel: sign.label,
          distance: sign.distance,
        })
      }

      // Mark as passed if very close and speed is low
      if (sign.distance < 20 && speed < CONFIG.LOW_SPEED_THRESHOLD) {
        passedSignsRef.current.add(sign.id)
      }
    })

    // Sort by priority (highest first) then distance (closest first)
    alerts.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority
      }
      return a.distance - b.distance
    })

    return alerts
  }, [getLocation, getSpeed, trafficSigns, getAlertPriority, shouldAlert, getAlertMessage, triggerViolation])

  /**
   * Process camera-based detection
   * Works without GPS: camera-only path alerts + records STOP_SIGN_DETECTED.
   */
  const processCameraDetection = useCallback((detection) => {
    cameraDetectionRef.current = detection

    if (!detection) {
      return null
    }

    const location = getLocation()
    const speed = getSpeed()
    const cameraAlertKey = `camera:${detection.type}`

    const signLabel =
      detection.type === 'STOP_SIGN'
        ? 'Stop Sign'
        : detection.type === 'TRAFFIC_LIGHT'
          ? 'Traffic Light'
          : 'Traffic sign'

    const payloadBase = {
      latitude: location?.lat ?? null,
      longitude: location?.lng ?? null,
      speed,
      signLabel,
      detectionConfidence: detection.confidence,
    }

    const emitCameraOnlyAlert = () => {
      if (!shouldAlert(cameraAlertKey, ALERT_PRIORITY.WARNING)) {
        return null
      }
      lastAlertRef.current[cameraAlertKey] = Date.now()
      triggerViolation('STOP_SIGN_DETECTED', payloadBase)
      return {
        type: 'CAMERA_ONLY',
        detection,
        priority: ALERT_PRIORITY.WARNING,
        confidence: detection.confidence,
        message: `${signLabel} detected (camera)`,
        timestamp: Date.now(),
      }
    }

    // No GPS or no OSM data → camera-only (do not require location)
    if (!location || !trafficSigns.length) {
      return emitCameraOnlyAlert()
    }

    const nearby = getNearbySigns(location, trafficSigns, CONFIG.CAMERA_DETECTION_RADIUS * 2)
    const matchingSigns = nearby.filter((sign) => detectionTypeMatchesSign(detection.type, sign))

    if (matchingSigns.length === 0) {
      return emitCameraOnlyAlert()
    }

    const sign = matchingSigns[0]
    const priority = getAlertPriority(sign.distance, speed)

    if (priority === ALERT_PRIORITY.NONE) {
      return null
    }

    if (!shouldAlert(sign.id, priority)) {
      return null
    }

    lastAlertRef.current[sign.id] = Date.now()

    const alert = {
      type: 'CAMERA_CONFIRMED',
      sign,
      detection,
      priority,
      distance: sign.distance,
      speed,
      message: getAlertMessage(sign, priority, getTimeToReach(sign.distance, speed)),
      timestamp: Date.now(),
    }

    if (priority === ALERT_PRIORITY.VIOLATION) {
      triggerViolation('STOP_SIGN_VIOLATION', {
        latitude: sign.lat,
        longitude: sign.lng,
        speed,
        signType: sign.type,
        signLabel: sign.label,
        detectionConfidence: detection.confidence,
      })
    } else {
      triggerViolation('STOP_SIGN_DETECTED', {
        ...payloadBase,
        latitude: sign.lat,
        longitude: sign.lng,
        signLabel: sign.label,
        distance: sign.distance,
      })
    }

    return alert
  }, [getLocation, getSpeed, trafficSigns, getAlertPriority, shouldAlert, getAlertMessage, triggerViolation])

  /**
   * Reset state (e.g., when route changes)
   */
  const reset = useCallback(() => {
    lastAlertRef.current = {}
    alertedSignsRef.current.clear()
    passedSignsRef.current.clear()
    cameraDetectionRef.current = null
  }, [])

  // Return fusion engine API
  return {
    processGPS,
    processCameraDetection,
    reset,
    alertedSigns: alertedSignsRef.current,
    passedSigns: passedSignsRef.current,
  }
}
