import type { Request, Response, NextFunction } from 'express'
import { paginatedResponse, getValidatedQuery } from '@pika/http'
import { ErrorFactory, logger } from '@pika/shared'
import { SubscriptionMapper, SubscriptionPlanMapper } from '@pika/sdk'
import { subscriptionAdmin, subscriptionCommon } from '@pika/api'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { Cache, httpRequestKeyGenerator } from '@pika/redis'
import type { ISubscriptionService } from '../services/SubscriptionService.js'
import type { IPlanService } from '../services/PlanService.js'
import type { SubscriptionSearchParams } from '../types/search.js'
import type { PlanSearchParams } from '../repositories/PlanRepository.js'

export class AdminSubscriptionController {
  constructor(
    private readonly subscriptionService: ISubscriptionService,
    private readonly planService: IPlanService
  ) {
    // Bind all methods to preserve 'this' context
    this.getAllSubscriptions = this.getAllSubscriptions.bind(this)
    this.getSubscriptionById = this.getSubscriptionById.bind(this)
    this.createSubscription = this.createSubscription.bind(this)
    this.updateSubscription = this.updateSubscription.bind(this)
    this.deleteSubscription = this.deleteSubscription.bind(this)
    this.cancelSubscription = this.cancelSubscription.bind(this)
    this.reactivateSubscription = this.reactivateSubscription.bind(this)
    
    // Plan management
    this.getAllPlans = this.getAllPlans.bind(this)
    this.getPlanById = this.getPlanById.bind(this)
    this.createPlan = this.createPlan.bind(this)
    this.updatePlan = this.updatePlan.bind(this)
    this.deletePlan = this.deletePlan.bind(this)
  }

