import { ErrorFactory } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { FastifyRequest } from 'fastify'

/**
 * User context extracted from request headers
 * This is the standard pattern for passing user context in microservices
 */
export interface UserContext {
  userId: string
  email: string
  role: UserRole
  correlationId?: string
  sessionId?: string
}

/**
 * Request context helper for extracting user information from headers
 * Following the "context propagation" pattern used in distributed systems
 *
 * @example
 * ```typescript
 * // In your controller:
 * const context = RequestContext.fromHeaders(request)
 * const result = await handler.execute(dto, context)
 * ```
 */
export class RequestContext {
  /**
   * Extract user context from request headers
   * These headers are set by the API Gateway after authentication
   */
  static fromHeaders(request: FastifyRequest): UserContext {
    const userId = request.headers['x-user-id'] as string
    const email = request.headers['x-user-email'] as string
    const role = request.headers['x-user-role'] as UserRole
    const correlationId = request.headers['x-correlation-id'] as
      | string
      | undefined
    const sessionId = request.headers['x-session-id'] as string | undefined

    if (!userId || !email || !role) {
      throw ErrorFactory.unauthorized(
        'Authentication required - missing user context headers',
        {
          suggestion: 'Include a valid JWT token in the Authorization header',
          metadata: {
            missingHeaders: {
              userId: !userId,
              email: !email,
              role: !role,
            },
          },
        },
      )
    }

    return {
      userId,
      email,
      role,
      correlationId,
      sessionId,
    }
  }

  /**
   * Check if the user has a specific role
   */
  static hasRole(context: UserContext, role: UserRole): boolean {
    return context.role === role
  }

  /**
   * Check if the user is an admin
   */
  static isAdmin(context: UserContext): boolean {
    return context.role === UserRole.ADMIN
  }

  /**
   * Check if the user is a service provider
   */
  static isProvider(context: UserContext): boolean {
    return context.role === UserRole.PROVIDER
  }

  /**
   * Check if the user is a customer
   */
  static isCustomer(context: UserContext): boolean {
    return context.role === UserRole.CUSTOMER
  }

  /**
   * For services where userId === providerId by design
   */
  static getProviderId(context: UserContext): string {
    if (!this.isProvider(context)) {
      throw new Error('User is not a service provider')
    }

    return context.userId
  }

  /**
   * For services where userId === customerId by design
   */
  static getCustomerId(context: UserContext): string {
    if (!this.isCustomer(context)) {
      throw new Error('User is not a customer')
    }

    return context.userId
  }
}
