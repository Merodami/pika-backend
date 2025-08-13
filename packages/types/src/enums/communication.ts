/**
 * Communication and notification related enums
 */

/**
 * Notification categories
 * Standardizes notification types across services
 */
export enum NotificationCategory {
  SYSTEM = 'system',
  MARKETING = 'marketing',
  TRANSACTION = 'transaction',
  SOCIAL = 'social',
  SECURITY = 'security',
  REMINDER = 'reminder',
  UPDATE = 'update',
  BILLING = 'billing',
}

/**
 * Message priority
 * Used for prioritizing message delivery
 */
export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Email delivery status
 */
export enum EmailStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  REJECTED = 'rejected',
}

/**
 * Email bounce types
 */
export enum BounceType {
  SOFT = 'soft',
  HARD = 'hard',
}

/**
 * Email events for tracking
 */
export enum EmailEvent {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  COMPLAINED = 'complained',
  UNSUBSCRIBED = 'unsubscribed',
}

/**
 * Email sorting fields
 */
export enum EmailSortBy {
  CREATED_AT = 'createdAt',
  SENT_AT = 'sentAt',
  DELIVERED_AT = 'deliveredAt',
  SUBJECT = 'subject',
}

/**
 * Notification type/channel
 */
export enum NotificationType {
  EMAIL = 'email',
  IN_APP = 'inApp',
  SMS = 'sms',
  PUSH = 'push',
}

/**
 * Notification delivery status
 */
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

/**
 * Notification sorting fields
 */
export enum NotificationSortBy {
  CREATED_AT = 'createdAt',
  PRIORITY = 'priority',
  EXPIRES_AT = 'expiresAt',
}

/**
 * Communication log sorting fields
 */
export enum CommunicationLogSortBy {
  CREATED_AT = 'createdAt',
  SENT_AT = 'sentAt',
  DELIVERED_AT = 'deliveredAt',
}

/**
 * Template sorting fields
 */
export enum TemplateSortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  CATEGORY = 'category',
}

/**
 * Communication channels
 */
export enum CommunicationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'inApp',
  WEBHOOK = 'webhook',
}

/**
 * Communication delivery status
 */
export enum CommunicationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Communication direction
 */
export enum CommunicationDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

/**
 * Communication grouping periods
 */
export enum CommunicationGroupBy {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

/**
 * Template types
 */
export enum TemplateType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'inApp',
}

/**
 * Template categories
 */
export enum TemplateCategory {
  AUTH = 'auth',
  PAYMENT = 'payment',
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  SYSTEM = 'system',
  NOTIFICATION = 'notification',
}

/**
 * Template variable types
 */
export enum TemplateVariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object',
}

/**
 * Message types
 */
export enum MessageType {
  VERIFICATION = 'verification',
  ALERT = 'alert',
  REMINDER = 'reminder',
  MARKETING = 'marketing',
}

/**
 * In-app notification types
 */
export enum InAppNotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success',
}
