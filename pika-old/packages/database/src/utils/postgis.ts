/**
 * PostGIS helper utilities for safe spatial operations
 * Using parameterized queries to prevent SQL injection
 */

import { Prisma } from '@prisma/client'

/**
 * Creates a PostGIS Point from coordinates
 * Safe from SQL injection as it uses Prisma's parameterized queries
 */
export function createPointSQL(
  longitude: number,
  latitude: number,
): Prisma.Sql {
  return Prisma.sql`ST_MakePoint(${longitude}, ${latitude})::geography`
}

/**
 * Creates a PostGIS distance query
 * Safe from SQL injection as it uses Prisma's parameterized queries
 */
export function distanceQuerySQL(
  columnName: string,
  longitude: number,
  latitude: number,
  radiusMeters: number,
): Prisma.Sql {
  // Note: Column names cannot be parameterized, so we validate them
  const validColumns = ['location', 'coordinates', 'position']

  if (!validColumns.includes(columnName)) {
    throw new Error(`Invalid column name: ${columnName}`)
  }

  return Prisma.sql`ST_DWithin(
    ${Prisma.raw(columnName)}, 
    ST_MakePoint(${longitude}, ${latitude})::geography,
    ${radiusMeters}
  )`
}

/**
 * Type-safe voucher scan insert with PostGIS location
 */
export interface VoucherScanInsert {
  voucherId: string
  userId?: string
  scanType: string
  scanSource: string
  longitude?: number
  latitude?: number
  deviceInfo: any
  scannedAt: Date
}

/**
 * Builds a safe INSERT query for voucher scans with optional location
 */
export function buildVoucherScanInsertSQL(scan: VoucherScanInsert): Prisma.Sql {
  if (scan.longitude && scan.latitude) {
    return Prisma.sql`
      INSERT INTO marketplace.voucher_scans (
        id, voucher_id, user_id, scan_type, scan_source, 
        location, device_info, scanned_at, created_at
      ) VALUES (
        gen_random_uuid(), 
        ${scan.voucherId}::uuid, 
        ${scan.userId}::uuid, 
        ${scan.scanType}::"marketplace"."VoucherScanType", 
        ${scan.scanSource}::"marketplace"."VoucherScanSource",
        ST_MakePoint(${scan.longitude}, ${scan.latitude})::geography,
        ${scan.deviceInfo}::jsonb,
        ${scan.scannedAt},
        CURRENT_TIMESTAMP
      ) RETURNING id
    `
  } else {
    return Prisma.sql`
      INSERT INTO marketplace.voucher_scans (
        id, voucher_id, user_id, scan_type, scan_source, 
        device_info, scanned_at, created_at
      ) VALUES (
        gen_random_uuid(), 
        ${scan.voucherId}::uuid, 
        ${scan.userId}::uuid, 
        ${scan.scanType}::"marketplace"."VoucherScanType", 
        ${scan.scanSource}::"marketplace"."VoucherScanSource",
        ${scan.deviceInfo}::jsonb,
        ${scan.scannedAt},
        CURRENT_TIMESTAMP
      ) RETURNING id
    `
  }
}

/**
 * Calculate distance between two points in meters
 */
export function distanceSQL(
  column: string,
  longitude: number,
  latitude: number,
): Prisma.Sql {
  const validColumns = ['location', 'coordinates', 'position']

  if (!validColumns.includes(column)) {
    throw new Error(`Invalid column name: ${column}`)
  }

  return Prisma.sql`ST_Distance(
    ${Prisma.raw(column)},
    ST_MakePoint(${longitude}, ${latitude})::geography
  )`
}

/**
 * Order by distance from a point
 */
export function orderByDistanceSQL(
  column: string,
  longitude: number,
  latitude: number,
  order: 'ASC' | 'DESC' = 'ASC',
): Prisma.Sql {
  const validColumns = ['location', 'coordinates', 'position']

  if (!validColumns.includes(column)) {
    throw new Error(`Invalid column name: ${column}`)
  }

  const validOrders = ['ASC', 'DESC']

  if (!validOrders.includes(order)) {
    throw new Error(`Invalid order: ${order}`)
  }

  return Prisma.sql`${Prisma.raw(column)} <-> ST_MakePoint(${longitude}, ${latitude})::geography ${Prisma.raw(order)}`
}

/**
 * Create a bounding box query for efficient spatial searches
 */
export function boundingBoxSQL(
  column: string,
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
): Prisma.Sql {
  const validColumns = ['location', 'coordinates', 'position']

  if (!validColumns.includes(column)) {
    throw new Error(`Invalid column name: ${column}`)
  }

  return Prisma.sql`${Prisma.raw(column)} && ST_MakeEnvelope(
    ${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326
  )::geography`
}
