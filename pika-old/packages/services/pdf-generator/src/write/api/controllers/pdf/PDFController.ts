import {
  CreateVoucherBookCommandHandler,
  DeleteVoucherBookCommandHandler,
  GeneratePDFCommandHandler,
  UpdateVoucherBookCommandHandler,
  UpdateVoucherBookStatusCommandHandler,
} from '@pdf-write/application/use_cases/commands/index.js'
import {
  type VoucherBookCreateDTO,
  type VoucherBookStatusUpdateDTO,
  type VoucherBookUpdateDTO,
} from '@pdf-write/domain/dtos/VoucherBookDTO.js'
import { PDFGenerationRateLimiter } from '@pdf-write/infrastructure/services/PDFRateLimiter.js'
import { schemas } from '@pika/api'
import { RequestContext } from '@pika/http'
import { VoucherBookDomain, VoucherBookMapper } from '@pika/sdk'
import {
  ErrorFactory,
  ErrorSeverity,
  FileStoragePort,
  logger,
} from '@pika/shared'
import { type FastifyReply, type FastifyRequest } from 'fastify'

/**
 * Controller for PDF Generator write operations
 * Handles HTTP requests, delegates to command handlers, and handles responses
 */
export class PDFController {
  constructor(
    private readonly createHandler: CreateVoucherBookCommandHandler,
    private readonly updateHandler: UpdateVoucherBookCommandHandler,
    private readonly updateStatusHandler: UpdateVoucherBookStatusCommandHandler,
    private readonly deleteHandler: DeleteVoucherBookCommandHandler,
    private readonly generatePDFHandler: GeneratePDFCommandHandler,
    private readonly fileStorage: FileStoragePort,
    private readonly rateLimiter: PDFGenerationRateLimiter,
  ) {}

  /**
   * Create a new voucher book
   * POST /pdf/books
   */
  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const dto = request.body as VoucherBookCreateDTO

      const voucherBook = await this.createHandler.execute(dto, context)

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherBookDomain = voucherBook.toObject() as VoucherBookDomain
      const responseDTO = VoucherBookMapper.toDTO(voucherBookDomain)

      reply.code(201).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error creating voucher book:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to create voucher book', {
        source: 'PDFController.create',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          requestBody:
            typeof request.body === 'object'
              ? Object.keys(request.body || {})
              : typeof request.body,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Update an existing voucher book
   * PATCH /pdf/books/{book_id}
   */
  async update(
    request: FastifyRequest<{
      Params: schemas.VoucherBookId
    }>,
    reply: FastifyReply,
  ) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const { book_id } = request.params

      const dto = request.body as VoucherBookUpdateDTO

      // Validate that the request contains at least one field to update
      if (Object.keys(dto).length === 0) {
        throw ErrorFactory.validationError(
          { _: ['No update fields provided'] },
          {
            source: 'PDFController.update',
            suggestion: 'Provide at least one field to update',
          },
        )
      }

      // Execute the command and return the result
      const voucherBook = await this.updateHandler.execute(
        book_id,
        dto,
        context,
      )

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherBookDomain = voucherBook.toObject() as VoucherBookDomain
      const responseDTO = VoucherBookMapper.toDTO(voucherBookDomain)

      // Send response in the API schema format (snake_case)
      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error updating voucher book:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        const notFound = ErrorFactory.resourceNotFound(
          'VoucherBook',
          request.params.book_id,
          {
            source: 'PDFController.update',
            httpStatus: 404,
            suggestion: 'Check that the voucher book ID exists',
          },
        )

