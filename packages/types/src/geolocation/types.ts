/**
 * Geolocation types
 */

/**
 * Basic coordinate pair (human-friendly format)
 * Use this for simple latitude/longitude needs
 */
export interface Coordinates {
  lat: number // Latitude: -90 to 90
  lng: number // Longitude: -180 to 180
}

export interface LocationBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface DistanceCalculation {
  from: Coordinates
  to: Coordinates
  distance: number
  unit: 'km' | 'miles'
}

/**
 * GeoJSON Point type (standard format)
 * @see https://geojson.org/
 */
export interface GeoPoint {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude] - NOTE: lon first!
}

/**
 * GeoJSON Polygon type
 */
export interface GeoPolygon {
  type: 'Polygon'
  coordinates: number[][][] // Array of linear rings
}

/**
 * GeoJSON MultiPoint type
 */
export interface GeoMultiPoint {
  type: 'MultiPoint'
  coordinates: number[][]
}

/**
 * Union of all GeoJSON geometry types we support
 */
export type GeoJSON = GeoPoint | GeoPolygon | GeoMultiPoint

/**
 * Location with optional radius for proximity searches
 */
export interface GeoLocation extends GeoPoint {
  radius?: number // Radius in meters for proximity
  accuracy?: number // GPS accuracy in meters
}

/**
 * Location with optional metadata
 * Use this for location-aware operations that need extra context
 */
export interface Location extends Coordinates {
  accuracy?: number // GPS accuracy in meters
  radius?: number // Search radius in kilometers
  timestamp?: string // ISO 8601 timestamp when location was captured
}

/**
 * GeoJSON Point with optional radius
 * Use this for proximity searches
 */
export interface GeoPointWithRadius extends GeoPoint {
  radius?: number // Search radius in kilometers
}

// ============= Conversion Utilities =============

/**
 * Convert human-friendly coordinates to GeoJSON Point
 */
export const toGeoPoint = (coords: Coordinates): GeoPoint => ({
  type: 'Point',
  coordinates: [coords.lng, coords.lat], // Note: GeoJSON uses [lon, lat]
})

/**
 * Convert GeoJSON Point to human-friendly coordinates
 */
export const fromGeoPoint = (point: GeoPoint): Coordinates => ({
  lat: point.coordinates[1],
  lng: point.coordinates[0],
})

/**
 * Check if coordinates are valid
 */
export const isValidCoordinates = (coords: Coordinates): boolean => {
  return (
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  )
}

/**
 * Calculate if coordinates are within a bounding box
 */
export const isWithinBounds = (
  coords: Coordinates,
  bounds: { north: number; south: number; east: number; west: number },
): boolean => {
  return (
    coords.lat <= bounds.north &&
    coords.lat >= bounds.south &&
    coords.lng <= bounds.east &&
    coords.lng >= bounds.west
  )
}
