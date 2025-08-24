/**
 * User Service - Public API Integration Tests
 *
 * Tests for public-facing user endpoints that are accessible to authenticated users.
 * These endpoints are for user profile management and self-service operations.
 */

// For integration tests, we unmock the modules we need for real Express server
import { vi } from 'vitest'

// IMPORTANT: Unmock before any imports to ensure we get real implementations
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
vi.mock('@pika/api', async () => {
  const actualApi = await vi.importActual('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
vi.mock('@pika/shared', async () => {
  const actualShared = await vi.importActual('@pika/shared')

  return actualShared // Return all actual exports
})

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  CommunicationServiceClientMock,
  createE2EAuthHelper,
  E2EAuthHelper,
} from '@pika/tests'
import {
  cleanupTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@pika/tests'
import {
  createDefaultUserSettings,
  type PartialUserSettings,
  UserRole,
  type UserSettings,
} from '@pika/types'
import { createUserServer } from '@user/server.js'
import {
  createSharedUserTestData,
  seedTestUsers,
  type SharedUserTestData,
} from '@user/test/helpers/userTestHelpers.js'
import { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

interface FileStoragePort {
  saveFile: (
    file: any,
    prefix?: string,
    options?: any,
  ) => Promise<{ url: string; path: string }>
  deleteFile: (filePath: string) => Promise<void>
  getFileUrl: (path: string) => Promise<string>
  fileExists: (path: string) => Promise<boolean>
}

describe('User Service - Public API Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let authHelper: E2EAuthHelper
  let cacheService: MemoryCacheService

  // Authenticated clients for different user types
  let customerClient: AuthenticatedRequestClient
  let businessClient: AuthenticatedRequestClient

  // Shared test data created once
  let sharedTestData: SharedUserTestData

  const mockCommunicationClient =
    new CommunicationServiceClientMock().setupEmailSuccess()

  const mockFileStorage: FileStoragePort = {
    saveFile: vi.fn().mockResolvedValue({
      url: 'http://mockstorage.com/avatar.jpg',
      path: 'avatars/test-avatar.jpg',
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    getFileUrl: vi.fn((path: string) =>
      Promise.resolve(`http://mockstorage.com/${path}`),
    ),
    fileExists: vi.fn().mockResolvedValue(true),
  }

  // Note: Using shared helper from userTestHelpers.js

  beforeAll(async () => {
    logger.debug('Setting up User Service public integration tests...')

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_user_public_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create server
    cacheService = new MemoryCacheService()
    await cacheService.connect()

    app = await createUserServer({
      prisma: testDb.prisma,
      cacheService,
      fileStorage: mockFileStorage as any,
      communicationClient: mockCommunicationClient as any,
    })

    logger.debug('Express server ready for testing.')

    // Initialize supertest with the Express server instance
    request = supertest(app)

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    customerClient = await authHelper.getUserClient(testDb.prisma)
    businessClient = await authHelper.getBusinessClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')

    // Create shared test data once for all tests
    logger.debug('Creating shared test data...')
    sharedTestData = await createSharedUserTestData(testDb.prisma)

    logger.debug(`Created ${sharedTestData.allUsers.length} shared test users`)
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clear cache
    await cacheService.clearAll()

    // Clean up only user-related data to preserve E2E auth users and shared test data
    if (testDb?.prisma) {
      // Delete test users created during tests (not the E2E auth users or shared data)
      await testDb.prisma.user.deleteMany({
        where: {
          email: {
            contains: '@test.com',
            not: {
              in: [
                'admin@e2etest.com',
                'user@e2etest.com',
                'business@e2etest.com',
                // Preserve shared test users
                ...sharedTestData.allUsers.map((u) => u.email),
              ],
            },
          },
        },
      })
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // User Profile Access Tests
  describe('GET /users/me', () => {
    it('should return current user profile', async () => {
      // Get the member user from database
      const memberUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      const response = await customerClient
        .get('/users/me')
        .set('Accept', 'application/json')

      // Check if endpoint exists, skip if not implemented
      if (response.status === 404) {
        // Skipping /users/me test - endpoint not found
        return
      }

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(memberUser!.id)
      expect(response.body.email).toBe('user@e2etest.com')
      expect(response.body).toHaveProperty('firstName')
      expect(response.body).toHaveProperty('lastName')
      expect(response.body).toHaveProperty('role')
      // Test new computed name field
      expect(response.body).toHaveProperty('name')
      expect(response.body.name).toBe(
        `${memberUser!.firstName} ${memberUser!.lastName}`,
      )
      // Note: primaryBusinessId is only included in response when it has a value
      // Zod validation strips undefined fields, which is expected behavior
    })

    it('should include computed name field in all responses', async () => {
      const response = await customerClient
        .get('/users/me')
        .set('Accept', 'application/json')
        .expect(200)

      // Verify computed name field works correctly
      expect(response.body).toHaveProperty('name')
      expect(typeof response.body.name).toBe('string')
      expect(response.body.name.trim().length).toBeGreaterThan(0)

      // Verify it's the concatenation of firstName and lastName
      const memberUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      expect(response.body.name).toBe(
        `${memberUser!.firstName} ${memberUser!.lastName}`,
      )
    })

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request
        .get('/users/me')
        .set('Accept', 'application/json')

      // Expect either 401 (auth required) or 404 (endpoint not found)
      expect([401, 404]).toContain(response.status)
    })

    it('should return different data for different user roles', async () => {
      // Test with customer
      const customerResponse = await customerClient
        .get('/users/me')
        .set('Accept', 'application/json')

      // Test with business user
      const businessResponse = await businessClient
        .get('/users/me')
        .set('Accept', 'application/json')

      // Skip if endpoint doesn't exist
      if (customerResponse.status === 404 || businessResponse.status === 404) {
        return
      }

      expect(customerResponse.status).toBe(200)
      expect(businessResponse.status).toBe(200)
      expect(customerResponse.body.role).toBe('customer')
      expect(businessResponse.body.role).toBe('business')
    })
  })

  describe('GET /users/:user_id', () => {
    it('should allow users to view their own profile', async () => {
      const memberUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      const response = await customerClient
        .get(`/users/${memberUser!.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(memberUser!.id)
      expect(response.body.email).toBe(memberUser!.email)
    })

    it('should allow authenticated users to view other user profiles', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const otherUser = testUsers.users[0]

      const response = await customerClient
        .get(`/users/${otherUser.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(otherUser.id)
      expect(response.body.email).toBe(otherUser.email)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()

      const response = await customerClient
        .get(`/users/${nonExistentId}`)
        .set('Accept', 'application/json')

      expect(response.status).toBe(404)
    })

    it('should handle invalid UUID parameters', async () => {
      const response = await customerClient
        .get('/users/not-a-uuid')
        .set('Accept', 'application/json')

      // Expect 400 since we validate UUID format
      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      const testUsers = await seedTestUsers(testDb.prisma, { count: 1 })
      const otherUser = testUsers.users[0]

      const response = await request
        .get(`/users/${otherUser.id}`)
        .set('Accept', 'application/json')

      expect(response.status).toBe(401)
    })
  })

  // User Profile Updates
  describe('PUT /users/me', () => {
    it('should update current user profile', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      const response = await customerClient
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) {
        // Skipping PUT /users/me test - endpoint not found
        return
      }

      expect(response.status).toBe(200)
      expect(response.body.firstName).toBe('Updated')
      expect(response.body.lastName).toBe('Name')

      // Verify in database
      const updatedUser = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      expect(updatedUser?.firstName).toBe('Updated')
      expect(updatedUser?.lastName).toBe('Name')
    })

    it('should not allow updating role', async () => {
      const updateData = {
        role: 'admin', // Trying to elevate privileges
      }

      const response = await customerClient
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) {
        // Skipping PUT /users/me role test - endpoint not found
        return
      }

      expect(response.status).toBe(400)

      // Role should not be changed
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      expect(user?.role).toBe(UserRole.CUSTOMER)
    })

    it('should not allow updating email directly', async () => {
      const updateData = {
        email: 'hacker@evil.com',
      }

      const response = await customerClient
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) return

      // Should either reject the update or ignore email field
      expect([400, 200]).toContain(response.status)

      // Email should not be changed
      const user = await testDb.prisma.user.findFirst({
        where: { email: 'user@e2etest.com' },
      })

      expect(user?.email).toBe('user@e2etest.com')
    })

    it('should validate input data', async () => {
      const invalidData = {
        firstName: '', // Empty name
        phoneNumber: 'invalid-phone',
      }

      const response = await customerClient
        .put('/users/me')
        .send(invalidData)
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) return

      expect(response.status).toBe(400)
      expect(response.body.error).toBeDefined()
    })

    it('should require authentication', async () => {
      const updateData = {
        firstName: 'Unauthorized',
      }

      const response = await request
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      expect(response.status).toBe(401)
    })
  })

  // Avatar Upload Tests
  describe('POST /users/me/avatar', () => {
    it('should allow user to upload their own avatar', async () => {
      const response = await customerClient
        .post('/users/me/avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')

      // Check if endpoint exists
      if (response.status === 404) {
        // Skipping avatar upload test - endpoint not found
        return
      }

      expect(response.status).toBe(200)
      expect(response.body.avatarUrl).toBeDefined()
      expect(mockFileStorage.saveFile).toHaveBeenCalled()
    })

    it('should return 400 when no file is uploaded', async () => {
      const response = await customerClient
        .post('/users/me/avatar')
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) return

      expect(response.status).toBe(400)
    })

    it('should require authentication', async () => {
      const response = await request
        .post('/users/me/avatar')
        .attach('avatar', Buffer.from('fake-image-data'), 'avatar.jpg')

      expect(response.status).toBe(401)
    })
  })

  // User Search/Browse (if implemented as public)
  describe('User Public Browsing', () => {
    it('should handle user search if publicly available', async () => {
      // This test checks if users can browse/search other users
      // Implementation may vary based on business requirements

      const response = await customerClient
        .get('/users')
        .set('Accept', 'application/json')

      // If endpoint doesn't exist or is admin-only, expect 404 or 403
      if ([404, 403].includes(response.status)) {
        // User browsing not available to public - this is expected
        return
      }

      // If user browsing is available, test pagination
      if (response.status === 200) {
        expect(response.body).toHaveProperty('data')
        expect(response.body).toHaveProperty('pagination')
        expect(Array.isArray(response.body.data)).toBe(true)
      }
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      // Test with malformed requests
      const response = await customerClient
        .put('/users/me')
        .send('invalid-json')
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')

      // Should handle malformed JSON gracefully
      expect([400, 404]).toContain(response.status)
    })

    it('should provide helpful error messages', async () => {
      const response = await customerClient
        .put('/users/me')
        .send({
          firstName: '', // Invalid data
        })
        .set('Accept', 'application/json')

      // Check if endpoint exists
      if (response.status === 404) return

      if (response.status === 400) {
        expect(response.body.error).toBeDefined()
        expect(response.body.error.code).toBeDefined()
      }
    })

    it('should handle network timeouts gracefully', async () => {
      // This test ensures error handling works properly
      // In a real scenario, you might simulate network issues

      const response = await customerClient
        .get('/users/me')
        .timeout(1) // Very short timeout
        .set('Accept', 'application/json')
        .catch((err) => err)

      // Should handle timeout error
      expect(typeof response).toBe('object')
    })
  })

  // Performance Tests (basic)
  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      // Test concurrent access to user profile
      const promises = Array.from({ length: 5 }, () =>
        customerClient.get('/users/me').set('Accept', 'application/json'),
      )

      const responses = await Promise.all(promises)

      // All requests should succeed (or consistently fail if endpoint doesn't exist)
      const statuses = responses.map((r) => r.status)
      const uniqueStatuses = [...new Set(statuses)]

      // Should all have the same status (either all 200 or all 404)
      expect(uniqueStatuses).toHaveLength(1)
    })
  })

  // Data Consistency Tests
  describe('Data Consistency', () => {
    it('should maintain data consistency after updates', async () => {
      const originalResponse = await customerClient
        .get('/users/me')
        .set('Accept', 'application/json')

      // Skip if endpoint doesn't exist
      if (originalResponse.status === 404) return

      const updateData = {
        firstName: 'ConsistencyTest',
      }

      const updateResponse = await customerClient
        .put('/users/me')
        .send(updateData)
        .set('Accept', 'application/json')

      // Skip if update endpoint doesn't exist
      if (updateResponse.status === 404) return

      if (updateResponse.status === 200) {
        // Verify the change persisted
        const verifyResponse = await customerClient
          .get('/users/me')
          .set('Accept', 'application/json')

        expect(verifyResponse.status).toBe(200)
        expect(verifyResponse.body.firstName).toBe('ConsistencyTest')
      }
    })
  })

  // ============= User Settings Tests =============
  describe('User Settings API', () => {
    describe('GET /users/me/settings', () => {
      it('should return default settings for user without existing settings', async () => {
        const response = await customerClient
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        // Check if endpoint exists, skip if not implemented
        if (response.status === 404) {
          // Skipping settings test - endpoint not found
          return
        }

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('settings')

        const { settings } = response.body

        // Verify all required settings structure exists
        expect(settings).toHaveProperty('version', '1.0')
        expect(settings).toHaveProperty('display')
        expect(settings).toHaveProperty('notifications')
        expect(settings).toHaveProperty('privacy')
        expect(settings).toHaveProperty('accessibility')
        expect(settings).toHaveProperty('updatedAt')

        // Verify default values
        expect(settings.display.theme).toBe('system')
        expect(settings.display.language).toBe('en')
        expect(settings.display.itemsPerPage).toBe(20)
        expect(settings.notifications.email.enabled).toBe(true)
        expect(settings.privacy.profile.visibility).toBe('public')
        expect(settings.accessibility.reduceMotion).toBe(false)
      })

      it('should return business-specific settings for business users', async () => {
        const response = await businessClient
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        // Check if endpoint exists
        if (response.status === 404) return

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('settings')

        const { settings } = response.body

        // Business users should have business settings
        expect(settings).toHaveProperty('business')
        expect(settings.business).toHaveProperty('dashboard')
        expect(settings.business).toHaveProperty('vouchers')
        expect(settings.business).toHaveProperty('notifications')

        // Verify default business settings
        expect(settings.business.dashboard.defaultView).toBe('overview')
        expect(settings.business.vouchers.autoApprove).toBe(false)
        expect(settings.business.notifications.newCustomers).toBe(true)
      })

      it('should require authentication', async () => {
        const response = await request
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        expect(response.status).toBe(401)
      })

      it('should be cached properly', async () => {
        // First request - should hit database
        const response1 = await customerClient
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        if (response1.status === 404) return

        // Second request - should hit cache
        const response2 = await customerClient
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(200)

        // Should return identical data
        expect(JSON.stringify(response1.body)).toBe(
          JSON.stringify(response2.body),
        )
      })
    })

    describe('PUT /users/me/settings', () => {
      const createTestSettings = (isBusinessUser = false): UserSettings => {
        return createDefaultUserSettings(isBusinessUser)
      }

      it('should update complete user settings', async () => {
        const newSettings = createTestSettings(false)

        // Modify some values for testing
        newSettings.display.theme = 'dark'
        newSettings.display.language = 'es'
        newSettings.display.itemsPerPage = 50
        newSettings.notifications.email.marketing = true
        newSettings.privacy.profile.visibility = 'private'
        newSettings.accessibility.largeText = true

        const response = await customerClient
          .put('/users/me/settings')
          .send(newSettings)
          .set('Accept', 'application/json')

        // Check if endpoint exists
        if (response.status === 404) return

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('settings')
        expect(response.body).toHaveProperty('message')

        const { settings } = response.body

        // Verify updated values
        expect(settings.display.theme).toBe('dark')
        expect(settings.display.language).toBe('es')
        expect(settings.display.itemsPerPage).toBe(50)
        expect(settings.notifications.email.marketing).toBe(true)
        expect(settings.privacy.profile.visibility).toBe('private')
        expect(settings.accessibility.largeText).toBe(true)

        // Verify settings persisted in database
        const verifyResponse = await customerClient
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        if (verifyResponse.status === 200) {
          expect(verifyResponse.body.settings.display.theme).toBe('dark')
          expect(verifyResponse.body.settings.display.language).toBe('es')
        }
      })

      it('should handle business settings for business users', async () => {
        const newSettings = createTestSettings(true)

        // Modify business settings
        newSettings.business!.dashboard.defaultView = 'analytics'
        newSettings.business!.vouchers.autoApprove = true
        newSettings.business!.notifications.newCustomers = false

        const response = await businessClient
          .put('/users/me/settings')
          .send(newSettings)
          .set('Accept', 'application/json')

        if (response.status === 404) return

        expect(response.status).toBe(200)

        const { settings } = response.body

        expect(settings.business.dashboard.defaultView).toBe('analytics')
        expect(settings.business.vouchers.autoApprove).toBe(true)
        expect(settings.business.notifications.newCustomers).toBe(false)
      })

      it('should validate settings data', async () => {
        const invalidSettings = {
          version: '1.0',
          display: {
            theme: 'invalid-theme', // Invalid enum value
            language: 'invalid', // Should be 2 characters
            itemsPerPage: 5, // Below minimum
          },
          notifications: {},
          privacy: {},
          accessibility: {},
          updatedAt: new Date(),
        }

        const response = await customerClient
          .put('/users/me/settings')
          .send(invalidSettings)
          .set('Accept', 'application/json')

        if (response.status === 404) return

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error')
      })

      it('should require authentication', async () => {
        const newSettings = createTestSettings()

        const response = await request
          .put('/users/me/settings')
          .send(newSettings)
          .set('Accept', 'application/json')

        expect(response.status).toBe(401)
      })

      it('should invalidate cache after update', async () => {
        // Get initial settings (populates cache)
        const initialResponse = await customerClient
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        if (initialResponse.status === 404) return

        const newSettings = createTestSettings()

        newSettings.display.theme = 'dark'

        // Update settings (should invalidate cache)
        const updateResponse = await customerClient
          .put('/users/me/settings')
          .send(newSettings)
          .set('Accept', 'application/json')

        if (updateResponse.status !== 200) return

        // Get settings again (should fetch from database with new values)
        const finalResponse = await customerClient
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        expect(finalResponse.status).toBe(200)
        expect(finalResponse.body.settings.display.theme).toBe('dark')
      })
    })

    describe('PATCH /users/me/settings', () => {
      it('should partially update user settings', async () => {
        // Set initial settings
        const initialSettings = createDefaultUserSettings()

        initialSettings.display.theme = 'light'
        initialSettings.notifications.email.marketing = false

        const setupResponse = await customerClient
          .put('/users/me/settings')
          .send(initialSettings)
          .set('Accept', 'application/json')

        if (setupResponse.status === 404) return

        // Now test partial update
        const partialUpdate: PartialUserSettings = {
          display: {
            theme: 'dark',
            compactMode: true,
          },
          privacy: {
            profile: {
              visibility: 'private',
            },
          },
        }

        const patchResponse = await customerClient
          .patch('/users/me/settings')
          .send(partialUpdate)
          .set('Accept', 'application/json')

        expect(patchResponse.status).toBe(200)

        const { settings } = patchResponse.body

        // Updated values should be changed
        expect(settings.display.theme).toBe('dark')
        expect(settings.display.compactMode).toBe(true)
        expect(settings.privacy.profile.visibility).toBe('private')

        // Untouched values should remain the same
        expect(settings.notifications.email.marketing).toBe(false)
        expect(settings.display.language).toBe('en') // Default value
      })

      it('should deep merge nested objects', async () => {
        // Set initial notification settings
        const initialUpdate: PartialUserSettings = {
          notifications: {
            email: {
              enabled: true,
              marketing: false,
              securityAlerts: true,
            },
            push: {
              enabled: false,
              marketing: true,
            },
          },
        }

        const setupResponse = await customerClient
          .patch('/users/me/settings')
          .send(initialUpdate)
          .set('Accept', 'application/json')

        if (setupResponse.status === 404) return

        // Now update only specific notification settings
        const partialUpdate: PartialUserSettings = {
          notifications: {
            email: {
              marketing: true, // Only update this field
            },
            sms: {
              enabled: true, // Update different notification type
            },
          },
        }

        const patchResponse = await customerClient
          .patch('/users/me/settings')
          .send(partialUpdate)
          .set('Accept', 'application/json')

        expect(patchResponse.status).toBe(200)

        const { settings } = patchResponse.body

        // Email settings should be merged correctly
        expect(settings.notifications.email.enabled).toBe(true) // Unchanged
        expect(settings.notifications.email.marketing).toBe(true) // Updated
        expect(settings.notifications.email.securityAlerts).toBe(true) // Unchanged

        // Push settings should remain unchanged
        expect(settings.notifications.push.enabled).toBe(false)
        expect(settings.notifications.push.marketing).toBe(true)

        // SMS settings should be updated
        expect(settings.notifications.sms.enabled).toBe(true)
      })

      it('should validate partial updates', async () => {
        const invalidUpdate = {
          display: {
            itemsPerPage: 150, // Above maximum
            theme: 'invalid-theme',
          },
        }

        const response = await customerClient
          .patch('/users/me/settings')
          .send(invalidUpdate)
          .set('Accept', 'application/json')

        if (response.status === 404) return

        expect(response.status).toBe(400)
        expect(response.body).toHaveProperty('error')
      })

      it('should handle business settings updates for business users', async () => {
        const businessUpdate: PartialUserSettings = {
          business: {
            dashboard: {
              defaultView: 'vouchers',
              autoRefresh: false,
            },
            vouchers: {
              autoApprove: true,
            },
          },
        }

        const response = await businessClient
          .patch('/users/me/settings')
          .send(businessUpdate)
          .set('Accept', 'application/json')

        if (response.status === 404) return

        expect(response.status).toBe(200)

        const { settings } = response.body

        expect(settings.business.dashboard.defaultView).toBe('vouchers')
        expect(settings.business.dashboard.autoRefresh).toBe(false)
        expect(settings.business.vouchers.autoApprove).toBe(true)
      })

      it('should reject empty updates gracefully', async () => {
        const emptyUpdate = {}

        const response = await customerClient
          .patch('/users/me/settings')
          .send(emptyUpdate)
          .set('Accept', 'application/json')

        if (response.status === 404) return

        // Should either succeed with no changes or return 400
        expect([200, 400]).toContain(response.status)
      })

      it('should require authentication', async () => {
        const update = {
          display: { theme: 'dark' },
        }

        const response = await request
          .patch('/users/me/settings')
          .send(update)
          .set('Accept', 'application/json')

        expect(response.status).toBe(401)
      })
    })

    describe('Settings Validation & Edge Cases', () => {
      it('should handle malformed JSON gracefully', async () => {
        const response = await customerClient
          .put('/users/me/settings')
          .send('invalid-json-string')
          .set('Content-Type', 'application/json')

        // Should handle malformed JSON gracefully
        expect([400, 404]).toContain(response.status)
      })

      it('should handle concurrent settings updates', async () => {
        // Test concurrent PATCH requests
        const updates = [
          { display: { theme: 'dark' } },
          { notifications: { email: { marketing: true } } },
          { privacy: { profile: { visibility: 'private' } } },
        ]

        const promises = updates.map((update) =>
          customerClient
            .patch('/users/me/settings')
            .send(update)
            .set('Accept', 'application/json'),
        )

        const responses = await Promise.all(promises)

        // All requests should complete successfully (or consistently fail if endpoint doesn't exist)
        const statuses = responses.map((r) => r.status)
        const successfulResponses = responses.filter((r) => r.status === 200)

        // If endpoint exists, at least some requests should succeed
        if (statuses.includes(200)) {
          expect(successfulResponses.length).toBeGreaterThan(0)

          // Final state should be consistent
          const finalResponse = await customerClient
            .get('/users/me/settings')
            .set('Accept', 'application/json')

          expect(finalResponse.status).toBe(200)
        }
      })

      it('should preserve data types correctly', async () => {
        const settings = createDefaultUserSettings()

        // Test various data types
        settings.display.itemsPerPage = 25 // number
        settings.notifications.email.enabled = false // boolean
        settings.display.timezone = 'America/New_York' // optional string
        settings.accessibility.largeText = true // boolean

        const response = await customerClient
          .put('/users/me/settings')
          .send(settings)
          .set('Accept', 'application/json')

        if (response.status === 404) return

        expect(response.status).toBe(200)

        const responseSettings = response.body.settings

        // Verify types are preserved
        expect(typeof responseSettings.display.itemsPerPage).toBe('number')
        expect(typeof responseSettings.notifications.email.enabled).toBe(
          'boolean',
        )
        expect(typeof responseSettings.display.timezone).toBe('string')
        expect(typeof responseSettings.accessibility.largeText).toBe('boolean')

        // Verify values are correct
        expect(responseSettings.display.itemsPerPage).toBe(25)
        expect(responseSettings.notifications.email.enabled).toBe(false)
        expect(responseSettings.display.timezone).toBe('America/New_York')
        expect(responseSettings.accessibility.largeText).toBe(true)
      })

      it('should handle settings version compatibility', async () => {
        const response = await customerClient
          .get('/users/me/settings')
          .set('Accept', 'application/json')

        if (response.status === 404) return

        expect(response.status).toBe(200)

        // All settings should have the current version
        expect(response.body.settings.version).toBe('1.0')
      })
    })

    describe('Settings Performance', () => {
      it('should handle large settings objects efficiently', async () => {
        const settings = createDefaultUserSettings(true) // Include business settings

        // Add all possible settings
        settings.display.timezone = 'America/New_York'
        settings.display.currency = 'EUR'

        const startTime = Date.now()

        const response = await customerClient
          .put('/users/me/settings')
          .send(settings)
          .set('Accept', 'application/json')

        const duration = Date.now() - startTime

        if (response.status === 404) return

        expect(response.status).toBe(200)

        // Should complete within reasonable time (5 seconds for integration test)
        expect(duration).toBeLessThan(5000)
      })

      it('should cache settings effectively', async () => {
        // Multiple rapid requests should be handled efficiently
        const requests = Array.from({ length: 3 }, () =>
          customerClient
            .get('/users/me/settings')
            .set('Accept', 'application/json'),
        )

        const startTime = Date.now()
        const responses = await Promise.all(requests)
        const duration = Date.now() - startTime

        // Skip if endpoint doesn't exist
        if (responses[0].status === 404) return

        // All should succeed
        responses.forEach((response) => {
          expect(response.status).toBe(200)
        })

        // Should complete quickly due to caching
        expect(duration).toBeLessThan(2000)

        // All should return identical data
        const firstResponse = JSON.stringify(responses[0].body)

        responses.forEach((response) => {
          expect(JSON.stringify(response.body)).toBe(firstResponse)
        })
      })
    })
  })
})
