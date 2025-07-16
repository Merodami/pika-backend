import type { ICacheService } from '@pika'
import { Cache } from '@pika'
import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { ErrorFactory, logger } from '@pikad'
import type { PrismaClient } from '@prisma/client'
import { CACHE_TTL_MULTIPLIERS } from '@subscription/types/constants.js'
import {
    MembershipPackage,
    MembershipType,
    SubscriptionStatus,
} from '@subscription/types/enums.js'
import type { UserMembershipStatus } from '@subscription/types/interfaces.js'

export interface IUserMembershipService {
  getUserMembershipStatus(userId: string): Promise<UserMembershipStatus>
  hasActiveSubscription(userId: string): Promise<boolean>
  canAccessGym(userId: string, accessTime?: Date): Promise<boolean>
  updateUserActiveMembership(userId: string, isActive: boolean): Promise<void>
}

export class UserMembershipService implements IUserMembershipService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache: ICacheService,
  ) {}

  @Cache({
    ttl: REDIS_DEFAULT_TTL * CACHE_TTL_MULTIPLIERS.USER_SUBSCRIPTION,
    prefix: 'user-membership',
  })
  async getUserMembershipStatus(userId: string): Promise<UserMembershipStatus> {
    logger.info('Getting user membership status', { userId })

    try {
      // Get active subscription with plan details
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          userId,
          status: {
            in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING],
          },
        },
        include: {
          plan: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Get user's credit balance
      const credits = await this.prisma.credits.findUnique({
        where: { userId },
      })

      const hasActiveSubscription = !!subscription

      const membershipStatus: UserMembershipStatus = {
        hasActiveSubscription,
        subscription: subscription
          ? {
              id: subscription.id,
              status: subscription.status as SubscriptionStatus,
              planId: subscription.planId || '',
              planName: subscription.plan?.name || subscription.planType,
              membershipType: subscription.plan
                ?.membershipType as MembershipType,
              membershipPackage: subscription.plan?.membershipPackage as
                | MembershipPackage
                | undefined,
              currentPeriodEnd: subscription.currentPeriodEnd || undefined,
              cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            }
          : undefined,
        creditBalance: credits
          ? {
              total: credits.amountDemand + credits.amountSub,
              demand: credits.amountDemand,
              subscription: credits.amountSub,
            }
          : undefined,
      }

      return membershipStatus
    } catch (error) {
      logger.error('Failed to get user membership status', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const membershipStatus = await this.getUserMembershipStatus(userId)

    return membershipStatus.hasActiveSubscription
  }

  async canAccessGym(
    userId: string,
    accessTime: Date = new Date(),
  ): Promise<boolean> {
    const membershipStatus = await this.getUserMembershipStatus(userId)

    if (
      !membershipStatus.hasActiveSubscription ||
      !membershipStatus.subscription
    ) {
      return false
    }

    const { subscription } = membershipStatus

    // Check if subscription is active
    if (
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.TRIALING
    ) {
      return false
    }

    // Full access members can always access
    if (subscription.membershipType === MembershipType.FULL_ACCESS) {
      return true
    }

    // For off-peak members, check time restrictions
    if (subscription.membershipType === MembershipType.OFF_PEAK) {
      return this.isWithinOffPeakHours(accessTime)
    }

    return false
  }

  async updateUserActiveMembership(
    userId: string,
    isActive: boolean,
  ): Promise<void> {
    logger.info('Updating user active membership status', { userId, isActive })

    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { activeMembership: isActive },
      })

      // Clear cache
      await this.clearUserMembershipCache(userId)

      logger.info('Updated user active membership status', { userId, isActive })
    } catch (error) {
      logger.error('Failed to update user active membership', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  private isWithinOffPeakHours(accessTime: Date): boolean {
    const dayOfWeek = accessTime.getDay() // 0 = Sunday, 6 = Saturday
    const hours = accessTime.getHours()
    const minutes = accessTime.getMinutes()
    const currentTime = hours * 60 + minutes // Convert to minutes

    // Weekend access (Saturday and Sunday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 8am - 8pm (480 minutes to 1200 minutes)
      return currentTime >= 480 && currentTime <= 1200
    }

    // Weekday access (Monday - Friday)
    // 9am - 4pm (540 minutes to 960 minutes)
    return currentTime >= 540 && currentTime <= 960
  }

  private async clearUserMembershipCache(userId: string): Promise<void> {
    try {
      await this.cache.del(`user-membership:${userId}`)
    } catch (error) {
      logger.error('Failed to clear user membership cache', { userId, error })
    }
  }
}
