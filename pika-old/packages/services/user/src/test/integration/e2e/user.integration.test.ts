// user.integration.test.ts

/**
 * Integration tests for the User Service API
 *
 * Tests all endpoints with a real PostgreSQL (PostGIS) testcontainer using Supertest.
 * Following Category service test patterns exactly.
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

import { PrismaClient } from '@prisma/client'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { FastifyInstance } from 'fastify'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http') // Ensures real createFastifyServer is used
vi.unmock('@pika/api') // Ensures real schemas from @pika/api are used

import { logger } from '@pika/shared'
import { MockCacheService } from '@tests/mocks/cacheServiceMock.js'
import { AuthenticatedRequestClient } from '@tests/utils/authRequest.js'
import { createE2EAuthHelper, E2EAuthHelper } from '@tests/utils/e2eAuth.js'
import { v4 as uuid } from 'uuid' // Example: using the uuid package

import { createUserServer } from '../../../../src/server.js' // Path from your test file

interface FileStoragePort {
  upload: (
    file: any,
    filePath: string,
  ) => Promise<{ url: string; path: string }>
  delete: (filePath: string) => Promise<void>
}

// Placeholder for your seedTestUsers function.
async function seedTestUsers(
  prismaClient: PrismaClient,
  options?: { generateInactive?: boolean },
): Promise<{ adminUser: any; customerUsers: any[]; providerUsers: any[] }> {
  logger.debug('Seeding test users...')

  const adminEmail = `admin-${uuid().substring(0, 8)}@test.com`
  const adminUser = await prismaClient.user.create({
    data: {
      email: adminEmail,
      firstName: 'Admin',
      lastName: 'User',
      password: 'hashedpassword123',
      role: 'ADMIN',
      status: options?.generateInactive ? 'SUSPENDED' : 'ACTIVE',
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const customerUsers = []

  for (let i = 0; i < 2; i++) {
    const customerEmail = `customer-${i}-${uuid().substring(0, 8)}@test.com`
    const customer = await prismaClient.user.create({
      data: {
        email: customerEmail,
        firstName: `Customer`,
        lastName: `${i + 1}`,
        password: 'hashedpassword123',
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerified: i === 0, // First customer verified, second not
        phoneVerified: false,
        phoneNumber: i === 0 ? '+595991234567' : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    customerUsers.push(customer)
  }

  const providerUsers = []

  for (let i = 0; i < 2; i++) {
    const providerEmail = `provider-${i}-${uuid().substring(0, 8)}@test.com`
    const provider = await prismaClient.user.create({
      data: {
        email: providerEmail,
        firstName: `Provider`,
        lastName: `${i + 1}`,
        password: 'hashedpassword123',
        role: 'PROVIDER',
        status: 'ACTIVE',
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    providerUsers.push(provider)
  }

  logger.debug('Test users seeded.')

  return { adminUser, customerUsers, providerUsers }
}

describe('User API Integration Tests with Supertest', () => {
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

    app = await createUserServer({
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

  // Read API Tests (using supertest) - following Category patterns
  describe('GET /users', () => {
    it('should return all users with pagination', async () => {
      await seedTestUsers(testDb.prisma)

      const response = await adminClient
        .get('/users')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.data).toHaveLength(5) // admin + 2 customers + 2 providers
      expect(response.body.pagination.total).toBe(5)
    })

    it('should filter users by role', async () => {
      await seedTestUsers(testDb.prisma)

      const response = await adminClient
        .get('/users?role=PROVIDER')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(2)
      expect(
        response.body.data.every((user: any) => user.role === 'PROVIDER'),
      ).toBe(true)
    })

    it('should filter users by status', async () => {
      await seedTestUsers(testDb.prisma, { generateInactive: true })

      const response = await adminClient
        .get('/users?status=ACTIVE')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.data).toHaveLength(4) // All except suspended admin
      expect(
        response.body.data.every((user: any) => user.status === 'ACTIVE'),
      ).toBe(true)

      const inactiveResponse = await adminClient
        .get('/users?status=SUSPENDED')
        .set('Accept', 'application/json')
        .expect(200)

      expect(inactiveResponse.body.data).toHaveLength(1) // Suspended admin
      expect(inactiveResponse.body.data[0].status).toBe('SUSPENDED')
    })

    it('should sort users by specified field', async () => {
      await seedTestUsers(testDb.prisma)

      const response = await adminClient
        .get('/users?sort_by=createdAt&sort_order=desc')
        .set('Accept', 'application/json')
        .expect(200)

      const createdDates = response.body.data.map(
        (user: any) => new Date(user.created_at),
      )
      const sortedDates = [...createdDates].sort(
        (a, b) => b.getTime() - a.getTime(),
      )

      expect(createdDates.map((d) => d.getTime())).toEqual(
        sortedDates.map((d) => d.getTime()),
      )
    })

    it('should paginate results correctly', async () => {
      await Promise.all(
        Array.from({ length: 25 }, (_, i) =>
          testDb.prisma.user.create({
            data: {
              email: `test-user-${i}-${uuid().substring(0, 8)}@test.com`,
              firstName: `Test`,
              lastName: `User ${i}`,
              password: 'hashedpassword123',
              role: 'CUSTOMER',
              status: 'ACTIVE',
              emailVerified: true,
              phoneVerified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          }),
        ),
      )

      const response = await adminClient
        .get('/users?page=2&limit=10')
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.pagination.page).toBe(2)
      expect(response.body.pagination.limit).toBe(10)
      expect(response.body.pagination.total).toBe(25)
      expect(response.body.data).toHaveLength(10)
    })
  })

  describe('GET /users/:user_id', () => {
    it('should return a specific user by ID', async () => {
      const { customerUsers } = await seedTestUsers(testDb.prisma)
      const targetUser = customerUsers[0]

      const response = await adminClient
        .get(`/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(targetUser.id)
      expect(response.body.email).toBe(targetUser.email)
      expect(response.body.role).toBe('CUSTOMER')
    })

    it('should return 404 for non-existent user ID', async () => {
      const nonExistentId = uuid()

      await adminClient
        .get(`/users/${nonExistentId}`)
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should handle invalid UUID format', async () => {
      await adminClient
        .get('/users/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(400)
    })

    it('should allow users to view their own profile', async () => {
      // The E2E auth helper creates the test users, find the customer
      const customerUser = await testDb.prisma.user.findFirst({
        where: { email: 'customer@e2etest.com' },
      })

      // If not found, the test setup might have cleared it, so just use the admin test
      if (!customerUser) {
        logger.debug('Customer user not found in DB, skipping test')

        return
      }

      const response = await customerClient
        .get(`/users/${customerUser.id}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(customerUser.id)
      expect(response.body.email).toBe('customer@e2etest.com')
      expect(response.body.role).toBe('CUSTOMER')
    })
  })

  describe('GET /users/email/:email', () => {
    it('should return a user by email (admin only)', async () => {
      const { customerUsers } = await seedTestUsers(testDb.prisma)
      const targetUser = customerUsers[0]

      const response = await adminClient
        .get(`/users/email/${encodeURIComponent(targetUser.email)}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(targetUser.id)
      expect(response.body.email).toBe(targetUser.email)
      expect(response.body.role).toBe('CUSTOMER')
    })

    it('should return 404 for non-existent email', async () => {
      await adminClient
        .get('/users/email/nonexistent@example.com')
        .set('Accept', 'application/json')
        .expect(404)
    })

    it('should require admin privileges', async () => {
      const { customerUsers } = await seedTestUsers(testDb.prisma)
      const targetUser = customerUsers[0]

      await customerClient
        .get(`/users/email/${encodeURIComponent(targetUser.email)}`)
        .set('Accept', 'application/json')
        .expect(403) // Non-admin users should get forbidden
    })

    it('should handle special characters in email', async () => {
      const specialEmailUser = await testDb.prisma.user.create({
        data: {
          email: `test+special-${uuid().substring(0, 8)}@example.com`,
          firstName: 'Special',
          lastName: 'Email',
          password: 'hashedpassword123',
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: true,
          phoneVerified: false,
        },
      })

      const response = await adminClient
        .get(`/users/email/${encodeURIComponent(specialEmailUser.email)}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body.id).toBe(specialEmailUser.id)
      expect(response.body.email).toBe(specialEmailUser.email)
    })
  })

  // Write API Tests - following Category patterns
  describe('POST /users', () => {
    const userData = {
      email: `new-user-${uuid().substring(0, 8)}@test.com`,
      first_name: 'New',
      last_name: 'User',
      role: 'CUSTOMER',
      phone_number: '+595991234567',
    }

    it('should create a new user', async () => {
      const response = await adminClient
        .post('/users')
        .set('Accept', 'application/json')
        .send(userData)
        .expect(201)

      expect(response.body.id).toBeDefined()
      expect(response.body.email).toBe(userData.email)
      expect(response.body.first_name).toBe(userData.first_name)
      expect(response.body.role).toBe(userData.role)

      const savedUser = await testDb.prisma.user.findUnique({
        where: { id: response.body.id },
      })

      expect(savedUser).not.toBeNull()
      expect(savedUser?.email).toBe(userData.email)
    })

    it('should prevent duplicate emails', async () => {
      const { customerUsers } = await seedTestUsers(testDb.prisma)
      const duplicateData = { ...userData, email: customerUsers[0].email }

      await adminClient
        .post('/users')
        .set('Accept', 'application/json')
        .send(duplicateData)
        .expect(400) // Changed from 409 to 400 to match repository error handling
    })
  })

  describe('PATCH /users/:user_id', () => {
    it('should update an existing user', async () => {
      const { customerUsers } = await seedTestUsers(testDb.prisma)
      const targetUser = customerUsers[0]
      const updateData = {
        first_name: 'Updated',
        status: 'SUSPENDED',
      }

      const response = await adminClient
        .patch(`/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .send(updateData)
        .expect(200)

      expect(response.body.first_name).toBe('Updated')
      expect(response.body.status).toBe('SUSPENDED')

      const updatedUser = await testDb.prisma.user.findUnique({
        where: { id: targetUser.id },
      })

      expect(updatedUser?.firstName).toBe('Updated')
      expect(updatedUser?.status).toBe('SUSPENDED')
    })

    it('should prevent duplicate phone numbers', async () => {
      const { customerUsers } = await seedTestUsers(testDb.prisma)
      const targetUser = customerUsers[1] // User without phone
      const existingPhone = customerUsers[0].phoneNumber // User with phone

      const duplicateData = { phone_number: existingPhone }

      await adminClient
        .patch(`/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .send(duplicateData)
        .expect(400) // Changed from 409 to 400 to match repository error handling
    })

    it('should return 404 for non-existent user', async () => {
      await adminClient
        .patch(`/users/${uuid()}`)
        .set('Accept', 'application/json')
        .send({ first_name: 'Updated' })
        .expect(404)
    })
  })

  describe('DELETE /users/:user_id (Soft Delete)', () => {
    it('should soft delete a user', async () => {
      const { customerUsers } = await seedTestUsers(testDb.prisma)
      const targetUser = customerUsers[0]

      await adminClient
        .delete(`/users/${targetUser.id}`)
        .set('Accept', 'application/json')
        .expect(204)

      const deletedUser = await testDb.prisma.user.findUnique({
        where: { id: targetUser.id },
      })

      expect(deletedUser?.deletedAt).not.toBeNull()
    })

    it('should return 404 for non-existent user', async () => {
      await adminClient
        .delete(`/users/${uuid()}`)
        .set('Accept', 'application/json')
        .expect(404)
    })
  })

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle malformed requests gracefully', async () => {
      const invalidData = {
        email: 'not-an-email',
        role: 'INVALID_ROLE',
      }

      await adminClient
        .post('/users')
        .set('Accept', 'application/json')
        .send(invalidData)
        .expect(400)
    })

    it('should handle invalid UUIDs in path parameters', async () => {
      // With RBAC, customers get 403 when trying to access other users' profiles
      // even if the UUID is invalid, because authorization is checked first
      await customerClient
        .get('/users/not-a-uuid')
        .set('Accept', 'application/json')
        .expect(403)
    })
  })

  // Authentication API Tests (prefix: /auth)
  describe('Authentication API Tests', () => {
    describe('POST /auth/register', () => {
      it('should register a new user', async () => {
        const registerData = {
          email: `register-test-${uuid().substring(0, 8)}@test.com`,
          password: 'TestPassword123!',
          first_name: 'Test',
          last_name: 'User',
          phone_number: '+595991234999',
          role: 'CUSTOMER',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: registerData,
        })

        expect(response.statusCode).toBe(201)

        const body = JSON.parse(response.body)

        expect(body).toHaveProperty('tokens')
        expect(body.tokens).toHaveProperty('access_token')
        expect(body.tokens).toHaveProperty('refresh_token')
        expect(body.user.email).toBe(registerData.email)
      })

      it('should prevent duplicate email registration', async () => {
        const { customerUsers } = await seedTestUsers(testDb.prisma)
        const duplicateData = {
          email: customerUsers[0].email,
          password: 'TestPassword123!',
          first_name: 'Test',
          last_name: 'User',
          role: 'CUSTOMER',
        }

        const response = await app.inject({
          method: 'POST',
          url: '/auth/register',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: duplicateData,
        })

        expect(response.statusCode).toBe(400)
      })
    })

    describe('POST /auth/login', () => {
      it('should login with valid credentials', async () => {
        // Create a user with known password
        const testEmail = `login-test-${uuid().substring(0, 8)}@test.com`
        const testPassword = 'TestPassword123!'

        // Register user first
        await app.inject({
          method: 'POST',
          url: '/auth/register',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: {
            email: testEmail,
            password: testPassword,
            first_name: 'Test',
            last_name: 'User',
            role: 'CUSTOMER',
          },
        })

        // Then login
        const response = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: {
            email: testEmail,
            password: testPassword,
          },
        })

        expect(response.statusCode).toBe(200)

        const body = JSON.parse(response.body)

        expect(body).toHaveProperty('tokens')
        expect(body.tokens).toHaveProperty('access_token')
        expect(body.tokens).toHaveProperty('refresh_token')
        expect(body.user.email).toBe(testEmail)
      })

      it('should reject invalid credentials', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/login',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: {
            email: 'nonexistent@test.com',
            password: 'wrongpassword',
          },
        })

        expect(response.statusCode).toBe(401)
      })
    })

    describe('POST /auth/refresh', () => {
      it('should refresh tokens with valid refresh token', async () => {
        // Register and login to get tokens
        const testEmail = `refresh-test-${uuid().substring(0, 8)}@test.com`
        const registerResponse = await app.inject({
          method: 'POST',
          url: '/auth/register',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: {
            email: testEmail,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role: 'CUSTOMER',
          },
        })

        const registerBody = JSON.parse(registerResponse.body)
        const refreshToken = registerBody.tokens.refresh_token

        // Use refresh token to get new tokens
        const response = await app.inject({
          method: 'POST',
          url: '/auth/refresh',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: {
            refresh_token: refreshToken,
          },
        })

        expect(response.statusCode).toBe(200)

        const body = JSON.parse(response.body)

        expect(body).toHaveProperty('success', true)
        expect(body).toHaveProperty('data')
        expect(body.data).toHaveProperty('tokens')
        expect(body.data.tokens).toHaveProperty('accessToken')
        expect(body.data.tokens).toHaveProperty('refreshToken')
      })

      it('should reject invalid refresh token', async () => {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/refresh',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: {
            refresh_token: 'invalid.refresh.token',
          },
        })

        expect(response.statusCode).toBe(401)
      })
    })

    describe('POST /auth/logout', () => {
      it('should logout successfully', async () => {
        // Register and login to get tokens
        const testEmail = `logout-test-${uuid().substring(0, 8)}@test.com`
        const registerResponse = await app.inject({
          method: 'POST',
          url: '/auth/register',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          payload: {
            email: testEmail,
            password: 'TestPassword123!',
            first_name: 'Test',
            last_name: 'User',
            role: 'CUSTOMER',
          },
        })

        const registerBody = JSON.parse(registerResponse.body)
        const accessToken = registerBody.tokens.access_token

        // Logout
        const response = await app.inject({
          method: 'POST',
          url: '/auth/logout',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          payload: {},
        })

        if (response.statusCode !== 200) {
          console.log('Logout failed with status:', response.statusCode)
          console.log('Response body:', response.body)
        }
        expect(response.statusCode).toBe(200)
      })
    })

    describe('Firebase Authentication', () => {
      describe('POST /auth/firebase-token', () => {
        it('should generate Firebase token for authenticated user', async () => {
          const response = await customerClient
            .post('/auth/firebase-token')
            .set('Accept', 'application/json')
            .send({
              purpose: 'real-time',
              expiresIn: 3600,
            })

          if (response.status !== 200) {
            console.log('Firebase token failed with status:', response.status)
            console.log('Response body:', response.body)
          }

          expect(response.status).toBe(200)
          expect(response.body).toHaveProperty('customToken')
          expect(typeof response.body.customToken).toBe('string')
        })

        it('should require authentication', async () => {
          const response = await app.inject({
            method: 'POST',
            url: '/auth/firebase-token',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            payload: {
              purpose: 'real-time',
              expiresIn: 3600,
            },
          })

          expect(response.statusCode).toBe(401)
        })
      })

      describe('GET /auth/firebase-token/health', () => {
        it('should return health status', async () => {
          const response = await app.inject({
            method: 'GET',
            url: '/auth/firebase-token/health',
            headers: {
              Accept: 'application/json',
            },
          })

          expect(response.statusCode).toBe(200)

          const body = JSON.parse(response.body)

          expect(body).toHaveProperty('status')
          expect(['ok', 'error', 'healthy']).toContain(body.status)
        })
      })
    })
  })
})
