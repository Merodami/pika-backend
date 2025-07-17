import {
  type MultilingualText,
  type VoucherDiscountType,
} from '@pika/types-core'

// Voucher DTOs for write operations

export type VoucherCreateDTO = {
  providerId: string
  categoryId: string
  title: MultilingualText
  description: MultilingualText
  terms: MultilingualText
  discountType: VoucherDiscountType
  discountValue: number
  currency?: string
  location?: { type: string; coordinates: any }
  imageUrl?: string
  validFrom?: Date | string
  expiresAt: Date | string
  maxRedemptions?: number
  maxRedemptionsPerUser?: number
  metadata?: Record<string, any>
  codeConfig?: {
    generate_qr?: boolean
    generate_short_code?: boolean
    generate_static_code?: boolean
  }
}

export type VoucherUpdateDTO = {
  title?: MultilingualText
  description?: MultilingualText
  terms?: MultilingualText
  discountType?: VoucherDiscountType
  discountValue?: number
  currency?: string
  location?: { type: string; coordinates: any }
  imageUrl?: string
  validFrom?: Date | string
  expiresAt?: Date | string
  maxRedemptions?: number
  maxRedemptionsPerUser?: number
  metadata?: Record<string, any>
}

export type VoucherPublishDTO = {
  voucherId: string
}

export type VoucherRedeemDTO = {
  voucherId: string
  userId: string
  location?: { type: 'Point'; coordinates: [number, number] }
}

export type VoucherStateUpdateDTO = {
  state: string
  redeemedAt?: string
  redeemedBy?: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
}
