// Load environment variables first
import '@pika/environment'

// Import the routers from both read and write services
import {
  NODE_ENV,
  USER_SERVER_PORT,
  USER_SERVICE_NAME,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FileStoragePort, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import { createUserRouter as createUserReadRouter } from '@user-read/api/routes/UserRouter.js'
import { PrismaUserReadRepository } from '@user-read/infrastructure/persistence/pgsql/repositories/PrismaUserReadRepository.js'
import { createAuthRouter } from '@user-write/api/routes/AuthRouter.js'
import { createFirebaseAuthRouter } from '@user-write/api/routes/FirebaseAuthRouter.js'
import { createUserRouter as createUserWriteRouter } from '@user-write/api/routes/UserRouter.js'
import { PrismaUserWriteRepository } from '@user-write/infrastructure/persistence/pgsql/repositories/PrismaUserWriteRepository.js'

/**
 * Create and configure the Fastify server for the User service
 * This is separate from the server startup to make testing easier
 */
export async function createUserServer({
  prisma,
  cacheService,
  fileStorage,
  repositories = {},
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage: FileStoragePort
  repositories?: {
    read?: PrismaUserReadRepository
    write?: PrismaUserWriteRepository
  }
}) {
  logger.info(`Configuring Unified User service for port: ${USER_SERVER_PORT}`)

  // Create repositories (or use provided ones)
  const userReadRepository =
    repositories.read || new PrismaUserReadRepository(prisma, cacheService)
  const userWriteRepository =
    repositories.write || new PrismaUserWriteRepository(prisma)

  // Create Fastify server
  const app = await createFastifyServer({
    serviceName: USER_SERVICE_NAME,
    port: USER_SERVER_PORT,
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
  app.register(createUserReadRouter(userReadRepository), {
    prefix: '/users',
  })

  app.register(createUserWriteRouter(userWriteRepository, fileStorage), {
    prefix: '/users',
  })

  // Register auth routes (login, register, refresh, logout)
  app.register(createAuthRouter(prisma, cacheService), {
    prefix: '/auth',
  })

  // Register Firebase auth router (for custom Firebase tokens)
  app.register(createFirebaseAuthRouter(), {
    prefix: '/auth',
  })

  // Informational logging about service identity
  app.addHook('onRequest', (request, reply, done) => {
    // Log incoming request with service context
    if (NODE_ENV === 'development') {
      logger.debug(
        `${USER_SERVICE_NAME} handling ${request.method} ${request.url}`,
      )
    }

    done()
  })

  return app
}
