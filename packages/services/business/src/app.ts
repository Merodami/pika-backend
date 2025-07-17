// Import the necessary dependencies
import { PrismaClient } from '@prisma/client'
import { BUSINESS_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { initializeCache } from '@pika/redis'
import { logger, TranslationServiceClient } from '@pika/shared'

// Import the server creation function
import { createBusinessServer } from './server.js'

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
 * Initialize and start the Business service
 */
export async function startBusinessService() {
  // Connect to services
  const prisma = await initializeDatabase()
  const cacheService = await initializeCache()
  const translationServiceClient = new TranslationServiceClient()

  logger.info(`Business service starting on port: ${BUSINESS_SERVICE_PORT}`)

  // Create Express server using the extracted function
  const app = await createBusinessServer({
    prisma,
    cacheService,
    translationServiceClient,
  })

  // Start the server
  await startServer(app, BUSINESS_SERVICE_PORT, {
    onShutdown: async () => {
      logger.info('Shutting down Business service...')

      // Close database connection
      await prisma.$disconnect()

      // Close Redis connection
      await cacheService.disconnect()

      logger.info('Business service shutdown complete')
    },
    onUnhandledRejection: (reason) => {
      logger.error('Unhandled Promise Rejection in Business service:', reason)
    },
  })

  return app
}

// Only start the service if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startBusinessService()
    .then(() => {
      logger.info('Business Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Business Service:', error)
      process.exit(1)
    })
}