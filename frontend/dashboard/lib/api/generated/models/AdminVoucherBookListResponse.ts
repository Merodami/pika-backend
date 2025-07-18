/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Paginated response
 */
export type AdminVoucherBookListResponse = {
  /**
   * Page items
   */
  data: Array<{
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
     * Current status of the book
     */
    status: 'DRAFT' | 'READY_FOR_PRINT' | 'PUBLISHED' | 'ARCHIVED'
    /**
     * Total number of pages
     */
    totalPages: number
    /**
     * When the book was published
     */
    publishedAt?: string
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
     * When the PDF was generated
     */
    pdfGeneratedAt?: string
    /**
     * Additional book metadata
     */
    metadata?: Record<string, any>
    /**
     * User who created the book
     */
    createdBy: string
    /**
     * User who last updated the book
     */
    updatedBy?: string
    /**
     * Actual number of pages with content
     */
    pageCount: number
    /**
     * Total number of ad placements
     */
    totalPlacements: number
    /**
     * Number of distribution records
     */
    distributionCount: number
    /**
     * When the record was created
     */
    createdAt: string
    /**
     * When the record was last updated
     */
    updatedAt: string
  }>
  /**
   * Pagination information
   */
  pagination: {
    /**
     * Current page number
     */
    page: number
    /**
     * Items per page
     */
    limit: number
    /**
     * Total number of items
     */
    total: number
    /**
     * Total number of pages
     */
    totalPages: number
    /**
     * Whether there is a next page
     */
    hasNext: boolean
    /**
     * Whether there is a previous page
     */
    hasPrev: boolean
  }
}
