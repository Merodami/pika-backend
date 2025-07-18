import { DEFAULT_LANGUAGE, REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, ICacheService } from '@pika/redis'
import { type VoucherDomain } from '@pika/sdk'
import {
  BusinessServiceClient,
  CommunicationServiceClient,
  ErrorFactory,
  FileStoragePort,
  isUuidV4,
  logger,
  UserServiceClient,
} from '@pika/shared'
import type { TranslationClient } from '@pika/translation'
import {
  type PaginatedResult,
  VoucherScanSource,
  VoucherScanType,
  VoucherState,
  VoucherType,
} from '@pika/types'
import { v4 as uuid } from 'uuid'

import type {
  IVoucherRepository,
  VoucherSearchParams,
} from '../repositories/VoucherRepository.js'
import type { IInternalVoucherService } from './InternalVoucherService.js'
import type {
  VoucherScanResult,
  VoucherClaimResult,
  VoucherRedeemResult,
  UserVoucherData,
  VoucherScanData,
} from '@pika/sdk'
import {
  generateVoucherCodes,
  generateSecureShortCode,
} from '@voucher/utils/codeGenerator.js'

export interface VoucherCreateData {
  businessId: string
  type: VoucherType
  title: string
  description: string
  termsAndConditions: string
  value?: number
  discount?: number
  maxRedemptions?: number
  validFrom?: Date
  validUntil?: Date
  metadata?: Record<string, any>
  qrCode?: string
}

export interface VoucherUpdateData {
  title?: string
  description?: string
  termsAndConditions?: string
  value?: number
  discount?: number
  maxRedemptions?: number
  validFrom?: Date
  validUntil?: Date
  metadata?: Record<string, any>
}

export interface VoucherClaimData {
  notificationPreferences?: {
    enableReminders: boolean
    reminderDaysBefore?: number
  }
}

export interface VoucherRedeemData {
  code: string
  location?: any
  businessId?: string
  locationId?: string
  metadata?: Record<string, any>
  userId?: string
}

