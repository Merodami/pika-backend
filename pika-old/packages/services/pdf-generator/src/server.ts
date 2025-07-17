// Load environment variables first
import '@pika/environment'

import {
  NODE_ENV,
  PDF_GENERATOR_SERVER_PORT,
  PDF_GENERATOR_SERVICE_NAME,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FileStoragePort, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

// Import the routers from both read and write services
import { createPDFReadRouter } from './read/api/routes/PDFRouter.js'
// Import the repositories from both read and write services
import { PrismaPDFReadRepository } from './read/infrastructure/persistence/pgsql/repositories/PrismaPDFReadRepository.js'
import { createPDFWriteRouter } from './write/api/routes/PDFRouter.js'
import { createVoucherBookPageRouter } from './write/api/routes/VoucherBookPageRouter.js'
import { PrismaPDFWriteRepository } from './write/infrastructure/persistence/pgsql/repositories/PrismaPDFWriteRepository.js'
import { PrismaAdPlacementWriteRepository } from './write/infrastructure/persistence/PrismaAdPlacementWriteRepository.js'
import { PrismaVoucherBookPageWriteRepository } from './write/infrastructure/persistence/PrismaVoucherBookPageWriteRepository.js'

/**
 * Create and configure the Fastify server for the PDF Generator service
 * This is separate from the server startup to make testing easier
 */
export async function createPDFGeneratorServer({
  prisma,
  cacheService,
  fileStorage,
  repositories = {},
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage: FileStoragePort
  repositories?: {
    read?: PrismaPDFReadRepository
    write?: PrismaPDFWriteRepository
  }
}) {
  logger.info(
    `Configuring Unified PDF Generator service for port: ${PDF_GENERATOR_SERVER_PORT || 5006}`,
  )

  // Create repositories (or use provided ones)
  const pdfReadRepository =
    repositories.read || new PrismaPDFReadRepository(prisma, cacheService)
  const pdfWriteRepository =
    repositories.write || new PrismaPDFWriteRepository(prisma)
  const pageRepository = new PrismaVoucherBookPageWriteRepository(prisma)
  const adPlacementRepository = new PrismaAdPlacementWriteRepository(prisma)

  // Create Fastify server
  const app = await createFastifyServer({
    serviceName: PDF_GENERATOR_SERVICE_NAME || 'pdf-generator',
    port: PDF_GENERATOR_SERVER_PORT || 5006,
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
  app.register(createPDFReadRouter(pdfReadRepository), {
    prefix: '/pdf',
  })

  app.register(
    createPDFWriteRouter(pdfWriteRepository, fileStorage, cacheService),
    {
      prefix: '/pdf',
    },
  )

  // Register voucher book page and ad placement routes
  app.register(
    createVoucherBookPageRouter(
      pageRepository,
      adPlacementRepository,
      pdfWriteRepository,
    ),
    {
      prefix: '/pdf',
    },
  )

  // Informational logging about service identity
  app.addHook('onRequest', (request, reply, done) => {
    // Log incoming request with service context
    if (NODE_ENV === 'development') {
      logger.debug(
        `${PDF_GENERATOR_SERVICE_NAME || 'pdf-generator'} handling ${request.method} ${request.url}`,
      )
    }

    // Set a decoration on the request (but don't use it since it might cause TS errors)
    // Instead we'll just use the local variable for logging

    done()
  })

  return app
}
