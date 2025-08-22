// Load environment variables first
import '@pika/environment'

import { BUSINESS_SERVICE_NAME, BUSINESS_SERVICE_PORT } from '@pika/environment'
import { createExpressServer, errorMiddleware, createLanguageMiddleware } from '@pika/http'
import { ICacheService, setCacheService } from '@pika/redis'
import { logger, UserServiceClient } from '@pika/shared'
import { TranslationClient, createTranslationResolver } from '@pika/translation'
import { PrismaClient } from '@prisma/client'

import { createAdminBusinessRoutes } from './routes/AdminBusinessRoutes.js'
import { createBusinessRegistrationRoutes } from './routes/BusinessRegistrationRoutes.js'
import { createBusinessRoutes } from './routes/BusinessRoutes.js'
import { createInternalBusinessRoutes } from './routes/InternalBusinessRoutes.js'

/**
 * Create and configure the Express server for the Business service
 * This is separate from the server startup to make testing easier
 */
export async function createBusinessServer({
  prisma,
  cacheService,
  translationClient,
  userServiceClient,
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  translationClient: TranslationClient
  userServiceClient?: UserServiceClient
}) {
  // Set up global cache service for decorators
  setCacheService(cacheService)
  logger.info(`Configuring Business service for port: ${BUSINESS_SERVICE_PORT}`)

  // Create Express server
  const app = await createExpressServer({
    serviceName: BUSINESS_SERVICE_NAME,
    port: BUSINESS_SERVICE_PORT,
    cacheService,
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400, // 24 hours
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: [
        '/health',
        '/metrics',
        // Exclude admin toggle endpoints that don't need idempotency
        '/admin/businesses/:id/activate',
        '/admin/businesses/:id/deactivate',
        '/admin/businesses/:id/verify',
      ],
    },
    authOptions: {
      excludePaths: ['/health', '/metrics', '/internal/*'],
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

  // Add language detection middleware
  app.use(createLanguageMiddleware(translationClient.service))

  // Create translation resolver
  const translationResolver = createTranslationResolver(translationClient)

  // Register business routes with translation resolver
  const businessRouter = createBusinessRoutes(
    prisma,
    cacheService,
    translationClient,
    translationResolver,
  )

  app.use('/businesses', businessRouter)

  // Register business registration routes (only if userServiceClient is provided)
  if (userServiceClient) {
    const registrationRouter = createBusinessRegistrationRoutes(
      prisma,
      cacheService,
      translationClient,
      translationResolver,
      userServiceClient,
    )

    app.use('/businesses/registration', registrationRouter)
  }

  // Register admin routes (only if userServiceClient is provided)
  if (userServiceClient) {
    const adminRouter = createAdminBusinessRoutes(
      prisma,
      cacheService,
      translationClient,
      userServiceClient,
      translationResolver,
    )

    app.use('/admin/businesses', adminRouter)
  }

  // Register internal routes
  const internalRouter = createInternalBusinessRoutes(
    prisma,
    cacheService,
    translationClient,
    translationResolver,
  )

  app.use('/internal/businesses', internalRouter)

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  // Log service info
  logger.info(
    `Business service configured successfully on port ${BUSINESS_SERVICE_PORT}`,
  )

  return app
}
