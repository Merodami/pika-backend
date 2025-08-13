import { FIELD_LENGTH, MessagePriority } from '@pika/types'
import { z } from 'zod'
import { optionalBoolean } from '../../../common/utils/validators.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  DevicePlatform,
  NotificationPriority,
  NotificationSortBy,
  NotificationStatus,
  NotificationType,
} from '../common/enums.js'

/**
 * Notification schemas for public API
 */

// ============= Notification Schema =============

/**
 * Notification (raw Zod)
 */
export const Notification = withTimestamps({
  id: UUID,
  userId: UserId.optional().describe('User ID who receives the notification'),
  type: NotificationType.optional(),
  status: NotificationStatus.default('pending'),
  priority: NotificationPriority.default(MessagePriority.NORMAL),
  title: z.string().max(FIELD_LENGTH.SLUG_MAX).optional(),
  description: z.string().optional(),
  isGlobal: z
    .boolean()
    .default(false)
    .describe('Whether this is a global notification'),
  isRead: z
    .boolean()
    .default(false)
    .describe('Whether the notification has been read'),
  readAt: DateTime.optional(),
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe('Additional metadata for the notification'),

  // Additional fields
  category: z
    .string()
    .optional()
    .describe('Notification category for filtering'),
  actionUrl: z
    .string()
    .url()
    .optional()
    .describe('URL to navigate when notification is clicked'),
  imageUrl: z.string().url().optional().describe('Notification image'),
  expiresAt: DateTime.optional().describe('When the notification expires'),
})

/**
 * Notification (OpenAPI documented)
 */
export const NotificationSchema = Notification.openapi('Notification', {
  description: 'User notification',
})

export type Notification = z.infer<typeof Notification>

// ============= Create Notification =============

/**
 * Create notification request (raw Zod)
 */
export const CreateNotificationRequest = z.object({
  userId: UserId.optional(),
  subToken: z
    .string()
    .optional()
    .describe('Subscription token for push notifications'),
  type: NotificationType.optional(),
  title: z.string().max(FIELD_LENGTH.SLUG_MAX).optional(),
  description: z.string(),
  isGlobal: z.boolean().default(false),
  priority: NotificationPriority.default(MessagePriority.NORMAL),
  category: z.string().optional(),
  actionUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  expiresAt: DateTime.optional(),
})

/**
 * Create notification request (OpenAPI documented)
 */
export const CreateNotificationRequestSchema = CreateNotificationRequest.openapi(
  'CreateNotificationRequest',
  {
    description: 'Create a new notification',
  },
)

export type CreateNotificationRequest = z.infer<
  typeof CreateNotificationRequest
>

/**
 * Batch create notifications request (raw Zod)
 */
export const BatchCreateNotificationsRequest = z
  .object({
    userIds: z.array(UserId).optional().describe('Send to specific users'),
    isGlobal: z.boolean().default(false).describe('Send to all users'),
    notification: CreateNotificationRequest.omit({
      userId: true,
      isGlobal: true,
    }),
  })
  .refine(
    (data) => (data.userIds && data.userIds.length > 0) || data.isGlobal,
    { message: 'Either userIds or isGlobal must be specified' },
  )

/**
 * Batch create notifications request (OpenAPI documented)
 */
export const BatchCreateNotificationsRequestSchema = BatchCreateNotificationsRequest.openapi(
  'BatchCreateNotificationsRequest',
  {
    description: 'Send notifications to multiple users',
  },
)

export type BatchCreateNotificationsRequest = z.infer<
  typeof BatchCreateNotificationsRequest
>

// ============= Update Notification =============

/**
 * Update notification status (raw Zod)
 */
