/**
 * Cache key constants for user service
 * 
 * Pattern: service:entity[-modifier]:identifier
 * - Use colons (:) for hierarchy levels
 * - Use hyphens (-) for compound words within a level
 */

export const CACHE_KEYS = {
  // User entity cache keys
  USER: {
    LIST: 'service:users',
    SINGLE: 'service:user',
    BY_EMAIL: 'service:user:email',
    PROFILE: 'service:user:profile',
    PREFERENCES: 'service:user:preferences',
  },
  
  // User sessions cache keys
  SESSION: {
    USER: 'service:user:sessions',
    ACTIVE: 'service:user:sessions:active',
  },
  
  // Admin cache keys
  ADMIN: {
    USERS: 'service:admin:users',
    SINGLE: 'service:admin:user',
    STATS: 'service:admin:user:stats',
    ANALYTICS: 'service:admin:user:analytics',
  },
  
  // Internal service cache keys
  INTERNAL: {
    USERS: 'service:internal:users',
    SINGLE: 'service:internal:user',
    BULK: 'service:internal:users:bulk',
    ACTIVE: 'service:internal:users:active',
    VERIFICATION: 'service:internal:user:verification',
  },
} as const

/**
 * Helper functions to generate cache keys with context
 */
export const generateCacheKey = {
  userById: (id: string) => `${CACHE_KEYS.USER.SINGLE}:${id}`,
  userByEmail: (email: string) => `${CACHE_KEYS.USER.BY_EMAIL}:${email}`,
  userProfile: (userId: string) => `${CACHE_KEYS.USER.PROFILE}:${userId}`,
  userList: (params: any) => `${CACHE_KEYS.USER.LIST}:${JSON.stringify(params)}`,
  userSessions: (userId: string) => `${CACHE_KEYS.SESSION.USER}:${userId}`,
}