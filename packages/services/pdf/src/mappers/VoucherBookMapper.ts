import type { VoucherBookDomain } from '@pika/sdk'
import type {
  VoucherBook,
  VoucherBookStatus,
  VoucherBookType,
} from '@prisma/client'

import type { VoucherBookStatistics } from '../types/domain.js'

/**
 * DTOs for VoucherBook - defined within the service following established pattern
 */
export interface VoucherBookDTO {
  id: string
  title: string
  edition?: string | null
  bookType: VoucherBookType
  month?: number | null
  year: number
  status: VoucherBookStatus
  totalPages: number
  publishedAt?: string | null
  coverImageUrl?: string | null
  backImageUrl?: string | null
  pdfUrl?: string | null
  pdfGeneratedAt?: string | null
  metadata?: Record<string, any>
  createdById: string
  updatedById?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface VoucherBookDetailDTO extends VoucherBookDTO {
  createdBy?: {
    id: string
    email: string
    name: string
  }
  updatedBy?: {
    id: string
    email: string
    name: string
  }
  statistics?: {
    totalPages: number
    pagesWithPlacements: number
    completionPercentage: number
    totalDistributions: number
    pendingDistributions: number
    shippedDistributions: number
    deliveredDistributions: number
  }
  computed?: {
    displayName: string
    displayPeriod: string
    ageInDays: number
    isRecent: boolean
    canBeEdited: boolean
    canBePublished: boolean
    hasPDF: boolean
  }
}

export interface PublicVoucherBookDTO {
  id: string
  title: string
  edition?: string | null
  bookType: VoucherBookType
  month?: number | null
  year: number
  totalPages: number
  publishedAt?: string | null
  coverImageUrl?: string | null
  pdfUrl?: string | null
  createdAt: string
}

export interface CreateVoucherBookDTO {
  title: string
  edition?: string | null
  bookType?: VoucherBookType
  month?: number | null
  year: number
  totalPages?: number
  coverImageUrl?: string | null
  backImageUrl?: string | null
  metadata?: Record<string, any>
}

export interface UpdateVoucherBookDTO {
  title?: string
  edition?: string | null
  bookType?: VoucherBookType
  month?: number | null
  year?: number
  totalPages?: number
  status?: VoucherBookStatus
  coverImageUrl?: string | null
  backImageUrl?: string | null
  metadata?: Record<string, any>
}

/**
 * VoucherBookMapper handles data transformation between database entities and DTOs
 * Includes all business rules from the old system
 */
export class VoucherBookMapper {
  /**
   * Ensure metadata is a proper object or null
   * Business rule from old system
   */
  private static ensureMetadata(value: any): Record<string, any> | undefined {
    if (!value || typeof value !== 'object') {
      return undefined
    }

    return value
  }

  /**
   * Get display name for the book
   * Business rule: title + edition if available
   */
  static getDisplayName(voucherBook: VoucherBookDTO): string {
    return voucherBook.edition
      ? `${voucherBook.title} - ${voucherBook.edition}`
      : voucherBook.title
  }

  /**
   * Get display period for the book
   * Business rule: Month name + year or just year
   */
  static getDisplayPeriod(voucherBook: VoucherBookDTO): string {
    if (voucherBook.month) {
      const monthName = new Date(2000, voucherBook.month - 1, 1).toLocaleString(
        'en',
        {
          month: 'long',
        },
      )

      return `${monthName} ${voucherBook.year}`
    }

    return voucherBook.year.toString()
  }

