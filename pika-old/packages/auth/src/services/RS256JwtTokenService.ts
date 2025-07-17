import { KeyGenerator } from '@pika/crypto'
import {
  JWT_ACCESS_TOKEN_EXPIRY,
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_ISSUER,
  JWT_PRIVATE_KEY,
  JWT_PUBLIC_KEY,
  JWT_REFRESH_TOKEN_EXPIRY,
} from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { logger } from '@pika/shared'
import jwt, { Algorithm } from 'jsonwebtoken'

import type {
  AuthTokens,
  TokenPayload,
  TokenValidationResult,
  User,
} from './JwtTokenService.js'

/**
 * RS256 JWT Token Service
 * Handles JWT token generation and verification using RSA public/private key pairs
 * This is the industry standard for JWT signing, providing better security than HS256
 */
export class RS256JwtTokenService {
  private readonly privateKey: string
  private readonly publicKey: string
  private readonly algorithm: Algorithm
  private readonly accessTokenExpiry: string
  private readonly refreshTokenExpiry: string
  private readonly issuer: string
  private readonly audience: string
  private readonly cacheService?: ICacheService

  // In-memory token blacklist (fallback when Redis is not available)
  private readonly blacklistedTokens = new Set<string>()

  // Redis key prefixes for organized token management
  private readonly TOKEN_BLACKLIST_PREFIX = 'auth:blacklist:'
  private readonly USER_TOKEN_PREFIX = 'auth:user_tokens:'
  private readonly REFRESH_TOKEN_PREFIX = 'auth:refresh:'

