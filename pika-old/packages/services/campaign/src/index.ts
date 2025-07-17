/**
 * Main entry point for the Campaign service
 * Exports the server creation function for testing and the app for production
 */

export { createCampaignServer } from './server.js'

// Start the application if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  import('./app.js')
}
