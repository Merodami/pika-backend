import type { schemas } from '@pika/api'

/**
 * DTO for redeeming a voucher
 */
export interface RedeemVoucherDTO {
  code: string // JWT token or short code
  providerId: string // Service provider validating the redemption
  customerId?: string // Customer ID for static codes
  location?: {
    lat: number
    lng: number
  }
  offlineRedemption?: boolean
  deviceId?: string // For offline sync tracking
}

/**
 * DTO for redemption result
 */
export interface RedemptionResultDTO {
  success: boolean
  redemptionId?: string
  voucherDetails?: {
    title: string
    discount: string
    providerName: string
    instructions?: string
  }
  error?: string
  errorCode?:
    | 'INVALID_CODE'
    | 'EXPIRED'
    | 'ALREADY_REDEEMED'
    | 'VOUCHER_NOT_FOUND'
    | 'INVALID_PROVIDER'
}

/**
 * DTO for offline validation
 */
export interface ValidateOfflineDTO {
  token: string
}

/**
 * DTO for offline validation result
 */
export interface OfflineValidationResult {
  valid: boolean
  voucherId?: string
  customerId?: string
  expiry?: Date
  error?: string
}

/**
 * DTO for syncing offline redemptions
 */
export interface SyncOfflineRedemptionsDTO {
  redemptions: Array<{
    code: string
    redeemedAt: Date
    location?: {
      lat: number
      lng: number
    }
    deviceId?: string
  }>
}

/**
 * DTO for QR code generation
 */
export interface GenerateQRCodeDTO {
  voucherId: string
  customerId: string
  format?: 'svg' | 'png' | 'base64'
}

/**
 * DTO for QR code response
 */
export interface QRCodeResponse {
  qrCode: string // Base64, SVG, or PNG URL
  format: 'svg' | 'png' | 'base64'
  shortCode: string
  expiresAt: Date
}

// Type aliases for API schema types
export type RedeemVoucherRequest = schemas.RedeemVoucherDTO
export type RedemptionResultResponse = schemas.RedemptionResultDTO
export type ValidateOfflineRequest = schemas.ValidateOfflineDTO
export type OfflineValidationResponse = schemas.OfflineValidationResult
export type SyncOfflineRequest = schemas.SyncOfflineRedemptionsDTO
export type GenerateQRRequest = schemas.GenerateQRCodeDTO
export type QRCodeResponseAPI = schemas.QRCodeResponseDTO
