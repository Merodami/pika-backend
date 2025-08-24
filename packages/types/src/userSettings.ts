/**
 * User Settings Types
 * Centralized type definitions for user preferences and settings
 */

// ============= Core Setting Categories =============

/**
 * User interface and display preferences
 */
export interface UserDisplaySettings {
  theme: 'light' | 'dark' | 'system'
  language: string // ISO 639-1 language code (e.g., 'en', 'es')
  timezone?: string // IANA timezone (e.g., 'America/New_York')
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  timeFormat: '12h' | '24h'
  currency: string // ISO 4217 currency code (e.g., 'USD', 'EUR')
  compactMode: boolean
  showAvatars: boolean
  itemsPerPage: number
}

/**
 * Communication and notification preferences
 */
export interface UserNotificationSettings {
  email: {
    enabled: boolean
    marketing: boolean
    productUpdates: boolean
    securityAlerts: boolean
    voucherExpiry: boolean
    businessUpdates: boolean
  }
  push: {
    enabled: boolean
    marketing: boolean
    voucherExpiry: boolean
    businessUpdates: boolean
    orderUpdates: boolean
  }
  sms: {
    enabled: boolean
    securityAlerts: boolean
    orderUpdates: boolean
  }
  inApp: {
    enabled: boolean
    sound: boolean
    vibration: boolean
  }
}

/**
 * Privacy and visibility settings
 */
export interface UserPrivacySettings {
  profile: {
    visibility: 'public' | 'private' | 'friends'
    showEmail: boolean
    showPhone: boolean
    showBirthDate: boolean
  }
  search: {
    allowDiscovery: boolean
    showInRecommendations: boolean
  }
  analytics: {
    allowTracking: boolean
    shareUsageData: boolean
  }
  marketing: {
    allowPersonalization: boolean
    shareWithPartners: boolean
  }
}

/**
 * Business-related preferences (for business users)
 */
export interface UserBusinessSettings {
  dashboard: {
    defaultView: 'overview' | 'analytics' | 'vouchers' | 'customers'
    autoRefresh: boolean
    refreshInterval: number // minutes
  }
  vouchers: {
    autoApprove: boolean
    requireCustomerData: boolean
    allowBulkActions: boolean
  }
  notifications: {
    newCustomers: boolean
    voucherRedemptions: boolean
    lowStockAlerts: boolean
    reviewRequests: boolean
  }
}

/**
 * Accessibility and usability settings
 */
export interface UserAccessibilitySettings {
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
}

// ============= Main Settings Interface =============

/**
 * Complete user settings object
 * Version 1.0 - Initial implementation
 */
export interface UserSettings {
  version: '1.0' // For future schema migrations
  display: UserDisplaySettings
  notifications: UserNotificationSettings
  privacy: UserPrivacySettings
  business?: UserBusinessSettings // Optional for business users
  accessibility: UserAccessibilitySettings
  updatedAt: Date
}

// ============= Default Settings =============

export const DEFAULT_DISPLAY_SETTINGS: UserDisplaySettings = {
  theme: 'system',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  compactMode: false,
  showAvatars: true,
  itemsPerPage: 20,
}

export const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  email: {
    enabled: true,
    marketing: false,
    productUpdates: true,
    securityAlerts: true,
    voucherExpiry: true,
    businessUpdates: true,
  },
  push: {
    enabled: true,
    marketing: false,
    voucherExpiry: true,
    businessUpdates: true,
    orderUpdates: true,
  },
  sms: {
    enabled: false,
    securityAlerts: true,
    orderUpdates: false,
  },
  inApp: {
    enabled: true,
    sound: true,
    vibration: true,
  },
}

export const DEFAULT_PRIVACY_SETTINGS: UserPrivacySettings = {
  profile: {
    visibility: 'public',
    showEmail: false,
    showPhone: false,
    showBirthDate: false,
  },
  search: {
    allowDiscovery: true,
    showInRecommendations: true,
  },
  analytics: {
    allowTracking: true,
    shareUsageData: false,
  },
  marketing: {
    allowPersonalization: true,
    shareWithPartners: false,
  },
}

