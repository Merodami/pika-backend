import { Static, Type } from '@sinclair/typebox'

// GeoPoint schema for geographical coordinates
export const GeoPointSchema = Type.Object(
  {
    lat: Type.Number({ minimum: -90, maximum: 90 }),
    lng: Type.Number({ minimum: -180, maximum: 180 }),
  },
  { $id: '#/components/schemas/GeoPoint' },
)

export type GeoPoint = Static<typeof GeoPointSchema>

// Search radius parameter
export const GeoRadiusSchema = Type.Object(
  {
    radius: Type.Number({ minimum: 0, default: 10 }),
  },
  { $id: '#/components/schemas/GeoRadius' },
)

export type GeoRadius = Static<typeof GeoRadiusSchema>

// Complete geo search parameters
export const GeoSearchSchema = Type.Object(
  {
    lat: Type.Number({ minimum: -90, maximum: 90 }),
    lng: Type.Number({ minimum: -180, maximum: 180 }),
    radius: Type.Optional(Type.Number({ minimum: 0, default: 10 })),
  },
  { $id: '#/components/schemas/GeoSearch' },
)

export type GeoSearch = Static<typeof GeoSearchSchema>
