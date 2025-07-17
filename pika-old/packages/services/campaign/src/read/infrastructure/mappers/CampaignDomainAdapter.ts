import { Campaign } from '@campaign-read/domain/entities/Campaign.js'
import { CampaignMapper } from '@pika/sdk'

/**
 * Adapter to bridge between local Campaign domain entity and SDK's CampaignDomain
 *
 * Following the same pattern as ProviderDomainAdapter:
 * Our domain entity uses MultilingualContent where fields might be optional
 * This adapter ensures compatibility while maintaining our domain model integrity.
 */
export class CampaignDomainAdapter {
  /**
   * Convert our local Campaign entity to SDK's CampaignDomain format
   * Ensures all multilingual fields have values (empty strings for missing translations)
   */
  static toSdkDomain(campaign: Campaign): any {
    const data = campaign.toObject()

    return {
      id: data.id,
      providerId: data.providerId,
      name: {
        en: data.name.en,
        es: data.name.es || '',
        gn: data.name.gn || '',
      },
      description: {
        en: data.description.en,
        es: data.description.es || '',
        gn: data.description.gn || '',
      },
      budget: data.budget,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      targetAudience: data.targetAudience
        ? {
            en: data.targetAudience.en,
            es: data.targetAudience.es || '',
            gn: data.targetAudience.gn || '',
          }
        : null,
      objectives: data.objectives
        ? {
            en: data.objectives.en,
            es: data.objectives.es || '',
            gn: data.objectives.gn || '',
          }
        : null,
      active: data.active,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    }
  }

  /**
   * Convert our Campaign entity to API DTO using SDK mapper
   * This method chains our adapter with SDK's mapper for proper DTO conversion
   */
  static toDTO(campaign: Campaign): any {
    const sdkDomain = this.toSdkDomain(campaign)

    return CampaignMapper.toDTO(sdkDomain)
  }
}
