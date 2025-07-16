import {
  CreateCreditPackRequest,
  UpdateCreditPackRequest,
} from '@pika/api/admin'
import { CreditPackIdParam, GetAllCreditPacksQuery } from '@pikac'
import { REDIS_DEFAULT_TTL } from '@pikant'
import { getValidatedQuery, RequestContext } from '@pika
import { Cache, httpRequestKeyGenerator } from '@pika
import { CreateCreditsPackDTO, CreditsPackMapper } from '@pika
import { logger } from '@pika
import type { NextFunction, Request, Response } from 'express'

import type { ICreditPackService } from '../services/CreditPackService.js'

/**
 * Handles credit pack management operations
 */
export class CreditPackController {
  constructor(private readonly creditPackService: ICreditPackService) {
    // Bind all methods to preserve 'this' context
    this.getAllCreditPacks = this.getAllCreditPacks.bind(this)
    this.getActiveCreditPacks = this.getActiveCreditPacks.bind(this)
    this.getCreditPackById = this.getCreditPackById.bind(this)
    this.createCreditPack = this.createCreditPack.bind(this)
    this.updateCreditPack = this.updateCreditPack.bind(this)
    this.deleteCreditPack = this.deleteCreditPack.bind(this)
    this.deactivateCreditPack = this.deactivateCreditPack.bind(this)
    this.activateCreditPack = this.activateCreditPack.bind(this)
  }

  /**
   * GET /credit-packs/admin/all
   * Get all credit packs (admin only)
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'credit-packs-all',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getAllCreditPacks(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const query = getValidatedQuery<GetAllCreditPacksQuery>(request)

      logger.info('Admin accessing all credit packs', {
        adminUserId: context.userId,
        isActive: query.isActive,
        page: query.page,
        limit: query.limit,
      })

      const packs = await this.creditPackService.getAllCreditPacks()

      const dtos = packs.map(CreditsPackMapper.toDTO)

      response.json(dtos)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /credit-packs
   * Get active credit packs available for purchase
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'credit-packs-active',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getActiveCreditPacks(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const packs = await this.creditPackService.getActiveCreditPacks()

      const dtos = packs.map(CreditsPackMapper.toDTO)

      response.json(dtos)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /credit-packs/:id
   * Get credit pack by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'credit-pack',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getCreditPackById(
    request: Request<CreditPackIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      const pack = await this.creditPackService.getCreditPackById(id)

      const dto = CreditsPackMapper.toDTO(pack)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /credit-packs/admin
   * Create new credit pack
   */
  async createCreditPack(
    request: Request<{}, {}, CreateCreditPackRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)

      const createData: CreateCreditsPackDTO = {
        type: data.type,
        amount: data.amount,
        frequency: 1, // Default frequency - might need to be configurable based on pack type
        price: data.price,
        active: data.active,
        createdBy: context.userId,
      }

      const pack = await this.creditPackService.createCreditPack(
        createData,
        context.userId,
      )

      const dto = CreditsPackMapper.toDTO(pack)

      response.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /credit-packs/admin/:id
   * Update credit pack
   */
  async updateCreditPack(
    request: Request<CreditPackIdParam, {}, UpdateCreditPackRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const data = request.body
      const context = RequestContext.getContext(request)

      const pack = await this.creditPackService.updateCreditPack(
        id,
        data,
        context.userId,
      )

      const dto = CreditsPackMapper.toDTO(pack)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /credit-packs/admin/:id
   * Delete credit pack
   */
  async deleteCreditPack(
    request: Request<CreditPackIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)

      await this.creditPackService.deleteCreditPack(id, context.userId)

      response.json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /credit-packs/admin/:id/deactivate
   * Deactivate credit pack
   */
  async deactivateCreditPack(
    request: Request<CreditPackIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)

      const pack = await this.creditPackService.deactivateCreditPack(
        id,
        context.userId,
      )

      const dto = CreditsPackMapper.toDTO(pack)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /credit-packs/admin/:id/activate
   * Activate credit pack
   */
  async activateCreditPack(
    request: Request<CreditPackIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const context = RequestContext.getContext(request)

      const pack = await this.creditPackService.activateCreditPack(
        id,
        context.userId,
      )

      const dto = CreditsPackMapper.toDTO(pack)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }
}
