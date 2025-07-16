import { type ICacheService, initializeCache } from '@pika'
import { createGatewayWithServices } from '@pika/api-gateway'
import { logger } from '@pikad'
import { CACHE_DISABLED } from '@pikaonment'
import { PrismaClient } from '@prisma/client'
import {
    type Application,
    type NextFunction,
    type Request,
    type Response,
} from 'express'

import { createServiceClients } from '../../services/clients.js'
import { getServiceDefinitions } from '../../services/definitions.js'
import type { ServiceDependencies } from '../../types/index.js'
import { BaseDeploymentAdapter } from '../base.js'

export class VercelDeploymentAdapter extends BaseDeploymentAdapter {
  readonly platform = 'vercel' as const

  private prisma?: PrismaClient
  private cache?: ICacheService
  private serviceApps: Map<string, Application> = new Map()

  async initialize(): Promise<void> {
    logger.info('Initializing Vercel deployment adapter')

    // Initialize infrastructure
    await this.initializeInfrastructure()

    // Register all services
    const services = getServiceDefinitions()

    for (const service of services) {
      this.registry.register(service)
    }

    // Create service applications
    await this.createServiceApplications()
  }

  async createApp(): Promise<Application> {
    // Use API Gateway as the main application with embedded services
    // This is the industry-standard pattern for serverless deployments
    logger.info(
      'Creating API Gateway with embedded services for Vercel deployment',
    )

    // Ensure Redis is available for gateway features
    if (this.cache) {
      process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
    }

    // Create gateway app with all services embedded
    const app = await createGatewayWithServices(this.serviceApps)

    logger.info('Vercel deployment adapter configured', {
      mode: 'api-gateway-embedded',
      services: Array.from(this.serviceApps.keys()),
      features: [
        'authentication',
        'rate-limiting',
        'request-validation',
        'health-checks',
        'documentation',
        'cors',
        'compression',
      ],
    })

    return app
  }

  async startServer(_app: Application): Promise<void> {
    // In Vercel, we don't start a server - Vercel handles it
    logger.info('Vercel deployment adapter ready (serverless mode)')
  }

  protected async cleanup(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$disconnect()
    }

    if (this.cache) {
      await this.cache.disconnect()
    }
  }

  protected getDistributedServiceUrl(serviceName: string): string {
    // In Vercel, all services go through the API gateway
    const apiGatewayUrl =
      process.env.API_GATEWAY_BASE_URL || 'https://pikaapi.vercel.app'

    return `${apiGatewayUrl}/api/v1`
  }

  protected async checkDistributedService(
    serviceName: string,
  ): Promise<boolean> {
    // In monolith mode, check if service app exists
    return this.serviceApps.has(serviceName)
  }

  protected async checkInfrastructure(): Promise<{
    database: boolean
    cache: boolean
    storage: boolean
  }> {
    const results = {
      database: false,
      cache: false,
      storage: true, // Assume storage is external (S3/Blob)
    }

    try {
      // Check database
      if (this.prisma) {
        await this.prisma.$queryRaw`SELECT 1`
        results.database = true
      }
    } catch (error) {
      logger.error(error, 'Database health check failed')
    }

    try {
      // Check cache
      if (this.cache) {
        if (this.cache.checkHealth) {
          const health = await this.cache.checkHealth()

          results.cache = health.status === 'healthy'
        } else {
          // Fallback: try to set and get a test value
          const testKey = '__health_check__'

          await this.cache.set(testKey, 'test', 1)

          const value = await this.cache.get(testKey)

          results.cache = value === 'test'
        }
      }
    } catch (error) {
      logger.error(error, 'Cache health check failed')
    }

    return results
  }

  private async initializeInfrastructure(): Promise<void> {
    // Initialize Prisma
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.config.infrastructure.database.url,
        },
      },
      log:
        this.config.environment === 'development'
          ? ['query', 'error', 'warn']
          : ['error'],
    })

    // Initialize cache using the shared function that respects CACHE_DISABLED
    this.cache = await initializeCache()

    if (CACHE_DISABLED) {
      logger.info('Cache disabled for Vercel deployment - using memory cache')
    }
  }

  private async createServiceApplications(): Promise<void> {
    // Service clients will use URLs from environment variables
    // For Vercel, set all service URLs to point to the deployed API gateway
    const dependencies: ServiceDependencies = {
      prisma: this.prisma!,
      cache: this.cache!,
      services: createServiceClients(this),
    }

    for (const service of this.registry.list()) {
      try {
        const app = await service.createApp(dependencies)

        this.serviceApps.set(service.name, app)
        logger.info(`Created ${service.name} application`)
      } catch (error) {
        logger.error(error, `Failed to create ${service.name} application`)
        throw error
      }
    }
  }

  private async setupApiGateway(app: Application): Promise<void> {
    // In monolith mode, services are already mounted directly
    // We just need to set up route aliases for API Gateway paths
    const gatewayRoutes = [
      { path: '/api/v1/auth', target: '/auth' },
      { path: '/api/v1/users', target: '/users' },
      { path: '/api/v1/gyms', target: '/gyms' },
      { path: '/api/v1/sessions', target: '/sessions' },
      { path: '/api/v1/payments', target: '/payments' },
      { path: '/api/v1/subscriptions', target: '/subscriptions' },
      { path: '/api/v1/communications', target: '/communications' },
      { path: '/api/v1/social', target: '/social' },
      { path: '/api/v1/support', target: '/support' },
      { path: '/api/v1/storage', target: '/storage' },
    ]

    // Create route aliases - redirect API gateway paths to service paths
    for (const route of gatewayRoutes) {
      app.use(route.path, (req: Request, res: Response, next: NextFunction) => {
        // Rewrite the URL to point to the service path
        req.url = route.target + req.url.substring(route.path.length)
        next()
      })
    }
  }
}
