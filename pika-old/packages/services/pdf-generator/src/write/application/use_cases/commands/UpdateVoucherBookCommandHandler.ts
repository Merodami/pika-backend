import { type VoucherBookUpdateDTO } from '@pdf-write/domain/dtos/VoucherBookDTO.js'
import { VoucherBook } from '@pdf-write/domain/entities/VoucherBook.js'
import { type PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { RequestContext, type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'

/**
 * Command handler for updating existing voucher books
 * Implements business logic, validation, and orchestrates the process
 */
export class UpdateVoucherBookCommandHandler {
  constructor(private readonly repository: PDFWriteRepositoryPort) {}

  /**
   * Executes the update voucher book command
   * Validates input, applies business rules, and persists the updated voucher book
   */
  async execute(
    id: string,
    dto: VoucherBookUpdateDTO,
    context: UserContext,
  ): Promise<VoucherBook> {
    try {
      // Check if book exists and can be edited
      const existingBook = await this.repository.findVoucherBookById(id)

      if (!existingBook) {
        throw ErrorFactory.resourceNotFound('VoucherBook', id, {
          source: 'UpdateVoucherBookCommandHandler.execute',
          suggestion: 'Check that the voucher book ID exists',
        })
      }

      // Check authorization - only book creator or admin can update
      if (!RequestContext.isAdmin(context)) {
        const bookData = existingBook.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to update this voucher book',
            {
              metadata: {
                userId: context.userId,
                bookId: id,
                createdBy: bookData.createdBy,
                providerId: bookData.providerId,
              },
            },
          )
        }
      }

      if (!existingBook.canBeEdited()) {
        throw ErrorFactory.validationError(
          { status: ['Only draft books can be updated'] },
          {
            source: 'UpdateVoucherBookCommandHandler.execute',
            metadata: {
              bookId: id,
              currentStatus: existingBook.status,
            },
          },
        )
      }

      // Call repository to handle the update
      return await this.repository.updateVoucherBook(id, dto)
    } catch (error) {
      // If it's already one of our errors, just rethrow
      if (
        error.name === 'ResourceNotFoundError' ||
        error.name === 'ValidationError'
      ) {
        throw error
      }

      // Handle specific known errors
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('VoucherBook', id, {
          source: 'UpdateVoucherBookCommandHandler.execute',
          suggestion: 'Check that the voucher book ID exists',
        })
      }

      if (
        error.name === 'ValidationError' ||
        error.name === 'ResourceConflictError'
      ) {
        // Ensure ValidationError has the proper HTTP status
        if (error.name === 'ValidationError' && !error.getHttpStatus) {
          error.httpStatus = 400
        }
        throw error
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to update voucher book', {
        source: 'UpdateVoucherBookCommandHandler.execute',
        suggestion: 'Check voucher book data and try again',
        metadata: {
          bookId: id,
          updatedFields: Object.keys(dto),
        },
      })
    }
  }
}
