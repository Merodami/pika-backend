// Import the necessary dependencies
import {
  REDIS_DEFAULT_TTL,
  REDIS_HOST,
  REDIS_PORT,
  REVIEW_SERVER_PORT,
} from '@pika/environment'
import { startServer } from '@pika/http'
import { MemoryCacheService, RedisService, setCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'

// Import the server creation function
import { createReviewServer } from './server.js'

/**
 * Initialize the database connection
 */
export async function initializeDatabase() {
  const prisma = new PrismaClient()

  try {
    await prisma.$queryRaw`SELECT 1`
    logger.info('Successfully connected to PostgreSQL database')

    return prisma
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL database:', error)
    throw error
  }
}

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
 * Initialize and start the unified Review service
 * This combines both read and write capabilities
 */
export async function startReviewService(options?: {
  repositories?: {
    read?: any
    write?: any
  }
}) {
  // Connect to services
  const prisma = await initializeDatabase()
  const cacheService = await initializeCache()

  logger.info(`Unified Review service starting on port: ${REVIEW_SERVER_PORT}`)

  // Create Fastify server using the extracted function
  const app = await createReviewServer({
    prisma,
    cacheService,
    repositories: options?.repositories,
  })

  // Start the server
  await startServer(app, REVIEW_SERVER_PORT, {
    onShutdown: async () => {
      logger.info('Shutting down unified Review service...')

      // Close database connection
      await prisma.$disconnect()

      // Close Redis connection
      await cacheService.disconnect()

      logger.info('Review service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      logger.error('Unhandled Promise Rejection in Review service:', reason)
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startReviewService()
    .then(() => {
      logger.info('Unified Review Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Review Service:', error)
      process.exit(1)
    })
}
