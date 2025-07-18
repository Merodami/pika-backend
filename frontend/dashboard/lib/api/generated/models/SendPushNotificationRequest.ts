/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Send push notification
 */
export type SendPushNotificationRequest = {
  userIds: Array<string>
  title: string
  body: string
  badge?: number
  sound?: string
  data?: Record<string, any>
  subtitle?: string
  threadId?: string
  channelId?: string
  icon?: string
  color?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  /**
   * Time to live in seconds
   */
  ttl?: number
}
