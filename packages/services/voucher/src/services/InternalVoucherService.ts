import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import type { VoucherDomain, VoucherScanData, UserVoucherData } from '@pika/sdk'
import {
  ErrorFactory,
  logger,
  VoucherBusinessRules,
} from '@pika/shared'
import type { PaginatedResult, VoucherState, ParsedIncludes } from '@pika/types'
import { VoucherScanType, VoucherScanSource } from '@pika/types'

import type {
  IInternalVoucherRepository,
} from '../repositories/InternalVoucherRepository.js'
import type {
  IVoucherRepository,
} from '../repositories/VoucherRepository.js'
import type {
  VoucherSearchParams,
  UserVoucherSearchParams,
  VoucherValidationOptions,
  VoucherValidationResult,
  VoucherExistsOptions,
  VoucherExistsResult,
  RedemptionTrackingData,
  RedemptionTrackingResult,
  BatchProcessOperation,
  BatchProcessResult,
} from '../types/index.js'

// Re-export types that are part of the service's public API
export type {
  VoucherValidationOptions,
  VoucherValidationResult,
  VoucherExistsOptions,
  VoucherExistsResult,
  RedemptionTrackingData,
  RedemptionTrackingResult,
  BatchProcessOperation,
  BatchProcessResult,
} from '../types/index.js'

export interface IInternalVoucherService {
  // Voucher retrieval operations
  getVoucherById(id: string, parsedIncludes?: ParsedIncludes): Promise<VoucherDomain>
  getVouchersByIds(ids: string[], parsedIncludes?: ParsedIncludes): Promise<VoucherDomain[]>
  getUserVouchers(params: UserVoucherSearchParams): Promise<PaginatedResult<UserVoucherData>>
  
  // Validation operations
  validateVoucher(
    voucherId: string,
    options: VoucherValidationOptions,
  ): Promise<VoucherValidationResult>
  
  // Existence checks
  checkVoucherExists(
    options: VoucherExistsOptions,
  ): Promise<VoucherExistsResult>
  
  // State updates for internal use
  updateVoucherStateInternal(
    voucherId: string,
    state: VoucherState,
    reason?: string,
  ): Promise<VoucherDomain>
  
  // Scan tracking
  trackScan(
    data: VoucherScanData & { id: string },
  ): Promise<void>
  
  // Redemption tracking
  trackRedemption(
    data: RedemptionTrackingData,
  ): Promise<RedemptionTrackingResult>
  
  // Batch operations
  batchProcessVouchers(
    operation: BatchProcessOperation,
  ): Promise<BatchProcessResult>
  
  // Internal queries
  getVouchersByBusinessInternal(
    businessId: string,
    filters?: Partial<VoucherSearchParams>,
  ): Promise<PaginatedResult<VoucherDomain>>
  
  getVouchersByCategoryInternal(
    categoryId: string,
    filters?: Partial<VoucherSearchParams>,
  ): Promise<PaginatedResult<VoucherDomain>>
  
  // Cleanup operations
  cleanupExpiredVouchers(): Promise<number>
  cleanupOrphanedCustomerVouchers(): Promise<number>
}

export class InternalVoucherService implements IInternalVoucherService {
  constructor(
    private readonly internalRepository: IInternalVoucherRepository,
    private readonly publicRepository: IVoucherRepository, // For methods that need full repository access
    private readonly cache: ICacheService,
  ) {}

