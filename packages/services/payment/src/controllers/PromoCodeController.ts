import {
  ApplyPromoCodeRequest,
  CreatePromoCodeRequest,
  PromoCodeCodeParam,
  PromoCodeIdParam,
  PromoCodeUserParams,
  UpdatePromoCodeRequest,
} from '@pika/api/public'
import { REDIS_DEFAULT_TTL } from '@pikant'
import { RequestContext } from '@pika
import { Cache, httpRequestKeyGenerator } from '@pika
import type { CreatePromoCodeDTO, UpdatePromoCodeDTO } from '@pika
import {
  PromoCodeMapper,
  PromoCodeUsageMapper,
  PromoCodeWithUsagesMapper,
} from '@pika
import { logger } from '@pika
import type { NextFunction, Request, Response } from 'express'

import type { IPromoCodeService } from '../services/PromoCodeService.js'

/**
 * Handles promo code management operations
 */
export class PromoCodeController {
  constructor(private readonly promoCodeService: IPromoCodeService) {
    // Bind all methods to preserve 'this' context
    this.getAllPromoCodes = this.getAllPromoCodes.bind(this)
    this.getActivePromoCodes = this.getActivePromoCodes.bind(this)
    this.getPromoCodeById = this.getPromoCodeById.bind(this)
    this.getPromoCodeByIdWithUsages = this.getPromoCodeByIdWithUsages.bind(this)
    this.getPromoCodeByCode = this.getPromoCodeByCode.bind(this)
    this.createPromoCode = this.createPromoCode.bind(this)
    this.updatePromoCode = this.updatePromoCode.bind(this)
    this.deletePromoCode = this.deletePromoCode.bind(this)
    this.cancelPromoCode = this.cancelPromoCode.bind(this)
    this.validatePromoCodeForUser = this.validatePromoCodeForUser.bind(this)
    this.usePromoCode = this.usePromoCode.bind(this)
    this.getPromoCodeUsages = this.getPromoCodeUsages.bind(this)
    this.getUserPromoCodeUsages = this.getUserPromoCodeUsages.bind(this)
  }

  /**
   * GET /promo-codes/admin
   * Get all promo codes (admin only)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'promo-codes-all',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllPromoCodes(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)

      logger.info('Admin accessing all promo codes', {
        adminUserId: context.userId,
      })

      const promoCodes = await this.promoCodeService.getAllPromoCodes()

      const dtos = promoCodes.map(PromoCodeMapper.toDTO)

      response.json(dtos)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /promo-codes/active
   * Get active promo codes
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'promo-codes-active',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getActivePromoCodes(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const promoCodes = await this.promoCodeService.getActivePromoCodes()

      const dtos = promoCodes.map(PromoCodeMapper.toDTO)

      response.json(dtos)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /promo-codes/admin/:id
   * Get promo code by ID (admin only)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'promo-code',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getPromoCodeById(
    request: Request<PromoCodeIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)

      logger.info('Admin accessing promo code details', {
        adminUserId: context.userId,
        promoCodeId: id,
      })

      const promoCode = await this.promoCodeService.getPromoCodeById(id)

      const dto = PromoCodeMapper.toDTO(promoCode)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /promo-codes/admin/:id/with-usages
   * Get promo code with usage details (admin only)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'promo-code-usages',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getPromoCodeByIdWithUsages(
    request: Request<PromoCodeIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)

      logger.info('Admin accessing promo code with usage details', {
        adminUserId: context.userId,
        promoCodeId: id,
      })

      const promoCode =
        await this.promoCodeService.getPromoCodeByIdWithUsages(id)

      const dto = PromoCodeWithUsagesMapper.toDTO(promoCode)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /promo-codes/code/:code
   * Get promo code by code
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'promo-code-by-code',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getPromoCodeByCode(
    request: Request<PromoCodeCodeParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code } = request.params

      const promoCode = await this.promoCodeService.getPromoCodeByCode(code)

      const dto = PromoCodeMapper.toDTO(promoCode)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /promo-codes/admin
   * Create new promo code (admin only)
   */
  async createPromoCode(
    request: Request<{}, {}, CreatePromoCodeRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const requestData = request.body
      const context = RequestContext.getContext(request)

      const data: CreatePromoCodeDTO = {
        ...requestData,
        createdBy: context.userId,
        expirationDate: requestData.expirationDate?.toISOString(),
      }

      const promoCode = await this.promoCodeService.createPromoCode(
        data,
        context.userId,
      )

      const dto = PromoCodeMapper.toDTO(promoCode)

      response.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /promo-codes/admin/:id
   * Update promo code (admin only)
   */
  async updatePromoCode(
    request: Request<PromoCodeIdParam, {}, UpdatePromoCodeRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const requestData = request.body
      const context = RequestContext.getContext(request)

      const data: UpdatePromoCodeDTO = {
        ...requestData,
        expirationDate: requestData.expirationDate?.toISOString(),
      }

      const promoCode = await this.promoCodeService.updatePromoCode(
        id,
        data,
        context.userId,
      )

      const dto = PromoCodeMapper.toDTO(promoCode)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /promo-codes/admin/:id
   * Delete promo code (admin only)
   */
  async deletePromoCode(
    request: Request<PromoCodeIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)

      await this.promoCodeService.deletePromoCode(id, context.userId)

      response.json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /promo-codes/admin/:id/cancel
   * Cancel promo code (admin only)
   */
  async cancelPromoCode(
    request: Request<PromoCodeIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)

      const promoCode = await this.promoCodeService.cancelPromoCode(
        id,
        context.userId,
      )

      const dto = PromoCodeMapper.toDTO(promoCode)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /promo-codes/:code/validate/:userId
   * Validate promo code for specific user
   */
  async validatePromoCodeForUser(
    request: Request<{ code: string; userId: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code, userId } = request.params

      const result = await this.promoCodeService.validatePromoCodeForUser(
        code,
        userId,
      )

      const responseData = {
        valid: result.valid,
        promoCode: result.promoCode
          ? PromoCodeMapper.toDTO(result.promoCode)
          : undefined,
        reason: result.reason,
      }

      response.json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /promo-codes/:code/use/:userId
   * Apply promo code for user
   */
  async usePromoCode(
    request: Request<PromoCodeUserParams, {}, ApplyPromoCodeRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { code, userId } = request.params
      const { transactionId } = request.body

      const result = await this.promoCodeService.usePromoCode(
        code,
        userId,
        transactionId,
      )

      const responseData = {
        promoCode: PromoCodeMapper.toDTO(result.promoCode),
        usage: PromoCodeUsageMapper.toDTO(result.usage),
      }

      response.json(responseData)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /promo-codes/admin/:id/usages
   * Get promo code usage history (admin only)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'promo-code-usages',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getPromoCodeUsages(
    request: Request<PromoCodeIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)

      logger.info('Admin accessing promo code usage history', {
        adminUserId: context.userId,
        promoCodeId: id,
      })

      const usages = await this.promoCodeService.getPromoCodeUsages(id)

      const dtos = usages.map(PromoCodeUsageMapper.toDTO)

      response.json(dtos)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /promo-codes/users/:userId/usages
   * Get user's promo code usage history
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user-promo-usages',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserPromoCodeUsages(
    request: Request<{ userId: string }>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = request.params

      const usages = await this.promoCodeService.getUserPromoCodeUsages(userId)

      const dtos = usages.map(PromoCodeUsageMapper.toDTO)

      response.json(dtos)
    } catch (error) {
      next(error)
    }
  }
}
