import { subscriptionAdmin, subscriptionPublic } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { getValidatedQuery, RequestContext } from '@pika/http'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import { SubscriptionMapper } from '@pika/sdk'
import { logger } from '@pika/shared'
import type { SubscriptionSearchParams } from '../repositories/SubscriptionRepository.js'
import type { ISubscriptionService } from '../services/SubscriptionService.js'
import type { NextFunction, Request, Response } from 'express'

/**
 * Handles subscription management operations
 */
export class SubscriptionController {
  constructor(private readonly subscriptionService: ISubscriptionService) {
    // Bind all methods to preserve 'this' context
    this.createSubscription = this.createSubscription.bind(this)
    this.getSubscriptions = this.getSubscriptions.bind(this)
    this.getSubscriptionById = this.getSubscriptionById.bind(this)
    this.getUserSubscription = this.getUserSubscription.bind(this)
    this.updateSubscription = this.updateSubscription.bind(this)
    this.cancelSubscription = this.cancelSubscription.bind(this)
    this.reactivateSubscription = this.reactivateSubscription.bind(this)
  }

  /**
   * POST /subscriptions
   * Create new subscription
   */
  async createSubscription(
    request: Request<{}, {}, subscriptionPublic.CreateSubscriptionRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Creating subscription', { userId, planId: data.planId })

      const subscription = await this.subscriptionService.createSubscription(
        userId,
        data,
      )

      const dto = SubscriptionMapper.toDTO(subscription)

      response.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /subscriptions
   * Get all subscriptions with filters
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'subscriptions-list',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getSubscriptions(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<subscriptionAdmin.AdminGetSubscriptionsQuery>(request)

      // Transform API query to service params
      const params: SubscriptionSearchParams = {
        page: query.page,
        limit: query.limit,
        status: query.status as any,
        userId: query.userId,
        planId: query.planId,
        cancelAtPeriodEnd: query.cancelAtPeriodEnd,
      }

      logger.info('Getting subscriptions', { params })

      const result = await this.subscriptionService.getAllSubscriptions(params)

      const dtoResult = {
        data: result.data.map(SubscriptionMapper.toDTO),
        pagination: result.pagination,
      }

      response.json(dtoResult)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /subscriptions/:id
   * Get subscription by ID
   */
  async getSubscriptionById(
    request: Request<subscriptionAdmin.SubscriptionIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Getting subscription by ID', { id })

      const subscription =
        await this.subscriptionService.getSubscriptionById(id)

      const dto = SubscriptionMapper.toDTO(subscription)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /subscriptions/me
   * Get current user's active subscription
   */
  @Cache({
    ttl: 300,
    prefix: 'user-active-subscription',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getUserSubscription(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const context = RequestContext.getContext(request)
      const userId = context.userId

      logger.info('Getting user active subscription', { userId })

      const subscription =
        await this.subscriptionService.getUserActiveSubscription(userId)

      const dto = subscription ? SubscriptionMapper.toDTO(subscription) : null

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /subscriptions/:id
   * Update subscription
   */
  async updateSubscription(
    request: Request<subscriptionAdmin.SubscriptionIdParam, {}, subscriptionPublic.UpdateSubscriptionRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const data = request.body

      logger.info('Updating subscription', { id })

      const subscription = await this.subscriptionService.updateSubscription(
        id,
        data,
      )

      const dto = SubscriptionMapper.toDTO(subscription)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /subscriptions/:id/cancel
   * Cancel subscription
   */
  async cancelSubscription(
    request: Request<subscriptionAdmin.SubscriptionIdParam, {}, subscriptionPublic.CancelSubscriptionRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const { cancelAtPeriodEnd = true } = request.body

      logger.info('Cancelling subscription', { id, cancelAtPeriodEnd })

      const subscription = await this.subscriptionService.cancelSubscription(
        id,
        cancelAtPeriodEnd,
      )

      const dto = SubscriptionMapper.toDTO(subscription)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /subscriptions/:id/reactivate
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(
    request: Request<subscriptionAdmin.SubscriptionIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Reactivating subscription', { id })

      const subscription =
        await this.subscriptionService.reactivateSubscription(id)

      const dto = SubscriptionMapper.toDTO(subscription)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  // Credit processing method removed - no credit tables in database
}
