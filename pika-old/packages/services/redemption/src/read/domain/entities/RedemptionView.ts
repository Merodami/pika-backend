import type { MultilingualContent } from '@pika/types-core'

/**
 * Read model for redemption views
 * Includes denormalized data for efficient querying
 */
export interface RedemptionView {
  id: string
  voucherId: string
  voucherTitle: MultilingualContent
  voucherDiscount: string
  customerId: string
  customerName?: string
  customerEmail?: string
  providerId: string
  providerName: string
  code: string
  redeemedAt: Date
  location?: {
    lat: number
    lng: number
  }
  offlineRedemption: boolean
  syncedAt?: Date
  createdAt: Date
}

/**
 * Aggregated redemption statistics
 */
export interface RedemptionStats {
  totalRedemptions: number
  uniqueCustomers: number
  averageRedemptionsPerDay: number
  topVouchers: Array<{
    voucherId: string
    voucherTitle: string
    redemptionCount: number
  }>
  redemptionsByHour: Record<number, number>
  redemptionsByDayOfWeek: Record<number, number>
}
