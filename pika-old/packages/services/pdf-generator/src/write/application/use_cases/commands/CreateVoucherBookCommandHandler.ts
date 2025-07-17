import { type VoucherBookCreateDTO } from '@pdf-write/domain/dtos/VoucherBookDTO.js'
import { VoucherBook } from '@pdf-write/domain/entities/VoucherBook.js'
import { type PDFWriteRepositoryPort } from '@pdf-write/domain/port/pdf/PDFWriteRepositoryPort.js'
import { RequestContext, type UserContext } from '@pika/http'
import { ErrorFactory, logger, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'

/**
 * Command handler for creating new voucher books
 * Implements business logic, validation, and orchestrates the process
 */
export class CreateVoucherBookCommandHandler {
  constructor(private readonly repository: PDFWriteRepositoryPort) {}

  /**
   * Executes the create voucher book command
   * Validates input, applies business rules, and persists the new voucher book
   */
  async execute(
    dto: VoucherBookCreateDTO,
    context: UserContext,
  ): Promise<VoucherBook> {
    const startTime = Date.now()

    // Validate user permissions - only admins and providers can create voucher books
    if (
      !RequestContext.isAdmin(context) &&
      !RequestContext.isProvider(context)
    ) {
      throw new NotAuthorizedError(
        'Only administrators and providers can create voucher books',
        {
          metadata: {
            userId: context.userId,
            role: context.role,
            requiredRoles: [UserRole.ADMIN, UserRole.PROVIDER],
          },
        },
      )
    }

    logger.info('Creating new voucher book', {
      operation: 'create_voucher_book',
      title: dto.title,
      bookType: dto.bookType,
      year: dto.year,
      month: dto.month,
      userId: context.userId,
      role: context.role,
    })

    try {
      // Add ownership information to the DTO
      const bookData = {
        ...dto,
        createdBy: context.userId,
        providerId: RequestContext.isProvider(context)
          ? context.userId
          : undefined,
      }

      const result = await this.repository.createVoucherBook(bookData)

      const duration = Date.now() - startTime

      logger.info('Voucher book created successfully', {
        operation: 'create_voucher_book',
        duration,
        voucherBookId: result.id,
        title: dto.title,
        status: 'success',
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('Failed to create voucher book', {
        operation: 'create_voucher_book',
        duration,
        title: dto.title,
        error: error.message,
        status: 'error',
      })
      throw ErrorFactory.fromError(error, 'Failed to create voucher book', {
        source: 'CreateVoucherBookCommandHandler.execute',
        suggestion: 'Check voucher book data and try again',
        metadata: {
          title: dto.title,
          year: dto.year,
          month: dto.month,
          bookType: dto.bookType,
        },
      })
    }
  }
}