        throw notFound
      }

      if (error.name === 'ResourceConflictError') {
        throw error // Pass through conflict errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to update voucher book', {
        source: 'PDFController.update',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: {
          bookId: request.params.book_id,
          requestBody:
            typeof request.body === 'object'
              ? Object.keys(request.body || {})
              : typeof request.body,
        },
        suggestion: 'Please check your input and try again',
      })
    }
  }

  /**
   * Update voucher book status
   * PATCH /pdf/books/{book_id}/status
   */
  async updateStatus(
    request: FastifyRequest<{
      Params: schemas.VoucherBookId
    }>,
    reply: FastifyReply,
  ) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const { book_id } = request.params
      const dto = request.body as VoucherBookStatusUpdateDTO

      // Execute the command and return the result
      const voucherBook = await this.updateStatusHandler.execute(
        book_id,
        dto,
        context,
      )

      // Map domain entity to DTO format using SDK mapper with proper typing
      const voucherBookDomain = voucherBook.toObject() as VoucherBookDomain
      const responseDTO = VoucherBookMapper.toDTO(voucherBookDomain)

      reply.code(200).send(responseDTO)
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error updating voucher book status:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        const notFound = ErrorFactory.resourceNotFound(
          'VoucherBook',
          request.params.book_id,
          {
            source: 'PDFController.updateStatus',
            httpStatus: 404,
            suggestion: 'Check that the voucher book ID exists',
          },
        )

        throw notFound
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(
        error,
        'Failed to update voucher book status',
        {
          source: 'PDFController.updateStatus',
          severity: ErrorSeverity.ERROR,
          correlationId: request.id,
          metadata: {
            bookId: request.params.book_id,
            requestBody:
              typeof request.body === 'object'
                ? Object.keys(request.body || {})
                : typeof request.body,
          },
          suggestion: 'Please check your input and try again',
        },
      )
    }
  }

  /**
   * Delete an existing voucher book
   * DELETE /pdf/books/{book_id}
   */
  async delete(
    request: FastifyRequest<{
      Params: schemas.VoucherBookId
    }>,
    reply: FastifyReply,
  ) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const { book_id } = request.params

      // Execute the command
      await this.deleteHandler.execute(book_id, context)

      // Return success with no content
      reply.code(204).send()
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error deleting voucher book:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        const notFound = ErrorFactory.resourceNotFound(
          'VoucherBook',
          request.params.book_id,
          {
            source: 'PDFController.delete',
            httpStatus: 404,
            suggestion: 'Check that the voucher book ID exists',
          },
        )

        throw notFound
      }

      // Special handling for constraint violations
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint') ||
        error.name === 'BusinessRuleViolationError'
      ) {
        throw ErrorFactory.validationError(
          {
            book: [
              'Cannot delete voucher book with existing pages or placements',
            ],
          },
          {
            source: 'PDFController.delete',
            httpStatus: 400,
            suggestion: 'Remove all pages and ad placements first',
            metadata: { bookId: request.params.book_id },
          },
        )
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to delete voucher book', {
        source: 'PDFController.delete',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { bookId: request.params.book_id },
        suggestion: 'Check if the voucher book has dependencies and try again',
      })
    }
  }

  /**
   * Upload cover image for an existing voucher book
   * POST /pdf/books/{book_id}/cover
   */
  async uploadCover(
    request: FastifyRequest<{
      Params: schemas.VoucherBookId
    }>,
    reply: FastifyReply,
  ) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const { book_id } = request.params

      // Get the cover image file from the request
      const data = await request.file()

      if (!data) {
        throw ErrorFactory.validationError(
          { cover: ['No file provided'] },
          {
            source: 'PDFController.uploadCover',
            suggestion: 'Please provide a cover image file to upload',
          },
        )
      }

      // Upload the cover image file
      try {
        const result = await this.fileStorage.saveFile(
          data as any,
          'voucher-book-covers',
        )

        logger.info('Voucher book cover uploaded successfully', {
          bookId: book_id,
          filename: data.filename,
          url: result.url,
          size: result.size,
        })

        // Update the voucher book with the new cover image URL
        const updatedBook = await this.updateHandler.execute(
          book_id,
          {
            coverImageUrl: result.url,
          },
          context,
        )

        // Map domain entity to DTO format using SDK mapper with proper typing
        const voucherBookDomain = updatedBook.toObject() as VoucherBookDomain
        const responseDTO = VoucherBookMapper.toDTO(voucherBookDomain)

        reply.code(200).send(responseDTO)
      } catch (uploadError) {
        logger.error('Failed to upload voucher book cover:', uploadError)
        throw ErrorFactory.fromError(
          uploadError,
          'Failed to upload voucher book cover',
          {
            source: 'PDFController.uploadCover',
            suggestion: 'Check file format and size, then try again',
            metadata: {
              bookId: book_id,
              filename: data.filename,
              mimetype: data.mimetype,
            },
          },
        )
      }
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error uploading voucher book cover:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(
        error,
        'Failed to upload voucher book cover',
        {
          source: 'PDFController.uploadCover',
          severity: ErrorSeverity.ERROR,
          correlationId: request.id,
          metadata: { bookId: request.params.book_id },
          suggestion: 'Please check your file and try again',
        },
      )
    }
  }

  /**
   * Generate PDF for a voucher book
   * POST /pdf/books/{book_id}/generate
   */
  async generatePDF(
    request: FastifyRequest<{
      Params: schemas.VoucherBookId
    }>,
    reply: FastifyReply,
  ) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const { book_id } = request.params

      logger.info('Generating PDF for voucher book', {
        bookId: book_id,
        userId: context.userId,
        role: context.role,
      })

      // Execute the generate PDF command
      const result = await this.generatePDFHandler.execute(
        {
          bookId: book_id,
          userId: context.userId,
        },
        context,
      )

      if (!result.success) {
        throw ErrorFactory.validationError(
          { pdf: [result.error || 'Failed to generate PDF'] },
          {
            source: 'PDFController.generatePDF',
            suggestion: 'Check that the book has valid pages and vouchers',
            metadata: { bookId: book_id },
          },
        )
      }

      // Return the result with PDF URL
      reply.code(200).send({
        success: true,
        pdf_url: result.pdfUrl,
        generated_at: result.generatedAt?.toISOString(),
      })
    } catch (error: any) {
      // Log detailed error for monitoring
      logger.error('Error generating PDF:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
        params: request.params,
      })

      // Handle specific error types
      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        const notFound = ErrorFactory.resourceNotFound(
          'VoucherBook',
          request.params.book_id,
          {
            source: 'PDFController.generatePDF',
            httpStatus: 404,
            suggestion: 'Check that the voucher book ID exists',
          },
        )

        throw notFound
      }

      // Handle unexpected errors with good context
      throw ErrorFactory.fromError(error, 'Failed to generate PDF', {
        source: 'PDFController.generatePDF',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        metadata: { bookId: request.params.book_id },
        suggestion: 'Please try again or contact support if the issue persists',
      })
    }
  }

  /**
   * Get PDF generation rate limit status for current user
   * GET /pdf/rate-limit
   */
  async getRateLimitStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Extract user context using standard helper
      const context = RequestContext.fromHeaders(request)

      const rateLimitResult = await this.rateLimiter.getRateLimitStatus(
        context.userId,
      )

      // Convert to API format
      reply.code(200).send({
        allowed: rateLimitResult.allowed,
        remaining: rateLimitResult.remaining,
        reset_time: rateLimitResult.resetTime.toISOString(),
        retry_after: rateLimitResult.retryAfter,
      })
    } catch (error: any) {
      logger.error('Error getting rate limit status:', {
        error: error.message,
        stack: error.stack,
        context: error.context,
      })

      if (error.name === 'ValidationError') {
        throw error
      }

      throw ErrorFactory.fromError(error, 'Failed to get rate limit status', {
        source: 'PDFController.getRateLimitStatus',
        severity: ErrorSeverity.ERROR,
        correlationId: request.id,
        suggestion: 'Please try again',
      })
    }
  }
}
