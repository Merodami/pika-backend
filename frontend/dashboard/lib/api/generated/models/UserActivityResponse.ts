/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Paginated response
 */
export type UserActivityResponse = {
  /**
   * Page items
   */
  data: Array<{
    /**
     * Universally Unique Identifier
     */
    id: string
    userId: string
    action: string
    category: 'AUTH' | 'PROFILE' | 'PAYMENT' | 'OTHER'
    details?: Record<string, any>
    ipAddress?: string
    userAgent?: string
    /**
     * ISO 8601 datetime with timezone
     */
    timestamp: string
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
