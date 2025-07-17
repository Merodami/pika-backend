import { LocalizationConfig, MultilingualContent } from '@pika/types-core'
import { get } from 'lodash-es'

import { campaignLocalizationConfig } from '../localization/CampaignLocalization.js'
import { Campaign } from '../openapi/models/Campaign.js'
import type { MultilingualText } from '../types/multilingual.js'
import { localizeObject } from './LocalizationUtils.js'

/**
 * Interface representing a database Campaign document
 * Uses snake_case for fields as they come from the database
 */
export interface CampaignDocument {
  id: string
  providerId: string
  name: MultilingualText
  description: MultilingualText
  budget: number
  startDate: Date
  endDate: Date
  status: Campaign['status']
  targetAudience: MultilingualText | null
  objectives: MultilingualText | null
  active: boolean
  createdAt: Date | null
  updatedAt: Date | null
}

/**
 * Interface representing a domain Campaign entity with camelCase property names
 * This is the central domain model used across the application
 */
export interface CampaignDomain {
  id: string
  providerId: string
  name: MultilingualText
  description: MultilingualText
  budget: number
  startDate: Date
  endDate: Date
  status: Campaign['status']
  targetAudience: MultilingualText | null
  objectives: MultilingualText | null
  active: boolean
  createdAt: Date | null
  updatedAt: Date | null
  // Optional localized fields that might be added by mappers
  localizedName?: string
  localizedDescription?: string
  localizedTargetAudience?: string
  localizedObjectives?: string
}

/**
 * Comprehensive Campaign mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 * - Localization for any of the above
 */
export class CampaignMapper {
  /**
   * Ensures a value is a valid MultilingualText
   * Adds required fields if missing
   */
  static ensureMultilingualText(value: any): MultilingualText {
    // If it's not an object, return empty multilingual text
    if (!value || typeof value !== 'object') {
      return {
        en: '',
        es: '',
        gn: '',
      }
    }

    // Return a multilingual object with the values that exist
    return {
      en: String(value.en || ''),
      es: String(value.es || ''),
      gn: String(value.gn || ''),
    }
  }

  /**
   * Maps a database document to a domain entity
   * Handles nested objects and transforms snake_case to camelCase
   */
  static fromDocument(doc: CampaignDocument): CampaignDomain {
    return {
      id: doc.id,
      providerId: doc.providerId,
      name: this.ensureMultilingualText(doc.name),
      description: this.ensureMultilingualText(doc.description),
      budget: doc.budget,
      startDate:
        doc.startDate instanceof Date ? doc.startDate : new Date(doc.startDate),
      endDate:
        doc.endDate instanceof Date ? doc.endDate : new Date(doc.endDate),
      status: doc.status,
      targetAudience: doc.targetAudience
        ? this.ensureMultilingualText(doc.targetAudience)
        : null,
      objectives: doc.objectives
        ? this.ensureMultilingualText(doc.objectives)
        : null,
      active: doc.active,
      createdAt: doc.createdAt
        ? doc.createdAt instanceof Date
          ? doc.createdAt
          : new Date(doc.createdAt)
        : null,
      updatedAt: doc.updatedAt
        ? doc.updatedAt instanceof Date
          ? doc.updatedAt
          : new Date(doc.updatedAt)
        : null,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase to snake_case and handles date formatting
   */
  static toDTO(domain: CampaignDomain): Campaign {
    // Format date to ISO string safely
    const formatDate = (date: Date | string | undefined | null): string => {
      if (!date) return new Date().toISOString()
      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()

      return new Date().toISOString()
    }

    return {
      id: domain.id,
      provider_id: domain.providerId,
      name: domain.name,
      description: domain.description,
      budget: domain.budget,
      start_date: formatDate(domain.startDate),
      end_date: formatDate(domain.endDate),
      status: domain.status,
      target_audience: domain.targetAudience || undefined,
      objectives: domain.objectives || undefined,
      active: domain.active,
      created_at: formatDate(domain.createdAt),
      updated_at: formatDate(domain.updatedAt),
    }
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and handles date parsing
   */
  static fromDTO(dto: Campaign): CampaignDomain {
    return {
      id: dto.id,
      providerId: dto.provider_id,
      name: this.ensureMultilingualText(dto.name),
      description: this.ensureMultilingualText(dto.description),
      budget: dto.budget,
      startDate: new Date(dto.start_date),
      endDate: new Date(dto.end_date),
      status: dto.status,
      targetAudience: dto.target_audience
        ? this.ensureMultilingualText(dto.target_audience)
        : null,
      objectives: dto.objectives
        ? this.ensureMultilingualText(dto.objectives)
        : null,
      active: dto.active,
      createdAt: dto.created_at ? new Date(dto.created_at) : null,
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : null,
    }
  }

  /**
   * Localizes a domain entity by extracting the specified language
   * from multilingual fields
   */
  static localize(
    entity: CampaignDomain,
    language: string = 'en',
  ): CampaignDomain {
    // First create a copy with localized fields preserved
    const result = { ...entity }

    // Process name field
    result.localizedName =
      get(entity.name, language) ||
      get(entity.name, 'en') ||
      get(entity.name, 'es') ||
      ''

    // Process description field
    result.localizedDescription =
      get(entity.description, language) ||
      get(entity.description, 'en') ||
      get(entity.description, 'es') ||
      ''

    // Process targetAudience field
    if (entity.targetAudience) {
      result.localizedTargetAudience =
        get(entity.targetAudience, language) ||
        get(entity.targetAudience, 'en') ||
        get(entity.targetAudience, 'es') ||
        ''
    }

    // Process objectives field
    if (entity.objectives) {
      result.localizedObjectives =
        get(entity.objectives, language) ||
        get(entity.objectives, 'en') ||
        get(entity.objectives, 'es') ||
        ''
    }

    return result
  }

  /**
   * Localizes a Campaign DTO using the localizationUtils
   * This is useful when you need to convert multilingual objects to simple strings
   */
  static localizeDTO(dto: Campaign, language: string = 'en'): Campaign {
    return localizeObject(dto, language, 'en')
  }

  /**
   * Gets the localization configuration for Campaigns
   */
  static getLocalizationConfig(): LocalizationConfig<Campaign> {
    return campaignLocalizationConfig
  }

  /**
   * Helper method to extract a localized value from a multilingual object
   */
  static getLocalizedValue(
    multilingualObj: MultilingualContent | null | undefined,
    language: string = 'en',
    defaultLanguage: string = 'en',
  ): string {
    if (!multilingualObj) return ''

    // Direct access to multilingual content
    return (
      get(multilingualObj, language) ||
      get(multilingualObj, defaultLanguage) ||
      ''
    )
  }
}
