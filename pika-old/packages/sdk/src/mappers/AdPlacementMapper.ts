export interface AdPlacementDomain {
  id: string
  pageId: string
  contentType: 'VOUCHER' | 'IMAGE' | 'AD' | 'SPONSORED'
  position: number
  size: 'SINGLE' | 'QUARTER' | 'HALF' | 'FULL'
  spacesUsed: number
  voucherId?: string | null
  providerId?: string | null
  imageUrl?: string | null
  qrCodePayload?: string | null
  shortCode?: string | null
  title?: string | null
  description?: string | null
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface AdPlacementDTO {
  id: string
  page_id: string
  content_type: 'VOUCHER' | 'IMAGE' | 'AD' | 'SPONSORED'
  position: number
  size: 'SINGLE' | 'QUARTER' | 'HALF' | 'FULL'
  spaces_used: number
  voucher_id?: string | null
  provider_id?: string | null
  image_url?: string | null
  qr_code_payload?: string | null
  short_code?: string | null
  title?: string | null
  description?: string | null
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export class AdPlacementMapper {
  /**
   * Maps database document to domain entity
   */
  static fromDocument(doc: any): AdPlacementDomain {
    return {
      id: doc.id,
      pageId: doc.pageId,
      contentType: doc.contentType,
      position: doc.position,
      size: doc.size,
      spacesUsed: doc.spacesUsed,
      voucherId: doc.voucherId,
      providerId: doc.providerId,
      imageUrl: doc.imageUrl,
      qrCodePayload: doc.qrCodePayload,
      shortCode: doc.shortCode,
      title: doc.title,
      description: doc.description,
      metadata: doc.metadata || {},
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    }
  }

  /**
   * Maps domain entity to API DTO (camelCase to snake_case)
   */
  static toDTO(domain: AdPlacementDomain): AdPlacementDTO {
    return {
      id: domain.id,
      page_id: domain.pageId,
      content_type: domain.contentType,
      position: domain.position,
      size: domain.size,
      spaces_used: domain.spacesUsed,
      voucher_id: domain.voucherId,
      provider_id: domain.providerId,
      image_url: domain.imageUrl,
      qr_code_payload: domain.qrCodePayload,
      short_code: domain.shortCode,
      title: domain.title,
      description: domain.description,
      metadata: domain.metadata,
      created_at: domain.createdAt.toISOString(),
      updated_at: domain.updatedAt.toISOString(),
    }
  }

  /**
   * Maps API DTO to domain entity (snake_case to camelCase)
   */
  static fromDTO(dto: AdPlacementDTO): AdPlacementDomain {
    return {
      id: dto.id,
      pageId: dto.page_id,
      contentType: dto.content_type,
      position: dto.position,
      size: dto.size,
      spacesUsed: dto.spaces_used,
      voucherId: dto.voucher_id,
      providerId: dto.provider_id,
      imageUrl: dto.image_url,
      qrCodePayload: dto.qr_code_payload,
      shortCode: dto.short_code,
      title: dto.title,
      description: dto.description,
      metadata: dto.metadata || {},
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    }
  }
}
