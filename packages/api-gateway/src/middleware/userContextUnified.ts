/**
 * Unified User Context Middleware
 *
 * Provides consistent UserContext interface across all deployment modes:
 * - Microservices: Enriches at gateway, consumes at services
 * - Embedded: Direct database access
 * - Testing: Mock data
 *
 * This ensures code portability and consistency regardless of deployment.
 */

import {
  UserContext,
  USER_CONTEXT_CACHE_KEYS,
  getUserLanguage,
  UserStatus,
} from '@pika/types'
import { logger, UserServiceClient } from '@pika/shared'
import type { ICacheService } from '@pika/redis'
import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Strategy for obtaining user context
 */
export enum UserContextStrategy {
  /**
   * Gateway mode: Fetch from User Service and enrich headers
   * Used by: API Gateway
   */
  ENRICH = 'enrich',

  /**
   * Service mode: Read from headers, fallback to fetch
   * Used by: Microservices behind gateway
   */
  CONSUME = 'consume',

  /**
   * Direct mode: Always fetch from database
   * Used by: Embedded deployments (Vercel)
   */
  DIRECT = 'direct',

  /**
   * Hybrid mode: Read from headers if available, otherwise fetch
   * Used by: Services that can run standalone or behind gateway
   */
  HYBRID = 'hybrid',

  /**
   * Test mode: Use mock data
   * Used by: Unit tests
   */
  TEST = 'test',
}

/**
 * Unified options for all deployment modes
 */
export interface UnifiedUserContextOptions {
  strategy: UserContextStrategy
  userServiceClient?: UserServiceClient
  cacheService?: ICacheService
  cacheTTL?: number
  testData?: Partial<UserContext> // For testing
  fallbackToJWT?: boolean // If enrichment fails
}

/**
 * Get user context from request headers (set by gateway)
 */
function getUserContextFromHeaders(req: Request): Partial<UserContext> | null {
  const userId = req.headers['x-user-id'] as string
  const userRole = req.headers['x-user-role'] as string
  const userEmail = req.headers['x-user-email'] as string

  if (!userId) return null

  const context: Partial<UserContext> = {
    userId,
    email: userEmail,
    role: userRole as any,
  }

  // Parse permissions from header
  const permissions = req.headers['x-user-permissions'] as string
  if (permissions) {
    context.permissions = permissions.split(',')
  }

  // Parse business ID
  const businessId = req.headers['x-business-id'] as string
  if (businessId) {
    context.profile = {
      ...context.profile,
      primaryBusinessId: businessId,
    } as any
  }

  // Parse language
  const language = req.headers['x-user-language'] as string
  if (language && context.profile) {
    context.profile.preferredLanguage = language
  }

  return context
}

/**
 * Fetch user context from User Service
 */
async function fetchUserContext(
  userId: string,
  userServiceClient: UserServiceClient,
  cacheService?: ICacheService,
  cacheTTL?: number,
): Promise<UserContext | null> {
  try {
    // Check cache first
    if (cacheService) {
      const cacheKey = USER_CONTEXT_CACHE_KEYS.PROFILE(userId)
      const cached = await cacheService.get<UserContext>(cacheKey)
      if (cached) return cached
    }

    // Fetch from User Service
    const user = await userServiceClient.getUser(userId)
    if (!user) return null

    // Build full context
    const context: UserContext = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      permissions: [], // TODO: Load from permissions service
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status as any,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber || undefined,
        phoneVerified: user.phoneVerified,
        avatarUrl: user.avatarUrl || undefined,
        preferredLanguage: user.preferredLanguage || undefined,
        primaryBusinessId: user.primaryBusinessId || undefined,
      },
      settings: user.settings || undefined,
    }

    // Cache the result
    if (cacheService && cacheTTL) {
      const cacheKey = USER_CONTEXT_CACHE_KEYS.PROFILE(userId)
      await cacheService.set(cacheKey, context, cacheTTL)
    }

    return context
  } catch (error) {
    logger.error('Failed to fetch user context', { userId, error })
    return null
  }
}

/**
 * Set headers for downstream services
 */
function setDownstreamHeaders(res: Response, context: UserContext): void {
  if (res.headersSent) return

  res.setHeader('X-User-Id', context.userId)
  res.setHeader('X-User-Role', context.role)
  res.setHeader('X-User-Email', context.email)

  if (context.permissions?.length > 0) {
    res.setHeader('X-User-Permissions', context.permissions.join(','))
  }

  if (context.profile?.primaryBusinessId) {
    res.setHeader('X-Business-Id', context.profile.primaryBusinessId)
  }

  if (context.profile?.preferredLanguage) {
    res.setHeader('X-User-Language', context.profile.preferredLanguage)
  }
}

/**
 * Unified middleware implementation
 *
 * This is the KEY INSIGHT: Same interface, different strategies
 */
export function userContextMiddleware(
  options: UnifiedUserContextOptions,
): RequestHandler {
  const {
    strategy,
    userServiceClient,
    cacheService,
    cacheTTL = 300,
    testData,
    fallbackToJWT = true,
  } = options

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if no authenticated user
      if (!req.user && strategy !== UserContextStrategy.TEST) {
        return next()
      }

      let context: UserContext | null = null

      switch (strategy) {
        case UserContextStrategy.ENRICH:
          // Gateway: Fetch and enrich headers
          if (userServiceClient) {
            context = await fetchUserContext(
              req.user!.id,
              userServiceClient,
              cacheService,
              cacheTTL,
            )

            if (context) {
              setDownstreamHeaders(res, context)
            }
          }
          break

        case UserContextStrategy.CONSUME:
          // Service: Read from headers only
          const headerContext = getUserContextFromHeaders(req)
          if (headerContext && headerContext.userId) {
            context = headerContext as UserContext
          }
          break

        case UserContextStrategy.DIRECT:
          // Embedded: Always fetch directly
          if (userServiceClient && req.user) {
            context = await fetchUserContext(
              req.user.id,
              userServiceClient,
              cacheService,
              cacheTTL,
            )
          }
          break

        case UserContextStrategy.HYBRID:
          // Try headers first, then fetch
          const hybridContext = getUserContextFromHeaders(req)
          if (hybridContext && hybridContext.userId) {
            context = hybridContext as UserContext
          } else if (userServiceClient && req.user) {
            context = await fetchUserContext(
              req.user.id,
              userServiceClient,
              cacheService,
              cacheTTL,
            )
          }
          break

        case UserContextStrategy.TEST:
          // Test mode: Use provided test data
          context = {
            userId: 'test-user',
            email: 'test@example.com',
            role: 'customer' as any,
            permissions: [],
            ...testData,
          } as UserContext
          break
      }

      // Fallback to JWT data if no context
      if (!context && fallbackToJWT && req.user) {
        context = {
          userId: req.user.id,
          email: req.user.email,
          role: req.user.role,
          permissions: req.user.permissions || [],
        }
      }

      // Attach to request
      if (context) {
        req.userContext = context
      }

      next()
    } catch (error) {
      logger.error('Failed to process user context', {
        strategy,
        userId: req.user?.id,
        error,
      })

      // Don't break the request
      next()
    }
  }
}

/**
 * Helper to ensure user context exists
 * This is what services use to get context
 */
export function requireUserContext(req: Request): UserContext {
  if (!req.userContext) {
    // This should NEVER happen if middleware is configured correctly
    throw new Error(
      'UserContext not available. Ensure userContextMiddleware is configured.',
    )
  }
  return req.userContext
}

/**
 * Extend Express Request
 */
declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext
    }
  }
}
