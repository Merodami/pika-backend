import { type VoucherBookStatusUpdateDTO } from '@pdf-write/domain/dtos/VoucherBookDTO.js'
import { VoucherBook } from '@pdf-write/domain/entities/VoucherBook.js'
import { type PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { RequestContext, type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { VoucherBookStatus } from '@prisma/client'
import { get } from 'lodash-es'

/**
 * Command handler for updating voucher book status
 * Handles state transitions: DRAFT -> READY_FOR_PRINT -> PUBLISHED -> ARCHIVED
 */
export class UpdateVoucherBookStatusCommandHandler {
  constructor(private readonly repository: PDFWriteRepositoryPort) {}

  /**
   * Executes the update voucher book status command
   * Validates state transitions and applies business rules
   */
  async execute(
    id: string,
    dto: VoucherBookStatusUpdateDTO,
    context: UserContext,
  ): Promise<VoucherBook> {
    try {
      // Check if book exists
      const existingBook = await this.repository.findVoucherBookById(id)

      if (!existingBook) {
        throw ErrorFactory.resourceNotFound('VoucherBook', id, {
          source: 'UpdateVoucherBookStatusCommandHandler.execute',
          suggestion: 'Check that the voucher book ID exists',
        })
      }

      // Check authorization - only book creator or admin can update status
      if (!RequestContext.isAdmin(context)) {
        const bookData = existingBook.toObject()

        if (
          bookData.createdBy !== context.userId &&
          bookData.providerId !== context.userId
        ) {
          throw new NotAuthorizedError(
            'You do not have permission to update this voucher book status',
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

      // Validate state transitions
      this.validateStateTransition(existingBook, dto.status)

      // Special handling for publishing - requires PDF URL
      if (dto.status === VoucherBookStatus.PUBLISHED && !dto.pdfUrl) {
        throw ErrorFactory.validationError(
          { pdfUrl: ['PDF URL is required when publishing a book'] },
          {
            source: 'UpdateVoucherBookStatusCommandHandler.execute',
          },
        )
      }

      // Call repository to handle the status update
      return await this.repository.updateVoucherBookStatus(id, dto)
    } catch (error) {
      // If it's already one of our errors, just rethrow
      if (
        error.name === 'ResourceNotFoundError' ||
        error.name === 'ValidationError'
      ) {
        throw error
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(
        error,
        'Failed to update voucher book status',
        {
          source: 'UpdateVoucherBookStatusCommandHandler.execute',
          suggestion: 'Check voucher book status transition rules',
          metadata: {
            bookId: id,
            newStatus: dto.status,
          },
        },
      )
    }
  }

  /**
   * Validates that the requested state transition is allowed
   */
  private validateStateTransition(
    book: VoucherBook,
    newStatus: VoucherBookStatus,
  ): void {
    const currentStatus = book.status

    // Define allowed transitions
    const allowedTransitions: Record<VoucherBookStatus, VoucherBookStatus[]> = {
      [VoucherBookStatus.DRAFT]: [VoucherBookStatus.READY_FOR_PRINT],
      [VoucherBookStatus.READY_FOR_PRINT]: [
        VoucherBookStatus.PUBLISHED,
        VoucherBookStatus.DRAFT,
      ],
      [VoucherBookStatus.PUBLISHED]: [VoucherBookStatus.ARCHIVED],
      [VoucherBookStatus.ARCHIVED]: [], // No transitions from archived
    }

    const allowed = get(
      allowedTransitions,
      currentStatus,
      [],
    ) as VoucherBookStatus[]

    if (!allowed.includes(newStatus)) {
      throw ErrorFactory.validationError(
        {
          status: [
            `Invalid status transition from ${currentStatus} to ${newStatus}`,
          ],
        },
        {
          source:
            'UpdateVoucherBookStatusCommandHandler.validateStateTransition',
          metadata: {
            currentStatus,
            requestedStatus: newStatus,
            allowedTransitions: allowed,
          },
        },
      )
    }
  }
}
