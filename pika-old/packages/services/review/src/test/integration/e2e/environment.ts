/**
 * Test environment configuration values
 * Override these if needed for specific test scenarios
 */
export const testEnvironment = {
  // Default language for testing when not specified
  defaultLanguage: 'en',

  // Supported languages for testing
  supportedLanguages: ['en', 'es'],

  // Admin auth header used for admin-protected endpoints
  adminAuthHeader: { 'x-admin': 'true' },

  // Default pagination settings
  defaultPagination: {
    page: 1,
    limit: 20,
  },

  // Test timeouts
  timeouts: {
    containerStartup: 60000, // 1 minute timeout for container startup
    testOperation: 10000, // 10 seconds for individual test operations
  },

  // Test file paths
  testFiles: {
    imagePath: `${__dirname}/../fixtures/test-image.png`,
  },
}
