import { LocalizationConfig, MultilingualContent } from '@pika/types-core'
import { get } from 'lodash-es'

import { voucherLocalizationConfig } from '../localization/VoucherLocalization.js'
import { Voucher } from '../openapi/models/Voucher.js'
import { localizeObject } from './LocalizationUtils.js'

/**
 * Voucher multilingual text structure based on OpenAPI schema
 */
export interface VoucherMultilingualText {
  en: string
  es: string
  gn: string
  [key: string]: string
}

/**
 * Interface representing a database Voucher document
 * Uses snake_case for fields as they come from the database
 */
export interface VoucherDocument {
  id: string
  providerId: string
  categoryId: string
  state: string
  title: VoucherMultilingualText
  description: VoucherMultilingualText
  terms: VoucherMultilingualText
  discountType: string
  discountValue: number
  currency: string
  location: any
  imageUrl: string | null
  validFrom: Date | string
  expiresAt: Date | string
  maxRedemptions: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  metadata?: Record<string, any>
  createdAt: Date | null
  updatedAt: Date | null
  codes?: Array<{
    id: string
    code: string
    type: string
    isActive: boolean
    metadata?: Record<string, any>
  }>
}

/**
 * Interface representing a domain Voucher entity with camelCase property names
 * This is the central domain model used across the application
 */
export interface VoucherDomain {
  id: string
  providerId: string
  categoryId: string
  state: string
  title: VoucherMultilingualText
  description: VoucherMultilingualText
  terms: VoucherMultilingualText
  discountType: string
  discountValue: number
  currency: string
  location: any
  imageUrl: string | null
  validFrom: Date
  expiresAt: Date
  maxRedemptions: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  metadata?: Record<string, any>
  createdAt: Date | null
  updatedAt: Date | null
  // Optional localized fields that might be added by mappers
  localizedTitle?: string
  localizedDescription?: string
  localizedTerms?: string
  // Optional codes when included
  codes?: Array<{
    id: string
    code: string
    type: string
    isActive: boolean
    metadata?: Record<string, any>
  }>
}

/**
 * Comprehensive Voucher mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 * - Localization for any of the above
 */
export class VoucherMapper {
  /**
   * Ensures a value is a valid VoucherMultilingualText
   * Adds required fields if missing
   */
  static ensureMultilingualText(value: any): VoucherMultilingualText {
    // Handle null or undefined case
    if (!value) {
      return {
        en: '',
        es: '',
        gn: '',
      }
    }

    // Handle nested properties in different formats
    if (value.values && typeof value.values === 'object') {
      return this.ensureMultilingualText(value.values)
    }

    // Also handle old format with translations property
    if (value.translations && typeof value.translations === 'object') {
      return this.ensureMultilingualText(value.translations)
    }

    // Handle the direct format (new format)
    const textObj = typeof value === 'object' ? value : { en: String(value) }

    // Make sure it has the required fields
    return {
      en: textObj.en !== undefined ? textObj.en : '',
      es: textObj.es !== undefined ? textObj.es : '',
      gn: textObj.gn !== undefined ? textObj.gn : '',
    }
  }

