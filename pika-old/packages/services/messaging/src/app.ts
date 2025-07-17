import {
  MESSAGING_SERVER_PORT,
  REDIS_DEFAULT_TTL,
  REDIS_HOST,
  REDIS_PORT,
} from '@pika/environment'
import { startServer } from '@pika/http'
import { MemoryCacheService, RedisService, setCacheService } from '@pika/redis'
import { logger } from '@pika/shared'

import { createMessagingServer } from './server.js'

/**
 * Initialize the Redis cache service
 */
export async function initializeCache() {
  const redisService = new RedisService({
    host: REDIS_HOST,
    port: REDIS_PORT,
    defaultTTL: REDIS_DEFAULT_TTL,
  })

  try {
    await redisService.connect()
    // Set global cache service for decorators
    setCacheService(redisService)
    logger.info('Successfully connected to Redis cache')

    return redisService
  } catch (error) {
    logger.warn(
      'Failed to connect to Redis cache, will proceed without caching:',
      error,
    )

    // Use memory cache instead
    const memoryCache = new MemoryCacheService(REDIS_DEFAULT_TTL)

    await memoryCache.connect()
    setCacheService(memoryCache)
    logger.info('Using in-memory cache as fallback')

    return memoryCache
  }
}

/**
 * Start the unified Messaging service (read + write)
 */
export async function startMessagingService(options?: {
  repositories?: {
    conversationRead?: any
    messageRead?: any
    conversationWrite?: any
    messageWrite?: any
    notificationAdapter?: any
  }
}) {
  // Connect to services
  const cacheService = await initializeCache()

  // Create Fastify server using the extracted function
  const app = await createMessagingServer({
    cacheService,
    repositories: options?.repositories,
  })

  // Start the server
  await startServer(app, MESSAGING_SERVER_PORT, {
    onShutdown: async () => {
      logger.info('Shutting down unified Messaging service...')
      await cacheService.disconnect()
      logger.info('Messaging service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      // Ignore SSH2 errors in test environment
      if (
        process.env.NODE_ENV === 'test' &&
        reason &&
        reason.toString &&
        reason.toString().includes('ssh2')
      ) {
        logger.warn('Ignoring SSH2 error in test environment')

        return
      }
      logger.error('Unhandled Promise Rejection in Messaging service:', reason)
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startMessagingService()
    .then(() => {
      logger.info('Unified Messaging Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Messaging Service:', error)
      process.exit(1)
    })
}
