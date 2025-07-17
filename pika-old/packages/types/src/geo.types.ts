/**
 * Geographic location types
 */

/**
 * Geographic point with latitude and longitude
 */
export interface GeoPoint {
  lat: number
  lng: number
}

/**
 * Geographic bounds
 */
export interface GeoBounds {
  northeast: GeoPoint
  southwest: GeoPoint
}

/**
 * Geographic area with center and radius
 */
export interface GeoArea {
  center: GeoPoint
  radius: number // in meters
}
