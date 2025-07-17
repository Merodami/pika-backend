// provider.integration.test.ts

/**
 * Integration tests for the Provider Service API
 *
 * Tests all endpoints with a real PostgreSQL (PostGIS) testcontainer using Supertest.
 */
import { vi } from 'vitest' // vi must be imported to be used

// --- START MOCKING CONFIGURATION ---
// Ensure the real HTTP server factory is used, overriding any global mocks.
vi.unmock('@pika/http')

// Force Vitest to use the actual implementation of '@helpi/api' for this test file.
// This overrides any global mocks (e.g., from setupTests.ts).
// Assumes '@helpi/api' is now fixed and can be imported without internal errors.
vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi // Return all actual exports
})

// Force Vitest to use the actual implementation of '@helpi/shared' for this test file.
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
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { FastifyInstance } from 'fastify'
import supertest from 'supertest' // Re-added supertest
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createFastifyServer is used
vi.unmock('@pika/api') // Ensures real schemas from @pika/api are used

import { logger } from '@pika/shared'
import { MockCacheService } from '@tests/mocks/cacheServiceMock.js'
import { AuthenticatedRequestClient } from '@tests/utils/authRequest.js'
import { createE2EAuthHelper, E2EAuthHelper } from '@tests/utils/e2eAuth.js'
import { v4 as uuid } from 'uuid' // Example: using the uuid package

import { createProviderServer } from '../../../../src/server.js' // Path from your test file

interface FileStoragePort {
  upload: (
    file: any,
    filePath: string,
  ) => Promise<{ url: string; path: string }>
  delete: (filePath: string) => Promise<void>
}

// Helper function to seed test providers
async function seedTestProviders(
  prismaClient: PrismaClient,
  options?: {
    generateInactive?: boolean
    generateUnverified?: boolean
    count?: number
  },
): Promise<{
  testUsers: any[]
  testProviders: any[]
  testCategory: any
}> {
  logger.debug('Seeding test providers...')

  // Create a test category first
  const categorySlug = `test-category-${uuid().substring(0, 8)}`
  const testCategory = await prismaClient.category.create({
    data: {
      name: { en: 'Test Category', es: 'Categoría de Prueba' },
      description: {
        en: 'Test category for providers',
        es: 'Categoría de prueba para proveedores',
      },
      slug: categorySlug,
      level: 1,
      path: '/',
      active: true,
      sortOrder: 1,
    },
  })

  const testUsers = []
  const testProviders = []
  const count = options?.count ?? 3

  for (let i = 0; i < count; i++) {
    // Create test user with unique email
    const uniqueId = uuid().substring(0, 8)
    const user = await prismaClient.user.create({
      data: {
        email: `provider${i}-${uniqueId}@test.com`,
        firstName: `Provider${i}`,
        lastName: 'Test',
        phoneNumber: `+1234567${uniqueId.substring(0, 3)}${i}`,
        role: 'PROVIDER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: true,
        password: null,
      },
    })

    testUsers.push(user)

    // Create provider
    const provider = await prismaClient.provider.create({
      data: {
        userId: user.id,
        businessName: {
          en: `Test Business ${i + 1}`,
          es: `Negocio de Prueba ${i + 1}`,
          gn: `Negocio de Prueba ${i + 1} (gn)`,
        },
        businessDescription: {
          en: `Test business description ${i + 1}`,
          es: `Descripción del negocio de prueba ${i + 1}`,
          gn: `Descripción del negocio de prueba ${i + 1} (gn)`,
        },
        categoryId: testCategory.id,
        verified: options?.generateUnverified ? i % 2 === 0 : true,
        active: options?.generateInactive ? i % 2 === 0 : true,
        avgRating: Math.min(3.5 + i * 0.3, 5.0), // Max rating is 5.0
      },
    })

    testProviders.push(provider)
  }

  logger.debug('Test providers seeded.')

  return { testUsers, testProviders, testCategory }
}

