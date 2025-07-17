import { ErrorFactory, logger } from '@pika/shared'
import * as jwt from 'jsonwebtoken'

export interface RedemptionClaims {
  voucherId: string
  customerId: string
  iat?: number
  exp?: number
}

export interface OfflineValidationResult {
  valid: boolean
  claims?: RedemptionClaims
  error?: string
}

/**
 * JWT Service for generating and validating redemption tokens
 * Uses ECDSA (ES256) for signing
 */
export class JWTService {
  constructor(
    private readonly privateKey: string,
    private readonly publicKey: string,
  ) {}

  /**
   * Generate a redemption JWT token
   */
  async generateRedemptionToken(
    voucherId: string,
    customerId: string,
    ttl: number = 300, // 5 minutes default
  ): Promise<string> {
    try {
      const claims: RedemptionClaims = {
        voucherId,
        customerId,
      }

      const token = jwt.sign(claims, this.privateKey, {
        algorithm: 'ES256',
        expiresIn: ttl,
      })

      logger.debug('Generated redemption token', { voucherId, customerId, ttl })

      return token
    } catch (error) {
      logger.error('Error generating redemption token', {
        error,
        voucherId,
        customerId,
      })
      throw ErrorFactory.fromError(
        error,
        'Failed to generate redemption token',
        {
          source: 'JWTService.generateRedemptionToken',
          metadata: { voucherId, customerId },
        },
      )
    }
  }

  /**
   * Verify a redemption JWT token
   */
  async verifyRedemptionToken(token: string): Promise<RedemptionClaims> {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['ES256'],
      }) as RedemptionClaims

      logger.debug('Verified redemption token', { claims: decoded })

      return decoded
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Token expired', { error })
        throw ErrorFactory.validationError(
          { token: ['Token has expired'] },
          {
            source: 'JWTService.verifyRedemptionToken',
          },
        )
      }

      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid token', { error })
        throw ErrorFactory.validationError(
          { token: ['Invalid token'] },
          {
            source: 'JWTService.verifyRedemptionToken',
          },
        )
      }

      logger.error('Error verifying redemption token', { error })
      throw ErrorFactory.fromError(error, 'Failed to verify redemption token', {
        source: 'JWTService.verifyRedemptionToken',
      })
    }
  }

  /**
   * Verify a token for offline validation (no expiry check)
   */
  async verifyOfflineToken(token: string): Promise<OfflineValidationResult> {
    try {
      // Verify without checking expiration for offline mode
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['ES256'],
        ignoreExpiration: true,
      }) as RedemptionClaims

      // Check if token is too old (e.g., more than 24 hours)
      const now = Math.floor(Date.now() / 1000)
      const maxAge = 24 * 60 * 60 // 24 hours

      if (decoded.iat && now - decoded.iat > maxAge) {
        return {
          valid: false,
          error: 'Token is too old for offline validation',
        }
      }

      return {
        valid: true,
        claims: decoded,
      }
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Invalid token signature',
        }
      }

      logger.error('Error in offline token verification', { error })

      return {
        valid: false,
        error: 'Token verification failed',
      }
    }
  }

  /**
   * Extract claims without verification (for debugging/logging)
   */
  decodeToken(token: string): RedemptionClaims | null {
    try {
      const decoded = jwt.decode(token) as RedemptionClaims

      return decoded
    } catch {
      return null
    }
  }
}
