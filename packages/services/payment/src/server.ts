import type { PrismaClient } from '@prisma/client'
import { PAYMENT_SERVICE_PORT } from '@pika/environment'
import { createExpressServer, errorMiddleware } from '@pika
import type { ICacheService } from '@pika'
import { logger } from '@pikad'
import type Stripe from 'stripe'

import { createCreditPackRouter } from './routes/CreditPackRoutes.js'
import { createCreditsRouter } from './routes/CreditsRoutes.js'
import { createMembershipRouter } from './routes/MembershipRoutes.js'
import { createProductRouter } from './routes/ProductRoutes.js'
import { createPromoCodeRouter } from './routes/PromoCodeRoutes.js'
import { createWebhookRouter } from './routes/WebhookRoutes.js'
import { ProductService } from './services/ProductService.js'
import { StripeService } from './services/StripeService.js'

export interface ServerConfig {
  prisma: PrismaClient
  cacheService: ICacheService
  stripeInstance?: Stripe // Optional for testing
}

export async function createPaymentServer(config: ServerConfig) {
  // Initialize services
  const stripeService = new StripeService(config.stripeInstance)
  const productService = new ProductService(stripeService)

  const app = await createExpressServer({
    serviceName: 'payment-service',
    port: PAYMENT_SERVICE_PORT,
    cacheService: config.cacheService,
    authOptions: {
      excludePaths: [
        '/webhooks/*', // Modern webhook endpoints (Stripe signature verification)
      ],
    },
    healthChecks: [
      {
        name: 'postgres',
        check: async () => {
          try {
            await config.prisma.$queryRaw`SELECT 1`

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
            if (typeof config.cacheService.checkHealth === 'function') {
              const health = await config.cacheService.checkHealth()

              return health.status === 'healthy' || health.status === 'degraded'
            }
            // For MemoryCacheService that doesn't have checkHealth, do a simple operation test
            await config.cacheService.set('health_check', 'ok', 5)

            const result = await config.cacheService.get('health_check')

            return result === 'ok'
          } catch (error) {
            logger.error('Cache health check failed:', error)

            return false
          }
        },
        details: { type: 'Cache' },
      },
    ],
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400,
      methods: ['POST', 'PUT', 'PATCH'],
      excludeRoutes: ['/health', '/metrics'],
    },
  })

  // Mount routes
  app.use('/credits', createCreditsRouter(config.prisma, config.cacheService))
  app.use(
    '/credit-packs',
    createCreditPackRouter(config.prisma, config.cacheService),
  )
  app.use(
    '/promo-codes',
    createPromoCodeRouter(config.prisma, config.cacheService),
  )
  app.use(
    '/memberships',
    createMembershipRouter(
      config.prisma,
      config.cacheService,
      config.stripeInstance,
    ),
  )
  app.use(
    '/webhooks',
    createWebhookRouter(
      config.prisma,
      config.cacheService,
      config.stripeInstance,
    ),
  )
  // Product and price management routes (service-to-service only)
  app.use('/', createProductRouter(productService))

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

  return { app }
}
