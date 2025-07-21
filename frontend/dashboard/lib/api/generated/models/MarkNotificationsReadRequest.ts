/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Mark notifications as read
 */
export type MarkNotificationsReadRequest = {
  notificationIds?: Array<string>
  all?: boolean
  /**
   * Mark all in category as read
   */
  category?: string
}
