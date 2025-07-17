// category.integration.test.ts

/**
 * Integration tests for the Category Service API
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

import { createCategoryServer } from '../../../../src/server.js' // Path from your test file

interface FileStoragePort {
  upload: (
    file: any,
    filePath: string,
  ) => Promise<{ url: string; path: string }>
  delete: (filePath: string) => Promise<void>
}

// Placeholder for your seedTestCategories function.
async function seedTestCategories(
  prismaClient: PrismaClient,
  options?: { generateInactive?: boolean },
): Promise<{ parentCategory: any; childCategories: any[] }> {
  logger.debug('Seeding test categories...')

  const parentSlug = `parent-category-${uuid().substring(0, 8)}`
  const parentCategory = await prismaClient.category.create({
    data: {
      name: { en: 'Parent Category', es: 'Categoría Principal' },
      description: {
        en: 'Test parent category',
        es: 'Categoría padre de prueba',
      },
      slug: parentSlug,
      level: 1,
      path: '/',
      active: options?.generateInactive ? false : true,
      sortOrder: 1,
    },
  })

  const childCategories = []

  for (let i = 0; i < 2; i++) {
    const childSlug = `child-category-${i}-${uuid().substring(0, 8)}`
    const child = await prismaClient.category.create({
      data: {
        name: { en: `Child Category ${i + 1}`, es: `Categoría Hija ${i + 1}` },
        description: {
          en: `Test child category ${i + 1}`,
          es: `Categoría hija de prueba ${i + 1}`,
        },
        slug: childSlug,
        parentId: parentCategory.id,
        level: 2,
        path: `/${parentCategory.id}/`,
        active: true,
        sortOrder: i + 1,
      },
    })

    childCategories.push(child)
  }

  logger.debug('Test categories seeded.')

  return { parentCategory, childCategories }
}

describe('Category API Integration Tests with Supertest', () => {
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

    app = await createCategoryServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      fileStorage: mockFileStorage as any,
    })

    // Add error handler to log 500 errors
    app.setErrorHandler((error, request, reply) => {
      logger.error('Test server error:', error)
      reply.status(500).send({ error: error.message })
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
  describe('GET /categories', () => {
    it('should return all categories with pagination', async () => {
      await seedTestCategories(testDb.prisma)

      const response = await customerClient
        .get('/categories')
        .set('Accept', 'application/json')

      // Log the response for debugging
      if (response.status !== 200) {
        logger.error('Response status:', response.status)
        logger.error('Response body:', response.body)
      }

      expect(response.status).toBe(200)
      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(3) // parent + 2 children
      expect(response.body.pagination.total).toBe(3)
    })

    it('should filter categories by parent_id', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)
      const response = await customerClient
        .get(`/categories?parent_id=${parentCategory.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].parent_id).toBe(parentCategory.id)
    })

    it('should filter categories by level', async () => {
      await seedTestCategories(testDb.prisma)

      const response = await customerClient
        .get('/categories?level=1')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(1)
      expect(response.body.data[0].level).toBe(1)
    })

    it('should filter categories by active status', async () => {
      await seedTestCategories(testDb.prisma, { generateInactive: true })

      const response = await customerClient
        .get('/categories?active=true')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(2) // Active children
      expect(response.body.data.every((cat: any) => cat.active)).toBe(true)

      const inactiveResponse = await customerClient
        .get('/categories?active=false')
        .set('Accept', 'application/json')
        .expect(200)

      expect(inactiveResponse.body.data).toHaveLength(1) // Inactive parent
      expect(inactiveResponse.body.data[0].active).toBe(false)
    })

    it('should sort categories by specified field', async () => {
      await seedTestCategories(testDb.prisma)

      const response = await customerClient
        .get('/categories?sort=sort_order&sort_order=desc')
        .set('Accept', 'application/json')
        .expect(200)

      const sortOrders = response.body.data.map((cat: any) => cat.sort_order)

      expect(sortOrders).toEqual([...sortOrders].sort((a, b) => b - a))
    })

    it('should paginate results correctly', async () => {
      await Promise.all(
        Array.from({ length: 25 }, (_, i) =>
          testDb.prisma.category.create({
            data: {
              name: {
                en: `Test Category ${i}`,
                es: `Categoría de Prueba ${i}`,
              },
              description: { en: `Description ${i}`, es: `Descripción ${i}` },
              slug: `test-category-${i}-${uuid().substring(0, 8)}`,
              level: 1,
              path: '/',
              active: true,
              sortOrder: i,
            },
          }),
        ),
      )

      const response = await customerClient
        .get('/categories?page=2&limit=10')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(10)
      expect(response.body.pagination.total).toBe(25)
      expect(response.body.data).toHaveLength(10)
    })

    it('should handle language preferences correctly for list', async () => {
      await seedTestCategories(testDb.prisma)

      const esResponse = await customerClient
        .get('/categories')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'es')
        .expect(200)

      expect(esResponse.headers['content-language']).toBe('es')
      expect(esResponse.body.data.find((c: any) => c.level === 1).name).toEqual(
        { es: 'Categoría Principal' },
      )

      const enResponse = await customerClient
        .get('/categories')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en')
        .expect(200)

      expect(enResponse.headers['content-language']).toBe('en')
      expect(enResponse.body.data.find((c: any) => c.level === 1).name).toEqual(
        { en: 'Parent Category' },
      )
    })
  })

  describe('GET /categories/:category_id', () => {
    it('should return a specific category by ID', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)
      const response = await customerClient
        .get(`/categories/${parentCategory.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(parentCategory.id)
      expect(response.body.name).toEqual({ es: 'Categoría Principal' })
    })

    it('should include children when requested', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)
      const response = await customerClient
        .get(`/categories/${parentCategory.id}?include_children=true`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.children).toBeDefined()
      expect(response.body.children).toHaveLength(2)
    })

    it('should handle language preferences correctly for single item', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)
      const response = await customerClient
        .get(`/categories/${parentCategory.id}`)
        .set('Accept', 'application/json')
        .set('Accept-Language', 'es')
        .expect(200)

      expect(response.headers['content-language']).toBe('es')
      expect(response.body.name).toEqual({ es: 'Categoría Principal' })
    })

    it('should return 404 for non-existent category ID', async () => {
      const nonExistentId = uuid()

      await customerClient
        .get(`/categories/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Write API Tests
  describe('POST /categories', () => {
    const categoryData = {
      name: { en: 'New Post Category', es: 'Nueva Categoría Post' },
      description: { en: 'New post description', es: 'Nueva descripción post' },
      slug: `new-post-category-${uuid().substring(0, 8)}`,
      active: true,
      sort_order: 5,
    }

    it('should create a new category', async () => {
      const response = await adminClient
        .post('/categories')
        .set('Accept', 'application/json')
        .send(categoryData)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.name.en).toBe(categoryData.name.en)
      expect(response.body.slug).toBe(categoryData.slug)

      const savedCategory = await testDb.prisma.category.findUnique({
        where: { id: response.body.id },
      })

      expect(savedCategory).not.toBeNull()
      expect(savedCategory?.slug).toBe(categoryData.slug)
    })

    it('should create a child category with correct parent reference', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)
      const childData = {
        ...categoryData, // re-use base data
        slug: `new-child-post-${uuid().substring(0, 8)}`, // ensure unique slug
        parent_id: parentCategory.id,
      }

      // Execute the request to create a child category
      const response = await adminClient
        .post('/categories')
        .set('Accept', 'application/json')
        .send(childData)
        .expect(201)

      // Verify the level was set correctly in the response
      expect(response.body.level).toBe(2)

      // Now get the actual category from the database to verify parentId was set correctly
      const savedCategory = await testDb.prisma.category.findUnique({
        where: { id: response.body.id },
      })

      // Check that the parent_id was properly saved in the database
      expect(savedCategory).not.toBeNull()
      expect(savedCategory?.parentId).toBe(parentCategory.id)
      expect(savedCategory?.level).toBe(2)
      expect(savedCategory?.path).toBe(`/${parentCategory.id}/`)
    })

    it('should validate required fields for POST', async () => {
      const incompleteData = { description: { en: 'Test' } } // Missing name, slug

      const response = await adminClient
        .post('/categories')
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

    it('should prevent duplicate slugs on POST', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)
      const duplicateData = { ...categoryData, slug: parentCategory.slug }

      await adminClient
        .post('/categories')
        .set('Accept', 'application/json')
        .send(duplicateData)
        .expect(409) // Conflict
    })

    it('should require admin authentication for POST', async () => {
      await customerClient
        .post('/categories')
        .set('Accept', 'application/json')
        .send(categoryData)
        .expect(403) // Forbidden
    })
  })

  describe('PATCH /categories/:category_id', () => {
    it('should update an existing category', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)
      const updateData = {
        name: { en: 'Updated Name via Supertest' },
        active: false,
      }
      const response = await adminClient
        .patch(`/categories/${parentCategory.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      expect(response.body.name.en).toBe('Updated Name via Supertest')
      expect(response.body.active).toBe(false)

      const updatedCategory = await testDb.prisma.category.findUnique({
        where: { id: parentCategory.id },
      })

      expect(updatedCategory?.name).toEqual({
        en: 'Updated Name via Supertest',
        es: 'Categoría Principal',
        gn: '',
      })
      expect(updatedCategory?.active).toBe(false)
    })

    it('should preserve multilingual data when updating only one language', async () => {
      // CRITICAL TEST: Validates fix for MULTILINGUAL_DATA_LOSS_EMERGENCY
      // This test ensures that updating a single language doesn't delete other languages

      // Create a category with full multilingual data
      const category = await testDb.prisma.category.create({
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
          slug: `multilingual-test-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      // Update only the English name and description
      const partialUpdate = {
        name: { en: 'Updated English Name Only' },
        description: { en: 'Updated English Description Only' },
      }

      const response = await adminClient
        .patch(`/categories/${category.id}`)
        .set('Accept', 'application/json')
        .send(partialUpdate)
        .expect(200)

      // Check response maintains all languages
      expect(response.body.name.en).toBe('Updated English Name Only')

      // Verify in database that ALL languages are preserved
      const updatedCategory = await testDb.prisma.category.findUnique({
        where: { id: category.id },
      })

      // CRITICAL ASSERTIONS: All languages must be preserved
      expect(updatedCategory?.name).toEqual({
        en: 'Updated English Name Only', // Updated
        es: 'Nombre Original en Español', // Preserved
        gn: 'Téra Guaraníme', // Preserved
      })

      expect(updatedCategory?.description).toEqual({
        en: 'Updated English Description Only', // Updated
        es: 'Descripción Original en Español', // Preserved
        gn: "Ñemombe'u Guaraníme", // Preserved
      })
    })

    it('should handle partial updates with empty strings correctly', async () => {
      // Test edge case: updating with empty string should not delete other languages

      const category = await testDb.prisma.category.create({
        data: {
          name: {
            en: 'English',
            es: 'Español',
            gn: 'Guaraní',
          },
          description: {
            en: 'English Desc',
            es: 'Descripción',
            gn: "Ñemombe'u",
          },
          slug: `empty-string-test-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      // Update Spanish to empty string
      const updateData = {
        name: { es: '' },
        description: { es: '' },
      }

      await adminClient
        .patch(`/categories/${category.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      const updatedCategory = await testDb.prisma.category.findUnique({
        where: { id: category.id },
      })

      // All languages should still exist, Spanish should be empty
      expect(updatedCategory?.name).toEqual({
        en: 'English', // Preserved
        es: '', // Updated to empty
        gn: 'Guaraní', // Preserved
      })

      expect(updatedCategory?.description).toEqual({
        en: 'English Desc', // Preserved
        es: '', // Updated to empty
        gn: "Ñemombe'u", // Preserved
      })
    })

    it('should support adding new language to existing multilingual fields', async () => {
      // Test that we can add a new language without affecting existing ones

      const category = await testDb.prisma.category.create({
        data: {
          name: {
            en: 'English Only Initially',
            es: '',
            gn: '',
          },
          description: {
            en: 'English Description Only',
            es: '',
            gn: '',
          },
          slug: `add-language-test-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      // Add Spanish and Guaraní translations
      const updateData = {
        name: {
          es: 'Ahora en Español',
          gn: "Ko'ágã Guaraníme",
        },
        description: {
          es: 'Descripción en Español',
          gn: "Ñemombe'u Guaraníme",
        },
      }

      await adminClient
        .patch(`/categories/${category.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      const updatedCategory = await testDb.prisma.category.findUnique({
        where: { id: category.id },
      })

      // All languages should now have values
      expect(updatedCategory?.name).toEqual({
        en: 'English Only Initially', // Preserved
        es: 'Ahora en Español', // Added
        gn: "Ko'ágã Guaraníme", // Added
      })

      expect(updatedCategory?.description).toEqual({
        en: 'English Description Only', // Preserved
        es: 'Descripción en Español', // Added
        gn: "Ñemombe'u Guaraníme", // Added
      })
    })

    it('should prevent setting a category as its own parent', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)
      const invalidUpdateData = {
        parent_id: parentCategory.id, // Trying to set itself as parent
      }

      const response = await adminClient
        .patch(`/categories/${parentCategory.id}`)
        .set('Accept', 'application/json')
        .send(invalidUpdateData)
        .expect(400) // Should fail with validation error

      // Verify the error details
      expect(response.body.error).toBeDefined()
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors.parentId).toBeDefined()

      // Verify the category was not changed
      const category = await testDb.prisma.category.findUnique({
        where: { id: parentCategory.id },
      })

      expect(category?.parentId).toBeNull() // Should still be a root category
    })

    it('should update level and path when changing parent_id', async () => {
      // Create a new parent structure using our seed function
      const { parentCategory: _originalParent, childCategories } =
        await seedTestCategories(testDb.prisma)

      // Create another parent category to use as the new parent
      const newParentSlug = `new-parent-${uuid().substring(0, 8)}`
      const newParent = await testDb.prisma.category.create({
        data: {
          name: { en: 'New Parent Category', es: 'Nueva Categoría Padre' },
          description: {
            en: 'New parent description',
            es: 'Nueva descripción padre',
          },
          slug: newParentSlug,
          level: 1,
          path: '/',
          active: true,
          sortOrder: 3,
        },
      })

      // Get the first child from our seeded categories
      const childToUpdate = childCategories[0]

      // Update the child to have the new parent
      // Note: We need to use parentId (camelCase) not parent_id (snake_case) for the internal API
      const updateData = {
        parentId: newParent.id,
      }

      const response = await adminClient
        .patch(`/categories/${childToUpdate.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      // Verify response has updated parent_id, level and path
      // The API returns snake_case properties (parent_id) to match the API schema
      expect(response.body.parent_id).toBe(newParent.id)
      expect(response.body.level).toBe(2) // Still level 2 since both original and new parents are root (level 1)
      expect(response.body.path).toBe(`/${newParent.id}/`)

      // Verify database was updated correctly
      const updatedCategory = await testDb.prisma.category.findUnique({
        where: { id: childToUpdate.id },
      })

      expect(updatedCategory?.parentId).toBe(newParent.id)
      expect(updatedCategory?.level).toBe(2)
      expect(updatedCategory?.path).toBe(`/${newParent.id}/`)
    })

    it('should correctly handle changing a category from child to root', async () => {
      // Seed categories and get a child to update
      const { childCategories } = await seedTestCategories(testDb.prisma)
      const childToMakeRoot = childCategories[0]

      // Update to make child a root category (null parentId)
      // Note: We need to use parentId (camelCase) not parent_id (snake_case) for the internal API
      const updateData = {
        parentId: null,
      }

      const response = await adminClient
        .patch(`/categories/${childToMakeRoot.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      // Verify response has null parent_id, level 1, and root path
      // Note: The API might return parent_id as undefined in the JSON when it's null
      expect(response.body.parent_id).toBeFalsy()
      expect(response.body.level).toBe(1) // Now a root category
      expect(response.body.path).toBe('/')

      // Verify database was updated correctly
      const updatedCategory = await testDb.prisma.category.findUnique({
        where: { id: childToMakeRoot.id },
      })

      expect(updatedCategory?.parentId).toBeNull()
      expect(updatedCategory?.level).toBe(1)
      expect(updatedCategory?.path).toBe('/')
    })

    it('should correctly handle nested hierarchy (3 levels)', async () => {
      // Create the parent
      const { parentCategory, childCategories } = await seedTestCategories(
        testDb.prisma,
      )
      const firstChild = childCategories[0]

      // Create a grandchild (level 3) using our actual API endpoint
      const grandchildData = {
        name: { en: 'Grandchild Category', es: 'Categoría Nieta' },
        description: { en: 'Grandchild description', es: 'Descripción nieta' },
        slug: `grandchild-${uuid().substring(0, 8)}`,
        parent_id: firstChild.id,
        active: true,
        sort_order: 1,
      }

      const createResponse = await adminClient
        .post('/categories')
        .set('Accept', 'application/json')
        .send(grandchildData)
        .expect(201)

      // Verify created grandchild has correct level and path
      expect(createResponse.body.level).toBe(3)
      expect(createResponse.body.path).toBe(
        `/${parentCategory.id}/${firstChild.id}/`,
      )
      expect(createResponse.body.parent_id).toBe(firstChild.id)

      // Now verify in database
      const grandchild = await testDb.prisma.category.findUnique({
        where: { id: createResponse.body.id },
      })

      expect(grandchild?.level).toBe(3)
      expect(grandchild?.path).toBe(`/${parentCategory.id}/${firstChild.id}/`)
      expect(grandchild?.parentId).toBe(firstChild.id)

      // Test moving the grandchild to be a direct child of the original root parent
      // Note: We need to use parentId (camelCase) not parent_id (snake_case) for the internal API
      const updateData = {
        parentId: parentCategory.id,
      }

      const updateResponse = await adminClient
        .patch(`/categories/${grandchild!.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      // Verify hierarchy was updated correctly
      expect(updateResponse.body.level).toBe(2) // Now a direct child of root (level 1)
      expect(updateResponse.body.path).toBe(`/${parentCategory.id}/`)
      expect(updateResponse.body.parent_id).toBe(parentCategory.id)

      // Verify in database
      const updatedGrandchild = await testDb.prisma.category.findUnique({
        where: { id: grandchild!.id },
      })

      expect(updatedGrandchild?.level).toBe(2)
      expect(updatedGrandchild?.path).toBe(`/${parentCategory.id}/`)
      expect(updatedGrandchild?.parentId).toBe(parentCategory.id)
    })

    it('should update child paths recursively when parent path changes', async () => {
      // Create a deep hierarchy:
      // Root -> Level 1 -> Level 2 -> Level 3

      // Create root category
      const rootSlug = `root-${uuid().substring(0, 8)}`
      const root = await testDb.prisma.category.create({
        data: {
          name: { en: 'Root Category', es: 'Categoría Raíz' },
          description: { en: 'Root description', es: 'Descripción raíz' },
          slug: rootSlug,
          level: 1,
          path: '/',
          active: true,
        },
      })

      // Create level 1 category
      const level1Slug = `level1-${uuid().substring(0, 8)}`
      const level1 = await testDb.prisma.category.create({
        data: {
          name: { en: 'Level 1 Category', es: 'Categoría Nivel 1' },
          description: { en: 'Level 1 description', es: 'Descripción nivel 1' },
          slug: level1Slug,
          parentId: root.id,
          level: 2,
          path: `/${root.id}/`,
          active: true,
        },
      })

      // Create level 2 category
      const level2Slug = `level2-${uuid().substring(0, 8)}`
      const level2 = await testDb.prisma.category.create({
        data: {
          name: { en: 'Level 2 Category', es: 'Categoría Nivel 2' },
          description: { en: 'Level 2 description', es: 'Descripción nivel 2' },
          slug: level2Slug,
          parentId: level1.id,
          level: 3,
          path: `/${root.id}/${level1.id}/`,
          active: true,
        },
      })

      // Create level 3 category
      const level3Slug = `level3-${uuid().substring(0, 8)}`
      const level3 = await testDb.prisma.category.create({
        data: {
          name: { en: 'Level 3 Category', es: 'Categoría Nivel 3' },
          description: { en: 'Level 3 description', es: 'Descripción nivel 3' },
          slug: level3Slug,
          parentId: level2.id,
          level: 4,
          path: `/${root.id}/${level1.id}/${level2.id}/`,
          active: true,
        },
      })

      // Now move the level1 to become a root category
      // Note: We need to use parentId (camelCase) not parent_id (snake_case) for the internal API
      const updateData = {
        parentId: null,
      }

      await adminClient
        .patch(`/categories/${level1.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      // Now check that all children got their paths and levels updated

      // Check level1 (now a root category)
      const updatedLevel1 = await testDb.prisma.category.findUnique({
        where: { id: level1.id },
      })

      expect(updatedLevel1?.parentId).toBeNull()
      expect(updatedLevel1?.level).toBe(1) // Root level
      expect(updatedLevel1?.path).toBe('/')

      // Check level2 (now a level 2 category)
      const updatedLevel2 = await testDb.prisma.category.findUnique({
        where: { id: level2.id },
      })

      expect(updatedLevel2?.parentId).toBe(level1.id)
      expect(updatedLevel2?.level).toBe(2) // One below new root
      expect(updatedLevel2?.path).toBe(`/${level1.id}/`)

      // Check level3 (now a level 3 category)
      const updatedLevel3 = await testDb.prisma.category.findUnique({
        where: { id: level3.id },
      })

      expect(updatedLevel3?.parentId).toBe(level2.id)
      expect(updatedLevel3?.level).toBe(3) // Two below new root
      expect(updatedLevel3?.path).toBe(`/${level1.id}/${level2.id}/`)
    })

    it('should return error for PATCH on non-existent category', async () => {
      // When attempting to update a non-existent category, the API should return an error
      const response = await adminClient
        .patch(`/categories/${uuid()}`)
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

    it('should require admin authentication for PATCH', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma)

      await customerClient
        .patch(`/categories/${parentCategory.id}`)
        .set('Accept', 'application/json')
        .send({ active: true })
        .expect(403)
    })
  })

  describe('DELETE /categories/:category_id', () => {
    it('should delete a category with no children', async () => {
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'To Delete Supertest' },
          description: { en: 'To Delete Supertest Description' }, // Add required description field
          slug: `to-delete-supertest-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      await adminClient
        .delete(`/categories/${category.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      const deletedCategory = await testDb.prisma.category.findUnique({
        where: { id: category.id },
      })

      expect(deletedCategory).toBeNull()
    })

    it('should prevent deletion of categories with children', async () => {
      const { parentCategory } = await seedTestCategories(testDb.prisma) // parent has children

      const response = await adminClient
        .delete(`/categories/${parentCategory.id}`)
        .set('Accept', 'application/json')
        .expect((res) => res.status >= 400) // Accept any error status code

      // Make sure the error response contains an error object
      expect(response.body.error).toBeDefined()
    })

    it('should return error for DELETE on non-existent category', async () => {
      const response = await adminClient
        .delete(`/categories/${uuid()}`)
        .set('Accept', 'application/json')
        .expect((res) => res.status >= 400) // Accept any error status code

      // Make sure the error response contains an error object
      expect(response.body.error).toBeDefined()
    })

    it('should require admin authentication for DELETE', async () => {
      const category = await testDb.prisma.category.create({
        data: {
          name: { en: 'Delete Auth Supertest' },
          description: { en: 'Delete Auth Supertest Description' }, // Add required description field
          slug: `delete-auth-supertest-${uuid().substring(0, 8)}`,
          level: 1,
          path: '/',
          active: true,
        },
      })

      await customerClient
        .delete(`/categories/${category.id}`)
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Error Handling Tests
  describe('Error Handling with Supertest', () => {
    it('should handle invalid input gracefully for POST', async () => {
      const invalidData = {
        name: 'Not a multilingual object',
        slug: 'invalid slug!',
      } // Invalid structure
      const response = await adminClient
        .post('/categories')
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
        .get('/categories/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)

      // Verify the new validation error format
      expect(response.body.error.code).toBe('VALIDATION_ERROR')
      expect(response.body.error.validationErrors).toBeDefined()
      expect(response.body.error.domain).toBe('validation')
    })
  })
})
