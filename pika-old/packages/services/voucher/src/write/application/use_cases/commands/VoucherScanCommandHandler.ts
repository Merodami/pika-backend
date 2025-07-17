import { logger } from '@pika/shared'

import type { VoucherReadRepositoryPort } from '../../../../read/domain/port/voucher/VoucherReadRepositoryPort.js'
import type { VoucherWriteRepositoryPort } from '../../../domain/port/voucher/VoucherWriteRepositoryPort.js'

export interface VoucherScanDTO {
  voucherId: string
  userId?: string
  scanType: 'CUSTOMER' | 'BUSINESS'
  scanSource: 'CAMERA' | 'GALLERY' | 'LINK' | 'SHARE'
  location?: {
    latitude: number
    longitude: number
  }
  deviceInfo: {
    platform: string
    version: string
    model?: string
  }
}

export interface VoucherScanResult {
  scanId: string
  voucher: {
    id: string
    title: string
    description: string
    expirationDate: Date
    retailer: {
      id: string
      name: string
      logo?: string
    }
    terms?: string
    value?: number
    discountType?: string
  }
  canClaim: boolean
  alreadyClaimed: boolean
  nearbyLocations?: Array<{
    id: string
    name: string
    address: string
    distance?: number
  }>
}

/**
 * Command handler for tracking voucher scans (non-redemption)
 */
export class VoucherScanCommandHandler {
  constructor(
    private readonly voucherReadRepo: VoucherReadRepositoryPort,
    private readonly voucherWriteRepo: VoucherWriteRepositoryPort,
  ) {}

  async execute(dto: VoucherScanDTO): Promise<VoucherScanResult> {
    logger.debug('Processing voucher scan', {
      voucherId: dto.voucherId,
      userId: dto.userId,
      scanType: dto.scanType,
    })

    // 1. Get voucher details
    const voucher = await this.voucherReadRepo.getVoucherById({
      id: dto.voucherId,
    })

    if (!voucher) {
      throw new Error('Voucher not found')
    }

    // 2. Check if already claimed by this user
    const alreadyClaimed = false

    if (dto.userId) {
      // TODO: Check CustomerVoucher table
      // alreadyClaimed = await this.customerVoucherRepo.exists(dto.userId, dto.voucherId)
    }

    // 3. Track the scan for analytics
    const scanId = await this.voucherWriteRepo.trackScan({
      voucherId: dto.voucherId,
      userId: dto.userId,
      scanType: dto.scanType,
      scanSource: dto.scanSource,
      location: dto.location,
      deviceInfo: dto.deviceInfo,
      scannedAt: new Date(),
    })

    // 4. Increment scan counter on voucher
    await this.voucherWriteRepo.incrementScanCount(dto.voucherId)

    // 5. Get nearby locations if location provided
    let nearbyLocations

    if (dto.location) {
      // TODO: Fetch voucher location from repository and calculate distances
      // For now, return empty array
      nearbyLocations = []
    }

    // 6. Determine if user can claim
    const canClaim =
      !alreadyClaimed &&
      voucher.state === 'PUBLISHED' &&
      new Date() < voucher.expiresAt &&
      !!dto.userId

    return {
      scanId,
      voucher: {
        id: voucher.id,
        title: voucher.getLocalizedTitle('es') || JSON.stringify(voucher.title),
        description:
          voucher.getLocalizedDescription('es') ||
          JSON.stringify(voucher.description),
        expirationDate: voucher.expiresAt,
        retailer: {
          id: voucher.providerId,
          name: 'Retailer Name', // TODO: Load retailer info from provider service
          logo: undefined,
        },
        terms: voucher.getLocalizedTerms('es') || JSON.stringify(voucher.terms),
        value: voucher.discountValue,
        discountType: voucher.discountType,
      },
      canClaim,
      alreadyClaimed,
      nearbyLocations,
    }
  }
}
