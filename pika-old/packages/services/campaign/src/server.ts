// Load environment variables first
import '@pika/environment'

import { createCampaignReadRouter } from '@campaign-read/api/routes/CampaignRouter.js'
import { PrismaCampaignReadRepository } from '@campaign-read/infrastructure/persistence/pgsql/repositories/PrismaCampaignReadRepository.js'
import { createCampaignWriteRouter } from '@campaign-write/api/routes/CampaignRouter.js'
import { PrismaCampaignWriteRepository } from '@campaign-write/infrastructure/persistence/pgsql/repositories/PrismaCampaignWriteRepository.js'
import {
  CAMPAIGN_SERVER_PORT,
  CAMPAIGN_SERVICE_NAME,
  NODE_ENV,
} from '@pika/environment'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { FileStoragePort, logger, ProviderServiceClient } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

/**
 * Creates and configures the unified Campaign service server
 * Implements both read and write operations with comprehensive features:
 * - Inter-service communication with Provider service
 * - System-wide idempotency middleware
 * - Multilingual support
 * - Comprehensive health checks
 * - Clean architecture with DDD+CQRS
 */
export async function createCampaignServer({
  prisma,
  cacheService,
  fileStorage,
  repositories = {},
  serviceClients = {},
}: {
  prisma: PrismaClient
  cacheService: ICacheService
  fileStorage: FileStoragePort
  repositories?: {
    read?: PrismaCampaignReadRepository
    write?: PrismaCampaignWriteRepository
  }
  serviceClients?: {
    providerService?: ProviderServiceClient
  }
}) {
  logger.info(
    `Configuring Unified Campaign service for port: ${CAMPAIGN_SERVER_PORT}`,
  )

  // Initialize repositories with dependency injection for testability
  const campaignReadRepository =
    repositories.read || new PrismaCampaignReadRepository(prisma, cacheService)
  const campaignWriteRepository =
    repositories.write || new PrismaCampaignWriteRepository(prisma)

  // Initialize service clients for inter-service communication
  const providerService =
    serviceClients.providerService || new ProviderServiceClient()

  // Create Fastify server with comprehensive configuration
  const app = await createFastifyServer({
    serviceName: CAMPAIGN_SERVICE_NAME,
    port: CAMPAIGN_SERVER_PORT,
    cacheService,
    languageOptions: true, // Enable multilingual support (es, en, gn, pt)

    // System-wide idempotency middleware configuration
    // Follows the pattern from CLAUDE.md for preventing duplicate request processing
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400, // 24 hours
      methods: ['POST', 'PUT', 'PATCH'], // Only for state-changing operations
      excludeRoutes: ['/health', '/metrics'], // Exclude monitoring endpoints
      includeUserContext: true, // Include user ID in cache key for user-specific idempotency
      maxResponseSize: 1048576, // 1MB maximum cached response size
    },

    // Health check configuration for monitoring and load balancers
    healthChecks: [
      {
        name: 'postgres',
        check: async () => {
          try {
            await prisma.$queryRaw`SELECT 1`

            return true
          } catch (error) {
            logger.error('PostgreSQL health check failed:', error)

            return false
          }
        },
        details: { type: 'PostgreSQL' },
      },
      {
        name: 'redis',
        check: async () => {
          try {
            if (typeof cacheService.checkHealth === 'function') {
              const health = await cacheService.checkHealth()

              return health.status === 'healthy' || health.status === 'degraded'
            }
            // Fallback health check
            await cacheService.set('health_check', 'ok', 5)

            const result = await cacheService.get('health_check')

            return result === 'ok'
          } catch (error) {
            logger.error('Cache health check failed:', error)

            return false
          }
        },
        details: { type: 'Redis' },
      },
      {
        name: 'provider-service',
        check: async () => {
          try {
            // Test inter-service communication with provider service
            const testUserId = 'health-check-test-user-id'

            await providerService.getProviderByUserId(testUserId, {
              serviceName: 'campaign-service',
              correlationId: 'health-check',
            })

            return true
          } catch (error) {
            // Expected to fail for non-existent user, but service should be reachable
            if (error?.context?.metadata?.status === 404) {
              return true // Service is reachable
            }
            logger.error('Provider service health check failed:', error)

            return false
          }
        },
        details: { type: 'Provider Service' },
      },
    ],
  })

  // Register read endpoints (public access with optional authentication)
  app.register(createCampaignReadRouter(campaignReadRepository), {
    prefix: '/campaigns',
  })

  // Register write endpoints (requires authentication and provider permissions)
  app.register(
    createCampaignWriteRouter(
      campaignWriteRepository,
      fileStorage,
      providerService,
    ),
    {
      prefix: '/campaigns',
    },
  )

  // Add request logging for development debugging
  app.addHook('onRequest', (request, reply, done) => {
    if (NODE_ENV === 'development') {
      logger.debug(
        `${CAMPAIGN_SERVICE_NAME} handling ${request.method} ${request.url}`,
        {
          headers: {
            'content-type': request.headers['content-type'],
            'accept-language': request.headers['accept-language'],
            'x-user-id': request.headers['x-user-id']
              ? '[PRESENT]'
              : '[MISSING]',
            'x-idempotency-key': request.headers['x-idempotency-key']
              ? '[PRESENT]'
              : '[MISSING]',
          },
        },
      )
    }
    done()
  })

  // Log successful server configuration
  logger.info('Campaign service configured successfully', {
    port: CAMPAIGN_SERVER_PORT,
    features: [
      'DDD+CQRS Architecture',
      'Inter-service Communication',
      'System-wide Idempotency',
      'Multilingual Support',
      'Comprehensive Health Checks',
      'Authentication & Authorization',
      'Business Rule Validation',
      'Provider Ownership Validation',
    ],
  })

  return app
}
