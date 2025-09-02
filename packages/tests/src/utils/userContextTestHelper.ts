/**
 * UserContext Test Helper
 *
 * Utilities for testing with UserContext middleware in integration tests
 */

import type { UserContext } from '@pika/types'
import { UserRole, UserStatus } from '@pika/types'
import type { Express, NextFunction, Request, Response } from 'express'

// Copy of UserContextStrategy enum to avoid circular dependency
export enum UserContextStrategy {
  ENRICH = 'enrich',
  CONSUME = 'consume',
  DIRECT = 'direct',
  HYBRID = 'hybrid',
  TEST = 'test',
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      userContext?: UserContext
    }
  }
}

/**
 * Mock UserContext for testing
 */
export function createMockUserContext(
  overrides?: Partial<UserContext>,
): UserContext {
  return {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: UserRole.CUSTOMER,
    permissions: ['read:profile', 'write:profile'],
    profile: {
      firstName: 'Test',
      lastName: 'User',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      phoneVerified: false,
      preferredLanguage: 'en',
      ...overrides?.profile,
    },
    settings: {},
    ...overrides,
  }
}

/**
 * Add UserContext middleware for testing
 * This simulates what the API Gateway does
 */
export function addTestUserContextMiddleware(
  app: Express,
  strategy: UserContextStrategy = UserContextStrategy.TEST,
  testData?: Partial<UserContext>,
) {
  // Import dynamically to avoid circular dependencies
  const {
    userContextMiddleware,
  } = require('@pika/api-gateway/middleware/userContext')

  app.use(
    userContextMiddleware({
      strategy,
      testData: testData || createMockUserContext(),
      fallbackToJWT: true,
    }),
  )
}

/**
 * Mock UserContext middleware that directly sets context
 * Use this for simple unit tests
 */
export function mockUserContextMiddleware(context: UserContext) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.userContext = context

    // Also set headers like the real middleware would
    if (!res.headersSent) {
      res.setHeader('x-user-id', context.userId)
      res.setHeader('x-user-role', context.role)
      res.setHeader('x-user-email', context.email)
      if (context.permissions?.length > 0) {
        res.setHeader('x-user-permissions', context.permissions.join(','))
      }
      if (context.profile?.primaryBusinessId) {
        res.setHeader('x-business-id', context.profile.primaryBusinessId)
      }
      if (context.profile?.preferredLanguage) {
        res.setHeader('x-user-language', context.profile.preferredLanguage)
      }
    }

    next()
  }
}

/**
 * Test helper to verify UserContext in requests
 */

export function expectUserContext(req: Request): UserContext {
  if (!req.userContext) {
    throw new Error(
      'UserContext not found in request. Ensure userContextMiddleware is configured.',
    )
  }
  return req.userContext
}

/**
 * Headers that would be set by UserContext middleware
 */
export function getUserContextHeaders(
  context: UserContext,
): Record<string, string> {
  const headers: Record<string, string> = {
    'x-user-id': context.userId,
    'x-user-role': context.role,
    'x-user-email': context.email,
  }

  if (context.permissions?.length > 0) {
    headers['x-user-permissions'] = context.permissions.join(',')
  }

  if (context.profile?.primaryBusinessId) {
    headers['x-business-id'] = context.profile.primaryBusinessId
  }

  if (context.profile?.preferredLanguage) {
    headers['x-user-language'] = context.profile.preferredLanguage
  }

  if (context.profile?.status) {
    headers['x-user-status'] = context.profile.status
  }

  return headers
}

/**
 * Add UserContext headers to supertest request
 * Use this when testing services that expect headers from API Gateway
 */
export function withUserContextHeaders(
  request: any, // supertest request
  context: UserContext,
) {
  const headers = getUserContextHeaders(context)

  Object.entries(headers).forEach(([key, value]) => {
    request.set(key, value)
  })

  return request
}