  /**
   * Maps a database document to a domain entity
   * Handles nested objects and transforms snake_case to camelCase
   */
  static fromDocument(doc: VoucherDocument): VoucherDomain {
    return {
      id: doc.id,
      providerId: doc.providerId,
      categoryId: doc.categoryId,
      state: doc.state,
      title: this.ensureMultilingualText(doc.title),
      description: this.ensureMultilingualText(doc.description),
      terms: this.ensureMultilingualText(doc.terms),
      discountType: doc.discountType,
      discountValue: doc.discountValue,
      currency: doc.currency,
      location: doc.location || null,
      imageUrl: doc.imageUrl,
      validFrom:
        doc.validFrom instanceof Date ? doc.validFrom : new Date(doc.validFrom),
      expiresAt:
        doc.expiresAt instanceof Date ? doc.expiresAt : new Date(doc.expiresAt),
      maxRedemptions: doc.maxRedemptions,
      maxRedemptionsPerUser: doc.maxRedemptionsPerUser,
      currentRedemptions: doc.currentRedemptions,
      metadata: doc.metadata,
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
      codes: doc.codes,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase to snake_case and handles date formatting
   */
  static toDTO(domain: VoucherDomain): Voucher {
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
      category_id: domain.categoryId,
      state: domain.state as
        | 'NEW'
        | 'PUBLISHED'
        | 'CLAIMED'
        | 'REDEEMED'
        | 'EXPIRED',
      title: domain.title,
      description: domain.description,
      terms: domain.terms,
      discount_type: domain.discountType as 'PERCENTAGE' | 'FIXED',
      discount_value:
        typeof domain.discountValue === 'string'
          ? parseFloat(domain.discountValue)
          : domain.discountValue,
      currency: domain.currency,
      location: domain.location || null,
      image_url: domain.imageUrl || undefined,
      valid_from: formatDate(domain.validFrom),
      expires_at: formatDate(domain.expiresAt),
      max_redemptions: domain.maxRedemptions || undefined,
      max_redemptions_per_user: domain.maxRedemptionsPerUser,
      current_redemptions: domain.currentRedemptions,
      metadata: domain.metadata,
      created_at: formatDate(domain.createdAt),
      updated_at: formatDate(domain.updatedAt),
      codes: domain.codes?.map((code) => ({
        id: code.id,
        code: code.code,
        type: code.type,
        is_active: code.isActive,
        metadata: code.metadata,
      })),
    } as any
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and handles date parsing
   */
  static fromDTO(dto: Voucher): VoucherDomain {
    return {
      id: dto.id,
      providerId: dto.provider_id,
      categoryId: dto.category_id,
      state: dto.state,
      title: this.ensureMultilingualText(dto.title),
      description: this.ensureMultilingualText(dto.description),
      terms: this.ensureMultilingualText(dto.terms),
      discountType: dto.discount_type,
      discountValue: dto.discount_value,
      currency: dto.currency,
      location: dto.location,
      imageUrl: dto.image_url || null,
      validFrom: new Date(dto.valid_from),
      expiresAt: new Date(dto.expires_at),
      maxRedemptions: dto.max_redemptions || null,
      maxRedemptionsPerUser: dto.max_redemptions_per_user,
      currentRedemptions: dto.current_redemptions,
      metadata: dto.metadata,
      createdAt: dto.created_at ? new Date(dto.created_at) : null,
      updatedAt: dto.updated_at ? new Date(dto.updated_at) : null,
    }
  }

  /**
   * Localizes a domain entity by extracting the specified language
   * from multilingual fields
   */
  static localize(
    entity: VoucherDomain,
    language: string = 'en',
  ): VoucherDomain {
    // First create a copy with localized fields preserved
    const result = { ...entity }

    // Process title field - handling all formats
    const titleObj =
      entity.title?.values || entity.title?.translations || entity.title

    result.localizedTitle =
      get(titleObj, language) ||
      get(titleObj, 'en') ||
      get(titleObj, 'es') ||
      ''

    // Process terms field - handling all formats
    const termsObj =
      entity.terms?.values || entity.terms?.translations || entity.terms

    result.localizedTerms =
      get(termsObj, language) ||
      get(termsObj, 'en') ||
      get(termsObj, 'es') ||
      ''

    // Process description field - handling all formats
    const descObj =
      entity.description?.values ||
      entity.description?.translations ||
      entity.description

    result.localizedDescription =
      get(descObj, language) || get(descObj, 'en') || get(descObj, 'es') || ''

    // No children for vouchers

    return result
  }

  /**
   * Localizes a Voucher DTO using the localizationUtils
   * This is useful when you need to convert multilingual objects to simple strings
   */
  static localizeDTO(dto: Voucher, language: string = 'en'): Voucher {
    return localizeObject(dto, language, 'en')
  }

  /**
   * Gets the localization configuration for Vouchers
   */
  static getLocalizationConfig(): LocalizationConfig<Voucher> {
    return voucherLocalizationConfig
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

    // Handle nested properties in different formats
    if (
      typeof multilingualObj === 'object' &&
      (multilingualObj as any).values &&
      typeof (multilingualObj as any).values === 'object'
    ) {
      return this.getLocalizedValue(
        (multilingualObj as any).values,
        language,
        defaultLanguage,
      )
    }

    // Also handle old format with translations property
    if (
      typeof multilingualObj === 'object' &&
      (multilingualObj as any).translations &&
      typeof (multilingualObj as any).translations === 'object'
    ) {
      return this.getLocalizedValue(
        (multilingualObj as any).translations,
        language,
        defaultLanguage,
      )
    }

    return (
      get(multilingualObj, language) ||
      get(multilingualObj, defaultLanguage) ||
      ''
    )
  }
}
