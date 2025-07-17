export interface VoucherBookPageDomain {
  id: string
  bookId: string
  pageNumber: number
  layoutType: 'STANDARD' | 'CUSTOM'
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
  adPlacements?: any[]
}

export interface VoucherBookPageDTO {
  id: string
  book_id: string
  page_number: number
  layout_type: 'STANDARD' | 'CUSTOM'
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  ad_placements?: any[]
}

export class VoucherBookPageMapper {
  /**
   * Maps database document to domain entity
   */
  static fromDocument(doc: any): VoucherBookPageDomain {
    return {
      id: doc.id,
      bookId: doc.bookId,
      pageNumber: doc.pageNumber,
      layoutType: doc.layoutType,
      metadata: doc.metadata || {},
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      adPlacements: doc.adPlacements || [],
    }
  }

  /**
   * Maps domain entity to API DTO (camelCase to snake_case)
   */
  static toDTO(domain: VoucherBookPageDomain): VoucherBookPageDTO {
    return {
      id: domain.id,
      book_id: domain.bookId,
      page_number: domain.pageNumber,
      layout_type: domain.layoutType,
      metadata: domain.metadata,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
      ad_placements: domain.adPlacements,
    }
  }

  /**
   * Maps API DTO to domain entity (snake_case to camelCase)
   */
  static fromDTO(dto: VoucherBookPageDTO): VoucherBookPageDomain {
    return {
      id: dto.id,
      bookId: dto.book_id,
      pageNumber: dto.page_number,
      layoutType: dto.layout_type,
      metadata: dto.metadata || {},
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      adPlacements: dto.ad_placements || [],
    }
  }
}
