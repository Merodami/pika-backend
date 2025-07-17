import { Campaign } from '@campaign-write/domain/entities/Campaign.js'
import { CampaignStatus, MultilingualContent } from '@pika/types-core'

/**
 * Maps between Prisma Campaign documents and Campaign domain entities
 * Following the established pattern from Admin Service
 */
export interface CampaignWriteDocument {
  id: string
  providerId: string
  name: any // JSON field from Prisma
  description: any // JSON field from Prisma
  budget: number
  startDate: Date
  endDate: Date
  status: string
  targetAudience: any // JSON field from Prisma
  objectives: any // JSON field from Prisma
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export class CampaignDocumentMapper {
  /**
   * Ensures a value is a valid MultilingualContent
   */
  private static ensureMultilingualContent(value: any): MultilingualContent {
    if (!value || typeof value !== 'object') {
      return { en: '', es: '', gn: '' }
    }

    // Handle JSON field that might be stringified
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value)
      } catch {
        return { en: '', es: '', gn: '' }
      }
    }

    return {
      en: String(value.en || ''),
      es: String(value.es || ''),
      gn: String(value.gn || ''),
    }
  }

  /**
   * Maps a database document to a Campaign domain entity
   */
  static mapDocumentToDomain(document: CampaignWriteDocument): Campaign {
    return Campaign.reconstitute({
      id: document.id,
      name: this.ensureMultilingualContent(document.name),
      description: this.ensureMultilingualContent(document.description),
      startDate:
        document.startDate instanceof Date
          ? document.startDate
          : new Date(document.startDate),
      endDate:
        document.endDate instanceof Date
          ? document.endDate
          : new Date(document.endDate),
      budget: Number(document.budget),
      status: document.status as CampaignStatus,
      providerId: document.providerId,
      active: Boolean(document.active),
      targetAudience: document.targetAudience
        ? this.ensureMultilingualContent(document.targetAudience)
        : null,
      objectives: document.objectives
        ? this.ensureMultilingualContent(document.objectives)
        : null,
      createdAt:
        document.createdAt instanceof Date
          ? document.createdAt
          : new Date(document.createdAt),
      updatedAt:
        document.updatedAt instanceof Date
          ? document.updatedAt
          : new Date(document.updatedAt),
    })
  }

  /**
   * Maps a Campaign domain entity to database document format for creation
   */
  static mapDomainToCreateData(
    campaign: Campaign,
  ): Omit<CampaignWriteDocument, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      providerId: campaign.providerId,
      name: campaign.name,
      description: campaign.description,
      budget: campaign.budget,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      targetAudience: campaign.targetAudience,
      objectives: campaign.objectives,
      active: campaign.active,
    }
  }

  /**
   * Maps a Campaign domain entity to database document format for updates
   */
  static mapDomainToUpdateData(
    campaign: Campaign,
  ): Partial<CampaignWriteDocument> {
    return {
      name: campaign.name,
      description: campaign.description,
      budget: campaign.budget,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      status: campaign.status,
      targetAudience: campaign.targetAudience,
      objectives: campaign.objectives,
      active: campaign.active,
    }
  }
}
