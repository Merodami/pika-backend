import { VoucherBook } from '../openapi/models/VoucherBook.js'

/**
 * Interface representing a database VoucherBook document
 * Uses camelCase for fields as they come from the domain layer
 */
export interface VoucherBookDocument {
  id: string
  title: string
  edition: string | null
  bookType:
    | 'MONTHLY'
    | 'SPECIAL_EDITION'
    | 'REGIONAL'
    | 'SEASONAL'
    | 'PROMOTIONAL'
  month: number | null
  year: number
  status: 'DRAFT' | 'READY_FOR_PRINT' | 'PUBLISHED' | 'ARCHIVED'
  totalPages: number
  coverImageUrl: string | null
  backImageUrl: string | null
  pdfUrl: string | null
  generatedAt: Date | string | null
  publishedAt: Date | string | null
  createdBy: string
  providerId: string | null
  createdAt: Date | string | null
  updatedAt: Date | string | null
}

/**
 * Interface representing a domain VoucherBook entity with camelCase property names
 * This is the central domain model used across the application
 */
export interface VoucherBookDomain {
  id: string
  title: string
  edition: string | null
  bookType:
    | 'MONTHLY'
    | 'SPECIAL_EDITION'
    | 'REGIONAL'
    | 'SEASONAL'
    | 'PROMOTIONAL'
  month: number | null
  year: number
  status: 'DRAFT' | 'READY_FOR_PRINT' | 'PUBLISHED' | 'ARCHIVED'
  totalPages: number
  coverImageUrl: string | null
  backImageUrl: string | null
  pdfUrl: string | null
  generatedAt: Date | null
  publishedAt: Date | null
  createdBy: string
  providerId: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

/**
 * Comprehensive VoucherBook mapper that handles all transformations:
 * - Database document to Domain entity
 * - Domain entity to API DTO
 * - API DTO to Domain entity
 */
export class VoucherBookMapper {
  /**
   * Maps a database document to a domain entity
   * Handles date conversion and null handling
   */
  static fromDocument(doc: VoucherBookDocument): VoucherBookDomain {
    const safeDate = (date: Date | string | null): Date | null => {
      if (!date) return null
      if (date instanceof Date) return date

      return new Date(date)
    }

    return {
      id: doc.id,
      title: doc.title,
      edition: doc.edition,
      bookType: doc.bookType,
      month: doc.month,
      year: doc.year,
      status: doc.status,
      totalPages: doc.totalPages,
      coverImageUrl: doc.coverImageUrl,
      backImageUrl: doc.backImageUrl,
      pdfUrl: doc.pdfUrl,
      generatedAt: safeDate(doc.generatedAt),
      publishedAt: safeDate(doc.publishedAt),
      createdBy: doc.createdBy,
      providerId: doc.providerId,
      createdAt: safeDate(doc.createdAt),
      updatedAt: safeDate(doc.updatedAt),
    }
  }

  /**
   * Maps a domain entity to an API DTO
   * Transforms camelCase to snake_case and handles date formatting
   */
  static toDTO(domain: VoucherBookDomain): VoucherBook {
    // Format date to ISO string safely
    const formatDate = (
      date: Date | string | null | undefined,
    ): string | undefined => {
      if (!date) return undefined

      if (typeof date === 'string') return date
      if (date instanceof Date) return date.toISOString()

      // Try to convert to Date if it's not already
      try {
        return new Date(date).toISOString()
      } catch {
        return undefined
      }
    }

    return {
      id: domain.id,
      title: domain.title,
      edition: domain.edition,
      book_type: domain.bookType,
      month: domain.month,
      year: domain.year,
      status: domain.status,
      total_pages: domain.totalPages,
      cover_image_url: domain.coverImageUrl,
      back_image_url: domain.backImageUrl,
      pdf_url: domain.pdfUrl,
      pdf_generated_at: formatDate(domain.generatedAt),
      published_at: formatDate(domain.publishedAt),
      created_by: domain.createdBy,
      provider_id: domain.providerId,
      created_at: formatDate(domain.createdAt),
      updated_at: formatDate(domain.updatedAt),
    } as any
  }

  /**
   * Maps an API DTO to a domain entity
   * Transforms snake_case to camelCase and handles date parsing
   */
  static fromDTO(dto: VoucherBook): VoucherBookDomain {
    const parseDate = (dateStr: string | undefined): Date | null => {
      if (!dateStr) return null

      return new Date(dateStr)
    }

    return {
      id: dto.id,
      title: dto.title,
      edition: dto.edition || null,
      bookType: dto.book_type as
        | 'MONTHLY'
        | 'SPECIAL_EDITION'
        | 'REGIONAL'
        | 'SEASONAL'
        | 'PROMOTIONAL',
      month: dto.month || null,
      year: dto.year,
      status: dto.status as
        | 'DRAFT'
        | 'READY_FOR_PRINT'
        | 'PUBLISHED'
        | 'ARCHIVED',
      totalPages: dto.total_pages,
      coverImageUrl: dto.cover_image_url || null,
      backImageUrl: dto.back_image_url || null,
      pdfUrl: dto.pdf_url || null,
      generatedAt: parseDate(dto.pdf_generated_at),
      publishedAt: parseDate(dto.published_at),
      createdBy: (dto as any).created_by,
      providerId: (dto as any).provider_id || null,
      createdAt: parseDate(dto.created_at),
      updatedAt: parseDate(dto.updated_at),
    }
  }
}
