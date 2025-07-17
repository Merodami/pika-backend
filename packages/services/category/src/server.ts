import type { PrismaClient } from '@prisma/client'
import { createExpressServer, errorMiddleware } from '@pika/http'
import type { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { TranslationClient } from '@pika/translation'

import { CategoryController } from './controllers/CategoryController.js'
import { AdminCategoryController } from './controllers/AdminCategoryController.js'
import { InternalCategoryController } from './controllers/InternalCategoryController.js'
import { CategoryRepository } from './repositories/CategoryRepository.js'
import { CategoryService } from './services/CategoryService.js'
import { createCategoryRoutes } from './routes/CategoryRoutes.js'
import { createAdminCategoryRoutes } from './routes/AdminCategoryRoutes.js'
import { createInternalCategoryRoutes } from './routes/InternalCategoryRoutes.js'

export interface ServerConfig {
  prisma: PrismaClient
  cacheService: ICacheService
  translationClient: TranslationClient
}

export async function createCategoryServer(config: ServerConfig) {
  const { prisma, cacheService, translationClient } = config

  // Create Express app with standard configuration
  const app = await createExpressServer({
    serviceName: 'category',
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
        '/categories*', // Public endpoints don't require auth
        '/health',
        '/metrics',
        '/internal/*', // Internal service-to-service communication
      ],
    },
  })

  // Initialize dependencies with dependency injection
  const categoryRepository = new CategoryRepository(prisma, cacheService)
  const categoryService = new CategoryService(categoryRepository, cacheService)

  // Initialize controllers
  const categoryController = new CategoryController(categoryService)
  const adminCategoryController = new AdminCategoryController(categoryService)
  const internalCategoryController = new InternalCategoryController(categoryService)

  // Mount route handlers
  app.use('/categories', createCategoryRoutes(categoryController))
  app.use('/admin/categories', createAdminCategoryRoutes(adminCategoryController))
  app.use('/internal/categories', createInternalCategoryRoutes(internalCategoryController))

  // Register error middleware (must be last)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  logger.info('Category service server configured successfully')

  return { app }
}