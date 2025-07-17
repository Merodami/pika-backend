import {
  type MultilingualText,
  type VoucherDiscountType,
  type VoucherState,
} from '@pika/types-core'
import { Decimal } from '@prisma/client/runtime/library'
import { Voucher } from '@voucher-read/domain/entities/Voucher.js'

/**
 * Database document interface matching Prisma schema
 * Note: Prisma returns camelCase field names, not snake_case
 */
export interface VoucherDocument {
  id: string
  providerId: string
  categoryId: string
  state: string
  title: MultilingualText // JSON field from Prisma
  description: MultilingualText // JSON field from Prisma
  terms: MultilingualText // JSON field from Prisma
  discountType: string
  discountValue: Decimal | number
  currency: string
  imageUrl: string | null
  validFrom: Date
  expiresAt: Date
  maxRedemptions: number | null
  maxRedemptionsPerUser: number
  currentRedemptions: number
  createdAt: Date | null
  updatedAt: Date | null
  codes?: Array<{
    id: string
    code: string
    type: string
    isActive: boolean
    metadata?: any
  }>
}

/**
 * Voucher Document Mapper
 * Following Admin Service patterns for clean database-to-domain transformation
 */
export class VoucherDocumentMapper {
  /**
   * Ensure multilingual text has correct structure
   */
  static ensureMultilingualText(value: any): MultilingualText {
    if (!value || typeof value !== 'object') {
      return { en: '', es: '', gn: '' }
    }

    // Handle both direct object and nested structures
    const source = value.values || value.translations || value

    return {
      en: String(source.en || ''),
      es: String(source.es || ''),
      gn: String(source.gn || ''),
      pt: String(source.pt || ''),
    }
  }

  /**
   * Map database document to domain entity
   */
  static mapDocumentToDomain(document: VoucherDocument): Voucher {
    try {
      // Safe date parsing helper
      const parseDate = (value: any): Date => {
        if (!value) return new Date()
        if (value instanceof Date) return value

        const parsed = new Date(value)

        if (isNaN(parsed.getTime())) {
          return new Date()
        }

        return parsed
      }

      return new Voucher({
        id: document.id,
        providerId: document.providerId,
        categoryId: document.categoryId,
        state: document.state as VoucherState,
        title: this.ensureMultilingualText(document.title),
        description: this.ensureMultilingualText(document.description),
        terms: this.ensureMultilingualText(document.terms),
        discountType: document.discountType as VoucherDiscountType,
        discountValue:
          typeof document.discountValue === 'object' &&
          'toNumber' in document.discountValue
            ? document.discountValue.toNumber()
            : Number(document.discountValue || 0),
        currency: document.currency,
        imageUrl: document.imageUrl,
        validFrom: parseDate(document.validFrom),
        expiresAt: parseDate(document.expiresAt),
        maxRedemptions: document.maxRedemptions,
        maxRedemptionsPerUser: document.maxRedemptionsPerUser,
        currentRedemptions: document.currentRedemptions,
        createdAt: document.createdAt ? parseDate(document.createdAt) : null,
        updatedAt: document.updatedAt ? parseDate(document.updatedAt) : null,
        codes: document.codes,
      })
    } catch (error) {
      console.error('Error mapping voucher document to domain:', {
        document: JSON.stringify(document, null, 2),
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
  }

  /**
   * Map multiple documents to domain entities
   */
  static mapDocumentsToDomain(documents: VoucherDocument[]): Voucher[] {
    return documents.map((doc) => this.mapDocumentToDomain(doc))
  }

  /**
   * Map domain entity to database document (for write operations if needed)
   */
  static mapDomainToDocument(voucher: Voucher): Partial<VoucherDocument> {
    const data = voucher.toObject()

    return {
      id: data.id,
      providerId: data.providerId,
      categoryId: data.categoryId,
      state: data.state,
      title: data.title,
      description: data.description,
      terms: data.terms,
      discountType: data.discountType,
      discountValue: data.discountValue,
      currency: data.currency,
      imageUrl: data.imageUrl,
      validFrom: data.validFrom,
      expiresAt: data.expiresAt,
      maxRedemptions: data.maxRedemptions,
      maxRedemptionsPerUser: data.maxRedemptionsPerUser,
      currentRedemptions: data.currentRedemptions,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    }
  }
}
