import { MultilingualText } from '@voucher-read/domain/entities/Voucher.js'

/**
 * Data Transfer Object for Vouchers
 * Used for transferring voucher data between application layers
 */
export interface VoucherDTO {
  id: string
  providerId: string
  categoryId: string
  state: 'NEW' | 'PUBLISHED' | 'CLAIMED' | 'REDEEMED' | 'EXPIRED'
  title: MultilingualText
  description: MultilingualText
  terms: MultilingualText
  discountType: 'PERCENTAGE' | 'FIXED'
  discountValue: number
  currency: string
  imageUrl: string | null
  validFrom: Date
  expiresAt: Date
  maxRedemptions: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  createdAt: Date | null
  updatedAt: Date | null
  // Optional localized fields used for API responses
  localizedTitle?: string
  localizedDescription?: string
  localizedTerms?: string
  // Voucher codes (optional)
  codes?: VoucherCodeDTO[]
}

/**
 * Voucher code DTO
 */
export interface VoucherCodeDTO {
  id: string
  code: string
  type: 'QR' | 'SHORT' | 'STATIC'
  isActive: boolean
}

/**
 * Voucher list response structure
 * Includes pagination metadata
 */
export interface VoucherListResponseDTO {
  data: VoucherDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}
