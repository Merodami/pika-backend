import { z } from 'zod'

/**
 * Communication service specific enums - centralized for consistency
 */

// ============= Communication Channel & Status =============

/**
 * Communication channels available for sending messages
 */
export const CommunicationChannel = z.enum([
  'EMAIL',
  'SMS',
  'PUSH',
  'IN_APP',
  'WEBHOOK',
])
export type CommunicationChannel = z.infer<typeof CommunicationChannel>

/**
 * Communication delivery status
 */
export const CommunicationStatus = z.enum([
  'PENDING',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'OPENED',
  'CLICKED',
  'UNSUBSCRIBED',
])
export type CommunicationStatus = z.infer<typeof CommunicationStatus>

/**
 * Communication direction
 */
export const CommunicationDirection = z.enum(['INBOUND', 'OUTBOUND'])
export type CommunicationDirection = z.infer<typeof CommunicationDirection>

// ============= Email Specific Enums =============

/**
 * Email delivery status
 */
export const EmailStatus = z.enum([
  'PENDING',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'BOUNCED',
  'FAILED',
  'OPENED',
  'CLICKED',
])
export type EmailStatus = z.infer<typeof EmailStatus>

/**
 * Email priority levels
 */
export const EmailPriority = z.enum(['LOW', 'NORMAL', 'HIGH'])
export type EmailPriority = z.infer<typeof EmailPriority>

/**
 * Email bounce types
 */
export const BounceType = z.enum(['soft', 'hard'])
export type BounceType = z.infer<typeof BounceType>

/**
 * Email events for tracking
 */
export const EmailEventType = z.enum([
  'SENT',
  'DELIVERED',
  'OPENED',
  'CLICKED',
  'BOUNCED',
  'FAILED',
  'UNSUBSCRIBED',
])
export type EmailEventType = z.infer<typeof EmailEventType>

// ============= Template Enums =============

/**
 * Template types based on communication channel
 */
export const TemplateType = z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
export type TemplateType = z.infer<typeof TemplateType>

/**
 * Template categories for organization
 */
export const TemplateCategory = z.enum([
  'AUTH',
  'PAYMENT',
  'REMINDER',
  'NOTIFICATION',
  'MARKETING',
  'SYSTEM',
  'CUSTOM',
])
export type TemplateCategory = z.infer<typeof TemplateCategory>

/**
 * Template priority levels
 */
export const TemplatePriority = z.enum(['LOW', 'NORMAL', 'HIGH'])
export type TemplatePriority = z.infer<typeof TemplatePriority>

/**
 * Template variable types
 */
export const TemplateVariableType = z.enum([
  'STRING',
  'NUMBER',
  'BOOLEAN',
  'DATE',
  'ARRAY',
  'OBJECT',
])
export type TemplateVariableType = z.infer<typeof TemplateVariableType>

// ============= Notification Enums =============

/**
 * Notification types for in-app notifications
 */
export const NotificationType = z.enum(['info', 'warning', 'error', 'success'])
export type NotificationType = z.infer<typeof NotificationType>

/**
 * Notification priority levels
 */
export const NotificationPriority = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
export type NotificationPriority = z.infer<typeof NotificationPriority>

/**
 * Notification categories for system notifications
 */
export const NotificationCategory = z.enum([
  'SYSTEM',
  'SECURITY',
  'BILLING',
  'MARKETING',
])
export type NotificationCategory = z.infer<typeof NotificationCategory>

// ============= SMS Enums =============

/**
 * SMS message types
 */
export const SMSType = z.enum([
  'VERIFICATION',
  'ALERT',
  'REMINDER',
  'MARKETING',
])
export type SMSType = z.infer<typeof SMSType>

/**
 * SMS delivery status
 */
export const SMSStatus = z.enum(['SENT', 'FAILED', 'QUEUED'])
export type SMSStatus = z.infer<typeof SMSStatus>

// ============= Push Notification Enums =============

/**
 * Push notification priority levels
 */
export const PushPriority = z.enum(['NORMAL', 'HIGH'])
export type PushPriority = z.infer<typeof PushPriority>

/**
 * Mobile platform types
 */
export const MobilePlatform = z.enum(['IOS', 'ANDROID', 'WEB'])
export type MobilePlatform = z.infer<typeof MobilePlatform>

// ============= Internal Service Enums =============

/**
 * Transactional email template keys
 */
export const TransactionalEmailTemplate = z.enum([
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
])
export type TransactionalEmailTemplate = z.infer<
  typeof TransactionalEmailTemplate
>

/**
 * Communication event types for tracking
 */
export const CommunicationEventType = z.enum([
  'delivered',
  'opened',
  'clicked',
  'bounced',
  'failed',
  'unsubscribed',
])
export type CommunicationEventType = z.infer<typeof CommunicationEventType>

/**
 * Communication processing status
 */
export const CommunicationProcessingStatus = z.enum([
  'QUEUED',
  'SENT',
  'FAILED',
])
export type CommunicationProcessingStatus = z.infer<
  typeof CommunicationProcessingStatus
>

// ============= Sort Fields =============

/**
 * Communication log sort fields
 */
export const CommunicationLogSortBy = z.enum([
  'createdAt',
  'sentAt',
  'deliveredAt',
])
export type CommunicationLogSortBy = z.infer<typeof CommunicationLogSortBy>

/**
 * Template sort fields
 */
export const TemplateSortBy = z.enum([
  'NAME',
  'CREATED_AT',
  'UPDATED_AT',
  'USAGE_COUNT',
])
export type TemplateSortBy = z.infer<typeof TemplateSortBy>

/**
 * Email sort fields
 */
export const EmailSortBy = z.enum([
  'SENT_AT',
  'DELIVERED_AT',
  'OPENED_AT',
  'SUBJECT',
])
export type EmailSortBy = z.infer<typeof EmailSortBy>

/**
 * Notification sort fields
 */
export const NotificationSortBy = z.enum([
  'CREATED_AT',
  'UPDATED_AT',
  'PRIORITY',
  'READ_AT',
])
export type NotificationSortBy = z.infer<typeof NotificationSortBy>

// ============= Analytics Enums =============

/**
 * Analytics grouping periods
 */
export const AnalyticsGroupBy = z.enum(['day', 'week', 'month'])
export type AnalyticsGroupBy = z.infer<typeof AnalyticsGroupBy>

/**
 * Notification status update types
 */
export const NotificationStatusUpdateType = z.enum([
  'DELIVERED',
  'OPENED',
  'CLICKED',
  'BOUNCED',
  'FAILED',
])
export type NotificationStatusUpdateType = z.infer<
  typeof NotificationStatusUpdateType
>
