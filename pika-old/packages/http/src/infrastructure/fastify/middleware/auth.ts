import '../../../types/fastify.js'

import { JwtTokenService, TokenValidationResult } from '@pika/auth'
import { NODE_ENV, SKIP_AUTH } from '@pika/environment'
import { logger, NotAuthenticatedError, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerAsyncHookHandler,
} from 'fastify'
import fp from 'fastify-plugin'

import { ApiTokenOptions } from '../../../domain/types/server.js'

/**
 * Map user roles to permissions for RBAC
 */
function mapRoleToPermissions(role: UserRole): string[] {
  switch (role) {
    case UserRole.ADMIN:
      return [
        // User management
        'users:read',
        'users:write',
        'users:delete',
        // Service management
        'services:read',
        'services:write',
        'services:delete',
        // Category management
        'categories:read',
        'categories:write',
        'categories:delete',
        // Campaign management
        'campaigns:read',
        'campaigns:write',
        'campaigns:delete',
        // Voucher management
        'vouchers:read',
        'vouchers:write',
        'vouchers:delete',
        // Notification management
        'notifications:read',
        'notifications:write',
        'notifications:publish',
        'notifications:delete',
        // Messaging/Conversation management
        'conversations:read',
        'conversations:write',
        'conversations:delete',
        'messages:read',
        'messages:write',
        'messages:delete',
        // Review management
        'reviews:read',
        'reviews:write',
        'reviews:delete',
        // Payment management
        'payments:read',
        'payments:write',
        'payments:refund',
        // Reports and analytics
        'reports:read',
        'analytics:read',
        // Admin specific
        'admin:dashboard',
        'admin:settings',
        'admin:users',
        'admin:system',
        // Redemption management
        'redemptions:read',
        'redemptions:write',
        'redemptions:delete',
        // PDF/Voucher Book management
        'pdf:read',
        'pdf:write',
        'pdf:delete',
      ]
    case UserRole.PROVIDER:
      return [
        // Service management (own services)
        'services:read',
        'services:write',
        'services:delete:own',
        // Campaign management (own campaigns)
        'campaigns:read',
        'campaigns:write',
        'campaigns:delete:own',
        // Voucher management (for their services)
        'vouchers:read:own',
        'vouchers:write:own',
        'vouchers:update:status', // Can update status of vouchers for their services
        // Category access (read-only)
        'categories:read',
        // User profile (own)
        'users:read:own',
        'users:write:own',
        // Notifications (own)
        'notifications:read:own',
        'notifications:write:own',
        // Messaging (with customers)
        'conversations:read:own',
        'conversations:write:own',
        'messages:read:own',
        'messages:write:own',
        // Reviews (read reviews for their services)
        'reviews:read:own',
        'reviews:reply', // Can reply to reviews
        // Basic analytics for their services
        'analytics:read:own',
        'reports:read:own',
        // Redemption management (own)
        'redemptions:read:own',
        'redemptions:write:own',
        'redemptions:delete:own',
        // PDF/Voucher Book management (own)
        'pdf:read',
        'pdf:write',
      ]
    case UserRole.CUSTOMER:
      return [
        // Browse services and categories
        'services:read',
        'categories:read',
        // Voucher management (own vouchers)
        'vouchers:read:own',
        'vouchers:write',
        'vouchers:delete:own',
        // User profile (own)
        'users:read:own',
        'users:write:own',
        // Notifications (own)
        'notifications:read:own',
        'notifications:write:own',
        // Messaging (with service providers)
        'conversations:read:own',
        'conversations:write:own',
        'messages:read:own',
        'messages:write:own',
        // Reviews (can write reviews for services they've used)
        'reviews:write:own',
        'reviews:read', // Can read all reviews
        // Payments (own)
        'payments:read:own',
        'payments:write:own',
        // Redemption management (own)
        'redemptions:read:own',
        'redemptions:write:own',
        'redemptions:delete:own',
      ]
    default:
      return []
  }
}

/**
 * Enhanced API token authentication plugin for Fastify.
 * Delegates JWT token validation to @pika/auth service (single source of truth).
 * Provides correlation IDs, security headers, and standardized user context.
 *
 * This middleware is now a thin wrapper that:
 * - Uses @pika/auth JwtTokenService for all JWT operations
 * - Adds correlation IDs for request tracing
 * - Injects security headers
 * - Enriches requests with user context for downstream services
 */
