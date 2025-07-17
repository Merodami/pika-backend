import { type UserSummary } from '@pika/types-core'
import {
  type MultilingualText,
  Provider,
} from '@provider-read/domain/entities/Provider.js'

/**
 * Database document structure for Provider
 * Matches the Prisma schema with snake_case fields
 */
export interface ProviderDocument {
  id: string
  user_id: string
  business_name: any // JSON field from Prisma
  business_description: any // JSON field from Prisma
  category_id: string
  verified: boolean
  active: boolean
  avg_rating: number | null
  created_at: Date | null
  updated_at: Date | null
  deleted_at: Date | null
  user?: UserSummary
}

/**
 * Maps between database documents and domain entities
 * Following Admin Service pattern - NO SDK dependencies
 */
export class ProviderDocumentMapper {
  /**
   * Ensure multilingual text has proper structure
   * Handles both camelCase and snake_case inputs
   */
  private static ensureMultilingualText(value: any): MultilingualText {
    if (!value || typeof value !== 'object') {
      return { en: '', es: undefined, gn: undefined }
    }

    // Handle both formats from database
    return {
      en: String(value.en || ''),
      es: value.es ? String(value.es) : undefined,
      gn: value.gn ? String(value.gn) : undefined,
    }
  }

  /**
   * Map database document to domain entity
   * Handles both snake_case (from DB) and camelCase formats
   */
  static mapDocumentToDomain(document: ProviderDocument | any): Provider {
    // Handle both snake_case and camelCase field names
    const id = document.id
    const userId = document.user_id || document.userId
    const businessName = document.business_name || document.businessName
    const businessDescription =
      document.business_description || document.businessDescription
    const categoryId = document.category_id || document.categoryId
    const verified = document.verified !== undefined ? document.verified : false
    const active = document.active !== undefined ? document.active : true
    const avgRating = document.avg_rating ?? document.avgRating ?? 0
    const createdAt = document.created_at || document.createdAt
    const updatedAt = document.updated_at || document.updatedAt
    const deletedAt = document.deleted_at || document.deletedAt
    const user = document.user

    return Provider.create({
      id,
      userId,
      businessName: this.ensureMultilingualText(businessName),
      businessDescription: this.ensureMultilingualText(businessDescription),
      categoryId,
      verified,
      active,
      avgRating: Number(avgRating) || 0,
      createdAt: createdAt ? new Date(createdAt) : null,
      updatedAt: updatedAt ? new Date(updatedAt) : null,
      deletedAt: deletedAt ? new Date(deletedAt) : null,
      user,
    })
  }

  /**
   * Map multiple documents to domain entities
   */
  static mapDocumentsToDomain(documents: ProviderDocument[]): Provider[] {
    return documents.map((doc) => this.mapDocumentToDomain(doc))
  }

  /**
   * Map domain entity to database document format
   * Converts to snake_case for database
   */
  static mapDomainToDocument(provider: Provider): Partial<ProviderDocument> {
    const data = provider.toObject()

    return {
      id: data.id,
      user_id: data.userId,
      business_name: data.businessName,
      business_description: data.businessDescription,
      category_id: data.categoryId,
      verified: data.verified,
      active: data.active,
      avg_rating: data.avgRating,
      created_at: data.createdAt,
      updated_at: data.updatedAt,
      deleted_at: data.deletedAt,
    }
  }
}
