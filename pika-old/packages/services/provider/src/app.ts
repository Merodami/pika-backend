// Import the necessary dependencies
import {
  PROVIDER_SERVER_PORT,
  REDIS_DEFAULT_TTL,
  REDIS_HOST,
  REDIS_PORT,
} from '@pika/environment'
import { startServer } from '@pika/http'
import { MemoryCacheService, RedisService, setCacheService } from '@pika/redis'
import { createFileStorage, FileStoragePort, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { fileURLToPath } from 'url'

// Import the server creation function
import { createProviderServer } from './server.js'

// Get the directory name for the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
 * Initialize the file storage service
 */
function initializeFileStorage(): FileStoragePort {
  // Create storage directory in project root
  const projectRoot = path.resolve(__dirname, '../../../..')
  const storageDir = path.join(projectRoot, 'uploads')

  logger.info(`Initializing local file storage in: ${storageDir}`)

  // Use the shared file storage implementation
  return createFileStorage({
    type: 'local',
    local: {
      storageDir,
      baseUrl: '/uploads', // URL path for accessing files
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        'image/webp',
        'image/gif',
      ],
      maxSize: 5 * 1024 * 1024, // 5MB
      generateThumbnails: false,
    },
  })
}

/**
 * Initialize and start the unified Provider service
 * This combines both read and write capabilities
 */
export async function startProviderService(options?: {
  repositories?: {
    read?: any
    write?: any
  }
}) {
  // Connect to services
  const prisma = await initializeDatabase()
  const cacheService = await initializeCache()
  const fileStorage = initializeFileStorage()

  logger.info(
    `Unified Provider service starting on port: ${PROVIDER_SERVER_PORT}`,
  )

  // Create Fastify server using the extracted function
  const app = await createProviderServer({
    prisma,
    cacheService,
    fileStorage,
    repositories: options?.repositories,
  })

  // Start the server
  await startServer(app, PROVIDER_SERVER_PORT, {
    onShutdown: async () => {
      logger.info('Shutting down unified Provider service...')

      // Close database connection
      await prisma.$disconnect()

      // Close Redis connection
      await cacheService.disconnect()

      logger.info('Provider service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      logger.error('Unhandled Promise Rejection in Provider service:', reason)
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startProviderService()
    .then(() => {
      logger.info('Unified Provider Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Provider Service:', error)
      process.exit(1)
    })
}
