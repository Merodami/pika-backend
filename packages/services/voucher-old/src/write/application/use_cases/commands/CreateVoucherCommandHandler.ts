import { DEFAULT_LANGUAGE } from '@pika/environment'
import { type UserContext } from '@pika/http'
import { VoucherMapper } from '@pika/sdk'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { type VoucherCreateDTO } from '@voucher-write/domain/dtos/VoucherDTO.js'
import { Voucher } from '@voucher-write/domain/entities/Voucher.js'
import { type VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'

/**
 * Command handler for creating new vouchers
 * Implements business logic, validation, and orchestrates the process
 */
export class CreateVoucherCommandHandler {
  constructor(private readonly repository: VoucherWriteRepositoryPort) {}

  /**
   * Executes the create voucher command
   * Validates input, applies business rules, and persists the new voucher
   */
  async execute(dto: VoucherCreateDTO, context: UserContext): Promise<Voucher> {
    // Check if user has permission to create vouchers
    if (context.role !== UserRole.ADMIN && context.role !== UserRole.PROVIDER) {
      throw new NotAuthorizedError(
        'Only admins and service providers can create vouchers',
        {
          source: 'CreateVoucherCommandHandler.execute',
          metadata: { role: context.role },
        },
      )
    }

    try {
      // If user is a service provider, ensure they can only create vouchers for themselves
      if (context.role === UserRole.PROVIDER) {
        dto.providerId = context.userId
      }

      return await this.repository.createVoucher(dto)
    } catch (error) {
      throw ErrorFactory.fromError(error, 'Failed to create voucher', {
        source: 'CreateVoucherCommandHandler.execute',
        suggestion: 'Check voucher data and try again',
        metadata: {
          voucherTitle: VoucherMapper.getLocalizedValue(
            dto.title as any,
            DEFAULT_LANGUAGE,
          ),
          providerId: dto.providerId,
          categoryId: dto.categoryId,
        },
      })
    }
  }
}
