import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'

/**
 * User settings schemas for public API
 * Uses centralized types from @pika/types for consistency
 */

// ============= Raw Zod Schema Definitions =============

// Display Settings (raw Zod)
const UserDisplaySettings = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().length(2), // ISO 639-1
  timezone: z.string().optional(),
  dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']),
  timeFormat: z.enum(['12h', '24h']),
  currency: z.string().length(3), // ISO 4217
  compactMode: z.boolean(),
  showAvatars: z.boolean(),
  itemsPerPage: z.number().int().min(10).max(100),
})

// Notification Settings (raw Zod)
const UserNotificationSettings = z.object({
  email: z.object({
    enabled: z.boolean(),
    marketing: z.boolean(),
    productUpdates: z.boolean(),
    securityAlerts: z.boolean(),
    voucherExpiry: z.boolean(),
  }),
  push: z.object({
    enabled: z.boolean(),
    marketing: z.boolean(),
    voucherExpiry: z.boolean(),
    orderUpdates: z.boolean(),
  }),
  sms: z.object({
    enabled: z.boolean(),
    securityAlerts: z.boolean(),
    orderUpdates: z.boolean(),
  }),
  inApp: z.object({
    enabled: z.boolean(),
    sound: z.boolean(),
    vibration: z.boolean(),
  }),
})

// Privacy Settings (raw Zod)
const UserPrivacySettings = z.object({
  profile: z.object({
    visibility: z.enum(['public', 'private', 'friends']),
    showEmail: z.boolean(),
    showPhone: z.boolean(),
    showBirthDate: z.boolean(),
  }),
  search: z.object({
    allowDiscovery: z.boolean(),
    showInRecommendations: z.boolean(),
  }),
  analytics: z.object({
    allowTracking: z.boolean(),
    shareUsageData: z.boolean(),
  }),
  marketing: z.object({
    allowPersonalization: z.boolean(),
    shareWithPartners: z.boolean(),
  }),
})

// Accessibility Settings (raw Zod)
const UserAccessibilitySettings = z.object({
  reduceMotion: z.boolean(),
  highContrast: z.boolean(),
  largeText: z.boolean(),
  screenReader: z.boolean(),
  keyboardNavigation: z.boolean(),
})

// Main User Settings (raw Zod)
export const UserSettings = z.object({
  version: z.literal('1.0'),
  display: UserDisplaySettings,
  notifications: UserNotificationSettings,
  privacy: UserPrivacySettings,
  accessibility: UserAccessibilitySettings,
  updatedAt: z.coerce.date(),
})

/**
 * User settings schema (OpenAPI documented)
 */
export const UserSettingsSchema = UserSettings.openapi('UserSettings', {
  description: 'User settings and preferences stored as JSON',
})

export type UserSettings = z.infer<typeof UserSettings>

// ============= Get User Settings =============

/**
 * Get user settings response
 */
export const GetUserSettingsResponse = openapi(
  z.object({
    settings: UserSettings,
  }),
  {
    description: 'Current user settings',
  },
)

export type GetUserSettingsResponse = z.infer<typeof GetUserSettingsResponse>

// ============= Update User Settings =============

/**
 * Update user settings request (full replace)
 */
export const UpdateUserSettingsRequest = openapi(UserSettings, {
  description: 'Complete user settings object (replaces existing settings)',
})

export type UpdateUserSettingsRequest = z.infer<
  typeof UpdateUserSettingsRequest
>

/**
 * Update user settings response
 */
export const UpdateUserSettingsResponse = openapi(
  z.object({
    settings: UserSettings,
    message: z.string().default('Settings updated successfully'),
  }),
  {
    description: 'Updated user settings',
  },
)

export type UpdateUserSettingsResponse = z.infer<
  typeof UpdateUserSettingsResponse
>

// ============= Patch User Settings =============

/**
 * Patch user settings request (partial update - raw Zod)
 */
const PatchUserSettingsRequestRaw = z.object({
  display: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.string().length(2).optional(),
      timezone: z.string().optional(),
      dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
      timeFormat: z.enum(['12h', '24h']).optional(),
      currency: z.string().length(3).optional(),
      compactMode: z.boolean().optional(),
      showAvatars: z.boolean().optional(),
      itemsPerPage: z.number().int().min(10).max(100).optional(),
    })
    .optional(),
  notifications: z
    .object({
      email: z
        .object({
          enabled: z.boolean().optional(),
          marketing: z.boolean().optional(),
          productUpdates: z.boolean().optional(),
          securityAlerts: z.boolean().optional(),
          voucherExpiry: z.boolean().optional(),
        })
        .optional(),
      push: z
        .object({
          enabled: z.boolean().optional(),
          marketing: z.boolean().optional(),
          voucherExpiry: z.boolean().optional(),
          orderUpdates: z.boolean().optional(),
        })
        .optional(),
      sms: z
        .object({
          enabled: z.boolean().optional(),
          securityAlerts: z.boolean().optional(),
          orderUpdates: z.boolean().optional(),
        })
        .optional(),
      inApp: z
        .object({
          enabled: z.boolean().optional(),
          sound: z.boolean().optional(),
          vibration: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  privacy: z
    .object({
      profile: z
        .object({
          visibility: z.enum(['public', 'private', 'friends']).optional(),
          showEmail: z.boolean().optional(),
          showPhone: z.boolean().optional(),
          showBirthDate: z.boolean().optional(),
        })
        .optional(),
      search: z
        .object({
          allowDiscovery: z.boolean().optional(),
          showInRecommendations: z.boolean().optional(),
        })
        .optional(),
      analytics: z
        .object({
          allowTracking: z.boolean().optional(),
          shareUsageData: z.boolean().optional(),
        })
        .optional(),
      marketing: z
        .object({
          allowPersonalization: z.boolean().optional(),
          shareWithPartners: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  accessibility: z
    .object({
      reduceMotion: z.boolean().optional(),
      highContrast: z.boolean().optional(),
      largeText: z.boolean().optional(),
      screenReader: z.boolean().optional(),
      keyboardNavigation: z.boolean().optional(),
    })
    .optional(),
})

/**
 * Patch user settings request (OpenAPI documented)
 */
export const PatchUserSettingsRequest = openapi(PatchUserSettingsRequestRaw, {
  description:
    'Partial user settings update (deep merge with existing settings)',
})

export type PatchUserSettingsRequest = z.infer<typeof PatchUserSettingsRequest>

/**
 * Patch user settings response
 */
export const PatchUserSettingsResponse = openapi(
  z.object({
    settings: UserSettings,
    message: z.string().default('Settings updated successfully'),
  }),
  {
    description: 'Updated user settings after partial update',
  },
)

export type PatchUserSettingsResponse = z.infer<
  typeof PatchUserSettingsResponse
>
