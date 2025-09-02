/**
 * User Context Middleware
 *
 * Main middleware implementation that uses different strategies
 * based on deployment mode
 */

import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { UserContext } from '@pika/types'
import { UserRole } from '@pika/types'
import { logger } from '@pika/shared'
import { UserContextStrategy, type UserContextConfig } from './types.js'
import {
  parseContextFromHeaders,
  setContextHeaders,
  fetchUserContext,
  createContextFromJWT,
} from './strategies.js'

/**
 * Main middleware factory
 */
export function userContextMiddleware(
  config: UserContextConfig,
): RequestHandler {
  const {
    strategy,
    userServiceClient,
    cacheService,
    cacheTTL = 300,
    testData,
    fallbackToJWT = true,
    enableMetrics = false,
  } = config

  // Validate configuration
  if (strategy === UserContextStrategy.ENRICH && !userServiceClient) {
    throw new Error('UserServiceClient required for ENRICH strategy')
  }

  if (strategy === UserContextStrategy.DIRECT && !userServiceClient) {
    throw new Error('UserServiceClient required for DIRECT strategy')
  }

  logger.info('User context middleware configured', {
    strategy,
    cacheTTL,
    fallbackToJWT,
    hasCacheService: !!cacheService,
  })

  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = enableMetrics ? Date.now() : 0

    try {
      // Skip if no authenticated user (except in test mode)
      if (!req.user && strategy !== UserContextStrategy.TEST) {
        return next()
      }

      let context: UserContext | null = null

      switch (strategy) {
        case UserContextStrategy.ENRICH:
          // API Gateway: Fetch user data and enrich headers
          if (req.user && userServiceClient) {
            context = await fetchUserContext(
              req.user.id,
              userServiceClient,
              cacheService,
              cacheTTL,
            )

            // Merge JWT permissions with fetched context
            if (context && req.user.permissions) {
              context.permissions = req.user.permissions
            }

            // Set headers for downstream services
            if (context) {
              setContextHeaders(res, context)
            }
          }
          break

        case UserContextStrategy.CONSUME:
          // Microservice: Read from headers (set by gateway)
          const headerContext = parseContextFromHeaders(req)
          if (headerContext) {
            context = headerContext as UserContext
          }

          // Merge with JWT data if available
          if (context && req.user) {
            context.permissions = req.user.permissions || context.permissions
          }
          break

        case UserContextStrategy.DIRECT:
          // Embedded mode: Always fetch directly
          if (req.user && userServiceClient) {
            context = await fetchUserContext(
              req.user.id,
              userServiceClient,
              cacheService,
              cacheTTL,
            )

            // Merge JWT permissions
            if (context && req.user.permissions) {
              context.permissions = req.user.permissions
            }
          }
          break

        case UserContextStrategy.HYBRID:
          // Try headers first, fallback to fetch
          const hybridHeaderContext = parseContextFromHeaders(req)
          if (hybridHeaderContext) {
            context = hybridHeaderContext as UserContext
          }

          if (!context && req.user && userServiceClient) {
            context = await fetchUserContext(
              req.user.id,
              userServiceClient,
              cacheService,
              cacheTTL,
            )
          }

          // Merge JWT permissions
          if (context && req.user?.permissions) {
            context.permissions = req.user.permissions
          }
          break

        case UserContextStrategy.TEST:
          // Test mode: Use provided test data
          context = {
            userId: testData?.userId || 'test-user-123',
            email: testData?.email || 'test@example.com',
            role: testData?.role || UserRole.CUSTOMER,
            permissions: testData?.permissions || [],
            profile: testData?.profile,
            settings: testData?.settings,
            ...testData,
          }
          break

        default:
          logger.warn('Unknown user context strategy', { strategy })
      }

      // Fallback to JWT if no context
      if (!context && fallbackToJWT && req.user) {
        context = createContextFromJWT(req.user)
      }

      // Attach to request
      if (context) {
        req.userContext = context
      }

      // Log metrics if enabled
      if (enableMetrics && startTime) {
        const latency = Date.now() - startTime
        logger.debug('User context middleware completed', {
          strategy,
          userId: context?.userId,
          hasContext: !!context,
          hasProfile: !!context?.profile,
          hasSettings: !!context?.settings,
          latency,
        })
      }

      next()
    } catch (error) {
      logger.error('User context middleware error', {
        strategy,
        userId: req.user?.id,
        error,
      })

      // Don't break the request - continue with basic JWT context
      if (fallbackToJWT && req.user) {
        req.userContext = createContextFromJWT(req.user)
      }

      next()
    }
  }
}

/**
 * Helper to get user context from request
 */
export function getUserContext(req: Request) {
  return req.userContext
}

/**
 * Helper to require user context (throws if missing)
 */
export function requireUserContext(req: Request) {
  if (!req.userContext) {
    throw new Error(
      'UserContext not available. Ensure userContextMiddleware is configured with the correct strategy.',
    )
  }
  return req.userContext
}
