import { getDistance, getNearbySigns } from '@/utils/geo'

function metersToLat(meters) {
  return meters / 111320
}

function metersToLng(meters, latitude) {
  return meters / (111320 * Math.cos(latitude * Math.PI / 180))
}

export function buildMockTrafficSigns(center, options = {}) {
  const latitude = center.lat
  const longitude = center.lng
  const forwardMeters = options.forwardMeters ?? 180
  const sideMeters = options.sideMeters ?? 35

  return [
    {
      id: 'mock-stop-sign-1',
      lat: latitude + metersToLat(forwardMeters),
      lng: longitude + metersToLng(sideMeters, latitude),
      type: 'stop_sign',
      label: 'Stop Sign',
    },
    {
      id: 'mock-stop-sign-2',
      lat: latitude + metersToLat(forwardMeters + 220),
      lng: longitude - metersToLng(sideMeters, latitude),
      type: 'stop_sign',
      label: 'Stop Sign',
    },
    {
      id: 'mock-yield-sign-1',
      lat: latitude + metersToLat(140),
      lng: longitude + metersToLng(80, latitude),
      type: 'yield_sign',
      label: 'Yield Sign',
    },
  ]
}

export function simulateStopSignDetection({
  location,
  speedKmh = 30,
  trafficSigns,
  signalRadiusMeters = 500,
}) {
  const signs = trafficSigns || buildMockTrafficSigns(location)
  const nearbySigns = getNearbySigns(location, signs, signalRadiusMeters)
  const stopSign = nearbySigns.find((sign) => sign.type === 'stop_sign')

  if (!stopSign) {
    return {
      detected: false,
      nearbySigns,
      message: 'No stop sign signal in range',
    }
  }

  const distance = getDistance(location.lat, location.lng, stopSign.lat, stopSign.lng)
  const isClose = distance <= signalRadiusMeters
  const shouldSignal = isClose && speedKmh > 0

  return {
    detected: shouldSignal,
    nearbySigns,
    stopSign,
    distance,
    signalRadiusMeters,
    message: shouldSignal
      ? `Stop sign signal triggered at ${Math.round(distance)}m`
      : `Stop sign found but not signaled at ${Math.round(distance)}m`,
  }
}

export function simulateApproachSequence({
  startLocation,
  speedKmh = 30,
  steps = 6,
  stepMeters = 40,
}) {
  const trafficSigns = buildMockTrafficSigns(startLocation)
  const logs = []

  for (let index = 0; index < steps; index += 1) {
    const location = {
      lat: startLocation.lat + metersToLat(stepMeters * index),
      lng: startLocation.lng,
    }

    const result = simulateStopSignDetection({
      location,
      speedKmh,
      trafficSigns,
      signalRadiusMeters: 600,
    })

    logs.push({
      step: index + 1,
      location,
      ...result,
    })
  }

  return logs
}
