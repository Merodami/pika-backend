import { SERVICE_API_KEY } from '@pika/environment'
import { logger, NotAuthenticatedError } from '@pika/shared'
import { FastifyRequest, preHandlerAsyncHookHandler } from 'fastify'

/**
 * Service-to-Service Authentication Middleware
 *
 * This middleware authenticates internal service requests using API keys.
 * It follows the principle of least privilege and is only used for internal endpoints.
 */

/**
 * Validates service API key from request headers
 */
export function validateServiceApiKey(apiKey: string | undefined): boolean {
  if (!apiKey || !SERVICE_API_KEY) {
    return false
  }

  // In production, you might want to support multiple API keys
  // or use a more sophisticated validation mechanism
  return apiKey === SERVICE_API_KEY
}

/**
 * Extracts service context from authenticated service request
 */
export interface ServiceAuthContext {
  serviceId: string
  serviceName: string
  isInternalService: boolean
}

/**
 * Middleware to require service authentication
 * Used for internal service-to-service endpoints
 */
export function requireServiceAuth(): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest) => {
    const apiKey = request.headers['x-api-key'] as string
    const serviceName = request.headers['x-service-name'] as string
    const serviceId = request.headers['x-service-id'] as string

    // Validate API key
    if (!validateServiceApiKey(apiKey)) {
      logger.warn('Invalid service API key attempted', {
        serviceName,
        serviceId,
        ip: request.ip,
        url: request.url,
      })

      throw new NotAuthenticatedError(
        'Invalid or missing service authentication',
        {
          source: 'serviceAuth.middleware',
          correlationId: request.id,
        },
      )
    }

    // Validate service identification
    if (!serviceName || !serviceId) {
      throw new NotAuthenticatedError('Service identification required', {
        source: 'serviceAuth.middleware',
        correlationId: request.id,
      })
    }

    // Add service context to request
    const serviceContext: ServiceAuthContext = {
      serviceId,
      serviceName,
      isInternalService: true,
    }

    // Store in request context
    request.serviceAuth = serviceContext

    logger.debug('Service authenticated', {
      serviceName,
      serviceId,
      endpoint: request.url,
    })
  }
}

/**
 * Middleware to allow both user and service authentication
 * Useful for endpoints that can be called by both users and services
 */
export function allowServiceOrUserAuth(): preHandlerAsyncHookHandler {
  return async (request: FastifyRequest) => {
    const apiKey = request.headers['x-api-key'] as string
    const authHeader = request.headers.authorization

    // Check if it's a service request
    if (apiKey && validateServiceApiKey(apiKey)) {
      // Handle as service auth
      const serviceName = request.headers['x-service-name'] as string
      const serviceId = request.headers['x-service-id'] as string

      if (serviceName && serviceId) {
        request.serviceAuth = {
          serviceId,
          serviceName,
          isInternalService: true,
        }

        return // Service authenticated
      }
    }

    // If not a valid service request, it must have user auth
    if (!authHeader) {
      throw new NotAuthenticatedError('Authentication required', {
        source: 'serviceAuth.middleware',
        correlationId: request.id,
      })
    }

    // Let the regular auth middleware handle user authentication
  }
}

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    serviceAuth?: ServiceAuthContext
  }
}
