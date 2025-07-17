import {
  AdSize,
  PageLayoutType,
  VoucherBookStatus,
  VoucherBookType,
} from '@prisma/client'

/**
 * Data Transfer Object for VoucherBooks
 * Used for transferring voucher book data between application layers
 */
export interface VoucherBookDTO {
  id: string
  title: string
  edition: string | null
  bookType: VoucherBookType
  month: number | null
  year: number
  status: VoucherBookStatus
  totalPages: number
  publishedAt: Date | null
  pdfUrl: string | null
  pdfGeneratedAt: Date | null
  metadata: Record<string, any> | null
  createdAt: Date | null
  updatedAt: Date | null
  pages?: VoucherBookPageDTO[]
}

/**
 * Data Transfer Object for VoucherBookPage
 */
export interface VoucherBookPageDTO {
  id: string
  bookId: string
  pageNumber: number
  layoutType: PageLayoutType
  metadata: Record<string, any> | null
  createdAt: Date | null
  updatedAt: Date | null
  adPlacements?: AdPlacementDTO[]
}

/**
 * Data Transfer Object for AdPlacement
 */
export interface AdPlacementDTO {
  id: string
  pageId: string
  voucherId: string
  providerId: string
  position: number
  size: AdSize
  imageUrl: string | null
  qrCodePayload: string
  shortCode: string
  metadata: Record<string, any> | null
  createdAt: Date | null
  updatedAt: Date | null
}

/**
 * VoucherBook list response structure
 * Includes pagination metadata
 */
export interface VoucherBookListResponseDTO {
  data: VoucherBookDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
    has_next: boolean
    has_prev: boolean
  }
}
