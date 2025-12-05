import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, type ICacheService } from '@pika/redis'
import { ApplicationError, ErrorFactory, logger } from '@pika/shared'
import {
  type BusinessSettings,
  type PartialBusinessSettings,
  validateBusinessSettingsUpdate,
} from '@pika/types'

import { CACHE_KEYS } from '../constants/cache-keys.js'
import type { IBusinessRepository } from '../repositories/BusinessRepository.js'
import type { IBusinessSettingsRepository } from '../repositories/BusinessSettingsRepository.js'

export interface IBusinessSettingsService {
  getSettings(businessId: string, userId: string): Promise<BusinessSettings>
  updateSettings(
    businessId: string,
    userId: string,
    settings: PartialBusinessSettings,
  ): Promise<BusinessSettings>
  resetSettings(
    businessId: string,
    userId: string,
    sections?: string[],
  ): Promise<BusinessSettings>
  validateSettings(settings: PartialBusinessSettings): Promise<{
    valid: boolean
    errors?: string[]
  }>
}

/**
 * Business Settings Service
 * Handles business settings management with proper authorization and caching
 */
export class BusinessSettingsService implements IBusinessSettingsService {
  constructor(
    private readonly businessSettingsRepository: IBusinessSettingsRepository,
    private readonly businessRepository: IBusinessRepository,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Verify that the user owns the business
   */
  private async verifyBusinessOwnership(
    businessId: string,
    userId: string,
  ): Promise<void> {
    const business = await this.businessRepository.findById(businessId)

    if (!business) {
      throw ErrorFactory.resourceNotFound('Business', businessId)
    }

    if (business.userId !== userId) {
      throw ErrorFactory.forbidden(
        'You do not have permission to manage this business settings',
      )
    }
  }

  /**
   * Get business settings
   * Cached per business to improve performance
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: CACHE_KEYS.BUSINESS.SETTINGS,
    keyGenerator: (prefix: string, methodName: string, args: any[]) => {
      const [businessId] = args

      return `${prefix}:${businessId}`
    },
    condition: (result) => result !== null,
  })
  async getSettings(
    businessId: string,
    userId: string,
  ): Promise<BusinessSettings> {
    try {
      logger.debug('Fetching business settings', { businessId, userId })

      // Verify ownership
      await this.verifyBusinessOwnership(businessId, userId)

      // Get settings from repository
      const settings =
        await this.businessSettingsRepository.getSettings(businessId)

      logger.debug('Business settings retrieved', { businessId })

      return settings
    } catch (error) {
      logger.error('Error getting business settings', {
        businessId,
        userId,
        error,
      })

      if (error instanceof ApplicationError) {
        throw error
      }

      throw ErrorFactory.fromError(error, 'Failed to get business settings', {
        source: 'BusinessSettingsService.getSettings',
      })
    }
  }

  /**
   * Update business settings
   */
  async updateSettings(
    businessId: string,
    userId: string,
    updates: PartialBusinessSettings,
  ): Promise<BusinessSettings> {
    try {
      logger.info('Updating business settings', { businessId, userId })

      // Verify ownership
      await this.verifyBusinessOwnership(businessId, userId)

      // Validate settings
      const validation = validateBusinessSettingsUpdate(updates)

      if (!validation.valid) {
        throw ErrorFactory.validationError(
          { settings: validation.errors || ['Invalid settings'] },
          { metadata: { businessId } },
        )
      }

      // Update settings
      const updatedSettings =
        await this.businessSettingsRepository.updateSettings(
          businessId,
          updates,
        )

      // Invalidate cache
      if (this.cacheService) {
        const cacheKey = `${CACHE_KEYS.BUSINESS.SETTINGS}:${businessId}`

        await this.cacheService.del(cacheKey)
      }

      logger.info('Business settings updated successfully', { businessId })

      return updatedSettings
    } catch (error) {
      logger.error('Error updating business settings', {
        businessId,
        userId,
        error,
      })

      if (error instanceof ApplicationError) {
        throw error
      }

      throw ErrorFactory.fromError(
        error,
        'Failed to update business settings',
        {
          source: 'BusinessSettingsService.updateSettings',
        },
      )
    }
  }

  /**
   * Reset business settings to defaults
   */
  async resetSettings(
    businessId: string,
    userId: string,
    sections?: string[],
  ): Promise<BusinessSettings> {
    try {
      logger.info('Resetting business settings', {
        businessId,
        userId,
        sections: sections || 'all',
      })

      // Verify ownership
      await this.verifyBusinessOwnership(businessId, userId)

      // Validate sections if provided
      if (sections && sections.length > 0) {
        const validSections = [
          'store',
          'payment',
          'voucher',
          'communication',
          'analytics',
          'branding',
          'notifications',
        ]

        const invalidSections = sections.filter(
          (section) => !validSections.includes(section),
        )

        if (invalidSections.length > 0) {
          throw ErrorFactory.validationError(
            { sections: [`Invalid sections: ${invalidSections.join(', ')}`] },
            { metadata: { businessId, invalidSections } },
          )
        }
      }

      // Reset settings
      const resetSettings = await this.businessSettingsRepository.resetSettings(
        businessId,
        sections,
      )

      // Invalidate cache
      if (this.cacheService) {
        const cacheKey = `${CACHE_KEYS.BUSINESS.SETTINGS}:${businessId}`

        await this.cacheService.del(cacheKey)
      }

      logger.info('Business settings reset successfully', {
        businessId,
        sections: sections || 'all',
      })

      return resetSettings
    } catch (error) {
      logger.error('Error resetting business settings', {
        businessId,
        userId,
        sections,
        error,
      })

      if (error instanceof ApplicationError) {
        throw error
      }

      throw ErrorFactory.fromError(error, 'Failed to reset business settings', {
        source: 'BusinessSettingsService.resetSettings',
      })
    }
  }

  /**
   * Validate business settings without saving
   */
  async validateSettings(
    settings: PartialBusinessSettings,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      logger.debug('Validating business settings')

      const validation = validateBusinessSettingsUpdate(settings)

      if (!validation.valid) {
        logger.warn('Business settings validation failed', {
          errors: validation.errors,
        })
      }

      return validation
    } catch (error) {
      logger.error('Error validating business settings', { error })

      return {
        valid: false,
        errors: ['Failed to validate settings'],
      }
    }
  }

