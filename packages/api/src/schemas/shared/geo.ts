import { DistanceUnit as DistanceUnitEnum } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../common/utils/zodEnum.js'

/**
 * Geographic schemas for location-based features
 *
 * Schema Organization:
 * - Raw Zod schemas (no suffix) - for validation
 * - OpenAPI schemas (Schema suffix) - for documentation
 *
 * Coordinate Systems:
 * - Simple format: {lat, lng} - Used for API requests/responses
 * - GeoJSON format: {type: 'Point', coordinates: [lng, lat]} - Used for PostGIS storage
 */

// ============= Coordinates (Simple Format) =============

/**
 * Simple geographic coordinates (raw Zod)
 * Matches @pika/types Coordinates interface
 * Used for API requests and responses
 */
export const Coordinates = z.object({
  lat: z.number().min(-90).max(90).describe('Latitude'),
  lng: z.number().min(-180).max(180).describe('Longitude'),
})

export type Coordinates = z.infer<typeof Coordinates>

/**
 * Simple geographic coordinates (OpenAPI documented with reference)
 * This will generate $ref when used in OpenAPI schemas
 */
export const CoordinatesSchema = Coordinates.openapi('Coordinates', {
  description: 'Geographic coordinates with latitude and longitude',
  example: { lat: -25.2637, lng: -57.5759 }, // Asunción, Paraguay
})

// ============= GeoJSON Point (Storage Format) =============

/**
 * GeoJSON Point format (raw Zod)
 * Used for PostGIS storage and spatial queries
 * Note: GeoJSON uses [longitude, latitude] order!
 */
export const GeoJSONPoint = z.object({
  type: z.literal('Point'),
  coordinates: z
    .tuple([
      z.number().min(-180).max(180), // longitude first!
      z.number().min(-90).max(90), // latitude second!
    ])
    .describe('[longitude, latitude] - GeoJSON standard'),
})

export type GeoJSONPoint = z.infer<typeof GeoJSONPoint>

/**
 * GeoJSON Point format (OpenAPI documented)
 */
export const GeoJSONPointSchema = GeoJSONPoint.openapi('GeoJSONPoint', {
  description: 'Geographic point in GeoJSON format (PostGIS compatible)',
  example: { type: 'Point', coordinates: [-57.5759, -25.2637] }, // [lng, lat]
})

// ============= Geographic Search Parameters =============

/**
 * Geographic search parameters (raw Zod)
 * Used for location-based filtering
 */
export const GeoSearchParams = z.object({
  lat: z.coerce
    .number()
    .min(-90)
    .max(90)
    .optional()
    .describe('Search center latitude'),
  lng: z.coerce
    .number()
    .min(-180)
    .max(180)
    .optional()
    .describe('Search center longitude'),
  radius: z.coerce
    .number()
    .positive()
    .optional()
    .describe('Search radius in kilometers'),
})

export type GeoSearchParams = z.infer<typeof GeoSearchParams>

/**
 * Geographic search parameters (OpenAPI documented)
 */
export const GeoSearchParamsSchema = GeoSearchParams.openapi(
  'GeoSearchParams',
  {
    description: 'Geographic search parameters for location-based queries',
    example: { lat: -25.2637, lng: -57.5759, radius: 10 },
  },
)

// ============= Geographic Bounds =============

/**
 * Geographic bounding box (raw Zod)
 * Used for map viewport queries
 */
export const GeoBounds = z.object({
  northeast: Coordinates.describe('Northeast corner of the bounding box'),
  southwest: Coordinates.describe('Southwest corner of the bounding box'),
})

export type GeoBounds = z.infer<typeof GeoBounds>

/**
 * Geographic bounding box (OpenAPI documented)
 */
export const GeoBoundsSchema = GeoBounds.openapi('GeoBounds', {
  description: 'Geographic bounding box for viewport queries',
})

// ============= Address =============

/**
 * Physical address (raw Zod)
 */
export const Address = z.object({
  street: z.string().min(1).max(255),
  street2: z.string().max(255).optional().describe('Apartment, suite, etc.'),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100).describe('State or province'),
  postalCode: z.string().min(1).max(20),
  country: z.string().length(2).describe('ISO 3166-1 alpha-2 country code'),
  coordinates: Coordinates.optional().describe('Optional geo coordinates'),
})

export type Address = z.infer<typeof Address>

/**
 * Physical address (OpenAPI documented)
 */
export const AddressSchema = Address.openapi('Address', {
  description: 'Physical address with optional coordinates',
})

// ============= Distance =============

/**
 * Distance measurement (raw Zod)
 */
export const Distance = z.object({
  value: z.number().nonnegative().describe('Distance value'),
  unit: createZodEnum(DistanceUnitEnum)
    .default(DistanceUnitEnum.KM)
    .describe('Distance unit'),
})

export type Distance = z.infer<typeof Distance>

/**
 * Distance measurement (OpenAPI documented)
 */
export const DistanceSchema = Distance.openapi('Distance', {
  description: 'Distance measurement with unit',
  example: { value: 5.2, unit: 'km' },
})

// ============= Location Result with Distance =============

/**
 * Factory for adding distance to location results
 * Used for search results that include distance from search center
 */
export function withDistance<T extends z.ZodObject<any>>(schema: T) {
  return schema.extend({
    distance: Distance.optional().describe('Distance from search center'),
  })
}

// ============= Conversion Utilities =============

/**
 * Convert simple coordinates to GeoJSON Point
 * For storing in PostGIS
 */
export function coordinatesToGeoJSON(coords: Coordinates): GeoJSONPoint {
  return {
    type: 'Point',
    coordinates: [coords.lng, coords.lat], // Note: lng first for GeoJSON!
  }
}

/**
 * Convert GeoJSON Point to simple coordinates
 * For API responses
 */
export function geoJSONToCoordinates(point: GeoJSONPoint): Coordinates {
  return {
    lat: point.coordinates[1], // latitude is second in GeoJSON
    lng: point.coordinates[0], // longitude is first in GeoJSON
  }
}

// ============= Legacy Compatibility =============

/**
 * @deprecated Use Coordinates instead
 * Kept for backward compatibility
 */
export const GeoPoint = CoordinatesSchema

export type GeoPoint = Coordinates

/**
 * @deprecated Use GeoSearchParams instead
 * Kept for backward compatibility
 */
export const GeoSearch = z.object({
  lat: z.number().min(-90).max(90).describe('Search center latitude'),
  lng: z.number().min(-180).max(180).describe('Search center longitude'),
  radius: z.number().positive().default(10).describe('Search radius'),
  unit: createZodEnum(DistanceUnitEnum)
    .default(DistanceUnitEnum.KM)
    .optional()
    .describe('Distance unit'),
})

/**
 * @deprecated Use GeoSearchParams instead
 */
export const GeoRadius = z.object({
  radius: z
    .number()
    .positive()
    .default(10)
    .describe('Search radius in kilometers'),
  unit: createZodEnum(DistanceUnitEnum)
    .default(DistanceUnitEnum.KM)
    .optional()
    .describe('Distance unit'),
})

// Export OpenAPI versions for backward compatibility
export { CoordinatesSchema as GeoPointSchema }
