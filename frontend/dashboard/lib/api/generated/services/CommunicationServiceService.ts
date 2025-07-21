/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

import type { CancelablePromise } from '../core/CancelablePromise'
import { OpenAPI } from '../core/OpenAPI'
import { request as __request } from '../core/request'
export class CommunicationServiceService {
  /**
   * Send system notification
   * @returns any Notification sent
   * @throws ApiError
   */
  public static postNotificationsSystem({
    requestBody,
  }: {
    requestBody?: {
      userIds?: Array<string>
      /**
       * Send to all users
       */
      broadcast?: boolean
      title: string
      message: string
      category: 'system' | 'security' | 'billing' | 'marketing'
      priority?: 'low' | 'normal' | 'high' | 'urgent'
      channels?: Array<'email' | 'inApp' | 'sms' | 'push'>
      templateId?: string
      templateVariables?: Record<string, any>
      actionUrl?: string
      /**
       * ISO 8601 datetime with timezone
       */
      expiresAt?: string
      metadata?: Record<string, any>
    }
  }): CancelablePromise<{
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
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/notifications/system',
      body: requestBody,
      mediaType: 'application/json',
    })
  }
  /**
   * Send transactional email
   * @returns any Email sent
   * @throws ApiError
   */
  public static postEmailsTransactional({
    requestBody,
  }: {
    requestBody?: {
      userId: string
      templateKey:
        | 'welcome'
        | 'passwordReset'
        | 'emailVerification'
        | 'paymentSuccess'
        | 'paymentFailed'
        | 'subscriptionActivated'
        | 'subscriptionCancelled'
      variables: Record<string, any>
      /**
       * Override template subject
       */
      subject?: string
      replyTo?: string
      attachments?: Array<{
        filename: string
        /**
         * Base64 encoded
         */
        content: string
        contentType: string
      }>
      /**
       * ISO 8601 datetime with timezone
       */
      sendAt?: string
      trackOpens?: boolean
      trackClicks?: boolean
    }
  }): CancelablePromise<{
    messageId: string
    status:
      | 'queued'
      | 'sent'
      | 'delivered'
      | 'failed'
      | 'bounced'
      | 'complained'
      | 'rejected'
    /**
     * ISO 8601 datetime with timezone
     */
    scheduledAt?: string
    errorMessage?: string
  }> {
    return __request(OpenAPI, {
      method: 'POST',
      url: '/emails/transactional',
      body: requestBody,
      mediaType: 'application/json',
    })
  }
}
