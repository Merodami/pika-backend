import { keyManager } from '@pika/crypto'
import { UserRole, UserStatus } from '@pika/types'
import { generateKeyPairSync } from 'crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { JwtTokenService, User } from '../../../services/JwtTokenService.js'

describe('JwtTokenService with RSA Keys', () => {
  let jwtService: JwtTokenService
  let originalEnv: NodeJS.ProcessEnv

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    isActive: () => true,
  }

  beforeEach(async () => {
    originalEnv = { ...process.env }

    // Generate test RSA keys
    const { publicKey, privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    })

    // Set up environment with base64-encoded keys (like in production)
    process.env.JWT_ALGORITHM = 'RS256'
    process.env.JWT_PRIVATE_KEY = Buffer.from(privateKey).toString('base64')
    process.env.JWT_PUBLIC_KEY = Buffer.from(publicKey).toString('base64')
    process.env.JWT_ACCESS_TOKEN_EXPIRY = '15m'
    process.env.JWT_REFRESH_TOKEN_EXPIRY = '7d'
    process.env.JWT_ISSUER = 'test-issuer'
    process.env.JWT_AUDIENCE = 'test-audience'

    // Initialize KeyManager with RSA keys
    await keyManager.initialize()

    jwtService = new JwtTokenService(
      '15m', // access token expiry
      '7d', // refresh token expiry
      'test-issuer',
      'test-audience',
      undefined, // no cache service for unit tests
      'RS256' as any,
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    keyManager.clear()
    process.env = originalEnv
  })

  describe('Token Generation with RSA', () => {
    it('should generate valid JWT tokens with RS256 algorithm', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      expect(tokens).toHaveProperty('accessToken')
      expect(tokens).toHaveProperty('refreshToken')
      expect(tokens.accessToken).toBeTruthy()
      expect(tokens.refreshToken).toBeTruthy()

      // Verify tokens are properly formatted JWTs (header.payload.signature)
      expect(tokens.accessToken.split('.')).toHaveLength(3)
      expect(tokens.refreshToken.split('.')).toHaveLength(3)
    })

    it('should generate tokens that can be verified with public key', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      // Verify access token
      const accessResult = await jwtService.verifyToken(
        tokens.accessToken,
        'access',
      )

      expect(accessResult.isValid).toBe(true)
      expect(accessResult.payload?.userId).toBe(mockUser.id)
      expect(accessResult.payload?.email).toBe(mockUser.email)
      expect(accessResult.payload?.type).toBe('access')

      // Verify refresh token
      const refreshResult = await jwtService.verifyToken(
        tokens.refreshToken,
        'refresh',
      )

      expect(refreshResult.isValid).toBe(true)
      expect(refreshResult.payload?.userId).toBe(mockUser.id)
      expect(refreshResult.payload?.type).toBe('refresh')
    })

    it('should include proper JWT claims in tokens', async () => {
      const tokens = await jwtService.generateTokens(mockUser)
      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.payload?.iss).toBe('test-issuer')
      expect(result.payload?.aud).toBe('test-audience')
      expect(result.payload?.iat).toBeDefined()
      expect(result.payload?.exp).toBeDefined()
      expect(result.payload?.jti).toBeDefined()
    })

    it('should handle base64-encoded keys from environment', async () => {
      // Keys are already base64-encoded in setup
      const tokens = await jwtService.generateTokens(mockUser)

      expect(tokens.accessToken).toBeTruthy()

      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(true)
    })

    it('should handle PEM-formatted keys directly', async () => {
      // Reset environment with PEM-formatted keys (not base64)
      const { publicKey, privateKey } = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      })

      process.env.JWT_PRIVATE_KEY = privateKey
      process.env.JWT_PUBLIC_KEY = publicKey

      // Re-initialize KeyManager
      keyManager.clear()
      await keyManager.initialize()

      const service = new JwtTokenService(
        '15m',
        '7d',
        'test-issuer',
        'test-audience',
        undefined,
        'RS256' as any,
      )

      const tokens = await service.generateTokens(mockUser)
      const result = await service.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(true)
    })
  })

  describe('Token Verification with RSA', () => {
    it('should reject tokens signed with different private key', async () => {
      // Generate tokens with current keys
      const tokens = await jwtService.generateTokens(mockUser)

      // Create new service with different keys
      const { publicKey: newPublicKey, privateKey: newPrivateKey } =
        generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
        })

      process.env.JWT_PRIVATE_KEY =
        Buffer.from(newPrivateKey).toString('base64')
      process.env.JWT_PUBLIC_KEY = Buffer.from(newPublicKey).toString('base64')

      keyManager.clear()
      await keyManager.initialize()

      const newService = new JwtTokenService(
        '15m',
        '7d',
        'test-issuer',
        'test-audience',
        undefined,
        'RS256' as any,
      )

      // Try to verify old token with new keys
      const result = await newService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should verify RS256 algorithm is enforced', async () => {
      const tokens = await jwtService.generateTokens(mockUser)

      // Decode token header to verify algorithm
      const [headerBase64] = tokens.accessToken.split('.')
      const header = JSON.parse(Buffer.from(headerBase64, 'base64').toString())

      expect(header.alg).toBe('RS256')
      expect(header.typ).toBe('JWT')
    })
  })

  describe('Token Refresh with RSA', () => {
    it('should refresh access token using RSA-signed refresh token', async () => {
      const originalTokens = await jwtService.generateTokens(mockUser)
      const refreshedTokens = await jwtService.refreshAccessToken(
        originalTokens.refreshToken,
      )

      expect(refreshedTokens.accessToken).toBeTruthy()
      expect(refreshedTokens.accessToken).not.toBe(originalTokens.accessToken)

      // Verify new token is valid
      const result = await jwtService.verifyToken(
        refreshedTokens.accessToken,
        'access',
      )

      expect(result.isValid).toBe(true)
      expect(result.payload?.userId).toBe(mockUser.id)
    })
  })

  describe('Business User Tokens with RSA', () => {
    it('should include business-specific claims for business users', async () => {
      const businessUser: User = {
        ...mockUser,
        role: UserRole.BUSINESS,
        hasActiveBusinesses: true,
      }

      const tokens = await jwtService.generateTokens(businessUser)
      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(true)
      expect(result.payload?.role).toBe(UserRole.BUSINESS)
      expect(result.payload?.hasActiveBusinesses).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should throw meaningful error when RSA keys are missing', async () => {
      delete process.env.JWT_PRIVATE_KEY
      delete process.env.JWT_PUBLIC_KEY

      keyManager.clear()

      await expect(keyManager.initialize()).rejects.toThrow(
        'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are required for RS256',
      )
    })

    it('should handle malformed base64 keys gracefully', async () => {
      process.env.JWT_PRIVATE_KEY = 'not-valid-base64!@#$%'
      process.env.JWT_PUBLIC_KEY = 'also-not-valid!@#$%'

      keyManager.clear()

      await expect(keyManager.initialize()).rejects.toThrow()
    })
  })

  describe('Integration with jsonwebtoken library', () => {
    it('should generate tokens compatible with jsonwebtoken verify', async () => {
      const jwt = await import('jsonwebtoken')
      const tokens = await jwtService.generateTokens(mockUser)

      // Get the public key for verification
      const publicKeyPem = Buffer.from(
        process.env.JWT_PUBLIC_KEY!,
        'base64',
      ).toString()

      // Verify using jsonwebtoken directly
      const decoded = jwt.default.verify(tokens.accessToken, publicKeyPem, {
        algorithms: ['RS256'],
        issuer: 'test-issuer',
        audience: 'test-audience',
      }) as any

      expect(decoded.userId).toBe(mockUser.id)
      expect(decoded.email).toBe(mockUser.email)
      expect(decoded.type).toBe('access')
    })

    it('should handle the key format conversion properly', async () => {
      // This test verifies that our getSigningKey() fix works correctly
      const tokens = await jwtService.generateTokens(mockUser)

      // Should not throw "secretOrPrivateKey is not valid key material"
      expect(tokens.accessToken).toBeTruthy()

      // Verify the token is valid
      const result = await jwtService.verifyToken(tokens.accessToken, 'access')

      expect(result.isValid).toBe(true)
    })
  })
})
