/**
 * Social Authentication Integration Tests
 * Tests Firebase-based social login with emulator support
 */

import { vi } from 'vitest'

// Unmock modules for integration tests
vi.unmock('@pika/http')
vi.unmock('@pika/api')
vi.unmock('@pika/redis')
vi.unmock('@pika/shared')

import { createAuthServer } from '@auth-service/server.js'
import { FirebaseTestClient } from '@auth-service/test/utils/firebase-test-client.js'
import { MemoryCacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
  createE2EAuthHelper,
  E2EAuthHelper,
} from '@pika/tests'
import { UserRole, UserStatus } from '@prisma/client'
import { Express } from 'express'
import supertest from 'supertest'
import { v4 as uuid } from 'uuid'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Create a mock user service that works with real tokens
const createMockUserService = () => ({
  getUserByEmail: vi.fn(),
  getUserAuthDataByEmail: vi.fn(), // Required by Firebase auth strategy
  createUser: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  updateLastLogin: vi.fn(), // Required by auth strategy
})

describe('Social Authentication Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: Express
  let request: supertest.SuperTest<supertest.Test>
  let firebaseTestClient: FirebaseTestClient
  let mockUserService: ReturnType<typeof createMockUserService>
  let mockCommunicationService: any

  beforeAll(async () => {
    logger.debug('Setting up Social Auth integration tests...')

    // Create test database
    testDb = await createTestDatabase()

    // Initialize Firebase test client
    firebaseTestClient = new FirebaseTestClient()
    await firebaseTestClient.initialize()

    // Create cache service
    const cacheService = new MemoryCacheService()

    // Create mock services
    mockUserService = createMockUserService()
    mockCommunicationService = {
      sendEmail: vi.fn(),
      sendSms: vi.fn(),
    }

    // Create auth server with real Firebase configuration
    app = await createAuthServer({
      port: 0, // Random port for testing
      cacheService,
      userServiceClient: mockUserService as any,
      communicationClient: mockCommunicationService as any,
    })

    request = supertest(app)

    logger.debug('Social Auth service integration setup complete')
  }, 120000)

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Clear database between tests
    if (testDb?.prisma) {
      await clearTestDatabase(testDb.prisma)
    }

    // Clean up Firebase test users
    await firebaseTestClient.cleanup()
  })

  afterAll(async () => {
    logger.debug('Cleaning up Social Auth integration resources...')

    if (firebaseTestClient) {
      await firebaseTestClient.destroy()
    }

    if (testDb) {
      await cleanupTestDatabase(testDb)
    }

    logger.debug('Social Auth integration resources cleaned up.')
  })

  describe('POST /auth/social/login - Firebase Emulator Integration', () => {
    it('should successfully create new user with Google social login', async () => {
      // Create a real Google test user in Firebase emulator
      const { user: firebaseUser, idToken } = await firebaseTestClient.createGoogleTestUser()
      
      logger.debug('Created Firebase test user', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        provider: firebaseUser.provider,
      })

      // Mock UserService responses for new user creation
      const newUser = {
        id: uuid(),
        email: firebaseUser.email,
        firstName: 'Test',
        lastName: 'User',
        role: UserRole.customer,
        status: UserStatus.active,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      // Setup the correct sequence of calls:
      // 1. First call in FirebaseAuthStrategy.authenticate -> getUserAuthDataByEmail returns null (new user)
      mockUserService.getUserAuthDataByEmail.mockResolvedValue(null)
      // 2. Since user doesn't exist, createUser is called
      mockUserService.createUser.mockResolvedValue(newUser)
      // 3. Then getUserByEmail is called to get the created user
      mockUserService.getUserByEmail.mockResolvedValue(newUser)
      // 4. Finally updateLastLogin is called
      mockUserService.updateLastLogin.mockResolvedValue(undefined)

      // Make the request with real Firebase token
      const response = await request
        .post('/auth/social/login')
        .send({
          provider: 'google',
          idToken: idToken,
          deviceInfo: {
            deviceId: 'device-123',
            deviceType: 'ios',
          },
          marketingConsent: true,
        })

      expect(response.status).toBe(200)
      
      // Verify response structure
      expect(response.body).toMatchObject({
        user: {
          email: firebaseUser.email,
          firstName: 'Test',
          lastName: 'User',
        },
        isNewUser: true,
        tokenType: 'Bearer',
      })
      expect(response.body.accessToken).toBeDefined()
      expect(response.body.refreshToken).toBeDefined()
      expect(mockUserService.createUser).toHaveBeenCalled()
    })

    it('should link existing user by email with Facebook', async () => {
      // Create existing user in our system (created more than 5 minutes ago)
      const existingUserId = uuid()
      const testEmail = `existing-user-${Date.now()}@example.com`
      const existingUser = {
        id: existingUserId,
        email: testEmail,
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.customer,
        status: UserStatus.active,
        emailVerified: true,
        password: 'hashed-password',
        createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        updatedAt: new Date(),
      }

      // Create Firebase test user with same email
      const { user: firebaseUser, idToken } = await firebaseTestClient.createFacebookTestUser(testEmail)

      // Mock UserService to return existing user
      mockUserService.getUserByEmail.mockResolvedValue(existingUser)
      mockUserService.getUserAuthDataByEmail.mockResolvedValue({
        id: existingUser.id,
        email: existingUser.email,
        hasPassword: true,
        role: existingUser.role,
        status: existingUser.status,
      })
      mockUserService.updateLastLogin.mockResolvedValue(undefined)

      const response = await request
        .post('/auth/social/login')
        .send({
          provider: 'facebook',
          idToken: idToken,
        })

      logger.debug('Link existing user response', {
        status: response.status,
        body: response.body,
      })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        user: {
          id: existingUserId,
          email: testEmail,
        },
        isNewUser: false,
      })
      expect(mockUserService.createUser).not.toHaveBeenCalled()
    })

    it('should handle Apple login', async () => {
      // Create a real Apple test user in Firebase emulator
      const { user: firebaseUser, idToken } = await firebaseTestClient.createAppleTestUser()

      // Mock UserService for new user
      mockUserService.getUserByEmail.mockResolvedValue(null)
      mockUserService.getUserAuthDataByEmail.mockResolvedValue(null)
      
      const newAppleUser = {
        id: uuid(),
        email: firebaseUser.email,
        firstName: 'Test',
        lastName: 'Apple User',
        role: UserRole.customer,
        status: UserStatus.active,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      
      mockUserService.createUser.mockResolvedValue(newAppleUser)
      mockUserService.getUserByEmail.mockResolvedValue(newAppleUser)
      mockUserService.updateLastLogin.mockResolvedValue(undefined)

      const response = await request
        .post('/auth/social/login')
        .send({
          provider: 'apple',
          idToken: idToken,
        })

      expect(response.status).toBe(200)
      expect(response.body).toMatchObject({
        user: {
          email: firebaseUser.email,
        },
        isNewUser: true,
        tokenType: 'Bearer',
      })
    })

    it('should reject malformed tokens', async () => {
      const response = await request
        .post('/auth/social/login')
        .send({
          provider: 'google',
          idToken: 'clearly.malformed.token',
        })

      expect(response.status).toBeGreaterThanOrEqual(400)
      expect(response.body.error).toBeDefined()
    })

    it('should validate request body properly', async () => {
      // Test missing provider
      const response1 = await request
        .post('/auth/social/login')
        .send({
          idToken: 'some-token',
        })

      expect(response1.status).toBe(400)
      expect(response1.body.error?.code).toBe('validationError')

      // Test missing idToken
      const response2 = await request
        .post('/auth/social/login')
        .send({
          provider: 'google',
        })

      expect(response2.status).toBe(400)
      expect(response2.body.error?.code).toBe('validationError')

      // Test invalid provider
      const response3 = await request
        .post('/auth/social/login')
        .send({
          provider: 'invalid-provider',
          idToken: 'some-token',
        })

      expect(response3.status).toBe(400)
      expect(response3.body.error?.code).toBe('validationError')
    })
  })

  describe('Multiple Social Provider Tests', () => {
    it('should handle different providers correctly', async () => {
      // Test all three providers
      const providers = ['google', 'facebook', 'apple'] as const
      
      for (const providerType of providers) {
        logger.info(`Testing ${providerType} provider`)
        
        // Create test user for each provider
        const testResult = await (async () => {
          switch (providerType) {
            case 'google':
              return firebaseTestClient.createGoogleTestUser()
            case 'facebook':
              return firebaseTestClient.createFacebookTestUser()
            case 'apple':
              return firebaseTestClient.createAppleTestUser()
          }
        })()

        // Mock user service
        mockUserService.getUserByEmail.mockResolvedValue(null)
        mockUserService.getUserAuthDataByEmail.mockResolvedValue(null)
        
        const newProviderUser = {
          id: uuid(),
          email: testResult.user.email,
          firstName: 'Test',
          lastName: `${providerType} User`,
          role: UserRole.customer,
          status: UserStatus.active,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
        
        mockUserService.createUser.mockResolvedValue(newProviderUser)
        mockUserService.getUserByEmail.mockResolvedValue(newProviderUser)
        mockUserService.updateLastLogin.mockResolvedValue(undefined)

        const response = await request
          .post('/auth/social/login')
          .send({
            provider: providerType,
            idToken: testResult.idToken,
          })

        expect(response.status).toBe(200)
        expect(response.body.user.email).toBe(testResult.user.email)
        expect(response.body.accessToken).toBeDefined()
      }
    })
  })

  describe('Token Structure Validation', () => {
    it('should verify Firebase custom tokens have correct structure', async () => {
      const { user, idToken } = await firebaseTestClient.createGoogleTestUser()
      
      // Verify our test client can decode its own tokens
      const decoded = await firebaseTestClient.verifyToken(idToken)
      
      expect(decoded.uid).toBe(user.uid)
      expect(decoded.firebase?.sign_in_provider).toBe('google')
      expect(decoded.firebase?.identities).toBeDefined()
    })
  })
})