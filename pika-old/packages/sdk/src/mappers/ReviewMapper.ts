/**
 * Interface representing a database Review document
 * Uses snake_case for fields as they come from the database
 */
export interface ReviewDocument {
  id: string
  provider_id: string
  customer_id: string
  rating: number
  review: string | null
  response: string | null
  response_at: Date | string | null
  created_at: Date | string | null
  updated_at: Date | string | null
  deleted_at: Date | string | null
  // Optional relations
  provider?: {
    id: string
    businessName: any // This might be multilingual
  }
  customer?: {
    id: string
    firstName: string
    lastName: string
  }
}

/**
 * Interface representing a domain Review entity with camelCase property names
 * This is the central domain model used across the application
 */
export interface ReviewDomain {
  id: string
  providerId: string
  customerId: string
  rating: number
  review: string | null
  response: string | null
  responseAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  deletedAt: Date | null
  // Optional relation data
  provider?: {
    id: string
    businessName: string
  }
  customer?: {
    id: string
    firstName: string
    lastName: string
  }
}

/**
 * Interface representing a Review DTO for API responses
 * Uses snake_case for consistency with API conventions
 */
export interface ReviewDTO {
  id: string
  provider_id: string
  customer_id: string
  rating: number
  review: string | null
  response: string | null
  response_at: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  // Optional relation data
  provider?: {
    id: string
    business_name: string
  }
  customer?: {
    id: string
    first_name: string
    last_name: string
  }
}

/**
 * Comprehensive Review mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 * Note: Reviews don't need localization as they're single-language text
 */
export class ReviewMapper {
  /**
   * Converts a date value to a Date object
   * Handles various input formats (Date, string, null)
   */
  private static toDate(value: Date | string | null | undefined): Date | null {
    if (!value) {
      return null
    }

    if (value instanceof Date) {
      return value
    }

    const date = new Date(value)

    return isNaN(date.getTime()) ? null : date
  }

  /**
   * Converts a Date object to ISO string for API responses
   */
  private static toISOString(date: Date | null | undefined): string | null {
    if (!date) {
      return null
    }

    return date instanceof Date ? date.toISOString() : null
  }

  /**
   * Maps a database document to a domain entity
   * Handles nested objects and transforms snake_case to camelCase
   */
  static fromDocument(doc: ReviewDocument): ReviewDomain {
    const domain: ReviewDomain = {
      id: doc.id,
      providerId: doc.provider_id,
      customerId: doc.customer_id,
      rating: doc.rating,
      review: doc.review,
      response: doc.response,
      responseAt: this.toDate(doc.response_at),
      createdAt: this.toDate(doc.created_at),
      updatedAt: this.toDate(doc.updated_at),
      deletedAt: this.toDate(doc.deleted_at),
    }

    // Map relations if present
    if (doc.provider) {
      domain.provider = {
        id: doc.provider.id,
        // Handle multilingual business name if needed
        businessName:
          typeof doc.provider.businessName === 'object'
            ? doc.provider.businessName.es || doc.provider.businessName.en || ''
            : doc.provider.businessName,
      }
    }

    if (doc.customer) {
      domain.customer = {
        id: doc.customer.id,
        firstName: doc.customer.firstName,
        lastName: doc.customer.lastName,
      }
    }

    return domain
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase to snake_case and dates to ISO strings
   */
  static toDTO(domain: ReviewDomain): ReviewDTO {
    const dto: ReviewDTO = {
      id: domain.id,
      provider_id: domain.providerId,
      customer_id: domain.customerId,
      rating: domain.rating,
      review: domain.review,
      response: domain.response,
      response_at: this.toISOString(domain.responseAt),
      created_at: this.toISOString(domain.createdAt),
      updated_at: this.toISOString(domain.updatedAt),
      deleted_at: this.toISOString(domain.deletedAt),
    }

    // Map relations if present
    if (domain.provider) {
      dto.provider = {
        id: domain.provider.id,
        business_name: domain.provider.businessName,
      }
    }

    if (domain.customer) {
      dto.customer = {
        id: domain.customer.id,
        first_name: domain.customer.firstName,
        last_name: domain.customer.lastName,
      }
    }

    return dto
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and ISO strings to dates
   */
  static fromDTO(dto: ReviewDTO): ReviewDomain {
    const domain: ReviewDomain = {
      id: dto.id,
      providerId: dto.provider_id,
      customerId: dto.customer_id,
      rating: dto.rating,
      review: dto.review,
      response: dto.response,
      responseAt: this.toDate(dto.response_at),
      createdAt: this.toDate(dto.created_at),
      updatedAt: this.toDate(dto.updated_at),
      deletedAt: this.toDate(dto.deleted_at),
    }

    // Map relations if present
    if (dto.provider) {
      domain.provider = {
        id: dto.provider.id,
        businessName: dto.provider.business_name,
      }
    }

    if (dto.customer) {
      domain.customer = {
        id: dto.customer.id,
        firstName: dto.customer.first_name,
        lastName: dto.customer.last_name,
      }
    }

    return domain
  }

  /**
   * Maps an array of documents to domain entities
   */
  static fromDocuments(docs: ReviewDocument[]): ReviewDomain[] {
    return docs.map((doc) => this.fromDocument(doc))
  }

  /**
   * Maps an array of domain entities to DTOs
   */
  static toDTOs(domains: ReviewDomain[]): ReviewDTO[] {
    return domains.map((domain) => this.toDTO(domain))
  }

  /**
   * Maps an array of DTOs to domain entities
   */
  static fromDTOs(dtos: ReviewDTO[]): ReviewDomain[] {
    return dtos.map((dto) => this.fromDTO(dto))
  }
}
