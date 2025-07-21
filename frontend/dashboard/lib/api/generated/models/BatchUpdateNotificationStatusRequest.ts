/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Batch update notification statuses
 */
export type BatchUpdateNotificationStatusRequest = {
  updates: Array<{
    messageId: string
    status: 'DELIVERED' | 'OPENED' | 'CLICKED' | 'BOUNCED' | 'FAILED'
    /**
     * ISO 8601 datetime with timezone
     */
    timestamp: string
    metadata?: Record<string, any>
  }>
}