describe('Provider API Integration Tests with Supertest', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test> // For supertest
  let authHelper: E2EAuthHelper
  let adminClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let providerClient: AuthenticatedRequestClient

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

    app = await createProviderServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      fileStorage: mockFileStorage as any,
    })

    await app.ready() // Crucial: Ensures all plugins are loaded before supertest uses app.server
    logger.debug('Fastify server ready for testing.')

    // Initialize supertest with the Fastify server instance
    // The type assertion is a workaround for potential mismatches with @types/supertest
    request = supertest(
      app.server,
    ) as unknown as supertest.SuperTest<supertest.Test>

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getCustomerClient(testDb.prisma)
    providerClient = await authHelper.getProviderClient(testDb.prisma)

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clean up only provider-related data to preserve E2E auth users
    if (testDb?.prisma) {
      // Delete in proper order to avoid foreign key constraint violations
      await testDb.prisma.review.deleteMany({})
      await testDb.prisma.voucher.deleteMany({})
      await testDb.prisma.provider.deleteMany({})
      await testDb.prisma.category.deleteMany({})
      // DO NOT delete from User table - preserve auth users
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
  describe('GET /providers', () => {
    it('should return all providers with pagination', async () => {
      await seedTestProviders(testDb.prisma)

      const response = await customerClient
        .get('/providers')
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        // Error response details will be shown if test fails
      }
      expect(response.status).toBe(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(3) // 3 test providers
      expect(response.body.pagination.total).toBe(3)
    })

    it('should filter providers by category_id', async () => {
      const { testCategory } = await seedTestProviders(testDb.prisma)
      const response = await customerClient
        .get(`/providers?category_id=${testCategory.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(3)
      expect(response.body.data[0].category_id).toBe(testCategory.id)
    })

    it('should filter providers by verified status', async () => {
      await seedTestProviders(testDb.prisma, { generateUnverified: true })

      const response = await customerClient
        .get('/providers?verified=true')
        .set('Accept', 'application/json')
        .expect(200)

      // With generateUnverified: true, only even-indexed providers are verified
      expect(response.body.data).toHaveLength(2)
      expect(
        response.body.data.every((provider: any) => provider.verified),
      ).toBe(true)
    })

    it('should filter providers by active status', async () => {
      await seedTestProviders(testDb.prisma, { generateInactive: true })

      const response = await customerClient
        .get('/providers?active=true')
        .set('Accept', 'application/json')
        .expect(200)

      // With generateInactive: true, only even-indexed providers are active
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data.every((provider: any) => provider.active)).toBe(
        true,
      )

      const inactiveResponse = await customerClient
        .get('/providers?active=false')
        .set('Accept', 'application/json')
        .expect(200)

      expect(inactiveResponse.body.data).toHaveLength(1)
      expect(inactiveResponse.body.data[0].active).toBe(false)
    })

    it('should sort providers by specified field', async () => {
      await seedTestProviders(testDb.prisma)

      const response = await customerClient
        .get('/providers?sort=avg_rating&sort_order=desc')
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        // Sort test error details will be shown if test fails
      }
      expect(response.status).toBe(200)

      const ratings = response.body.data.map(
        (provider: any) => provider.avg_rating,
      )

      expect(ratings).toEqual([...ratings].sort((a, b) => b - a))
    })

    it('should paginate results correctly', async () => {
      // Seed more providers for pagination test
      await seedTestProviders(testDb.prisma, { count: 25 })

      const response = await customerClient
        .get('/providers?page=2&limit=10')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(10)
      expect(response.body.pagination.total).toBe(25)
      expect(response.body.data).toHaveLength(10)
    })

    it('should handle language preferences correctly for list', async () => {
      await seedTestProviders(testDb.prisma)

      const esResponse = await customerClient
        .get('/providers')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'es')
        .expect(200)

      expect(esResponse.headers['content-language']).toBe('es')
      expect(esResponse.body.data).toHaveLength(3)
      // Check that Spanish content is returned
      expect(esResponse.body.data[0].business_name.es).toBeDefined()
      expect(esResponse.body.data[0].business_name.es).toMatch(
        /^Negocio de Prueba \d+$/,
      )

      const enResponse = await customerClient
        .get('/providers')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en')

      // English response error details will be shown if test fails
      expect(enResponse.status).toBe(200)

      expect(enResponse.headers['content-language']).toBe('en')
      expect(enResponse.body.data).toHaveLength(3)
      // Check that English content is returned
      expect(enResponse.body.data[0].business_name.en).toBeDefined()
      expect(enResponse.body.data[0].business_name.en).toMatch(
        /^Test Business \d+$/,
      )
    })
  })

  describe('GET /providers/:provider_id', () => {
    it('should return a specific provider by ID', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)
      const response = await customerClient
        .get(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(testProviders[0].id)
      expect(response.body.business_name).toEqual({ es: 'Negocio de Prueba 1' })
    })

    it('should include user data when requested', async () => {
      const { testProviders, testUsers } = await seedTestProviders(
        testDb.prisma,
      )
      const response = await customerClient
        .get(`/providers/${testProviders[0].id}?include_user=true`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.user).toBeDefined()
      expect(response.body.user.email).toBe(testUsers[0].email)
      expect(response.body.user.email).toMatch(/^provider0-.*@test\.com$/)
    })

    it('should handle language preferences correctly for single item', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)
      const response = await customerClient
        .get(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .set('Accept-Language', 'es')
        .expect(200)

      expect(response.headers['content-language']).toBe('es')
      expect(response.body.business_name).toEqual({ es: 'Negocio de Prueba 1' })
    })

    it('should return 404 for non-existent provider ID', async () => {
      const nonExistentId = uuid()

      await customerClient
        .get(`/providers/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  describe('GET /providers/user', () => {
    it('should return provider by user ID from headers', async () => {
      const { testUsers, testProviders } = await seedTestProviders(
        testDb.prisma,
      )

      // Create a provider client for the first test user
      const providerClientForUser = new AuthenticatedRequestClient(
        request,
        authHelper['generateTestToken']('PROVIDER', testUsers[0].id),
      )

      const response = await providerClientForUser
        .get(`/providers/user`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(testProviders[0].id)
      expect(response.body.user_id).toBe(testUsers[0].id)
    })

    it('should return 404 for user without provider', async () => {
      // Create a user without a provider
      const userWithoutProvider = await testDb.prisma.user.create({
        data: {
          email: 'noprovider@test.com',
          firstName: 'No',
          lastName: 'Provider',
          role: 'PROVIDER',
          status: 'ACTIVE',
          emailVerified: true,
          phoneVerified: true,
          password: null,
        },
      })

      const clientWithoutProvider = new AuthenticatedRequestClient(
        request,
        authHelper['generateTestToken']('PROVIDER', userWithoutProvider.id),
      )

      await clientWithoutProvider
        .get(`/providers/user`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Write API Tests
  describe('POST /providers', () => {
    it('should create a new provider', async () => {
      // First create a provider
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Provider', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const providerData = {
        business_name: {
          en: 'New Provider Business',
          es: 'Nuevo Negocio Proveedor',
        },
        business_description: {
          en: 'New provider description',
          es: 'Nueva descripción proveedor',
        },
        category_id: category.id,
        verified: false,
        active: true,
      }

      const response = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(providerData)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.business_name.en).toBe(providerData.business_name.en)
      expect(response.body.category_id).toBe(providerData.category_id)

      const savedProvider = await testDb.prisma.provider.findUnique({
        where: { id: response.body.id },
      })

      expect(savedProvider).not.toBeNull()
      expect(savedProvider?.businessName).toMatchObject(
        providerData.business_name,
      )
    })

    it('should use userId from headers when creating provider', async () => {
      // The E2E auth helper already creates a ServiceProvider for the PROVIDER user
      // We need to get the actual user ID from the token
      const tokenInfo = authHelper.getTokenInfo('PROVIDER')

      expect(tokenInfo.hasToken).toBe(true)

      // Create a provider for the provider
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Provider', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const providerData = {
        business_name: {
          en: 'Header User Business',
          es: 'Negocio Usuario Header',
        },
        business_description: {
          en: 'Testing header user',
          es: 'Probando usuario header',
        },
        category_id: category.id,
        verified: false,
        active: true,
      }

      // First delete the existing provider created by E2E auth helper
      const existingProvider = await testDb.prisma.provider.findFirst({
        where: {
          businessName: { path: ['en'], equals: 'Test Provider Business' },
        },
      })

      if (existingProvider) {
        await testDb.prisma.provider.delete({
          where: { id: existingProvider.id },
        })
      }

      const response = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(providerData)
        .expect(201)

      expect(response.body.id).toBeDefined()

      // Verify the provider was created with the correct user association
      const savedProvider = await testDb.prisma.provider.findUnique({
        where: { id: response.body.id },
        include: { user: true },
      })

      expect(savedProvider).not.toBeNull()
      expect(savedProvider?.user.email).toBe('provider@e2etest.com')
    })

    it('should validate required fields for POST', async () => {
      const incompleteData = { business_description: { en: 'Test' } } // Missing business_name, category_id

      const response = await providerClient
        .post('/providers')
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

    it('should prevent user from creating multiple providers', async () => {
      // First create a provider for the providers
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Provider', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      // Get the provider user from the auth helper
      await testDb.prisma.user.findUnique({
        where: { email: 'provider@e2etest.com' },
      })

      // Create the first provider
      const firstProviderData = {
        business_name: { en: 'First Provider', es: 'Primer Proveedor' },
        business_description: { en: 'First provider', es: 'Primer proveedor' },
        category_id: category.id,
      }

      await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(firstProviderData)
        .expect(201)

      // Now try to create a duplicate - should fail
      const duplicateData = {
        business_name: { en: 'Duplicate Provider', es: 'Proveedor Duplicado' },
        business_description: { en: 'Should fail', es: 'Debería fallar' },
        category_id: category.id,
      }

      const response = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(duplicateData)

      // Duplicate provider error details will be shown if test fails
      expect(response.status).toBe(409) // Conflict - user already has a provider
    })

    it('should require PROVIDER role for POST', async () => {
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Provider', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const providerData = {
        business_name: { en: 'Customer Provider', es: 'Proveedor Cliente' },
        business_description: { en: 'Should fail', es: 'Debería fallar' },
        category_id: category.id,
        verified: false,
        active: true,
      }

      const response = await customerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(providerData)

      if (response.status !== 403) {
        // Role error details will be shown if test fails
      }
      expect(response.status).toBe(403) // Forbidden - only PROVIDER can create
    })
  })

  describe('PATCH /providers/:provider_id', () => {
    it('should update an existing provider', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)
      const updateData = {
        business_name: { en: 'Updated Business Name' },
        active: false,
      }

      // Get the provider's user to authenticate correctly
      const provider = await testDb.prisma.provider.findUnique({
        where: { id: testProviders[0].id },
        include: { user: true },
      })

      // Create a client authenticated as this specific provider's user
      const specificProviderClient = new AuthenticatedRequestClient(
        request,
        authHelper['generateTestToken']('PROVIDER', provider!.user.id),
      )

      const response = await specificProviderClient
        .patch(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      expect(response.body.business_name.en).toBe('Updated Business Name')
      expect(response.body.active).toBe(false)

      const updatedProvider = await testDb.prisma.provider.findUnique({
        where: { id: testProviders[0].id },
      })

      expect(updatedProvider?.businessName.en).toBe('Updated Business Name')
      expect(updatedProvider?.active).toBe(false)
    })

    it('should verify ownership before allowing update', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)
      const updateData = {
        business_name: { en: 'Should Not Update' },
      }

      // Try to update provider[0] with a different provider's auth
      // This uses the default PROVIDER auth from E2E helper (not the owner)
      await providerClient
        .patch(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(403) // Forbidden - not the owner

      // Verify the provider was not changed
      const provider = await testDb.prisma.provider.findUnique({
        where: { id: testProviders[0].id },
      })

      expect(provider?.businessName.en).toBe('Test Business 1') // Should be unchanged
    })

    it('should update verified status (admin only)', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma, {
        generateUnverified: true,
      })

      // Find an unverified provider
      const unverifiedProvider = testProviders.find((p) => !p.verified)

      expect(unverifiedProvider).toBeDefined()

      const updateData = {
        verified: true,
      }

      const response = await adminClient
        .patch(`/providers/${unverifiedProvider!.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      expect(response.body.verified).toBe(true)

      // Verify database was updated correctly
      const updatedProvider = await testDb.prisma.provider.findUnique({
        where: { id: unverifiedProvider!.id },
      })

      expect(updatedProvider?.verified).toBe(true)
    })

    it('should update rating', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)

      const updateData = {
        avg_rating: 4.8,
      }

      const response = await adminClient
        .patch(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      expect(response.body.avg_rating).toBe('4.8')

      // Verify database was updated correctly
      const updatedProvider = await testDb.prisma.provider.findUnique({
        where: { id: testProviders[0].id },
      })

      expect(updatedProvider?.avgRating.toNumber()).toBe(4.8)
    })

    it('should return error for PATCH on non-existent provider', async () => {
      // When attempting to update a non-existent provider, the API should return an error
      const response = await adminClient
        .patch(`/providers/${uuid()}`)
        .set('Accept', 'application/json')
        .send({ active: true })
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

    it('should require authentication for PATCH', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)
      const unauthenticatedClient = authHelper.getUnauthenticatedClient()

      await unauthenticatedClient
        .patch(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .send({ active: true })
        .expect(401) // Unauthorized
    })
  })

  describe('DELETE /providers/:provider_id', () => {
    it('should soft delete a provider', async () => {
      // Create a test user and provider to delete
      const user = await testDb.prisma.user.create({
        data: {
          email: 'delete-test@example.com',
          firstName: 'Delete',
          lastName: 'Test',
          role: 'PROVIDER',
          status: 'ACTIVE',
          emailVerified: true,
        },
      })

      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Provider', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const provider = await testDb.prisma.provider.create({
        data: {
          userId: user.id,
          businessName: { en: 'To Delete' },
          businessDescription: { en: 'To Delete Description' },
          categoryId: category.id,
          verified: true,
          active: true,
        },
      })

      // Create authenticated client for this specific user
      const deleteUserClient = new AuthenticatedRequestClient(
        request,
        authHelper['generateTestToken']('PROVIDER', user.id),
      )

      await deleteUserClient
        .delete(`/providers/${provider.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      const deletedProvider = await testDb.prisma.provider.findUnique({
        where: { id: provider.id },
      })

      expect(deletedProvider).not.toBeNull()
      expect(deletedProvider?.deletedAt).not.toBeNull() // Soft deleted
    })

    it('should verify ownership before allowing delete', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)

      // Try to delete provider[0] with a different provider's auth
      // This uses the default PROVIDER auth from E2E helper (not the owner)
      await providerClient
        .delete(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .expect(403) // Forbidden - not the owner

      // Verify the provider was not deleted
      const provider = await testDb.prisma.provider.findUnique({
        where: { id: testProviders[0].id },
      })

      expect(provider).not.toBeNull()
      expect(provider?.deletedAt).toBeNull()
    })

    it('should return error for DELETE on non-existent provider', async () => {
      const response = await providerClient
        .delete(`/providers/${uuid()}`)
        .set('Accept', 'application/json')
        .expect((res) => res.status >= 400) // Accept any error status code

      // Make sure the error response contains an error object
      expect(response.body.error).toBeDefined()
    })

    it('should require authentication for DELETE', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)
      const unauthenticatedClient = authHelper.getUnauthenticatedClient()

      await unauthenticatedClient
        .delete(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .expect(401) // Unauthorized
    })
  })

  // Error Handling Tests
  describe('Error Handling with Supertest', () => {
    it('should handle invalid input gracefully for POST', async () => {
      const invalidData = {
        business_name: 'Not a multilingual object',
        category_id: 'invalid-uuid',
      } // Invalid structure
      const response = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)

      // Verify the new validation error format
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })

    it('should handle invalid UUIDs in path parameters for GET', async () => {
      const response = await customerClient
        .get('/providers/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      // Verify the new validation error format
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })
  })

  // EMERGENCY: Multilingual Data Preservation Tests
  describe('EMERGENCY: Multilingual Field Data Preservation', () => {
    it('should preserve existing languages when updating single language in business_name', async () => {
      // Setup: Create provider with full multilingual data
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Category', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const createData = {
        business_name: {
          en: 'Original English Business',
          es: 'Negocio Original Español',
          gn: 'Negocio Original Guaraní',
        },
        business_description: {
          en: 'Original English Description',
          es: 'Descripción Original Español',
          gn: 'Descripción Original Guaraní',
        },
        category_id: category.id,
        verified: false,
        active: true,
      }

      // Create provider with full multilingual content
      const createResponse = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(createData)
        .expect(201)

      const providerId = createResponse.body.id

      // Action: Update ONLY English business name
      const updateData = {
        business_name: {
          en: 'Updated English Business',
        },
      }

      const updateResponse = await providerClient
        .patch(`/providers/${providerId}`)
        .set('Accept', 'application/json')
        .send(updateData)

      // Test output will show response details if assertion fails
      expect(updateResponse.status).toBe(200)

      // Assert: Response should show merged content
      expect(updateResponse.body.business_name).toEqual({
        en: 'Updated English Business', // ✅ UPDATED
        es: 'Negocio Original Español', // ✅ PRESERVED
        gn: 'Negocio Original Guaraní', // ✅ PRESERVED
      })

      // Assert: Database should preserve all languages
      const dbProvider = await testDb.prisma.provider.findUnique({
        where: { id: providerId },
      })

      expect(dbProvider?.businessName).toEqual({
        en: 'Updated English Business', // ✅ UPDATED
        es: 'Negocio Original Español', // ✅ PRESERVED
        gn: 'Negocio Original Guaraní', // ✅ PRESERVED
      })

      // Assert: business_description should be unchanged
      expect(dbProvider?.businessDescription).toEqual({
        en: 'Original English Description',
        es: 'Descripción Original Español',
        gn: 'Descripción Original Guaraní',
      })
    })

    it('should preserve existing languages when updating single language in business_description', async () => {
      // Setup
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Category', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const createData = {
        business_name: {
          en: 'Test Business',
          es: 'Negocio de Prueba',
          gn: 'Negocio de Prueba Guaraní',
        },
        business_description: {
          en: 'Original Description',
          es: 'Descripción Original',
          gn: 'Descripción Original Guaraní',
        },
        category_id: category.id,
      }

      const createResponse = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(createData)
        .expect(201)

      // Action: Update only Spanish description
      const updateData = {
        business_description: {
          es: 'Descripción Actualizada',
        },
      }

      await providerClient
        .patch(`/providers/${createResponse.body.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      // Assert: Other languages preserved in database
      const dbProvider = await testDb.prisma.provider.findUnique({
        where: { id: createResponse.body.id },
      })

      expect(dbProvider?.businessDescription).toEqual({
        en: 'Original Description', // ✅ PRESERVED
        es: 'Descripción Actualizada', // ✅ UPDATED
        gn: 'Descripción Original Guaraní', // ✅ PRESERVED
      })
    })

    it('should handle adding new language to existing multilingual field', async () => {
      // Setup: Create provider with only English content
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Category', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const createData = {
        business_name: {
          en: 'English Only Business',
        },
        business_description: {
          es: 'Descripción en Español',
          en: 'English Only Description',
        },
        category_id: category.id,
      }

      const createResponse = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(createData)
        .expect(201)

      // Action: Add Spanish translation
      const updateData = {
        business_name: {
          es: 'Negocio en Español',
        },
      }

      await providerClient
        .patch(`/providers/${createResponse.body.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      // Assert: Both languages should exist
      const dbProvider = await testDb.prisma.provider.findUnique({
        where: { id: createResponse.body.id },
      })

      expect(dbProvider?.businessName).toEqual({
        en: 'English Only Business', // ✅ PRESERVED
        es: 'Negocio en Español', // ✅ ADDED
        gn: '', // Normalized empty value
      })
    })

    it('should handle updating multiple languages in single request', async () => {
      // Setup
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Category', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const createData = {
        business_name: {
          en: 'Original English',
          es: 'Original Español',
          gn: 'Original Guaraní',
        },
        business_description: {
          en: 'Original English Description',
          es: 'Descripción Original Español',
          gn: 'Descripción Original Guaraní',
        },
        category_id: category.id,
      }

      const createResponse = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(createData)
        .expect(201)

      // Action: Update English and Spanish, leave Guaraní unchanged
      const updateData = {
        business_name: {
          en: 'Updated English',
          es: 'Español Actualizado',
        },
      }

      await providerClient
        .patch(`/providers/${createResponse.body.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      // Assert: Guaraní preserved, others updated
      const dbProvider = await testDb.prisma.provider.findUnique({
        where: { id: createResponse.body.id },
      })

      expect(dbProvider?.businessName).toEqual({
        en: 'Updated English', // ✅ UPDATED
        es: 'Español Actualizado', // ✅ UPDATED
        gn: 'Original Guaraní', // ✅ PRESERVED
      })
    })

    it('should handle both business_name and business_description updates with preservation', async () => {
      // Setup
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Test Category', es: 'Categoría de Prueba' },
          description: { en: 'Test', es: 'Prueba' },
          slug: `test-cat-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      const createData = {
        business_name: {
          en: 'Business EN',
          es: 'Business ES',
          gn: 'Business GN',
        },
        business_description: {
          en: 'Description EN',
          es: 'Description ES',
          gn: 'Description GN',
        },
        category_id: category.id,
      }

      const createResponse = await providerClient
        .post('/providers')
        .set('Accept', 'application/json')
        .send(createData)
        .expect(201)

      // Action: Update different languages in both fields
      const updateData = {
        business_name: {
          en: 'Updated Business EN',
        },
        business_description: {
          es: 'Updated Description ES',
        },
      }

      await providerClient
        .patch(`/providers/${createResponse.body.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      // Assert: Each field preserves its untouched languages
      const dbProvider = await testDb.prisma.provider.findUnique({
        where: { id: createResponse.body.id },
      })

      expect(dbProvider?.businessName).toEqual({
        en: 'Updated Business EN', // ✅ UPDATED
        es: 'Business ES', // ✅ PRESERVED
        gn: 'Business GN', // ✅ PRESERVED
      })

      expect(dbProvider?.businessDescription).toEqual({
        en: 'Description EN', // ✅ PRESERVED
        es: 'Updated Description ES', // ✅ UPDATED
        gn: 'Description GN', // ✅ PRESERVED
      })
    })
  })

  // Provider-specific tests
  describe('Provider-specific features', () => {
    it('should filter providers by user_id', async () => {
      const { testUsers } = await seedTestProviders(testDb.prisma)

      const response = await customerClient
        .get(`/providers?user_id=${testUsers[0].id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].user_id).toBe(testUsers[0].id)
    })

    it('should handle provider verification workflow', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma, {
        generateUnverified: true,
      })

      // Find an unverified provider
      const unverifiedProvider = testProviders.find((p) => !p.verified)

      expect(unverifiedProvider).toBeDefined()

      // Customer should be able to see unverified providers
      const customerResponse = await customerClient
        .get(`/providers/${unverifiedProvider!.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(customerResponse.body.verified).toBe(false)

      // Only admin can verify providers
      const verifyResponse = await adminClient
        .patch(`/providers/${unverifiedProvider!.id}`)
        .set('Accept', 'application/json')
        .send({ verified: true })
        .expect(200)

      expect(verifyResponse.body.verified).toBe(true)
    })

    it('should correctly calculate and update average rating', async () => {
      const { testProviders } = await seedTestProviders(testDb.prisma)

      // Update rating for a provider to make it the highest
      const newRating = 5.0
      const response = await adminClient
        .patch(`/providers/${testProviders[0].id}`)
        .set('Accept', 'application/json')
        .send({ avg_rating: newRating })
        .expect(200)

      expect(response.body.avg_rating).toBe(newRating.toString())

      // Verify it's reflected in list queries
      const listResponse = await customerClient
        .get('/providers?sort=avg_rating&sort_order=desc')
        .set('Accept', 'application/json')
        .expect(200)

      // Find our updated provider in the results
      const updatedProvider = listResponse.body.data.find(
        (p: any) => p.id === testProviders[0].id,
      )

      expect(updatedProvider).toBeDefined()
      expect(updatedProvider.avg_rating).toBe(newRating)

      // Verify it has the highest rating
      const allRatings = listResponse.body.data.map((p: any) => p.avg_rating)

      expect(Math.max(...allRatings)).toBe(newRating)
    })
  })
})
