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
