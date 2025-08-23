import { createHash } from 'crypto'
import stringify from 'fast-json-stable-stringify'

/**
 * Contextual Cache Key Generator
 * 
 * Generates cache keys that include contextual parameters like language, user, role, etc.
 * Follows industry standards for multi-dimensional caching.
 * 
 * Key Format: prefix:methodName:paramsHash:language:userContext:roleContext:version
 * Example: "business:getBusinessById:a1b2c3d4:es:user:123:admin:v1"
 */

export interface CacheContext {
  searchParams?: Record<string, unknown>
  language?: string
  userId?: string  
  userRole?: string
  tenantId?: string
}

/**
 * Generate a contextual cache key following parameter conventions
 * 
 * Parameter positions:
 * - Position 0: Search/filter parameters  
 * - Position 1: Language/locale
 * - Position 2: User ID (if user-specific)
 * - Position 3: User role (if permission-sensitive)  
 * - Position 4: Tenant ID (if multi-tenant)
 */
export function contextualKeyGenerator(
  prefix: string,
  methodName: string,
  args: unknown[]
): string {
  // Extract parameters by position (convention over configuration)
  const [searchParams, language, userId, userRole, tenantId] = args
  
  // Build hierarchical key components
  const components = [
    prefix,
    methodName,
    searchParams ? hashObject(searchParams, 12) : 'no-params',
    language || 'default',
    userId ? `user:${userId}` : 'guest',
    userRole || 'public',
    tenantId ? `tenant:${tenantId}` : undefined,
    'v1' // Version for cache invalidation
  ].filter(Boolean)
  
  return components.join(':')
}

/**
 * Hash an object to a short, deterministic string
 */
function hashObject(obj: any, length: number = 12): string {
  if (!obj || typeof obj !== 'object') {
    return 'empty'
  }
  
  const hash = createHash('sha256')
    .update(stringify(obj))
    .digest('hex')
  
  return hash.substring(0, length)
}

/**
 * Extract context from method arguments for debugging/logging
 */
export function extractCacheContext(args: unknown[]): CacheContext {
  const [searchParams, language, userId, userRole, tenantId] = args
  
  return {
    searchParams: searchParams as Record<string, unknown>,
    language: language as string,
    userId: userId as string,
    userRole: userRole as string, 
    tenantId: tenantId as string,
  }
}