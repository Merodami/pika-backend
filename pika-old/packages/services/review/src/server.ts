// Load environment variables first
import '@pika/environment'

import {
  NODE_ENV,
  REVIEW_SERVER_PORT,
  REVIEW_SERVICE_NAME,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
// Import the routers from both read and write services
import { createReviewReadRouter } from '@review-read/api/routes/ReviewRouter.js'
// Import the repositories from both read and write services
import { PrismaReviewReadRepository } from '@review-read/infrastructure/persistence/pgsql/repositories/PrismaReviewReadRepository.js'
import { createReviewWriteRouter } from '@review-write/api/routes/ReviewRouter.js'
import { PrismaReviewWriteRepository } from '@review-write/infrastructure/persistence/pgsql/repositories/PrismaReviewWriteRepository.js'

/**
 * Create and configure the Fastify server for the Review service
 * This is separate from the server startup to make testing easier
 */
export async function createReviewServer({
  prisma,
  cacheService,
  repositories = {},
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  repositories?: {
    read?: PrismaReviewReadRepository
    write?: PrismaReviewWriteRepository
  }
}) {
  logger.info(
    `Configuring Unified Review service for port: ${REVIEW_SERVER_PORT}`,
  )

  // Create repositories (or use provided ones)
  const reviewReadRepository =
    repositories.read || new PrismaReviewReadRepository(prisma, cacheService)
  const reviewWriteRepository =
    repositories.write || new PrismaReviewWriteRepository(prisma)

  // Create Fastify server
  const app = await createFastifyServer({
    serviceName: REVIEW_SERVICE_NAME,
    port: REVIEW_SERVER_PORT,
    cacheService,
    // Enable @fastify/accepts for content negotiation via Accept-Language header
    languageOptions: true,
    // Enable idempotency to prevent duplicate request processing
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400, // 24 hours
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
      includeUserContext: true, // Include user ID in cache key
      maxResponseSize: 1048576, // 1MB
    },
    healthChecks: [
      {
        name: 'postgres',
        check: async () => {
          try {
            await prisma.$queryRaw`SELECT 1`

            return true
          } catch {
            return false
          }
        },
        details: { type: 'PostgreSQL' },
      },
      {
        name: 'redis',
        check: async () => {
          try {
            // Handle both RedisService and MemoryCacheService
            if (typeof cacheService.checkHealth === 'function') {
              const health = await cacheService.checkHealth()

              return health.status === 'healthy' || health.status === 'degraded'
            }
            // For MemoryCacheService that doesn't have checkHealth, do a simple operation test
            await cacheService.set('health_check', 'ok', 5)

            const result = await cacheService.get('health_check')

            return result === 'ok'
          } catch (error) {
            logger.error('Cache health check failed:', error)

            return false
          }
        },
        details: { type: 'Cache' },
      },
    ],
  })

  // Error handling is set up by the HTTP package via fastifyErrorMiddleware
  // No need to override it here

  // Register both read and write routers with the same prefix
  // The same endpoint path will have different methods registered from each router
  app.register(createReviewReadRouter(reviewReadRepository), {
    prefix: '/reviews',
  })

  app.register(createReviewWriteRouter(reviewWriteRepository), {
    prefix: '/reviews',
  })

  // Informational logging about service identity
  app.addHook('onRequest', (request, reply, done) => {
    // Log incoming request with service context
    if (NODE_ENV === 'development') {
      logger.debug(
        `${REVIEW_SERVICE_NAME} handling ${request.method} ${request.url}`,
      )
    }

    // Set a decoration on the request (but don't use it since it might cause TS errors)
    // Instead we'll just use the local variable for logging

    done()
  })

  return app
}
