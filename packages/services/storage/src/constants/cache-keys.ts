/**
 * Cache key constants for storage service
 * 
 * Pattern: service:entity[-modifier]:identifier
 * - Use colons (:) for hierarchy levels
 * - Use hyphens (-) for compound words within a level
 */

export const CACHE_KEYS = {
  // File storage cache keys
  FILE: {
    SINGLE: 'service:file',
    HISTORY: 'service:file-history',
    BY_USER: 'service:files:user',
  },
  
  // Storage provider cache keys (if needed)
  PROVIDER: {
    STATUS: 'service:storage:provider-status',
  },
} as const

/**
 * Helper functions to generate cache keys with context
 */
export const generateCacheKey = {
  fileById: (id: string, userId?: string) => `${CACHE_KEYS.FILE.SINGLE}:${id}:${userId || 'public'}`,
  fileHistory: (userId: string, params: any) => `${CACHE_KEYS.FILE.HISTORY}:${userId}:${JSON.stringify(params)}`,
  filesByUser: (userId: string) => `${CACHE_KEYS.FILE.BY_USER}:${userId}`,
}