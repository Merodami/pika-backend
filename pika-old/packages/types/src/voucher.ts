/**
 * Voucher-related enums and types
 * Must match Prisma schema definitions
 */

/**
 * Voucher lifecycle states
 */
export enum VoucherState {
  NEW = 'NEW',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
}

/**
 * User-specific voucher states
 */
export enum CustomerVoucherStatus {
  CLAIMED = 'CLAIMED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
}

/**
 * Voucher discount types
 */
export enum VoucherDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

/**
 * Voucher code types
 */
export enum VoucherCodeType {
  QR = 'QR',
  SHORT = 'SHORT',
  STATIC = 'STATIC',
}

/**
 * Voucher scan types
 */
export enum VoucherScanType {
  CUSTOMER = 'CUSTOMER',
  BUSINESS = 'BUSINESS',
}

/**
 * Voucher scan sources
 */
export enum VoucherScanSource {
  CAMERA = 'CAMERA',
  GALLERY = 'GALLERY',
  LINK = 'LINK',
  SHARE = 'SHARE',
}

/**
 * Multilingual text structure (use MultilingualContent from localization.ts for strict validation)
 */
export interface MultilingualText {
  en: string
  es?: string
  gn?: string
  pt?: string
}

/**
 * Geographic location structure
 */
export interface VoucherLocation {
  type: 'Point'
  coordinates: [number, number] // [longitude, latitude]
  address?: string
}

/**
 * Voucher state update payload for inter-service communication
 */
export interface VoucherStateUpdate {
  state: string
  redeemedAt?: string
  redeemedBy?: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
}

/**
 * Extended voucher domain model for service communication
 */
export interface VoucherDomain {
  id: string
  providerId: string
  categoryId: string
  state: string
  title: MultilingualText
  description: MultilingualText
  terms: MultilingualText
  discountType: VoucherDiscountType
  discountValue: number
  currency: string
  location: VoucherLocation | null
  imageUrl: string | null
  validFrom: Date
  expiresAt: Date
  maxRedemptions: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  metadata?: Record<string, any>
  createdAt: Date | null
  updatedAt: Date | null
}