  /**
   * Calculate age of book in days
   * Business rule from old system
   */
  static getAgeInDays(createdAt: string): number {
    const created = new Date(createdAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())

    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  /**
   * Check if book is recent (within 7 days)
   * Business rule from old system
   */
  static isRecent(createdAt: string): boolean {
    return this.getAgeInDays(createdAt) <= 7
  }

  /**
   * Check if book has PDF
   * Business rule: pdfUrl and pdfGeneratedAt must both exist
   */
  static hasPDF(voucherBook: VoucherBookDTO): boolean {
    return voucherBook.pdfUrl !== null && voucherBook.pdfGeneratedAt !== null
  }

  /**
   * Check if book can be edited
   * Business rule: Only DRAFT status can be edited
   */
  static canBeEdited(voucherBook: VoucherBookDTO): boolean {
    return voucherBook.status === 'draft'
  }

  /**
   * Check if book can be published
   * Business rule: Must be READY_FOR_PRINT and have PDF
   */
  static canBePublished(voucherBook: VoucherBookDTO): boolean {
    return voucherBook.status === 'ready_for_print' && this.hasPDF(voucherBook)
  }

  /**
   * Validate year
   * Business rule: Year must be between 2020 and 2100
   */
  static validateYear(year: number): boolean {
    return year >= 2020 && year <= 2100
  }

  /**
   * Validate month
   * Business rule: Month must be between 1 and 12 (if provided)
   */
  static validateMonth(month?: number | null): boolean {
    if (month === null || month === undefined) return true

    return month >= 1 && month <= 12
  }

  /**
   * Convert database entity to detailed DTO
   */
  static toDTO(
    voucherBook: VoucherBook & {
      createdByUser?: {
        id: string
        email: string
        firstName: string
        lastName: string
      } | null
      updatedByUser?: {
        id: string
        email: string
        firstName: string
        lastName: string
      } | null
      pages?: Array<{ adPlacements?: Array<any> }>
      distributions?: Array<{ status: string }>
    },
  ): VoucherBookDetailDTO {
    const dto: VoucherBookDetailDTO = {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || null,
      coverImageUrl: voucherBook.coverImageUrl,
      backImageUrl: voucherBook.backImageUrl,
      pdfUrl: voucherBook.pdfUrl,
      pdfGeneratedAt: voucherBook.pdfGeneratedAt?.toISOString() || null,
      metadata: this.ensureMetadata(voucherBook.metadata),
      createdById: voucherBook.createdBy,
      updatedById: voucherBook.updatedBy,
      createdAt: voucherBook.createdAt.toISOString(),
      updatedAt: voucherBook.updatedAt.toISOString(),
      deletedAt: voucherBook.deletedAt?.toISOString() || null,
    }

    // Add creator info if available
    if (voucherBook.createdByUser) {
      dto.createdBy = {
        id: voucherBook.createdByUser.id,
        email: voucherBook.createdByUser.email,
        name: `${voucherBook.createdByUser.firstName} ${voucherBook.createdByUser.lastName}`,
      }
    }

    // Add updater info if available
    if (voucherBook.updatedByUser) {
      dto.updatedBy = {
        id: voucherBook.updatedByUser.id,
        email: voucherBook.updatedByUser.email,
        name: `${voucherBook.updatedByUser.firstName} ${voucherBook.updatedByUser.lastName}`,
      }
    }

    // Add statistics if relations are loaded
    if (voucherBook.pages || voucherBook.distributions) {
      const pagesWithPlacements =
        voucherBook.pages?.filter(
          (page) => page.adPlacements && page.adPlacements.length > 0,
        ).length || 0

      const completionPercentage =
        voucherBook.totalPages > 0
          ? Math.round((pagesWithPlacements / voucherBook.totalPages) * 100)
          : 0

      dto.statistics = {
        totalPages: voucherBook.totalPages,
        pagesWithPlacements,
        completionPercentage,
        totalDistributions: voucherBook.distributions?.length || 0,
        pendingDistributions:
          voucherBook.distributions?.filter((d) => d.status === 'pending')
            .length || 0,
        shippedDistributions:
          voucherBook.distributions?.filter((d) => d.status === 'shipped')
            .length || 0,
        deliveredDistributions:
          voucherBook.distributions?.filter((d) => d.status === 'delivered')
            .length || 0,
      }
    }

    // Add computed properties
    dto.computed = {
      displayName: this.getDisplayName(dto),
      displayPeriod: this.getDisplayPeriod(dto),
      ageInDays: this.getAgeInDays(dto.createdAt),
      isRecent: this.isRecent(dto.createdAt),
      canBeEdited: this.canBeEdited(dto),
      canBePublished: this.canBePublished(dto),
      hasPDF: this.hasPDF(dto),
    }

    return dto
  }

  /**
   * Convert to simple DTO without relations
   */
  static toSimpleDTO(voucherBook: VoucherBook): VoucherBookDTO {
    return {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || null,
      coverImageUrl: voucherBook.coverImageUrl,
      backImageUrl: voucherBook.backImageUrl,
      pdfUrl: voucherBook.pdfUrl,
      pdfGeneratedAt: voucherBook.pdfGeneratedAt?.toISOString() || null,
      metadata: this.ensureMetadata(voucherBook.metadata),
      createdById: voucherBook.createdBy,
      updatedById: voucherBook.updatedBy,
      createdAt: voucherBook.createdAt.toISOString(),
      updatedAt: voucherBook.updatedAt.toISOString(),
      deletedAt: voucherBook.deletedAt?.toISOString() || null,
    }
  }

  /**
   * Convert to public DTO (limited fields)
   */
  static toPublicDTO(voucherBook: VoucherBook): PublicVoucherBookDTO {
    return {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || null,
      coverImageUrl: voucherBook.coverImageUrl,
      pdfUrl: voucherBook.status === 'published' ? voucherBook.pdfUrl : null, // Only show PDF if published
      createdAt: voucherBook.createdAt.toISOString(),
    }
  }

  /**
   * Convert domain object to public DTO (limited fields)
   */
  static toPublicDTOFromDomain(
    voucherBook: VoucherBookDomain,
  ): PublicVoucherBookDTO {
    return {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition,
      bookType: voucherBook.bookType as VoucherBookType,
      month: voucherBook.month,
      year: voucherBook.year,
      totalPages: voucherBook.totalPages,
      publishedAt: voucherBook.publishedAt?.toISOString() || null,
      coverImageUrl: voucherBook.coverImageUrl,
      pdfUrl: voucherBook.status === 'published' ? voucherBook.pdfUrl : null, // Only show PDF if published
      createdAt: voucherBook.createdAt.toISOString(),
    }
  }

  /**
   * Convert array to DTOs
   */
  static toDTOList(voucherBooks: VoucherBook[]): VoucherBookDTO[] {
    return voucherBooks.map((vb) => this.toSimpleDTO(vb))
  }

  /**
   * Convert array to public DTOs
   */
  static toPublicDTOList(voucherBooks: VoucherBook[]): PublicVoucherBookDTO[] {
    return voucherBooks.map((vb) => this.toPublicDTO(vb))
  }

  /**
   * Convert create DTO to database input
   */
  static fromCreateDTO(dto: CreateVoucherBookDTO, createdById: string): any {
    // Validate business rules
    if (!this.validateYear(dto.year)) {
      throw new Error('VoucherBook year must be between 2020 and 2100')
    }

    if (!this.validateMonth(dto.month)) {
      throw new Error('VoucherBook month must be between 1 and 12')
    }

    const totalPages = dto.totalPages || 24

    if (totalPages < 1) {
      throw new Error('VoucherBook must have at least 1 page')
    }

    return {
      title: dto.title,
      edition: dto.edition,
      bookType: dto.bookType || 'monthly',
      month: dto.month,
      year: dto.year,
      status: 'draft' as VoucherBookStatus,
      totalPages,
      coverImageUrl: dto.coverImageUrl,
      backImageUrl: dto.backImageUrl,
      metadata: dto.metadata || {},
      createdBy: createdById,
      updatedBy: createdById,
    }
  }

  /**
   * Convert update DTO to database input
   */
  static fromUpdateDTO(dto: UpdateVoucherBookDTO, updatedById: string): any {
    const updates: any = {
      updatedBy: updatedById,
      updatedAt: new Date(),
    }

    // Validate year if changed
    if (dto.year !== undefined) {
      if (!this.validateYear(dto.year)) {
        throw new Error('VoucherBook year must be between 2020 and 2100')
      }
      updates.year = dto.year
    }

    // Validate month if changed
    if (dto.month !== undefined) {
      if (!this.validateMonth(dto.month)) {
        throw new Error('VoucherBook month must be between 1 and 12')
      }
      updates.month = dto.month
    }

    // Validate totalPages if changed
    if (dto.totalPages !== undefined) {
      if (dto.totalPages < 1) {
        throw new Error('VoucherBook must have at least 1 page')
      }
      updates.totalPages = dto.totalPages
    }

    // Copy other fields if provided
    if (dto.title !== undefined) updates.title = dto.title
    if (dto.edition !== undefined) updates.edition = dto.edition
    if (dto.bookType !== undefined) updates.bookType = dto.bookType
    if (dto.status !== undefined) updates.status = dto.status
    if (dto.coverImageUrl !== undefined)
      updates.coverImageUrl = dto.coverImageUrl
    if (dto.backImageUrl !== undefined) updates.backImageUrl = dto.backImageUrl
    if (dto.metadata !== undefined) updates.metadata = dto.metadata

    return updates
  }

  /**
   * Group voucher books by status for dashboard views
   */
  static groupByStatus(
    voucherBooks: VoucherBook[],
  ): Map<VoucherBookStatus, VoucherBookDTO[]> {
    const statusMap = new Map<VoucherBookStatus, VoucherBookDTO[]>()

    // Initialize with all statuses
    const statuses: VoucherBookStatus[] = [
      'draft',
      'ready_for_print',
      'published',
      'archived',
    ]

    statuses.forEach((status) => {
      statusMap.set(status, [])
    })

    // Group books
    for (const book of voucherBooks) {
      const statusList = statusMap.get(book.status) || []

      statusList.push(this.toSimpleDTO(book))
      statusMap.set(book.status, statusList)
    }

    return statusMap
  }

  /**
   * Filter books by publication period
   */
  static filterByPeriod(
    voucherBooks: VoucherBook[],
    year: number,
    month?: number,
  ): VoucherBook[] {
    return voucherBooks.filter((book) => {
      if (book.year !== year) return false
      if (month && book.month !== month) return false

      return true
    })
  }

  /**
   * Sort books for display
   * Business rule: Sort by year desc, then month desc, then title
   */
  static sortForDisplay(voucherBooks: VoucherBookDTO[]): VoucherBookDTO[] {
    return [...voucherBooks].sort((a, b) => {
      // First by year (descending)
      if (a.year !== b.year) return b.year - a.year

      // Then by month (descending, nulls last)
      if (a.month !== b.month) {
        if (a.month === null) return 1
        if (b.month === null) return -1

        return (b.month ?? 0) - (a.month ?? 0)
      }

      // Finally by title
      return a.title.localeCompare(b.title)
    })
  }

  /**
   * Map PDF generation result to response DTO
   */
  static toGeneratePDFResponse(
    result: {
      voucherBook: any
      pdfUrl: string
      generatedAt: Date
      pageCount: number
    },
    regenerate: boolean = false,
  ): {
    id: string
    pdfUrl: string
    generatedAt: string
    pageCount: number
    message: string
  } {
    return {
      id: result.voucherBook.id,
      pdfUrl: result.pdfUrl,
      generatedAt: result.generatedAt.toISOString(),
      pageCount: result.pageCount,
      message: regenerate
        ? 'PDF regenerated successfully'
        : 'PDF generated successfully',
    }
  }

  /**
   * Map bulk operation result to response DTO
   */
  static toBulkOperationResponse(result: {
    processedCount: number
    operation: string
  }): {
    message: string
    processedCount: number
  } {
    return {
      message: `Successfully ${result.operation} ${result.processedCount} voucher books`,
      processedCount: result.processedCount,
    }
  }

  /**
   * Map statistics to response DTO
   */
  static toStatisticsResponse(stats: VoucherBookStatistics): any {
    return {
      total: stats.total,
      byStatus: {
        draft: stats.byStatus.draft,
        readyForPrint: stats.byStatus.readyForPrint,
        published: stats.byStatus.published,
        archived: stats.byStatus.archived,
      },
      byType: {
        monthly: stats.byType.monthly,
        specialEdition: stats.byType.specialEdition,
        regional: stats.byType.regional,
      },
      distributions: {
        total: stats.distributions.total,
        pending: stats.distributions.pending,
        shipped: stats.distributions.shipped,
        delivered: stats.distributions.delivered,
      },
      recentActivity: stats.recentActivity.map((activity) => ({
        date: activity.date.toISOString(),
        action: activity.action,
        count: activity.count,
      })),
    }
  }

  /**
   * Map paginated result to public list response
   */
  static toPublicListResponse(result: {
    data: VoucherBook[]
    pagination: any
  }): {
    data: PublicVoucherBookDTO[]
    pagination: any
  } {
    return {
      data: result.data.map((book) => this.toPublicDTO(book)),
      pagination: result.pagination,
    }
  }

  /**
   * Map paginated domain result to public list response
   */
  static toPublicListResponseFromDomain(result: {
    data: VoucherBookDomain[]
    pagination: any
  }): {
    data: PublicVoucherBookDTO[]
    pagination: any
  } {
    return {
      data: result.data.map((book) => this.toPublicDTOFromDomain(book)),
      pagination: result.pagination,
    }
  }

  /**
   * Map paginated result to admin list response
   */
  static toAdminListResponse(result: { data: any[]; pagination: any }): {
    data: VoucherBookDetailDTO[]
    pagination: any
  } {
    return {
      data: result.data.map((book) => this.toDTO(book)),
      pagination: result.pagination,
    }
  }

  /**
   * Map PDF download info to response DTO
   */
  static toPDFDownloadResponse(downloadInfo: {
    url: string
    filename: string
    contentType?: string
    size?: number
    generatedAt: Date
  }): {
    url: string
    filename: string
    contentType: string
    size?: number
    generatedAt: string
  } {
    return {
      url: downloadInfo.url,
      filename: downloadInfo.filename,
      contentType: downloadInfo.contentType || 'application/pdf',
      size: downloadInfo.size,
      generatedAt: downloadInfo.generatedAt.toISOString(),
    }
  }
}
