/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Create a new voucher book
 */
export type CreateVoucherBookRequest = {
  /**
   * Voucher book title
   */
  title: string
  /**
   * Book edition (e.g., "January 2024")
   */
  edition?: string
  /**
   * Type of voucher book
   */
  bookType:
    | 'MONTHLY'
    | 'SPECIAL_EDITION'
    | 'REGIONAL'
    | 'SEASONAL'
    | 'PROMOTIONAL'
  /**
   * Month for monthly books (1-12)
   */
  month?: number
  /**
   * Year of publication
   */
  year: number
  /**
   * Total number of pages
   */
  totalPages?: number
  /**
   * URL of the cover image
   */
  coverImageUrl?: string
  /**
   * URL of the back cover image
   */
  backImageUrl?: string
  /**
   * Additional book metadata
   */
  metadata?: Record<string, any>
}
