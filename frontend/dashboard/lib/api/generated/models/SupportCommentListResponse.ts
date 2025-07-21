/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Paginated response
 */
export type SupportCommentListResponse = {
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
    problemId: string
    userId: string
    content: string
    isInternal?: boolean
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
