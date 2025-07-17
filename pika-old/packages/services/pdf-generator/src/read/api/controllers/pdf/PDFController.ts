import { adaptVoucherBookSearchQuery } from '@pdf-read/application/adapters/sortingAdapter.js'
import {
  GetAllVoucherBooksHandler,
  GetVoucherBookByIdHandler,
} from '@pdf-read/application/use_cases/queries/index.js'
import { VoucherBookDomainAdapter } from '@pdf-read/infrastructure/mappers/VoucherBookDomainAdapter.js'
import { schemas } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { ErrorFactory, ErrorSeverity } from '@pika/shared'
import type { FastifyRequest } from 'fastify'

// PDF Generator controller for managing voucher books

/**
 * Controller handling HTTP requests for PDF generator read operations
 * Implements proper caching for performance
 */
export class PDFController {
  constructor(
    private readonly getAllVoucherBooksHandler: GetAllVoucherBooksHandler,
    private readonly getVoucherBookByIdHandler: GetVoucherBookByIdHandler,
  ) {
    this.getAllVoucherBooks = this.getAllVoucherBooks.bind(this)
    this.getVoucherBookById = this.getVoucherBookById.bind(this)
  }

  /**
   * GET /pdf/books
   * Get all voucher books with filtering, pagination and sorting
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'voucher-books',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllVoucherBooks(
    request: FastifyRequest<{
      Querystring: schemas.VoucherBookSearchQuery
    }>,
  ) {
    try {
      const query = request.query as schemas.VoucherBookSearchQuery

      // Use the adapter to convert API query to domain model format
      // This properly handles type conversions for sort parameters
      const searchParams = adaptVoucherBookSearchQuery(query)

      const result = await this.getAllVoucherBooksHandler.execute(searchParams)

      // Convert domain models to API DTOs using adapter
      const dtoResult = {
        data: result.data.map((book) => VoucherBookDomainAdapter.toDTO(book)),
        pagination: result.pagination,
      }

      // Return the result directly as voucher books don't have multilingual content
      return dtoResult
    } catch (error) {
      // Transform the error using our new error system
      if (error.code === 'INVALID_QUERY_PARAMETERS') {
        throw ErrorFactory.validationError(
          {
            query: [`Invalid query parameters: ${error.message}`],
          },
          {
            correlationId: request.id,
            source: 'PDFController.getAllVoucherBooks',
            suggestion:
              'Check the API documentation for valid query parameters',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_all_voucher_books',
          'Failed to fetch voucher books from database',
          error,
          {
            correlationId: request.id,
            source: 'PDFController.getAllVoucherBooks',
            severity: ErrorSeverity.ERROR,
          },
        )
      }

      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * GET /pdf/books/:bookId
   * Get a specific voucher book by ID
   */
  @Cache({
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10),
    prefix: 'voucher-books',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherBookById(
    request: FastifyRequest<{
      Params: schemas.VoucherBookId
    }>,
  ) {
    try {
      const { book_id } = request.params

      const book = await this.getVoucherBookByIdHandler.execute({
        id: book_id,
      })

      if (!book) {
        throw ErrorFactory.resourceNotFound('VoucherBook', book_id, {
          correlationId: request.id,
          source: 'PDFController.getVoucherBookById',
          suggestion:
            'Check that the voucher book ID exists and is in the correct format',
          metadata: {
            requestParams: request.params,
          },
        })
      }

      // Convert to API DTO using adapter
      const dto = VoucherBookDomainAdapter.toDTO(book)

      // Return the DTO directly as voucher books don't have multilingual content
      return dto
    } catch (error) {
      // If it's already a BaseError, just rethrow it
      if (error.context && error.context.domain) {
        throw error
      }

      // Handle specific error cases
      if (error.message?.includes('not found')) {
        throw ErrorFactory.resourceNotFound(
          'VoucherBook',
          request.params.book_id,
          {
            correlationId: request.id,
            source: 'PDFController.getVoucherBookById',
          },
        )
      }

      // Handle database errors
      if (error.name?.includes('Prisma')) {
        throw ErrorFactory.databaseError(
          'get_voucher_book_by_id',
          'Failed to fetch voucher book from database',
          error,
          {
            correlationId: request.id,
            source: 'PDFController.getVoucherBookById',
            metadata: { bookId: request.params.book_id },
          },
        )
      }

      // For any other unexpected errors
      throw ErrorFactory.fromError(error)
    }
  }
}
