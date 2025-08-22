/**
 * Cache key constants for subscription service
 *
 * Pattern: service:entity[-modifier]:identifier
 * - Use colons (:) for hierarchy levels
 * - Use hyphens (-) for compound words within a level
 */

export const CACHE_KEYS = {
  // Subscription plan cache keys
  PLAN: {
    LIST: 'service:subscription-plans',
    SINGLE: 'service:subscription-plan',
    ACTIVE: 'service:subscription-plans:active',
    BY_TYPE: 'service:subscription-plans:type',
  },

  // User subscription cache keys
  SUBSCRIPTION: {
    SINGLE: 'service:subscription',
    USER: 'service:subscription:user',
    ACTIVE: 'service:subscription:active',
    HISTORY: 'service:subscription:history',
    STATUS: 'service:subscription:status',
  },

  // User membership cache keys
  MEMBERSHIP: {
    USER: 'service:user-membership',
    STATUS: 'service:membership:status',
    BENEFITS: 'service:membership:benefits',
  },

  // Admin cache keys
  ADMIN: {
    SUBSCRIPTIONS: 'service:admin:subscriptions',
    PLANS: 'service:admin:subscription-plans',
  },
} as const

/**
 * Helper functions to generate cache keys with context
 */
export const generateCacheKey = {
  planById: (id: string) => `${CACHE_KEYS.PLAN.SINGLE}:${id}`,
  plansByType: (type: string) => `${CACHE_KEYS.PLAN.BY_TYPE}:${type}`,
  userSubscription: (userId: string) =>
    `${CACHE_KEYS.SUBSCRIPTION.USER}:${userId}`,
  subscriptionHistory: (userId: string, params: any) =>
    `${CACHE_KEYS.SUBSCRIPTION.HISTORY}:${userId}:${JSON.stringify(params)}`,
  userMembership: (userId: string) => `${CACHE_KEYS.MEMBERSHIP.USER}:${userId}`,
  membershipStatus: (userId: string) =>
    `${CACHE_KEYS.MEMBERSHIP.STATUS}:${userId}`,
}
