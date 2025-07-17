import { Static, Type } from '@sinclair/typebox'

import { NonEmptyString, UUIDSchema } from '../utils/uuid.js'

// Notification types enum
export enum NotificationType {
  VOUCHER_CREATED = 'VOUCHER_CREATED',
  VOUCHER_UPDATED = 'VOUCHER_UPDATED',
  VOUCHER_EXPIRED = 'VOUCHER_EXPIRED',
  PROVIDER_UPDATED = 'PROVIDER_UPDATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  VOUCHER_CLAIMED = 'VOUCHER_CLAIMED',
  VOUCHER_REDEEMED = 'VOUCHER_REDEEMED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

// Notification type schema as string union
export const NotificationTypeSchema = Type.Union([
  Type.Literal('VOUCHER_CREATED'),
  Type.Literal('VOUCHER_UPDATED'),
  Type.Literal('VOUCHER_EXPIRED'),
  Type.Literal('PROVIDER_UPDATED'),
  Type.Literal('PAYMENT_RECEIVED'),
  Type.Literal('PAYMENT_FAILED'),
  Type.Literal('MESSAGE_RECEIVED'),
  Type.Literal('REVIEW_RECEIVED'),
  Type.Literal('VOUCHER_CLAIMED'),
  Type.Literal('VOUCHER_REDEEMED'),
  Type.Literal('SYSTEM_ANNOUNCEMENT'),
])

// Entity reference schema
export const EntityRefSchema = Type.Object({
  entityType: NonEmptyString(50),
  entityId: UUIDSchema,
})

export type EntityRef = Static<typeof EntityRefSchema>

// Base notification schema
export const NotificationSchema = Type.Object({
  id: UUIDSchema,
  userId: UUIDSchema,
  type: NotificationTypeSchema,
  title: NonEmptyString(200),
  body: NonEmptyString(1000),
  icon: Type.Optional(Type.String({ maxLength: 500 })),
  entityRef: Type.Optional(EntityRefSchema),
  read: Type.Boolean({ default: false }),
  createdAt: Type.String({ format: 'date-time' }),
  expiresAt: Type.Optional(Type.String({ format: 'date-time' })),
})

export type Notification = Static<typeof NotificationSchema>

// Publish notification request schema
export const PublishNotificationRequestSchema = Type.Object({
  userId: UUIDSchema,
  type: NotificationTypeSchema,
  title: NonEmptyString(200),
  body: NonEmptyString(1000),
  icon: Type.Optional(Type.String({ maxLength: 500 })),
  entityRef: Type.Optional(EntityRefSchema),
  expiresAt: Type.Optional(Type.String({ format: 'date-time' })),
})

export type PublishNotificationRequest = Static<
  typeof PublishNotificationRequestSchema
>

// Publish notification response schema
export const PublishNotificationResponseSchema = Type.Object({
  success: Type.Boolean(),
})

export type PublishNotificationResponse = Static<
  typeof PublishNotificationResponseSchema
>

// Get notifications query parameters
export const GetNotificationsQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  unreadOnly: Type.Optional(Type.Boolean({ default: false })),
  types: Type.Optional(Type.Array(NotificationTypeSchema)),
})

export type GetNotificationsQuery = Static<typeof GetNotificationsQuerySchema>

// Get notifications response
export const GetNotificationsResponseSchema = Type.Object({
  notifications: Type.Array(NotificationSchema),
  unreadCount: Type.Integer({ minimum: 0 }),
  total: Type.Integer({ minimum: 0 }),
})

export type GetNotificationsResponse = Static<
  typeof GetNotificationsResponseSchema
>

// Mark notification as read params
export const MarkNotificationAsReadParamsSchema = Type.Object({
  notificationId: UUIDSchema,
})

export type MarkNotificationAsReadParams = Static<
  typeof MarkNotificationAsReadParamsSchema
>

// Batch publish notifications request
export const PublishBatchNotificationsRequestSchema = Type.Object({
  notifications: Type.Array(PublishNotificationRequestSchema, {
    minItems: 1,
    maxItems: 500,
  }),
})

export type PublishBatchNotificationsRequest = Static<
  typeof PublishBatchNotificationsRequestSchema
>

// Batch publish notifications response
export const PublishBatchNotificationsResponseSchema = Type.Object({
  success: Type.Boolean(),
  count: Type.Integer({ minimum: 0 }),
})

export type PublishBatchNotificationsResponse = Static<
  typeof PublishBatchNotificationsResponseSchema
>

// Mark batch notifications as read request
export const MarkBatchNotificationsAsReadRequestSchema = Type.Object({
  notificationIds: Type.Array(UUIDSchema, {
    minItems: 1,
    maxItems: 100,
  }),
})

export type MarkBatchNotificationsAsReadRequest = Static<
  typeof MarkBatchNotificationsAsReadRequestSchema
>

// Get notifications by entity params
export const GetNotificationsByEntityParamsSchema = Type.Object({
  entityType: NonEmptyString(50),
  entityId: UUIDSchema,
})

export type GetNotificationsByEntityParams = Static<
  typeof GetNotificationsByEntityParamsSchema
>

// Get notifications by entity query
export const GetNotificationsByEntityQuerySchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
})

export type GetNotificationsByEntityQuery = Static<
  typeof GetNotificationsByEntityQuerySchema
>

// Get notifications by entity response
export const GetNotificationsByEntityResponseSchema = Type.Object({
  data: Type.Array(NotificationSchema),
  total: Type.Integer({ minimum: 0 }),
})

export type GetNotificationsByEntityResponse = Static<
  typeof GetNotificationsByEntityResponseSchema
>
