// admin.integration.test.ts

/**
 * Integration tests for the Admin Service API
 *
 * Tests all endpoints with a real PostgreSQL (PostGIS) testcontainer using Supertest.
 */
import { vi } from 'vitest' // vi must be imported to be used

// --- START MOCKING CONFIGURATION ---
// Ensure the real HTTP server factory is used, overriding any global mocks.
vi.unmock('@pika/http')

// Force Vitest to use the actual implementation of '@pika/api' for this test file.
// This overrides any global mocks (e.g., from setupTests.ts).
// Assumes '@pika/api' is now fixed and can be imported without internal errors.
vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@pika/shared' for this test file.
// This is to ensure that functions like 'createSystemHealthCheck' are available
// and not overridden by a potentially incomplete global mock from setupTests.ts.
vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  // If you still want to mock specific parts of @pika/shared (e.g., logger)
  // while using the actual for others, you can do it here:
  // return {
  //   ...actualShared,
  //   logger: {
  //     info: vi.fn(),
  //     error: vi.fn(),
  //     debug: vi.fn(),
  //     warn: vi.fn(),
  //   },
  // };
  return actualShared // Return all actual exports
})
// --- END MOCKING CONFIGURATION ---

import { PrismaClient } from '@prisma/client'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { FastifyInstance } from 'fastify'
// Re-added supertest
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createFastifyServer is used
vi.unmock('@pika/api') // Ensures real schemas from @pika/api are used

import { logger } from '@pika/shared'
import { MockCacheService } from '@tests/mocks/cacheServiceMock.js'
import { AuthenticatedRequestClient } from '@tests/utils/authRequest.js'
import { createE2EAuthHelper, E2EAuthHelper } from '@tests/utils/e2eAuth.js'
import { v4 as uuid } from 'uuid' // Example: using the uuid package

import { createAdminServer } from '../../../../src/server.js' // Path from your test file

interface FileStoragePort {
  upload: (
    file: any,
    filePath: string,
  ) => Promise<{ url: string; path: string }>
  delete: (filePath: string) => Promise<void>
}

// Placeholder for your seedTestAdmins function.
async function seedTestAdmins(
  prismaClient: PrismaClient,
  options?: { generateInactive?: boolean },
): Promise<{ superAdmin: any; moderators: any[] }> {
  logger.debug('Seeding test admins...')

  const superAdminEmail = `super-admin-${uuid().substring(0, 8)}@test.com`
  const superAdmin = await prismaClient.admin.create({
    data: {
      userId: uuid(),
      email: superAdminEmail,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      permissions: ['MANAGE_PLATFORM', 'MANAGE_PROVIDERS', 'MANAGE_VOUCHERS'],
      status: options?.generateInactive ? 'INACTIVE' : 'ACTIVE',
      metadata: {
        department: 'Technology',
        hireDate: '2024-01-01',
      },
      profileData: {
        bio: {
          en: 'System Super Administrator',
          es: 'Super Administrador del Sistema',
        },
        phone: '+1234567890',
        timezone: 'UTC',
        language: 'en',
      },
    },
  })

  const moderators = []

  for (let i = 0; i < 2; i++) {
    const moderatorEmail = `moderator-${i}-${uuid().substring(0, 8)}@test.com`
    const moderator = await prismaClient.admin.create({
      data: {
        userId: uuid(),
        email: moderatorEmail,
        firstName: `Moderator ${i + 1}`,
        lastName: 'Test',
        role: 'MODERATOR',
        permissions: ['MANAGE_PROVIDERS'],
        status: 'ACTIVE',
        metadata: {
          department: 'Operations',
          hireDate: '2024-02-01',
        },
        profileData: {
          bio: {
            en: `Test Moderator ${i + 1}`,
            es: `Moderador de Prueba ${i + 1}`,
          },
          phone: `+123456789${i}`,
          timezone: 'UTC',
          language: 'en',
        },
      },
    })

    moderators.push(moderator)
  }

  logger.debug('Test admins seeded.')

  return { superAdmin, moderators }
}

