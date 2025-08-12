/**
 * Voucher operation types for frontend/backend communication
 */

import type { VoucherScanSource } from '../enums/voucher.js'
import type { GeoPoint } from '../geolocation/types.js'

/**
 * Device information for tracking voucher operations
 */
export interface DeviceInfo {
  userAgent?: string
  platform?: string
  appVersion?: string
  deviceId?: string
  model?: string
  os?: string
  osVersion?: string
}

/**
 * Notification preferences for voucher operations
 */
export interface NotificationPreferences {
  email?: boolean
  push?: boolean
  sms?: boolean
  inApp?: boolean
}

/**
 * Options for claiming a voucher
 */
export interface VoucherClaimOptions {
  notificationPreferences?: NotificationPreferences
  metadata?: Record<string, any>
}

/**
 * Options for redeeming a voucher
 */
export interface VoucherRedeemOptions {
  code: string // Required voucher code
  location?: GeoPoint // Optional location for redemption
  metadata?: Record<string, any>
}

/**
 * Options for scanning a voucher
 */
export interface VoucherScanOptions {
  scanSource?: VoucherScanSource // Already exists in enums
  location?: GeoPoint
  deviceInfo?: DeviceInfo
  userAgent?: string
  metadata?: Record<string, any>
}

/**
 * Result of a voucher claim operation
 */
export interface VoucherClaimResult {
  claimId: string
  voucherId: string
  claimedAt: Date
  expiresAt?: Date
  walletPosition?: number
}

/**
 * Result of a voucher redemption operation
 */
export interface VoucherRedeemResult {
  message: string
  voucherId: string
  redeemedAt: Date
  discountApplied?: number
}

/**
 * Result of a voucher scan operation
 */
export interface VoucherScanResult {
  scanId: string
  voucher: any // Will be VoucherDomain or VoucherDTO
  canClaim: boolean
  alreadyClaimed: boolean
  nearbyLocations?: GeoPoint[]
}
