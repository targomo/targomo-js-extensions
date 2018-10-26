import { LatLng } from '@targomo/core'

const RADIANS = Math.PI / 180
const EARTH_RADIUS_KM = 6371.01

export function calculateDistance(from: LatLng, to: LatLng) {
  const fromLat = RADIANS * from.lat
  const fromLng = RADIANS * from.lng
  const toLat = RADIANS * to.lat
  const toLng = RADIANS * to.lng

  return Math.acos(
    Math.sin(fromLat) * Math.sin(toLat) +
    Math.cos(fromLat) * Math.cos(toLat) *
    Math.cos(fromLng - toLng)) * EARTH_RADIUS_KM
}

export function midpoint(from: LatLng, to: LatLng) {
  const dLon = RADIANS * (to.lng - from.lng)

  const lat1 = RADIANS * (from.lat)
  const lat2 = RADIANS * (to.lat)
  const lon1 = RADIANS * (from.lng)

  const bx = Math.cos(lat2) * Math.cos(dLon)
  const by = Math.cos(lat2) * Math.sin(dLon)
  const lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + bx) * (Math.cos(lat1) + bx) + by * by))
  const lng3 = lon1 + Math.atan2(by, Math.cos(lat1) + bx)

  return {lat: lat3 / RADIANS, lng: lng3 / RADIANS}
}
