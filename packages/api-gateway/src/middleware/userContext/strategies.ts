/**
 * User Context Strategies
 *
 * Different strategies for obtaining user context based on deployment mode
 */

import type { Request, Response } from 'express'
import { UserContext, USER_CONTEXT_CACHE_KEYS, UserStatus } from '@pika/types'
import { logger } from '@pika/shared'
import type { UserServiceClient } from '@pika/shared'
import type { ICacheService } from '@pika/redis'
import { CONTEXT_HEADERS } from './types.js'

/**
 * Parse user context from request headers (set by gateway)
 */
export function parseContextFromHeaders(
  req: Request,
): Partial<UserContext> | null {
  const userId = req.headers[CONTEXT_HEADERS.USER_ID] as string

  if (!userId) return null

  const context: Partial<UserContext> = {
    userId,
    email: req.headers[CONTEXT_HEADERS.USER_EMAIL] as string,
    role: req.headers[CONTEXT_HEADERS.USER_ROLE] as any,
    sessionId: req.headers[CONTEXT_HEADERS.SESSION_ID] as string,
    deviceId: req.headers[CONTEXT_HEADERS.DEVICE_ID] as string,
    ipAddress: req.ip || req.socket?.remoteAddress,
  }

  // Parse permissions (comma-separated)
  const permissions = req.headers[CONTEXT_HEADERS.USER_PERMISSIONS] as string
  if (permissions) {
    context.permissions = permissions.split(',').filter(Boolean)
  } else {
    context.permissions = []
  }

  // Parse business context
  const businessId = req.headers[CONTEXT_HEADERS.BUSINESS_ID] as string
  const language = req.headers[CONTEXT_HEADERS.USER_LANGUAGE] as string
  const status = req.headers[CONTEXT_HEADERS.USER_STATUS] as string

  if (businessId || language || status) {
    context.profile = {
      firstName: '', // Not passed in headers
      lastName: '', // Not passed in headers
      status: (status as UserStatus) || UserStatus.ACTIVE,
      emailVerified: true, // Assume verified if they're authenticated
      phoneVerified: false,
      primaryBusinessId: businessId || undefined,
      preferredLanguage: language || undefined,
    }
  }

  return context
}

/**
 * Set headers for downstream services
 */
export function setContextHeaders(res: Response, context: UserContext): void {
  if (res.headersSent) {
    logger.warn('Cannot set user context headers, response already sent')
    return
  }

  // Essential headers
  res.setHeader(CONTEXT_HEADERS.USER_ID, context.userId)
  res.setHeader(CONTEXT_HEADERS.USER_ROLE, context.role)
  res.setHeader(CONTEXT_HEADERS.USER_EMAIL, context.email)

  // Permissions - JWT already has these, but let's be explicit
  if (context.permissions?.length > 0) {
    res.setHeader(
      CONTEXT_HEADERS.USER_PERMISSIONS,
      context.permissions.join(','),
    )
  }

  // Profile data
  if (context.profile) {
    if (context.profile.primaryBusinessId) {
      res.setHeader(
        CONTEXT_HEADERS.BUSINESS_ID,
        context.profile.primaryBusinessId,
      )
    }
    if (context.profile.preferredLanguage) {
      res.setHeader(
        CONTEXT_HEADERS.USER_LANGUAGE,
        context.profile.preferredLanguage,
      )
    }
    if (context.profile.status) {
      res.setHeader(CONTEXT_HEADERS.USER_STATUS, context.profile.status)
    }
  }

  // Session tracking
  if (context.sessionId) {
    res.setHeader(CONTEXT_HEADERS.SESSION_ID, context.sessionId)
  }
  if (context.deviceId) {
    res.setHeader(CONTEXT_HEADERS.DEVICE_ID, context.deviceId)
  }
}

/**
 * Fetch user context from User Service with caching
 */
export async function fetchUserContext(
  userId: string,
  userServiceClient: UserServiceClient,
  cacheService?: ICacheService,
  cacheTTL: number = 300,
): Promise<UserContext | null> {
  const startTime = Date.now()

  try {
    // Check cache first
    if (cacheService) {
      const cacheKey = USER_CONTEXT_CACHE_KEYS.PROFILE(userId)
      const cached = await cacheService.get<UserContext>(cacheKey)
      if (cached) {
        logger.debug('User context cache hit', {
          userId,
          latency: Date.now() - startTime,
        })
        return cached
      }
    }

    // Fetch from User Service
    const user = await userServiceClient.getUser(userId)
    if (!user) {
      logger.warn('User not found', { userId })
      return null
    }

    // Build full context
    // Note: Permissions come from JWT, not from user profile
    // We're not Microsoft with a separate permissions service!
    const context: UserContext = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      permissions: [], // Will be filled from JWT
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
    if (cacheService && cacheTTL > 0) {
      const cacheKey = USER_CONTEXT_CACHE_KEYS.PROFILE(userId)
      await cacheService.set(cacheKey, context, cacheTTL).catch((error) => {
        logger.warn('Failed to cache user context', { userId, error })
      })
    }

    logger.debug('User context fetched', {
      userId,
      hasProfile: !!context.profile,
      hasSettings: !!context.settings,
      latency: Date.now() - startTime,
    })

    return context
  } catch (error) {
    logger.error('Failed to fetch user context', {
      userId,
      error,
      latency: Date.now() - startTime,
    })
    return null
  }
}

/**
 * Create context from JWT claims only
 */
export function createContextFromJWT(user: any): UserContext {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: user.permissions || [],
    // No profile or settings - just JWT data
  }
}
