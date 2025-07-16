import {
  CreateCustomerAndMembershipRequest,
  CreateMembershipRequest,
  CreateMembershipSubscriptionRequest,
  MembershipIdParam,
  UpdateMembershipRequest,
  UserIdParam,
} from '@pika/api/public'
import { REDIS_DEFAULT_TTL } from '@pikant'
import { Cache, httpRequestKeyGenerator } from '@pika
import { MembershipMapper } from '@pika
import type { NextFunction, Request, Response } from 'express'
import type Stripe from 'stripe'

import type { IMembershipService } from '../services/MembershipService.js'

/**
 * Handles membership and subscription management
 */
export class MembershipController {
  constructor(private readonly membershipService: IMembershipService) {
    // Bind all methods to preserve 'this' context
    this.getMembershipById = this.getMembershipById.bind(this)
    this.getMembershipByUserId = this.getMembershipByUserId.bind(this)
    this.createMembership = this.createMembership.bind(this)
    this.updateMembership = this.updateMembership.bind(this)
    this.deleteMembership = this.deleteMembership.bind(this)
    this.createCustomerAndMembership =
      this.createCustomerAndMembership.bind(this)
    this.createSubscription = this.createSubscription.bind(this)
    this.cancelSubscription = this.cancelSubscription.bind(this)
    this.handleStripeWebhook = this.handleStripeWebhook.bind(this)
  }

  /**
   * GET /memberships/:id
   * Get membership by ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'membership-by-id',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getMembershipById(
    request: Request<MembershipIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      const membership = await this.membershipService.getMembershipById(id)

      if (!membership) {
        response.status(404).json({ error: 'Membership not found' })

        return
      }

      const dto = MembershipMapper.toDTO(membership)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /memberships/user/:userId
   * Get membership by user ID
   */
  @Cache({
    ttl: REDIS_DEFAULT_TTL,
    prefix: 'membership-by-user',
    keyGenerator: httpRequestKeyGenerator,
  })
  async getMembershipByUserId(
    request: Request<UserIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId } = request.params

      const membership =
        await this.membershipService.getMembershipByUserId(userId)

      if (!membership) {
        response.status(404).json({ error: 'Membership not found for user' })

        return
      }

      const dto = MembershipMapper.toDTO(membership)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /memberships
   * Create new membership
   */
  async createMembership(
    request: Request<{}, {}, CreateMembershipRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const membership = await this.membershipService.createMembership(
        request.body,
      )

      const dto = MembershipMapper.toDTO(membership)

      response.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /memberships/:id
   * Update membership
   */
  async updateMembership(
    request: Request<MembershipIdParam, {}, UpdateMembershipRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      const membership = await this.membershipService.updateMembership(
        id,
        request.body,
      )

      const dto = MembershipMapper.toDTO(membership)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /memberships/:id
   * Delete membership
   */
  async deleteMembership(
    request: Request<MembershipIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = request.params

      await this.membershipService.deleteMembership(id)

      response.json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /memberships/create-customer
   * Create Stripe customer and membership
   */
  async createCustomerAndMembership(
    request: Request<{}, {}, CreateCustomerAndMembershipRequest>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { userId, email, name } = request.body

      const membership =
        await this.membershipService.createStripeCustomerAndMembership(
          userId,
          email,
          name,
        )

      const dto = MembershipMapper.toDTO(membership)

      response.status(201).json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /memberships/:id/subscription
   * Create subscription for membership
   */
  async createSubscription(
    request: Request<
      MembershipIdParam,
      {},
      CreateMembershipSubscriptionRequest
    >,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: membershipId } = request.params
      const { priceId } = request.body

      const membership = await this.membershipService.createSubscription(
        membershipId,
        priceId,
      )

      const dto = MembershipMapper.toDTO(membership)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /memberships/:id/subscription
   * Cancel subscription
   */
  async cancelSubscription(
    request: Request<MembershipIdParam>,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id: membershipId } = request.params

      const membership =
        await this.membershipService.cancelSubscription(membershipId)

      const dto = MembershipMapper.toDTO(membership)

      response.json(dto)
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /memberships/webhook/stripe
   * Handle Stripe webhook events
   */
  async handleStripeWebhook(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const event = request.body as Stripe.Event

      await this.membershipService.handleStripeWebhook(event)

      response.json({ received: true })
    } catch (error) {
      next(error)
    }
  }
}
