/**
 * Voucher input/request types
 * These types define the request parameters for voucher operations
 */

import type { DeviceInfo } from '../common/device.js'
import type { GeoSearchParams, SearchParams } from '../common/pagination.js'
import type {
  CustomerVoucherStatusFilterType,
  VoucherScanSource,
  VoucherState,
} from '../enums/voucher.js'
import type { Coordinates } from '../geolocation/types.js'

/**
 * Voucher-specific notification preferences
 * Used when claiming vouchers
 */
export interface VoucherNotificationPreferences {
  enableReminders?: boolean
  reminderDaysBefore?: number // 1-30 days before expiry
}

/**
 * Options for scanning a voucher (QR code or link)
 * Maps to POST /vouchers/{id}/scan request body
 */
export interface VoucherScanOptions {
  scanSource?: VoucherScanSource
  location?: Coordinates // Uses common Coordinates type
  deviceInfo?: DeviceInfo // Uses common DeviceInfo type
}

/**
 * Options for claiming a voucher to user's wallet
 * Maps to POST /vouchers/{id}/claim request body
 */
export interface VoucherClaimOptions {
  notificationPreferences?: VoucherNotificationPreferences
}

/**
 * Options for redeeming a voucher
 * Maps to POST /vouchers/{id}/redeem request body
 */
export interface VoucherRedeemOptions {
  code: string // Required redemption code
  location?: Coordinates // Uses common Coordinates type
}

/**
 * Filter parameters for voucher listings
 * Maps to GET /vouchers query parameters
 * Extends GeoSearchParams for location-based filtering
 */
export interface VoucherFilterParams extends GeoSearchParams {
  search?: string
  businessId?: string
  state?: VoucherState
  categoryId?: string
}

/**
 * Filter parameters for user's vouchers
 * Maps to GET /users/{id}/vouchers query parameters
 * Extends SearchParams for standard pagination
 */
export interface UserVoucherFilterParams extends SearchParams {
  status?: CustomerVoucherStatusFilterType // Uses proper enum type
  businessId?: string
  categoryId?: string
}
