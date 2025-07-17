// Load environment variables first
import '@pika/environment'

import {
  NODE_ENV,
  PROVIDER_SERVER_PORT,
  PROVIDER_SERVICE_NAME,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FileStoragePort, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import { createInternalRouter } from '@provider-read/api/routes/InternalRouter.js'
// Import the routers from both read and write services
import { createProviderReadRouter } from '@provider-read/api/routes/ProviderRouter.js'
// Import the repositories from both read and write services
import { PrismaProviderReadRepository } from '@provider-read/infrastructure/persistence/pgsql/repositories/PrismaProviderReadRepository.js'
import { createProviderWriteRouter } from '@provider-write/api/routes/ProviderRouter.js'
import { PrismaProviderWriteRepository } from '@provider-write/infrastructure/persistence/pgsql/repositories/PrismaProviderWriteRepository.js'

/**
 * Create and configure the Fastify server for the Provider service
 * This is separate from the server startup to make testing easier
 */
export async function createProviderServer({
  prisma,
  cacheService,
  fileStorage,
  repositories = {},
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage: FileStoragePort
  repositories?: {
    read?: PrismaProviderReadRepository
    write?: PrismaProviderWriteRepository
  }
}) {
  logger.info(
    `Configuring Unified Provider service for port: ${PROVIDER_SERVER_PORT}`,
  )

  // Create repositories (or use provided ones)
  const providerReadRepository =
    repositories.read || new PrismaProviderReadRepository(prisma, cacheService)
  const providerWriteRepository =
    repositories.write || new PrismaProviderWriteRepository(prisma)

  // Create Fastify server
  const app = await createFastifyServer({
    serviceName: PROVIDER_SERVICE_NAME,
    port: PROVIDER_SERVER_PORT,
    cacheService,
    // Enable @fastify/accepts for content negotiation via Accept-Language header
    languageOptions: true,
    // Exclude internal routes from global auth middleware
    authOptions: {
      excludePaths: ['/internal/*'],
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
  app.register(createProviderReadRouter(providerReadRepository), {
    prefix: '/providers',
  })

  app.register(
    createProviderWriteRouter(providerWriteRepository, fileStorage),
    {
      prefix: '/providers',
    },
  )

  // Register internal routes for service-to-service communication
  app.register(createInternalRouter(providerReadRepository), {
    prefix: '/internal',
  })

  // Informational logging about service identity
  app.addHook('onRequest', (request, reply, done) => {
    // Log incoming request with service context
    if (NODE_ENV === 'development') {
      logger.debug(
        `${PROVIDER_SERVICE_NAME} handling ${request.method} ${request.url}`,
      )
    }

    // Set a decoration on the request (but don't use it since it might cause TS errors)
    // Instead we'll just use the local variable for logging

    done()
  })

  return app
}