export interface IVoucherService {
  getAllVouchers(
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  getVoucherById(id: string, parsedIncludes?: any): Promise<VoucherDomain>
  getVouchersByBusinessId(
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  getVouchersByUserId(
    userId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>>
  getUserVouchers(params: {
    userId: string
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResult<UserVoucherData>>
  getVouchersByIds(ids: string[]): Promise<VoucherDomain[]>
  createVoucher(data: VoucherCreateData): Promise<VoucherDomain>
  updateVoucher(id: string, data: VoucherUpdateData): Promise<VoucherDomain>
  deleteVoucher(id: string): Promise<void>
  publishVoucher(id: string): Promise<VoucherDomain>
  expireVoucher(id: string): Promise<VoucherDomain>
  claimVoucher(
    voucherId: string,
    userId: string,
    data?: VoucherClaimData,
  ): Promise<VoucherClaimResult>
  redeemVoucher(
    voucherId: string,
    data: VoucherRedeemData,
  ): Promise<VoucherRedeemResult>
  scanVoucher(
    voucherId: string,
    data: VoucherScanData,
  ): Promise<VoucherScanResult>
  updateVoucherState(id: string, state: VoucherState): Promise<VoucherDomain>
  uploadVoucherImage(voucherId: string, file: any): Promise<string>
  // Code-based voucher lookup methods (critical for QR scanning)
  getVoucherByQRCode(qrCode: string): Promise<VoucherDomain>
  getVoucherByShortCode(shortCode: string): Promise<VoucherDomain>
  getVoucherByStaticCode(staticCode: string): Promise<VoucherDomain>
  getVoucherByAnyCode(code: string): Promise<VoucherDomain>
}

export class VoucherService implements IVoucherService {
  constructor(
    private readonly repository: IVoucherRepository,
    private readonly cache: ICacheService,
    private readonly translationClient: TranslationClient,
    private readonly fileStorage?: FileStoragePort,
    private readonly internalVoucherService?: IInternalVoucherService,
    private readonly communicationClient?: CommunicationServiceClient,
    private readonly userServiceClient?: UserServiceClient,
    private readonly businessServiceClient?: BusinessServiceClient,
  ) {}

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:vouchers',
    keyGenerator: (params) => JSON.stringify(params),
  })
  async getAllVouchers(
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const result = await this.repository.findAll(params)

      return result
    } catch (error) {
      logger.error('Failed to get all vouchers', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:voucher',
    keyGenerator: (id, parsedIncludes) =>
      `${id}:${JSON.stringify(parsedIncludes || {})}`,
  })
  async getVoucherById(
    id: string,
    parsedIncludes?: any,
  ): Promise<VoucherDomain> {
    try {
      // Validate UUID format
      if (!isUuidV4(id)) {
        throw ErrorFactory.badRequest('Invalid voucher ID format')
      }

      const voucher = await this.repository.findById(id, parsedIncludes)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by id', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:vouchers:business',
    keyGenerator: (params) => `${params.businessId}:${JSON.stringify(params)}`,
  })
  async getVouchersByBusinessId(
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      // Validate UUID format
      if (!params.businessId) {
        throw ErrorFactory.badRequest('Business ID is required')
      }

      if (!isUuidV4(params.businessId)) {
        throw ErrorFactory.badRequest('Invalid business ID format')
      }

      const result = await this.repository.findByBusinessId(
        params.businessId,
        params,
      )

      return result
    } catch (error) {
      logger.error('Failed to get vouchers by business id', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:vouchers:user',
    keyGenerator: (userId, params) => `${userId}:${JSON.stringify(params)}`,
  })
  async getVouchersByUserId(
    userId: string,
    params: VoucherSearchParams,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      // Validate UUID format
      if (!isUuidV4(userId)) {
        throw ErrorFactory.badRequest('Invalid user ID format')
      }

      const result = await this.repository.findByUserId(userId, params)

      return result
    } catch (error) {
      logger.error('Failed to get vouchers by user id', { error, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  async getUserVouchers(params: {
    userId: string
    status?: string
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResult<UserVoucherData>> {
    try {
      // Validate UUID format
      if (!isUuidV4(params.userId)) {
        throw ErrorFactory.badRequest('Invalid user ID format')
      }

      // Convert status filter to array if provided
      const statusFilter =
        params.status && params.status !== 'all' ? [params.status] : undefined

      const searchParams = {
        userId: params.userId,
        state: statusFilter,
        page: params.page || 1,
        limit: params.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: params.sortBy || 'claimedAt',
        sortOrder: params.sortOrder || 'desc',
      }

      const result = await this.repository.findByUserId(
        params.userId,
        searchParams,
      )

      // Convert VoucherDomain results to UserVoucherData
      const userVoucherData: UserVoucherData[] = result.data.map((voucher) => ({
        voucher,
        claimedAt: voucher.createdAt, // This should come from userVoucher table in repository
        status: voucher.state as string,
        redeemedAt: undefined, // This should come from userVoucher table in repository
      }))

      return {
        data: userVoucherData,
        pagination: result.pagination,
      }
    } catch (error) {
      logger.error('Failed to get user vouchers', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVouchersByIds(ids: string[]): Promise<VoucherDomain[]> {
    try {
      // Validate all IDs are UUID format
      const invalidIds = ids.filter((id) => !isUuidV4(id))
      if (invalidIds.length > 0) {
        throw ErrorFactory.badRequest(
          `Invalid voucher ID format: ${invalidIds.join(', ')}`,
        )
      }

      const vouchers = await this.repository.findByIds(ids)

      return vouchers
    } catch (error) {
      logger.error('Failed to get vouchers by ids', { error, ids })
      throw ErrorFactory.fromError(error)
    }
  }

  async createVoucher(data: VoucherCreateData): Promise<VoucherDomain> {
    try {
      // Validate business exists
      if (this.businessServiceClient) {
        try {
          await this.businessServiceClient.getBusinessById(data.businessId)
        } catch (error) {
          throw ErrorFactory.resourceNotFound('Business', data.businessId)
        }
      }

      // Validate voucher type and required fields
      if (data.type === VoucherType.DISCOUNT && !data.discount) {
        throw ErrorFactory.businessRuleViolation(
          'Discount voucher requires discount percentage',
          'Discount field is required for discount vouchers',
        )
      }

      if (data.type === VoucherType.FIXED_VALUE && !data.value) {
        throw ErrorFactory.businessRuleViolation(
          'Fixed value voucher requires value',
          'Value field is required for fixed value vouchers',
        )
      }

      // Generate translation keys for voucher fields
      const titleKey = `voucher.title.${uuid()}`
      const descriptionKey = `voucher.description.${uuid()}`
      const termsAndConditionsKey = `voucher.termsAndConditions.${uuid()}`

      // Create all translations in a single batch for better performance
      await this.translationClient.setBulk(
        [
          {
            key: titleKey,
            value: data.title,
            context: 'Voucher title',
            service: 'voucher-service',
          },
          {
            key: descriptionKey,
            value: data.description,
            context: 'Voucher description',
            service: 'voucher-service',
          },
          {
            key: termsAndConditionsKey,
            value: data.termsAndConditions,
            context: 'Voucher terms and conditions',
            service: 'voucher-service',
          },
        ],
        DEFAULT_LANGUAGE,
      )

      // Generate QR code if not provided
      const qrCode = data.qrCode || (await this.generateQRCode())

      const voucher = await this.repository.create({
        businessId: data.businessId,
        type: data.type,
        titleKey,
        descriptionKey,
        termsAndConditionsKey,
        value: data.value,
        discount: data.discount,
        maxRedemptions: data.maxRedemptions,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        metadata: data.metadata,
        qrCode,
        state: VoucherState.DRAFT,
        redemptionsCount: 0,
      })

      // Invalidate cache
      await this.invalidateCache()

      return voucher
    } catch (error) {
      logger.error('Failed to create voucher', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateVoucher(
    id: string,
    data: VoucherUpdateData,
  ): Promise<VoucherDomain> {
    try {
      // Validate voucher exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state allows updates
      if (
        existing.state === VoucherState.EXPIRED ||
        existing.state === VoucherState.REDEEMED
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot update expired or redeemed voucher',
          'Voucher is in a final state',
        )
      }

      const updateData: any = {}
      const translationUpdates = []

      // Update translations for multilingual fields
      if (data.title) {
        translationUpdates.push({
          key: existing.titleKey,
          value: data.title,
          context: 'Voucher title',
          service: 'voucher-service',
        })
      }

      if (data.description) {
        translationUpdates.push({
          key: existing.descriptionKey,
          value: data.description,
          context: 'Voucher description',
          service: 'voucher-service',
        })
      }

      if (data.termsAndConditions) {
        translationUpdates.push({
          key: existing.termsAndConditionsKey,
          value: data.termsAndConditions,
          context: 'Voucher terms and conditions',
          service: 'voucher-service',
        })
      }

      // Update translations if any
      if (translationUpdates.length > 0) {
        await this.translationClient.setBulk(
          translationUpdates,
          DEFAULT_LANGUAGE,
        )
      }

      // Update other fields
      if (data.value !== undefined) updateData.value = data.value
      if (data.discount !== undefined) updateData.discount = data.discount
      if (data.maxRedemptions !== undefined)
        updateData.maxRedemptions = data.maxRedemptions
      if (data.validFrom !== undefined) updateData.validFrom = data.validFrom
      if (data.validUntil !== undefined) updateData.validUntil = data.validUntil
      if (data.metadata !== undefined) updateData.metadata = data.metadata

      const voucher = await this.repository.update(id, updateData)

      // Invalidate cache
      await this.invalidateCache(id)

      return voucher
    } catch (error) {
      logger.error('Failed to update voucher', { error, id, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteVoucher(id: string): Promise<void> {
    try {
      // Validate voucher exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state allows deletion
      if (existing.state === VoucherState.PUBLISHED) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot delete published voucher',
          'Published vouchers can only be expired',
        )
      }

      // Soft delete the voucher
      await this.repository.delete(id)

      // Note: We don't delete translations when soft deleting
      // This preserves history and allows for potential restoration
      // Translations will be cleaned up in a separate maintenance process

      // Invalidate cache
      await this.invalidateCache(id)

      logger.info('Voucher deleted successfully', { id })
    } catch (error) {
      logger.error('Failed to delete voucher', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async publishVoucher(id: string): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findById(id)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state transition using the same rules as legacy
      this.validateStateTransition(voucher.state, VoucherState.published)

      // Additional business rule validation for publishing (from legacy canBePublished)
      const now = new Date()
      if (voucher.validFrom && voucher.validFrom > now) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot publish voucher before its valid from date',
          `Voucher becomes valid at ${voucher.validFrom.toISOString()}`,
        )
      }

      if (voucher.validUntil && voucher.validUntil < now) {
        throw ErrorFactory.businessRuleViolation(
          'Cannot publish expired voucher',
          `Voucher expired at ${voucher.validUntil.toISOString()}`,
        )
      }

      const updatedVoucher = await this.repository.updateState(
        id,
        VoucherState.published,
      )

      // Invalidate cache
      await this.invalidateCache(id)

      return updatedVoucher
    } catch (error) {
      logger.error('Failed to publish voucher', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async expireVoucher(id: string): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findById(id)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state transition - legacy allows expiring from any state except already expired
      this.validateStateTransition(voucher.state, VoucherState.expired)

      const updatedVoucher = await this.repository.updateState(
        id,
        VoucherState.expired,
      )

      // Invalidate cache
      await this.invalidateCache(id)

      return updatedVoucher
    } catch (error) {
      logger.error('Failed to expire voucher', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async claimVoucher(
    voucherId: string,
    userId: string,
    data?: VoucherClaimData,
  ): Promise<VoucherClaimResult> {
    try {
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Validate state transition from PUBLISHED to CLAIMED
      this.validateStateTransition(voucher.state, VoucherState.claimed)

      // Check if voucher is still valid
      const now = new Date()
      if (voucher.validFrom && voucher.validFrom > now) {
        throw ErrorFactory.businessRuleViolation(
          'Voucher is not yet valid',
          'Voucher validity period has not started',
        )
      }

      if (voucher.validUntil && voucher.validUntil < now) {
        throw ErrorFactory.businessRuleViolation(
          'Voucher has expired',
          'Voucher validity period has ended',
        )
      }

      // Check if user already claimed this voucher using customer voucher table
      const existingClaim = await this.repository.findCustomerVoucher(
        userId,
        voucherId,
      )
      if (existingClaim) {
        throw ErrorFactory.businessRuleViolation(
          'Voucher already claimed',
          'User has already claimed this voucher',
        )
      }

      // Create customer voucher association (proper tracking)
      const customerVoucher = await this.repository.claimVoucher(
        voucherId,
        userId,
      )

      // Invalidate cache
      await this.invalidateCache(voucherId)

      // Create claim result using customer voucher data
      const claimResult: VoucherClaimResult = {
        claimId: customerVoucher.id,
        voucher: customerVoucher.voucher || voucher,
        claimedAt: customerVoucher.claimedAt,
        expiresAt: customerVoucher.expiresAt,
        walletPosition: 1, // This could be calculated based on user's voucher count
      }

      return claimResult
    } catch (error) {
      logger.error('Failed to claim voucher', { error, voucherId, userId })
      throw ErrorFactory.fromError(error)
    }
  }

  async redeemVoucher(
    voucherId: string,
    data: VoucherRedeemData,
  ): Promise<VoucherRedeemResult> {
    try {
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      const { userId } = data
      if (!userId) {
        throw ErrorFactory.badRequest('User ID is required for redemption')
      }

      // Check if user has claimed this voucher using customer voucher table
      const customerVoucher = await this.repository.findCustomerVoucher(
        userId,
        voucherId,
      )
      if (!customerVoucher) {
        throw ErrorFactory.businessRuleViolation(
          'Voucher not claimed',
          'User must claim voucher before redeeming',
        )
      }

      if (customerVoucher.status === 'redeemed') {
        throw ErrorFactory.businessRuleViolation(
          'Voucher already redeemed',
          'This voucher has already been redeemed',
        )
      }

      // Check max redemptions
      if (
        voucher.maxRedemptions &&
        voucher.redemptionsCount >= voucher.maxRedemptions
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Maximum redemptions reached',
          'This voucher has reached its redemption limit',
        )
      }

      // Redeem the voucher in customer voucher table
      const redeemedCustomerVoucher = await this.repository.redeemVoucher(
        voucherId,
        userId,
      )

      // Invalidate cache
      await this.invalidateCache(voucherId)

      // Create redemption result using customer voucher data
      const redeemResult: VoucherRedeemResult = {
        message: 'Voucher redeemed successfully',
        voucherId,
        redeemedAt: redeemedCustomerVoucher.redeemedAt || new Date(),
        discountApplied: voucher.discountValue || voucher.value || 0,
        voucher: redeemedCustomerVoucher.voucher || voucher,
      }

      return redeemResult
    } catch (error) {
      logger.error('Failed to redeem voucher', { error, voucherId, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async scanVoucher(
    voucherId: string,
    data: VoucherScanData,
  ): Promise<VoucherScanResult> {
    try {
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Verify business owns this voucher (if businessId provided)
      if (data.businessId && voucher.businessId !== data.businessId) {
        throw ErrorFactory.unauthorized('Business does not own this voucher')
      }

      let alreadyClaimed = false
      let canClaim = true

      // If userId provided, check if they have claimed it using customer voucher table
      if (data.userId) {
        const customerVoucher = await this.repository.findCustomerVoucher(
          data.userId,
          voucherId,
        )
        alreadyClaimed = !!customerVoucher

        // Check if voucher can still be claimed
        if (!alreadyClaimed) {
          canClaim =
            voucher.state === VoucherState.published &&
            (!voucher.validUntil || voucher.validUntil > new Date()) &&
            (!voucher.maxRedemptions ||
              voucher.redemptionsCount < voucher.maxRedemptions)
        }
      }

      // TODO: Implement nearby locations logic based on data.location
      const nearbyLocations = data.location ? [] : undefined

      // Create scan result
      const scanResult: VoucherScanResult = {
        voucher,
        scanId: uuid(),
        canClaim,
        alreadyClaimed,
        nearbyLocations,
      }

      // Track scan analytics in database
      const scanData: VoucherScanData = {
        voucherId,
        userId: data.userId || null,
        scanType: data.businessId
          ? VoucherScanType.business
          : VoucherScanType.customer,
        scanSource: data.scanSource || VoucherScanSource.camera,
        deviceInfo: data.deviceInfo || null,
        location: data.location || null,
        businessId: data.businessId || null,
        userAgent: data.userAgent || null,
        metadata: {
          ipAddress: undefined, // Would come from request in controller
          ...data.metadata,
        },
      }

      await this.repository.trackScan({
        ...scanData,
        id: scanResult.scanId,
      })

      // Increment voucher scan count for denormalized analytics
      await this.repository.incrementScanCount(voucherId)

      logger.info('Voucher scanned and tracked', {
        voucherId,
        userId: data.userId,
        businessId: data.businessId,
        source: data.scanSource,
        scanId: scanResult.scanId,
      })

      return scanResult
    } catch (error) {
      logger.error('Failed to scan voucher', { error, voucherId, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateVoucherState(
    id: string,
    state: VoucherState,
  ): Promise<VoucherDomain> {
    try {
      // Validate voucher exists
      const existing = await this.repository.findById(id)

      if (!existing) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }

      // Validate state transition
      this.validateStateTransition(existing.state, state)

      const voucher = await this.repository.updateState(id, state)

      // Invalidate cache
      await this.invalidateCache(id)

      return voucher
    } catch (error) {
      logger.error('Failed to update voucher state', { error, id, state })
      throw ErrorFactory.fromError(error)
    }
  }

  async uploadVoucherImage(voucherId: string, file: any): Promise<string> {
    try {
      if (!this.fileStorage) {
        throw ErrorFactory.serviceUnavailable(
          'File storage service is not available',
          {
            source: 'VoucherService.uploadVoucherImage',
          },
        )
      }

      // Validate voucher exists
      const voucher = await this.repository.findById(voucherId)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Upload file with voucher context for service-to-service call
      const uploadResult = await this.fileStorage.saveFile(
        file,
        `vouchers/${voucherId}`,
        {
          context: {
            voucherId,
            businessId: voucher.businessId,
          },
        },
      )

      // Update voucher with new image URL
      await this.repository.update(voucherId, { imageUrl: uploadResult.url })

      // Invalidate cache
      await this.invalidateCache(voucherId)

      return uploadResult.url
    } catch (error) {
      logger.error('Failed to upload voucher image', { error, voucherId })
      throw ErrorFactory.fromError(error)
    }
  }

  private async generateQRCode(voucherId?: string): Promise<string> {
    try {
      if (voucherId) {
        // Generate secure JWT-based QR code for specific voucher
        const codes = await generateVoucherCodes(
          {
            generateQR: true,
            generateShortCode: false,
            generateStaticCode: false,
          },
          voucherId,
        )

        const qrCode = codes.find((code) => code.type === 'QR')
        if (qrCode) {
          return qrCode.code
        }
      }

      // Fallback: generate a secure short code for display
      return await generateSecureShortCode({
        length: 12,
        includeDash: true,
        prefix: 'VCH-',
      })
    } catch (error) {
      logger.error('Failed to generate QR code', { error, voucherId })
      // Ultimate fallback
      return `VCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    }
  }

  async getVoucherByQRCode(qrCode: string): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findByQRCode(qrCode)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', `QR code: ${qrCode}`)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by QR code', { error, qrCode })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVoucherByShortCode(shortCode: string): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findByShortCode(shortCode)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound(
          'Voucher',
          `Short code: ${shortCode}`,
        )
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by short code', { error, shortCode })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVoucherByStaticCode(staticCode: string): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findByStaticCode(staticCode)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound(
          'Voucher',
          `Static code: ${staticCode}`,
        )
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by static code', {
        error,
        staticCode,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'service:voucher:code',
    keyGenerator: (code) => code,
  })
  async getVoucherByAnyCode(code: string): Promise<VoucherDomain> {
    try {
      const voucher = await this.repository.findByAnyCode(code)

      if (!voucher) {
        throw ErrorFactory.resourceNotFound('Voucher', `Code: ${code}`)
      }

      return voucher
    } catch (error) {
      logger.error('Failed to get voucher by any code', { error, code })
      throw ErrorFactory.fromError(error)
    }
  }

  /**
   * Validates voucher state transitions based on legacy voucher-old business rules
   * Allowed transitions from UpdateVoucherStateCommandHandler:
   * - DRAFT → PUBLISHED
   * - PUBLISHED → CLAIMED, EXPIRED
   * - CLAIMED → REDEEMED, EXPIRED
   * - REDEEMED → EXPIRED
   * - EXPIRED → (none)
   */
  private validateStateTransition(
    currentState: VoucherState,
    newState: VoucherState,
  ): void {
    // Map camelCase states to legacy validation logic
    const allowedTransitions: Record<VoucherState, VoucherState[]> = {
      [VoucherState.draft]: [VoucherState.published],
      [VoucherState.published]: [VoucherState.claimed, VoucherState.expired],
      [VoucherState.claimed]: [VoucherState.redeemed, VoucherState.expired],
      [VoucherState.redeemed]: [VoucherState.expired],
      [VoucherState.expired]: [],
      [VoucherState.suspended]: [VoucherState.published, VoucherState.expired], // Allow resume or expire
    }

    // No transition needed if states are the same
    if (currentState === newState) {
      return
    }

    const allowedForCurrentState = allowedTransitions[currentState] || []

    if (!allowedForCurrentState.includes(newState)) {
      throw ErrorFactory.businessRuleViolation(
        `Invalid state transition from ${currentState} to ${newState}`,
        `Allowed transitions from ${currentState}: ${allowedForCurrentState.join(', ')}`,
        {
          currentState,
          requestedState: newState,
          allowedStates: allowedForCurrentState,
          source: 'VoucherService.validateStateTransition',
        },
      )
    }
  }

  private async invalidateCache(voucherId?: string): Promise<void> {
    try {
      // Invalidate specific voucher cache if ID provided
      if (voucherId) {
        await this.cache.del(`service:voucher:${voucherId}`)
      }

      // Invalidate list caches
      await this.cache.delPattern?.('service:vouchers:*')
      await this.cache.delPattern?.('vouchers:*')
      await this.cache.delPattern?.('voucher:*')
    } catch (error) {
      logger.warn('Failed to invalidate cache', { error })
    }
  }
}
