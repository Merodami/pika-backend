// Load environment variables first
import '@pika/environment'

import {
  NODE_ENV,
  VOUCHER_SERVER_PORT,
  VOUCHER_SERVICE_NAME,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FileStoragePort, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
// Import the routers from both read and write services
import { createVoucherReadRouter } from '@voucher-read/api/routes/VoucherRouter.js'
// Import the repositories from both read and write services
import { PrismaVoucherReadRepository } from '@voucher-read/infrastructure/persistence/pgsql/repositories/PrismaVoucherReadRepository.js'
import { createVoucherWriteRouter } from '@voucher-write/api/routes/VoucherRouter.js'
import { PrismaVoucherWriteRepository } from '@voucher-write/infrastructure/persistence/pgsql/repositories/PrismaVoucherWriteRepository.js'

/**
 * Create and configure the Fastify server for the Voucher service
 * This is separate from the server startup to make testing easier
 */
export async function createVoucherServer({
  prisma,
  cacheService,
  fileStorage,
  repositories = {},
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage: FileStoragePort
  repositories?: {
    read?: PrismaVoucherReadRepository
    write?: PrismaVoucherWriteRepository
  }
}) {
  logger.info(
    `Configuring Unified Voucher service for port: ${VOUCHER_SERVER_PORT}`,
  )

  // Create repositories (or use provided ones)
  const voucherReadRepository =
    repositories.read || new PrismaVoucherReadRepository(prisma, cacheService)
  const voucherWriteRepository =
    repositories.write || new PrismaVoucherWriteRepository(prisma)

  // Create Fastify server
  const app = await createFastifyServer({
    serviceName: VOUCHER_SERVICE_NAME,
    port: VOUCHER_SERVER_PORT,
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
  app.register(createVoucherReadRouter(voucherReadRepository), {
    prefix: '/vouchers',
  })

  app.register(createVoucherWriteRouter(voucherWriteRepository, fileStorage), {
    prefix: '/vouchers',
  })

  // Informational logging about service identity
  app.addHook('onRequest', (request, reply, done) => {
    // Log incoming request with service context
    if (NODE_ENV === 'development') {
      logger.debug(
        `${VOUCHER_SERVICE_NAME} handling ${request.method} ${request.url}`,
      )
    }

    // Set a decoration on the request (but don't use it since it might cause TS errors)
    // Instead we'll just use the local variable for logging

    done()
  })

  return app
}
