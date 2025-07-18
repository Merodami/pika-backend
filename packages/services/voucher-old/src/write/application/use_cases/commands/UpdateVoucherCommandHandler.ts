import { type UserContext } from '@pika/http'
import { VoucherMapper } from '@pika/sdk'
import { ErrorFactory, NotAuthorizedError } from '@pika/shared'
import { UserRole } from '@pika/types-core'
import { type VoucherUpdateDTO } from '@voucher-write/domain/dtos/VoucherDTO.js'
import { Voucher } from '@voucher-write/domain/entities/Voucher.js'
import { type VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'

/**
 * Command handler for updating existing vouchers
 * Implements business logic, validation, and orchestrates the process
 */
export class UpdateVoucherCommandHandler {
  constructor(private readonly repository: VoucherWriteRepositoryPort) {}

  /**
   * Executes the update voucher command
   * Validates input, applies business rules, and persists the updated voucher
   */
  async execute(
    id: string,
    dto: VoucherUpdateDTO,
    context: UserContext,
  ): Promise<Voucher> {
    // Check if the voucher exists first
    const existingVoucher = await this.repository.findById(id)

    if (!existingVoucher) {
      throw ErrorFactory.resourceNotFound('Voucher', id, {
        source: 'UpdateVoucherCommandHandler.execute',
        suggestion: 'Check that the voucher ID exists',
      })
    }

    // Check permissions: admins can update any voucher, providers can only update their own
    if (context.role === UserRole.PROVIDER) {
      if (existingVoucher.toObject().providerId !== context.userId) {
        throw new NotAuthorizedError('You can only update your own vouchers', {
          source: 'UpdateVoucherCommandHandler.execute',
          metadata: {
            voucherId: id,
            providerId: existingVoucher.toObject().providerId,
          },
        })
      }
    } else if (context.role !== UserRole.ADMIN) {
      throw new NotAuthorizedError(
        'Only admins and service providers can update vouchers',
        {
          source: 'UpdateVoucherCommandHandler.execute',
          metadata: { role: context.role },
        },
      )
    }

    // Validate multilingual text fields using SDK mapper
    const validatedDto: VoucherUpdateDTO = { ...dto }

    if (dto.title) {
      validatedDto.title = VoucherMapper.ensureMultilingualText(dto.title)
    }

    if (dto.description) {
      validatedDto.description = VoucherMapper.ensureMultilingualText(
        dto.description,
      )
    }

    if (dto.terms) {
      validatedDto.terms = VoucherMapper.ensureMultilingualText(dto.terms)
    }

    try {
      // Call repository to handle the update
      return await this.repository.updateVoucher(id, validatedDto)
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError' || error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'UpdateVoucherCommandHandler.execute',
          suggestion: 'Check that the voucher ID exists',
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
      throw ErrorFactory.fromError(error, 'Failed to update voucher', {
        source: 'UpdateVoucherCommandHandler.execute',
        suggestion: 'Check voucher data and try again',
        metadata: {
          voucherId: id,
          updatedFields: Object.keys(dto),
        },
      })
    }
  }
}
