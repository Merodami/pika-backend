import { ErrorFactory, logger } from '@pika/shared'
import {
  CustomerVoucherStatus,
  Prisma,
  type PrismaClient,
  VoucherDiscountType,
  VoucherScanSource,
  VoucherScanType,
  VoucherState,
} from '@prisma/client'
import {
  type VoucherCreateDTO,
  type VoucherStateUpdateDTO,
  type VoucherUpdateDTO,
} from '@voucher-write/domain/dtos/VoucherDTO.js'
import { Voucher } from '@voucher-write/domain/entities/Voucher.js'
import { type VoucherWriteRepositoryPort } from '@voucher-write/domain/port/voucher/VoucherWriteRepositoryPort.js'
import { generateVoucherCodes } from '@voucher-write/infrastructure/utils/codeGenerator.js'

/**
 * Prisma implementation of the VoucherWriteRepository
 * Handles persistence and data mapping to/from the database
 */
export class PrismaVoucherWriteRepository
  implements VoucherWriteRepositoryPort
{
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Creates a new voucher in the database
   */
  async createVoucher(dto: VoucherCreateDTO): Promise<Voucher> {
    try {
      // Prepare data for database using SDK mapper to ensure proper formatting
      logger.debug('Creating voucher with DTO:', { dto })

      const createData: Prisma.VoucherCreateInput = {
        provider: { connect: { id: dto.providerId } },
        category: { connect: { id: dto.categoryId } },
        state: VoucherState.NEW,
        title: dto.title as unknown as Prisma.InputJsonValue,
        description: dto.description as unknown as Prisma.InputJsonValue,
        terms: dto.terms as unknown as Prisma.InputJsonValue,
        discountType: dto.discountType as VoucherDiscountType,
        discountValue: dto.discountValue,
        currency: dto.currency || 'PYG',
        // NOTE: Location field is not supported by Prisma for PostGIS types
        // We'll need to handle it with raw SQL if needed
        imageUrl: dto.imageUrl,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        expiresAt: new Date(dto.expiresAt),
        maxRedemptions: dto.maxRedemptions || null,
        maxRedemptionsPerUser: dto.maxRedemptionsPerUser ?? 1,
        currentRedemptions: 0,
        metadata: (dto.metadata || {}) as Prisma.InputJsonValue,
      }

      logger.debug('Final createData for Prisma:', createData)

      // Create the voucher in a transaction with its codes
      const created = await this.prisma.$transaction(async (tx) => {
        // Create the voucher
        const voucher = await tx.voucher.create({
          data: createData,
        })

        // Generate voucher codes with the voucher ID
        const codes = await generateVoucherCodes(dto.codeConfig, voucher.id)

        // Create the voucher codes
        if (codes.length > 0) {
          await tx.voucherCode.createMany({
            data: codes.map((code) => ({
              voucherId: voucher.id,
              code: code.code,
              type: code.type,
              isActive: true,
              metadata: code.metadata || {},
            })),
          })
        }

        // Return the voucher with its codes
        return tx.voucher.findUnique({
          where: { id: voucher.id },
          include: { codes: true },
        })
      })

      if (!created) {
        throw new Error('Failed to create voucher')
      }

      logger.debug('Voucher created in database:', {
        id: created.id,
        providerId: created.providerId,
        state: created.state,
        codesCount: created.codes?.length,
      })

      return this.mapToDomainEntity(created)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Foreign key constraint failure
        if (error.code === 'P2003') {
          const field = (error.meta?.field_name as string) || 'reference'

          throw ErrorFactory.validationError(
            { [field]: [`Invalid ${field} provided`] },
            {
              source: 'PrismaVoucherWriteRepository.createVoucher',
            },
          )
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'create_voucher',
        'Failed to create voucher',
        error,
        {
          source: 'PrismaVoucherWriteRepository.createVoucher',
          metadata: {
            providerId: dto.providerId,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Updates an existing voucher in the database
   */
  async updateVoucher(id: string, dto: VoucherUpdateDTO): Promise<Voucher> {
    try {
      // Check if the voucher exists
      const exists = await this.prisma.voucher.count({ where: { id } })

      if (exists === 0) {
        logger.debug('Voucher not found for update:', id)
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'PrismaVoucherWriteRepository.updateVoucher',
          httpStatus: 404,
        })
      }

      const raw = await this.prisma.voucher.findUnique({
        where: { id },
        include: { codes: true },
      })

      if (!raw) {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'PrismaVoucherWriteRepository.updateVoucher',
          httpStatus: 404,
        })
      }

      // Build update data
      const updateData: Prisma.VoucherUpdateInput = {}

      // Update multilingual fields if provided
      if (dto.title) {
        updateData.title = dto.title as any
      }
      if (dto.description) {
        updateData.description = dto.description as any
      }
      if (dto.terms) {
        updateData.terms = dto.terms as any
      }

      // Update scalar fields if provided
      if (dto.discountType !== undefined) {
        updateData.discountType = dto.discountType as any
      }
      if (dto.discountValue !== undefined) {
        updateData.discountValue = dto.discountValue
      }
      if (dto.currency !== undefined) {
        updateData.currency = dto.currency
      }
      // NOTE: Location field is not supported by Prisma for PostGIS types
      // if (dto.location !== undefined) {
      //   (updateData as any).location = dto.location
      // }
      if (dto.imageUrl !== undefined) {
        updateData.imageUrl = dto.imageUrl
      }
      if (dto.validFrom !== undefined) {
        updateData.validFrom = dto.validFrom
      }
      if (dto.expiresAt !== undefined) {
        updateData.expiresAt = dto.expiresAt
      }
      if (dto.maxRedemptions !== undefined) {
        updateData.maxRedemptions = dto.maxRedemptions
      }
      if (dto.maxRedemptionsPerUser !== undefined) {
        updateData.maxRedemptionsPerUser = dto.maxRedemptionsPerUser
      }
      if (dto.metadata !== undefined) {
        updateData.metadata = dto.metadata as Prisma.InputJsonValue
      }

      // Update the voucher
      const updated = await this.prisma.voucher.update({
        where: { id },
        data: updateData,
        include: { codes: true },
      })

      return this.mapToDomainEntity(updated)
    } catch (error) {
      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Foreign key constraint failure
        if (error.code === 'P2003') {
          const field = (error.meta?.field_name as string) || 'reference'

          throw ErrorFactory.validationError(
            { [field]: [`Invalid ${field} provided`] },
            {
              source: 'PrismaVoucherWriteRepository.updateVoucher',
              httpStatus: 400,
            },
          )
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'update_voucher',
        'Failed to update voucher',
        error,
        {
          source: 'PrismaVoucherWriteRepository.updateVoucher',
          metadata: {
            voucherId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Publishes a voucher (changes state from NEW to PUBLISHED)
   */
  async publishVoucher(id: string): Promise<Voucher> {
    try {
      // Check if voucher exists and is in NEW state
      const voucher = await this.prisma.voucher.findUnique({
        where: { id },
        include: { codes: true },
      })

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'PrismaVoucherWriteRepository.publishVoucher',
        })
      }

      if (voucher.state !== VoucherState.NEW) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid voucher state',
          `Voucher is in ${voucher.state} state, must be NEW to publish`,
          {
            source: 'PrismaVoucherWriteRepository.publishVoucher',
            metadata: { currentState: voucher.state },
          },
        )
      }

      // Update state to PUBLISHED
      const updated = await this.prisma.voucher.update({
        where: { id },
        data: { state: VoucherState.PUBLISHED },
        include: { codes: true },
      })

      logger.info('Voucher published successfully', { id })

      return this.mapToDomainEntity(updated)
    } catch (error) {
      if (
        error.name === 'BusinessRuleViolationError' ||
        error.name === 'ResourceNotFoundError'
      ) {
        throw error
      }

      throw ErrorFactory.databaseError(
        'publish_voucher',
        'Failed to publish voucher',
        error,
        {
          source: 'PrismaVoucherWriteRepository.publishVoucher',
          metadata: { voucherId: id },
        },
      )
    }
  }

  /**
   * Expires a voucher (changes state to EXPIRED)
   */
  async expireVoucher(id: string): Promise<Voucher> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id },
        include: { codes: true },
      })

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'PrismaVoucherWriteRepository.expireVoucher',
        })
      }

      if (voucher.state === 'EXPIRED') {
        // Already expired, just return it
        return this.mapToDomainEntity(voucher)
      }

      // Update state to EXPIRED
      const updated = await this.prisma.voucher.update({
        where: { id },
        data: { state: 'EXPIRED' },
        include: { codes: true },
      })

      logger.info('Voucher expired successfully', { id })

      return this.mapToDomainEntity(updated)
    } catch (error) {
      if (error.name === 'ResourceNotFoundError') {
        throw error
      }

      throw ErrorFactory.databaseError(
        'expire_voucher',
        'Failed to expire voucher',
        error,
        {
          source: 'PrismaVoucherWriteRepository.expireVoucher',
          metadata: { voucherId: id },
        },
      )
    }
  }

  /**
   * Redeems a voucher
   */
  async redeemVoucher(
    id: string,
    userId: string,
    codeUsed: string,
  ): Promise<Voucher> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get voucher with lock to prevent concurrent redemptions
        const voucher = await tx.voucher.findUnique({
          where: { id },
          include: {
            codes: true,
            redemptions: {
              where: { userId },
            },
          },
        })

        if (!voucher) {
          throw ErrorFactory.resourceNotFound('Voucher', id, {
            source: 'PrismaVoucherWriteRepository.redeemVoucher',
          })
        }

        // Check if voucher is published
        if (voucher.state !== 'PUBLISHED') {
          throw ErrorFactory.businessRuleViolation(
            'Invalid voucher state',
            `Voucher is in ${voucher.state} state, must be PUBLISHED to redeem`,
            {
              source: 'PrismaVoucherWriteRepository.redeemVoucher',
              metadata: { currentState: voucher.state },
            },
          )
        }

        // Check if voucher is expired
        if (new Date() > voucher.expiresAt) {
          throw ErrorFactory.businessRuleViolation(
            'Voucher expired',
            'This voucher has expired and cannot be redeemed',
            {
              source: 'PrismaVoucherWriteRepository.redeemVoucher',
              metadata: { expiresAt: voucher.expiresAt },
            },
          )
        }

        // Check if user has already redeemed this voucher
        if (voucher.redemptions.length >= voucher.maxRedemptionsPerUser) {
          throw ErrorFactory.businessRuleViolation(
            'Redemption limit reached',
            `User has already redeemed this voucher ${voucher.redemptions.length} times`,
            {
              source: 'PrismaVoucherWriteRepository.redeemVoucher',
              metadata: {
                userRedemptions: voucher.redemptions.length,
                maxPerUser: voucher.maxRedemptionsPerUser,
              },
            },
          )
        }

        // Check if voucher has reached max redemptions
        if (
          voucher.maxRedemptions &&
          voucher.currentRedemptions >= voucher.maxRedemptions
        ) {
          throw ErrorFactory.businessRuleViolation(
            'Max redemptions reached',
            'This voucher has reached its maximum number of redemptions',
            {
              source: 'PrismaVoucherWriteRepository.redeemVoucher',
              metadata: {
                currentRedemptions: voucher.currentRedemptions,
                maxRedemptions: voucher.maxRedemptions,
              },
            },
          )
        }

        // Validate the code
        const validCode = voucher.codes.find(
          (c) => c.code === codeUsed && c.isActive,
        )

        if (!validCode) {
          throw ErrorFactory.validationError(
            { code: ['Invalid or inactive voucher code'] },
            {
              source: 'PrismaVoucherWriteRepository.redeemVoucher',
            },
          )
        }

        // Create redemption record
        await tx.voucherRedemption.create({
          data: {
            voucherId: id,
            userId,
            codeUsed,
            redeemedAt: new Date(),
          },
        })

        // Update voucher redemption count and state
        const newRedemptionCount = voucher.currentRedemptions + 1
        const shouldMarkAsRedeemed =
          voucher.maxRedemptions && newRedemptionCount >= voucher.maxRedemptions

        const updated = await tx.voucher.update({
          where: { id },
          data: {
            currentRedemptions: newRedemptionCount,
            state: shouldMarkAsRedeemed ? 'REDEEMED' : voucher.state,
          },
          include: { codes: true },
        })

        logger.info('Voucher redeemed successfully', {
          id,
          userId,
          codeUsed,
          newRedemptionCount,
          fullyRedeemed: shouldMarkAsRedeemed,
        })

        return this.mapToDomainEntity(updated)
      })
    } catch (error) {
      if (
        error.name === 'BusinessRuleViolationError' ||
        error.name === 'ResourceNotFoundError' ||
        error.name === 'ValidationError'
      ) {
        throw error
      }

      throw ErrorFactory.databaseError(
        'redeem_voucher',
        'Failed to redeem voucher',
        error,
        {
          source: 'PrismaVoucherWriteRepository.redeemVoucher',
          metadata: { voucherId: id, userId },
        },
      )
    }
  }

  /**
   * Deletes a voucher from the database
   */
  async deleteVoucher(id: string): Promise<void> {
    try {
      // Check if the voucher exists before attempting to delete
      const voucher = await this.prisma.voucher.findUnique({
        where: { id },
        include: {
          redemptions: true,
        },
      })

      if (!voucher) {
        logger.debug('Voucher not found for deletion:', id)
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'PrismaVoucherWriteRepository.deleteVoucher',
          httpStatus: 404,
        })
      }

      // Check if voucher has been redeemed
      if (voucher.redemptions.length > 0) {
        throw ErrorFactory.businessRuleViolation(
          'Voucher has redemptions',
          `Cannot delete voucher that has been redeemed ${voucher.redemptions.length} times`,
          {
            source: 'PrismaVoucherWriteRepository.deleteVoucher',
            suggestion: 'Consider expiring the voucher instead of deleting it',
            metadata: { redemptionCount: voucher.redemptions.length },
            httpStatus: 400,
          },
        )
      }

      // Delete the voucher and its codes (cascade delete)
      await this.prisma.voucher.delete({ where: { id } })

      logger.info('Voucher deleted successfully', { id })
    } catch (error) {
      if (
        error.name === 'BusinessRuleViolationError' ||
        error.name === 'ResourceNotFoundError'
      ) {
        throw error
      }

      // Handle known Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Record not found
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Voucher', id, {
            source: 'PrismaVoucherWriteRepository.deleteVoucher',
          })
        }
      }

      // Handle other database errors
      throw ErrorFactory.databaseError(
        'delete_voucher',
        'Failed to delete voucher',
        error,
        {
          source: 'PrismaVoucherWriteRepository.deleteVoucher',
          metadata: {
            voucherId: id,
            errorCode:
              error instanceof Prisma.PrismaClientKnownRequestError
                ? error.code
                : undefined,
          },
        },
      )
    }
  }

  /**
   * Maps a database record to a domain entity
   */
  private mapToDomainEntity(record: any): Voucher {
    logger.debug('Raw record from database:', {
      id: record.id,
      providerId: record.providerId,
      state: record.state,
      codesCount: record.codes?.length,
    })

    return Voucher.reconstitute(
      record.id,
      {
        providerId: record.providerId,
        categoryId: record.categoryId,
        state: record.state,
        title: record.title,
        description: record.description,
        terms: record.terms,
        discountType: record.discountType,
        discountValue: record.discountValue,
        currency: record.currency,
        imageUrl: record.imageUrl,
        validFrom: record.validFrom,
        expiresAt: record.expiresAt,
        maxRedemptions: record.maxRedemptions,
        maxRedemptionsPerUser: record.maxRedemptionsPerUser,
        currentRedemptions: record.currentRedemptions,
        metadata: record.metadata,
      },
      record.createdAt,
      record.updatedAt,
    )
  }

  /**
   * Increments the redemption count for a voucher
   */
  async incrementRedemptions(id: string): Promise<Voucher> {
    try {
      const updatedVoucher = await this.prisma.voucher.update({
        where: { id },
        data: {
          currentRedemptions: {
            increment: 1,
          },
        },
        include: {
          codes: true,
        },
      })

      return this.mapToDomainEntity(updatedVoucher)
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'PrismaVoucherWriteRepository.incrementRedemptions',
        })
      }

      throw ErrorFactory.databaseError(
        'increment_redemptions',
        'Failed to increment voucher redemptions',
        error,
        {
          source: 'PrismaVoucherWriteRepository.incrementRedemptions',
          metadata: { voucherId: id },
        },
      )
    }
  }

  /**
   * Finds a voucher by ID
   */
  async findById(id: string): Promise<Voucher | null> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id },
        include: { codes: true },
      })

      if (!voucher) {
        return null
      }

      return this.mapToDomainEntity(voucher)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'find_voucher_by_id',
        'Failed to find voucher by ID',
        error,
        {
          source: 'PrismaVoucherWriteRepository.findById',
          metadata: { voucherId: id },
        },
      )
    }
  }

  /**
   * Track a voucher scan for analytics
   */
  async trackScan(scan: {
    voucherId: string
    userId?: string
    scanType: 'CUSTOMER' | 'BUSINESS'
    scanSource: string
    location?: any
    deviceInfo: any
    scannedAt: Date
  }): Promise<string> {
    try {
      // Since location is an Unsupported type, we need to handle it separately
      let voucherScanId: string

      if (scan.location && scan.location.latitude && scan.location.longitude) {
        // Create with location using raw SQL
        const result = await this.prisma.$queryRaw<{ id: string }[]>`
          INSERT INTO marketplace.voucher_scans (
            id, voucher_id, user_id, scan_type, scan_source, 
            location, device_info, scanned_at, created_at
          ) VALUES (
            gen_random_uuid(), 
            ${scan.voucherId}::uuid, 
            ${scan.userId}::uuid, 
            ${scan.scanType}::"marketplace"."VoucherScanType", 
            ${scan.scanSource}::"marketplace"."VoucherScanSource",
            ST_MakePoint(${scan.location.longitude}, ${scan.location.latitude})::geography,
            ${scan.deviceInfo}::jsonb,
            ${scan.scannedAt},
            CURRENT_TIMESTAMP
          ) RETURNING id
        `

        voucherScanId = result[0].id
      } else {
        // Create without location using Prisma
        const voucherScan = await this.prisma.voucherScan.create({
          data: {
            voucherId: scan.voucherId,
            userId: scan.userId,
            scanType: scan.scanType as VoucherScanType,
            scanSource: scan.scanSource as VoucherScanSource,
            deviceInfo: scan.deviceInfo,
            scannedAt: scan.scannedAt,
          },
        })

        voucherScanId = voucherScan.id
      }

      logger.info('Tracked voucher scan', {
        scanId: voucherScanId,
        voucherId: scan.voucherId,
        scanType: scan.scanType,
      })

      return voucherScanId
    } catch (error) {
      throw ErrorFactory.databaseError(
        'track_scan',
        'Failed to track voucher scan',
        error,
        {
          source: 'PrismaVoucherWriteRepository.trackScan',
          metadata: { voucherId: scan.voucherId },
        },
      )
    }
  }

  /**
   * Increment scan count for a voucher
   */
  async incrementScanCount(voucherId: string): Promise<void> {
    try {
      await this.prisma.voucher.update({
        where: { id: voucherId },
        data: {
          scanCount: {
            increment: 1,
          },
        },
      })

      logger.info('Incremented scan count', { voucherId })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'increment_scan_count',
        'Failed to increment scan count',
        error,
        {
          source: 'PrismaVoucherWriteRepository.incrementScanCount',
          metadata: { voucherId },
        },
      )
    }
  }

  /**
   * Create a customer voucher claim
   */
  async createCustomerVoucher(claim: {
    id: string
    customerId: string
    voucherId: string
    claimedAt: Date
    status: string
    notificationPreferences?: any
  }): Promise<void> {
    try {
      await this.prisma.customerVoucher.create({
        data: {
          id: claim.id,
          customerId: claim.customerId,
          voucherId: claim.voucherId,
          claimedAt: claim.claimedAt,
          status: claim.status as CustomerVoucherStatus,
          notificationPreferences: claim.notificationPreferences,
        },
      })

      logger.info('Created customer voucher claim', {
        claimId: claim.id,
        customerId: claim.customerId,
        voucherId: claim.voucherId,
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'create_customer_voucher',
        'Failed to create customer voucher claim',
        error,
        {
          source: 'PrismaVoucherWriteRepository.createCustomerVoucher',
          metadata: {
            voucherId: claim.voucherId,
            customerId: claim.customerId,
          },
        },
      )
    }
  }

  /**
   * Get customer voucher claim
   */
  async getCustomerVoucher(
    customerId: string,
    voucherId: string,
  ): Promise<any | null> {
    try {
      const customerVoucher = await this.prisma.customerVoucher.findUnique({
        where: {
          customerId_voucherId: {
            customerId,
            voucherId,
          },
        },
      })

      return customerVoucher
    } catch (error) {
      throw ErrorFactory.databaseError(
        'get_customer_voucher',
        'Failed to get customer voucher',
        error,
        {
          source: 'PrismaVoucherWriteRepository.getCustomerVoucher',
          metadata: { customerId, voucherId },
        },
      )
    }
  }

  /**
   * Get customer voucher count
   */
  async getCustomerVoucherCount(customerId: string): Promise<number> {
    try {
      const count = await this.prisma.customerVoucher.count({
        where: {
          customerId,
        },
      })

      return count
    } catch (error) {
      throw ErrorFactory.databaseError(
        'get_customer_voucher_count',
        'Failed to get customer voucher count',
        error,
        {
          source: 'PrismaVoucherWriteRepository.getCustomerVoucherCount',
          metadata: { customerId },
        },
      )
    }
  }

  /**
   * Get voucher claim count
   */
  async getClaimCount(voucherId: string): Promise<number> {
    try {
      const count = await this.prisma.customerVoucher.count({
        where: {
          voucherId,
        },
      })

      return count
    } catch (error) {
      throw ErrorFactory.databaseError(
        'get_claim_count',
        'Failed to get claim count',
        error,
        {
          source: 'PrismaVoucherWriteRepository.getClaimCount',
          metadata: { voucherId },
        },
      )
    }
  }

  /**
   * Increment claim count for a voucher
   */
  async incrementClaimCount(voucherId: string): Promise<void> {
    try {
      await this.prisma.voucher.update({
        where: { id: voucherId },
        data: {
          claimCount: {
            increment: 1,
          },
        },
      })

      logger.info('Incremented claim count', { voucherId })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'increment_claim_count',
        'Failed to increment claim count',
        error,
        {
          source: 'PrismaVoucherWriteRepository.incrementClaimCount',
          metadata: { voucherId },
        },
      )
    }
  }

  /**
   * Find voucher by ID (alias for findById for compatibility)
   */
  async findVoucherById(id: string): Promise<Voucher | null> {
    return this.findById(id)
  }

  /**
   * Update voucher state after redemption
   * Called by the redemption service after successful redemption
   */
  async updateVoucherState(
    id: string,
    dto: VoucherStateUpdateDTO,
  ): Promise<Voucher> {
    try {
      logger.debug('Updating voucher state', {
        voucherId: id,
        newState: dto.state,
        redeemedBy: dto.redeemedBy,
      })

      // Update the voucher with new state and redemption details
      const updated = await this.prisma.voucher.update({
        where: { id },
        data: {
          state: dto.state as any,
          // Store redemption details in metadata if provided
          metadata: {
            ...(await this.getExistingMetadata(id)),
            ...(dto.redeemedAt && { redeemedAt: dto.redeemedAt }),
            ...(dto.redeemedBy && { redeemedBy: dto.redeemedBy }),
            ...(dto.location && { redemptionLocation: dto.location }),
            lastStateUpdate: new Date().toISOString(),
          },
          // Increment redemption count if state is REDEEMED
          ...(dto.state === 'REDEEMED' && {
            currentRedemptions: {
              increment: 1,
            },
          }),
        },
        include: { codes: true },
      })

      logger.info('Voucher state updated successfully', {
        voucherId: id,
        newState: dto.state,
        currentRedemptions: updated.currentRedemptions,
      })

      return this.mapToDomainEntity(updated)
    } catch (error) {
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound('Voucher', id, {
          source: 'PrismaVoucherWriteRepository.updateVoucherState',
        })
      }

      logger.error('Error updating voucher state', {
        error,
        voucherId: id,
        newState: dto.state,
      })

      throw ErrorFactory.fromError(error, 'Failed to update voucher state', {
        source: 'PrismaVoucherWriteRepository.updateVoucherState',
        metadata: { voucherId: id, newState: dto.state },
      })
    }
  }

  /**
   * Helper method to get existing metadata
   */
  private async getExistingMetadata(id: string): Promise<any> {
    try {
      const voucher = await this.prisma.voucher.findUnique({
        where: { id },
        select: { metadata: true },
      })

      return voucher?.metadata || {}
    } catch {
      return {}
    }
  }
}
