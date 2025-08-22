/**
 * Cache key constants for support service
 *
 * Pattern: service:entity[-modifier]:identifier
 * - Use colons (:) for hierarchy levels
 * - Use hyphens (-) for compound words within a level
 */

export const CACHE_KEYS = {
  // Problem entity cache keys
  PROBLEM: {
    LIST: 'service:problems',
    SINGLE: 'service:problem',
    BY_USER: 'service:problems:user',
    BY_STATUS: 'service:problems:status',
    BY_CATEGORY: 'service:problems:category',
  },

  // Comment entity cache keys
  COMMENT: {
    LIST: 'service:comments',
    SINGLE: 'service:comment',
    BY_PROBLEM: 'service:comments:problem',
    BY_USER: 'service:comments:user',
  },

  // Admin cache keys
  ADMIN: {
    PROBLEMS: 'service:admin:problems',
    SINGLE_PROBLEM: 'service:admin:problem',
    COMMENTS: 'service:admin:comments',
    SINGLE_COMMENT: 'service:admin:comment',
    STATS: 'service:admin:support:stats',
    ANALYTICS: 'service:admin:support:analytics',
  },

  // Internal service cache keys
  INTERNAL: {
    PROBLEMS: 'service:internal:problems',
    SINGLE_PROBLEM: 'service:internal:problem',
    COMMENTS: 'service:internal:comments',
    SINGLE_COMMENT: 'service:internal:comment',
    NOTIFICATIONS: 'service:internal:support:notifications',
  },
} as const

/**
 * Helper functions to generate cache keys with context
 */
export const generateCacheKey = {
  problemById: (id: string) => `${CACHE_KEYS.PROBLEM.SINGLE}:${id}`,
  problemsByUser: (userId: string) => `${CACHE_KEYS.PROBLEM.BY_USER}:${userId}`,
  problemsByStatus: (status: string) =>
    `${CACHE_KEYS.PROBLEM.BY_STATUS}:${status}`,
  commentById: (id: string) => `${CACHE_KEYS.COMMENT.SINGLE}:${id}`,
  commentsByProblem: (problemId: string) =>
    `${CACHE_KEYS.COMMENT.BY_PROBLEM}:${problemId}`,
  problemList: (params: any) =>
    `${CACHE_KEYS.PROBLEM.LIST}:${JSON.stringify(params)}`,
  commentList: (params: any) =>
    `${CACHE_KEYS.COMMENT.LIST}:${JSON.stringify(params)}`,
}
