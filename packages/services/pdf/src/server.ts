import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'

import { AdminVoucherBookController } from './controllers/AdminVoucherBookController.js'
import { VoucherBookController } from './controllers/VoucherBookController.js'
import { VoucherBookRepository } from './repositories/VoucherBookRepository.js'
import { createAdminVoucherBookRoutes } from './routes/AdminVoucherBookRoutes.js'
import { createVoucherBookRoutes } from './routes/VoucherBookRoutes.js'
import { AdminVoucherBookService } from './services/AdminVoucherBookService.js'
import { VoucherBookService } from './services/VoucherBookService.js'

export interface ServerConfig {
  prisma: PrismaClient
  cacheService: ICacheService
}

export async function createPDFServer(config: ServerConfig) {
  const { prisma, cacheService } = config

  // Create Express app with standard configuration
  const app = await createExpressServer({
    serviceName: 'pdf',
    cacheService,
    healthChecks: {
      postgresql: async () => {
        await prisma.$queryRaw`SELECT 1`

        return { status: 'healthy' }
      },
      redis: async () => {
        // Handle both RedisService and MemoryCacheService
        if (typeof cacheService.ping === 'function') {
          await cacheService.ping()
        }

        return { status: 'healthy' }
      },
    },
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400, // 24 hours
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
    },
    authOptions: {
      excludePaths: [
        '/voucher-books*', // Public endpoints don't require auth
        '/health',
        '/metrics',
        '/internal/*', // Internal service-to-service communication
      ],
    },
  })

  // Initialize dependencies with dependency injection
  const voucherBookRepository = new VoucherBookRepository(prisma, cacheService)

  // Initialize services
  const voucherBookService = new VoucherBookService(
    voucherBookRepository,
    cacheService,
  )
  const adminVoucherBookService = new AdminVoucherBookService(
    voucherBookRepository,
    cacheService,
  )

  // Initialize controllers
  const voucherBookController = new VoucherBookController(voucherBookService)
  const adminVoucherBookController = new AdminVoucherBookController(
    adminVoucherBookService,
  )

  // Mount route handlers
  app.use('/voucher-books', createVoucherBookRoutes(voucherBookController))
  app.use(
    '/admin/voucher-books',
    createAdminVoucherBookRoutes(adminVoucherBookController),
  )

  // Register error middleware (must be last)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  logger.info('PDF service server configured successfully')

  return { app }
}
