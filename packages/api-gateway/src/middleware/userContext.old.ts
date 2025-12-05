/**
 * User Context Middleware for API Gateway
 *
 * This middleware enriches the request context with user-specific data
 * at the API Gateway level, following the Netflix/Amazon pattern where
 * the gateway enriches context once for all downstream services.
 *
 * Industry Standard Pattern:
 * - Gateway validates JWT (already done by authMiddleware)
 * - Gateway enriches with user profile (this middleware)
 * - Gateway adds headers for downstream services
 * - Services receive pre-enriched context
 */

import type { ICacheService } from '@pika/redis'
import { logger, UserServiceClient } from '@pika/shared'
import {
  getUserLanguage,
  USER_CONTEXT_CACHE_KEYS,
  UserContext,
} from '@pika/types'
import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Options for userContext middleware
 */
export interface UserContextMiddlewareOptions {
  userServiceClient?: UserServiceClient
  cacheService?: ICacheService
  loadProfile?: boolean // Whether to eagerly load profile
  loadSettings?: boolean // Whether to eagerly load settings
  userServiceUrl?: string // URL for user service if not using client
}

/**
 * Extend Express Request to include userContext
 */
declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext
    }
  }
}

/**
 * Middleware that builds UserContext from authenticated user
 * Should be used after authMiddleware
 */
export function userContextMiddleware(
  options: UserContextMiddlewareOptions = {},
): RequestHandler {
  const { cacheService, loadProfile = true, loadSettings = true } = options

  // Initialize UserServiceClient if not provided
  const userServiceClient = options.userServiceClient || new UserServiceClient()

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip if no authenticated user (from authMiddleware)
      if (!req.user) {
        return next()
      }

      // Build base context from JWT claims (always available)
      const context: UserContext = {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        permissions: req.user.permissions || [],
        sessionId: req.headers['x-session-id'] as string,
        deviceId: req.headers['x-device-id'] as string,
        ipAddress: req.ip || req.socket?.remoteAddress,
      }

      // Load profile if enabled
      if (loadProfile) {
        try {
          // Try cache first
          const profileKey = USER_CONTEXT_CACHE_KEYS.PROFILE(context.userId)

          let profile: typeof context.profile = undefined

          if (cacheService) {
            const cached =
              await cacheService.get<NonNullable<typeof context.profile>>(
                profileKey,
              )

            profile = cached || undefined
          }

          if (!profile) {
            // Load from User Service via client
            try {
              const user = await userServiceClient.getUser(context.userId)

              if (user) {
                profile = {
                  firstName: user.firstName,
                  lastName: user.lastName,
                  status: user.status as any, // UserDomain has string type, UserContext expects UserStatus enum
                  emailVerified: user.emailVerified,
                  phoneNumber: user.phoneNumber || undefined, // Convert null to undefined
                  phoneVerified: user.phoneVerified,
                  avatarUrl: user.avatarUrl || undefined, // Convert null to undefined
                  preferredLanguage: user.preferredLanguage || undefined, // Convert null to undefined
                  primaryBusinessId: user.primaryBusinessId || undefined, // Convert null to undefined
                }

                // Cache for 5 minutes (gateway cache should be shorter)
                if (cacheService) {
                  await cacheService.set(profileKey, profile, 300)
                }
              }
            } catch (error) {
              // User service might be down, continue with JWT data only
              logger.debug('User service unavailable, using JWT data only', {
                userId: context.userId,
                error,
              })
            }
          }

          if (profile) {
            context.profile = profile
          }
        } catch (error) {
          logger.warn('Failed to load user profile', {
            userId: context.userId,
            error,
          })
        }
      }

      // Load settings if enabled
      if (loadSettings) {
        try {
          // Try cache first
          const settingsKey = USER_CONTEXT_CACHE_KEYS.SETTINGS(context.userId)

          let settings: typeof context.settings = undefined

          if (cacheService) {
            const cached =
              await cacheService.get<NonNullable<typeof context.settings>>(
                settingsKey,
              )

            settings = cached || undefined
          }

          if (!settings) {
            // Load from User Service via client
            try {
              const user = await userServiceClient.getUser(context.userId)

              if (user?.settings) {
                settings = user.settings

                // Cache for 5 minutes (gateway cache should be shorter)
                if (cacheService) {
                  await cacheService.set(settingsKey, settings, 300)
                }
              }
            } catch (error) {
              // User service might be down, continue without settings
              logger.debug('User service unavailable for settings, skipping', {
                userId: context.userId,
                error,
              })
            }
          }

          if (settings) {
            context.settings = settings
          }
        } catch (error) {
          logger.warn('Failed to load user settings', {
            userId: context.userId,
            error,
          })
        }
      }

      // Attach context to request
      req.userContext = context

      // Set useful headers for downstream services
      res.setHeader('X-User-Id', context.userId)
      res.setHeader('X-User-Role', context.role)
      res.setHeader('X-User-Email', context.email)

      // Set language header if available
      const language = getUserLanguage(context)

      res.setHeader('X-User-Language', language)

      // Set business header if available
      if (context.profile?.primaryBusinessId) {
        res.setHeader('X-Business-Id', context.profile.primaryBusinessId)
      }

      next()
    } catch (error) {
      // Context loading failure shouldn't break the request
      logger.error('Failed to build user context', {
        userId: req.user?.id,
        error,
      })
      next()
    }
  }
}

/**
 * Helper to get UserContext from request
 * Can be used in controllers
 */
export function getUserContext(req: Request): UserContext | undefined {
  return req.userContext
}

/**
 * Helper to require UserContext
 * Throws if context is not available
 */
export function requireUserContext(req: Request): UserContext {
  if (!req.userContext) {
    throw new Error('User context is required but not available')
  }

  return req.userContext
}
