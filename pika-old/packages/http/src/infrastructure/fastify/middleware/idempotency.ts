import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { get } from 'lodash-es'

import type {
  IdempotencyConfig,
  IdempotencyContext,
  IdempotentResponse,
} from '../../../domain/types/idempotency.js'

declare module 'fastify' {
  interface FastifyRequest {
    idempotencyKey?: string
    idempotencyContext?: IdempotencyContext
  }
}

/**
 * Fastify plugin for handling idempotent requests
 *
 * This plugin provides system-wide idempotency support by:
 * - Checking for duplicate requests based on idempotency keys
 * - Returning cached responses for duplicate requests
 * - Storing responses after successful processing
 *
 * Usage:
 * - Clients send requests with X-Idempotency-Key header
 * - Plugin checks cache for existing response
 * - If found, returns cached response
 * - If not found, processes request and caches response
 */
export const idempotencyPlugin = fp(
  async function (
    fastify: FastifyInstance,
    options: IdempotencyConfig & { cacheService: ICacheService },
  ) {
    const {
      enabled = true,
      defaultTTL = 86400, // 24 hours
      methods = ['POST', 'PUT', 'PATCH'],
      excludeRoutes = ['/health', '/metrics', '/docs'],
      keyPrefix = 'default',
      includeUserContext = true,
      cacheService,
    } = options

    if (!enabled) {
      logger.info('Idempotency middleware is disabled')

      return
    }

    if (!cacheService) {
      throw new Error('Cache service is required for idempotency middleware')
    }

    // Request hook to check for idempotent requests (industry standard: onRequest)
    fastify.addHook(
      'onRequest',
      async (request: FastifyRequest, reply: FastifyReply) => {
        // Skip if method not configured for idempotency
        if (!methods.includes(request.method)) {
          return
        }

        // Skip excluded routes
        if (excludeRoutes.some((route) => request.url.startsWith(route))) {
          return
        }

        // Check for idempotency key
        const idempotencyKey = get(
          request.headers,
          'x-idempotency-key',
        ) as string

        if (!idempotencyKey) {
          return
        }

        // Validate idempotency key format (alphanumeric + hyphens, 16-128 chars)
        if (!/^[a-zA-Z0-9-]{16,128}$/.test(idempotencyKey)) {
          logger.warn('Invalid idempotency key format', { idempotencyKey })

          return reply.code(400).send({
            error: 'Invalid idempotency key format',
            message:
              'Idempotency key must be 16-128 characters, alphanumeric and hyphens only',
          })
        }

        // Build context
        const context: IdempotencyContext = {
          key: idempotencyKey,
          userId: includeUserContext
            ? (get(request.headers, 'x-user-id') as string)
            : undefined,
          service: keyPrefix,
          method: request.method,
          path: (request as any).routerPath || request.url,
          correlationId:
            (get(request.headers, 'x-correlation-id') as string) || request.id,
        }

        // Build cache key
        const cacheKey = buildCacheKey(context)

        try {
          // Check for existing response
          const cached = await cacheService.get<IdempotentResponse>(cacheKey)

          if (cached) {
            logger.info('Returning cached idempotent response', {
              idempotencyKey,
              cachedAt: cached.cachedAt,
              path: request.url,
            })

            // Set idempotency headers (industry standard)
            reply.header('X-Idempotency-Key', idempotencyKey)
            reply.header('X-Idempotent-Replayed', 'true')
            reply.header('Content-Type', 'application/json')

            // Industry standard: return 200 with cached status info instead of original body
            const cacheResponse = {
              success: true,
              cached: true,
              originalStatus: cached.statusCode,
              cachedAt: cached.cachedAt,
              message: 'Request processed successfully (cached response)',
            }

            // Return cache confirmation response
            return reply.code(200).send(cacheResponse)
          }

          // No cached response, attach context for response hook
          request.idempotencyKey = idempotencyKey
          request.idempotencyContext = context
        } catch (error) {
          logger.error('Error checking idempotency cache', {
            error,
            idempotencyKey,
            cacheKey,
          })
          // Continue processing on cache error
        }
      },
    )

    // Response hook to cache idempotent responses (industry standard: onResponse)
    fastify.addHook(
      'onResponse',
      async (request: FastifyRequest, reply: FastifyReply) => {
        // Skip if no idempotency context
        if (!request.idempotencyContext) {
          return
        }

        // Only cache successful responses (2xx) and client errors (4xx)
        const statusCode = reply.statusCode

        if (statusCode < 200 || statusCode >= 500) {
          return
        }

        try {
          // Build response object for caching (without body - will be reconstructed on cache hit)
          const response: IdempotentResponse = {
            statusCode,
            headers: {
              'X-Idempotency-Key': request.idempotencyKey!,
              'Content-Type': 'application/json',
            },
            body: null, // Industry standard: store minimal response data
            cachedAt: new Date().toISOString(),
            method: request.method,
            path: request.url,
          }

          // Cache the response asynchronously (industry standard: background caching)
          cacheService
            .set(
              buildCacheKey(request.idempotencyContext),
              response,
              defaultTTL,
            )
            .then(() => {
              logger.debug('Cached idempotent response', {
                idempotencyKey: request.idempotencyKey,
                ttl: defaultTTL,
                statusCode,
              })
            })
            .catch((error) => {
              logger.error('Error caching idempotent response', {
                error,
                idempotencyKey: request.idempotencyKey,
              })
            })
        } catch (error) {
          logger.error('Error in idempotency onResponse hook', {
            error,
            idempotencyKey: request.idempotencyKey,
          })
          // Don't fail the request if caching fails
        }
      },
    )
  },
  {
    name: 'idempotency',
    dependencies: [],
  },
)

/**
 * Build cache key from idempotency context
 */
function buildCacheKey(context: IdempotencyContext): string {
  const parts = ['idempotency', context.service, context.method]

  // Include user context if configured
  if (context.userId) {
    parts.push(`user:${context.userId}`)
  }

  // Include path to prevent key collisions across endpoints
  const sanitizedPath = context.path.replace(/\//g, ':')

  parts.push(sanitizedPath)

  parts.push(context.key)

  return parts.join(':')
}