  /**
   * GET /admin/subscriptions
   * Get all subscriptions with admin filters
   */
  async getAllSubscriptions(
    request: Request,
    response: Response<subscriptionAdmin.AdminGetSubscriptionsResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<subscriptionAdmin.AdminGetSubscriptionsQuery>(request)

      // Map API query parameters inline
      const params: AdminSubscriptionSearchParams = {
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
        
        // Filters
        userId: query.userId,
        status: query.status,
        planId: query.planId,
        cancelAtPeriodEnd: query.cancelAtPeriodEnd,
        
        // Date ranges
        createdFromStart: query.fromDate,
        createdFromEnd: query.toDate,
        
        // Admin-specific
        includeDeleted: true,
        includeCancelled: true,
      }

      logger.info('Admin getting subscriptions', { params })

      const result = await this.subscriptionService.getAllSubscriptions(params)
      
      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, SubscriptionMapper.toDTO)
      const validatedResponse = subscriptionAdmin.AdminGetSubscriptionsResponse.parse(responseData)
      
      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/subscriptions/:id
   * Get subscription by ID with admin details
   */
  async getSubscriptionById(
    request: Request<subscriptionCommon.SubscriptionIdParam>,
    response: Response<subscriptionAdmin.AdminSubscriptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Admin getting subscription by ID', { id })

      const subscription = await this.subscriptionService.getSubscriptionById(id)
      if (!subscription) {
        return next(ErrorFactory.notFound('Subscription', id))
      }

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = subscriptionAdmin.AdminSubscriptionResponse.parse(dto)
      
      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/subscriptions
   * Create subscription (admin can create for any user)
   */
  async createSubscription(
    request: Request<{}, {}, subscriptionAdmin.AdminCreateSubscriptionRequest>,
    response: Response<subscriptionAdmin.AdminSubscriptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body

      logger.info('Admin creating subscription', { userId: data.userId, planId: data.planId })

      const subscription = await this.subscriptionService.createSubscription(
        data.userId,
        {
          planId: data.planId,
          stripeCustomerId: data.stripeCustomerId,
          trialEnd: data.trialEnd,
          metadata: data.metadata,
        }
      )

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = subscriptionAdmin.AdminSubscriptionResponse.parse(dto)
      
      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/subscriptions/:id
   * Update subscription with admin privileges
   */
  async updateSubscription(
    request: Request<
      subscriptionCommon.SubscriptionIdParam,
      {},
      subscriptionAdmin.AdminUpdateSubscriptionRequest
    >,
    response: Response<subscriptionAdmin.AdminSubscriptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const data = request.body

      logger.info('Admin updating subscription', { id })

      const subscription = await this.subscriptionService.updateSubscription(id, data)

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = subscriptionAdmin.AdminSubscriptionResponse.parse(dto)
      
      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/subscriptions/:id
   * Delete subscription (soft delete)
   */
  async deleteSubscription(
    request: Request<subscriptionCommon.SubscriptionIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Admin deleting subscription', { id })

      await this.subscriptionService.deleteSubscription(id)
      
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/subscriptions/:id/cancel
   * Cancel subscription with admin options
   */
  async cancelSubscription(
    request: Request<
      subscriptionCommon.SubscriptionIdParam,
      {},
      subscriptionCommon.CancelSubscriptionRequest
    >,
    response: Response<subscriptionAdmin.AdminSubscriptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const { cancelAtPeriodEnd = true, reason, feedback } = request.body

      logger.info('Admin cancelling subscription', { id, cancelAtPeriodEnd, reason })

      const subscription = await this.subscriptionService.cancelSubscription(
        id,
        cancelAtPeriodEnd,
        { reason, feedback }
      )

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = subscriptionAdmin.AdminSubscriptionResponse.parse(dto)
      
      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/subscriptions/:id/reactivate
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(
    request: Request<subscriptionCommon.SubscriptionIdParam>,
    response: Response<subscriptionAdmin.AdminSubscriptionResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Admin reactivating subscription', { id })

      const subscription = await this.subscriptionService.reactivateSubscription(id)

      const dto = SubscriptionMapper.toDTO(subscription)
      const validatedResponse = subscriptionAdmin.AdminSubscriptionResponse.parse(dto)
      
      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  // ========== Plan Management ==========

  /**
   * GET /admin/subscription-plans
   * Get all plans with admin filters
   */
  async getAllPlans(
    request: Request,
    response: Response<subscriptionAdmin.AdminGetPlansResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getValidatedQuery<subscriptionAdmin.AdminGetPlansQuery>(request)

      // Map API query parameters inline
      const params: PlanSearchParams = {
        page: query.page || 1,
        limit: query.limit || 20,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
        
        // Filters
        isActive: query.isActive,
        interval: query.interval,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        search: query.search,
        
        // Admin-specific
        includeDeleted: true,
        includeInactive: true,
      }

      logger.info('Admin getting plans', { params })

      const result = await this.planService.getAllPlans(params)
      
      // Use paginatedResponse utility + validation
      const responseData = paginatedResponse(result, SubscriptionPlanMapper.toDTO)
      const validatedResponse = subscriptionAdmin.AdminGetPlansResponse.parse(responseData)
      
      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /admin/subscription-plans/:id
   * Get plan by ID
   */
  async getPlanById(
    request: Request<subscriptionCommon.PlanIdParam>,
    response: Response<subscriptionAdmin.AdminPlanResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Admin getting plan by ID', { id })

      const plan = await this.planService.getPlanById(id)
      if (!plan) {
        return next(ErrorFactory.notFound('Plan', id))
      }

      const dto = SubscriptionPlanMapper.toDTO(plan)
      const validatedResponse = subscriptionAdmin.AdminPlanResponse.parse(dto)
      
      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /admin/subscription-plans
   * Create new plan
   */
  async createPlan(
    request: Request<{}, {}, subscriptionAdmin.AdminCreatePlanRequest>,
    response: Response<subscriptionAdmin.AdminPlanResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body

      logger.info('Admin creating plan', { name: data.name })

      const plan = await this.planService.createPlan(data)

      const dto = SubscriptionPlanMapper.toDTO(plan)
      const validatedResponse = subscriptionAdmin.AdminPlanResponse.parse(dto)
      
      response.status(201).json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /admin/subscription-plans/:id
   * Update plan
   */
  async updatePlan(
    request: Request<
      subscriptionCommon.PlanIdParam,
      {},
      subscriptionAdmin.AdminUpdatePlanRequest
    >,
    response: Response<subscriptionAdmin.AdminPlanResponse>,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params
      const data = request.body

      logger.info('Admin updating plan', { id })

      const plan = await this.planService.updatePlan(id, data)

      const dto = SubscriptionPlanMapper.toDTO(plan)
      const validatedResponse = subscriptionAdmin.AdminPlanResponse.parse(dto)
      
      response.json(validatedResponse)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /admin/subscription-plans/:id
   * Delete plan (soft delete)
   */
  async deletePlan(
    request: Request<subscriptionCommon.PlanIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      logger.info('Admin deleting plan', { id })

      await this.planService.deletePlan(id)
      
      response.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}