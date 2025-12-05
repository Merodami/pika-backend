import { ApplicationError, ErrorFactory, logger } from '@pika/shared'
import {
  type BusinessSettings,
  createDefaultBusinessSettings,
  mergeBusinessSettings,
  type PartialBusinessSettings,
} from '@pika/types'
import { Prisma, type PrismaClient } from '@prisma/client'
import { get, merge, set } from 'lodash-es'

export interface IBusinessSettingsRepository {
  getSettings(businessId: string): Promise<BusinessSettings>
  updateSettings(
    businessId: string,
    settings: PartialBusinessSettings,
  ): Promise<BusinessSettings>
  resetSettings(
    businessId: string,
    sections?: string[],
  ): Promise<BusinessSettings>
}

/**
 * Repository for managing business settings stored in the JSON field
 * Follows the established repository patterns in the business service
 */
export class BusinessSettingsRepository implements IBusinessSettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Get business settings or create defaults if none exist
   */
  async getSettings(businessId: string): Promise<BusinessSettings> {
    try {
      // Get from database
      const business = await this.prisma.business.findUnique({
        where: { id: businessId },
        select: {
          id: true,
          settings: true,
        },
      })

      if (!business) {
        throw ErrorFactory.resourceNotFound('Business', businessId)
      }

      // Use existing settings or create defaults
      let settings: BusinessSettings

      if (business.settings && typeof business.settings === 'object') {
        // Ensure the settings have the correct structure using deep merge
        const defaults = createDefaultBusinessSettings()
        const partial = business.settings as unknown as PartialBusinessSettings

        settings = merge({}, defaults, partial) as BusinessSettings
        // Ensure updatedAt is a Date object
        settings.updatedAt = new Date()
      } else {
        settings = createDefaultBusinessSettings()
      }

      return settings
    } catch (error) {
      logger.error('Error getting business settings', { businessId, error })

      if (error instanceof ApplicationError) {
        throw error
      }

      throw ErrorFactory.databaseError(
        'getSettings',
        'Failed to get business settings',
        error,
      )
    }
  }

  /**
   * Update business settings (partial update)
   */
  async updateSettings(
    businessId: string,
    updates: PartialBusinessSettings,
  ): Promise<BusinessSettings> {
    try {
      // Get current settings
      const currentSettings = await this.getSettings(businessId)

      // Merge updates with current settings
      const mergedSettings = mergeBusinessSettings(currentSettings, updates)

      // Update in database
      const updated = await this.prisma.business.update({
        where: { id: businessId },
        data: {
          settings: mergedSettings as any,
        },
        select: {
          settings: true,
        },
      })

      const updatedSettings = updated.settings as unknown as BusinessSettings

      logger.info('Business settings updated', { businessId })

      return updatedSettings
    } catch (error) {
      logger.error('Error updating business settings', {
        businessId,
        error,
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Business', businessId)
        }
      }

      throw ErrorFactory.databaseError(
        'updateSettings',
        'Failed to update business settings',
        error,
      )
    }
  }

  /**
   * Reset business settings to defaults
   * Can reset all settings or specific sections
   */
  async resetSettings(
    businessId: string,
    sections?: string[],
  ): Promise<BusinessSettings> {
    try {
      const defaultSettings = createDefaultBusinessSettings()

      // If no sections specified, reset everything
      if (!sections || sections.length === 0) {
        const updated = await this.prisma.business.update({
          where: { id: businessId },
          data: {
            settings: defaultSettings as any,
          },
          select: {
            settings: true,
          },
        })

        logger.info('Business settings reset to defaults', { businessId })

        return updated.settings as unknown as BusinessSettings
      }

      // Reset only specified sections
      const currentSettings = await this.getSettings(businessId)
      const partialReset: PartialBusinessSettings = {}

      // Build partial reset object with only specified sections
      for (const section of sections) {
        const sectionKey = section as keyof BusinessSettings

        // Skip non-resettable fields
        if (sectionKey === 'version' || sectionKey === 'updatedAt') {
          continue
        }

        // Use lodash get to safely access property
        const sectionDefaults = get(defaultSettings, sectionKey)

        if (sectionDefaults !== undefined) {
          set(partialReset, sectionKey, sectionDefaults)
        }
      }

      // Merge the reset sections with current settings
      const resetSettings = mergeBusinessSettings(currentSettings, partialReset)

      const updated = await this.prisma.business.update({
        where: { id: businessId },
        data: {
          settings: resetSettings as any,
        },
        select: {
          settings: true,
        },
      })

      logger.info('Business settings sections reset', {
        businessId,
        sections,
      })

      return updated.settings as unknown as BusinessSettings
    } catch (error) {
      logger.error('Error resetting business settings', {
        businessId,
        sections,
        error,
      })

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Business', businessId)
        }
      }

      throw ErrorFactory.databaseError(
        'resetSettings',
        'Failed to reset business settings',
        error,
      )
    }
  }
}