  constructor(
    privateKey: string,
    publicKey: string,
    algorithm: Algorithm = 'RS256',
    accessTokenExpiry: string = '15m',
    refreshTokenExpiry: string = '7d',
    issuer: string = 'pika-api',
    audience: string = 'pika-app',
    cacheService?: ICacheService,
  ) {
    // Parse escaped keys from environment
    this.privateKey = KeyGenerator.parseFromEnv(privateKey)
    this.publicKey = KeyGenerator.parseFromEnv(publicKey)
    this.algorithm = algorithm
    this.accessTokenExpiry = accessTokenExpiry
    this.refreshTokenExpiry = refreshTokenExpiry
    this.issuer = issuer
    this.audience = audience
    this.cacheService = cacheService

    // Validate keys
    if (!this.privateKey || !this.publicKey) {
      throw new Error('JWT private and public keys are required for RS256')
    }

    // Validate algorithm
    const supportedAlgorithms: Algorithm[] = ['RS256', 'RS384', 'RS512']

    if (!supportedAlgorithms.includes(algorithm)) {
      throw new Error(
        `Unsupported algorithm: ${algorithm}. Use RS256, RS384, or RS512`,
      )
    }
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(user: User): Promise<AuthTokens> {
    try {
      // Validate user status
      if (!user.isActive()) {
        throw new Error('Cannot generate tokens for inactive user')
      }

      const now = Math.floor(Date.now() / 1000)
      const jti = this.generateJti(user.id)

      // Generate access token
      const accessPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        type: 'access',
        iat: now,
      }

      const accessToken = jwt.sign(accessPayload, this.privateKey, {
        algorithm: this.algorithm,
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: user.id,
        jwtid: `${jti}-access`,
      } as jwt.SignOptions)

      // Generate refresh token
      const refreshPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        type: 'refresh',
        iat: now,
      }

      const refreshToken = jwt.sign(refreshPayload, this.privateKey, {
        algorithm: this.algorithm,
        expiresIn: this.refreshTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: user.id,
        jwtid: `${jti}-refresh`,
      } as jwt.SignOptions)

      // Calculate expiration dates
      const accessExpiresAt = this.calculateExpirationDate(
        this.accessTokenExpiry,
      )
      const refreshExpiresAt = this.calculateExpirationDate(
        this.refreshTokenExpiry,
      )

      // Store refresh token metadata in Redis for session management
      await this.storeRefreshTokenMetadata(
        user.id,
        `${jti}-refresh`,
        refreshExpiresAt,
      )

      logger.info('Generated RS256 JWT tokens', {
        userId: user.id,
        algorithm: this.algorithm,
        accessExpiresIn: this.accessTokenExpiry,
        refreshExpiresIn: this.refreshTokenExpiry,
      })

      return {
        accessToken,
        refreshToken,
        expiresAt: accessExpiresAt,
        refreshExpiresAt: refreshExpiresAt,
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('inactive user')) {
        throw error
      }

      throw new Error(
        `Failed to generate RS256 tokens: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Verify and decode a JWT token using public key
   */
  async verifyToken(
    token: string,
    expectedType?: 'access' | 'refresh',
  ): Promise<TokenValidationResult> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token)

      if (isBlacklisted) {
        return {
          isValid: false,
          error: 'Token has been revoked',
        }
      }

      // Verify token signature with public key
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: [this.algorithm],
        issuer: this.issuer,
        audience: this.audience,
      }) as TokenPayload

      // Validate token type if specified
      if (expectedType && decoded.type !== expectedType) {
        return {
          isValid: false,
          error: `Expected ${expectedType} token, but got ${decoded.type}`,
        }
      }

      // Validate required claims
      if (!decoded.userId || !decoded.email || !decoded.role) {
        return {
          isValid: false,
          error: 'Token missing required claims',
        }
      }

      return {
        isValid: true,
        payload: decoded,
      }
    } catch (error) {
      let errorMessage = 'Invalid token'

      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token has expired'
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = error.message
      } else if (error instanceof jwt.NotBeforeError) {
        errorMessage = 'Token not active yet'
      }

      return {
        isValid: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; expiresAt: Date }> {
    try {
      // Verify refresh token
      const validation = await this.verifyToken(refreshToken, 'refresh')

      if (!validation.isValid || !validation.payload) {
        throw new Error(validation.error || 'Invalid refresh token')
      }

      const { payload } = validation

      // Generate new access token
      const now = Math.floor(Date.now() / 1000)
      const jti = this.generateJti(payload.userId)

      const accessPayload: TokenPayload = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        status: payload.status,
        type: 'access',
        iat: now,
      }

      const accessToken = jwt.sign(accessPayload, this.privateKey, {
        algorithm: this.algorithm,
        expiresIn: this.accessTokenExpiry,
        issuer: this.issuer,
        audience: this.audience,
        subject: payload.userId,
        jwtid: `${jti}-access-refresh`,
      } as jwt.SignOptions)

      const expiresAt = this.calculateExpirationDate(this.accessTokenExpiry)

      return {
        accessToken,
        expiresAt,
      }
    } catch (error) {
      throw new Error(
        `Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Blacklist a token (revoke it)
   */
  async revokeToken(token: string): Promise<void> {
    // Add token to in-memory blacklist
    this.blacklistedTokens.add(token)

    // Store in Redis with expiration if available
    if (this.cacheService) {
      try {
        const decoded = this.decodeTokenUnsafe(token)

        if (decoded?.exp) {
          const ttl = decoded.exp - Math.floor(Date.now() / 1000)

          if (ttl > 0) {
            const blacklistKey = `${this.TOKEN_BLACKLIST_PREFIX}${this.hashToken(token)}`

            await this.cacheService.set(blacklistKey, true, ttl)
          }
        }
      } catch (error) {
        logger.warn(
          'Failed to store token blacklist in Redis, using memory fallback',
          error as Error,
          {
            component: 'rs256-jwt-service',
            operation: 'blacklist-token',
          },
        )
      }
    }
  }

  /**
   * Get token information without verification (for debugging)
   */
  decodeTokenUnsafe(token: string): TokenPayload | null {
    try {
      return jwt.decode(token) as TokenPayload
    } catch {
      return null
    }
  }

  /**
   * Check if token is expired (without verification)
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as TokenPayload

      if (!decoded?.exp) return true

      return Date.now() >= decoded.exp * 1000
    } catch {
      return true
    }
  }

  /**
   * Calculate expiration date from expiry string
   */
  private calculateExpirationDate(expiry: string): Date {
    const now = new Date()
    const match = expiry.match(/^(\d+)([smhd])$/)

    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`)
    }

    const [, amount, unit] = match
    const value = parseInt(amount, 10)

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000)
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000)
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000)
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000)
      default:
        throw new Error(`Unsupported time unit: ${unit}`)
    }
  }

  /**
   * Clean up expired blacklisted tokens
   */
  cleanupExpiredTokens(): void {
    const expiredTokens: string[] = []

    for (const token of this.blacklistedTokens) {
      if (this.isTokenExpired(token)) {
        expiredTokens.push(token)
      }
    }

    expiredTokens.forEach((token) => this.blacklistedTokens.delete(token))
  }

  /**
   * Check if a token is blacklisted
   */
  private async isTokenBlacklisted(token: string): Promise<boolean> {
    if (this.cacheService) {
      try {
        const blacklistKey = `${this.TOKEN_BLACKLIST_PREFIX}${this.hashToken(token)}`

        if (typeof this.cacheService.exists === 'function') {
          const isBlacklisted = await this.cacheService.exists(blacklistKey)

          if (isBlacklisted) {
            return true
          }
        } else {
          const value = await this.cacheService.get(blacklistKey)

          if (value !== null) {
            return true
          }
        }
      } catch (error) {
        logger.warn(
          'Redis blacklist check failed, falling back to memory',
          error as Error,
          {
            component: 'rs256-jwt-service',
            operation: 'check-blacklist',
          },
        )
      }
    }

    return this.blacklistedTokens.has(token)
  }

  /**
   * Generate a unique JWT ID
   */
  private generateJti(userId: string): string {
    return `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Create a hash of the token for Redis storage
   */
  private hashToken(token: string): string {
    const decoded = this.decodeTokenUnsafe(token)

    if (decoded?.jti) {
      return decoded.jti
    }

    const crypto = require('crypto')

    return crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Store refresh token metadata in Redis
   */
  private async storeRefreshTokenMetadata(
    userId: string,
    jti: string,
    expiresAt: Date,
  ): Promise<void> {
    if (!this.cacheService) return

    try {
      const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${userId}:${jti}`
      const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000)

      if (ttl > 0) {
        await this.cacheService.set(
          refreshKey,
          {
            userId,
            jti,
            issuedAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
          },
          ttl,
        )
      }
    } catch (error) {
      logger.warn('Failed to store refresh token metadata', error as Error, {
        component: 'rs256-jwt-service',
        operation: 'store-refresh-metadata',
      })
    }
  }
}

/**
 * Create RS256 token service instance with environment configuration
 */
export function createRS256JwtTokenService(
  cacheService?: ICacheService,
): RS256JwtTokenService {
  if (!JWT_PRIVATE_KEY || !JWT_PUBLIC_KEY) {
    throw new Error(
      'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY environment variables are required for RS256',
    )
  }

  return new RS256JwtTokenService(
    JWT_PRIVATE_KEY,
    JWT_PUBLIC_KEY,
    JWT_ALGORITHM as Algorithm,
    JWT_ACCESS_TOKEN_EXPIRY,
    JWT_REFRESH_TOKEN_EXPIRY,
    JWT_ISSUER,
    JWT_AUDIENCE,
    cacheService,
  )
}
