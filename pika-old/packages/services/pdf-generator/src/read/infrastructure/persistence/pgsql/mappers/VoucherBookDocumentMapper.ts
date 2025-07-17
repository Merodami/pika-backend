import {
  AdPlacement,
  type AdPlacementData,
  VoucherBook,
  type VoucherBookData,
  VoucherBookPage,
  type VoucherBookPageData,
} from '@pdf-read/domain/entities/VoucherBook.js'
import {
  AdSize,
  PageLayoutType,
  VoucherBookStatus,
  VoucherBookType,
} from '@prisma/client'

/**
 * Maps between Prisma VoucherBook documents and VoucherBook domain entities
 * Following the established pattern from Admin Service
 */

export interface VoucherBookDocument {
  id: string
  title: string
  edition: string | null
  bookType: VoucherBookType
  month: number | null
  year: number
  status: VoucherBookStatus
  totalPages: number
  coverImageUrl: string | null
  backImageUrl: string | null
  publishedAt: Date | null
  pdfUrl: string | null
  pdfGeneratedAt: Date | null
  metadata: any
  createdBy: string
  providerId: string | null
  createdAt: Date | null
  updatedAt: Date | null
  pages?: VoucherBookPageDocument[]
}

export interface VoucherBookPageDocument {
  id: string
  bookId: string
  pageNumber: number
  layoutType: PageLayoutType
  metadata: any
  createdAt: Date | null
  updatedAt: Date | null
  adPlacements?: AdPlacementDocument[]
}

export interface AdPlacementDocument {
  id: string
  pageId: string
  voucherId: string
  providerId: string
  position: number
  size: AdSize
  imageUrl: string | null
  qrCodePayload: string
  shortCode: string
  metadata: any
  createdAt: Date | null
  updatedAt: Date | null
}

export class VoucherBookDocumentMapper {
  /**
   * Maps a database document to a VoucherBook domain entity
   */
  static mapDocumentToDomain(document: VoucherBookDocument): VoucherBook {
    const data: VoucherBookData = {
      id: document.id,
      title: document.title,
      edition: document.edition,
      bookType: document.bookType,
      month: document.month,
      year: document.year,
      status: document.status,
      totalPages: document.totalPages,
      coverImageUrl: document.coverImageUrl,
      backImageUrl: document.backImageUrl,
      publishedAt: document.publishedAt ? new Date(document.publishedAt) : null,
      pdfUrl: document.pdfUrl,
      pdfGeneratedAt: document.pdfGeneratedAt
        ? new Date(document.pdfGeneratedAt)
        : null,
      metadata: this.ensureMetadata(document.metadata),
      createdBy: document.createdBy,
      providerId: document.providerId,
      createdAt: document.createdAt ? new Date(document.createdAt) : null,
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : null,
      pages: document.pages?.map((page) => this.mapPageDocumentToDomain(page)),
    }

    return VoucherBook.create(data)
  }

  /**
   * Maps a database page document to a VoucherBookPage domain entity
   */
  static mapPageDocumentToDomain(
    document: VoucherBookPageDocument,
  ): VoucherBookPage {
    const data: VoucherBookPageData = {
      id: document.id,
      bookId: document.bookId,
      pageNumber: document.pageNumber,
      layoutType: document.layoutType,
      metadata: this.ensureMetadata(document.metadata),
      createdAt: document.createdAt ? new Date(document.createdAt) : null,
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : null,
      adPlacements: document.adPlacements?.map((placement) =>
        this.mapPlacementDocumentToDomain(placement),
      ),
    }

    return VoucherBookPage.create(data)
  }

  /**
   * Maps a database ad placement document to an AdPlacement domain entity
   */
  static mapPlacementDocumentToDomain(
    document: AdPlacementDocument,
  ): AdPlacement {
    const data: AdPlacementData = {
      id: document.id,
      pageId: document.pageId,
      voucherId: document.voucherId,
      providerId: document.providerId,
      position: document.position,
      size: document.size,
      imageUrl: document.imageUrl,
      qrCodePayload: document.qrCodePayload,
      shortCode: document.shortCode,
      metadata: this.ensureMetadata(document.metadata),
      createdAt: document.createdAt ? new Date(document.createdAt) : null,
      updatedAt: document.updatedAt ? new Date(document.updatedAt) : null,
    }

    return AdPlacement.create(data)
  }

  /**
   * Ensures metadata is a proper object
   */
  private static ensureMetadata(value: any): Record<string, any> | null {
    if (!value || typeof value !== 'object') {
      return null
    }

    return value
  }
}