  /**
   * Get settings for admin (no ownership check)
   * Used by admin endpoints
   */
  async getSettingsAsAdmin(businessId: string): Promise<BusinessSettings> {
    try {
      logger.debug('Admin fetching business settings', { businessId })

      const settings =
        await this.businessSettingsRepository.getSettings(businessId)

      logger.debug('Business settings retrieved by admin', { businessId })

      return settings
    } catch (error) {
      logger.error('Error getting business settings as admin', {
        businessId,
        error,
      })

      if (error instanceof ApplicationError) {
        throw error
      }

      throw ErrorFactory.fromError(error, 'Failed to get business settings', {
        source: 'BusinessSettingsService.getSettingsAsAdmin',
      })
    }
  }

  /**
   * Update settings for admin (no ownership check)
   * Used by admin endpoints
   */
  async updateSettingsAsAdmin(
    businessId: string,
    updates: PartialBusinessSettings,
  ): Promise<BusinessSettings> {
    try {
      logger.info('Admin updating business settings', { businessId })

      // Validate settings
      const validation = validateBusinessSettingsUpdate(updates)

      if (!validation.valid) {
        throw ErrorFactory.validationError(
          { settings: validation.errors || ['Invalid settings'] },
          { metadata: { businessId } },
        )
      }

      // Update settings
      const updatedSettings =
        await this.businessSettingsRepository.updateSettings(
          businessId,
          updates,
        )

      // Invalidate cache
      if (this.cacheService) {
        const cacheKey = `${CACHE_KEYS.BUSINESS.SETTINGS}:${businessId}`

        await this.cacheService.del(cacheKey)
      }

      logger.info('Business settings updated by admin', { businessId })

      return updatedSettings
    } catch (error) {
      logger.error('Error updating business settings as admin', {
        businessId,
        error,
      })

      if (error instanceof ApplicationError) {
        throw error
      }

      throw ErrorFactory.fromError(
        error,
        'Failed to update business settings',
        {
          source: 'BusinessSettingsService.updateSettingsAsAdmin',
        },
      )
    }
  }
}
