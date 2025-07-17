import { logger } from '@pika/shared'

import type {
  OfflineValidationResult,
  ValidateOfflineDTO,
} from '../../../domain/dtos/RedemptionDTO.js'
import { JWTService } from '../../../infrastructure/services/JWTService.js'

/**
 * Command handler for offline voucher validation
 * This allows retailers to validate vouchers without network connectivity
 */
export class ValidateOfflineRedemptionCommandHandler {
  constructor(
    private readonly jwtService: JWTService,
    private readonly publicKey: string,
  ) {}

  /**
   * Validate a redemption token offline using only cryptographic verification
   */
  async execute(dto: ValidateOfflineDTO): Promise<OfflineValidationResult> {
    logger.debug('Validating offline redemption token')

    try {
      // Verify JWT signature and extract claims
      const claims = await this.jwtService.verifyRedemptionToken(dto.token)

      // Check if token has expired
      const now = Math.floor(Date.now() / 1000)

      if (claims.exp && claims.exp < now) {
        return {
          valid: false,
          error: 'Token has expired',
        }
      }

      // Token is valid
      return {
        valid: true,
        voucherId: claims.voucherId,
        customerId: claims.customerId,
        expiry: claims.exp ? new Date(claims.exp * 1000) : undefined,
      }
    } catch (error) {
      logger.warn('Offline token validation failed', { error })

      // Determine specific error
      let errorMessage = 'Invalid token'

      if (error.message?.includes('signature')) {
        errorMessage = 'Invalid token signature'
      } else if (error.message?.includes('expired')) {
        errorMessage = 'Token has expired'
      } else if (error.message?.includes('malformed')) {
        errorMessage = 'Malformed token'
      }

      return {
        valid: false,
        error: errorMessage,
      }
    }
  }
}
