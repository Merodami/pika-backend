import { logger } from '@pika/shared'

import { startCategoryService } from './app.js'

// Export the unified service startup function
export { startCategoryService }

// Bootstrap the Category service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startCategoryService()
    .then(() => {
      logger.info('Category Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start Category Service:', error)
      process.exit(1)
    })
}
