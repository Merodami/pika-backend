import { shared, voucherCommon, voucherPublic } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  RequestContext,
  paginatedResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { VoucherMapper } from '@pika/sdk'
import { ErrorFactory, parseIncludeParam } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { IVoucherService } from '../services/VoucherService.js'

/**
 * Handles public voucher operations
 * Public routes for viewing and interacting with vouchers
 */
export class VoucherController {
  constructor(
    private readonly voucherService: IVoucherService,
  ) {
    // Bind methods to preserve 'this' context
    this.getAllVouchers = this.getAllVouchers.bind(this)
    this.getVoucherById = this.getVoucherById.bind(this)
    this.scanVoucher = this.scanVoucher.bind(this)
    this.claimVoucher = this.claimVoucher.bind(this)
    this.redeemVoucher = this.redeemVoucher.bind(this)
    this.getUserVouchers = this.getUserVouchers.bind(this)
    this.getBusinessVouchers = this.getBusinessVouchers.bind(this)
    this.getVoucherByCode = this.getVoucherByCode.bind(this)
  }

  /**
   * GET /vouchers
   * Get all vouchers with filters and pagination (public)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllVouchers(
    req: Request<{}, {}, {}, voucherPublic.VoucherQueryParams>,
    res: Response<voucherPublic.VoucherListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<voucherPublic.VoucherQueryParams>(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(
            query.include,
            voucherCommon.VOUCHER_ALLOWED_RELATIONS,
          )
        : {}

      // Map API query to service params - only show published vouchers to public
      const params = {
        businessId: query.businessId,
        categoryId: query.categoryId,
        state: 'published' as const, // Always filter by published for public routes
        type: query.type,
        minValue: query.minValue,
        maxValue: query.maxValue,
        minDiscount: query.minDiscount,
        maxDiscount: query.maxDiscount,
        currency: query.currency,
        validFrom: query.validFrom,
        validUntil: query.validUntil,
        search: query.search,
        page: query.page || 1,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: voucherCommon.voucherSortFieldMapper.mapSortField(
          query.sortBy,
          'createdAt',
        ),
        sortOrder: query.sortOrder,
        parsedIncludes,
      }

      const result = await this.voucherService.getAllVouchers(params)

      res.json(paginatedResponse(result, VoucherMapper.toDTO))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/:id
   * Get voucher by ID (public)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'voucher',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherById(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      {},
      voucherPublic.GetVoucherByIdQuery
    >,
    res: Response<voucherPublic.VoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const query = getValidatedQuery<voucherPublic.GetVoucherByIdQuery>(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(
            query.include,
            voucherCommon.VOUCHER_ALLOWED_RELATIONS,
          )
        : {}

      const voucher = await this.voucherService.getVoucherById(
        voucherId,
        parsedIncludes,
      )

      // Check if voucher is published for public access
      if (voucher.state !== 'published') {
        throw ErrorFactory.notFound('Voucher', voucherId)
      }

      res.json(VoucherMapper.toDTO(voucher))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/:id/scan
   * Track voucher scan
   */
  async scanVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherPublic.VoucherScanRequest
    >,
    res: Response<voucherPublic.VoucherScanResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const scanData = req.body
      const context = RequestContext.getContext(req)
      const userId = context?.userId

      const scanResult = await this.voucherService.scanVoucher(voucherId, {
        ...scanData,
        userId,
      })

      res.json(VoucherMapper.toScanResponseDTO(scanResult))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/:id/claim
   * Claim voucher to user's wallet
   */
  async claimVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherPublic.VoucherClaimRequest
    >,
    res: Response<voucherPublic.VoucherClaimResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const claimData = req.body
      const context = RequestContext.getContext(req)
      const userId = context.userId

      if (!userId) {
        throw ErrorFactory.unauthorized(
          'Authentication required to claim vouchers',
        )
      }

      const claimResult = await this.voucherService.claimVoucher(
        voucherId,
        userId,
        claimData,
      )

      res.json(VoucherMapper.toClaimResponseDTO(claimResult))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /vouchers/:id/redeem
   * Redeem voucher
   */
  async redeemVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherPublic.VoucherRedeemRequest
    >,
    res: Response<voucherPublic.VoucherRedeemResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const redeemData = req.body
      const context = RequestContext.getContext(req)
      const userId = context?.userId

      const redeemResult = await this.voucherService.redeemVoucher(voucherId, {
        ...redeemData,
        userId,
      })

      res.json(VoucherMapper.toRedeemResponseDTO(redeemResult))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/user/:userId
   * Get user's vouchers (claimed/redeemed)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers:user',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserVouchers(
    req: Request<
      shared.UserIdParam,
      {},
      {},
      voucherPublic.UserVouchersQueryParams
    >,
    res: Response<voucherPublic.UserVouchersListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: userId } = req.params
      const query =
        getValidatedQuery<voucherPublic.UserVouchersQueryParams>(req)
      const context = RequestContext.getContext(req)

      // Users can only see their own vouchers unless admin
      if (context?.userId !== userId && context?.role !== 'admin') {
        throw ErrorFactory.forbidden('You can only view your own vouchers')
      }

      const params = {
        userId,
        status: query.status,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: query.sortBy || 'claimedAt',
        sortOrder: query.sortOrder,
      }

      const result = await this.voucherService.getUserVouchers(params)

      res.json(paginatedResponse(result, VoucherMapper.toUserVoucherDTO))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/business/:businessId
   * Get business's vouchers (public)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'vouchers:business',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getBusinessVouchers(
    req: Request<
      shared.BusinessIdParam,
      {},
      {},
      voucherPublic.VoucherQueryParams
    >,
    res: Response<voucherPublic.VoucherListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const query = getValidatedQuery<voucherPublic.VoucherQueryParams>(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(
            query.include,
            voucherCommon.VOUCHER_ALLOWED_RELATIONS,
          )
        : {}

      const params = {
        businessId,
        state: 'published' as const, // Only show published vouchers
        categoryId: query.categoryId,
        discountType: query.discountType,
        minDiscount: query.minDiscount,
        maxDiscount: query.maxDiscount,
        validNow: query.validNow,
        expiringInDays: query.expiringInDays,
        hasAvailableUses: query.hasAvailableUses,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: voucherCommon.voucherSortFieldMapper.mapSortField(
          query.sortBy,
          'createdAt',
        ),
        sortOrder: query.sortOrder,
        parsedIncludes,
      }

      const result = await this.voucherService.getVouchersByBusinessId(params)

      res.json(paginatedResponse(result, VoucherMapper.toDTO))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /vouchers/by-code/:code
   * Get voucher by any code type (QR, short, static)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'voucher:code',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherByCode(
    req: Request<voucherCommon.VoucherCodeParam>,
    res: Response<voucherPublic.VoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code } = req.params
      const query = getValidatedQuery<voucherPublic.GetVoucherByIdQuery>(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(
            query.include,
            voucherCommon.VOUCHER_ALLOWED_RELATIONS,
          )
        : {}

      const voucher = await this.voucherService.getVoucherByAnyCode(code)

      // Apply includes if needed
      let voucherWithIncludes = voucher

      if (Object.keys(parsedIncludes).length > 0) {
        voucherWithIncludes = await this.voucherService.getVoucherById(
          voucher.id,
          parsedIncludes,
        )
      }

      res.json(VoucherMapper.toDTO(voucherWithIncludes))
    } catch (error) {
      next(error)
    }
  }
}
