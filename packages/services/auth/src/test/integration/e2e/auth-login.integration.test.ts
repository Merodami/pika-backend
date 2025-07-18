import { vi } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')

// Force Vitest to use the actual implementation
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

import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  CommunicationServiceClientMock,
  UserServiceClientMock,
} from '@tests/mocks/services'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createAuthServer } from '../../../server.js'

// Use shared mocks
const mockUserServiceClient = new UserServiceClientMock()
const mockCommunicationClient = new CommunicationServiceClientMock()

describe('Auth Login Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    logger.debug('Setting up Auth Login integration tests...')

    // Create test database
    testDb = await createTestDatabase()

    // Create cache service
    const cacheService = new MemoryCacheService()

    // Create auth server with mocked service clients
    app = await createAuthServer({
      port: 0, // Random port for testing
      cacheService,
      userServiceClient: mockUserServiceClient as any,
      communicationClient: mockCommunicationClient as any,
    })

    request = supertest(app)

    logger.debug('Auth login setup complete')
  }, 120000)

  beforeEach(async () => {
    // Reset all mocks
    mockUserServiceClient.reset()
    mockCommunicationClient.reset()

    // Clear database between tests
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
    }
  })

  afterAll(async () => {
    logger.debug('Cleaning up resources...')

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Resources cleaned up.')
  })

  // Authentication Tests with proper mock setup
  describe('POST /auth/token - Password Grant', () => {
    it('should authenticate with valid credentials', async () => {
      // IMPORTANT: Setup mock BEFORE making the request
      mockUserServiceClient.setupAuthSuccess()

      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')

      if (response.status !== 200) {
        console.log('Response status:', response.status)
        console.log('Response body:', JSON.stringify(response.body, null, 2))
      }

      expect(response.status).toBe(200)

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 900,
        refreshToken: expect.any(String),
        user: {
          id: UserServiceClientMock.TEST_USER.id,
          email: UserServiceClientMock.TEST_USER.email,
          firstName: UserServiceClientMock.TEST_USER.firstName,
          lastName: UserServiceClientMock.TEST_USER.lastName,
          role: 'USER', // Mapped from MEMBER to USER
        },
      })
    })

    it('should reject authentication when user not found', async () => {
      // Setup mock to return null (user not found)
      mockUserServiceClient.setupUserNotFound()

      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'nonexistent@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: 'Invalid email or password',
        }),
      })
    })

    it('should reject authentication with wrong password', async () => {
      // Setup mock with correct user data
      mockUserServiceClient.setupAuthSuccess()

      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'WrongPassword123!', // Wrong password
        })
        .set('Accept', 'application/json')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: 'Invalid email or password',
        }),
      })
    })

    it('should reject authentication for inactive user', async () => {
      // Setup mock with inactive user
      mockUserServiceClient.setupInactiveUser()

      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: 'Account is inactive. Please contact support.',
        }),
      })
    })

    it('should handle user without password (OAuth-only account)', async () => {
      // Setup user without password
      const userWithoutPassword = {
        ...UserServiceClientMock.TEST_USER,
        password: undefined,
      }

      mockUserServiceClient.getUserAuthDataByEmail.mockResolvedValue({
        ...userWithoutPassword,
        isActive: () => true,
      })

      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(401)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: 'Password authentication not available for this account',
        }),
      })
    })

    it('should update last login time on successful authentication', async () => {
      // Setup mock for successful authentication
      mockUserServiceClient.setupAuthSuccess()

      await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      // Verify updateLastLogin was called
      expect(mockUserServiceClient.updateLastLogin).toHaveBeenCalledWith(
        UserServiceClientMock.TEST_USER.id,
        {
          loginTime: expect.any(Date),
        },
      )
    })

    it('should handle admin user authentication', async () => {
      // Setup mock with admin user
      mockUserServiceClient.setupAuthSuccess(UserServiceClientMock.ADMIN_USER)

      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'admin@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        user: {
          id: UserServiceClientMock.ADMIN_USER.id,
          email: UserServiceClientMock.ADMIN_USER.email,
          role: 'TRAINER', // ADMIN role is mapped to TRAINER in OAuth responses
        },
      })
    })
  })

  // Test validation errors are handled correctly
  describe('Input Validation', () => {
    it('should validate email format in username field', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'not-an-email',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
      expect(response.body.error.message).toContain('Invalid email format')
    })

    it('should require both username and password', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          // Missing password
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should handle empty strings as missing values', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: '',
          password: '',
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body.error).toBeDefined()
    })
  })
})