export const UpdateNotificationStatusRequest = z.object({
  isRead: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * Update notification status (OpenAPI documented)
 */
export const UpdateNotificationStatusRequestSchema = UpdateNotificationStatusRequest.openapi(
  'UpdateNotificationStatusRequest',
  {
    description: 'Update notification status',
  },
)

export type UpdateNotificationStatusRequest = z.infer<
  typeof UpdateNotificationStatusRequest
>

/**
 * Mark notifications as read request (raw Zod)
 */
export const MarkNotificationsReadRequest = z.object({
  notificationIds: z.array(UUID).optional(),
  all: z.boolean().default(false),
  category: z.string().optional().describe('Mark all in category as read'),
})

/**
 * Mark notifications as read request (OpenAPI documented)
 */
export const MarkNotificationsReadRequestSchema = MarkNotificationsReadRequest.openapi(
  'MarkNotificationsReadRequest',
  {
    description: 'Mark notifications as read',
  },
)

export type MarkNotificationsReadRequest = z.infer<
  typeof MarkNotificationsReadRequest
>

// ============= Search Notifications =============

/**
 * Notification search parameters (raw Zod)
 */
export const NotificationSearchParams = SearchParams.extend({
  type: NotificationType.optional(),
  status: NotificationStatus.optional(),
  priority: NotificationPriority.optional(),
  isRead: optionalBoolean(),
  isGlobal: optionalBoolean(),
  category: z.string().optional(),
  fromDate: DateTime.optional(),
  toDate: DateTime.optional(),
  sortBy: NotificationSortBy.default('createdAt'),
})

/**
 * Notification search parameters (OpenAPI documented)
 */
export const NotificationSearchParamsSchema = NotificationSearchParams.openapi(
  'NotificationSearchParams',
  {
    description: 'Notification search and filter parameters',
  },
)

export type NotificationSearchParams = z.infer<typeof NotificationSearchParams>

/**
 * Notification list response (raw Zod)
 */
export const NotificationListResponse = paginatedResponse(Notification)

/**
 * Notification list response (OpenAPI documented)
 */
export const NotificationListResponseSchema = NotificationListResponse.openapi(
  'NotificationListResponse',
  {
    description: 'Paginated notification list',
  },
)

export type NotificationListResponse = z.infer<typeof NotificationListResponse>

/**
 * Single notification response (raw Zod)
 */
export const NotificationResponse = Notification

/**
 * Single notification response (OpenAPI documented)
 */
export const NotificationResponseSchema = NotificationResponse.openapi(
  'NotificationResponse',
  {
    description: 'Single notification details',
  },
)

export type NotificationResponse = z.infer<typeof NotificationResponse>

// ============= Notification Settings =============

/**
 * Notification preferences (raw Zod)
 */
export const NotificationPreferencesResponse = z.object({
  email: z.object({
    enabled: z.boolean().default(true),
    categories: z.array(z.string()).default([]),
  }),
  inApp: z.object({
    enabled: z.boolean().default(true),
    categories: z.array(z.string()).default([]),
  }),
  sms: z.object({
    enabled: z.boolean().default(false),
    categories: z.array(z.string()).default([]),
  }),
  push: z.object({
    enabled: z.boolean().default(true),
    categories: z.array(z.string()).default([]),
    token: z.string().optional(),
  }),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    end: z
      .string()
      .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .optional(),
    timezone: z.string().optional(),
  }),
})

/**
 * Notification preferences (OpenAPI documented)
 */
export const NotificationPreferencesResponseSchema = NotificationPreferencesResponse.openapi(
  'NotificationPreferencesResponse',
  {
    description: 'User notification preferences',
  },
)

export type NotificationPreferencesResponse = z.infer<
  typeof NotificationPreferencesResponse
>

/**
 * Update notification preferences request (raw Zod)
 */
export const UpdateNotificationPreferencesRequest =
  NotificationPreferencesResponse.partial()

/**
 * Update notification preferences request (OpenAPI documented)
 */
export const UpdateNotificationPreferencesRequestSchema = UpdateNotificationPreferencesRequest.openapi(
  'UpdateNotificationPreferencesRequest',
  {
    description: 'Update notification preferences',
  },
)

export type UpdateNotificationPreferencesRequest = z.infer<
  typeof UpdateNotificationPreferencesRequest
>

// ============= Push Notification Registration =============

/**
 * Register push notification token (raw Zod)
 */
export const RegisterPushTokenRequest = z.object({
  token: z.string().min(1),
  platform: DevicePlatform,
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
})

/**
 * Register push notification token (OpenAPI documented)
 */
export const RegisterPushTokenRequestSchema = RegisterPushTokenRequest.openapi(
  'RegisterPushTokenRequest',
  {
    description: 'Register device for push notifications',
  },
)

export type RegisterPushTokenRequest = z.infer<typeof RegisterPushTokenRequest>

/**
 * Unregister push notification token (raw Zod)
 */
export const UnregisterPushTokenRequest = z.object({
  token: z.string().min(1),
})

/**
 * Unregister push notification token (OpenAPI documented)
 */
export const UnregisterPushTokenRequestSchema = UnregisterPushTokenRequest.openapi(
  'UnregisterPushTokenRequest',
  {
    description: 'Unregister device from push notifications',
  },
)

export type UnregisterPushTokenRequest = z.infer<
  typeof UnregisterPushTokenRequest
>

// ============= Operation Responses =============

/**
 * Mark all as read response (raw Zod)
 */
export const MarkAllAsReadResponse = z.object({
  updated: z
    .number()
    .int()
    .nonnegative()
    .describe('Number of notifications marked as read'),
})

/**
 * Mark all as read response (OpenAPI documented)
 */
export const MarkAllAsReadResponseSchema = MarkAllAsReadResponse.openapi(
  'MarkAllAsReadResponse',
  {
    description: 'Response when all notifications are marked as read',
  },
)

export type MarkAllAsReadResponse = z.infer<typeof MarkAllAsReadResponse>

/**
 * Delete notification response (raw Zod)
 */
export const DeleteNotificationResponse = z.object({
  message: z.string().default('Notification deleted successfully'),
})

/**
 * Delete notification response (OpenAPI documented)
 */
export const DeleteNotificationResponseSchema = DeleteNotificationResponse.openapi(
  'DeleteNotificationResponse',
  {
    description: 'Response when a notification is deleted',
  },
)

export type DeleteNotificationResponse = z.infer<
  typeof DeleteNotificationResponse
>
