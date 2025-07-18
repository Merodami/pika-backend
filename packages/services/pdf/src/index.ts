import { logger } from '@pika/shared'

import { startPDFGeneratorService } from './app.js'

// Export the unified service startup function
export { startPDFGeneratorService }

// Bootstrap the PDF Generator service if this file is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  startPDFGeneratorService()
    .then(() => {
      logger.info('PDF Generator Service started successfully')
    })
    .catch((error) => {
      logger.error('Failed to start PDF Generator Service:', error)
      process.exit(1)
    })
}
