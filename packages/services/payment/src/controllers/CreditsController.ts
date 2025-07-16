import {
  AdminAddCreditsToUserRequest,
  AdminCreateUserCreditsRequest,
  AdminUpdateUserCreditsRequest,
} from '@pika/api/admin'
import {
  AddCreditsServiceRequest,
  ConsumeCreditsRequest,
  ConsumeCreditsSmartRequest,
  CreditsIdParam,
  TransferCreditsRequest,
  UserIdParam,
} from '@pikac'
import { REDIS_DEFAULT_TTL } from '@pikant'
import { Cache, httpRequestKeyGenerator } from '@pika
import { CreditsHistoryMapper, CreditsMapper } from '@pika
import type { NextFunction, Request, Response } from 'express'

import type { ICreditsService } from '../services/CreditsService.js'

/**
 * Handles user credits management and transactions
 */
export class CreditsController {
  constructor(private readonly creditsService: ICreditsService) {
    // Bind all methods to preserve 'this' context
    this.getUserCredits = this.getUserCredits.bind(this)
    this.getUserCreditsHistory = this.getUserCreditsHistory.bind(this)
    this.createUserCredits = this.createUserCredits.bind(this)
    this.updateUserCredits = this.updateUserCredits.bind(this)
    this.deleteUserCredits = this.deleteUserCredits.bind(this)
    this.addCreditsToUser = this.addCreditsToUser.bind(this)
    this.addCreditsService = this.addCreditsService.bind(this)
    this.consumeUserCredits = this.consumeUserCredits.bind(this)
    this.consumeUserCreditsWithPriority =
      this.consumeUserCreditsWithPriority.bind(this)
    this.transferCredits = this.transferCredits.bind(this)
  }

  /**
   * GET /credits/users/:userId
   * Get user's credit balance
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'user-credits',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserCredits(
    request: Request<UserIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = request.params

      const credits = await this.creditsService.getUserCredits(userId)

      if (!credits) {
        response.status(404).json({ error: 'Credits not found for user' })

        return
      }

      const dto = CreditsMapper.toDTO(credits)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /credits/users/:userId/history
   * Get user's credit transaction history
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'credits-history',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserCreditsHistory(
    request: Request<UserIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = request.params

      const history = await this.creditsService.getUserCreditsHistory(userId)

      const dtos = history.map(CreditsHistoryMapper.toDTO)

      response.json(dtos)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /credits
   * Create new user credits
   */
  async createUserCredits(
    request: Request<{}, {}, AdminCreateUserCreditsRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body

      const credits = await this.creditsService.createUserCredits(data)

      const dto = CreditsMapper.toDTO(credits)

      response.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /credits/:id
   * Update user credits
   */
  async updateUserCredits(
    request: Request<CreditsIdParam, {}, AdminUpdateUserCreditsRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: creditsId } = request.params
      const data = request.body

      const credits = await this.creditsService.updateUserCredits(
        creditsId,
        data,
      )

      const dto = CreditsMapper.toDTO(credits)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /credits/:id
   * Delete user credits
   */
  async deleteUserCredits(
    request: Request<CreditsIdParam, {}, {}>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: creditsId } = request.params

      await this.creditsService.deleteUserCredits(creditsId)

      response.json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /credits/users/:userId/add
   * Add credits to user (admin only)
   */
  async addCreditsToUser(
    request: Request<UserIdParam, {}, AdminAddCreditsToUserRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = request.params
      const { amount, description, promoCode, transactionId } = request.body

      const credits = await this.creditsService.addCreditsToUser(
        userId,
        amount,
        description,
        promoCode,
        transactionId,
      )

      const dto = CreditsMapper.toDTO(credits)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /credits/add-credits
   * Add credits via payment (legacy endpoint)
   */
  async addCreditsService(
    request: Request<{}, {}, AddCreditsServiceRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { creditsObject, promoCode, price } = request.body

      const credits = await this.creditsService.addCreditsService(
        creditsObject,
        promoCode,
        price,
      )

      const dto = CreditsMapper.toDTO(credits)

      response.status(200).json({
        message: 'Credits added!',
        credits: dto,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /credits/users/:userId/consume
   * Consume user credits
   */
  async consumeUserCredits(
    request: Request<UserIdParam, {}, ConsumeCreditsRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = request.params
      const { demandAmount, subAmount, description } = request.body

      const credits = await this.creditsService.consumeUserCredits(
        userId,
        demandAmount,
        subAmount,
        description,
      )

      const dto = CreditsMapper.toDTO(credits)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /credits/users/:userId/consume-smart
   * Consume credits with priority (demand first, then subscription)
   */
  async consumeUserCreditsWithPriority(
    request: Request<UserIdParam, {}, ConsumeCreditsSmartRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = request.params
      const { totalAmount, description } = request.body

      const credits = await this.creditsService.consumeUserCreditsWithPriority(
        userId,
        totalAmount,
        description,
      )

      const dto = CreditsMapper.toDTO(credits)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /credits/users/:userId/transfer
   * Transfer credits between users
   */
  async transferCredits(
    request: Request<UserIdParam, {}, TransferCreditsRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId: fromUserId } = request.params
      const { toUserId, amount, description } = request.body

      const result = await this.creditsService.transferCredits(
        fromUserId,
        toUserId,
        amount,
        description,
      )

      const dtoResult = {
        from: CreditsMapper.toDTO(result.from),
        to: CreditsMapper.toDTO(result.to),
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }
}
