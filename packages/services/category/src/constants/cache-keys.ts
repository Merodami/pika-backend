/**
 * Cache key constants for category service
 *
 * Pattern: service:entity[-modifier]:identifier
 * - Use colons (:) for hierarchy levels
 * - Use hyphens (-) for compound words within a level
 */

export const CACHE_KEYS = {
  // Category entity cache keys
  CATEGORY: {
    LIST: 'service:categories',
    SINGLE: 'service:category',
    BY_IDS: 'service:categories:bulk',
    HIERARCHY: 'service:category:hierarchy',
    PATH: 'service:category:path',
  },

  // Admin cache keys
  ADMIN: {
    LIST: 'service:admin:categories',
    SINGLE: 'service:admin:category',
    HIERARCHY: 'service:admin:category:hierarchy',
  },

  // Internal service cache keys
  INTERNAL: {
    LIST: 'service:internal:categories',
    SINGLE: 'service:internal:category',
    BULK: 'service:internal:categories:bulk',
    ACTIVE: 'service:internal:categories:active',
    HIERARCHY: 'service:internal:categories:hierarchy',
  },
} as const

/**
 * Helper functions to generate cache keys with context
 */
export const generateCacheKey = {
  categoryById: (id: string) => `${CACHE_KEYS.CATEGORY.SINGLE}:${id}`,
  categoriesByIds: (ids: string[]) =>
    `${CACHE_KEYS.CATEGORY.BY_IDS}:${JSON.stringify(ids.sort())}`,
  categoryHierarchy: (rootId?: string) =>
    `${CACHE_KEYS.CATEGORY.HIERARCHY}:${rootId || 'all'}`,
  categoryPath: (id: string) => `${CACHE_KEYS.CATEGORY.PATH}:${id}`,
  categoryList: (params: any) =>
    `${CACHE_KEYS.CATEGORY.LIST}:${JSON.stringify(params)}`,
}
