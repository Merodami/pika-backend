/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Paginated response
 */
export type NotificationListResponse = {
  /**
   * Page items
   */
  data: Array<{
    /**
     * Universally Unique Identifier
     */
    id: string
    /**
     * User ID who receives the notification
     */
    userId?: string
    type?: 'email' | 'inApp' | 'sms' | 'push'
    status?: 'pending' | 'sent' | 'delivered' | 'failed' | 'read'
    priority?: 'low' | 'normal' | 'high' | 'urgent'
    title?: string
    description?: string
    /**
     * Whether this is a global notification
     */
    isGlobal?: boolean
    /**
     * Whether the notification has been read
     */
    isRead?: boolean
    /**
     * ISO 8601 datetime with timezone
     */
    readAt?: string
    /**
     * Additional metadata for the notification
     */
    metadata?: Record<string, any>
    /**
     * Notification category for filtering
     */
    category?: string
    /**
     * URL to navigate when notification is clicked
     */
    actionUrl?: string
    /**
     * Notification image
     */
    imageUrl?: string
    /**
     * When the notification expires
     */
    expiresAt?: string
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
