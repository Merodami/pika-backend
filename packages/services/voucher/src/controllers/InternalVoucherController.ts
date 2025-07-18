import { voucherInternal, voucherCommon, shared } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { VoucherMapper } from '@pika/sdk'
import { ErrorFactory } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IVoucherService } from '../services/VoucherService.js'

/**
 * Handles internal voucher operations for service-to-service communication
 */
export class InternalVoucherController {
  constructor(private readonly voucherService: IVoucherService) {
    // Bind methods to preserve 'this' context
    this.getVouchersByIds = this.getVouchersByIds.bind(this)
    this.validateVoucher = this.validateVoucher.bind(this)
    this.updateVoucherState = this.updateVoucherState.bind(this)
    this.checkVoucherExists = this.checkVoucherExists.bind(this)
    this.getVouchersByBusiness = this.getVouchersByBusiness.bind(this)
    this.getVouchersByCategory = this.getVouchersByCategory.bind(this)
    this.getUserVouchers = this.getUserVouchers.bind(this)
    this.trackRedemption = this.trackRedemption.bind(this)
  }

  /**
   * POST /internal/vouchers/by-ids
   * Get multiple vouchers by IDs
   */
  async getVouchersByIds(
    req: Request<{}, {}, voucherInternal.GetVouchersByIdsRequest>,
    res: Response<voucherInternal.GetVouchersByIdsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherIds, include } = req.body

      const vouchers = await this.voucherService.getVouchersByIds(
        voucherIds,
        include,
      )
      const notFound = voucherIds.filter(
        (id) => !vouchers.find((v) => v.id === id),
      )

