import { vi } from 'vitest'

// Unmock modules that might interfere with real server setup for integration tests
vi.unmock('@pika/http')
vi.unmock('@pika
vi.unmock('@pika

// Force Vitest to use the actual implementation
vi.mock('@pikanc () => {
  const actualApi =
    await vi.importActual<typeof import('@pikap@p@p@p@p@pika

  return actualApi
})

vi.mock('@pikaasync () => {
  const actualShared =
    await vi.importActual<typeof import('@pika('@p@p@p@p@p@pika

  return actualShared
})

import { MemoryCacheService } from '@pika
import { logger } from '@pika
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
import { generateAccessToken } from '@tests/utils/testTokenHelper.js'
import { Express } from 'express'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createAuthServer } from '../../../server.js'

// Use shared mocks
const mockUserServiceClient = new UserServiceClientMock()
const mockCommunicationClient = new CommunicationServiceClientMock()

describe('OAuth 2.0 Endpoints Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let cacheService: MemoryCacheService

  beforeAll(async () => {
    logger.debug('Setting up OAuth endpoints integration tests...')

    // Create test database
    testDb = await createTestDatabase()

    // Create cache service
    cacheService = new MemoryCacheService()

    // Create auth server with mocked service clients
    app = await createAuthServer({
      port: 0, // Random port for testing
      cacheService,
      userServiceClient: mockUserServiceClient as any,
      communicationClient: mockCommunicationClient as any,
    })

    request = supertest(app)

    // Wait a bit for server to fully initialize
    await new Promise((resolve) => setTimeout(resolve, 100))

    logger.debug('OAuth endpoints setup complete')
  }, 120000)

  beforeEach(async () => {
    // Reset all mocks
    mockUserServiceClient.reset()
    mockCommunicationClient.reset()

    // Clear cache between tests
    if (cacheService) {
      await cacheService.clearAll()
    }

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

  // Token Endpoint Tests
  describe('POST /auth/token', () => {
    describe('Password Grant', () => {
      it('should authenticate with valid credentials', async () => {
        // Setup mock for successful authentication
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

      it('should reject invalid password', async () => {
        // Setup auth success but password won't match
        mockUserServiceClient.setupAuthSuccess()

        const response = await request
          .post('/auth/token')
          .send({
            grantType: 'password',
            username: 'test@example.com',
            password: 'WrongPassword!',
          })
          .set('Accept', 'application/json')
          .expect(401)

        expect(response.body).toMatchObject({
          error: expect.objectContaining({
            message: 'Invalid email or password',
          }),
        })
      })

      it('should validate required fields', async () => {
        const response = await request
          .post('/auth/token')
          .send({
            grantType: 'password',
          })
          .set('Accept', 'application/json')
          .expect(400)

        expect(response.body).toMatchObject({
          error: expect.objectContaining({
            message: expect.stringMatching(/validation/i),
          }),
        })
      })
    })

    describe('Refresh Token Grant', () => {
      it('should refresh valid token', async () => {
        // First login to get a valid refresh token
        // Use setupAuthSuccess to properly configure all necessary mocks
        mockUserServiceClient.setupAuthSuccess({
          id: 'user-123',
          email: 'test@example.com',
          password:
            '$2b$10$9Erjm5.hmByB.mD99PAvb.0fJF38j2JZSVNHHjE4vY.cRdHdOovzW', // Password123!
          role: 'MEMBER',
          status: 'ACTIVE',
          emailVerified: true,
          firstName: 'Test',
          lastName: 'User',
        })

        const loginResponse = await request
          .post('/auth/token')
          .send({
            grantType: 'password',
            username: 'test@example.com',
            password: 'Password123!',
          })
          .set('Accept', 'application/json')
          .expect(200)

        const refreshToken = loginResponse.body.refreshToken

        // Now use the refresh token
        const response = await request
          .post('/auth/token')
          .send({
            grantType: 'refreshToken',
            refreshToken,
          })
          .set('Accept', 'application/json')
          .expect(200)

        expect(response.body).toMatchObject({
          accessToken: expect.any(String),
          tokenType: 'Bearer',
          expiresIn: 900,
          refreshToken: expect.any(String),
        })
      })

      it('should reject invalid refresh token', async () => {
        // Invalid token format should return 400 (validation error)
        // Invalid but well-formed token would return 401 (unauthorized)
        const response = await request
          .post('/auth/token')
          .send({
            grantType: 'refreshToken',
            refreshToken: 'invalid-token',
          })
          .set('Accept', 'application/json')

        expect([400, 401]).toContain(response.status)
      })
    })

    it('should reject unsupported grant type', async () => {
      const response = await request
        .post('/auth/token')
        .send({
          grantType: 'client_credentials',
        })
        .set('Accept', 'application/json')
        .expect(400)

      expect(response.body).toMatchObject({
        error: expect.objectContaining({
          message: expect.stringMatching(/invalid.*discriminator|validation/i),
        }),
      })
    })
  })

  // Introspect Endpoint Tests
  describe('POST /auth/introspect', () => {
    it('should introspect valid access token', async () => {
      const tokenData = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'MEMBER',
      }
      const accessToken = generateAccessToken(tokenData)

      const response = await request
        .post('/auth/introspect')
        .send({
          token: accessToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        active: true,
        username: tokenData.email,
        tokenType: 'Bearer',
        sub: tokenData.userId,
        userId: tokenData.userId,
        userEmail: tokenData.email,
        userRole: tokenData.role,
      })

      // Check that the token is actually active
      expect(response.body.active).toBe(true)
    })

    it('should return inactive for invalid token', async () => {
      // Generate a properly formatted but invalid JWT token
      const invalidToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkludmFsaWQiLCJpYXQiOjE1MTYyMzkwMjJ9.invalid_signature_here'

      const response = await request
        .post('/auth/introspect')
        .send({
          token: invalidToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      // OAuth 2.0 spec requires returning 200 with active: false for invalid tokens
      expect(response.body).toEqual({ active: false })
    })

    it('should return inactive for expired token', async () => {
      const expiredToken = generateAccessToken(
        {
          userId: 'user-123',
          email: 'test@example.com',
          role: 'MEMBER',
        },
        -3600, // Expired 1 hour ago
      )

      const response = await request
        .post('/auth/introspect')
        .send({
          token: expiredToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toEqual({ active: false })
    })
  })

  // Revoke Endpoint Tests
  describe('POST /auth/revoke', () => {
    it('should revoke valid token', async () => {
      const accessToken = generateAccessToken({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'MEMBER',
      })

      const response = await request
        .post('/auth/revoke')
        .send({
          token: accessToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token revoked successfully',
      })
    })

    it('should always return success for invalid tokens', async () => {
      // Generate a properly formatted but invalid JWT token
      const invalidToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkludmFsaWQiLCJpYXQiOjE1MTYyMzkwMjJ9.invalid_signature_here'

      const response = await request
        .post('/auth/revoke')
        .send({
          token: invalidToken,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token revoked successfully',
      })
    })

    it('should revoke all tokens when allDevices is true', async () => {
      const userId = 'user-123'
      const accessToken = generateAccessToken({
        userId,
        email: 'test@example.com',
        role: 'MEMBER',
      })

      const response = await request
        .post('/auth/revoke')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          token: accessToken,
          allDevices: true,
        })
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringMatching(/token.*revoked|revoked.*successfully/i),
      })
    })
  })

  // UserInfo Endpoint Tests
  describe('GET /auth/userinfo', () => {
    it('should validate test token properly', async () => {
      // Use login to get a real token from the service
      mockUserServiceClient.setupAuthSuccess({
        id: 'user-123',
        email: 'test@example.com',
        password:
          '$2b$10$9Erjm5.hmByB.mD99PAvb.0fJF38j2JZSVNHHjE4vY.cRdHdOovzW', // Password123!
        role: 'MEMBER',
        status: 'ACTIVE',
        emailVerified: true,
        firstName: 'Test',
        lastName: 'User',
      })

      const loginResponse = await request
        .post('/auth/token')
        .send({
          grantType: 'password',
          username: 'test@example.com',
          password: 'Password123!',
        })
        .set('Accept', 'application/json')
        .expect(200)

      const accessToken = loginResponse.body.accessToken

      // Now verify it via introspection
      const introspectResponse = await request
        .post('/auth/introspect')
        .send({ token: accessToken })
        .set('Accept', 'application/json')
        .expect(200)

      expect(introspectResponse.body.active).toBe(true)

      // Now try calling userinfo with this valid token
      const userInfoResponse = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Accept', 'application/json')

      console.log('UserInfo response status:', userInfoResponse.status)
      console.log('UserInfo response body:', userInfoResponse.body)
    })

    it('should return user info for authenticated request', async () => {
      const userId = 'user-123'
      const user = {
        id: userId,
        email: 'test@example.com',
        emailVerified: true,
        firstName: 'Test',
        lastName: 'User',
        role: 'MEMBER',
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockUserServiceClient.getUser.mockResolvedValueOnce(user)

      const accessToken = generateAccessToken({
        userId,
        email: user.email,
        role: user.role,
      })

      const response = await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Accept', 'application/json')
        .expect(200)

      expect(response.body).toMatchObject({
        id: userId,
        email: user.email,
        emailVerified: user.emailVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        role: user.role,
        permissions: expect.any(Array),
        locale: 'en',
      })
    })

    it('should require authentication', async () => {
      await request
        .get('/auth/userinfo')
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('should reject invalid token', async () => {
      await request
        .get('/auth/userinfo')
        .set('Authorization', 'Bearer invalid-token')
        .set('Accept', 'application/json')
        .expect(401)
    })

    it('should handle multiple user info requests', async () => {
      const userId = 'user-123'
      const user = {
        id: userId,
        email: 'test@example.com',
        emailVerified: true,
        firstName: 'Test',
        lastName: 'User',
        role: 'MEMBER',
        language: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      mockUserServiceClient.getUser.mockResolvedValue(user)

      const accessToken = generateAccessToken({
        userId,
        email: user.email,
        role: user.role,
      })

      // First request
      await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      // Second request (should be cached)
      await request
        .get('/auth/userinfo')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      // Service should be called twice since caching is disabled in tests
      expect(mockUserServiceClient.getUser).toHaveBeenCalledTimes(2)
    })
  })
})
