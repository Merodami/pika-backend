import { CAMPAIGN_SERVER_PORT, REDIS_HOST, REDIS_PORT } from '@pika/environment'
import { MemoryCacheService, RedisService } from '@pika/redis'
import { createFileStorage } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import closeWithGrace from 'close-with-grace'
import path from 'path'
import { fileURLToPath } from 'url'

import { createCampaignServer } from './server.js'

// Get the directory name for the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Application entry point for Campaign service
 * Sets up all dependencies and starts the server
 */
async function startServer() {
  let app: any = null

  try {
    // Initialize database connection
    const prisma = new PrismaClient()

    // Initialize cache service
    const cacheService =
      REDIS_HOST && REDIS_PORT
        ? new RedisService({ host: REDIS_HOST, port: REDIS_PORT })
        : new MemoryCacheService()

    // Initialize file storage (following category service pattern)
    const projectRoot = path.resolve(__dirname, '../../../..')
    const storageDir = path.join(projectRoot, 'uploads')

    const fileStorage = createFileStorage({
      type: 'local',
      local: {
        storageDir,
        baseUrl: '/uploads',
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

    // Create and configure the server
    app = await createCampaignServer({
      prisma,
      cacheService,
      fileStorage,
    })

    // Start the server
    await app.listen({
      port: CAMPAIGN_SERVER_PORT,
      host: '0.0.0.0',
    })

    console.log(`Campaign service started on port ${CAMPAIGN_SERVER_PORT}`)
  } catch (error) {
    console.error('Failed to start Campaign service:', error)
    process.exit(1)
  }

  // Graceful shutdown handling
  const closeListeners = closeWithGrace(
    { delay: 500 },
    async function ({ signal, err }) {
      if (err) {
        console.error('Server error during shutdown:', err)
      }

      console.log(
        `Received ${signal}, gracefully shutting down Campaign service...`,
      )

      if (app) {
        await app.close()
      }

      console.log('Campaign service shut down complete')
    },
  )

  // Handle any additional cleanup
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception in Campaign service:', err)
    closeListeners.close()
  })

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection in Campaign service:', {
      reason,
      promise,
    })
    closeListeners.close()
  })
}

startServer().catch((error) => {
  console.error('Failed to start Campaign service:', error)
  process.exit(1)
})
