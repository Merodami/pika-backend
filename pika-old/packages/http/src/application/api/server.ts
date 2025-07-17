import fastifyAccepts from '@fastify/accepts'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'
import { requestContextPlugin } from '@http/infrastructure/fastify/middleware/requestContext.js'
import { createValidatorCompiler } from '@http/infrastructure/fastify/validation/validation.js'
// Using @fastify/accepts directly for content negotiation
import {
  JWT_SECRET,
  NODE_ENV,
  RATE_LIMIT_ENABLE,
  RATE_LIMIT_MAX,
} from '@pika/environment'
import { logger } from '@pika/shared'
import closeWithGrace from 'close-with-grace'
import Fastify, { FastifyInstance } from 'fastify'

import { ServerOptions } from '../../domain/types/server.js'
import { fastifyAuth } from '../../infrastructure/fastify/middleware/auth.js'
import { fastifyErrorMiddleware } from '../../infrastructure/fastify/middleware/errorHandler.js'
import { idempotencyPlugin } from '../../infrastructure/fastify/middleware/idempotency.js'
import { setupServiceHealthCheck } from './healthCheck.js'
/**
 * Creates and configures a Fastify server with standard middleware and configuration.
 *
 * @param options - Server configuration options
 * @returns Configured Fastify instance
 */
export async function createFastifyServer(
  options: ServerOptions,
): Promise<FastifyInstance> {
  const validatorCompiler = createValidatorCompiler()

  // Initialize the Fastify application with enterprise-grade configuration
  const app = Fastify({
    logger:
      NODE_ENV === 'test'
        ? false
        : {
            transport: {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            },
          },
    trustProxy: true,
    disableRequestLogging: NODE_ENV === 'production' || NODE_ENV === 'test',
    ajv: {
      customOptions: {
        // This is where you can pass options to the AJV instance,
        // but since we control the instance in validation.ts, this isn't strictly needed
        // unless you want to override something.
      },
    },
  }).withTypeProvider<TypeBoxTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)

  // Add cache service to the app instance if provided
  if (options.cacheService) {
    app.decorate('cacheService', options.cacheService)
  }

  // Register core plugins
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: NODE_ENV === 'production',
  })

  await app.register(fastifyCors, {
    exposedHeaders: ['Date', 'Content-Disposition'],
  })

  // Register rate limiting plugin only if enabled
  if (RATE_LIMIT_ENABLE) {
    await app.register(fastifyRateLimit, {
      max: options.rateLimit?.max || RATE_LIMIT_MAX,
      timeWindow: options.rateLimit?.timeWindow || '1 minute',
    })
  }

  // Register authentication plugin (unless explicitly skipped)
  if (!options.skipAuthRegistration) {
    // Default paths that should always be excluded from authentication
    const defaultExcludePaths = [
      '/health',
      '/health/details',
      '/auth/*', // All auth endpoints should be public
    ]

    // Combine default exclude paths with any additional ones from options
    const excludePaths = [
      ...defaultExcludePaths,
      ...(options.authOptions?.excludePaths || []),
    ]

    await app.register(fastifyAuth, {
      secret: options.jwtSecret || JWT_SECRET,
      excludePaths,
      cacheService: options.cacheService,
    })
  }

  // Setup health check endpoints
  setupServiceHealthCheck(app, options.healthChecks, {
    serviceName: options.serviceName,
  })

  // Register request context plugin
  app.register(requestContextPlugin)

  // Register idempotency plugin (after auth but before routes)
  if (options.idempotencyOptions && options.cacheService) {
    await app.register(idempotencyPlugin, {
      enabled: true, // Default to enabled if idempotencyOptions is provided
      ...options.idempotencyOptions,
      cacheService: options.cacheService,
      keyPrefix: options.idempotencyOptions.keyPrefix || options.serviceName,
    })
  }

  // Register error middleware
  app.register(fastifyErrorMiddleware, {
    enableStackTrace: NODE_ENV !== 'production',
  })

  // Register @fastify/accepts for content negotiation via HTTP headers
  // This provides request.accepts() and other content negotiation methods
  // See: https://github.com/fastify/fastify-accepts
  if (options.languageOptions) {
    await app.register(fastifyAccepts)
  }

  return app
}

/**
 * Starts the server and sets up graceful shutdown
 *
 * @param app - Configured Fastify instance
 * @param port - Port to listen on
 * @param shutdownHandlers - Custom shutdown handlers
 */
export async function startServer(
  app: FastifyInstance,
  port: number,
  shutdownHandlers?: {
    onShutdown?: () => Promise<void>
    onUnhandledRejection?: (reason: any) => void
  },
): Promise<void> {
  try {
    await app.listen({ port, host: '0.0.0.0' })

    logger.info(`App listening on port ${port}`)
    logger.info(`Health check available at http://localhost:${port}/health`)
  } catch (err) {
    logger.error('Error starting server:', err)
    process.exit(1)
  }

  // Configure graceful shutdown to close connections gracefully.
  closeWithGrace(
    {
      delay: 10000,
    },
    async ({ signal, err }) => {
      if (err) {
        logger.error(`Error during shutdown: ${err.message}`)
      }

      // Handle undefined signal in test environments
      if (signal) {
        logger.info(`Received ${signal}, shutting down gracefully`)
      } else {
        logger.info('Shutting down gracefully')
      }

      // Close Fastify server first to stop accepting new connections
      await app.close()
      logger.info('Server closed')

      // Execute custom shutdown logic if provided
      if (shutdownHandlers?.onShutdown) {
        await shutdownHandlers.onShutdown()
      }

      logger.info('Server gracefully shut down.')
    },
  )

  // Set up unhandled rejection handler
  process.on('unhandledRejection', (reason) => {
    if (shutdownHandlers?.onUnhandledRejection) {
      shutdownHandlers.onUnhandledRejection(reason)
    } else {
      logger.error(`Unhandled Promise Rejection: ${reason}`)
    }
  })
}
