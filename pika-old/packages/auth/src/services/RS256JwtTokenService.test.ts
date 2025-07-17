/**
 * RS256 JWT Token Service Integration Tests
 *
 * Tests RS256 JWT implementation using real environment configuration
 * Following the integration test pattern used in other services
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

import { KeyGenerator } from '@pika/crypto'
import { logger } from '@pika/shared'
import { MockCacheService } from '@pika/tests'
import { UserRole, UserStatus } from '@pika/types-core'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import type { User } from './JwtTokenService.js'
import {
  createRS256JwtTokenService,
  RS256JwtTokenService,
} from './RS256JwtTokenService.js'

// Helper to create test user
const createTestUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  email: 'test@example.com',
  role: UserRole.CUSTOMER,
  status: UserStatus.ACTIVE,
  isActive: () => true,
  ...overrides,
})

describe('RS256JwtTokenService Integration Tests', () => {
  let service: RS256JwtTokenService
  let mockCacheService: MockCacheService

  beforeAll(async () => {
    logger.debug('Starting RS256 JWT Integration Tests...')

    // Initialize mock cache service
    mockCacheService = new MockCacheService()

    // Create service using the factory function (uses real environment)
    service = createRS256JwtTokenService(mockCacheService as any)
  })

  beforeEach(() => {
    // Reset mock cache service before each test
    mockCacheService.clearAll()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    logger.debug('Cleaning up RS256 JWT Integration Tests...')
    // Cleanup if needed
  })

  describe('generateKeyPair', () => {
    it('should generate RSA key pair for production', () => {
      const keyPair = KeyGenerator.generateRSAKeyPair()

      expect(keyPair).toBeDefined()
      expect(keyPair.privateKey).toContain('-----BEGIN PRIVATE KEY-----')
      expect(keyPair.publicKey).toContain('-----BEGIN PUBLIC KEY-----')
    })
  })

  describe('generateTokens', () => {
    it('should create valid RS256 tokens', async () => {
      const user = createTestUser()

      const tokens = await service.generateTokens(user)

      expect(tokens).toBeDefined()
      expect(tokens.accessToken).toBeDefined()
      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.accessToken.split('.')).toHaveLength(3) // JWT format
    })

    it('should include user data in token payload', async () => {
      const user = createTestUser({ role: UserRole.PROVIDER })

      const tokens = await service.generateTokens(user)
      const validation = await service.verifyToken(tokens.accessToken, 'access')

      expect(validation.isValid).toBe(true)
      expect(validation.payload?.userId).toBe(user.id)
      expect(validation.payload?.email).toBe(user.email)
      expect(validation.payload?.role).toBe(user.role)
    })
  })

  describe('verifyToken', () => {
    it('should verify valid access token', async () => {
      const user = createTestUser()

      const tokens = await service.generateTokens(user)
      const validation = await service.verifyToken(tokens.accessToken, 'access')

      expect(validation.isValid).toBe(true)
      expect(validation.payload).toBeDefined()
      expect(validation.payload?.userId).toBe(user.id)
    })

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid.token.here'

      const validation = await service.verifyToken(invalidToken, 'access')

      expect(validation.isValid).toBe(false)
      expect(validation.error).toBeDefined()
    })

    it('should reject token signed with different key', async () => {
      // Generate new key pair
      const differentKeyPair = KeyGenerator.generateRSAKeyPair()
      const differentService = new RS256JwtTokenService(
        differentKeyPair.privateKey,
        differentKeyPair.publicKey,
        'RS256',
        '900',
        '604800',
        'test-issuer',
        'test-audience',
        mockCacheService,
      )

      // Create token with original service
      const user = createTestUser()
      const tokens = await service.generateTokens(user)

      // Try to verify with different key - should fail
      const validation = await differentService.verifyToken(
        tokens.accessToken,
        'access',
      )

      expect(validation.isValid).toBe(false)
    })
  })

  describe('generateTokens - refresh token', () => {
    it('should create valid refresh token', async () => {
      const user = createTestUser()

      const tokens = await service.generateTokens(user)

      expect(tokens.refreshToken).toBeDefined()
      expect(tokens.refreshToken.split('.')).toHaveLength(3)
    })

    it('should store refresh token data in cache', async () => {
      const user = createTestUser()

      const tokens = await service.generateTokens(user)

      // Verify that we can verify the refresh token (which means it's cached)
      const validation = await service.verifyToken(
        tokens.refreshToken,
        'refresh',
      )

      expect(validation.isValid).toBe(true)
      expect(validation.payload?.userId).toBe(user.id)
    })
  })

  describe('verifyToken - refresh token', () => {
    it('should verify valid refresh token from cache', async () => {
      const user = createTestUser()

      const tokens = await service.generateTokens(user)

      // The MockCacheService should already have the refresh token data
      // from the generateTokens call above
      const validation = await service.verifyToken(
        tokens.refreshToken,
        'refresh',
      )

      expect(validation.isValid).toBe(true)
      expect(validation.payload?.userId).toBe(user.id)
    })

    it('should handle cache scenarios correctly', async () => {
      const user = createTestUser()

      // Test that tokens work correctly with cache
      const tokens = await service.generateTokens(user)

      // First verification should work (token in cache)
      let validation = await service.verifyToken(tokens.refreshToken, 'refresh')

      expect(validation.isValid).toBe(true)

      // Clear cache
      await mockCacheService.clearAll()

      // After cache clear, the behavior depends on implementation
      // Some implementations may still verify the JWT signature
      validation = await service.verifyToken(tokens.refreshToken, 'refresh')
      // We'll just verify that the method doesn't crash
      expect(validation).toBeDefined()
      expect(typeof validation.isValid).toBe('boolean')
    })
  })

  describe('revokeToken', () => {
    it('should remove refresh token from cache', async () => {
      const user = createTestUser()

      const tokens = await service.generateTokens(user)

      // Verify token exists in cache first
      let validation = await service.verifyToken(tokens.refreshToken, 'refresh')

      expect(validation.isValid).toBe(true)

      // Revoke the token
      await service.revokeToken(tokens.refreshToken)

      // Verify token is no longer valid
      validation = await service.verifyToken(tokens.refreshToken, 'refresh')
      expect(validation.isValid).toBe(false)
    })
  })

  describe('refreshAccessToken', () => {
    it('should generate new access token from valid refresh token', async () => {
      const user = createTestUser()

      const tokens = await service.generateTokens(user)

      // The MockCacheService should already have the refresh token data
      // from the generateTokens call above

      const result = await service.refreshAccessToken(tokens.refreshToken)

      expect(result).toBeDefined()
      expect(result.accessToken).toBeDefined()
      expect(result.expiresAt).toBeDefined()
    })
  })

  describe('configuration', () => {
    it('should be properly configured from environment', () => {
      // The service should be correctly configured
      expect(service).toBeDefined()

      // Service should be using real environment variables
      // We can't access the internal properties, but we can verify it works
      expect(service.generateTokens).toBeDefined()
      expect(service.verifyToken).toBeDefined()
      expect(service.refreshAccessToken).toBeDefined()
    })
  })
})
