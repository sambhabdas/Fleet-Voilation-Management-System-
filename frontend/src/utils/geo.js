/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point (in degrees)
 * @param {number} lng1 - Longitude of first point (in degrees)
 * @param {number} lat2 - Latitude of second point (in degrees)
 * @param {number} lng2 - Longitude of second point (in degrees)
 * @returns {number} Distance in meters
 */
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Filter traffic signs within a specified radius from a location
 * @param {{lat: number, lng: number}} location - Current location
 * @param {Array<{lat: number, lng: number, type?: string, id?: string}>} signs - Array of traffic signs
 * @param {number} radius - Search radius in meters (default: 200)
 * @returns {Array<{...sign, distance: number}>} Nearby signs with distance info
 */
export function getNearbySigns(location, signs, radius = 200) {
  if (!location || !signs) return []

  return signs
    .map((sign) => ({
      ...sign,
      distance: getDistance(location.lat, location.lng, sign.lat, sign.lng),
    }))
    .filter((sign) => sign.distance <= radius)
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Bearing in degrees (0-360)
 */
export function getBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180
  const lat1Rad = lat1 * Math.PI / 180
  const lat2Rad = lat2 * Math.PI / 180

  const y = Math.sin(dLng) * Math.cos(lat2Rad)
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

  const bearing = Math.atan2(y, x) * 180 / Math.PI
  return (bearing + 360) % 360
}

/**
 * Check if a sign is in front of the vehicle based on heading
 * @param {number} vehicleHeading - Vehicle heading/bearing in degrees (0-360)
 * @param {number} signBearing - Bearing to the sign in degrees (0-360)
 * @param {number} tolerance - Acceptable angle tolerance in degrees (default: 45)
 * @returns {boolean} True if sign is in front of vehicle
 */
export function isSignInFront(vehicleHeading, signBearing, tolerance = 45) {
  const diff = Math.abs(vehicleHeading - signBearing)
  const normalizedDiff = diff > 180 ? 360 - diff : diff
  return normalizedDiff <= tolerance
}

/**
 * Estimate time to reach a sign based on current speed
 * @param {number} distance - Distance to sign in meters
 * @param {number} speed - Current speed in km/h
 * @returns {number|null} Time in seconds, or null if speed is too low
 */
export function getTimeToReach(distance, speed) {
  if (speed < 5) return null // Too slow to estimate
  const speedMps = speed * 1000 / 3600 // Convert km/h to m/s
  return distance / speedMps
}
