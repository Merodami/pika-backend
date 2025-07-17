// Import services and crypto integration
import { VoucherQRService } from '@pika/crypto'
import { createFastifyServer } from '@pika/http'
import { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
// Import service clients for redemption validation
import { ProviderServiceClient, VoucherServiceClient } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

// Import routers
import { createFraudReadRouter } from './read/api/routes/FraudRouter.js'
import { createRedemptionReadRouter } from './read/api/routes/RedemptionRouter.js'
// Import repository implementations
import { PrismaFraudCaseReadRepository } from './read/infrastructure/persistence/pgsql/repositories/PrismaFraudCaseReadRepository.js'
import { PrismaRedemptionReadRepository } from './read/infrastructure/persistence/pgsql/repositories/PrismaRedemptionReadRepository.js'
import { createFraudWriteRouter } from './write/api/routes/FraudRouter.js'
import { createRedemptionWriteRouter } from './write/api/routes/RedemptionRouter.js'
import {
  RedeemVoucherCommandHandler,
  ReviewFraudCaseCommandHandler,
  SyncOfflineRedemptionsCommandHandler,
  ValidateOfflineRedemptionCommandHandler,
} from './write/application/use_cases/commands/index.js'
import { CryptoServiceAdapter } from './write/infrastructure/adapters/CryptoServiceAdapter.js'
import { PrismaFraudCaseRepository } from './write/infrastructure/persistence/pgsql/repositories/PrismaFraudCaseRepository.js'
import { PrismaRedemptionWriteRepository } from './write/infrastructure/persistence/pgsql/repositories/PrismaRedemptionWriteRepository.js'
import { ShortCodeService } from './write/infrastructure/services/ShortCodeService.js'
import { QRGenerator } from './write/infrastructure/utils/qrGenerator.js'

interface CreateRedemptionServerOptions {
  prisma: PrismaClient
  cacheService: ICacheService
  jwtKeys: {
    privateKey: string
    publicKey: string
  }
  repositories?: {
    read?: any
    write?: any
  }
  serviceClients?: {
    voucherServiceClient?: VoucherServiceClient
    providerServiceClient?: ProviderServiceClient
  }
  testServices?: {
    jwtService?: any
    shortCodeService?: any
  }
}

/**
 * Create the unified Redemption server with all dependencies configured
 */
export async function createRedemptionServer({
  prisma,
  cacheService,
  jwtKeys,
  repositories,
  serviceClients,
  testServices,
}: CreateRedemptionServerOptions): Promise<FastifyInstance> {
  logger.info('Creating unified Redemption server...')

  // Initialize crypto package services
  const voucherQRService = new VoucherQRService({
    algorithm: 'ES256',
    issuer: 'pika-redemption-service',
    audience: 'pika-voucher-platform',
    defaultTTL: 300, // 5 minutes for user vouchers
  })

  // Create adapter to integrate crypto services
  const cryptoAdapter = new CryptoServiceAdapter(voucherQRService, jwtKeys)

  // Initialize services (use test services if provided)
  const jwtService =
    testServices?.jwtService || cryptoAdapter.createJWTService() // Uses redemption's JWT service
  const shortCodeService =
    testServices?.shortCodeService || new ShortCodeService(cacheService, prisma) // Redemption's short code service
  const qrGenerator = new QRGenerator() // For converting JWT payloads to QR images

  // Initialize repositories
  const redemptionReadRepository =
    repositories?.read || new PrismaRedemptionReadRepository(prisma)
  const redemptionWriteRepository =
    repositories?.write || new PrismaRedemptionWriteRepository(prisma)
  const fraudCaseRepository = new PrismaFraudCaseRepository(prisma)
  const fraudCaseReadRepository = new PrismaFraudCaseReadRepository(
    prisma,
    cacheService,
  )

  // Initialize service clients (use injected ones for testing or create new ones)
  const voucherServiceClient =
    serviceClients?.voucherServiceClient || new VoucherServiceClient()
  const providerServiceClient =
    serviceClients?.providerServiceClient || new ProviderServiceClient()

  // Read handlers will be initialized inside the router factories

  // Initialize write use case handlers with crypto services
  const redeemVoucherHandler = new RedeemVoucherCommandHandler(
    redemptionWriteRepository,
    fraudCaseRepository,
    voucherServiceClient,
    providerServiceClient,
    jwtService,
    shortCodeService,
    cacheService,
  )
  const validateOfflineHandler = new ValidateOfflineRedemptionCommandHandler(
    jwtService,
    jwtKeys.publicKey,
  )
  const syncOfflineRedemptionsHandler =
    new SyncOfflineRedemptionsCommandHandler(
      redemptionWriteRepository,
      voucherServiceClient,
    )
  const reviewFraudCaseHandler = new ReviewFraudCaseCommandHandler(
    fraudCaseRepository,
    providerServiceClient,
  )

  // Controllers will be initialized inside the router factories

  // Create the Fastify server instance
  const app = await createFastifyServer({
    serviceName: 'redemption',
    port: 5002, // Redemption service port
    cacheService,
    authOptions: {
      excludePaths: ['/redemptions/validate-offline'],
    },
    idempotencyOptions: {
      enabled: true,
      defaultTTL: 86400, // 24 hours
      methods: ['POST', 'PUT'], // Only POST and PUT need idempotency
      excludeRoutes: ['/health', '/metrics', '/redemptions/validate-offline'],
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
            if (typeof cacheService.checkHealth === 'function') {
              const health = await cacheService.checkHealth()

              return health.status === 'healthy' || health.status === 'degraded'
            }
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

  // Register routers using factory pattern (like category service)
  app.register(
    createRedemptionReadRouter(redemptionReadRepository, cacheService),
    { prefix: '/redemptions' },
  )
  app.register(
    createRedemptionWriteRouter(
      {
        redeemVoucherHandler,
        validateOfflineHandler,
        syncOfflineRedemptionsHandler,
      },
      qrGenerator,
    ),
    { prefix: '/redemptions' },
  )
  app.register(createFraudReadRouter(fraudCaseReadRepository), {
    prefix: '/fraud',
  })
  app.register(createFraudWriteRouter(reviewFraudCaseHandler), {
    prefix: '/fraud',
  })

  logger.info('Unified Redemption server created successfully')

  return app
}
