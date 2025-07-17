import { startCommunicationService } from '@communication/app.js'
import { logger } from '@pika/shared'

async function startServer(): Promise<void> {
  try {
    logger.info('Starting Communication Service...')

    const app = await startCommunicationService()

    logger.info('Communication Service started successfully')

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully')
      await app.close()
      process.exit(0)
    })

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully')
      await app.close()
      process.exit(0)
    })
  } catch (error) {
    logger.error('Failed to start Communication Service', { error })
    process.exit(1)
  }
}

// Start server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer()
}

export { startServer }
