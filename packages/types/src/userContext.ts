/**
 * User Context Types
 * Minimal extension of RequestContext for user-specific data
 */

import { UserRole, UserStatus } from './enum.js'

/**
 * Enhanced UserContext that extends RequestContext pattern
 * Only includes what actually exists in the database
 */
export interface UserContext {
  // From JWT (always available)
  userId: string
  email: string
  role: UserRole
  permissions: string[]

  // From User table (loaded on demand)
  profile?: {
    firstName: string
    lastName: string
    status: UserStatus
    emailVerified: boolean
    phoneNumber?: string
    phoneVerified: boolean
    avatarUrl?: string
    preferredLanguage?: string
    primaryBusinessId?: string
  }

  // From User.settings JSON field (flexible structure)
  settings?: Record<string, any>

  // Session info (runtime)
  sessionId?: string
  deviceId?: string
  ipAddress?: string
}

/**
 * Helper to extract language preference
 */
export const getUserLanguage = (context: UserContext): string => {
  return context.profile?.preferredLanguage || 'en'
}

/**
 * Cache keys for Redis
 */
export const USER_CONTEXT_CACHE_KEYS = {
  PROFILE: (userId: string) => `user:profile:${userId}`,
  SETTINGS: (userId: string) => `user:settings:${userId}`,
} as const
