import { z } from 'zod'

import {
  Email as EmailAddress,
  UserId,
} from '../../../common/schemas/branded.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Internal communication service schemas for service-to-service communication
 */

// ============= System Notifications =============

/**
 * Send system notification request
 */
export const SendSystemNotificationRequest = openapi(
  z.object({
    // Recipients
    userIds: z.array(UserId).optional(),
    broadcast: z.boolean().default(false).describe('Send to all users'),

    // Content
    title: z.string().max(255),
    message: z.string(),
    category: z.enum([
      'SYSTEM',
      'SECURITY',
      'BILLING',
      'MARKETING',
    ]),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),

    // Channels
    channels: z
      .array(z.enum(['IN_APP', 'EMAIL', 'PUSH', 'SMS']))
      .default(['IN_APP']),

    // Template
    templateId: z.string().optional(),
    templateVariables: z.record(z.any()).optional(),

    // Options
    actionUrl: z.string().url().optional(),
    expiresAt: DateTime.optional(),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Send system notification',
  },
)

export type SendSystemNotificationRequest = z.infer<
  typeof SendSystemNotificationRequest
>

/**
 * Send system notification response
 */
export const SendSystemNotificationResponse = openapi(
  z.object({
    notificationId: UUID,
    recipientCount: z.number().int().nonnegative(),
    channels: z.record(
      z.object({
        sent: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
      }),
    ),
    timestamp: DateTime,
  }),
  {
    description: 'System notification result',
  },
)

export type SendSystemNotificationResponse = z.infer<
  typeof SendSystemNotificationResponse
>

// ============= Transactional Emails =============

/**
 * Send transactional email request
 */
export const SendTransactionalEmailRequest = openapi(
  z.object({
    userId: UserId,
    templateKey: z.enum([
      'WELCOME',
      'EMAIL_VERIFICATION',
      'PASSWORD_RESET',
      'PASSWORD_RESET_CONFIRMATION',
      'PASSWORD_CHANGE_CONFIRMATION',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'SUBSCRIPTION_ACTIVATED',
      'SUBSCRIPTION_EXPIRING',
      'SUBSCRIPTION_EXPIRED',
    ]),
    variables: z.record(z.any()),

    // Override options
    subject: z.string().optional().describe('Override template subject'),
    replyTo: EmailAddress.optional(),
    attachments: z
      .array(
        z.object({
          filename: z.string(),
          content: z.string().describe('Base64 encoded'),
          contentType: z.string(),
        }),
      )
      .optional(),

    // Delivery options
    sendAt: DateTime.optional(),
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true),
  }),
  {
    description: 'Send transactional email',
  },
)

export type SendTransactionalEmailRequest = z.infer<
  typeof SendTransactionalEmailRequest
>

/**
 * Send transactional email response
 */
export const SendTransactionalEmailResponse = openapi(
  z.object({
    messageId: z.string(),
    status: z.enum(['QUEUED', 'SENT', 'FAILED']),
    scheduledAt: DateTime.optional(),
    errorMessage: z.string().optional(),
  }),
  {
    description: 'Transactional email result',
  },
)

export type SendTransactionalEmailResponse = z.infer<
  typeof SendTransactionalEmailResponse
>

// ============= SMS Service =============

/**
 * Send SMS request
 */
export const SendSMSRequest = openapi(
  z.object({
    userId: UserId,
    phoneNumber: z.string().optional().describe('Override user phone'),
    message: z.string().max(160),
    type: z.enum(['VERIFICATION', 'ALERT', 'REMINDER', 'MARKETING']),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Send SMS message',
  },
)

export type SendSMSRequest = z.infer<typeof SendSMSRequest>

/**
 * Send SMS response
 */
export const SendSMSResponse = openapi(
  z.object({
    messageId: z.string(),
    status: z.enum(['SENT', 'FAILED', 'QUEUED']),
    errorMessage: z.string().optional(),
  }),
  {
    description: 'SMS send result',
  },
)

export type SendSMSResponse = z.infer<typeof SendSMSResponse>

// ============= Push Notifications =============

/**
 * Send push notification request
 */
export const SendPushNotificationRequest = openapi(
  z.object({
    userIds: z.array(UserId),
    title: z.string().max(100),
    body: z.string().max(255),

    // Push specific
    badge: z.number().int().nonnegative().optional(),
    sound: z.string().optional(),
    data: z.record(z.any()).optional(),

    // iOS specific
    subtitle: z.string().optional(),
    threadId: z.string().optional(),

    // Android specific
    channelId: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),

    // Options
    priority: z.enum(['NORMAL', 'HIGH']).default('NORMAL'),
    ttl: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('Time to live in seconds'),
  }),
  {
    description: 'Send push notification',
  },
)

export type SendPushNotificationRequest = z.infer<
  typeof SendPushNotificationRequest
>

/**
 * Send push notification response
 */
