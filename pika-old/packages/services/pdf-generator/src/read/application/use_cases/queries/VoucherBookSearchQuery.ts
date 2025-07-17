import { VoucherBookStatus, VoucherBookType } from '@prisma/client'

/**
 * VoucherBook search query parameters
 * Used by application services to retrieve voucher books with filtering, sorting, and pagination
 */
export interface VoucherBookSearchQuery {
  // Filter parameters
  status?: VoucherBookStatus
  bookType?: VoucherBookType
  year?: number
  month?: number
  edition?: string

  // Pagination parameters
  page?: number
  limit?: number

  // Sorting parameters
  sortBy?: string
  sortOrder?: 'asc' | 'desc'

  // Include relationships parameters
  includePages?: boolean
}
