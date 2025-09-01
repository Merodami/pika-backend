/**
 * VoucherDeepLinkValidationService
 *
 * Dedicated service for URL-based QR code validation and deep link generation.
 * This service is completely separated from the main VoucherService to isolate
 * the new validation/deep-linking architecture.
 */

import { ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import {
  DeepLinkPlatform,
  VoucherScanSource,
  VoucherState,
  VoucherValidationCodeType,
  type VoucherValidationCodeTypeType,
} from '@pika/types'
import { nanoid } from 'nanoid'

import { generateCacheKey } from '../constants/cache-keys.js'
import type { IVoucherRepository } from '../repositories/VoucherRepository.js'
import type { IVoucherValidationRepository } from '../repositories/VoucherValidationRepository.js'
import type {
  CreateValidationCodeData,
  IVoucherValidationService,
  ValidationAttemptData,
  ValidationCodeOptions,
  ValidationCodeRecord,
  ValidationRequest,
  ValidationResult,
} from '../types/validation.js'

export interface IVoucherDeepLinkValidationService {
  // Validation code generation
  generateValidationCode(options: ValidationCodeOptions): Promise<string>

  // Code validation
  validateCode(request: ValidationRequest): Promise<ValidationResult>
  markCodeUsed(code: string, userId: string): Promise<void>

  // Code management
  getValidationCodeInfo(code: string): Promise<ValidationCodeRecord | null>
  cleanupExpiredCodes(): Promise<number>

  // Analytics
  getActiveCodesCount(voucherId: string): Promise<number>
}

/**
 * Service for handling URL-based QR code validation
 * Replaces JWT-based validation with server-side validation codes
 */
export class VoucherDeepLinkValidationService
  implements IVoucherDeepLinkValidationService, IVoucherValidationService
{
  // Default TTLs for different code types (in seconds)
  private readonly DEFAULT_TTL = {
    [VoucherValidationCodeType.SCAN]: 300, // 5 minutes for QR scans
    [VoucherValidationCodeType.PRINT]: 31536000, // 1 year for printed materials
    [VoucherValidationCodeType.DIGITAL]: 86400, // 24 hours for digital sharing
  }

  // Rate limiting constants
  private readonly MAX_ATTEMPTS_PER_MINUTE = 10
  private readonly RATE_LIMIT_TTL = 60 // 1 minute

  constructor(
    private readonly validationRepository: IVoucherValidationRepository,
    private readonly voucherRepository: IVoucherRepository,
    private readonly cache: ICacheService,
  ) {}

  /**
   * Generate a validation code for a voucher
   */
  async generateValidationCode(
    options: ValidationCodeOptions,
  ): Promise<string> {
    try {
      const {
        voucherId,
        type = VoucherValidationCodeType.SCAN as VoucherValidationCodeTypeType,
        ttl,
        metadata,
      } = options

      // Generate code in XXXX-XXXX format
      const code = this.generateCode()

      // Calculate expiry based on type or custom TTL
      const ttlSeconds =
        ttl || this.DEFAULT_TTL[type as keyof typeof this.DEFAULT_TTL]
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

      // Store in database using validation repository
      const validationData: CreateValidationCodeData = {
        voucherId,
        code,
        type,
        expiresAt,
        metadata,
      }

      await this.validationRepository.createValidationCode(validationData)

      // Cache for quick lookups
      const cacheKey = generateCacheKey.validationCode(code)
      const cacheData = JSON.stringify({
        voucherId,
        expiresAt,
        type,
        metadata,
      })

      await this.cache.set(cacheKey, cacheData, ttlSeconds)

      logger.info('Generated validation code', {
        voucherId,
        code,
        type,
        expiresAt,
      })

      return code
    } catch (error) {
      logger.error('Failed to generate validation code', {
        error,
        options,
      })
      throw ErrorFactory.fromError(error, 'Failed to generate validation code')
    }
  }

  /**
   * Validate a code and check if redemption is allowed
   */
  async validateCode(request: ValidationRequest): Promise<ValidationResult> {
    try {
      const { voucherId, code, userId, location, deviceInfo, source } = request

      // Check rate limiting first
      await this.checkRateLimit(request)

      // Check cache first for performance
      const cacheKey = generateCacheKey.validationCode(code)
      const cached = await this.cache.get(cacheKey)

      let validationCode: ValidationCodeRecord | null = null

      if (cached) {
        const parsed = JSON.parse(cached as string)

        if (parsed.voucherId !== voucherId) {
          return {
            valid: false,
            canRedeem: false,
            message: 'Invalid code for this voucher',
          }
        }
        // Get full validation code from DB for usage tracking
        validationCode =
          await this.validationRepository.findValidationCode(code)
      } else {
        // Not in cache, check database
        validationCode =
          await this.validationRepository.findValidationCode(code)
      }

      if (!validationCode) {
        return {
          valid: false,
          canRedeem: false,
          message: 'Invalid or expired validation code',
        }
      }

      // Check if code matches the voucher
      if (validationCode.voucherId !== voucherId) {
        return {
          valid: false,
          canRedeem: false,
          message: 'Code does not match voucher',
        }
      }

      // Check expiry
      if (new Date() > validationCode.expiresAt) {
        return {
          valid: false,
          canRedeem: false,
          message: 'Validation code has expired',
        }
      }

      // Check if already used
      if (validationCode.usedAt) {
        return {
          valid: false,
          canRedeem: false,
          message: 'Validation code already used',
        }
      }

      // Get voucher details for additional validation
      const voucher = await this.voucherRepository.findById(voucherId)

      if (!voucher) {
        return {
          valid: false,
          canRedeem: false,
          message: 'Voucher not found',
        }
      }

      // Check voucher state
      if (voucher.state === VoucherState.EXPIRED) {
        return {
          valid: false,
          canRedeem: false,
          message: 'Voucher has expired',
        }
      }

      if (voucher.state === VoucherState.REDEEMED) {
        return {
          valid: false,
          canRedeem: false,
          message: 'Voucher already redeemed',
        }
      }

      // Track validation attempt (for analytics)
      await this.trackValidationAttempt({
        voucherId,
        userId,
        location,
        deviceInfo,
        source,
        timestamp: new Date(),
      })

      // Calculate remaining uses
      const remainingUses = voucher.maxRedemptions
        ? voucher.maxRedemptions - voucher.currentRedemptions
        : undefined

      return {
        valid: true,
        voucher,
        canRedeem: true,
        expiresAt: validationCode.expiresAt,
        remainingUses,
      }
    } catch (error) {
      logger.error('Failed to validate code', {
        error,
        request,
      })
      throw ErrorFactory.fromError(error, 'Failed to validate code')
    }
  }

  /**
   * Mark a validation code as used
   */
  async markCodeUsed(code: string, userId: string): Promise<void> {
    try {
      await this.validationRepository.markValidationCodeUsed(code, userId)

      // Remove from cache
      const cacheKey = generateCacheKey.validationCode(code)

      await this.cache.del(cacheKey)

      // Track used code for preventing reuse
      const usedKey = generateCacheKey.validationUsed(code)

      await this.cache.set(usedKey, userId, 86400) // Keep for 24 hours

      logger.info('Marked validation code as used', {
        code,
        userId,
      })
    } catch (error) {
      logger.error('Failed to mark code as used', {
        error,
        code,
        userId,
      })
      throw ErrorFactory.fromError(error, 'Failed to mark code as used')
    }
  }

  /**
   * Clean up expired validation codes
   */
  async cleanupExpiredCodes(): Promise<number> {
    try {
      const count =
        await this.validationRepository.deleteExpiredValidationCodes()

      logger.info('Cleaned up expired validation codes', {
        count,
      })

      return count
    } catch (error) {
      logger.error('Failed to cleanup expired codes', {
        error,
      })
      throw ErrorFactory.fromError(error, 'Failed to cleanup expired codes')
    }
  }

  /**
   * Get validation code information
   */
  async getValidationCodeInfo(
    code: string,
  ): Promise<ValidationCodeRecord | null> {
    try {
      return await this.validationRepository.findValidationCode(code)
    } catch (error) {
      logger.error('Failed to get validation code info', {
        error,
        code,
      })
      throw ErrorFactory.fromError(error, 'Failed to get validation code info')
    }
  }

  /**
   * Get count of active validation codes for a voucher
   */
  async getActiveCodesCount(voucherId: string): Promise<number> {
    try {
      return await this.validationRepository.getActiveValidationCodesCount(
        voucherId,
      )
    } catch (error) {
      logger.error('Failed to get active codes count', {
        error,
        voucherId,
      })
      throw ErrorFactory.fromError(error, 'Failed to get active codes count')
    }
  }

  /**
   * Generate a code in XXXX-XXXX format
   */
  private generateCode(): string {
    // Generate 8 character alphanumeric code
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Remove confusing characters
    const id = nanoid(8)

    let code = ''

    for (let i = 0; i < 8; i++) {
      const charCode = id.charCodeAt(i)
      const index = charCode % alphabet.length

      code += alphabet.charAt(index)
    }

    // Format as XXXX-XXXX
    return `${code.slice(0, 4)}-${code.slice(4, 8)}`
  }

  /**
   * Check rate limiting for validation attempts
   */
  private async checkRateLimit(request: ValidationRequest): Promise<void> {
    const identifier =
      request.deviceInfo?.deviceId ||
      request.userId ||
      request.deviceInfo?.platform ||
      DeepLinkPlatform.UNKNOWN

    const rateLimitKey = generateCacheKey.validationAttempts(identifier)

    const attempts = await this.cache.increment(
      rateLimitKey,
      this.RATE_LIMIT_TTL,
    )

    if (attempts && attempts > this.MAX_ATTEMPTS_PER_MINUTE) {
      throw ErrorFactory.validationError({
        rate_limit: ['Too many validation attempts. Please try again later.'],
      })
    }
  }

  /**
   * Track validation attempt for analytics
   */
  private async trackValidationAttempt(
    data: ValidationAttemptData,
  ): Promise<void> {
    try {
      // Log for analytics (could be sent to analytics service)
      logger.info('Validation attempt tracked', {
        voucherId: data.voucherId,
        userId: data.userId,
        location: data.location,
        device: data.deviceInfo,
        source: data.source || VoucherScanSource.QR,
        timestamp: data.timestamp,
      })

      // Could also store in database for analytics
      // await this.validationRepository.trackValidationAttempt(data)
    } catch (error) {
      // Don't fail validation if tracking fails
      logger.warn('Failed to track validation attempt', { error })
    }
  }
}

export type { IVoucherValidationService }
