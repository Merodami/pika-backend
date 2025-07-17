/**
 * Auth Endpoints Integration Tests
 *
 * Tests authentication endpoints using real database with Testcontainers
 * Following the same pattern as category.integration.test.ts
 */
import { vi } from 'vitest'

// --- START MOCKING CONFIGURATION ---
vi.unmock('@pika/http')
vi.mock('@pika/api', async () => {
  const actualApi =
    await vi.importActual<typeof import('@pika/api')>('@pika/api')

  return actualApi
})
vi.mock('@pika/shared', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pika/shared')>('@pika/shared')

  return actualShared
})
// --- END MOCKING CONFIGURATION ---

import { logger } from '@pika/shared'
import { MockCacheService } from '@tests/mocks/cacheServiceMock.js'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createUserServer } from '../../../../services/user/src/server.js'

// Mock file storage
const mockFileStorage = {
  upload: vi.fn().mockResolvedValue({
    url: 'http://mockstorage.com/file.jpg',
    path: 'file.jpg',
  }),
  delete: vi.fn().mockResolvedValue(undefined),
}

describe('Auth Endpoints Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>
  let mockCacheService: MockCacheService

  // Test user data
  const testUser = {
    email: 'auth-test@example.com',
    password: 'SecurePass123@', // Use @ instead of ! to avoid JSON parsing issue
    first_name: 'Auth',
    last_name: 'Test',
    role: 'CUSTOMER',
    phone_number: '+34600000999',
  }

  beforeAll(async () => {
    logger.debug('Starting Auth Integration Tests...')

    // Initialize mock cache service
    mockCacheService = new MockCacheService()

    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_auth_endpoints_db',
      useInitSql: true,
    })

    // Set environment variable for the server
    process.env.DATABASE_URL = testDb.databaseUrl

    // Create User server (which includes auth endpoints)
    app = await createUserServer({
      prisma: testDb.prisma,
      cacheService: mockCacheService as any,
      fileStorage: mockFileStorage as any,
    })

    await app.ready()
    logger.debug('Fastify server ready for testing')

    // Initialize supertest
    request = supertest(
      app.server,
    ) as unknown as supertest.SuperTest<supertest.Test>

    logger.debug('Auth Integration Test setup complete')
  }, 120000) // 2 minute timeout

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear database between tests for isolation
    await clearTestDatabase(testDb.prisma)
  })

  afterAll(async () => {
    logger.debug('Cleaning up auth integration tests...')

    if (app) await app.close()
    await cleanupTestDatabase(testDb)

    logger.debug('Cleanup complete')
  })

  describe('User Registration', () => {
    it('should successfully register a new user', async () => {
      const response = await request
        .post('/auth/register')
        .send(testUser)
        .expect(201)

      // API returns direct response (not wrapped in success/data)
      expect(response.body).toMatchObject({
        user: {
          email: testUser.email,
          first_name: testUser.first_name,
          last_name: testUser.last_name,
          role: testUser.role,
          email_verified: false,
          status: 'ACTIVE',
        },
        tokens: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          expires_in: expect.any(Number),
        },
      })

      // Verify user was created in database
      const user = await testDb.prisma.user.findUnique({
        where: { email: testUser.email },
      })

      expect(user).toBeTruthy()
      expect(user?.firstName).toBe(testUser.first_name)
      expect(user?.role).toBe(testUser.role)
    })

    it('should reject registration with invalid email', async () => {
      const response = await request
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should reject registration with weak password', async () => {
      const response = await request
        .post('/auth/register')
        .send({
          ...testUser,
          password: '123',
        })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should reject duplicate email registration', async () => {
      // First registration
      await request.post('/auth/register').send(testUser).expect(201)

      // Duplicate registration
      const response = await request
        .post('/auth/register')
        .send({
          ...testUser,
          email: testUser.email, // Same email
        })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('User Login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      await request.post('/auth/register').send(testUser).expect(201)
    })

    it('should successfully login with valid credentials', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      // API returns direct response (not wrapped in success/data)
      expect(response.body).toMatchObject({
        user: {
          email: testUser.email,
          role: testUser.role,
        },
        tokens: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          expires_in: expect.any(Number),
        },
      })
    })

    it('should reject login with invalid password', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)

      expect(response.body.error).toBeDefined()
    })

    it('should reject login with non-existent email', async () => {
      const response = await request
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'anypassword',
        })
        .expect(401)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('Token Management', () => {
    let refreshToken: string

    beforeEach(async () => {
      // Register and login to get tokens
      await request.post('/auth/register').send(testUser).expect(201)

      const loginResponse = await request
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      refreshToken = loginResponse.body.tokens.refresh_token
    })

    it('should successfully refresh tokens', async () => {
      const response = await request
        .post('/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String),
            expiresAt: expect.any(String),
            refreshExpiresAt: expect.any(String),
          },
        },
      })
    })

    it('should reject invalid refresh token', async () => {
      const response = await request
        .post('/auth/refresh')
        .send({ refresh_token: 'invalid-token' })
        .expect(401)

      expect(response.body.error).toBeDefined()
    })
  })

  describe('Password Security', () => {
    it('should hash passwords securely', async () => {
      await request.post('/auth/register').send(testUser).expect(201)

      const user = await testDb.prisma.user.findUnique({
        where: { email: testUser.email },
      })

      // Password should be hashed, not plain text
      expect(user?.password).not.toBe(testUser.password)
      expect(user?.password).toMatch(/^\$2b\$/) // bcrypt hash format
    })
  })
})
