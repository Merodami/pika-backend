/**
 * Query parameters for redemption searches
 */
export interface RedemptionSearchQuery {
  voucherId?: string
  customerId?: string
  providerId?: string
  offlineRedemption?: boolean
  fromDate?: Date
  toDate?: Date
  page?: number
  limit?: number
  sortBy?: 'redeemed_at' | 'created_at' | 'synced_at'
  sortOrder?: 'asc' | 'desc'
}
