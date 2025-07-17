/**
 * Firebase Token Exchange Integration Tests
 *
 * Tests Firebase token exchange endpoints using real database with Testcontainers
 * and Firebase emulator for authentication
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

import {
  FIREBASE_EMULATOR_CONFIG,
  FIREBASE_PROJECT_ID,
} from '@pika/environment'
import { logger } from '@pika/shared'
import { MockCacheService } from '@tests/mocks/cacheServiceMock.js'
import {
  cleanupTestDatabase,
  clearTestDatabase,
  createTestDatabase,
  type TestDatabaseResult,
} from '@tests/utils/testDatabaseHelper.js'
import { FastifyInstance } from 'fastify'
import admin from 'firebase-admin'
import supertest from 'supertest'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { createUserServer } from '../../../../services/user/src/server.js'
import {
  createMockFirebaseIdToken,
  createMockFirebaseUser,
} from '../utils/mockFirebaseToken.js'

// Mock file storage
const mockFileStorage = {
  upload: vi.fn().mockResolvedValue({
    url: 'http://mockstorage.com/file.jpg',
    path: 'file.jpg',
  }),
  delete: vi.fn().mockResolvedValue(undefined),
}

describe('Firebase Token Exchange Integration Tests', () => {
  let testDb: TestDatabaseResult
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>
  let mockCacheService: MockCacheService
  let firebaseAuth: admin.auth.Auth

  // Test user data for Firebase emulator
  const testFirebaseUser = createMockFirebaseUser()

  // Device info for tests
  const testDeviceInfo = {
    deviceId: '123e4567-e89b-12d3-a456-426614174000',
    deviceName: 'iPhone 15 Pro Max',
    deviceType: 'ios' as const,
    fcmToken: 'fPF1d2mF8kE:APA91bH_test_token',
  }

  beforeAll(async () => {
    logger.debug('Starting Firebase Token Exchange Integration Tests...')

    // Ensure Firebase emulator is enabled for tests
    if (!FIREBASE_EMULATOR_CONFIG.useEmulator) {
      throw new Error(
        'Firebase emulator must be enabled for integration tests. ' +
          'Set FIREBASE_EMULATOR=true in your environment.',
      )
    }

    // Initialize Firebase Admin for emulator
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: FIREBASE_PROJECT_ID || 'pika-test',
      })
    }
    firebaseAuth = admin.auth()

    // Initialize mock cache service
    mockCacheService = new MockCacheService()

    // Use unified test database helper
    testDb = await createTestDatabase({
      databaseName: 'test_firebase_token_exchange_db',
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

    logger.debug('Firebase Token Exchange Integration Test setup complete')
  }, 120000) // 2 minute timeout

  beforeEach(async () => {
    vi.clearAllMocks()
    // Clear database between tests for isolation
    await clearTestDatabase(testDb.prisma)
  })

  afterAll(async () => {
    logger.debug('Cleaning up Firebase token exchange integration tests...')

    if (app) await app.close()
    await cleanupTestDatabase(testDb)

    logger.debug('Cleanup complete')
  })

  describe('Firebase Token Exchange', () => {
    let firebaseIdToken: string

    beforeEach(async () => {
      // Create a test user in Firebase emulator and get custom token
      try {
        // First try to get user, if not exists create it
        try {
          await firebaseAuth.getUser(testFirebaseUser.uid)
        } catch {
          // User doesn't exist, create it
          await firebaseAuth.createUser({
            uid: testFirebaseUser.uid,
            email: testFirebaseUser.email,
            displayName: testFirebaseUser.displayName,
            photoURL: testFirebaseUser.photoURL,
            emailVerified: testFirebaseUser.emailVerified,
          })
        }

        // Create mock Firebase ID token for testing
        // In a real scenario, the client would exchange the custom token for an ID token
        firebaseIdToken = createMockFirebaseIdToken(
          testFirebaseUser,
          'google.com',
        )
      } catch (error) {
        console.error('Error setting up Firebase test user:', error)
        throw error
      }
    })

    it('should successfully exchange Firebase token for JWT tokens (new user)', async () => {
      const response = await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'google',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      // Verify response structure
      expect(response.body).toMatchObject({
        user: {
          id: expect.any(String),
          email: testFirebaseUser.email,
          first_name: expect.any(String),
          last_name: expect.any(String),
          role: 'CUSTOMER',
          is_new_user: true,
          requires_additional_info: expect.any(Boolean),
          requires_mfa: false,
        },
        tokens: {
          access_token: expect.any(String),
          refresh_token: expect.any(String),
          expires_in: expect.any(Number),
        },
      })

      // Verify user was created in database
      const user = await testDb.prisma.user.findUnique({
        where: { email: testFirebaseUser.email },
      })

      expect(user).toBeTruthy()
      expect(user?.role).toBe('CUSTOMER')
      expect(user?.status).toBe('ACTIVE')

      // Verify user identity was created
      const identity = await testDb.prisma.userIdentity.findFirst({
        where: { firebaseUid: testFirebaseUser.uid },
      })

      expect(identity).toBeTruthy()
      expect(identity?.provider).toBe('google')
      expect(identity?.isEmailVerified).toBe(true)

      // Verify auth method was tracked
      const authMethod = await testDb.prisma.userAuthMethod.findFirst({
        where: {
          userId: user!.id,
          authMethod: 'google',
        },
      })

      expect(authMethod).toBeTruthy()
      expect(authMethod?.isVerified).toBe(true)

      // Verify device info was recorded
      const device = await testDb.prisma.userDevice.findFirst({
        where: {
          userId: user!.id,
          deviceId: testDeviceInfo.deviceId,
        },
      })

      expect(device).toBeTruthy()
      expect(device?.deviceType).toBe('ios')
      expect(device?.fcmToken).toBe(testDeviceInfo.fcmToken)

      // Verify security event was logged
      const securityEvent = await testDb.prisma.securityEvent.findFirst({
        where: { userId: user!.id },
      })

      expect(securityEvent).toBeTruthy()
      expect(securityEvent?.eventType).toBe('signup_google')
    })

    it('should successfully exchange Firebase token for existing user', async () => {
      // First, create a user via token exchange
      await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'google',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      // Clear device ID to simulate different device
      const differentDeviceInfo = {
        ...testDeviceInfo,
        deviceId: '987e6543-e21b-43d3-b654-426614174321',
        deviceName: 'Android Phone',
        deviceType: 'android' as const,
      }

      // Second token exchange should return existing user
      const response = await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'google',
          device_info: {
            device_id: differentDeviceInfo.deviceId,
            device_name: differentDeviceInfo.deviceName,
            device_type: differentDeviceInfo.deviceType,
            fcm_token: differentDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      expect(response.body.user.is_new_user).toBe(false)
      expect(response.body.user.email).toBe(testFirebaseUser.email)

      // Verify second device was recorded
      const devices = await testDb.prisma.userDevice.findMany({
        where: { userId: response.body.user.id },
      })

      expect(devices).toHaveLength(2)
      expect(devices.some((d) => d.deviceType === 'ios')).toBe(true)
      expect(devices.some((d) => d.deviceType === 'android')).toBe(true)
    })

    it('should handle Facebook provider', async () => {
      const response = await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'facebook',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      expect(response.body.user.is_new_user).toBe(true)

      // Verify Facebook identity was created
      const identity = await testDb.prisma.userIdentity.findFirst({
        where: { firebaseUid: testFirebaseUser.uid },
      })

      expect(identity?.provider).toBe('facebook')

      // Verify Facebook auth method was tracked
      const authMethod = await testDb.prisma.userAuthMethod.findFirst({
        where: {
          userId: response.body.user.id,
          authMethod: 'facebook',
        },
      })

      expect(authMethod).toBeTruthy()
    })

    it('should reject invalid Firebase token', async () => {
      const response = await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: 'invalid-token',
          provider: 'google',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(401)

      expect(response.body).toMatchObject({
        error: {
          code: 'NOT_AUTHENTICATED',
          message: expect.any(String),
          domain: 'security',
          timestamp: expect.any(String),
        },
      })
    })

    it('should reject missing required fields', async () => {
      const response = await request
        .post('/auth/exchange-token')
        .send({
          provider: 'google',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
          // Missing firebase_id_token
        })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should reject invalid device info', async () => {
      const response = await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'google',
          device_info: {
            device_id: 'invalid-uuid',
            device_type: 'invalid-type',
          },
        })
        .expect(400)

      expect(response.body.error).toBeDefined()
    })

    it('should auto-detect provider when not specified', async () => {
      const response = await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          // No provider specified, should auto-detect from token
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      expect(response.body.user.is_new_user).toBe(true)
      expect(response.body.user.email).toBe(testFirebaseUser.email)
    })
  })

  describe('Token Validation', () => {
    let firebaseIdToken: string

    beforeEach(async () => {
      // Create a test user in Firebase emulator and get custom token
      try {
        // First try to get user, if not exists create it
        try {
          await firebaseAuth.getUser(testFirebaseUser.uid)
        } catch {
          // User doesn't exist, create it
          await firebaseAuth.createUser({
            uid: testFirebaseUser.uid,
            email: testFirebaseUser.email,
            displayName: testFirebaseUser.displayName,
            photoURL: testFirebaseUser.photoURL,
            emailVerified: testFirebaseUser.emailVerified,
          })
        }

        // Create mock Firebase ID token for testing
        firebaseIdToken = createMockFirebaseIdToken(
          testFirebaseUser,
          'google.com',
        )
      } catch (error) {
        console.error('Error setting up Firebase test user:', error)
        throw error
      }
    })

    it('should return valid JWT tokens that can be used for API calls', async () => {
      const tokenResponse = await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'google',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      const { access_token } = tokenResponse.body.tokens

      // Test that the access token can be used for authenticated requests
      // (This would depend on having authenticated endpoints to test against)
      expect(access_token).toMatch(/^eyJ/) // JWT format
      expect(tokenResponse.body.tokens.expires_in).toBeGreaterThan(0)
    })
  })

  describe('Security and Audit', () => {
    let firebaseIdToken: string

    beforeEach(async () => {
      // Create a test user in Firebase emulator and get custom token
      try {
        // First try to get user, if not exists create it
        try {
          await firebaseAuth.getUser(testFirebaseUser.uid)
        } catch {
          // User doesn't exist, create it
          await firebaseAuth.createUser({
            uid: testFirebaseUser.uid,
            email: testFirebaseUser.email,
            displayName: testFirebaseUser.displayName,
            photoURL: testFirebaseUser.photoURL,
            emailVerified: testFirebaseUser.emailVerified,
          })
        }

        // Create mock Firebase ID token for testing
        firebaseIdToken = createMockFirebaseIdToken(
          testFirebaseUser,
          'google.com',
        )
      } catch (error) {
        console.error('Error setting up Firebase test user:', error)
        throw error
      }
    })

    it('should log security events for token exchanges', async () => {
      await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'google',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      const securityEvents = await testDb.prisma.securityEvent.findMany()

      expect(securityEvents).toHaveLength(1)

      const event = securityEvents[0]

      expect(event.eventType).toBe('signup_google')
      expect(event.eventData).toMatchObject({
        provider: 'google',
        email: testFirebaseUser.email,
        isNewUser: true,
      })
      expect(event.riskScore).toBe(0) // Google auth is trusted
    })

    it('should update last login timestamp', async () => {
      // First login
      const firstResponse = await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'google',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      const userId = firstResponse.body.user.id
      const firstUser = await testDb.prisma.user.findUnique({
        where: { id: userId },
      })

      // Wait a bit and login again
      await new Promise((resolve) => setTimeout(resolve, 100))

      await request
        .post('/auth/exchange-token')
        .send({
          firebase_id_token: firebaseIdToken,
          provider: 'google',
          device_info: {
            device_id: testDeviceInfo.deviceId,
            device_name: testDeviceInfo.deviceName,
            device_type: testDeviceInfo.deviceType,
            fcm_token: testDeviceInfo.fcmToken,
          },
        })
        .expect(200)

      const updatedUser = await testDb.prisma.user.findUnique({
        where: { id: userId },
      })

      expect(updatedUser?.lastLoginAt?.getTime()).toBeGreaterThan(
        firstUser?.lastLoginAt?.getTime() || 0,
      )
    })
  })
})
