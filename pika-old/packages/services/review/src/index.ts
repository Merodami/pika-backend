import { logger } from '@pika/shared'

import { startReviewService } from './app.js'

// Export the unified service startup function
export { startReviewService }

// Bootstrap the Review service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startReviewService()
    .then(() => {
      logger.info('Review Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Review Service:', error)
      process.exit(1)
    })
}
