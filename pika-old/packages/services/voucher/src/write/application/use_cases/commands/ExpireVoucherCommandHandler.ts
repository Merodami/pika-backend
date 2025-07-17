import { type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { Voucher } from '@voucher-write/domain/entities/Voucher.js'
import { type VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'

/**
 * Command handler for expiring vouchers
 * Implements business logic for transitioning voucher to EXPIRED state
 */
export class ExpireVoucherCommandHandler {
  constructor(private readonly repository: VoucherWriteRepositoryPort) {}

  /**
   * Executes the expire voucher command
   * Forces voucher expiration regardless of date or redemption count
   */
  async execute(id: string, context: UserContext): Promise<Voucher> {
    // Check if the voucher exists first
    const existingVoucher = await this.repository.findById(id)

    if (!existingVoucher) {
      throw ErrorFactory.resourceNotFound('Voucher', id, {
        source: 'ExpireVoucherCommandHandler.execute',
        suggestion: 'Check that the voucher ID exists',
      })
    }

    // Check permissions: admins can expire any voucher, providers can only expire their own
    if (context.role === UserRole.PROVIDER) {
      if (existingVoucher.toObject().providerId !== context.userId) {
        throw new NotAuthorizedError('You can only expire your own vouchers', {
          source: 'ExpireVoucherCommandHandler.execute',
          metadata: {
            voucherId: id,
            providerId: existingVoucher.toObject().providerId,
          },
        })
      }
    } else if (context.role !== UserRole.ADMIN) {
      throw new NotAuthorizedError(
        'Only admins and service providers can expire vouchers',
        {
          source: 'ExpireVoucherCommandHandler.execute',
          metadata: { role: context.role },
        },
      )
    }
    try {
      return await this.repository.expireVoucher(id)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError') {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'ExpireVoucherCommandHandler.execute',
          suggestion: 'Check that the voucher ID exists',
        })
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to expire voucher', {
        source: 'ExpireVoucherCommandHandler.execute',
        suggestion: 'Check voucher ID and permissions',
        metadata: { voucherId: id },
      })
    }
  }
}
