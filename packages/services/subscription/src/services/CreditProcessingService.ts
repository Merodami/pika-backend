import type { PrismaClient } from '@prisma/client'
import type { ICacheService } from '@pika/redis'
import type { CreditsDomain, SubscriptionDomain } from '@pika
import { CommunicationServiceClient, logger } from '@pikad'

export interface ICreditProcessingService {
  processSubscriptionCredits(
    subscription: SubscriptionDomain,
    creditsAmount: number,
  ): Promise<{ subscription: SubscriptionDomain; credits: CreditsDomain }>
  calculateNextBillingDate(
    lastProcessedDate: Date,
    billingInterval: string,
  ): Date
  shouldProcessCredits(subscription: SubscriptionDomain): boolean
}

export class CreditProcessingService implements ICreditProcessingService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: ICacheService,
    private readonly communicationClient?: CommunicationServiceClient,
  ) {}

  async processSubscriptionCredits(
    subscription: SubscriptionDomain,
    creditsAmount: number,
  ): Promise<{ subscription: SubscriptionDomain; credits: CreditsDomain }> {
    logger.info('Processing subscription credits', {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      creditsAmount,
    })

    const now = new Date()

    // Start a transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Get or create user credits
      let credits = await tx.credits.findUnique({
        where: { userId: subscription.userId },
      })

      if (!credits) {
        credits = await tx.credits.create({
          data: {
            userId: subscription.userId,
            amountDemand: 0,
            amountSub: 0,
          },
        })
      }

      // Add subscription credits
      const updatedCredits = await tx.credits.update({
        where: { id: credits.id },
        data: {
          amountSub: {
            increment: creditsAmount,
          },
          updatedAt: now,
        },
      })

      // Create credits history entry
      await tx.creditsHistory.create({
        data: {
          userId: subscription.userId,
          creditsId: credits.id,
          amount: creditsAmount,
          description: `Monthly ${subscription.planType} subscription credits`,
          operation: 'increase',
          type: 'subscription',
          date: now,
        },
      })

      // Update subscription last processed date
      const updatedSubscription = await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          lastProcessedAt: now,
          updatedAt: now,
        },
      })

      return {
        subscription: updatedSubscription,
        credits: updatedCredits,
      }
    })

    // Clear cache
    await this.clearUserCreditsCache(subscription.userId)

    logger.info('Successfully processed subscription credits', {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      creditsAdded: creditsAmount,
      newBalance: result.credits.amountSub,
    })

    // Send credit allocation notification
    if (this.communicationClient) {
      await this.sendCreditAllocationEmail(
        subscription.userId,
        creditsAmount,
        result.credits.amountSub,
        subscription.planType,
      )
    }

    return {
      subscription: {
        ...subscription,
        lastProcessedAt: result.subscription.lastProcessedAt || undefined,
        updatedAt: result.subscription.updatedAt,
      },
      credits: {
        id: result.credits.id,
        amountDemand: result.credits.amountDemand,
        amountSub: result.credits.amountSub,
        userId: result.credits.userId,
        createdAt: result.credits.createdAt,
        updatedAt: result.credits.updatedAt,
      },
    }
  }

  calculateNextBillingDate(
    lastProcessedDate: Date,
    billingInterval: string,
  ): Date {
    const nextDate = new Date(lastProcessedDate)

    switch (billingInterval) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
      default:
        // Default to monthly
        nextDate.setMonth(nextDate.getMonth() + 1)
    }

    return nextDate
  }

  shouldProcessCredits(subscription: SubscriptionDomain): boolean {
    // Check if subscription is active
    if (subscription.status !== 'ACTIVE') {
      return false
    }

    // If never processed, should process
    if (!subscription.lastProcessedAt) {
      return true
    }

    // Calculate next billing date
    const now = new Date()
    const lastProcessed = new Date(subscription.lastProcessedAt)
    const nextBillingDate = this.calculateNextBillingDate(
      lastProcessed,
      subscription.billingInterval,
    )

    // Check if it's time to process
    return now >= nextBillingDate
  }

  private async clearUserCreditsCache(userId: string): Promise<void> {
    try {
      await this.cache.del(`credits:user:${userId}`)
    } catch (error) {
      logger.error('Failed to clear user credits cache', { userId, error })
    }
  }

  private async sendCreditAllocationEmail(
    userId: string,
    creditsAdded: number,
    newBalance: number,
    planType: string,
  ): Promise<void> {
    if (!this.communicationClient) return

    try {
      await this.communicationClient.sendTransactionalEmail({
        userId: userId as any,
        templateKey: 'PAYMENT_SUCCESS',
        variables: {
          type: 'Monthly Credits',
          amount: creditsAdded.toString(),
          newBalance: newBalance.toString(),
          planType,
          description: `Your monthly ${planType} subscription credits have been added to your account.`,
        },
        trackOpens: true,
        trackClicks: true,
      })

      logger.info('Credit allocation email sent', {
        userId,
        creditsAdded,
      })
    } catch (error) {
      logger.error('Failed to send credit allocation email', {
        userId,
        creditsAdded,
        error,
      })
      // Don't throw - email failure shouldn't break credit processing
    }
  }
}
