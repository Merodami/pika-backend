/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * User notification
 */
export type Notification = {
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
}