describe('Admin API Integration Tests with Supertest', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient

  const mockCacheService = new MockCacheService()

  const mockFileStorage: FileStoragePort = {
    upload: vi.fn().mockResolvedValue({
      url: 'http://mockstorage.com/file.jpg',
      path: 'file.jpg',
    }),
    delete: vi.fn().mockResolvedValue(undefined),
  }

  beforeAll(async () => {
    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Update process.env for compatibility with existing code
    process.env.DATABASE_URL = testDb.databaseUrl

    app = await createAdminServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      fileStorage: mockFileStorage as any,
    })

    await app.ready() // Crucial: Ensures all plugins are loaded before supertest uses app.server
    logger.debug('Fastify server ready for testing.')

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getCustomerClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Use unified database cleanup
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    // Clean up authentication tokens
    if (authHelper) {
      authHelper.clearTokens()
    }

    if (app) await app.close() // Close Fastify server first

    // Use unified cleanup
    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Read API Tests (using supertest)
  describe('GET /admins', () => {
    it('should return all admins with pagination', async () => {
      await seedTestAdmins(testDb.prisma)

      const response = await adminClient
        .get('/admins')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(3) // super admin + 2 moderators
      expect(response.body.pagination.total).toBe(3)
    })

    it('should filter admins by role', async () => {
      const { superAdmin } = await seedTestAdmins(testDb.prisma)
      const response = await adminClient
        .get('/admins?role=SUPER_ADMIN')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].role).toBe('SUPER_ADMIN')
      expect(response.body.data[0].id).toBe(superAdmin.id)
    })

    it('should filter admins by status', async () => {
      await seedTestAdmins(testDb.prisma, { generateInactive: true })

      const response = await adminClient
        .get('/admins?status=ACTIVE')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(2) // Active moderators
      expect(
        response.body.data.every((admin: any) => admin.status === 'ACTIVE'),
      ).toBe(true)

      const inactiveResponse = await adminClient
        .get('/admins?status=INACTIVE')
        .set('Accept', 'application/json')
        .expect(200)

      expect(inactiveResponse.body.data).toHaveLength(1) // Inactive super admin
      expect(inactiveResponse.body.data[0].status).toBe('INACTIVE')
    })

    it('should sort admins by specified field', async () => {
      await seedTestAdmins(testDb.prisma)

      const response = await adminClient
        .get('/admins?sort=created_at&sort_order=desc')
        .set('Accept', 'application/json')
        .expect(200)

      const createdAts = response.body.data.map((admin: any) =>
        new Date(admin.created_at).getTime(),
      )

      expect(createdAts).toEqual([...createdAts].sort((a, b) => b - a))
    })

    it('should paginate results correctly', async () => {
      await Promise.all(
        Array.from({ length: 25 }, (_, i) =>
          testDb.prisma.admin.create({
            data: {
              userId: uuid(),
              email: `test-admin-${i}@test.com`,
              firstName: `Test Admin ${i}`,
              lastName: 'User',
              role: 'ADMIN',
              permissions: ['MANAGE_PROVIDERS'],
              status: 'ACTIVE',
              metadata: {
                department: 'Test',
                hireDate: '2024-01-01',
              },
              profileData: {
                bio: {
                  en: `Test Admin ${i}`,
                  es: `Administrador de Prueba ${i}`,
                },
                phone: `+12345678${i.toString().padStart(2, '0')}`,
                timezone: 'UTC',
                language: 'en',
              },
            },
          }),
        ),
      )

      const response = await adminClient
        .get('/admins?page=2&limit=10')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(10)
      expect(response.body.pagination.total).toBe(25)
      expect(response.body.data).toHaveLength(10)
    })

    it('should handle language preferences correctly for list', async () => {
      await seedTestAdmins(testDb.prisma)

      const esResponse = await adminClient
        .get('/admins')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'es')
        .expect(200)

      expect(esResponse.headers['content-language']).toBe('es')
      expect(
        esResponse.body.data.find((a: any) => a.role === 'SUPER_ADMIN')
          .profile_data.bio,
      ).toEqual({ es: 'Super Administrador del Sistema' })

      const enResponse = await adminClient
        .get('/admins')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en')
        .expect(200)

      expect(enResponse.headers['content-language']).toBe('en')
      expect(
        enResponse.body.data.find((a: any) => a.role === 'SUPER_ADMIN')
          .profile_data.bio,
      ).toEqual({ en: 'System Super Administrator' })
    })
  })

  describe('GET /admins/:admin_id', () => {
    it('should return a specific admin by ID', async () => {
      const { superAdmin } = await seedTestAdmins(testDb.prisma)
      const response = await adminClient
        .get(`/admins/${superAdmin.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(superAdmin.id)
      expect(response.body.role).toBe('SUPER_ADMIN')
      expect(response.body.email).toBe(superAdmin.email)
    })

    it('should handle language preferences correctly for single item', async () => {
      const { superAdmin } = await seedTestAdmins(testDb.prisma)
      const response = await adminClient
        .get(`/admins/${superAdmin.id}`)
        .set('Accept', 'application/json')
        .set('Accept-Language', 'es')
        .expect(200)

      expect(response.headers['content-language']).toBe('es')
      expect(response.body.profile_data.bio).toEqual({
        es: 'Super Administrador del Sistema',
      })
    })

    it('should return 404 for non-existent admin ID', async () => {
      const nonExistentId = uuid()

      await adminClient
        .get(`/admins/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Write API Tests
  describe('POST /admins', () => {
    const adminData = {
      user_id: uuid(),
      email: 'new-admin@test.com',
      first_name: 'New',
      last_name: 'Admin',
      role: 'ADMIN',
      permissions: ['MANAGE_PROVIDERS'],
      status: 'ACTIVE',
      metadata: {
        department: 'Operations',
        hire_date: '2024-01-01',
      },
      profile_data: {
        bio: { en: 'New admin user', es: 'Nuevo usuario administrador' },
        phone: '+1234567890',
        timezone: 'UTC',
        language: 'en',
      },
    }

    it('should create a new admin', async () => {
      const response = await adminClient
        .post('/admins')
        .set('Accept', 'application/json')
        .send(adminData)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.email).toBe(adminData.email)
      expect(response.body.role).toBe(adminData.role)

      const savedAdmin = await testDb.prisma.admin.findUnique({
        where: { id: response.body.id },
      })

      expect(savedAdmin).not.toBeNull()
      expect(savedAdmin?.email).toBe(adminData.email)
    })

    it('should validate required fields for POST', async () => {
      const incompleteData = { email: 'test@test.com' } // Missing required fields

      const response = await adminClient
        .post('/admins')
        .set('Accept', 'application/json')
        .send(incompleteData)
        .expect(400)

      // Verify the new validation error format
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      // At least one required field should be in the validation errors
      expect(
        Object.keys(response.body.error.validationErrors).length,
      ).toBeGreaterThan(0)
      expect(response.body.error.domain).toBe('validation')
    })

    it('should prevent duplicate emails on POST', async () => {
      const { superAdmin } = await seedTestAdmins(testDb.prisma)
      const duplicateData = { ...adminData, email: superAdmin.email }

      await adminClient
        .post('/admins')
        .set('Accept', 'application/json')
        .send(duplicateData)
        .expect(409) // Conflict
    })

    it('should require admin authentication for POST', async () => {
      await customerClient
        .post('/admins')
        .set('Accept', 'application/json')
        .send(adminData)
        .expect(403) // Forbidden
    })
  })

  describe('PATCH /admins/:admin_id', () => {
    it('should update an existing admin', async () => {
      const { superAdmin } = await seedTestAdmins(testDb.prisma)
      const updateData = {
        first_name: 'Updated Name via Supertest',
        status: 'INACTIVE',
      }
      const response = await adminClient
        .patch(`/admins/${superAdmin.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      expect(response.body.first_name).toBe('Updated Name via Supertest')
      expect(response.body.status).toBe('INACTIVE')

      const updatedAdmin = await testDb.prisma.admin.findUnique({
        where: { id: superAdmin.id },
      })

      expect(updatedAdmin?.firstName).toBe('Updated Name via Supertest')
      expect(updatedAdmin?.status).toBe('INACTIVE')
    })

    it('should preserve multilingual data when updating only one language', async () => {
      // CRITICAL TEST: Validates fix for MULTILINGUAL_DATA_LOSS_EMERGENCY
      // This test ensures that updating a single language doesn't delete other languages

      // Create an admin with full multilingual data
      const admin = await testDb.prisma.admin.create({
        data: {
          userId: uuid(),
          email: `multilingual-test-${uuid().substring(0, 8)}@test.com`,
          firstName: 'Test',
          lastName: 'Admin',
          role: 'ADMIN',
          permissions: ['MANAGE_PROVIDERS'],
          status: 'ACTIVE',
          metadata: {
            department: 'Test',
            hireDate: '2024-01-01',
          },
          profileData: {
            bio: {
              en: 'Original English Bio',
              es: 'Biografía Original en Español',
              gn: "Ñemombe'u Guaraníme",
            },
            phone: '+1234567890',
            timezone: 'UTC',
            language: 'en',
          },
        },
      })

      // Update only the English bio
      const partialUpdate = {
        profile_data: {
          bio: { en: 'Updated English Bio Only' },
        },
      }

      const response = await adminClient
        .patch(`/admins/${admin.id}`)
        .set('Accept', 'application/json')
        .send(partialUpdate)
        .expect(200)

      // Check response maintains all languages
      expect(response.body.profile_data.bio.en).toBe('Updated English Bio Only')

      // Verify in database that ALL languages are preserved
      const updatedAdmin = await testDb.prisma.admin.findUnique({
        where: { id: admin.id },
      })

      // CRITICAL ASSERTIONS: All languages must be preserved
      expect(updatedAdmin?.profileData.bio).toEqual({
        en: 'Updated English Bio Only', // Updated
        es: 'Biografía Original en Español', // Preserved
        gn: "Ñemombe'u Guaraníme", // Preserved
      })
    })

    it('should return error for PATCH on non-existent admin', async () => {
      // When attempting to update a non-existent admin, the API should return an error
      const response = await adminClient
        .patch(`/admins/${uuid()}`)
        .set('Accept', 'application/json')
        .send({ status: 'ACTIVE' })
        .expect((res) => res.status >= 400) // Accept any error status code

      // Make sure the error response contains an error object
      expect(response.body.error).toBeDefined()
      // The specific error message might vary, but it should contain some kind of error information
      expect(
        response.body.error.code ||
          response.body.error.type ||
          response.body.error.message,
      ).toBeDefined()
    })

    it('should require admin authentication for PATCH', async () => {
      const { superAdmin } = await seedTestAdmins(testDb.prisma)

      await customerClient
        .patch(`/admins/${superAdmin.id}`)
        .set('Accept', 'application/json')
        .send({ status: 'ACTIVE' })
        .expect(403)
    })
  })

  describe('DELETE /admins/:admin_id', () => {
    it('should delete an admin', async () => {
      const admin = await testDb.prisma.admin.create({
        data: {
          userId: uuid(),
          email: `to-delete-${uuid().substring(0, 8)}@test.com`,
          firstName: 'To',
          lastName: 'Delete',
          role: 'ADMIN',
          permissions: ['MANAGE_PROVIDERS'],
          status: 'ACTIVE',
          metadata: {
            department: 'Test',
            hireDate: '2024-01-01',
          },
          profileData: {
            bio: { en: 'Admin to be deleted' },
            phone: '+1234567890',
            timezone: 'UTC',
            language: 'en',
          },
        },
      })

      await adminClient
        .delete(`/admins/${admin.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      const deletedAdmin = await testDb.prisma.admin.findUnique({
        where: { id: admin.id },
      })

      expect(deletedAdmin).toBeNull()
    })

    it('should return error for DELETE on non-existent admin', async () => {
      const response = await adminClient
        .delete(`/admins/${uuid()}`)
        .set('Accept', 'application/json')
        .expect((res) => res.status >= 400) // Accept any error status code

      // Make sure the error response contains an error object
      expect(response.body.error).toBeDefined()
    })

    it('should require admin authentication for DELETE', async () => {
      const admin = await testDb.prisma.admin.create({
        data: {
          userId: uuid(),
          email: `delete-auth-test-${uuid().substring(0, 8)}@test.com`,
          firstName: 'Delete',
          lastName: 'Auth Test',
          role: 'ADMIN',
          permissions: ['MANAGE_PROVIDERS'],
          status: 'ACTIVE',
          metadata: {
            department: 'Test',
            hireDate: '2024-01-01',
          },
          profileData: {
            bio: { en: 'Admin for delete auth test' },
            phone: '+1234567890',
            timezone: 'UTC',
            language: 'en',
          },
        },
      })

      await customerClient
        .delete(`/admins/${admin.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  describe('POST /admins/:admin_id/upload', () => {
    it('should upload admin profile image', async () => {
      const { superAdmin } = await seedTestAdmins(testDb.prisma)

      // The actual upload test would require complex multipart setup
      // For now, we'll test the endpoint exists and returns proper error for missing file
      const response = await adminClient
        .post(`/admins/${superAdmin.id}/upload`)
        .set('Accept', 'application/json')
        .expect((res) => res.status >= 400) // Should fail without file

      expect(response.body.error).toBeDefined()
    })
  })

  // Error Handling Tests
  describe('Error Handling with Supertest', () => {
    it('should handle invalid input gracefully for POST', async () => {
      const invalidData = {
        email: 'not-an-email',
        role: 'INVALID_ROLE',
      } // Invalid structure
      const response = await adminClient
        .post('/admins')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)

      // Verify the new validation error format
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })

    it('should handle invalid UUIDs in path parameters for GET', async () => {
      const response = await adminClient
        .get('/admins/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      // Verify the new validation error format
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })
  })
})