  async getVoucherById(id: string, parsedIncludes?: ParsedIncludes): Promise<VoucherDomain> {
    try {
      const vouchers = await this.internalRepository.findByIds([id], parsedIncludes)
      
      if (vouchers.length === 0) {
        throw ErrorFactory.resourceNotFound('Voucher', id)
      }
      
      return vouchers[0]
    } catch (error) {
      logger.error('Failed to get voucher by id', { error, id })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVouchersByIds(ids: string[], parsedIncludes?: ParsedIncludes): Promise<VoucherDomain[]> {
    try {
      return await this.internalRepository.findByIds(ids, parsedIncludes)
    } catch (error) {
      logger.error('Failed to get vouchers by ids', { error, ids })
      throw ErrorFactory.fromError(error)
    }
  }

  async getUserVouchers(params: UserVoucherSearchParams): Promise<PaginatedResult<UserVoucherData>> {
    try {
      // Get customer vouchers from repository
      const customerVouchers = await this.internalRepository.getUserVouchers(
        params.userId,
        params.status
      )

      // Apply pagination
      const startIndex = ((params.page || 1) - 1) * (params.limit || PAGINATION_DEFAULT_LIMIT)
      const endIndex = startIndex + (params.limit || PAGINATION_DEFAULT_LIMIT)
      const paginatedData = customerVouchers.slice(startIndex, endIndex)

      // Convert CustomerVoucherDomain to UserVoucherData
      const userVoucherData: UserVoucherData[] = paginatedData.map((cv) => ({
        voucher: cv.voucher!,
        claimedAt: cv.claimedAt,
        status: cv.status,
        redeemedAt: cv.redeemedAt || undefined,
      }))

      return {
        data: userVoucherData,
        pagination: {
          page: params.page || 1,
          limit: params.limit || PAGINATION_DEFAULT_LIMIT,
          total: customerVouchers.length,
          totalPages: Math.ceil(customerVouchers.length / (params.limit || PAGINATION_DEFAULT_LIMIT)),
          hasNext: endIndex < customerVouchers.length,
          hasPrev: (params.page || 1) > 1,
        },
      }
    } catch (error) {
      logger.error('Failed to get user vouchers', { error, params })
      throw ErrorFactory.fromError(error)
    }
  }

  async validateVoucher(
    voucherId: string,
    options: VoucherValidationOptions,
  ): Promise<VoucherValidationResult> {
    try {
      // Use publicRepository for findById as it's not in internal repository
      const voucher = await this.publicRepository.findById(voucherId)
      
      if (!voucher) {
        return {
          isValid: false,
          reason: 'Voucher not found',
        }
      }

      // Check state if requested
      if (options.checkState) {
        if (voucher.state !== 'published') {
          return {
            isValid: false,
            reason: `Voucher is ${voucher.state}`,
            voucher,
          }
        }
      }

      // Check expiry if requested
      if (options.checkExpiry) {
        const now = new Date()
        
        if (voucher.validFrom && voucher.validFrom > now) {
          return {
            isValid: false,
            reason: 'Voucher not yet valid',
            voucher,
          }
        }
        
        if (voucher.expiresAt && voucher.expiresAt < now) {
          return {
            isValid: false,
            reason: 'Voucher has expired',
            voucher,
          }
        }
      }

      // Check redemption limit if requested
      if (options.checkRedemptionLimit) {
        if (
          voucher.maxRedemptions &&
          voucher.currentRedemptions >= voucher.maxRedemptions
        ) {
          return {
            isValid: false,
            reason: 'Maximum redemptions reached',
            voucher,
          }
        }

        // Check user-specific redemption limit if userId provided
        if (options.userId && voucher.maxRedemptionsPerUser) {
          // Use publicRepository for findCustomerVoucher
          const customerVoucher = await this.publicRepository.findCustomerVoucher(
            options.userId,
            voucherId,
          )
          
          if (
            customerVoucher &&
            customerVoucher.redemptionCode && voucher.maxRedemptionsPerUser === 1
          ) {
            return {
              isValid: false,
              reason: 'User redemption limit reached',
              voucher,
            }
          }
        }
      }

      return {
        isValid: true,
        voucher,
      }
    } catch (error) {
      logger.error('Failed to validate voucher', { error, voucherId, options })
      throw ErrorFactory.fromError(error)
    }
  }

  async checkVoucherExists(
    options: VoucherExistsOptions,
  ): Promise<VoucherExistsResult> {
    try {
      let voucher: VoucherDomain | null = null

      if (options.voucherId) {
        // Use publicRepository for findById
        voucher = await this.publicRepository.findById(options.voucherId)
      } else if (options.code) {
        // Use publicRepository for findByAnyCode
        voucher = await this.publicRepository.findByAnyCode(options.code)
      }

      return {
        exists: !!voucher,
        voucherId: voucher?.id,
      }
    } catch (error) {
      logger.error('Failed to check voucher existence', { error, options })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateVoucherStateInternal(
    voucherId: string,
    state: VoucherState,
    reason?: string,
  ): Promise<VoucherDomain> {
    try {
      // Use internalRepository for updateState
      const updatedVoucher = await this.internalRepository.updateState(voucherId, state)

      // Invalidate cache
      await this.invalidateCache(voucherId)

      logger.info('Internal voucher state updated', {
        voucherId,
        previousState: state, // We don't have the previous state here
        newState: state,
        reason,
      })

      return updatedVoucher
    } catch (error) {
      logger.error('Failed to update voucher state internally', {
        error,
        voucherId,
        state,
        reason,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async trackScan(
    data: VoucherScanData & { id: string },
  ): Promise<void> {
    try {
      // Track the scan
      await this.internalRepository.trackScan(data)
      
      // Increment scan count
      await this.internalRepository.incrementScanCount(data.voucherId)
      
      logger.info('Voucher scan tracked', {
        scanId: data.id,
        voucherId: data.voucherId,
        scanType: data.scanType,
        scanSource: data.scanSource,
      })
    } catch (error) {
      logger.error('Failed to track voucher scan', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async trackRedemption(
    data: RedemptionTrackingData,
  ): Promise<RedemptionTrackingResult> {
    try {
      const { voucherId, userId, code, metadata } = data

      // Check if voucher exists using internal repository
      const exists = await this.internalRepository.exists(voucherId)
      
      if (!exists) {
        throw ErrorFactory.resourceNotFound('Voucher', voucherId)
      }

      // Increment redemption count
      await this.internalRepository.incrementRedemptions(voucherId)

      // Track the redemption scan
      const scanId = `red-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      await this.internalRepository.trackScan({
        id: scanId,
        voucherId,
        userId,
        scanType: VoucherScanType.business,
        scanSource: VoucherScanSource.share,
        metadata,
      })

      // Get updated voucher for current redemption count
      const vouchers = await this.internalRepository.findByIds([voucherId])
      const updatedVoucher = vouchers[0]

      logger.info('Redemption tracked', {
        redemptionId: scanId,
        voucherId,
        userId,
        currentRedemptions: updatedVoucher?.currentRedemptions || 0,
      })

      return {
        redemptionId: scanId,
        success: true,
        currentRedemptions: updatedVoucher?.currentRedemptions || 0,
        maxRedemptions: updatedVoucher?.maxRedemptions || undefined,
      }
    } catch (error) {
      logger.error('Failed to track redemption', { error, data })
      throw ErrorFactory.fromError(error)
    }
  }

  async batchProcessVouchers(
    operation: BatchProcessOperation,
  ): Promise<BatchProcessResult> {
    const startTime = Date.now()
    const results: Array<{ voucherId: string; success: boolean; error?: string }> = []
    let successCount = 0
    let failedCount = 0

    try {
      const { voucherIds, operation: op, context } = operation

      for (const voucherId of voucherIds) {
        try {
          switch (op) {
            case 'expire':
              await this.updateVoucherStateInternal(
                voucherId,
                'expired' as VoucherState,
                context?.reason || 'Batch expiration',
              )
              break

            case 'validate':
              const validation = await this.validateVoucher(voucherId, {
                checkState: true,
                checkExpiry: true,
                checkRedemptionLimit: true,
              })
              
              if (!validation.isValid) {
                throw new Error(validation.reason || 'Validation failed')
              }
              break

            case 'activate':
              await this.updateVoucherStateInternal(
                voucherId,
                'published' as VoucherState,
                context?.reason || 'Batch activation',
              )
              break

            default:
              throw new Error(`Unknown operation: ${op}`)
          }

          results.push({ voucherId, success: true })
          successCount++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.push({ voucherId, success: false, error: errorMessage })
          failedCount++
          
          logger.error('Failed to process voucher in batch', {
            voucherId,
            operation: op,
            error,
          })
        }
      }

      const duration = Date.now() - startTime
      
      logger.info('Batch voucher processing completed', {
        operation: op,
        totalCount: voucherIds.length,
        successCount,
        failedCount,
        duration,
      })

      return {
        processedCount: voucherIds.length,
        successCount,
        failedCount,
        results,
      }
    } catch (error) {
      logger.error('Failed to batch process vouchers', { error, operation })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVouchersByBusinessInternal(
    businessId: string,
    filters?: Partial<VoucherSearchParams>,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const params: InternalVoucherSearchParams = {
        businessId,
        state: filters?.state,
        includeExpired: filters?.includeExpired,
        includeDeleted: filters?.includeDeleted,
        page: filters?.page || 1,
        limit: filters?.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: filters?.sortBy || 'createdAt',
        sortOrder: filters?.sortOrder || 'desc',
      }

      return await this.internalRepository.findByBusinessId(businessId, params)
    } catch (error) {
      logger.error('Failed to get vouchers by business internally', {
        error,
        businessId,
        filters,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getVouchersByCategoryInternal(
    categoryId: string,
    filters?: Partial<VoucherSearchParams>,
  ): Promise<PaginatedResult<VoucherDomain>> {
    try {
      const params: InternalVoucherSearchParams = {
        categoryId,
        state: filters?.state,
        includeExpired: filters?.includeExpired,
        includeDeleted: filters?.includeDeleted,
        page: filters?.page || 1,
        limit: filters?.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: filters?.sortBy || 'createdAt',
        sortOrder: filters?.sortOrder || 'desc',
      }

      return await this.internalRepository.findByCategoryId(categoryId, params)
    } catch (error) {
      logger.error('Failed to get vouchers by category internally', {
        error,
        categoryId,
        filters,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async cleanupExpiredVouchers(): Promise<number> {
    try {
      // Find all vouchers that should be expired but aren't
      const now = new Date()
      const params: VoucherSearchParams = {
        state: ['published', 'claimed'] as VoucherState[],
        expiresAtEnd: now,
        page: 1,
        limit: 1000, // Process in batches
      }

      // Use publicRepository for findAll
      const result = await this.publicRepository.findAll(params)
      let expiredCount = 0

      for (const voucher of result.data) {
        if (voucher.expiresAt && voucher.expiresAt < now) {
          try {
            await this.updateVoucherStateInternal(
              voucher.id,
              'expired' as VoucherState,
              'Automatic expiration cleanup',
            )
            expiredCount++
          } catch (error) {
            logger.error('Failed to expire voucher in cleanup', {
              error,
              voucherId: voucher.id,
            })
          }
        }
      }

      logger.info('Expired vouchers cleanup completed', { expiredCount })

      return expiredCount
    } catch (error) {
      logger.error('Failed to cleanup expired vouchers', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  async cleanupOrphanedCustomerVouchers(): Promise<number> {
    try {
      // This would require a custom repository method to find customer vouchers
      // without corresponding vouchers (orphaned records)
      // For now, returning 0 as placeholder
      
      logger.info('Orphaned customer vouchers cleanup completed', {
        cleanedCount: 0,
      })

      return 0
    } catch (error) {
      logger.error('Failed to cleanup orphaned customer vouchers', { error })
      throw ErrorFactory.fromError(error)
    }
  }

  private async invalidateCache(voucherId?: string): Promise<void> {
    try {
      if (voucherId) {
        await this.cache.del(`service:voucher:${voucherId}`)
        await this.cache.del(`internal:voucher:${voucherId}`)
      }

      // Invalidate list caches
      await this.cache.delPattern?.('service:vouchers:*')
      await this.cache.delPattern?.('internal:vouchers:*')
    } catch (error) {
      logger.warn('Failed to invalidate cache', { error })
    }
  }
}