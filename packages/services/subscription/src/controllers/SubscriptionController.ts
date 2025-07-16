import type {
  ProcessSubscriptionCreditsRequest,
  SubscriptionIdParam,
} from '@pika/api/admin'
import type { AdminGetSubscriptionsQuery } from '@pikadmin'
import type {
  CancelSubscriptionRequest,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '@pikaublic'
import { REDIS_DEFAULT_TTL } from '@pikaonment'
import { getValidatedQuery, RequestContext } from '@pika
import { Cache, httpRequestKeyGenerator } from '@pika'
import { SubscriptionMapper } from '@pika
import { logger } from '@pikad'
import type { SubscriptionSearchParams } from '@subscription/repositories/SubscriptionRepository.js'
import type { ISubscriptionService } from '@subscription/services/SubscriptionService.js'
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
    this.processSubscriptionCredits = this.processSubscriptionCredits.bind(this)
  }

  /**
   * POST /subscriptions
   * Create new subscription
   */
  async createSubscription(
    request: Request<{}, {}, CreateSubscriptionRequest>,
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
      const query = getValidatedQuery<AdminGetSubscriptionsQuery>(request)

      // Transform API query to service params
      const params: SubscriptionSearchParams = {
        page: query.page,
        limit: query.limit,
        status: query.status,
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
    request: Request<SubscriptionIdParam>,
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
    request: Request<SubscriptionIdParam, {}, UpdateSubscriptionRequest>,
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
    request: Request<SubscriptionIdParam, {}, CancelSubscriptionRequest>,
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
    request: Request<SubscriptionIdParam>,
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

  /**
   * POST /subscriptions/:id/process-credits
   * Process subscription credits
   */
  async processSubscriptionCredits(
    request: Request<
      SubscriptionIdParam,
      {},
      ProcessSubscriptionCreditsRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Processing subscription credits', { subscriptionId: id })

      const result =
        await this.subscriptionService.processSubscriptionCredits(id)

      // Calculate credits added from the subscription plan
      const creditsAdded = result.subscription.planId
        ? (await this.subscriptionService.getSubscriptionById(id)).plan
            ?.creditsAmount || 0
        : 0

      response.json({
        subscription: SubscriptionMapper.toDTO(result.subscription),
        creditsAdded,
        newBalance: result.credits.amountSub + result.credits.amountDemand,
      })
    } catch (error) {
      next(error)
    }
  }
}