export const SendPushNotificationResponse = openapi(
  z.object({
    sent: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    failures: z
      .array(
        z.object({
          userId: UserId,
          reason: z.string(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Push notification result',
  },
)

export type SendPushNotificationResponse = z.infer<
  typeof SendPushNotificationResponse
>

// ============= Communication Preferences =============

/**
 * Get user communication preferences
 */
export const GetUserCommunicationPreferencesRequest = openapi(
  z.object({
    userId: UserId,
  }),
  {
    description: 'Get user communication preferences',
  },
)

export type GetUserCommunicationPreferencesRequest = z.infer<
  typeof GetUserCommunicationPreferencesRequest
>

/**
 * User communication preferences response
 */
export const UserCommunicationPreferencesResponse = openapi(
  z.object({
    userId: UserId,

    // Channel preferences
    email: z.object({
      enabled: z.boolean(),
      categories: z.record(z.boolean()),
    }),
    push: z.object({
      enabled: z.boolean(),
      categories: z.record(z.boolean()),
      tokens: z.array(
        z.object({
          token: z.string(),
          platform: z.enum(['IOS', 'ANDROID', 'WEB']),
          active: z.boolean(),
        }),
      ),
    }),
    sms: z.object({
      enabled: z.boolean(),
      categories: z.record(z.boolean()),
      phoneNumber: z.string().optional(),
    }),

    // Quiet hours
    quietHours: z
      .object({
        enabled: z.boolean(),
        start: z.string(),
        end: z.string(),
        timezone: z.string(),
      })
      .optional(),

    // Unsubscribe
    unsubscribedAt: DateTime.optional(),
  }),
  {
    description: 'User communication preferences',
  },
)

export type UserCommunicationPreferencesResponse = z.infer<
  typeof UserCommunicationPreferencesResponse
>

// ============= Regular Email Operations =============

/**
 * Send email request
 */
export const SendEmailRequest = openapi(
  z.object({
    to: EmailAddress,
    subject: z.string().optional().describe('Optional when using templateId'),
    templateId: z.string().optional(),
    templateParams: z.record(z.any()).optional(),
    body: z.string().optional(),
    isHtml: z.boolean().default(false),
    replyTo: EmailAddress.optional(),
    cc: z.array(EmailAddress).optional(),
    bcc: z.array(EmailAddress).optional(),
  }),
  {
    description: 'Send email request',
  },
)

export type SendEmailRequest = z.infer<typeof SendEmailRequest>

/**
 * Send email response
 */
export const SendEmailResponse = openapi(
  z.object({
    id: z.string(),
    status: z.string(),
  }),
  {
    description: 'Send email result',
  },
)

export type SendEmailResponse = z.infer<typeof SendEmailResponse>

/**
 * Bulk email request
 */
export const BulkEmailRequest = openapi(
  z.object({
    templateId: z.string(),
    recipients: z.array(
      z.object({
        to: EmailAddress,
        variables: z.record(z.any()).optional(),
      }),
    ),
  }),
  {
    description: 'Send bulk emails request',
  },
)

export type BulkEmailRequest = z.infer<typeof BulkEmailRequest>

/**
 * Bulk email response
 */
export const BulkEmailResponse = openapi(
  z.object({
    sent: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
  }),
  {
    description: 'Bulk email result',
  },
)

export type BulkEmailResponse = z.infer<typeof BulkEmailResponse>

// ============= In-App Notifications =============

/**
 * Create notification request
 */
export const CreateNotificationRequest = openapi(
  z.object({
    userId: UserId,
    title: z.string(),
    content: z.string(),
    type: z.enum(['info', 'warning', 'error', 'success']),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Create in-app notification',
  },
)

export type CreateNotificationRequest = z.infer<
  typeof CreateNotificationRequest
>

/**
 * Create notification response
 */
export const CreateNotificationResponse = openapi(
  z.object({
    id: z.string(),
  }),
  {
    description: 'Create notification result',
  },
)

export type CreateNotificationResponse = z.infer<
  typeof CreateNotificationResponse
>

// ============= Batch Operations =============

/**
 * Batch notification status update
 */
export const BatchUpdateNotificationStatusRequest = openapi(
  z.object({
    updates: z
      .array(
        z.object({
          messageId: z.string(),
          status: z.enum([
            'DELIVERED',
            'OPENED',
            'CLICKED',
            'BOUNCED',
            'FAILED',
          ]),
          timestamp: DateTime,
          metadata: z.record(z.any()).optional(),
        }),
      )
      .min(1)
      .max(1000),
  }),
  {
    description: 'Batch update notification statuses',
  },
)

export type BatchUpdateNotificationStatusRequest = z.infer<
  typeof BatchUpdateNotificationStatusRequest
>

/**
 * Batch update response
 */
export const BatchUpdateResponse = openapi(
  z.object({
    processed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    errors: z
      .array(
        z.object({
          messageId: z.string(),
          error: z.string(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Batch update result',
  },
)

export type BatchUpdateResponse = z.infer<typeof BatchUpdateResponse>