export const DEFAULT_BUSINESS_SETTINGS: UserBusinessSettings = {
  dashboard: {
    defaultView: 'overview',
    autoRefresh: true,
    refreshInterval: 5,
  },
  vouchers: {
    autoApprove: false,
    requireCustomerData: true,
    allowBulkActions: true,
  },
  notifications: {
    newCustomers: true,
    voucherRedemptions: true,
    lowStockAlerts: true,
    reviewRequests: true,
  },
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: UserAccessibilitySettings = {
  reduceMotion: false,
  highContrast: false,
  largeText: false,
  screenReader: false,
  keyboardNavigation: false,
}

/**
 * Creates default user settings for a given user role
 */
export function createDefaultUserSettings(
  isBusinessUser = false,
): UserSettings {
  const settings: UserSettings = {
    version: '1.0',
    display: { ...DEFAULT_DISPLAY_SETTINGS },
    notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
    privacy: { ...DEFAULT_PRIVACY_SETTINGS },
    accessibility: { ...DEFAULT_ACCESSIBILITY_SETTINGS },
    updatedAt: new Date(),
  }

  if (isBusinessUser) {
    settings.business = { ...DEFAULT_BUSINESS_SETTINGS }
  }

  return settings
}

// ============= Partial Update Types =============

/**
 * Deep partial type for settings updates
 */
export type PartialUserSettings = {
  display?: Partial<UserDisplaySettings>
  notifications?: {
    email?: Partial<UserNotificationSettings['email']>
    push?: Partial<UserNotificationSettings['push']>
    sms?: Partial<UserNotificationSettings['sms']>
    inApp?: Partial<UserNotificationSettings['inApp']>
  }
  privacy?: {
    profile?: Partial<UserPrivacySettings['profile']>
    search?: Partial<UserPrivacySettings['search']>
    analytics?: Partial<UserPrivacySettings['analytics']>
    marketing?: Partial<UserPrivacySettings['marketing']>
  }
  business?: {
    dashboard?: Partial<UserBusinessSettings['dashboard']>
    vouchers?: Partial<UserBusinessSettings['vouchers']>
    notifications?: Partial<UserBusinessSettings['notifications']>
  }
  accessibility?: Partial<UserAccessibilitySettings>
}

// ============= Settings Validation =============

/**
 * Validates if a partial settings update is valid
 */
export function validateUserSettingsUpdate(
  current: UserSettings,
  update: PartialUserSettings,
): boolean {
  // Version compatibility check
  if (current.version !== '1.0') {
    return false
  }

  // Validate itemsPerPage range
  if (update.display?.itemsPerPage) {
    const itemsPerPage = update.display.itemsPerPage

    if (itemsPerPage < 10 || itemsPerPage > 100) {
      return false
    }
  }

  // Validate language code format (ISO 639-1)
  if (update.display?.language) {
    const languageRegex = /^[a-z]{2}$/

    if (!languageRegex.test(update.display.language)) {
      return false
    }
  }

  // Validate currency code format (ISO 4217)
  if (update.display?.currency) {
    const currencyRegex = /^[A-Z]{3}$/

    if (!currencyRegex.test(update.display.currency)) {
      return false
    }
  }

  return true
}

/**
 * Deep merges partial settings update with current settings
 */
export function mergeUserSettings(
  current: UserSettings,
  update: PartialUserSettings,
): UserSettings {
  const merged: UserSettings = {
    ...current,
    updatedAt: new Date(),
  }

  if (update.display) {
    merged.display = { ...current.display, ...update.display }
  }

  if (update.notifications) {
    merged.notifications = {
      email: { ...current.notifications.email, ...update.notifications.email },
      push: { ...current.notifications.push, ...update.notifications.push },
      sms: { ...current.notifications.sms, ...update.notifications.sms },
      inApp: { ...current.notifications.inApp, ...update.notifications.inApp },
    }
  }

  if (update.privacy) {
    merged.privacy = {
      profile: { ...current.privacy.profile, ...update.privacy.profile },
      search: { ...current.privacy.search, ...update.privacy.search },
      analytics: { ...current.privacy.analytics, ...update.privacy.analytics },
      marketing: { ...current.privacy.marketing, ...update.privacy.marketing },
    }
  }

  if (update.business && current.business) {
    merged.business = {
      dashboard: {
        ...current.business.dashboard,
        ...update.business.dashboard,
      },
      vouchers: { ...current.business.vouchers, ...update.business.vouchers },
      notifications: {
        ...current.business.notifications,
        ...update.business.notifications,
      },
    }
  }

  if (update.accessibility) {
    merged.accessibility = { ...current.accessibility, ...update.accessibility }
  }

  return merged
}

// ============= Migration Helpers =============

/**
 * Migrates settings from older versions (for future use)
 */
export function migrateUserSettings(settings: any): UserSettings {
  // Future migrations will go here
  if (settings.version === '1.0') {
    return settings as UserSettings
  }

  // Default migration - create new settings
  return createDefaultUserSettings()
}
