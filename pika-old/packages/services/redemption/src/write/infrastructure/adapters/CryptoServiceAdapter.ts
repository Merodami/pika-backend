import { VoucherQRService } from '@pika/crypto'
import { logger } from '@pika/shared'

import { JWTService } from '../services/JWTService.js'

/**
 * Adapter to integrate crypto package services with redemption service interfaces
 */
export class CryptoServiceAdapter {
  constructor(
    private readonly voucherQRService: VoucherQRService,
    private readonly jwtKeys: {
      privateKey: string
      publicKey: string
    },
  ) {}

  /**
   * Create JWT service compatible with redemption service
   */
  createJWTService(): JWTService {
    // Return the redemption service's own JWT implementation
    // which is already compatible with the handlers
    return new JWTService(this.jwtKeys.privateKey, this.jwtKeys.publicKey)
  }

  /**
   * Generate voucher JWT payload using crypto package
   */
  async generateVoucherPayload(
    voucherId: string,
    userId: string,
    options?: {
      ttl?: number
      nonce?: string
    },
  ): Promise<string> {
    const result = await this.voucherQRService.generateUserVoucherQR(
      voucherId,
      userId,
      this.jwtKeys.privateKey,
      options,
    )

    logger.debug('Generated voucher payload using crypto package', {
      voucherId,
      userId,
      expiresAt: result.expiresAt,
      metadata: result.metadata,
    })

    return result.qrPayload
  }

  /**
   * Validate voucher JWT payload using crypto package
   */
  async validateVoucherPayload(token: string): Promise<{
    valid: boolean
    claims?: any
    error?: string
  }> {
    try {
      const result = await this.voucherQRService.validateQR(
        token,
        this.jwtKeys.publicKey,
      )

      return {
        valid: result.isValid,
        claims: result.payload,
        error: result.error,
      }
    } catch (error) {
      logger.error('Error validating voucher payload', { error })

      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}
