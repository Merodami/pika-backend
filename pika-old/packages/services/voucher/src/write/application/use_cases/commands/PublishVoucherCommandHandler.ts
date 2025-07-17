import { type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { Voucher } from '@voucher-write/domain/entities/Voucher.js'
import { type VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'

/**
 * Command handler for publishing vouchers
 * Implements business logic for transitioning voucher to PUBLISHED state
 */
export class PublishVoucherCommandHandler {
  constructor(private readonly repository: VoucherWriteRepositoryPort) {}

  /**
   * Executes the publish voucher command
   * Validates state transition and persists the change
   */
  async execute(id: string, context: UserContext): Promise<Voucher> {
    // Check if the voucher exists first
    const existingVoucher = await this.repository.findById(id)

    if (!existingVoucher) {
      throw ErrorFactory.resourceNotFound('Voucher', id, {
        source: 'PublishVoucherCommandHandler.execute',
        suggestion: 'Check that the voucher ID exists',
      })
    }

    // Check permissions: admins can publish any voucher, providers can only publish their own
    if (context.role === UserRole.PROVIDER) {
      if (existingVoucher.toObject().providerId !== context.userId) {
        throw new NotAuthorizedError('You can only publish your own vouchers', {
          source: 'PublishVoucherCommandHandler.execute',
          metadata: {
            voucherId: id,
            providerId: existingVoucher.toObject().providerId,
          },
        })
      }
    } else if (context.role !== UserRole.ADMIN) {
      throw new NotAuthorizedError(
        'Only admins and service providers can publish vouchers',
        {
          source: 'PublishVoucherCommandHandler.execute',
          metadata: { role: context.role },
        },
      )
    }
    try {
      return await this.repository.publishVoucher(id)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError') {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'PublishVoucherCommandHandler.execute',
          suggestion: 'Check that the voucher ID exists',
        })
      }

      if (error.name === 'BusinessRuleViolationError') {
        throw ErrorFactory.validationError(
          {
            state: ['Voucher cannot be published in current state'],
          },
          {
            source: 'PublishVoucherCommandHandler.execute',
            suggestion: 'Only vouchers in NEW state can be published',
            httpStatus: 400,
          },
        )
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to publish voucher', {
        source: 'PublishVoucherCommandHandler.execute',
        suggestion: 'Check voucher state and validity dates',
        metadata: { voucherId: id },
      })
    }
  }
}
