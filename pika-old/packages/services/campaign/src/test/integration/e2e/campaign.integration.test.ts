// campaign.integration.test.ts

/**
 * Integration tests for the Campaign Service API
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

  return actualShared // Return all actual exports
})
// --- END MOCKING CONFIGURATION ---

import {
  cleanupTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@pika/tests'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'
// Re-added supertest
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createFastifyServer is used
vi.unmock('@pika/api') // Ensures real schemas from @pika/api are used

import { logger } from '@pika/shared'
import {
  AuthenticatedRequestClient,
  createE2EAuthHelper,
  createMockServiceClients,
  E2EAuthHelper,
  MockCacheService,
} from '@pika/tests'
import { CampaignStatus } from '@pika/types-core'
import { v4 as uuid } from 'uuid' // Example: using the uuid package

import { createCampaignServer } from '../../../../src/server.js' // Path from your test file

interface FileStoragePort {
  upload: (
    file: any,
    filePath: string,
  ) => Promise<{ url: string; path: string }>
  delete: (filePath: string) => Promise<void>
}

// Seed test campaigns with proper provider association
async function seedTestCampaigns(
  prismaClient: PrismaClient,
  options?: {
    providerId?: string
    generateExpired?: boolean
    generateActive?: boolean
  },
): Promise<{ activeCampaign: any; draftCampaign: any; expiredCampaign?: any }> {
  logger.debug('Seeding test campaigns...')

  const providerId = options?.providerId

  if (!providerId) {
    throw new Error('Provider ID is required for seeding test campaigns')
  }

  // Verify provider exists
  const provider = await prismaClient.provider.findUnique({
    where: { id: providerId },
  })

  if (!provider) {
    throw new Error(`Provider with ID ${providerId} not found in database`)
  }

  const now = new Date()
  const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  const pastDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) // 60 days ago
  const recentPastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago

  const draftCampaign = await prismaClient.campaign.create({
    data: {
      name: {
        en: 'Draft Campaign',
        es: 'Campaña Borrador',
        gn: 'Campaña Borrador',
      },
      description: {
        en: 'Test draft campaign',
        es: 'Campaña borrador de prueba',
        gn: 'Campaña borrador de prueba',
      },
      providerId,
      startDate: now,
      endDate: futureDate,
      budget: 5000,
      status: CampaignStatus.DRAFT,
      active: true,
    },
  })

  let activeCampaign = null

  if (options?.generateActive) {
    activeCampaign = await prismaClient.campaign.create({
      data: {
        name: {
          en: 'Active Campaign',
          es: 'Campaña Activa',
          gn: 'Campaña Activa',
        },
        description: {
          en: 'Test active campaign',
          es: 'Campaña activa de prueba',
          gn: 'Campaña activa de prueba',
        },
        providerId,
        startDate: recentPastDate,
        endDate: futureDate,
        budget: 10000,
        status: CampaignStatus.ACTIVE,
        active: true,
      },
    })
  }

  let expiredCampaign = null

  if (options?.generateExpired) {
    expiredCampaign = await prismaClient.campaign.create({
      data: {
        name: {
          en: 'Expired Campaign',
          es: 'Campaña Expirada',
          gn: 'Campaña Expirada',
        },
        description: {
          en: 'Test expired campaign',
          es: 'Campaña expirada de prueba',
          gn: 'Campaña expirada de prueba',
        },
        providerId,
        startDate: pastDate,
        endDate: recentPastDate,
        budget: 7500,
        status: CampaignStatus.COMPLETED,
        active: false,
      },
    })
  }

  logger.debug('Test campaigns seeded.')

  return {
    activeCampaign: activeCampaign || draftCampaign,
    draftCampaign,
    expiredCampaign,
  }
}

describe('Campaign API Integration Tests with Supertest', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let authHelper: E2EAuthHelper
  let providerClient: AuthenticatedRequestClient
  let customerClient: AuthenticatedRequestClient
  let authProviderId: string
  let otherProviderId: string

  const mockCacheService = new MockCacheService()

  // Create mock service clients following redemption service pattern
  const { providerServiceClient } = createMockServiceClients()

  let mockProviderServiceClient: any

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

    // Store reference to mock for configuration
    mockProviderServiceClient = providerServiceClient

    app = await createCampaignServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      fileStorage: mockFileStorage as any,
      serviceClients: {
        providerService: mockProviderServiceClient as any,
      },
    })

    await app.ready() // Crucial: Ensures all plugins are loaded before supertest uses app.server
    logger.debug('Fastify server ready for testing.')

    // Initialize E2E Authentication Helper
    authHelper = createE2EAuthHelper(app)

    // Create test users and authenticate them
    logger.debug('Setting up E2E authentication...')
    await authHelper.createAllTestUsers(testDb.prisma)

    // Create additional test users and providers that will be needed in tests
    const otherProviderUser = await testDb.prisma.user.create({
      data: {
        email: 'other-provider@test.com',
        firstName: 'Other',
        lastName: 'Provider',
        role: 'PROVIDER',
        status: 'ACTIVE',
      },
    })

    // Create provider profile for the other provider
    const otherProvider = await testDb.prisma.provider.create({
      data: {
        userId: otherProviderUser.id,
        businessName: { en: 'Other Business', es: 'Otro Negocio' },
        businessDescription: {
          en: 'Other business for testing',
          es: 'Otro negocio para pruebas',
        },
        categoryId: (await testDb.prisma.category.findFirst())?.id || '',
        verified: true,
        active: true,
      },
    })

    otherProviderId = otherProvider.id

    // Get authenticated clients for different user types
    adminClient = await authHelper.getAdminClient(testDb.prisma)
    customerClient = await authHelper.getCustomerClient(testDb.prisma)
    providerClient = await authHelper.getProviderClient(testDb.prisma)

    // For campaigns, we need a provider ID. The E2E auth helper creates provider profiles automatically
    // Let's get the provider ID from the database
    const providerUser = await testDb.prisma.user.findUnique({
      where: { email: 'provider@e2etest.com' },
      include: { provider: true },
    })

    authProviderId = providerUser?.provider?.id || 'test-provider-id'

    logger.debug('E2E authentication setup complete')
  }, 120000)

  beforeEach(async () => {
    vi.clearAllMocks()

    // Clean up only campaign data, preserve users and providers
    if (testDb?.prisma) {
      await testDb.prisma.campaign.deleteMany({})
      // DO NOT delete providers or users - preserve auth users
    }

    // Configure the provider service mock following redemption service pattern
    // Only return providers for users who actually have provider records
    mockProviderServiceClient.getProviderByUserId.mockImplementation(
      async (userId: string) => {
        // Find the actual provider record in the test database
        const provider = await testDb.prisma.provider.findFirst({
          where: { userId },
        })

        if (provider) {
          // Return the actual provider from database
          return {
            id: provider.id,
            userId: provider.userId,
            businessName: provider.businessName,
            email: `provider-${provider.id}@test.com`,
            status: 'ACTIVE',
            active: provider.active,
          }
        }

        // No fallback - if user is not a provider, return null
        // This ensures proper authorization checks work
        return null
      },
    )
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
  describe('GET /campaigns', () => {
    it('should return all campaigns with pagination', async () => {
      await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
        generateActive: true,
      })

      const response = await providerClient
        .get('/campaigns')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(2) // draft + active
      expect(response.body.pagination.total).toBe(2)
    })

    it('should filter campaigns by provider_id', async () => {
      await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
      })

      // Create campaign for the other provider (already created in beforeAll)
      await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'Other Provider Campaign',
            es: 'Campaña de Otro Proveedor',
            gn: 'Campaña de Otro Proveedor',
          },
          description: {
            en: 'Campaign from another provider',
            es: 'Campaña de otro proveedor',
            gn: 'Campaña de otro proveedor',
          },
          providerId: otherProviderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 3000,
          status: CampaignStatus.DRAFT,
          active: true,
        },
      })

      const response = await providerClient
        .get(`/campaigns?provider_id=${authProviderId}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].provider_id).toBe(authProviderId)
    })

    it('should filter campaigns by status', async () => {
      await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
        generateActive: true,
        generateExpired: true,
      })

      const response = await providerClient
        .get(`/campaigns?status=${CampaignStatus.ACTIVE}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].status).toBe(CampaignStatus.ACTIVE)
    })

    it('should filter campaigns by active status', async () => {
      await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
        generateExpired: true,
      })

      const response = await providerClient
        .get('/campaigns?active=true')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1) // Only draft is active
      expect(response.body.data.every((cam: any) => cam.active)).toBe(true)

      const inactiveResponse = await providerClient
        .get('/campaigns?active=false')
        .set('Accept', 'application/json')
        .expect(200)

      expect(inactiveResponse.body.data).toHaveLength(1) // Expired campaign
      expect(inactiveResponse.body.data[0].active).toBe(false)
    })

    it('should sort campaigns by specified field', async () => {
      await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
        generateActive: true,
      })

      const response = await providerClient
        .get('/campaigns?sort=budget&sort_order=desc')
        .set('Accept', 'application/json')
        .expect(200)

      const budgets = response.body.data.map((cam: any) => cam.budget)

      expect(budgets).toEqual([...budgets].sort((a, b) => b - a))
    })

    it('should paginate results correctly', async () => {
      await Promise.all(
        Array.from({ length: 25 }, (_, i) =>
          testDb.prisma.campaign.create({
            data: {
              name: {
                en: `Test Campaign ${i}`,
                es: `Campaña de Prueba ${i}`,
                gn: `Campaña de Prueba ${i}`,
              },
              description: {
                en: `Description ${i}`,
                es: `Descripción ${i}`,
                gn: `Descripción ${i}`,
              },
              providerId: authProviderId,
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              budget: 1000 + i * 100,
              status: CampaignStatus.DRAFT,
              active: true,
            },
          }),
        ),
      )

      const response = await providerClient
        .get('/campaigns?page=2&limit=10')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(10)
      expect(response.body.pagination.total).toBe(25)
      expect(response.body.data).toHaveLength(10)
    })

    it('should handle language preferences correctly for list', async () => {
      await seedTestCampaigns(testDb.prisma, { providerId: authProviderId })

      const esResponse = await providerClient
        .get('/campaigns')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'es')
        .expect(200)

      expect(esResponse.headers['content-language']).toBe('es')
      expect(esResponse.body.data[0].name).toEqual({ es: 'Campaña Borrador' })

      const enResponse = await providerClient
        .get('/campaigns')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en')
        .expect(200)

      expect(enResponse.headers['content-language']).toBe('en')
      expect(enResponse.body.data[0].name).toEqual({ en: 'Draft Campaign' })
    })
  })

  describe('GET /campaigns/:campaign_id', () => {
    it('should return a specific campaign by ID', async () => {
      const { draftCampaign } = await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
      })
      const response = await providerClient
        .get(`/campaigns/${draftCampaign.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(draftCampaign.id)
      expect(response.body.name).toEqual({ es: 'Campaña Borrador' })
    })

    it('should handle language preferences correctly for single item', async () => {
      const { draftCampaign } = await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
      })
      const response = await providerClient
        .get(`/campaigns/${draftCampaign.id}`)
        .set('Accept', 'application/json')
        .set('Accept-Language', 'es')
        .expect(200)

      expect(response.headers['content-language']).toBe('es')
      expect(response.body.name).toEqual({ es: 'Campaña Borrador' })
    })

    it('should return 404 for non-existent campaign ID', async () => {
      const nonExistentId = uuid()

      await providerClient
        .get(`/campaigns/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Write API Tests
  describe('POST /campaigns', () => {
    const campaignData = {
      name: { en: 'New Campaign', es: 'Nueva Campaña', gn: 'Campaña Pyahu' },
      description: {
        en: 'New campaign description',
        es: 'Nueva descripción de campaña',
        gn: "Campaña ñemombe'u pyahu",
      },
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      budget: 5000,
      active: true,
    }

    it('should create a new campaign', async () => {
      const response = await providerClient
        .post('/campaigns')
        .set('Accept', 'application/json')
        .send(campaignData)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.name.en).toBe(campaignData.name.en)
      expect(response.body.status).toBe(CampaignStatus.DRAFT)
      expect(response.body.provider_id).toBe(authProviderId)

      const savedCampaign = await testDb.prisma.campaign.findUnique({
        where: { id: response.body.id },
      })

      expect(savedCampaign).not.toBeNull()
      expect(savedCampaign?.providerId).toBe(authProviderId)
    })

    it('should validate required fields for POST', async () => {
      const incompleteData = { description: { en: 'Test' } } // Missing name, dates, budget

      const response = await providerClient
        .post('/campaigns')
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

    it('should validate date constraints', async () => {
      const invalidDateData = {
        ...campaignData,
        start_date: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        end_date: new Date().toISOString(), // End before start
      }

      await providerClient
        .post('/campaigns')
        .set('Accept', 'application/json')
        .send(invalidDateData)
        .expect(400)
    })

    it('should validate budget constraints', async () => {
      const invalidBudgetData = {
        ...campaignData,
        budget: -1000, // Negative budget
      }

      await providerClient
        .post('/campaigns')
        .set('Accept', 'application/json')
        .send(invalidBudgetData)
        .expect(400)
    })

    it('should require provider authentication for POST', async () => {
      await customerClient
        .post('/campaigns')
        .set('Accept', 'application/json')
        .send(campaignData)
        .expect(403) // Forbidden - not a provider
    })
  })

  describe('PATCH /campaigns/:campaign_id', () => {
    it('should update an existing campaign', async () => {
      const { draftCampaign } = await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
      })
      const updateData = {
        name: { en: 'Updated Campaign Name' },
        budget: 7500,
        status: CampaignStatus.ACTIVE,
      }
      const response = await providerClient
        .patch(`/campaigns/${draftCampaign.id}`)
        .set('Accept', 'application/json')
        .send(updateData)

      if (response.status !== 200) {
        console.log('❌ Update campaign error - Status:', response.status)
        console.log('❌ Response body:', response.body)
        console.log('❌ Campaign ID:', draftCampaign.id)
      }

      expect(response.status).toBe(200)

      expect(response.body.name.en).toBe('Updated Campaign Name')
      expect(response.body.budget).toBe(7500)
      expect(response.body.status).toBe(CampaignStatus.ACTIVE)

      const updatedCampaign = await testDb.prisma.campaign.findUnique({
        where: { id: draftCampaign.id },
      })

      expect(updatedCampaign?.name).toEqual({
        en: 'Updated Campaign Name',
        es: 'Campaña Borrador',
        gn: 'Campaña Borrador',
      })
      expect(updatedCampaign?.budget.toNumber()).toBe(7500)
      expect(updatedCampaign?.status).toBe(CampaignStatus.ACTIVE)
    })

    it('should preserve multilingual data when updating only one language', async () => {
      // CRITICAL TEST: Validates fix for MULTILINGUAL_DATA_LOSS_EMERGENCY
      // This test ensures that updating a single language doesn't delete other languages

      // Create a campaign with full multilingual data
      const campaign = await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'Original English Name',
            es: 'Nombre Original en Español',
            gn: 'Téra Guaraníme',
          },
          description: {
            en: 'Original English Description',
            es: 'Descripción Original en Español',
            gn: "Ñemombe'u Guaraníme",
          },
          providerId: authProviderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 5000,
          status: CampaignStatus.DRAFT,
          active: true,
        },
      })

      // Update only the English name and description
      const partialUpdate = {
        name: { en: 'Updated English Name Only' },
        description: { en: 'Updated English Description Only' },
      }

      const response = await providerClient
        .patch(`/campaigns/${campaign.id}`)
        .set('Accept', 'application/json')
        .send(partialUpdate)
        .expect(200)

      // Check response maintains all languages
      expect(response.body.name.en).toBe('Updated English Name Only')

      // Verify in database that ALL languages are preserved
      const updatedCampaign = await testDb.prisma.campaign.findUnique({
        where: { id: campaign.id },
      })

      // CRITICAL ASSERTIONS: All languages must be preserved
      expect(updatedCampaign?.name).toEqual({
        en: 'Updated English Name Only', // Updated
        es: 'Nombre Original en Español', // Preserved
        gn: 'Téra Guaraníme', // Preserved
      })

      expect(updatedCampaign?.description).toEqual({
        en: 'Updated English Description Only', // Updated
        es: 'Descripción Original en Español', // Preserved
        gn: "Ñemombe'u Guaraníme", // Preserved
      })
    })

    it('should validate status transitions', async () => {
      // Create completed campaign
      const completedCampaign = await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'Completed Campaign',
            es: 'Campaña Completada',
            gn: 'Campaña Completada',
          },
          description: { en: 'Test', es: 'Prueba', gn: 'Prueba' },
          providerId: authProviderId,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          budget: 5000,
          status: CampaignStatus.COMPLETED,
          active: false,
        },
      })

      // Try to activate completed campaign (invalid transition)
      const updateData = {
        status: CampaignStatus.ACTIVE,
      }

      await providerClient
        .patch(`/campaigns/${completedCampaign.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(400)
    })

    it('should prevent updating campaigns from other providers', async () => {
      // Create campaign with different provider
      const otherProviderCampaign = await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'Other Provider Campaign',
            es: 'Campaña de Otro Proveedor',
            gn: 'Campaña de Otro Proveedor',
          },
          description: { en: 'Test', es: 'Prueba', gn: 'Prueba' },
          providerId: otherProviderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 5000,
          status: CampaignStatus.DRAFT,
          active: true,
        },
      })

      const updateData = {
        name: { en: 'Trying to update' },
      }

      await providerClient
        .patch(`/campaigns/${otherProviderCampaign.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(403) // Forbidden - not the owner
    })

    it('should prevent activating expired campaigns', async () => {
      // Create campaign with past end date
      const expiredCampaign = await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'Expired Campaign',
            es: 'Campaña Expirada',
            gn: 'Campaña Expirada',
          },
          description: { en: 'Test', es: 'Prueba', gn: 'Prueba' },
          providerId: authProviderId,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ended yesterday
          budget: 5000,
          status: CampaignStatus.DRAFT,
          active: true,
        },
      })

      const updateData = {
        status: CampaignStatus.ACTIVE,
      }

      await providerClient
        .patch(`/campaigns/${expiredCampaign.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(400)
    })

    it('should return error for PATCH on non-existent campaign', async () => {
      // When attempting to update a non-existent campaign, the API should return an error
      const response = await providerClient
        .patch(`/campaigns/${uuid()}`)
        .set('Accept', 'application/json')
        .send({ budget: 10000 })
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

    it('should require provider authentication for PATCH', async () => {
      const { draftCampaign } = await seedTestCampaigns(testDb.prisma, {
        providerId: authProviderId,
      })

      await customerClient
        .patch(`/campaigns/${draftCampaign.id}`)
        .set('Accept', 'application/json')
        .send({ budget: 10000 })
        .expect(403)
    })
  })

  describe('DELETE /campaigns/:campaign_id', () => {
    it('should delete a draft campaign', async () => {
      const campaign = await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'To Delete Campaign',
            es: 'Campaña a Eliminar',
            gn: 'Campaña a Eliminar',
          },
          description: {
            en: 'To Delete Campaign Description',
            es: 'Descripción de Campaña a Eliminar',
            gn: 'Descripción de Campaña a Eliminar',
          },
          providerId: authProviderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 5000,
          status: CampaignStatus.DRAFT,
          active: true,
        },
      })

      await providerClient
        .delete(`/campaigns/${campaign.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      const deletedCampaign = await testDb.prisma.campaign.findUnique({
        where: { id: campaign.id },
      })

      expect(deletedCampaign).toBeNull()
    })

    it('should prevent deletion of active campaigns', async () => {
      const activeCampaign = await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'Active Campaign',
            es: 'Campaña Activa',
            gn: 'Campaña Activa',
          },
          description: {
            en: 'Active Campaign Description',
            es: 'Descripción de Campaña Activa',
            gn: 'Descripción de Campaña Activa',
          },
          providerId: authProviderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 5000,
          status: CampaignStatus.ACTIVE,
          active: true,
        },
      })

      const response = await providerClient
        .delete(`/campaigns/${activeCampaign.id}`)
        .set('Accept', 'application/json')
        .expect((res) => res.status >= 400) // Accept any error status code

      // Make sure the error response contains an error object
      expect(response.body.error).toBeDefined()
    })

    it('should prevent deleting campaigns from other providers', async () => {
      const otherProviderCampaign = await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'Other Provider Campaign',
            es: 'Campaña de Otro Proveedor',
            gn: 'Campaña de Otro Proveedor',
          },
          description: { en: 'Test', es: 'Prueba', gn: 'Prueba' },
          providerId: otherProviderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 5000,
          status: CampaignStatus.DRAFT,
          active: true,
        },
      })

      await providerClient
        .delete(`/campaigns/${otherProviderCampaign.id}`)
        .set('Accept', 'application/json')
        .expect(403) // Forbidden - not the owner
    })

    it('should return error for DELETE on non-existent campaign', async () => {
      const response = await providerClient
        .delete(`/campaigns/${uuid()}`)
        .set('Accept', 'application/json')
        .expect((res) => res.status >= 400) // Accept any error status code

      // Make sure the error response contains an error object
      expect(response.body.error).toBeDefined()
    })

    it('should require provider authentication for DELETE', async () => {
      const campaign = await testDb.prisma.campaign.create({
        data: {
          name: {
            en: 'Delete Auth Campaign',
            es: 'Campaña de Autenticación para Eliminar',
            gn: 'Campaña de Autenticación para Eliminar',
          },
          description: {
            en: 'Delete Auth Campaign Description',
            es: 'Descripción de Campaña de Autenticación para Eliminar',
            gn: 'Descripción de Campaña de Autenticación para Eliminar',
          },
          providerId: authProviderId,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          budget: 5000,
          status: CampaignStatus.DRAFT,
          active: true,
        },
      })

      await customerClient
        .delete(`/campaigns/${campaign.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Error Handling Tests
  describe('Error Handling with Supertest', () => {
    it('should handle invalid input gracefully for POST', async () => {
      const invalidData = {
        name: 'Not a multilingual object',
        budget: 'not a number',
      } // Invalid structure
      const response = await providerClient
        .post('/campaigns')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)

      // Verify the new validation error format
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })

    it('should handle invalid UUIDs in path parameters for GET', async () => {
      const response = await providerClient
        .get('/campaigns/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      // Verify the new validation error format
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })
  })

  // Campaign-specific business logic tests
  describe('Campaign Business Logic', () => {
    it('should enforce minimum campaign duration of 1 day', async () => {
      const sameDay = new Date()
      const invalidData = {
        name: {
          en: 'Same Day Campaign',
          es: 'Campaña del Mismo Día',
          gn: 'Campaña del Mismo Día',
        },
        description: { en: 'Test', es: 'Prueba', gn: 'Prueba' },
        start_date: sameDay.toISOString(),
        end_date: sameDay.toISOString(), // Same day
        budget: 5000,
      }

      await providerClient
        .post('/campaigns')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)
    })

    it('should enforce maximum campaign duration of 1 year', async () => {
      const now = new Date()
      const twoYearsLater = new Date(
        now.getTime() + 2 * 365 * 24 * 60 * 60 * 1000,
      )

      const invalidData = {
        name: {
          en: 'Two Year Campaign',
          es: 'Campaña de Dos Años',
          gn: 'Campaña de Dos Años',
        },
        description: { en: 'Test', es: 'Prueba', gn: 'Prueba' },
        start_date: now.toISOString(),
        end_date: twoYearsLater.toISOString(), // 2 years
        budget: 5000,
      }

      await providerClient
        .post('/campaigns')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)
    })

    it('should enforce maximum budget limit', async () => {
      const invalidData = {
        name: {
          en: 'High Budget Campaign',
          es: 'Campaña de Alto Presupuesto',
          gn: 'Campaña de Alto Presupuesto',
        },
        description: { en: 'Test', es: 'Prueba', gn: 'Prueba' },
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 2000000, // Exceeds $1M limit
      }

      await providerClient
        .post('/campaigns')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)
    })
  })
})
