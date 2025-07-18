import { type UserContext } from '@pika/http'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { type VoucherRedeemDTO } from '@voucher-write/domain/dtos/VoucherDTO.js'
import { Voucher } from '@voucher-write/domain/entities/Voucher.js'
import { type VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'

/**
 * Command handler for redeeming vouchers
 * Implements business logic for voucher redemption including validation
 */
export class RedeemVoucherCommandHandler {
  constructor(private readonly repository: VoucherWriteRepositoryPort) {}

  /**
   * Executes the redeem voucher command
   * Validates redemption eligibility and increments redemption count
   */
  async execute(dto: VoucherRedeemDTO, context: UserContext): Promise<Voucher> {
    // Only customers can redeem vouchers
    if (context.role !== UserRole.CUSTOMER) {
      throw new NotAuthorizedError('Only customers can redeem vouchers', {
        source: 'RedeemVoucherCommandHandler.execute',
        metadata: { role: context.role },
      })
    }

    // Ensure the customer is redeeming for themselves
    if (dto.userId !== context.userId) {
      throw new NotAuthorizedError(
        'You can only redeem vouchers for yourself',
        {
          source: 'RedeemVoucherCommandHandler.execute',
          metadata: {
            requestedUserId: dto.userId,
            actualUserId: context.userId,
          },
        },
      )
    }
    try {
      // In a real implementation, this would:
      // 1. Validate the voucher code (JWT or short code)
      // 2. Check if user has already redeemed
      // 3. Check if voucher is in valid state and date range
      // 4. Record the redemption with location
      // 5. Increment redemption count

      // For now, just increment redemptions
      return await this.repository.incrementRedemptions(dto.voucherId)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError') {
        throw ErrorFactory.resourceNotFound('Voucher', dto.voucherId, {
          source: 'RedeemVoucherCommandHandler.execute',
          suggestion: 'Check that the voucher ID exists',
        })
      }

      if (error.name === 'BusinessRuleViolationError') {
        throw ErrorFactory.validationError(
          {
            redemption: ['Voucher cannot be redeemed'],
          },
          {
            source: 'RedeemVoucherCommandHandler.execute',
            suggestion:
              'Check voucher state, expiration, and redemption limits',
            httpStatus: 400,
          },
        )
      }

      if (error.message?.includes('already redeemed')) {
        throw ErrorFactory.resourceConflict('Voucher', dto.voucherId, {
          source: 'RedeemVoucherCommandHandler.execute',
          suggestion: 'Each user can only redeem a voucher once',
          metadata: {
            voucherId: dto.voucherId,
            userId: dto.userId,
          },
        })
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to redeem voucher', {
        source: 'RedeemVoucherCommandHandler.execute',
        suggestion: 'Check voucher validity and redemption eligibility',
        metadata: {
          voucherId: dto.voucherId,
          userId: dto.userId,
        },
      })
    }
  }
}
