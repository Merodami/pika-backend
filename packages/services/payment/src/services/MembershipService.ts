import type { ICacheService } from '@pika/redis'
import type {
  CreateMembershipDTO,
  MembershipDomain,
  UpdateMembershipDTO,
} from '@pika
import { ErrorFactory, logger } from '@pika
import type Stripe from 'stripe'

// Extend Invoice type to include subscription property
type InvoiceWithSubscription = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null
}

import type { IMembershipRepository } from '../repositories/MembershipRepository.js'
import type { IStripeService } from './StripeService.js'

export interface IMembershipService {
  getMembershipById(id: string): Promise<MembershipDomain | null>
  getMembershipByUserId(userId: string): Promise<MembershipDomain | null>
  createMembership(data: CreateMembershipDTO): Promise<MembershipDomain>
  updateMembership(
    id: string,
    data: UpdateMembershipDTO,
  ): Promise<MembershipDomain>
  deleteMembership(id: string): Promise<void>
  // Stripe integration methods
  createStripeCustomerAndMembership(
    userId: string,
    email: string,
    name: string,
  ): Promise<MembershipDomain>
  createSubscription(
    membershipId: string,
    priceId: string,
  ): Promise<MembershipDomain>
  cancelSubscription(membershipId: string): Promise<MembershipDomain>
  handleStripeWebhook(event: Stripe.Event): Promise<void>
}

export class MembershipService implements IMembershipService {
  constructor(
    private readonly membershipRepository: IMembershipRepository,
    private readonly stripeService: IStripeService,
    private readonly cache: ICacheService,
  ) {}

