import { ProviderProfile } from '../openapi/models/ProviderProfile.js'
import { ProviderDocument, ProviderDomain } from './UserMapper.js'

// Re-export types with Provider naming convention
export type { ProviderDocument, ProviderDomain }

/**
 * Mapper for Provider entities
 * Handles transformations between database documents, domain entities, and API DTOs
 */
export class ProviderMapper {
  /**
   * Maps a database document to a domain entity
   */
  static fromDocument(doc: ProviderDocument): ProviderDomain {
    return {
      id: doc.id,
      userId: doc.userId,
      businessName: doc.businessName,
      businessDescription: doc.businessDescription,
      categoryId: doc.categoryId,
      verified: doc.verified,
      active: doc.active,
      avgRating:
        doc.avgRating !== null && doc.avgRating !== undefined
          ? parseFloat(doc.avgRating as any)
          : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      deletedAt: doc.deletedAt,
      user: doc.user,
    }
  }

  /**
   * Maps a domain entity to an API DTO
   */
  static toDTO(domain: ProviderDomain): ProviderProfile {
    const dto: ProviderProfile = {
      id: domain.id,
      user_id: domain.userId,
      business_name: domain.businessName,
      business_description: {
        es: domain.businessDescription.es || '',
        en: domain.businessDescription.en,
        gn: domain.businessDescription.gn,
      },
      category_id: domain.categoryId,
      verified: domain.verified,
      active: domain.active,
      avg_rating: domain.avgRating ?? undefined,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
    }

    // Include user data if present
    if (domain.user) {
      dto.user = {
        id: domain.user.id,
        email: domain.user.email,
        first_name: domain.user.firstName || '',
        last_name: domain.user.lastName || '',
        phone_number: domain.user.phoneNumber || undefined,
        role: domain.user.role,
        status: domain.user.status,
        avatar_url: domain.user.avatarUrl || undefined,
      }
    }

    return dto
  }

  /**
   * Maps an API DTO to a domain entity
   */
  static fromDTO(dto: ProviderProfile): ProviderDomain {
    return {
      id: dto.id,
      userId: dto.user_id,
      businessName: dto.business_name,
      businessDescription: dto.business_description,
      categoryId: dto.category_id,
      verified: dto.verified,
      active: dto.active,
      avgRating: dto.avg_rating ?? null,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      deletedAt: null,
    }
  }
}