export const fastifyAuth = fp(
  async function authPlugin(
    fastify: FastifyInstance,
    options: ApiTokenOptions,
  ) {
    const { secret, headerName = 'Authorization', excludePaths = [] } = options

    // Initialize JWT service from @pika/auth (single source of truth)
    // Redis integration will be provided from the calling service
    const jwtService = new JwtTokenService(
      secret,
      '15m', // access token expiry
      '7d', // refresh token expiry
      'pika-api',
      'pika-app',
      options.cacheService, // Optional Redis service for token blacklisting
    )

    // Decorate request with user and correlation ID properties
    fastify.decorateRequest('user', undefined)
    fastify.decorateRequest('correlationId', undefined)

    // Pre-handler hook for authentication and request enrichment
    fastify.addHook(
      'preHandler',
      async (request: FastifyRequest, reply: FastifyReply) => {
        // Add correlation ID for request tracing
        addCorrelationId(request)

        // Skip authentication for testing when explicitly requested
        if (NODE_ENV === 'test' && SKIP_AUTH === true) {
          addSecurityHeaders(reply)

          return
        }

        // Skip authentication for excluded paths
        if (isExcludedPath(request.url, excludePaths)) {
          addSecurityHeaders(reply)

          return
        }

        // Skip JWT authentication if this is a service-to-service request
        // Service auth will be handled by requireServiceAuth() middleware
        const serviceApiKey = request.headers['x-api-key'] as string
        const serviceName = request.headers['x-service-name'] as string

        if (serviceApiKey && serviceName) {
          addSecurityHeaders(reply)

          return
        }

        // Extract and validate authorization header
        const authHeader = request.headers[headerName.toLowerCase()]

        if (!authHeader || typeof authHeader !== 'string') {
          logger.warn('Missing authorization header', {
            correlationId: request.correlationId,
            url: request.url,
            method: request.method,
          })

          throw new NotAuthenticatedError(
            'Authentication required. Please provide a valid Bearer token.',
            {
              source: 'fastifyAuth',
              correlationId: request.correlationId,
            },
          )
        }

        // Validate Bearer token format
        const token = extractBearerToken(authHeader)

        if (!token) {
          logger.warn('Invalid authorization header format', {
            correlationId: request.correlationId,
            authHeader: authHeader.substring(0, 20) + '...', // Log partial header for debugging
          })

          throw new NotAuthenticatedError(
            'Invalid token format. Please provide a valid Bearer token.',
            {
              source: 'fastifyAuth',
              correlationId: request.correlationId,
            },
          )
        }

        // Delegate token verification to @pika/auth service (single source of truth)
        const validation: TokenValidationResult = await jwtService.verifyToken(
          token,
          'access',
        )

        if (!validation.isValid || !validation.payload) {
          logger.warn('Token validation failed', {
            correlationId: request.correlationId,
            error: validation.error,
          })

          throw new NotAuthenticatedError(
            validation.error || 'Invalid token. Please sign in again.',
            {
              source: 'fastifyAuth',
              correlationId: request.correlationId,
            },
          )
        }

        const { payload } = validation

        // Map role to permissions for RBAC
        const permissions = mapRoleToPermissions(payload.role)

        // Create user context matching FastifyRequest.user interface (for backward compatibility)
        const user = {
          id: payload.userId,
          email: payload.email,
          role: payload.role,
          type: payload.role?.toUpperCase(),
          permissions,
          sessionId: undefined, // Will be added when session management is implemented
          issuedAt: payload.iat ? new Date(payload.iat * 1000) : undefined,
          expiresAt: payload.exp ? new Date(payload.exp * 1000) : undefined,
        }

        // Attach user context to request
        request.user = user

        // Add user context headers for downstream services
        addUserContextHeaders(request, user)

        logger.debug('Authentication successful', {
          correlationId: request.correlationId,
          userId: user.id,
          email: user.email,
          role: user.role,
        })

        // Add security headers
        addSecurityHeaders(reply)
      },
    )

    // Response hook to add correlation ID to response headers
    fastify.addHook(
      'onSend',
      async (request: FastifyRequest, reply: FastifyReply, payload) => {
        if (request.correlationId) {
          reply.header('X-Correlation-ID', request.correlationId)
        }

        return payload
      },
    )
  },
  {
    name: 'pika-auth-plugin',
  },
)

/**
 * Check if the current path should be excluded from authentication
 */
function isExcludedPath(url: string, excludePaths: string[]): boolean {
  return excludePaths.some((pattern) => {
    if (pattern === url) return true
    if (pattern.endsWith('*') && url.startsWith(pattern.slice(0, -1)))
      return true

    return false
  })
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string): string | null {
  const [scheme, token] = authHeader.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return null
  }

  return token
}

/**
 * Add correlation ID for request tracing
 */
function addCorrelationId(request: FastifyRequest): void {
  // Use existing correlation ID from headers or generate new one
  const correlationId =
    (request.headers['x-correlation-id'] as string) ||
    `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`

  request.correlationId = correlationId
}

/**
 * Add user context headers for downstream services
 */
function addUserContextHeaders(
  request: FastifyRequest,
  user: NonNullable<FastifyRequest['user']>,
): void {
  // Add user context headers that backend services can use
  request.headers['x-user-id'] = user.id
  request.headers['x-user-email'] = user.email
  request.headers['x-user-role'] = user.role

  if (user.sessionId) {
    request.headers['x-session-id'] = user.sessionId
  }

  if (request.correlationId) {
    request.headers['x-correlation-id'] = request.correlationId
  }
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(reply: FastifyReply): void {
  reply.headers({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })
}

/**
 * Authorization helper functions for route protection
 */

/**
 * Require admin role
 */
export function requireAdmin(): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest) => {
    if (!request.user) {
      throw new NotAuthenticatedError('Authentication required')
    }

    if (request.user.role !== UserRole.ADMIN) {
      throw new NotAuthorizedError('Admin access required')
    }
  }
}

/**
 * Require service provider role
 */
export function requireProvider(): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest) => {
    if (!request.user) {
      throw new NotAuthenticatedError('Authentication required')
    }

    if (request.user.role !== UserRole.PROVIDER) {
      throw new NotAuthorizedError('Service provider access required')
    }
  }
}

/**
 * Require customer role
 */
export function requireCustomer(): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest) => {
    if (!request.user) {
      throw new NotAuthenticatedError('Authentication required')
    }

    if (request.user.role !== UserRole.CUSTOMER) {
      throw new NotAuthorizedError('Customer access required')
    }
  }
}

/**
 * Require specific permissions
 */
export function requirePermissions(
  ...permissions: string[]
): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest) => {
    if (!request.user) {
      throw new NotAuthenticatedError('Authentication required')
    }

    const userPermissions = request.user.permissions || []
    const hasAllPermissions = permissions.every((permission) =>
      userPermissions.includes(permission),
    )

    if (!hasAllPermissions) {
      throw new NotAuthorizedError(
        `Missing required permissions: ${permissions.join(', ')}`,
      )
    }
  }
}
