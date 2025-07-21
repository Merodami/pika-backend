import { subscriptionInternal } from '@pika/api'
import type { CommunicationServiceClient } from '@pika/shared'
import { ErrorFactory, logger } from '@pika/shared'
import type { NextFunction, Request, Response } from 'express'

import type { ISubscriptionRepository } from '../repositories/SubscriptionRepository.js'
import type { ISubscriptionService } from '../services/SubscriptionService.js'
import { TEMPLATE_KEYS } from '../types/constants.js'

/**
 * Handles internal subscription operations for service-to-service communication
 */
export class InternalSubscriptionController {
  constructor(
    private readonly subscriptionService: ISubscriptionService,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly communicationClient: CommunicationServiceClient,
  ) {
    // Bind methods to preserve context
    this.processWebhook = this.processWebhook.bind(this)
    this.updateFromPayment = this.updateFromPayment.bind(this)
    this.checkAccess = this.checkAccess.bind(this)
    this.getByStripeId = this.getByStripeId.bind(this)
    this.getUserSubscriptions = this.getUserSubscriptions.bind(this)
    this.sendNotification = this.sendNotification.bind(this)
  }

  /**
   * POST /internal/subscriptions/webhook
   * Process subscription webhook events
   */
  async processWebhook(
    request: Request<
      {},
      {},
      subscriptionInternal.ProcessSubscriptionWebhookRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { event } = request.body

      logger.info('Processing subscription webhook', {
        type: event.type,
        created: new Date(event.created * 1000),
      })

      const processed = false

      let subscriptionId: string | undefined
      let action: string | undefined

      // Handle different webhook event types
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          // These should be handled by payment service creating/updating via API
          action = 'subscription_sync'
          break

        case 'customer.subscription.deleted':
          // Handle cancellation
          action = 'subscription_cancelled'
          break

        case 'customer.subscription.trial_will_end':
          // Send trial ending notification
          action = 'trial_ending_notification'
          break

        case 'invoice.payment_failed':
          // Send payment failed notification
          action = 'payment_failed_notification'
          break

        case 'invoice.payment_succeeded':
          // Process credits if needed
          action = 'process_credits'
          break
      }

      response.json({
        processed,
        subscriptionId,
        action,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /internal/subscriptions/update-from-payment
   * Update subscription from payment service
   */
  async updateFromPayment(
    request: Request<
      {},
      {},
      subscriptionInternal.UpdateSubscriptionFromPaymentRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = request.body

      logger.info('Updating subscription from payment service', {
        stripeSubscriptionId: data.stripeSubscriptionId,
        status: data.status,
      })

      const subscription =
        await this.subscriptionRepository.findByStripeSubscriptionId(
          data.stripeSubscriptionId,
        )

      if (!subscription) {
        throw ErrorFactory.resourceNotFound(
          'Subscription',
          data.stripeSubscriptionId,
        )
      }

      await this.subscriptionService.updateSubscription(subscription.id, {
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelledAt: data.canceledAt,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
        metadata: data.metadata,
      })

      response.json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/subscriptions/check-access
   * Check subscription access for features
   */
  async checkAccess(
    request: Request<
      {},
      {},
      subscriptionInternal.CheckSubscriptionAccessRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, feature, requiredPlan } = request.body

      const subscription =
        await this.subscriptionService.getUserActiveSubscription(userId)

      if (!subscription || !subscription.plan) {
        response.json({
          hasAccess: false,
          reason: 'No active subscription',
        })

        return
      }

      // Check if plan matches if required
      if (requiredPlan && subscription.plan.name !== requiredPlan) {
        response.json({
          hasAccess: false,
          subscription: {
            id: subscription.id,
            planId: subscription.planId,
            planName: subscription.plan.name,
            status: subscription.status,
            features: subscription.plan.features,
          },
          reason: `Required plan: ${requiredPlan}`,
        })

        return
      }

      // Check if feature is included
      if (feature && !subscription.plan.features.includes(feature)) {
        response.json({
          hasAccess: false,
          subscription: {
            id: subscription.id,
            planId: subscription.planId,
            planName: subscription.plan.name,
            status: subscription.status,
            features: subscription.plan.features,
          },
          reason: `Feature not included: ${feature}`,
        })

        return
      }

      response.json({
        hasAccess: true,
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          planName: subscription.plan.name,
          status: subscription.status,
          features: subscription.plan.features,
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/subscriptions/by-stripe-id/:stripeSubscriptionId
   * Get subscription by Stripe ID
   */
  async getByStripeId(
    request: Request<subscriptionInternal.StripeSubscriptionIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { stripeSubscriptionId } = request.params

      const subscription =
        await this.subscriptionRepository.findByStripeSubscriptionId(
          stripeSubscriptionId,
        )

      if (!subscription) {
        throw ErrorFactory.resourceNotFound(
          'Subscription',
          stripeSubscriptionId,
        )
      }

      response.json(subscription)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /internal/subscriptions/by-user/:userId
   * Get user's subscriptions
   */
  async getUserSubscriptions(
    request: Request<subscriptionInternal.SubscriptionByUserIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = request.params
      const includeInactive = request.query.includeInactive === 'true'

      const subscriptions = await this.subscriptionRepository.findAll({
        userId,
        status: includeInactive ? undefined : 'ACTIVE',
      })

      response.json({
        subscriptions: subscriptions.data.map((sub) => ({
          id: sub.id,
          userId: sub.userId,
          planId: sub.planId,
          planName: 'Unknown Plan', // planType field removed
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          createdAt: sub.createdAt,
        })),
        total: subscriptions.pagination.total,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /internal/subscriptions/notify
   * Send subscription notification
   */
  async sendNotification(
    request: Request<
      {},
      {},
      subscriptionInternal.SendSubscriptionNotificationRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, type, subscriptionData } = request.body

      logger.info('Sending subscription notification', { userId, type })

      // Map notification type to template key
      let templateKey: typeof TEMPLATE_KEYS[keyof typeof TEMPLATE_KEYS]

      switch (type) {
        case 'created':
          templateKey = TEMPLATE_KEYS.SUBSCRIPTION_ACTIVATED
          break
        case 'cancelled':
          templateKey = TEMPLATE_KEYS.SUBSCRIPTION_CANCELLED
          break
        case 'paymentFailed':
          templateKey = TEMPLATE_KEYS.PAYMENT_FAILED
          break
        case 'creditsAllocated':
          templateKey = TEMPLATE_KEYS.CREDITS_ALLOCATED
          break
        case 'renewalReminder':
          templateKey = TEMPLATE_KEYS.RENEWAL_REMINDER
          break
        case 'trialEnding':
          templateKey = TEMPLATE_KEYS.TRIAL_ENDING
          break
        default:
          throw ErrorFactory.badRequest(`Unknown notification type: ${type}`)
      }

      await this.communicationClient.sendTransactionalEmail({
        userId,
        templateKey,
        variables: subscriptionData,
        trackOpens: true,
        trackClicks: true,
      })

      response.json({ success: true })
    } catch (error) {
      next(error)
    }
  }
}
