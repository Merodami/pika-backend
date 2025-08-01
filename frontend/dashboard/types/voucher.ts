// Frontend-specific voucher UI types
// These are for the voucher design/preview components

import { VoucherDiscountType } from '@merodami/pika-types'

export interface VoucherDesign {
  // Basic info
  title: string
  description: string
  category: string

  // Visual design settings
  colors: {
    background: string
    text: string
    accent: string
  }
  primaryColor: string
  secondaryColor: string
  textColor: string
  backgroundColor: string
  template: 'classic' | 'modern' | 'minimal' | 'bold'

  // Business branding
  businessName: string
  businessAddress?: string
  businessPhone?: string
  businessWebsite?: string
  logo?: string
  banner?: string

  // Discount details
  discountType: VoucherDiscountType
  discountValue: number
  originalPrice?: number

  // Validity
  validFrom: Date | string
  validUntil: Date | string
  validityPeriod?: string
  expirationDate?: Date | string

  // Restrictions
  maxRedemptions?: number
  maxRedemptionsPerUser?: number
  minimumPurchase?: number

  // Legal/terms
  terms: string[]
}

// Voucher form data (what gets sent to the API)
export interface VoucherFormData {
  title: string
  description: string
  value: number
  validFrom: Date
  validUntil: Date
  quantity: number
  design: VoucherDesign
}
