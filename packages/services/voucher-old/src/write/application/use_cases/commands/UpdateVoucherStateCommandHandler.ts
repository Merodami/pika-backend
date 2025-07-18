import { ErrorFactory, logger } from '@pika/shared'
import type { ServiceContext } from '@pika/types-core'
import { type VoucherStateUpdateDTO } from '@voucher-write/domain/dtos/VoucherDTO.js'
import { Voucher } from '@voucher-write/domain/entities/Voucher.js'
import { type VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'
import { get } from 'lodash-es'

/**
 * Command handler for updating voucher state
 * This is used by the redemption service to transition voucher states
 * after successful redemption validation
 */
export class UpdateVoucherStateCommandHandler {
  constructor(private readonly repository: VoucherWriteRepositoryPort) {}

  /**
   * Executes the update voucher state command
   * Used by inter-service communication to update voucher after redemption
   */
  async execute(
    voucherId: string,
    dto: VoucherStateUpdateDTO,
    context: ServiceContext,
  ): Promise<Voucher> {
    logger.debug('Updating voucher state', {
      voucherId,
      newState: dto.state,
      source: context.serviceName,
    })

    try {
      // Get the current voucher
      const existingVoucher = await this.repository.findVoucherById(voucherId)

      if (!existingVoucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId, {
          source: 'UpdateVoucherStateCommandHandler.execute',
          suggestion: 'Check that the voucher ID exists',
        })
      }

      // Validate state transition
      this.validateStateTransition(existingVoucher, dto.state)

      // Update the voucher state
      const updatedVoucher = await this.repository.updateVoucherState(
        voucherId,
        dto,
      )

      logger.info('Voucher state updated successfully', {
        voucherId,
        oldState: existingVoucher.state,
        newState: dto.state,
        source: context.serviceName,
      })

      return updatedVoucher
    } catch (error) {
      // Handle specific known errors
      if (error.name === 'ResourceNotFoundError') {
        throw error // Pass through not found errors
      }

      if (error.name === 'ValidationError') {
        throw error // Pass through validation errors
      }

      // Enhance other errors with more context
      throw ErrorFactory.fromError(error, 'Failed to update voucher state', {
        source: 'UpdateVoucherStateCommandHandler.execute',
        suggestion: 'Check voucher ID and state transition validity',
        metadata: {
          voucherId,
          newState: dto.state,
          serviceName: context.serviceName,
        },
      })
    }
  }

  /**
   * Validates that the requested state transition is allowed
   */
  private validateStateTransition(voucher: Voucher, newState: string): void {
    const currentState = voucher.state

    // Define allowed state transitions
    const allowedTransitions: Record<string, string[]> = {
      DRAFT: ['PUBLISHED'],
      PUBLISHED: ['CLAIMED', 'EXPIRED'],
      CLAIMED: ['REDEEMED', 'EXPIRED'],
      REDEEMED: ['EXPIRED'], // Can only expire redeemed vouchers
      EXPIRED: [], // No transitions from expired state
    }

    // Use get from lodash to avoid object injection
    const allowed = get(allowedTransitions, currentState, []) as string[]

    if (!allowed.includes(newState)) {
      throw ErrorFactory.validationError(
        {
          state: [
            `Invalid state transition from ${currentState} to ${newState}`,
          ],
        },
        {
          source: 'UpdateVoucherStateCommandHandler.validateStateTransition',
          metadata: {
            currentState,
            requestedState: newState,
            allowedTransitions: allowed,
          },
        },
      )
    }
  }
}
