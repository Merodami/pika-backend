import { type PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { RequestContext, type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'

/**
 * Command handler for deleting voucher books
 * Implements business logic, validation, and orchestrates the process
 */
export class DeleteVoucherBookCommandHandler {
  constructor(private readonly repository: PDFWriteRepositoryPort) {}

  /**
   * Executes the delete voucher book command
   * Validates input, applies business rules, and handles the deletion
   */
  async execute(id: string, context: UserContext): Promise<void> {
    // Validate UUID format
    this.validateId(id)

    try {
      // Check if book exists and can be deleted
      const existingBook = await this.repository.findVoucherBookById(id)

      if (!existingBook) {
        throw ErrorFactory.resourceNotFound('VoucherBook', id, {
          source: 'DeleteVoucherBookCommandHandler.execute',
          suggestion: 'Check that the voucher book ID exists',
        })
      }

      // Check authorization - only book creator or admin can delete
      if (!RequestContext.isAdmin(context)) {
        const bookData = existingBook.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to delete this voucher book',
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

      // Only allow deletion of draft books
      if (!existingBook.isDraft()) {
        throw ErrorFactory.validationError(
          {
            status: [
              'Only draft books can be deleted. Published books should be archived instead.',
            ],
          },
          {
            source: 'DeleteVoucherBookCommandHandler.execute',
            metadata: {
              bookId: id,
              currentStatus: existingBook.status,
            },
          },
        )
      }

      // Delegate to repository for actual deletion
      await this.repository.deleteVoucherBook(id)
    } catch (error) {
      // If it's already one of our errors, just rethrow
      if (
        error.name === 'ResourceNotFoundError' ||
        error.name === 'ValidationError'
      ) {
        throw error
      }

      // Handle database constraint errors that may come from the repository
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint')
      ) {
        throw ErrorFactory.validationError(
          {
            book: [
              'Cannot delete voucher book with existing pages or placements',
            ],
          },
          {
            source: 'DeleteVoucherBookCommandHandler.execute',
            suggestion: 'Remove all pages and ad placements first',
            httpStatus: 400,
          },
        )
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to delete voucher book', {
        source: 'DeleteVoucherBookCommandHandler.execute',
        suggestion: 'Check if the voucher book has dependencies and try again',
        metadata: { bookId: id },
      })
    }
  }

  /**
   * Validates that a UUID is in the correct format
   */
  private validateId(id: string): void {
    if (!id) {
      throw ErrorFactory.validationError(
        { id: ['Voucher book ID is required'] },
        { source: 'DeleteVoucherBookCommandHandler.validateId' },
      )
    }

    // Check UUID format using a regex
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidPattern.test(id)) {
      throw ErrorFactory.validationError(
        { id: ['Invalid voucher book ID format'] },
        {
          source: 'DeleteVoucherBookCommandHandler.validateId',
          suggestion: 'Provide a valid UUID',
        },
      )
    }
  }
}
