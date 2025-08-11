/**
 * Device information primitive types
 * Standardized device tracking types used across the platform
 */

/**
 * Platform types for device identification
 */
export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
  DESKTOP = 'desktop',
  OTHER = 'other',
}

/**
 * Type definition for device platform - use this for type annotations
 */
export type DevicePlatformType = `${DevicePlatform}`

/**
 * Standard device information
 * Used for tracking user devices across all operations
 */
export interface DeviceInfo {
  userAgent?: string // Browser/app user agent string
  platform?: DevicePlatformType // Device platform
  appVersion?: string // Application version
  deviceId?: string // Unique device identifier
  model?: string // Device model (e.g., "iPhone 14 Pro")
  os?: string // Operating system name
  osVersion?: string // Operating system version
  screenResolution?: string // Screen resolution (e.g., "1920x1080")
  language?: string // Device language setting
}

/**
 * Minimal device info for simple tracking
 * Use when you only need basic device identification
 */
export interface DeviceInfoBasic {
  platform?: DevicePlatformType
  appVersion?: string
}

/**
 * Device session information
 * Use for tracking device sessions
 */
export interface DeviceSession extends DeviceInfo {
  sessionId: string
  startedAt: string // ISO 8601
  lastActiveAt?: string // ISO 8601
  ipAddress?: string
}
