/**
 * Cache key constants for communication service
 *
 * Pattern: service:entity[-modifier]:identifier
 * - Use colons (:) for hierarchy levels
 * - Use hyphens (-) for compound words within a level
 */

export const CACHE_KEYS = {
  // Email cache keys
  EMAIL: {
    SINGLE: 'service:email',
    HISTORY: 'service:email-history',
    BY_USER: 'service:emails:user',
  },

  // Notification cache keys
  NOTIFICATION: {
    LIST: 'service:user-notifications',
    SINGLE: 'service:notification',
    BY_USER: 'service:notifications:user',
    UNREAD_COUNT: 'service:notifications:unread-count',
  },

  // Communication log cache keys
  COMMUNICATION: {
    LOG: 'service:communication-log',
    HISTORY: 'service:communication-history',
  },
} as const

/**
 * Helper functions to generate cache keys with context
 */
export const generateCacheKey = {
  emailById: (id: string, userId?: string) =>
    `${CACHE_KEYS.EMAIL.SINGLE}:${id}:${userId || 'public'}`,
  emailHistory: (userId: string, params: any) =>
    `${CACHE_KEYS.EMAIL.HISTORY}:${userId}:${JSON.stringify(params)}`,
  notificationsByUser: (userId: string, params: any) =>
    `${CACHE_KEYS.NOTIFICATION.LIST}:${userId}:${JSON.stringify(params)}`,
  notificationById: (id: string) => `${CACHE_KEYS.NOTIFICATION.SINGLE}:${id}`,
  unreadCount: (userId: string) =>
    `${CACHE_KEYS.NOTIFICATION.UNREAD_COUNT}:${userId}`,
}
