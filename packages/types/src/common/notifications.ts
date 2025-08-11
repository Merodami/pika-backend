/**
 * Notification primitive types
 * Standardized notification preferences used across the platform
 */

/**
 * Base notification channel preferences
 * Use this for simple on/off preferences per channel
 */
export interface NotificationPreferences {
  email?: boolean
  push?: boolean
  sms?: boolean
  inApp?: boolean
}

/**
 * Notification frequency options
 */
export type NotificationFrequency =
  | 'instant'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'never'

/**
 * Extended notification settings with detailed preferences
 * Use this for complex notification management
 */
export interface NotificationSettings extends NotificationPreferences {
  frequency?: NotificationFrequency
  categories?: string[] // Which categories of notifications to receive
  quietHours?: {
    enabled: boolean
    start: string // Time in HH:mm format (e.g., "22:00")
    end: string // Time in HH:mm format (e.g., "08:00")
    timezone?: string // IANA timezone (e.g., "America/New_York")
  }
}

/**
 * Channel-specific notification settings
 * Use when different channels need different configurations
 */
export interface ChannelNotificationSettings {
  email?: {
    enabled: boolean
    address?: string
    verified?: boolean
  }
  push?: {
    enabled: boolean
    token?: string
    platform?: 'ios' | 'android' | 'web'
  }
  sms?: {
    enabled: boolean
    phoneNumber?: string
    verified?: boolean
  }
  inApp?: {
    enabled: boolean
    showBadge?: boolean
    playSound?: boolean
  }
}
