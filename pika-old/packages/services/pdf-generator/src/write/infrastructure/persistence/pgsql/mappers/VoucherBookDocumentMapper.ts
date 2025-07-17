import { VoucherBook } from '@pdf-write/domain/entities/VoucherBook.js'
import { VoucherBookStatus, VoucherBookType } from '@prisma/client'

/**
 * Maps between Prisma VoucherBook documents and VoucherBook domain entities
 * Following the established pattern from Admin Service
 */

export interface VoucherBookWriteDocument {
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
  createdAt: Date
  updatedAt: Date
}

export class VoucherBookDocumentMapper {
  /**
   * Maps a database document to a VoucherBook domain entity
   */
  static mapDocumentToDomain(document: VoucherBookWriteDocument): VoucherBook {
    return VoucherBook.reconstitute({
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
      pdfUrl: document.pdfUrl,
      generatedAt: document.pdfGeneratedAt
        ? new Date(document.pdfGeneratedAt)
        : null,
      publishedAt: document.publishedAt ? new Date(document.publishedAt) : null,
      createdBy: document.createdBy,
      providerId: document.providerId,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt),
    })
  }

  /**
   * Maps a VoucherBook domain entity to database document format for creation
   */
  static mapDomainToCreateData(
    voucherBook: VoucherBook,
  ): Omit<VoucherBookWriteDocument, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      title: voucherBook.title,
      edition: voucherBook.edition,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      coverImageUrl: voucherBook.coverImageUrl,
      backImageUrl: voucherBook.backImageUrl,
      publishedAt: voucherBook.publishedAt,
      pdfUrl: voucherBook.pdfUrl,
      pdfGeneratedAt: voucherBook.generatedAt,
      metadata: null,
      createdBy: voucherBook.createdBy,
      providerId: voucherBook.providerId,
    }
  }

  /**
   * Maps a VoucherBook domain entity to database document format for updates
   */
  static mapDomainToUpdateData(
    voucherBook: VoucherBook,
  ): Partial<VoucherBookWriteDocument> {
    return {
      title: voucherBook.title,
      edition: voucherBook.edition,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      coverImageUrl: voucherBook.coverImageUrl,
      backImageUrl: voucherBook.backImageUrl,
      publishedAt: voucherBook.publishedAt,
      pdfUrl: voucherBook.pdfUrl,
      pdfGeneratedAt: voucherBook.generatedAt,
      updatedAt: voucherBook.updatedAt || new Date(),
    }
  }
}