      res.json({
        vouchers: vouchers.map((voucher) => VoucherMapper.toDTO(voucher)),
        notFound,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/validate
   * Validate voucher availability and constraints
   */
  async validateVoucher(
    req: Request<{}, {}, voucherInternal.ValidateVoucherRequest>,
    res: Response<voucherInternal.ValidateVoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const {
        voucherId,
        userId,
        checkRedemptionLimit,
        checkExpiry,
        checkState,
      } = req.body

      const validation = await this.voucherService.validateVoucher(voucherId, {
        userId,
        checkRedemptionLimit,
        checkExpiry,
        checkState,
      })

      res.json({
        isValid: validation.isValid,
        reason: validation.reason,
        voucher: validation.voucher
          ? VoucherMapper.toDTO(validation.voucher)
          : undefined,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /internal/vouchers/:id/state
   * Internal voucher state update
   */
  async updateVoucherState(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherInternal.InternalUpdateVoucherStateRequest
    >,
    res: Response<voucherInternal.InternalUpdateVoucherStateResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const { state, reason, serviceId } = req.body

      // Get current voucher to check previous state
      const currentVoucher = await this.voucherService.getVoucherById(voucherId)
      const previousState = currentVoucher.state

      const updatedVoucher = await this.voucherService.updateVoucherState(
        voucherId,
        state,
        reason,
      )

      res.json({
        success: true,
        previousState,
        newState: updatedVoucher.state,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/exists
   * Check if voucher exists by ID or code
   */
  async checkVoucherExists(
    req: Request<{}, {}, voucherInternal.CheckVoucherExistsRequest>,
    res: Response<voucherInternal.CheckVoucherExistsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherId, code } = req.body

      const exists = await this.voucherService.checkVoucherExists({
        voucherId,
        code,
      })

      res.json({
        exists: exists.exists,
        voucherId: exists.voucherId,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/business
   * Get all vouchers for a business
   */
  async getVouchersByBusiness(
    req: Request<{}, {}, voucherInternal.GetVouchersByBusinessRequest>,
    res: Response<voucherInternal.GetVouchersByBusinessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { businessId, state, includeExpired, includeDeleted, page, limit } =
        req.body

      const params = {
        businessId,
        state,
        includeExpired,
        includeDeleted,
        page: page || 1,
        limit: limit || PAGINATION_DEFAULT_LIMIT,
      }

      const result = await this.voucherService.getVouchersByBusinessId(params)

      res.json({
        data: result.data.map((voucher) => VoucherMapper.toDTO(voucher)),
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/category
   * Get all vouchers for a category
   */
  async getVouchersByCategory(
    req: Request<{}, {}, voucherInternal.GetVouchersByCategoryRequest>,
    res: Response<voucherInternal.GetVouchersByCategoryResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { categoryId, state, includeExpired, page, limit } = req.body

      const params = {
        categoryId,
        state,
        includeExpired,
        page: page || 1,
        limit: limit || PAGINATION_DEFAULT_LIMIT,
      }

      const result = await this.voucherService.getAllVouchers(params)

      res.json({
        data: result.data.map((voucher) => VoucherMapper.toDTO(voucher)),
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/user
   * Get vouchers claimed/redeemed by user
   */
  async getUserVouchers(
    req: Request<{}, {}, voucherInternal.GetUserVouchersRequest>,
    res: Response<voucherInternal.GetUserVouchersResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, status, page, limit } = req.body

      const params = {
        userId,
        status,
        page: page || 1,
        limit: limit || PAGINATION_DEFAULT_LIMIT,
      }

      const result = await this.voucherService.getUserVouchers(params)

      res.json({
        data: result.data.map((userVoucher) => ({
          voucher: VoucherMapper.toDTO(userVoucher.voucher),
          claimedAt: userVoucher.claimedAt.toISOString(),
          status: userVoucher.status,
          redeemedAt: userVoucher.redeemedAt?.toISOString() || null,
        })),
        pagination: result.pagination,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/redemption
   * Internal redemption tracking
   */
  async trackRedemption(
    req: Request<{}, {}, voucherInternal.TrackRedemptionRequest>,
    res: Response<voucherInternal.TrackRedemptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherId, userId, code, metadata } = req.body

      const result = await this.voucherService.trackRedemption({
        voucherId,
        userId,
        code,
        metadata,
      })

      res.json({
        redemptionId: result.redemptionId,
        success: result.success,
        currentRedemptions: result.currentRedemptions,
        maxRedemptions: result.maxRedemptions,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/batch-process
   * Batch voucher processing for service-to-service operations
   */
  async batchProcessVouchers(
    req: Request<{}, {}, voucherInternal.BatchVoucherProcessRequest>,
    res: Response<voucherInternal.BatchVoucherProcessResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherIds, operation, context } = req.body
      const startTime = Date.now()

      const results = []
      let successful = 0
      let failed = 0

      for (const voucherId of voucherIds) {
        try {
          let voucher: VoucherDomain | undefined

          switch (operation) {
            case 'publish':
              voucher = await this.voucherService.publishVoucher(voucherId)
              break
            case 'expire':
              voucher = await this.voucherService.expireVoucher(voucherId)
              break
            case 'validate':
              voucher = await this.voucherService.getVoucherById(voucherId)
              break
            case 'refresh':
              // Refresh cache by getting voucher and invalidating cache
              voucher = await this.voucherService.getVoucherById(voucherId)
              break
            default:
              throw new Error(`Unknown operation: ${operation}`)
          }

          results.push({
            voucherId,
            success: true,
            voucher: VoucherMapper.toDTO(voucher),
          })
          successful++
        } catch (error) {
          results.push({
            voucherId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          failed++
        }
      }

      const processingTime = Date.now() - startTime

      res.status(200).json({
        successful,
        failed,
        total: voucherIds.length,
        results,
        processingTime,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/vouchers/batch-state-update
   * Batch voucher state updates for inter-service communication
   */
  async batchUpdateVoucherState(
    req: Request<{}, {}, voucherInternal.BatchUpdateVoucherStateRequest>,
    res: Response<voucherInternal.BatchUpdateVoucherStateResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { updates, context } = req.body

      const updateResults = []
      let successful = 0
      let failed = 0

      for (const update of updates) {
        try {
          // Get current state
          const currentVoucher = await this.voucherService.getVoucherById(
            update.voucherId,
          )
          const oldState = currentVoucher.state

          // Update state
          const updatedVoucher = await this.voucherService.updateVoucherState(
            update.voucherId,
            update.state,
          )

          updateResults.push({
            voucherId: update.voucherId,
            success: true,
            oldState,
            newState: updatedVoucher.state,
          })
          successful++
        } catch (error) {
          updateResults.push({
            voucherId: update.voucherId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          failed++
        }
      }

      res.status(200).json({
        successful,
        failed,
        total: updates.length,
        updates: updateResults,
      })
    } catch (error) {
      next(error)
    }
  }
}
