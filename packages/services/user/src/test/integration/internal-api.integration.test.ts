import { vi } from 'vitest'

// Mock @pika/shared to provide CommunicationServiceClient
vi.mock('@pikad', async () => {
  const actualShared =
    await vi.importActual<typeof import('@pikad')>('@p@p@p@pika

  return {
    ...actualShared,
    CommunicationServiceClient: vi.fn().mockImplementation(() => ({
      sendEmail: vi.fn().mockResolvedValue(undefined),
    })),
  }
})

import type {
  CreateEmailVerificationTokenRequest,
  CreatePasswordResetTokenRequest,
  ValidatePasswordResetTokenRequest,
  VerifyEmailRequest,
} from '@pikanternal'
import { MemoryCacheService } from '@pika'
import type { FileStoragePort } from '@pikad'
import type { InternalAPIClient, TestDatabase } from '@pika'
import {
  cleanupTestDatabase,
  createTestDatabase,
  InternalAPITestHelper,
} from '@pika'
import bcrypt from 'bcrypt'
import type { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createUserServer } from '../../server.js'

describe('User Internal API Integration Tests', () => {
  let app: Express
  let testDb: TestDatabase
  let internalClient: InternalAPIClient
  let internalAPIHelper: InternalAPITestHelper
  let cacheService: MemoryCacheService
  let testUserIds: { existing: string; new: string }

  // Mock file storage
  const mockFileStorage: FileStoragePort = {
    saveFile: vi.fn().mockResolvedValue({
      url: 'http://mockstorage.com/test.jpg',
      path: 'test.jpg',
    }),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  }

  beforeAll(async () => {
    // Setup internal API test helper
    internalAPIHelper = new InternalAPITestHelper(
      'dev-service-api-key-change-in-production',
    )
    internalAPIHelper.setup()

    // Setup test database
    testDb = await createTestDatabase({
      databaseName: 'test_user_internal_db',
      useInitSql: true,
      startupTimeout: 120000,
    })

    // Create server
    cacheService = new MemoryCacheService()
    app = await createUserServer({
      prisma: testDb.prisma,
      cacheService,
      fileStorage: mockFileStorage,
    })

    // Create internal API client
    internalClient = internalAPIHelper.createClient(app)

    // Create a test user for tests that need an existing user
    const existingUser = await testDb.prisma.user.create({
      data: {
        id: uuid(),
        email: 'existing@test.com',
        firstName: 'Existing',
        lastName: 'User',
        password: await bcrypt.hash('ExistingPassword123!', 10),
        role: 'MEMBER',
        status: 'ACTIVE',
        emailVerified: true,
      },
    })

    testUserIds = {
      existing: existingUser.id,
      new: uuid(),
    }
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear cache
    await cacheService.clear()
    // Note: Token management is handled internally by the service
  })

  describe('GET /internal/users/auth/by-email/:email', () => {
    it('should get user auth data by email', async () => {
      const response = await internalClient
        .get('/internal/users/auth/by-email/existing@test.com')
        .expect(200)

      expect(response.body).toMatchObject({
        id: testUserIds.existing,
        email: 'existing@test.com',
        role: 'MEMBER',
        status: 'ACTIVE',
        emailVerified: true,
        password: expect.any(String),
      })
    })

    it('should return 404 for non-existent email', async () => {
      await internalClient
        .get('/internal/users/auth/by-email/nonexistent@test.com')
        .expect(404)
    })
  })

  describe('GET /internal/users/auth/:id', () => {
    it('should get user auth data by ID', async () => {
      const response = await internalClient
        .get(`/internal/users/auth/${testUserIds.existing}`)
        .expect(200)

      expect(response.body).toMatchObject({
        id: testUserIds.existing,
        email: 'existing@test.com',
        role: 'MEMBER',
        status: 'ACTIVE',
        emailVerified: true,
        password: expect.any(String),
      })
    })

    it('should return 404 for non-existent ID', async () => {
      const nonExistentId = uuid()

      await internalClient
        .get(`/internal/users/auth/${nonExistentId}`)
        .expect(404)
    })
  })

  describe('POST /internal/users', () => {
    it('should create a new user', async () => {
      const createRequest = {
        email: 'newuser@test.com',
        passwordHash: await bcrypt.hash('NewPassword123!', 10),
        firstName: 'New',
        lastName: 'User',
        role: 'MEMBER' as const,
        acceptTerms: true,
      }

      const response = await internalClient
        .post('/internal/users')
        .send(createRequest)
        .expect(201)

      expect(response.body).toMatchObject({
        id: expect.any(String),
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        role: 'MEMBER',
        status: 'UNCONFIRMED',
        emailVerified: false,
      })

      // Verify user was created in database
      const user = await testDb.prisma.user.findUnique({
        where: { email: 'newuser@test.com' },
      })

      expect(user).toBeTruthy()
      expect(user?.password).toBeTruthy()
      // Verify password is hashed
      expect(user?.password).not.toBe('NewPassword123!')
    })

    it('should reject duplicate email', async () => {
      const createRequest = {
        email: 'existing@test.com',
        passwordHash: await bcrypt.hash('AnotherPassword123!', 10),
        firstName: 'Another',
        lastName: 'User',
        role: 'MEMBER' as const,
        acceptTerms: true,
      }

      await internalClient
        .post('/internal/users')
        .send(createRequest)
        .expect(409)
    })

    it('should reject invalid email format', async () => {
      const createRequest = {
        email: 'invalid-email',
        passwordHash: await bcrypt.hash('Password123!', 10),
        firstName: 'Test',
        lastName: 'User',
        role: 'MEMBER' as const,
        acceptTerms: true,
      }

      const response = await internalClient
        .post('/internal/users')
        .send(createRequest)

      expect(response.status).toBe(400)
      expect(response.body).toMatchObject({
        status_code: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Invalid email'),
          validationErrors: expect.objectContaining({
            email: expect.arrayContaining([
              expect.stringContaining('Invalid email'),
            ]),
          }),
        },
      })
    })
  })

  describe('POST /internal/users/:id/last-login', () => {
    it('should update last login timestamp', async () => {
      const updateRequest = {
        userId: testUserIds.existing,
        loginTime: new Date().toISOString(),
      }

      await internalClient
        .post(`/internal/users/${testUserIds.existing}/last-login`)
        .send(updateRequest)
        .expect(204)

      // Verify lastLoginAt was updated
      const user = await testDb.prisma.user.findUnique({
        where: { id: testUserIds.existing },
      })

      expect(user?.lastLoginAt).toBeTruthy()
      expect(user?.lastLoginAt).toBeInstanceOf(Date)
    })

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = uuid()
      const updateRequest = {
        userId: nonExistentId,
        loginTime: new Date().toISOString(),
      }

      await internalClient
        .post(`/internal/users/${uuid()}/last-login`)
        .send(updateRequest)
        .expect(404)
    })
  })

  describe('GET /internal/users/check-email/:email', () => {
    it('should return exists true for existing email', async () => {
      const response = await internalClient
        .get('/internal/users/check-email/existing@test.com')
        .expect(200)

      expect(response.body).toEqual({ exists: true })
    })

    it('should return exists false for non-existent email', async () => {
      const response = await internalClient
        .get('/internal/users/check-email/nonexistent@test.com')
        .expect(200)

      expect(response.body).toEqual({ exists: false })
    })
  })

  describe('GET /internal/users/check-phone/:phone', () => {
    it('should check phone existence', async () => {
      // First, update the test user with a phone number
      await testDb.prisma.user.update({
        where: { id: testUserIds.existing },
        data: { phoneNumber: '+1234567890' },
      })

      const response = await internalClient
        .get('/internal/users/check-phone/+1234567890')
        .expect(200)

      expect(response.body).toEqual({ exists: true })
    })

    it('should return exists false for non-existent phone', async () => {
      const response = await internalClient
        .get('/internal/users/check-phone/+9999999999')
        .expect(200)

      expect(response.body).toEqual({ exists: false })
    })
  })

  describe('POST /internal/users/:id/password', () => {
    it('should update user password', async () => {
      const updateRequest = {
        userId: testUserIds.existing,
        passwordHash: await bcrypt.hash('NewSecurePassword123!', 10),
      }

      await internalClient
        .post(`/internal/users/${testUserIds.existing}/password`)
        .send(updateRequest)
        .expect(204)

      // Verify password was changed
      const user = await testDb.prisma.user.findUnique({
        where: { id: testUserIds.existing },
      })
      const isValidPassword = await bcrypt.compare(
        'NewSecurePassword123!',
        user!.password!,
      )

      expect(isValidPassword).toBe(true)
    })

    it('should accept any valid hash format', async () => {
      const updateRequest = {
        userId: testUserIds.existing,
        passwordHash: 'any-hash-format-is-accepted', // Internal APIs trust the hash
      }

      await internalClient
        .post(`/internal/users/${testUserIds.existing}/password`)
        .send(updateRequest)
        .expect(204)
    })
  })

  describe('POST /internal/users/:id/verify-email', () => {
    it('should mark email as verified', async () => {
      // Create unverified user
      const unverifiedUser = await testDb.prisma.user.create({
        data: {
          id: uuid(),
          email: 'unverified@test.com',
          firstName: 'Unverified',
          lastName: 'User',
          role: 'MEMBER',
          status: 'ACTIVE',
          emailVerified: false,
        },
      })

      const verifyRequest: VerifyEmailRequest = {
        userId: unverifiedUser.id,
      }

      const response = await internalClient
        .post(`/internal/users/${unverifiedUser.id}/verify-email`)
        .send(verifyRequest)
        .expect(200)

      expect(response.body).toEqual({ success: true })

      // Verify email was marked as verified
      const user = await testDb.prisma.user.findUnique({
        where: { id: unverifiedUser.id },
      })

      expect(user?.emailVerified).toBe(true)
    })
  })

  describe('Password Reset Token Flow', () => {
    // Don't use beforeEach here - we need the cache to persist within this test

    it('should create, validate, and invalidate password reset token', async () => {
      // 1. Create token
      const createTokenRequest: CreatePasswordResetTokenRequest = {}

      const createResponse = await internalClient
        .post(`/internal/users/${testUserIds.existing}/password-reset-token`)
        .send(createTokenRequest)
        .expect(200)

      expect(createResponse.body).toMatchObject({
        token: expect.any(String),
      })

      const { token } = createResponse.body

      // 2. Validate token immediately after creation
      const validateRequest: ValidatePasswordResetTokenRequest = {
        token,
      }

      const validateResponse = await internalClient
        .post('/internal/users/validate-password-reset-token')
        .send(validateRequest)

      expect(validateResponse.status).toBe(200)
      expect(validateResponse.body).toMatchObject({
        userId: testUserIds.existing,
      })

      // 3. Invalidate token
      await internalClient
        .post('/internal/users/invalidate-password-reset-token')
        .send({ token })
        .expect(200)

      // 4. Verify token is no longer valid - should throw error
      await internalClient
        .post('/internal/users/validate-password-reset-token')
        .send(validateRequest)
        .expect(401)
    })

    it('should reject invalid token', async () => {
      const validateRequest: ValidatePasswordResetTokenRequest = {
        token: 'invalid-token',
      }

      await internalClient
        .post('/internal/users/validate-password-reset-token')
        .send(validateRequest)
        .expect(401)
    })
  })

  describe('Email Verification Token Flow', () => {
    // Don't use beforeEach here - we need the cache to persist within this test

    it('should create and validate email verification token', async () => {
      // 1. Create token
      const createTokenRequest: CreateEmailVerificationTokenRequest = {
        userId: testUserIds.existing,
      }

      const createResponse = await internalClient
        .post(
          `/internal/users/${testUserIds.existing}/email-verification-token`,
        )
        .send(createTokenRequest)
        .expect(200)

      expect(createResponse.body).toMatchObject({
        token: expect.any(String),
      })

      const { token } = createResponse.body

      // 2. Validate token immediately after creation
      const validateResponse = await internalClient
        .post('/internal/users/validate-email-verification-token')
        .send({ token })
        .expect(200)

      expect(validateResponse.body).toMatchObject({
        userId: testUserIds.existing,
      })
    })
  })

  describe('Authentication and Authorization', () => {
    it('should reject all internal endpoints without x-api-key', async () => {
      const endpoints = [
        { method: 'get', path: '/internal/users/auth/by-email/test@test.com' },
        { method: 'get', path: '/internal/users/auth/123' },
        { method: 'post', path: '/internal/users' },
        { method: 'post', path: '/internal/users/123/last-login' },
        { method: 'get', path: '/internal/users/check-email/test@test.com' },
        { method: 'get', path: '/internal/users/check-phone/+1234567890' },
        { method: 'post', path: '/internal/users/123/password' },
        { method: 'post', path: '/internal/users/123/verify-email' },
      ]

      for (const endpoint of endpoints) {
        const request = supertest(app)[endpoint.method](endpoint.path)

        if (endpoint.method !== 'get') {
          // Send minimal valid data to avoid validation errors
          if (
            endpoint.path.includes('/internal/users') &&
            endpoint.path.split('/').length === 3
          ) {
            // POST /internal/users
            request.send({
              email: 'test@example.com',
              passwordHash: await bcrypt.hash('password', 10),
              firstName: 'Test',
              lastName: 'User',
              role: 'MEMBER' as const,
              acceptTerms: true,
            })
          } else if (endpoint.path.includes('last-login')) {
            request.send({ userId: '123', loginTime: new Date().toISOString() })
          } else if (endpoint.path.includes('password')) {
            request.send({
              userId: '123',
              passwordHash: await bcrypt.hash('password', 10),
            })
          } else if (endpoint.path.includes('verify-email')) {
            request.send({ userId: '123' })
          } else {
            request.send({})
          }
        }

        const response = await request

        if (response.status !== 401) {
          console.log(
            `Endpoint ${endpoint.method.toUpperCase()} ${endpoint.path} returned:`,
            {
              status: response.status,
              body: response.body,
            },
          )
        }

        expect(response.status).toBe(401)
      }
    })

    it('should accept requests with valid service API key', async () => {
      // Just test one endpoint to verify the middleware works
      const response = await internalClient
        .get('/internal/users/check-email/any@email.com')
        .expect(200)

      expect(response.body).toMatchObject({
        exists: false,
      })
    })
  })

  afterAll(async () => {
    // Cleanup
    internalAPIHelper.cleanup()
    await cleanupTestDatabase(testDb)
  })
})
