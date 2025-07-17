// Import the necessary dependencies
import {
  AWS_REGION,
  AWS_S3_BUCKET,
  PDF_GENERATOR_SERVER_PORT,
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
import { createPDFGeneratorServer } from './server.js'

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
 * Initialize the file storage service for PDF storage
 */
function initializeFileStorage(): FileStoragePort {
  // For PDF storage, we'll use S3 in production and local in development
  const isProduction = process.env.NODE_ENV === 'production'

  if (isProduction && AWS_S3_BUCKET && AWS_REGION) {
    logger.info(`Initializing S3 storage for PDFs`)

    return createFileStorage({
      type: 's3',
      s3: {
        bucket: AWS_S3_BUCKET,
        region: AWS_REGION,
        baseUrl: `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`,
        allowedTypes: ['application/pdf'],
        maxSize: 50 * 1024 * 1024, // 50MB for PDF books
      },
    })
  } else {
    // Create storage directory in project root
    const projectRoot = path.resolve(__dirname, '../../../..')
    const storageDir = path.join(projectRoot, 'uploads/pdf-books')

    logger.info(`Initializing local file storage in: ${storageDir}`)

    return createFileStorage({
      type: 'local',
      local: {
        storageDir,
        baseUrl: '/uploads/pdf-books',
        allowedTypes: ['application/pdf'],
        maxSize: 50 * 1024 * 1024, // 50MB for PDF books
        generateThumbnails: false,
      },
    })
  }
}

/**
 * Initialize and start the unified PDF Generator service
 * This combines both read and write capabilities
 */
export async function startPDFGeneratorService(options?: {
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
    `Unified PDF Generator service starting on port: ${PDF_GENERATOR_SERVER_PORT || 5006}`,
  )

  // Create Fastify server using the extracted function
  const app = await createPDFGeneratorServer({
    prisma,
    cacheService,
    fileStorage,
    repositories: options?.repositories,
  })

  // Start the server
  await startServer(app, PDF_GENERATOR_SERVER_PORT || 5006, {
    onShutdown: async () => {
      logger.info('Shutting down unified PDF Generator service...')

      // Close database connection
      await prisma.$disconnect()

      // Close Redis connection
      await cacheService.disconnect()

      logger.info('PDF Generator service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      logger.error(
        'Unhandled Promise Rejection in PDF Generator service:',
        reason,
      )
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startPDFGeneratorService()
    .then(() => {
      logger.info('Unified PDF Generator Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start PDF Generator Service:', error)
      process.exit(1)
    })
}
