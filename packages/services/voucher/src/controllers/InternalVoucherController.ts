import { voucherCommon, voucherInternal } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT } from '@pika/environment'
import { paginatedResponse } from '@pika/http'
import { VoucherMapper } from '@pika/sdk'
import { parseIncludeParam } from '@pika/shared'
import { VoucherState } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

import type {
  BatchProcessOperation,
  IInternalVoucherService,
} from '../services/InternalVoucherService.js'

/**
 * Handles internal voucher operations for service-to-service communication
 */
export class InternalVoucherController {
  constructor(
    private readonly internalVoucherService: IInternalVoucherService,
  ) {
    // Bind methods to preserve 'this' context
    this.getVouchersByIds = this.getVouchersByIds.bind(this)
    this.validateVoucher = this.validateVoucher.bind(this)
    this.updateVoucherState = this.updateVoucherState.bind(this)
    this.checkVoucherExists = this.checkVoucherExists.bind(this)
    this.getVouchersByBusiness = this.getVouchersByBusiness.bind(this)
    this.getVouchersByCategory = this.getVouchersByCategory.bind(this)
    this.getUserVouchers = this.getUserVouchers.bind(this)
    this.trackRedemption = this.trackRedemption.bind(this)
    this.batchProcessVouchers = this.batchProcessVouchers.bind(this)
    this.batchUpdateVoucherState = this.batchUpdateVoucherState.bind(this)
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

      const parsedIncludes = include ? parseIncludeParam(include) : undefined
      const vouchers = await this.internalVoucherService.getVouchersByIds(
        voucherIds,
        parsedIncludes,
      )
      const notFound = voucherIds.filter(
        (id) => !vouchers.find((v) => v.id === id),
      )

      res.json({
        vouchers: vouchers.map((voucher) => VoucherMapper.toAdminDTO(voucher)),
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

      const validation = await this.internalVoucherService.validateVoucher(
        voucherId,
        {
          userId,
          checkRedemptionLimit,
          checkExpiry,
          checkState,
        },
      )

      res.json({
        isValid: validation.isValid,
        reason: validation.reason,
        voucher: validation.voucher
          ? VoucherMapper.toAdminDTO(validation.voucher)
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
      const { state, reason, serviceId: _serviceId } = req.body

      // Get current voucher to check previous state
      const currentVoucher =
        await this.internalVoucherService.getVoucherById(voucherId)
      const previousState = currentVoucher.state

      const updatedVoucher =
        await this.internalVoucherService.updateVoucherStateInternal(
          voucherId,
          state as VoucherState,
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

      const exists = await this.internalVoucherService.checkVoucherExists({
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
        state: state as VoucherState | undefined,
        includeExpired,
        includeDeleted,
        page: page || 1,
        limit: limit || PAGINATION_DEFAULT_LIMIT,
      }

      const result =
        await this.internalVoucherService.getVouchersByBusinessInternal(
          businessId,
          params,
        )

      res.json(paginatedResponse(result, VoucherMapper.toAdminDTO))
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
        state: state as VoucherState | undefined,
        includeExpired,
        page: page || 1,
        limit: limit || PAGINATION_DEFAULT_LIMIT,
      }

      const result =
        await this.internalVoucherService.getVouchersByCategoryInternal(
          categoryId,
          params,
        )

      res.json(paginatedResponse(result, VoucherMapper.toAdminDTO))
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

      const result = await this.internalVoucherService.getUserVouchers(params)

      res.json(paginatedResponse(result, VoucherMapper.toUserVoucherDTO))
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

      const result = await this.internalVoucherService.trackRedemption({
        voucherId,
        userId,
        code,
        metadata,
      })

      res.json({
        redemptionId: result.redemptionId,
        success: result.success,
        currentRedemptions: result.currentRedemptions,
        maxRedemptions: result.maxRedemptions ?? null,
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

      const batchOperation: BatchProcessOperation = {
        voucherIds,
        operation: operation as 'expire' | 'validate' | 'activate',
        context,
      }

      const result =
        await this.internalVoucherService.batchProcessVouchers(batchOperation)

      res.status(200).json({
        successful: result.successCount,
        failed: result.failedCount,
        total: result.processedCount,
        results: result.results.map((r) => ({
          voucherId: r.voucherId,
          success: r.success,
          error: r.error,
        })),
        processingTime: 0, // The internal service doesn't track this, but we need it for API compatibility
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
      const { updates } = req.body

      const updateResults = []

      let successful = 0
      let failed = 0

      for (const update of updates) {
        try {
          // Get current state
          const currentVoucher =
            await this.internalVoucherService.getVoucherById(update.voucherId)
          const oldState = currentVoucher.state

          // Update state
          const updatedVoucher =
            await this.internalVoucherService.updateVoucherStateInternal(
              update.voucherId,
              update.state as VoucherState,
              update.reason,
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
