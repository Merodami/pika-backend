/**
 * Cache key constants for business service
 *
 * Pattern: service:entity[-modifier]:identifier
 * - Use colons (:) for hierarchy levels
 * - Use hyphens (-) for compound words within a level
 */

export const CACHE_KEYS = {
  // Business registration cache keys
  REGISTRATION: {
    STATUS: 'business:registration:status',
    USER: 'business:registration:user',
  },

  // Business entity cache keys
  BUSINESS: {
    LIST: 'businesses',
    SINGLE: 'business',
    USER: 'business:user',
    DETAILS: 'business:details',
  },

  // Admin cache keys
  ADMIN: {
    LIST: 'admin:businesses',
    SINGLE: 'admin:business',
  },
} as const

/**
 * Helper functions to generate cache keys with user context
 */
export const generateCacheKey = {
  registrationStatus: (userId: string) =>
    `${CACHE_KEYS.REGISTRATION.STATUS}:${userId}`,
  registrationUser: (userId: string) =>
    `${CACHE_KEYS.REGISTRATION.USER}:${userId}`,
  businessByUser: (userId: string) => `${CACHE_KEYS.BUSINESS.USER}:${userId}`,
  businessById: (businessId: string) =>
    `${CACHE_KEYS.BUSINESS.SINGLE}:${businessId}`,
  businessDetails: (businessId: string) =>
    `${CACHE_KEYS.BUSINESS.DETAILS}:${businessId}`,
}
