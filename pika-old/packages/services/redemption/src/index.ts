import { logger } from '@pika/shared'

import { startRedemptionService } from './app.js'

// Export the unified service startup function
export { startRedemptionService }

// Bootstrap the Redemption service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startRedemptionService()
    .then(() => {
      logger.info('Redemption Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Redemption Service:', error)
      process.exit(1)
    })
}
