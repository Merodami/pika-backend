import { businessCommon, shared, voucherAdmin, voucherCommon } from '@pika/api'
import { PAGINATION_DEFAULT_LIMIT, REDIS_DEFAULT_TTL } from '@pika/environment'
import {
  getValidatedQuery,
  getRequestLanguage,
  paginatedResponse,
} from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { VoucherMapper } from '@pika/sdk'
import { ErrorFactory, parseIncludeParam } from '@pika/shared'
import { VoucherState } from '@pika/types'
import type { NextFunction, Request, Response } from 'express'

import type { IAdminVoucherService } from '../services/AdminVoucherService.js'
import type { VoucherSearchParams } from '../types/index.js'

/**
 * Handles admin voucher management operations
 */
export class AdminVoucherController {
  constructor(private readonly voucherService: IAdminVoucherService) {
    // Bind methods to preserve 'this' context
    this.getAllVouchers = this.getAllVouchers.bind(this)
    this.getVoucherById = this.getVoucherById.bind(this)
    this.createVoucher = this.createVoucher.bind(this)
    this.updateVoucher = this.updateVoucher.bind(this)
    this.deleteVoucher = this.deleteVoucher.bind(this)
    this.updateVoucherState = this.updateVoucherState.bind(this)
    this.generateVoucherCodes = this.generateVoucherCodes.bind(this)
    this.uploadVoucherImage = this.uploadVoucherImage.bind(this)
    this.updateVoucherTranslations = this.updateVoucherTranslations.bind(this)
    this.getVoucherTranslations = this.getVoucherTranslations.bind(this)
    this.bulkUpdateVouchers = this.bulkUpdateVouchers.bind(this)
    this.getVoucherAnalytics = this.getVoucherAnalytics.bind(this)
    this.getBusinessVoucherStats = this.getBusinessVoucherStats.bind(this)
    this.publishVoucher = this.publishVoucher.bind(this)
    this.expireVoucher = this.expireVoucher.bind(this)
  }

