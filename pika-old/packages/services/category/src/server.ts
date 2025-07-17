// Load environment variables first
import '@pika/environment'

// Import the routers from both read and write services
import { createCategoryReadRouter } from '@category-read/api/routes/CategoryRouter.js'
// Import the repositories from both read and write services
import { PrismaCategoryReadRepository } from '@category-read/infrastructure/persistence/pgsql/repositories/PrismaCategoryReadRepository.js'
import { createCategoryWriteRouter } from '@category-write/api/routes/CategoryRouter.js'
import { PrismaCategoryWriteRepository } from '@category-write/infrastructure/persistence/pgsql/repositories/PrismaCategoryWriteRepository.js'
import {
  CATEGORY_SERVER_PORT,
  CATEGORY_SERVICE_NAME,
  NODE_ENV,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FileStoragePort, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

/**
 * Create and configure the Fastify server for the Category service
 * This is separate from the server startup to make testing easier
 */
export async function createCategoryServer({
  prisma,
  cacheService,
  fileStorage,
  repositories = {},
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage: FileStoragePort
  repositories?: {
    read?: PrismaCategoryReadRepository
    write?: PrismaCategoryWriteRepository
  }
}) {
  logger.info(
    `Configuring Unified Category service for port: ${CATEGORY_SERVER_PORT}`,
  )

  // Create repositories (or use provided ones)
  const categoryReadRepository =
    repositories.read || new PrismaCategoryReadRepository(prisma, cacheService)
  const categoryWriteRepository =
    repositories.write || new PrismaCategoryWriteRepository(prisma)

  // Create Fastify server
  const app = await createFastifyServer({
    serviceName: CATEGORY_SERVICE_NAME,
    port: CATEGORY_SERVER_PORT,
    cacheService,
    // Enable @fastify/accepts for content negotiation via Accept-Language header
    languageOptions: true,
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
  app.register(createCategoryReadRouter(categoryReadRepository), {
    prefix: '/categories',
  })

  app.register(
    createCategoryWriteRouter(categoryWriteRepository, fileStorage),
    {
      prefix: '/categories',
    },
  )

  // Informational logging about service identity
  app.addHook('onRequest', (request, reply, done) => {
    // Log incoming request with service context
    if (NODE_ENV === 'development') {
      logger.debug(
        `${CATEGORY_SERVICE_NAME} handling ${request.method} ${request.url}`,
      )
    }

    // Set a decoration on the request (but don't use it since it might cause TS errors)
    // Instead we'll just use the local variable for logging

    done()
  })

  return app
}
