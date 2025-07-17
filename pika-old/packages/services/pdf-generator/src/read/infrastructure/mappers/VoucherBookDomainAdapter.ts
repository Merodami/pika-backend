import { VoucherBook } from '@pdf-read/domain/entities/VoucherBook.js'
import { type VoucherBookDomain, VoucherBookMapper } from '@pika/sdk'

/**
 * Adapter to bridge between local VoucherBook entity and SDK's snake_case conversion
 * Following the pattern established in Campaign and Provider services
 */
export class VoucherBookDomainAdapter {
  /**
   * Converts local VoucherBook domain entity to SDK-compatible DTO with snake_case fields
   */
  static toDTO(voucherBook: VoucherBook): any {
    // Convert to SDK domain format
    const sdkDomain = this.toSdkDomain(voucherBook)

    // Use SDK mapper to handle snake_case conversion
    return VoucherBookMapper.toDTO(sdkDomain)
  }

  /**
   * Converts local domain entity to SDK VoucherBookDomain format
   */
  private static toSdkDomain(voucherBook: VoucherBook): VoucherBookDomain {
    return {
      id: voucherBook.id,
      title: voucherBook.title,
      edition: voucherBook.edition,
      bookType: voucherBook.bookType,
      month: voucherBook.month,
      year: voucherBook.year,
      status: voucherBook.status,
      totalPages: voucherBook.totalPages,
      coverImageUrl: voucherBook.coverImageUrl,
      backImageUrl: voucherBook.backImageUrl,
      pdfUrl: voucherBook.pdfUrl,
      generatedAt: voucherBook.generatedAt,
      publishedAt: voucherBook.publishedAt,
      createdBy: voucherBook.createdBy,
      providerId: voucherBook.providerId,
      createdAt: voucherBook.createdAt,
      updatedAt: voucherBook.updatedAt,
    }
  }
}
