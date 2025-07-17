// Load environment variables first
import '@pika/environment'

import {
  API_GATEWAY_PORT,
  CACHE_DISABLED,
  JWT_SECRET,
  NODE_ENV,
} from '@pika/environment'
import { createFastifyServer, fastifyAuth, startServer } from '@pika/http'
import { RedisService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { FastifyInstance } from 'fastify'

import { loadConfig } from '../config/gateway.js'
import { registerServiceHealthChecks } from '../health/registerServiceHealthChecks.js'
import { setupProxyRoutes } from './routes/setupProxyRoutes.js'

// Determine if running in development environment
const isLocalDev = NODE_ENV === 'development'

/**
 * Start the API Gateway server
 */
async function startGateway(): Promise<FastifyInstance> {
  const config = loadConfig()

  // Create server with standard configuration
  const port = API_GATEWAY_PORT || 8000

  // Get health check dependencies from services
  // We need to convert each check function to always return a Promise<boolean>
  // and ensure details has the correct format
  const serviceHealthChecks = await registerServiceHealthChecks(isLocalDev)

  const healthChecks = serviceHealthChecks.map((dep) => ({
    name: dep.name,
    check: async () => {
      const result = await Promise.resolve(dep.check())

      return result
    },
    details: {
      type: dep.details?.type || 'Service',
      essential: dep.details?.essential || false,
    },
  }))

  // Create Fastify server with standard configuration
  const app = await createFastifyServer({
    serviceName: 'api-gateway',
    port,
    healthChecks,
    rateLimit: {
      max: config.rateLimit.max,
      timeWindow: `${config.rateLimit.windowMs}ms`,
    },
    // Skip auth registration - we'll register it manually with custom config
    skipAuthRegistration: true,
  })

  // Configure custom request logging
  if (app.log) {
    // Instead of trying to modify serializers directly, set up a hook for request logging
    app.addHook('onRequest', (request, reply, done) => {
      // Log the request with specific details
      app.log?.info(
        {
          req: {
            method: request.method,
            url: request.url,
            hostname: request.hostname,
            remoteAddress:
              request.ip || request.socket?.remoteAddress || 'unknown',
            remotePort: request.socket?.remotePort,
          },
        },
        'incoming request',
      )

      done()
    })
  }

  // Set up validation
  // ToDo: Remove setupValidation for now
  // setupValidation(app)

  // Validate JWT secret is properly configured
  if (!JWT_SECRET) {
    throw new Error(
      'JWT_SECRET environment variable is required for API Gateway authentication',
    )
  }

  if (JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security',
    )
  }

  // Initialize Redis for session management and token blacklisting
  let redisService: RedisService | undefined

  try {
    if (!CACHE_DISABLED) {
      redisService = new RedisService()
      await redisService.connect()

      if (isLocalDev) {
        logger.info(
          'Redis connected for session management and token blacklisting',
          {
            component: 'api-gateway',
            service: 'redis',
          },
        )
      }
    } else {
      if (isLocalDev) {
        logger.warn('Redis disabled - using in-memory token blacklist only', {
          component: 'api-gateway',
          fallback: 'in-memory',
        })
      }
    }
  } catch (error) {
    if (isLocalDev) {
      logger.warn(
        'Redis connection failed - using in-memory token blacklist fallback',
        error as Error,
        {
          component: 'api-gateway',
          fallback: 'in-memory',
        },
      )
    }
    redisService = undefined
  }

  // Set up centralized authentication (before proxy routes)
  await app.register(fastifyAuth, {
    secret: JWT_SECRET,
    cacheService: redisService,
    excludePaths: [
      '/health',
      '/docs',
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/exchange-token',
    ],
  })

  if (isLocalDev) {
    logger.info('Centralized authentication enabled at API Gateway level', {
      component: 'api-gateway',
      feature: 'auth',
    })
    logger.info('Public endpoints configured', {
      component: 'api-gateway',
      endpoints: [
        '/health',
        '/docs',
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/forgot-password',
        '/api/v1/auth/reset-password',
      ],
    })
  }

  // Set up proxy routes (after authentication middleware)
  await setupProxyRoutes(app, isLocalDev)

  // Start the server
  await startServer(app, port, {
    onShutdown: async () => {
      logger.info('API Gateway shutdown complete', {
        component: 'api-gateway',
        event: 'shutdown',
      })
    },
    onUnhandledRejection: (reason) => {
      logger.error(
        'Unhandled Promise Rejection in API Gateway',
        reason as Error,
        {
          component: 'api-gateway',
          event: 'unhandled-rejection',
        },
      )
    },
  })

  return app
}

// Auto-start in development mode
if (isLocalDev) {
  startGateway().catch((error) => {
    logger.error('Failed to start API Gateway', error as Error, {
      component: 'api-gateway',
      event: 'startup-failure',
    })

    process.exit(1)
  })
}

export { startGateway }
