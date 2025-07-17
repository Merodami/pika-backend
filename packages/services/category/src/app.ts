import { PrismaClient } from '@prisma/client'
import { CATEGORY_SERVICE_PORT } from '@pika/environment'
import { startServer } from '@pika/http'
import { type ICacheService, initializeCache } from '@pika/redis'
import { logger } from '@pika/shared'

import { createCategoryServer } from './server.js'

async function initializeDatabase(): Promise<PrismaClient> {
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

export async function startCategoryService(): Promise<void> {
  let prisma: PrismaClient | undefined
  let cacheService: ICacheService | undefined

  try {
    // Initialize dependencies
    prisma = await initializeDatabase()
    cacheService = await initializeCache()

    const { app } = await createCategoryServer({
      prisma,
      cacheService,
    })

    // Start the server
    await startServer(app, CATEGORY_SERVICE_PORT, {
      onShutdown: async () => {
        logger.info('Shutting down Category service...')
        await prisma?.$disconnect()
        await cacheService?.disconnect()
        logger.info('Category service shutdown complete')
      },
      onUnhandledRejection: (reason) => {
        logger.error('Unhandled Promise Rejection in Category service:', reason)
      },
    })
  } catch (error) {
    logger.error('Failed to start category service', error)

    // Cleanup on startup failure
    await prisma?.$disconnect()
    await cacheService?.disconnect()

    throw error
  }
}