  async getMembershipById(id: string): Promise<MembershipDomain | null> {
    try {
      logger.info('Getting membership by ID', { membershipId: id })

      this.validateMembershipId(id)

      const membership = await this.membershipRepository.findById(id)

      logger.info('Successfully retrieved membership', {
        membershipId: id,
        found: !!membership,
      })

      return membership
    } catch (error) {
      logger.error('Failed to get membership by ID', {
        membershipId: id,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async getMembershipByUserId(
    userId: string,
  ): Promise<MembershipDomain | null> {
    try {
      logger.info('Getting membership by user ID', { userId })

      this.validateUserId(userId)

      const membership = await this.membershipRepository.findByUserId(userId)

      logger.info('Successfully retrieved membership by user ID', {
        userId,
        found: !!membership,
        membershipId: membership?.id,
      })

      return membership
    } catch (error) {
      logger.error('Failed to get membership by user ID', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async createMembership(data: CreateMembershipDTO): Promise<MembershipDomain> {
    try {
      logger.info('Creating membership', { userId: data.userId })

      this.validateCreateMembershipData(data)

      // Check if user already has a membership
      const existingMembership = await this.membershipRepository.findByUserId(
        data.userId,
      )

      if (existingMembership) {
        throw ErrorFactory.businessRuleViolation(
          'User already has membership',
          'Cannot create new membership for user who already has one',
        )
      }

      const membership = await this.membershipRepository.create(data)

      logger.info('Successfully created membership', {
        userId: data.userId,
        membershipId: membership.id,
        stripeCustomerId: membership.stripeCustomerId,
      })

      return membership
    } catch (error) {
      logger.error('Failed to create membership', {
        userId: data.userId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateMembership(
    id: string,
    data: UpdateMembershipDTO,
  ): Promise<MembershipDomain> {
    try {
      logger.info('Updating membership', { membershipId: id })

      this.validateMembershipId(id)
      this.validateUpdateMembershipData(data)

      const membership = await this.membershipRepository.update(id, data)

      logger.info('Successfully updated membership', {
        membershipId: id,
        active: membership.active,
        subscriptionStatus: membership.subscriptionStatus,
      })

      return membership
    } catch (error) {
      logger.error('Failed to update membership', { membershipId: id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteMembership(id: string): Promise<void> {
    try {
      logger.info('Deleting membership', { membershipId: id })

      this.validateMembershipId(id)

      // First, cancel any active subscription
      const membership = await this.membershipRepository.findById(id)

      if (
        membership?.stripeSubscriptionId &&
        membership.subscriptionStatus === 'active'
      ) {
        await this.stripeService.cancelSubscription(
          membership.stripeSubscriptionId,
        )
      }

      await this.membershipRepository.delete(id)

      logger.info('Successfully deleted membership', { membershipId: id })
    } catch (error) {
      logger.error('Failed to delete membership', { membershipId: id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async createStripeCustomerAndMembership(
    userId: string,
    email: string,
    name: string,
  ): Promise<MembershipDomain> {
    try {
      logger.info('Creating Stripe customer and membership', {
        userId,
        email,
        name,
      })

      this.validateUserId(userId)

      if (!email) {
        throw ErrorFactory.validationError({ email: ['Email is required'] })
      }

      if (!name) {
        throw ErrorFactory.validationError({ name: ['Name is required'] })
      }

      // Check if user already has a membership
      const existingMembership =
        await this.membershipRepository.findByUserId(userId)

      if (existingMembership) {
        throw ErrorFactory.businessRuleViolation(
          'User already has membership',
          'Cannot create new membership for user who already has one',
        )
      }

      // Create Stripe customer
      const customer = await this.stripeService.createCustomer(email, name, {
        userId,
        platform: 'Pika',
      })

      // Create membership with Stripe customer ID
      const membershipData: CreateMembershipDTO = {
        userId: userId,
        stripeCustomerId: customer.id,
        active: true,
        subscriptionStatus: 'inactive',
        planType: 'basic',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const membership = await this.membershipRepository.create(membershipData)

      logger.info('Successfully created Stripe customer and membership', {
        userId,
        membershipId: membership.id,
        stripeCustomerId: customer.id,
      })

      return membership
    } catch (error) {
      logger.error('Failed to create Stripe customer and membership', {
        userId,
        email,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async createSubscription(
    membershipId: string,
    priceId: string,
  ): Promise<MembershipDomain> {
    try {
      logger.info('Creating subscription for membership', {
        membershipId,
        priceId,
      })

      this.validateMembershipId(membershipId)

      if (!priceId) {
        throw ErrorFactory.validationError({
          priceId: ['Price ID is required'],
        })
      }

      const membership = await this.membershipRepository.findById(membershipId)

      if (!membership) {
        throw ErrorFactory.resourceNotFound(
          'Membership',
          membershipId || 'unknown',
        )
      }

      if (!membership.stripeCustomerId) {
        throw ErrorFactory.businessRuleViolation(
          'No Stripe customer',
          'Membership must have a Stripe customer ID to create subscription',
        )
      }

      if (membership.stripeSubscriptionId) {
        throw ErrorFactory.businessRuleViolation(
          'Subscription already exists',
          'Membership already has an active subscription',
        )
      }

      // Create Stripe subscription
      const subscription = await this.stripeService.createSubscription(
        membership.stripeCustomerId,
        priceId,
        {
          membershipId,
          userId: membership.userId,
        },
      )

      // Update membership with subscription details
      const updateData: UpdateMembershipDTO = {
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status as any,
        updatedAt: new Date(),
      }

      const updatedMembership = await this.membershipRepository.update(
        membershipId,
        updateData,
      )

      logger.info('Successfully created subscription', {
        membershipId,
        subscriptionId: subscription.id,
        status: subscription.status,
      })

      return updatedMembership
    } catch (error) {
      logger.error('Failed to create subscription', {
        membershipId,
        priceId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async cancelSubscription(membershipId: string): Promise<MembershipDomain> {
    try {
      logger.info('Cancelling subscription for membership', { membershipId })

      this.validateMembershipId(membershipId)

      const membership = await this.membershipRepository.findById(membershipId)

      if (!membership) {
        throw ErrorFactory.resourceNotFound(
          'Membership',
          membershipId || 'unknown',
        )
      }

      if (!membership.stripeSubscriptionId) {
        throw ErrorFactory.businessRuleViolation(
          'No subscription to cancel',
          'Membership does not have an active subscription',
        )
      }

      // Cancel Stripe subscription
      const subscription = await this.stripeService.cancelSubscription(
        membership.stripeSubscriptionId,
      )

      // Update membership with cancelled status
      const updateData: UpdateMembershipDTO = {
        subscriptionStatus: subscription.status as any,
        // subscriptionEndDate: new Date(), // Property not available in DTO
        updatedAt: new Date(),
      }

      const updatedMembership = await this.membershipRepository.update(
        membershipId,
        updateData,
      )

      logger.info('Successfully cancelled subscription', {
        membershipId,
        subscriptionId: subscription.id,
        status: subscription.status,
      })

      return updatedMembership
    } catch (error) {
      logger.error('Failed to cancel subscription', { membershipId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    try {
      logger.info('Handling Stripe webhook', {
        eventType: event.type,
        eventId: event.id,
      })

      switch (event.type) {
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
          )
          break

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
          )
          break

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as InvoiceWithSubscription,
          )
          break

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(
            event.data.object as InvoiceWithSubscription,
          )
          break

        default:
          logger.info('Unhandled webhook event type', { eventType: event.type })
          break
      }

      logger.info('Successfully handled Stripe webhook', {
        eventType: event.type,
        eventId: event.id,
      })
    } catch (error) {
      logger.error('Failed to handle Stripe webhook', {
        eventType: event.type,
        eventId: event.id,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    logger.info('Handling subscription deleted', {
      subscriptionId: subscription.id,
    })

    const membership =
      await this.membershipRepository.findByStripeSubscriptionId(
        subscription.id,
      )

    if (membership) {
      await this.membershipRepository.update(membership.id, {
        subscriptionStatus: 'cancelled',
        // subscriptionEndDate: new Date(), // Property not available in DTO
        updatedAt: new Date(),
      })

      logger.info('Updated membership for deleted subscription', {
        membershipId: membership.id,
        subscriptionId: subscription.id,
      })
    }
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    logger.info('Handling subscription updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
    })

    const membership =
      await this.membershipRepository.findByStripeSubscriptionId(
        subscription.id,
      )

    if (membership) {
      await this.membershipRepository.update(membership.id, {
        subscriptionStatus: subscription.status as any,
        updatedAt: new Date(),
      })

      logger.info('Updated membership for subscription change', {
        membershipId: membership.id,
        subscriptionId: subscription.id,
        newStatus: subscription.status,
      })
    }
  }

  private async handlePaymentSucceeded(
    invoice: InvoiceWithSubscription,
  ): Promise<void> {
    const subscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : typeof invoice.subscription === 'object' && invoice.subscription?.id
          ? invoice.subscription.id
          : undefined

    logger.info('Handling payment succeeded', {
      invoiceId: invoice.id,
      subscriptionId,
    })

    if (subscriptionId) {
      const membership =
        await this.membershipRepository.findByStripeSubscriptionId(
          subscriptionId,
        )

      if (membership) {
        // Update last payment date
        await this.membershipRepository.update(membership.id, {
          lastPaymentDate: new Date(invoice.created * 1000),
          updatedAt: new Date(),
        })

        logger.info('Updated membership for successful payment', {
          membershipId: membership.id,
          invoiceId: invoice.id,
        })
      }
    }
  }

  private async handlePaymentFailed(
    invoice: InvoiceWithSubscription,
  ): Promise<void> {
    const subscriptionId =
      typeof invoice.subscription === 'string'
        ? invoice.subscription
        : typeof invoice.subscription === 'object' && invoice.subscription?.id
          ? invoice.subscription.id
          : undefined

    logger.info('Handling payment failed', {
      invoiceId: invoice.id,
      subscriptionId,
    })

    if (subscriptionId) {
      const membership =
        await this.membershipRepository.findByStripeSubscriptionId(
          subscriptionId,
        )

      if (membership) {
        // Mark subscription as past due if payment failed
        await this.membershipRepository.update(membership.id, {
          subscriptionStatus: 'pastDue',
          updatedAt: new Date(),
        })

        logger.info('Updated membership for failed payment', {
          membershipId: membership.id,
          invoiceId: invoice.id,
        })
      }
    }
  }

  // Validation methods
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw ErrorFactory.validationError({
        userId: ['User ID is required and must be a string'],
      })
    }
  }

  private validateMembershipId(membershipId: string): void {
    if (!membershipId || typeof membershipId !== 'string') {
      throw ErrorFactory.validationError({
        membershipId: ['Membership ID is required and must be a string'],
      })
    }
  }

  private validateCreateMembershipData(data: CreateMembershipDTO): void {
    this.validateUserId(data.userId)

    if (
      data.planType &&
      !['basic', 'premium', 'professional'].includes(data.planType)
    ) {
      throw ErrorFactory.validationError({
        planType: ['Plan type must be one of: basic, premium, professional'],
      })
    }
  }

  private validateUpdateMembershipData(data: UpdateMembershipDTO): void {
    if (
      data.planType &&
      !['basic', 'premium', 'professional'].includes(data.planType)
    ) {
      throw ErrorFactory.validationError({
        planType: ['Plan type must be one of: basic, premium, professional'],
      })
    }

    if (
      data.subscriptionStatus &&
      !['active', 'inactive', 'cancelled', 'pastDue', 'unpaid'].includes(
        data.subscriptionStatus,
      )
    ) {
      throw ErrorFactory.validationError({
        subscriptionStatus: [
          'Subscription status must be one of: active, inactive, cancelled, pastDue, unpaid',
        ],
      })
    }
  }
}
