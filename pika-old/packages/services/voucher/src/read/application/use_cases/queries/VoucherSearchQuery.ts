/**
 * Voucher search query parameters
 * Used by application services to retrieve vouchers with filtering, sorting, and pagination
 */
export interface VoucherSearchQuery {
  // Filter parameters
  providerId?: string
  categoryId?: string
  state?: 'NEW' | 'PUBLISHED' | 'CLAIMED' | 'REDEEMED' | 'EXPIRED'
  discountType?: 'PERCENTAGE' | 'FIXED'
  minDiscount?: number
  maxDiscount?: number

  // Geospatial search
  latitude?: number
  longitude?: number
  radius?: number // in meters

  // Pagination parameters
  page?: number
  limit?: number

  // Sorting parameters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'

  // Include relationships parameters
  includeProvider?: boolean
  includeCategory?: boolean
  includeCodes?: boolean
}
