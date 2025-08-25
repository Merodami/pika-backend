// Load environment variables first
import '@pika/environment'

import {
  API_GATEWAY_PORT,
  CACHE_DISABLED,
  JWT_SECRET,
  NODE_ENV,
} from '@pika/environment'
import {
  authMiddleware,
  createExpressServer,
  errorMiddleware,
  startServer,
} from '@pika/http'
import { RedisService } from '@pika/redis'
import { logger } from '@pika/shared'
import type { Application, Express } from 'express'

import { loadConfig } from '../config/gateway.js'
import { handleHealthCheck } from '../health/healthCheckHandler.js'
import { createValidationRouter } from '../middleware/routeValidation.js'
import { createDocsRouter } from './routes/docsRoutes.js'
import { setupEmbeddedServices } from './routes/setupEmbeddedServices.js'
import { setupProxyRoutes } from './routes/setupProxyRoutes.js'

// Determine if running in development environment
const isLocalDev = NODE_ENV === 'development'

/**
 * Configure development request logging
 */
function setupRequestLogging(app: Express): void {
  if (!isLocalDev) return

  app.use((req, res, next) => {
    logger.info(
      {
        req: {
          method: req.method,
          url: req.url,
          path: req.path,
          originalUrl: req.originalUrl,
          hostname: req.hostname,
          remoteAddress: req.ip || req.socket?.remoteAddress || 'unknown',
          remotePort: req.socket?.remotePort,
        },
      },
      'incoming request',
    )
    next()
  })
}

/**
 * Validate JWT secret configuration
 */
function validateJWTSecret(): void {
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
}

/**
 * Initialize Redis service with fallback handling
 */
async function initializeRedis(): Promise<RedisService | undefined> {
  if (CACHE_DISABLED) {
    if (isLocalDev) {
      logger.warn('Redis disabled - using in-memory token blacklist only', {
        component: 'api-gateway',
        fallback: 'in-memory',
      })
    }

    return undefined
  }

  try {
    const redisService = new RedisService()

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

    return redisService
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

    return undefined
  }
}

/**
 * Get excluded paths for authentication middleware
 */
function getAuthExcludePaths(): string[] {
  return [
    '/health',
    '/favicon.ico',
    '/api/v1/docs',
    '/api/v1/docs/*',
    '/api/v1/public-api-docs.html',
    '/api/v1/uploads/*',
    '/openapi.json',
    '/api/v1/openapi.json',
    '/docs/openapi.json',
    '/api/docs/openapi.json',
    '/api/v1/public/openapi.json',
    '/api/v1/admin/openapi.json',
    '/api/v1/auth/token',
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
    '/api/v1/auth/verify-email/*',
    '/api/v1/auth/resend-verification',
    '/api/v1/auth/introspect',
    '/api/v1/auth/revoke',
    '/api/v1/auth/social/login',
    '/api/v1/auth/exchange-token',
  ]
}

/**
 * Configure proxy routes based on environment
 */
function configureRoutes(app: Express): void {
  if (process.env.EMBEDDED_MODE === 'true') {
    logger.info('API Gateway running in embedded mode - proxy routes disabled')
  } else {
    setupProxyRoutes(app, isLocalDev)
  }
}

/**
 * Log configuration for development
 */
function logConfiguration(): void {
  if (!isLocalDev) return

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

/**
 * Start the API Gateway server
 */
async function startGateway(): Promise<Express> {
  const config = loadConfig()
  const port = API_GATEWAY_PORT || 8000

  // Create Express server with standard configuration
  const app = await createExpressServer({
    serviceName: 'api-gateway',
    port,
    healthChecks: [],
    rateLimit: {
      max: config.rateLimit.max,
      timeWindow: `${config.rateLimit.windowMs}ms`,
    },
    skipAuthRegistration: true,
  })

  // Register custom health check handler BEFORE other routes
  app.get('/api/v1/health', handleHealthCheck)
  logger.info('Custom health check handler registered at /api/v1/health')

  // Configure middleware and services
  setupRequestLogging(app)
  validateJWTSecret()

  const redisService = await initializeRedis()

  // Handle favicon.ico requests to prevent 404 errors
  app.get('/favicon.ico', (req, res) => {
    res.status(204).end()
  })

  // Set up centralized authentication BEFORE proxy routes
  app.use(
    authMiddleware({
      cacheService: redisService,
      excludePaths: getAuthExcludePaths(),
    }),
  )

  // Configure routing
  configureRoutes(app)
  logConfiguration()

  // Set up documentation routes (after authentication)
  const docsRouter = createDocsRouter()

  app.use('/api/v1/docs', docsRouter)
  
  // Direct public API docs access
  app.get('/api/v1/public-api-docs.html', (req, res) => {
    res.redirect('/api/v1/docs/public')
  })

  // Set up common OpenAPI JSON endpoints (public APIs only)
  app.get('/openapi.json', (req, res) => {
    res.redirect(301, '/api/v1/docs/openapi/public-api.json')
  })

  app.get('/api/v1/openapi.json', (req, res) => {
    res.redirect(301, '/api/v1/docs/openapi/public-api.json')
  })

  app.get('/docs/openapi.json', (req, res) => {
    res.redirect(301, '/api/v1/docs/openapi/public-api.json')
  })

  app.get('/api/docs/openapi.json', (req, res) => {
    res.redirect(301, '/api/v1/docs/openapi/public-api.json')
  })

  // Specific API documentation endpoints
  app.get('/api/v1/public/openapi.json', (req, res) => {
    res.redirect(301, '/api/v1/docs/openapi/public-api.json')
  })

  app.get('/api/v1/admin/openapi.json', (req, res) => {
    res.redirect(301, '/api/v1/docs/openapi/admin-api.json')
  })

  if (isLocalDev) {
    logger.info('API documentation available at /api/v1/docs', {
      component: 'api-gateway',
      endpoints: [
        '/api/v1/docs - Documentation index',
        '/api/v1/docs/public - Public API docs',
        '/api/v1/docs/admin - Admin API docs',
        '/api/v1/docs/internal - Internal API docs',
        '/api/v1/docs/all - Complete API docs',
      ],
    })
  }

  // Set up validation middleware (after proxy routes)
  // This validates requests at the gateway level for non-proxied endpoints
  const validationRouter = createValidationRouter()

  app.use(validationRouter)

  // Register error middleware AFTER all routes (Express requirement)
  app.use(errorMiddleware(app.locals.errorMiddlewareConfig || {}))

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

/**
 * Create API Gateway with embedded services (for monolith deployments)
 * This is the industry-standard pattern for serverless/edge deployments
 */
export async function createGatewayWithServices(
  services: Map<string, Application>,
): Promise<Express> {
  // Set embedded mode
  process.env.EMBEDDED_MODE = 'true'

  // Create the gateway app with all standard features
  const app = await startGateway()

  // Mount services directly instead of proxying
  await setupEmbeddedServices(app, services)

  logger.info('API Gateway created with embedded services', {
    mode: 'embedded',
    services: Array.from(services.keys()),
  })

  return app
}

export { startGateway }