  /**
   * GET /admin/vouchers
   * Get all vouchers with admin filters and pagination
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:vouchers',
    keyGenerator: httpRequestKeyGenerator,
    condition: (result) => result && result.data && Array.isArray(result.data),
  })
  async getAllVouchers(
    req: Request,
    res: Response<voucherAdmin.AdminVoucherListResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<voucherAdmin.AdminVoucherQueryParams>(req)
      const language = getRequestLanguage(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(
            query.include,
            [...voucherCommon.ADMIN_VOUCHER_ALLOWED_RELATIONS],
          )
        : {}

      // Map API query to service params - admins can see all vouchers
      const params: VoucherSearchParams = {
        businessId: query.businessId,
        categoryId: query.categoryId,
        state: query.state as VoucherState | undefined,
        discountType: query.discountType,
        minDiscount: query.minDiscount,
        maxDiscount: query.maxDiscount,
        currency: query.currency,
        validFromStart: query.validFromStart,
        validFromEnd: query.validFromEnd,
        expiresAtStart: query.expiresAtStart,
        expiresAtEnd: query.expiresAtEnd,
        createdFromStart: query.createdFromStart,
        createdFromEnd: query.createdFromEnd,
        minRedemptions: query.minRedemptions,
        maxRedemptions: query.maxRedemptions,
        minScans: query.minScans,
        maxScans: query.maxScans,
        isDeleted: query.isDeleted,
        search: query.search,
        page: query.page,
        limit: query.limit || PAGINATION_DEFAULT_LIMIT,
        sortBy: voucherCommon.adminVoucherSortFieldMapper.mapSortField(
          query.sortBy,
          'createdAt',
        ),
        sortOrder: query.sortOrder,
        parsedIncludes,
      }

      const result = await this.voucherService.getAllVouchers(params, language)

      res.json(paginatedResponse(result, (voucher) => VoucherMapper.toAdminDTO(voucher)))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/:id
   * Get voucher by ID with full details for admin
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'admin:voucher',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getVoucherById(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const query = getValidatedQuery<voucherAdmin.AdminVoucherQueryParams>(req)
      const language = getRequestLanguage(req)
      const parsedIncludes = query.include
        ? parseIncludeParam(
            query.include,
            [...voucherCommon.ADMIN_VOUCHER_ALLOWED_RELATIONS],
          )
        : {}

      const voucher = await this.voucherService.getVoucherById(
        voucherId,
        parsedIncludes,
        language,
      )

      res.json(VoucherMapper.toAdminDTO(voucher))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers
   * Create new voucher (admin)
   */
  async createVoucher(
    req: Request<{}, {}, voucherAdmin.CreateVoucherRequest>,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = VoucherMapper.fromCreateRequestData(req.body)
      const language = getRequestLanguage(req)

      const voucher = await this.voucherService.createVoucher(data, language)

      res.status(201).json(VoucherMapper.toAdminDTO(voucher))
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /admin/vouchers/:id
   * Update voucher (admin)
   */
  async updateVoucher(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherAdmin.UpdateVoucherRequest
    >,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const data = VoucherMapper.fromUpdateRequestData(req.body)
      const language = getRequestLanguage(req)

      const voucher = await this.voucherService.updateVoucher(voucherId, data, language)

      res.json(VoucherMapper.toAdminDTO(voucher))
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/vouchers/:id
   * Delete voucher (admin)
   */
  async deleteVoucher(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params

      await this.voucherService.deleteVoucher(voucherId)

      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/vouchers/:id/state
   * Update voucher state (admin)
   */
  async updateVoucherState(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherAdmin.UpdateVoucherStateRequest
    >,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const { state, reason } = req.body
      const language = getRequestLanguage(req)

      const voucher = await this.voucherService.updateVoucherState(
        voucherId,
        state as VoucherState,
        language,
      )

      res.json(VoucherMapper.toAdminDTO(voucher))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers/:id/codes
   * Generate voucher codes (admin)
   */
  async generateVoucherCodes(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherAdmin.GenerateVoucherCodesRequest
    >,
    res: Response<voucherAdmin.AdminVoucherDetailResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const { codeType, quantity, customCodes } = req.body

      const codes = await this.voucherService.generateVoucherCodes(
        voucherId,
        {
          codeType,
          quantity,
          customCodes,
        },
      )

      // Get the updated voucher with the new codes
      const voucher = await this.voucherService.getVoucherById(voucherId)

      res.json(VoucherMapper.toAdminDTO(voucher))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers/:id/image
   * Upload voucher image (admin)
   */
  async uploadVoucherImage(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.UploadVoucherImageResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params

      // Get the uploaded file from Multer
      const file = req.file

      if (!file) {
        throw ErrorFactory.badRequest('No file uploaded')
      }

      const imageUrl = await this.voucherService.uploadVoucherImage(
        voucherId,
        file,
      )

      res.json({ imageUrl })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/vouchers/:id/translations
   * Update voucher translations (admin)
   */
  async updateVoucherTranslations(
    req: Request<
      voucherCommon.VoucherIdParam,
      {},
      voucherAdmin.UpdateVoucherTranslationsRequest
    >,
    res: Response<voucherAdmin.VoucherTranslationsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const { translations } = req.body

      // Map API 'terms' to domain 'termsAndConditions'
      const domainTranslations = VoucherMapper.fromTranslationsDTO(translations)
      
      await this.voucherService.updateVoucherTranslations(
        voucherId,
        domainTranslations,
      )

      res.json({
        voucherId,
        translations: {
          title: translations.title || {},
          description: translations.description || {},
          terms: translations.terms || {},
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/:id/translations
   * Get voucher translations (admin)
   */
  async getVoucherTranslations(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.VoucherTranslationsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params

      const translations =
        await this.voucherService.getVoucherTranslations(voucherId)

      // Map domain 'termsAndConditions' back to API 'terms'
      const apiTranslations = VoucherMapper.toTranslationsDTO(translations)

      res.json({
        voucherId,
        translations: apiTranslations,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/vouchers/bulk
   * Bulk update vouchers (admin)
   */
  async bulkUpdateVouchers(
    req: Request<{}, {}, voucherAdmin.BulkVoucherUpdateRequest>,
    res: Response<voucherAdmin.BulkVoucherOperationResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { voucherIds, updates, reason } = req.body
      const language = getRequestLanguage(req)

      // Convert the bulk update data to UpdateVoucherDTO format
      const updateDTO = {
        ...(updates.state && { state: updates.state }),
        ...(updates.expiresAt && { expiresAt: updates.expiresAt }),
        ...(updates.maxRedemptions !== undefined && { maxRedemptions: updates.maxRedemptions }),
        ...(updates.maxRedemptionsPerUser && { maxRedemptionsPerUser: updates.maxRedemptionsPerUser }),
      }
      
      const updateData = VoucherMapper.fromUpdateDTO(updateDTO)
      
      const result = await this.voucherService.bulkUpdateVouchers({
        ids: voucherIds,
        updates: updateData,
      }, language)

      res.json(VoucherMapper.toBulkUpdateResponseDTO(result))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/:id/analytics
   * Get voucher analytics (admin)
   */
  async getVoucherAnalytics(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.VoucherAnalyticsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: voucherId } = req.params
      const query =
        getValidatedQuery<voucherAdmin.VoucherAnalyticsQueryParams>(req)

      const analytics = await this.voucherService.getVoucherAnalytics({
        startDate: query.startDate,
        endDate: query.endDate,
      })

      res.json(VoucherMapper.toVoucherAnalyticsDTO(analytics, voucherId, {
        startDate: query.startDate,
        endDate: query.endDate,
      }))
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/vouchers/business/:businessId/stats
   * Get business voucher statistics (admin)
   */
  async getBusinessVoucherStats(
    req: Request<businessCommon.BusinessIdParam>,
    res: Response<voucherAdmin.BusinessVoucherStatsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: businessId } = req.params
      const query =
        getValidatedQuery<voucherAdmin.BusinessVoucherStatsQueryParams>(req)

      const stats = await this.voucherService.getBusinessVoucherStats(
        businessId,
      )

      res.json(VoucherMapper.toBusinessVoucherStatsDTO(stats))
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers/:id/publish
   * Publish voucher (admin workflow)
   */
  async publishVoucher(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.AdminVoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const language = getRequestLanguage(req)

      const voucher = await this.voucherService.publishVoucher(id, language)
      const dto = VoucherMapper.toAdminDTO(voucher)

      res.status(200).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/vouchers/:id/expire
   * Expire voucher (admin workflow)
   */
  async expireVoucher(
    req: Request<voucherCommon.VoucherIdParam>,
    res: Response<voucherAdmin.AdminVoucherResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params
      const language = getRequestLanguage(req)

      const voucher = await this.voucherService.expireVoucher(id, language)
      const dto = VoucherMapper.toAdminDTO(voucher)

      res.status(200).json(dto)
    } catch (error) {
      next(error)
    }
  }

}
