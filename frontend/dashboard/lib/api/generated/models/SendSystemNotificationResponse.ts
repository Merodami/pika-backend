/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * System notification result
 */
export type SendSystemNotificationResponse = {
  /**
   * Universally Unique Identifier
   */
  notificationId: string
  recipientCount: number
  channels: Record<
    string,
    {
      sent: number
      failed: number
    }
  >
  /**
   * ISO 8601 datetime with timezone
   */
  timestamp: string
}
