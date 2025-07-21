/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Paginated response
 */
export type AdminTicketListResponse = {
  /**
   * Page items
   */
  data: Array<{
    /**
     * Universally Unique Identifier
     */
    id: string
    ticketNumber?: string
    userId: string
    userName: string
    userEmail: string
    title: string
    description: string
    type:
      | 'BILLING'
      | 'TECHNICAL'
      | 'ACCOUNT'
      | 'GENERAL'
      | 'BUG_REPORT'
      | 'FEATURE_REQUEST'
    status:
      | 'OPEN'
      | 'ASSIGNED'
      | 'IN_PROGRESS'
      | 'WAITING_CUSTOMER'
      | 'WAITING_INTERNAL'
      | 'RESOLVED'
      | 'CLOSED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
    /**
     * ISO 8601 datetime with timezone
     */
    resolvedAt?: string
    assignedTo?: string
    assignedToName?: string
    files?: Array<string>
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
