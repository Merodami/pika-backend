import { pdfCommon, pdfPublic } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import { VoucherBookMapper } from '../mappers/VoucherBookMapper.js'
import type { IVoucherBookService } from '../services/VoucherBookService.js'

/**
 * Handles public voucher book operations (read-only)
 */
export class VoucherBookController {
  constructor(private readonly voucherBookService: IVoucherBookService) {
    // Bind methods to preserve 'this' context
    this.getAllVoucherBooks = this.getAllVoucherBooks.bind(this)
    this.getVoucherBookById = this.getVoucherBookById.bind(this)
    this.downloadPDF = this.downloadPDF.bind(this)
  }

  /**
   * GET /voucher-books
   * Get all published voucher books with pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'public:voucher-books',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllVoucherBooks(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<pdfPublic.VoucherBookQueryParams>(req)

      // Map API query to service params (only published books for public)
      const params = {
        search: query.search,
        bookType: query.bookType,
        status: 'PUBLISHED', // Force published status for public API
        year: query.year,
        month: query.month,
        page: query.page || 1,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }

      const result = await this.voucherBookService.getAllVoucherBooks(params)

      // Use mapper for proper response transformation
      const response = VoucherBookMapper.toPublicListResponse(result)

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /voucher-books/:id
   * Get published voucher book by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'public:voucher-book',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherBookById(
    req: Request<pdfCommon.VoucherBookIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const voucherBook = await this.voucherBookService.getVoucherBookById(id)

      // Convert to public DTO using mapper
      const response = VoucherBookMapper.toPublicDTO(voucherBook)

      res.json(response)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /voucher-books/:id/download
   * Download PDF for published voucher book
   */
  async downloadPDF(
    req: Request<pdfCommon.VoucherBookIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params

      const voucherBook = await this.voucherBookService.getVoucherBookById(id)

      if (!voucherBook.pdfUrl) {
        return next(ErrorFactory.resourceNotFound('PDF', id))
      }

      // Use mapper for proper response transformation
      const response = VoucherBookMapper.toPDFDownloadResponse({
        url: voucherBook.pdfUrl,
        filename: `voucher-book-${voucherBook.id}.pdf`,
        contentType: 'application/pdf',
        generatedAt: voucherBook.pdfGeneratedAt || voucherBook.updatedAt,
      })

      res.json(response)
    } catch (error) {
      next(error)
    }
  }
}
