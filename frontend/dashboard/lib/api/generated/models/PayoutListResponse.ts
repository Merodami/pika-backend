/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Paginated response
 */
export type PayoutListResponse = {
  /**
   * Page items
   */
  data: Array<{
    /**
     * Universally Unique Identifier
     */
    id: string
    /**
     * Universally Unique Identifier
     */
    businessId: string
    amount: number
    currency: string
    status: 'scheduled' | 'processing' | 'completed' | 'failed'
    /**
     * ISO 8601 datetime with timezone
     */
    scheduledFor: string
    /**
     * ISO 8601 datetime with timezone
     */
    processedAt?: string
    bankAccountId?: string
    stripeTransferId?: string
    failureReason?: string
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
