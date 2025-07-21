/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Public voucher book information (read-only)
 */
export type VoucherBookResponse = {
  /**
   * Universally Unique Identifier
   */
  id: string
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
   * Only published books visible to public
   */
  status: 'PUBLISHED'
  /**
   * Total number of pages
   */
  totalPages: number
  /**
   * When the book was published
   */
  publishedAt: string
  /**
   * URL of the cover image
   */
  coverImageUrl?: string
  /**
   * URL of the back cover image
   */
  backImageUrl?: string
  /**
   * URL of the generated PDF
   */
  pdfUrl?: string
  /**
   * When the record was created
   */
  createdAt: string
  /**
   * When the record was last updated
   */
  updatedAt: string
}
