import { logger } from '@pika/shared'
import { randomUUID } from 'crypto'

import type { VoucherReadRepositoryPort } from '../../../../read/domain/port/voucher/VoucherReadRepositoryPort.js'
import type { VoucherWriteRepositoryPort } from '../../../domain/port/voucher/VoucherWriteRepositoryPort.js'

export interface ClaimVoucherDTO {
  voucherId: string
  customerId: string
  notificationPreferences?: {
    enableReminders: boolean
    reminderDaysBefore?: number
  }
}

export interface ClaimVoucherResult {
  claimId: string
  voucher: {
    id: string
    title: string
    description: string
    expirationDate: Date
    value?: number
    discountType?: string
  }
  claimedAt: Date
  expiresAt: Date
  walletPosition: number
}

/**
 * Command handler for claiming vouchers to customer wallet
 */
export class ClaimVoucherCommandHandler {
  constructor(
    private readonly voucherReadRepo: VoucherReadRepositoryPort,
    private readonly voucherWriteRepo: VoucherWriteRepositoryPort,
  ) {}

  async execute(dto: ClaimVoucherDTO): Promise<ClaimVoucherResult> {
    logger.debug('Processing voucher claim', {
      voucherId: dto.voucherId,
      customerId: dto.customerId,
    })

    // 1. Get voucher details
    const voucher = await this.voucherReadRepo.getVoucherById({
      id: dto.voucherId,
    })

    if (!voucher) {
      throw new Error('Voucher not found')
    }

    // 2. Validate voucher can be claimed
    if (voucher.state !== 'PUBLISHED') {
      throw new Error('Voucher is not available for claiming')
    }

    if (new Date() >= voucher.expiresAt) {
      throw new Error('Voucher has expired')
    }

    // 3. Check if already claimed by this customer
    const existingClaim = await this.voucherWriteRepo.getCustomerVoucher(
      dto.customerId,
      dto.voucherId,
    )

    if (existingClaim) {
      throw new Error('Voucher already claimed by this customer')
    }

    // 4. Check if voucher has claim limits
    if (voucher.maxRedemptionsPerUser && voucher.maxRedemptionsPerUser <= 1) {
      // Already checked above
    }

    if (voucher.maxRedemptions) {
      const currentClaims = await this.voucherWriteRepo.getClaimCount(
        dto.voucherId,
      )

      if (currentClaims >= voucher.maxRedemptions) {
        throw new Error('Voucher claim limit reached')
      }
    }

    // 5. Create the claim
    const claimId = randomUUID()
    const claimedAt = new Date()

    await this.voucherWriteRepo.createCustomerVoucher({
      id: claimId,
      customerId: dto.customerId,
      voucherId: dto.voucherId,
      claimedAt,
      status: 'CLAIMED',
      notificationPreferences: dto.notificationPreferences,
    })

    // 6. Increment claim counter
    await this.voucherWriteRepo.incrementClaimCount(dto.voucherId)

    // 7. Get wallet position (for UI ordering)
    const walletPosition = await this.voucherWriteRepo.getCustomerVoucherCount(
      dto.customerId,
    )

    // 8. Log analytics event
    logger.info('Voucher claimed successfully', {
      claimId,
      voucherId: dto.voucherId,
      customerId: dto.customerId,
      providerId: voucher.providerId,
    })

    return {
      claimId,
      voucher: {
        id: voucher.id,
        title: voucher.getLocalizedTitle('es') || JSON.stringify(voucher.title),
        description:
          voucher.getLocalizedDescription('es') ||
          JSON.stringify(voucher.description),
        expirationDate: voucher.expiresAt,
        value: voucher.discountValue,
        discountType: voucher.discountType,
      },
      claimedAt,
      expiresAt: voucher.expiresAt,
      walletPosition,
    }
  }
}
