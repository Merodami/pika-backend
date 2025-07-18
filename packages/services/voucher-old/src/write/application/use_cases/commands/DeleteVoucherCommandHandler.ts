import { type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { type VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'

/**
 * Command handler for deleting vouchers
 * Implements business logic, validation, and orchestrates the process
 */
export class DeleteVoucherCommandHandler {
  constructor(private readonly repository: VoucherWriteRepositoryPort) {}

  /**
   * Executes the delete voucher command
   * Validates input, applies business rules, and handles the deletion
   */
  async execute(id: string, context: UserContext): Promise<void> {
    // Validate UUID format
    this.validateId(id)

    // Check if the voucher exists first
    const existingVoucher = await this.repository.findById(id)

    if (!existingVoucher) {
      throw ErrorFactory.resourceNotFound('Voucher', id, {
        source: 'DeleteVoucherCommandHandler.execute',
        suggestion: 'Check that the voucher ID exists',
      })
    }

    // Check permissions: admins can delete any voucher, providers can only delete their own
    if (context.role === UserRole.PROVIDER) {
      if (existingVoucher.toObject().providerId !== context.userId) {
        throw new NotAuthorizedError('You can only delete your own vouchers', {
          source: 'DeleteVoucherCommandHandler.execute',
          metadata: {
            voucherId: id,
            providerId: existingVoucher.toObject().providerId,
          },
        })
      }
    } else if (context.role !== UserRole.ADMIN) {
      throw new NotAuthorizedError(
        'Only admins and service providers can delete vouchers',
        {
          source: 'DeleteVoucherCommandHandler.execute',
          metadata: { role: context.role },
        },
      )
    }

    try {
      // Delegate to repository for actual deletion
      await this.repository.deleteVoucher(id)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError') {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'DeleteVoucherCommandHandler.execute',
          suggestion: 'Check that the voucher ID exists',
        })
      }

      // Specific error for dependency constraint violations
      if (
        error.name === 'ValidationError' &&
        error.context?.field === 'voucher'
      ) {
        throw error
      }

      // Handle database constraint errors that may come from the repository
      if (
        error.code === 'P2003' ||
        error.message?.includes('foreign key constraint') ||
        error.message?.includes('PUBLISHED') ||
        error.name === 'BusinessRuleViolationError'
      ) {
        throw ErrorFactory.validationError(
          {
            voucher: [
              'Cannot delete voucher in PUBLISHED state or with redemptions',
            ],
          },
          {
            source: 'DeleteVoucherCommandHandler.execute',
            suggestion: 'Only vouchers in NEW state can be deleted',
            httpStatus: 400, // Ensure status code is set to 400
          },
        )
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to delete voucher', {
        source: 'DeleteVoucherCommandHandler.execute',
        suggestion: 'Check voucher state and dependencies',
        metadata: { voucherId: id },
      })
    }
  }

  /**
   * Validates that a UUID is in the correct format
   */
  private validateId(id: string): void {
    if (!id) {
      throw ErrorFactory.validationError(
        { id: ['Voucher ID is required'] },
        { source: 'DeleteVoucherCommandHandler.validateId' },
      )
    }

    // Check UUID format using a regex
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    if (!uuidPattern.test(id)) {
      throw ErrorFactory.validationError(
        { id: ['Invalid voucher ID format'] },
        {
          source: 'DeleteVoucherCommandHandler.validateId',
          suggestion: 'Provide a valid UUID',
        },
      )
    }
  }
}
