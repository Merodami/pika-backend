import { ICacheService } from '@pika/redis'
import { ErrorFactory, logger } from '@pika/shared'
import { PrismaClient } from '@prisma/client'
import { customAlphabet } from 'nanoid'

export interface ShortCodeInfo {
  voucherId: string
  type: 'dynamic' | 'static' // dynamic for app users, static for print
  customerId?: string // Only for dynamic codes
  expiresAt?: Date
}

/**
 * Service for managing human-readable short codes
 * Supports both dynamic (user-specific) and static (print campaign) codes
 */
export class ShortCodeService {
  private readonly SHORT_CODE_PREFIX = 'shortcode:'
  private readonly SHORT_CODE_TTL = 300 // 5 minutes for dynamic codes

  constructor(
    private readonly cacheService: ICacheService,
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * Generate a unique short code for a voucher
   */
  async generateShortCode(
    voucherId: string,
    customerId?: string,
    type: 'dynamic' | 'static' = 'dynamic',
  ): Promise<string> {
    try {
      // Generate an 8-character alphanumeric code
      const code = this.generateCode()

      // Store in Redis for quick lookup
      const cacheKey = `${this.SHORT_CODE_PREFIX}${code}`
      const codeInfo: ShortCodeInfo = {
        voucherId,
        type,
        customerId,
        expiresAt:
          type === 'dynamic'
            ? new Date(Date.now() + this.SHORT_CODE_TTL * 1000)
            : undefined,
      }

      if (type === 'dynamic') {
        // Dynamic codes expire after TTL
        await this.cacheService.set(
          cacheKey,
          JSON.stringify(codeInfo),
          this.SHORT_CODE_TTL,
        )
      } else {
        // Static codes are permanent (for print campaigns)
        await this.cacheService.set(cacheKey, JSON.stringify(codeInfo))

        // Also store in database for persistence
        await this.prisma.voucherCode.create({
          data: {
            code,
            voucherId,
            type: 'STATIC',
            createdAt: new Date(),
          },
        })
      }

      logger.info('Generated short code', { code, voucherId, type })

      return code
    } catch (error) {
      logger.error('Error generating short code', { error, voucherId })
      throw ErrorFactory.fromError(error, 'Failed to generate short code', {
        source: 'ShortCodeService.generateShortCode',
        metadata: { voucherId },
      })
    }
  }

  /**
   * Look up voucher information by short code
   */
  async lookupShortCode(code: string): Promise<ShortCodeInfo | null> {
    try {
      // Check Redis first
      const cacheKey = `${this.SHORT_CODE_PREFIX}${code}`
      const cached = await this.cacheService.get(cacheKey)

      if (cached && typeof cached === 'string') {
        const codeInfo = JSON.parse(cached) as ShortCodeInfo

        // Convert date string back to Date object if present
        if (codeInfo.expiresAt) {
          codeInfo.expiresAt = new Date(codeInfo.expiresAt)
        }

        // Check if dynamic code has expired
        if (codeInfo.type === 'dynamic' && codeInfo.expiresAt) {
          if (codeInfo.expiresAt < new Date()) {
            await this.cacheService.del(cacheKey)

            return null
          }
        }

        return codeInfo
      }

      // If not in cache, check database for static codes
      const dbCode = await this.prisma.voucherCode.findUnique({
        where: { code },
        include: { voucher: true },
      })

      if (dbCode && dbCode.type === 'STATIC') {
        const codeInfo: ShortCodeInfo = {
          voucherId: dbCode.voucherId,
          type: 'static',
        }

        // Cache it for faster future lookups
        await this.cacheService.set(
          cacheKey,
          JSON.stringify(codeInfo),
          3600, // Cache for 1 hour
        )

        return codeInfo
      }

      return null
    } catch (error) {
      logger.error('Error looking up short code', { error, code })
      throw ErrorFactory.fromError(error, 'Failed to lookup short code', {
        source: 'ShortCodeService.lookupShortCode',
      })
    }
  }

  /**
   * Invalidate a short code (after successful redemption)
   */
  async invalidateShortCode(code: string): Promise<void> {
    try {
      const cacheKey = `${this.SHORT_CODE_PREFIX}${code}`

      await this.cacheService.del(cacheKey)
      logger.debug('Invalidated short code', { code })
    } catch (error) {
      logger.error('Error invalidating short code', { error, code })
      // Non-critical error, don't throw
    }
  }

  /**
   * Generate a static code for print campaigns
   */
  async generateStaticCode(
    voucherId: string,
    customCode?: string,
  ): Promise<string> {
    try {
      const code = customCode || this.generateCode()

      // Check if code already exists
      const existing = await this.prisma.voucherCode.findUnique({
        where: { code },
      })

      if (existing) {
        throw ErrorFactory.resourceConflict(
          'short_code',
          'Short code already exists',
          {
            source: 'ShortCodeService.generateStaticCode',
            metadata: { code },
          },
        )
      }

      // Store in database
      await this.prisma.voucherCode.create({
        data: {
          code,
          voucherId,
          type: 'STATIC',
          createdAt: new Date(),
        },
      })

      // Also cache it
      const cacheKey = `${this.SHORT_CODE_PREFIX}${code}`
      const codeInfo: ShortCodeInfo = {
        voucherId,
        type: 'static',
      }

      await this.cacheService.set(cacheKey, JSON.stringify(codeInfo))

      logger.info('Generated static code', { code, voucherId })

      return code
    } catch (error) {
      // If it's already our error type, re-throw it
      if (error instanceof Error && error.name.includes('ApplicationError')) {
        throw error
      }

      logger.error('Error generating static code', { error, voucherId })
      throw ErrorFactory.fromError(error, 'Failed to generate static code', {
        source: 'ShortCodeService.generateStaticCode',
        metadata: { voucherId },
      })
    }
  }

  /**
   * Generate a random alphanumeric code
   */
  private generateCode(length: number = 8): string {
    // Use custom alphabet without confusing characters (0, O, I, l)
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    const customNanoid = customAlphabet(alphabet, length)

    return customNanoid()
  }
}
