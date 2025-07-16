import type { PrismaClient } from '@prisma/client'
import type { ICacheService } from '@pika/redis'
import type {
  CreateMembershipDTO,
  MembershipDomain,
  UpdateMembershipDTO,
} from '@pika
import { MembershipMapper } from '@pika
import { ErrorFactory, logger } from '@pika

export interface IMembershipRepository {
  findById(id: string): Promise<MembershipDomain | null>
  findByUserId(userId: string): Promise<MembershipDomain | null>
  findByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<MembershipDomain | null>
  findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<MembershipDomain | null>
  create(data: CreateMembershipDTO): Promise<MembershipDomain>
  update(id: string, data: UpdateMembershipDTO): Promise<MembershipDomain>
  delete(id: string): Promise<void>
}

export class MembershipRepository implements IMembershipRepository {
  private readonly cacheKeyPrefix = 'membership'
  private readonly defaultTTL = 3600 // 1 hour

  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findById(id: string): Promise<MembershipDomain | null> {
    try {
      logger.info('Finding membership by ID', { membershipId: id })

      const cacheKey = `${this.cacheKeyPrefix}:id:${id}`

      if (this.cache) {
        const cached = await this.cache.get<MembershipDomain>(cacheKey)

        if (cached) {
          logger.info('Membership found in cache', { membershipId: id })

          return cached
        }
      }

      const membership = await this.prisma.membership.findUnique({
        where: { id },
      })

      if (!membership) {
        logger.info('Membership not found', { membershipId: id })

        return null
      }

      const domain = MembershipMapper.fromDocument(membership)

      if (this.cache) {
        await this.cache.set(cacheKey, domain, this.defaultTTL)
      }

      logger.info('Successfully found membership', { membershipId: id })

      return domain
    } catch (error) {
      logger.error('Failed to find membership by ID', {
        membershipId: id,
        error,
      })
      throw ErrorFactory.databaseError(
        'findById',
        'Failed to find membership',
        error,
      )
    }
  }

  async findByUserId(userId: string): Promise<MembershipDomain | null> {
    try {
      logger.info('Finding membership by user ID', { userId })

      const cacheKey = `${this.cacheKeyPrefix}:userId:${userId}`

      if (this.cache) {
        const cached = await this.cache.get<MembershipDomain>(cacheKey)

        if (cached) {
          logger.info('Membership found in cache by user ID', { userId })

          return cached
        }
      }

      const membership = await this.prisma.membership.findUnique({
        where: { userId },
      })

      if (!membership) {
        logger.info('Membership not found for user', { userId })

        return null
      }

      const domain = MembershipMapper.fromDocument(membership)

      if (this.cache) {
        // Cache both by ID and user ID
        await this.cache.set(cacheKey, domain, this.defaultTTL)
        await this.cache.set(
          `${this.cacheKeyPrefix}:id:${domain.id}`,
          domain,
          this.defaultTTL,
        )
      }

      logger.info('Successfully found membership by user ID', {
        userId,
        membershipId: domain.id,
      })

      return domain
    } catch (error) {
      logger.error('Failed to find membership by user ID', { userId, error })
      throw ErrorFactory.databaseError(
        'findByUserId',
        'Failed to find membership by user ID',
        error,
      )
    }
  }

  async findByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<MembershipDomain | null> {
    try {
      logger.info('Finding membership by Stripe customer ID', {
        stripeCustomerId,
      })

      const cacheKey = `${this.cacheKeyPrefix}:stripeCustomerId:${stripeCustomerId}`

      if (this.cache) {
        const cached = await this.cache.get<MembershipDomain>(cacheKey)

        if (cached) {
          logger.info('Membership found in cache by Stripe customer ID', {
            stripeCustomerId,
          })

          return cached
        }
      }

      const membership = await this.prisma.membership.findUnique({
        where: { stripeCustomerId },
      })

      if (!membership) {
        logger.info('Membership not found for Stripe customer', {
          stripeCustomerId,
        })

        return null
      }

      const domain = MembershipMapper.fromDocument(membership)

      if (this.cache) {
        await this.cache.set(cacheKey, domain, this.defaultTTL)
      }

      logger.info('Successfully found membership by Stripe customer ID', {
        stripeCustomerId,
        membershipId: domain.id,
      })

      return domain
    } catch (error) {
      logger.error('Failed to find membership by Stripe customer ID', {
        stripeCustomerId,
        error,
      })
      throw ErrorFactory.databaseError(
        'findByStripeCustomerId',
        'Failed to find membership by Stripe customer ID',
        error,
      )
    }
  }

  async findByStripeSubscriptionId(
    stripeSubscriptionId: string,
  ): Promise<MembershipDomain | null> {
    try {
      logger.info('Finding membership by Stripe subscription ID', {
        stripeSubscriptionId,
      })

      const cacheKey = `${this.cacheKeyPrefix}:stripeSubscriptionId:${stripeSubscriptionId}`

      if (this.cache) {
        const cached = await this.cache.get<MembershipDomain>(cacheKey)

        if (cached) {
          logger.info('Membership found in cache by Stripe subscription ID', {
            stripeSubscriptionId,
          })

          return cached
        }
      }

      const membership = await this.prisma.membership.findFirst({
        where: { stripeSubscriptionId },
      })

      if (!membership) {
        logger.info('Membership not found for Stripe subscription', {
          stripeSubscriptionId,
        })

        return null
      }

      const domain = MembershipMapper.fromDocument(membership)

      if (this.cache) {
        await this.cache.set(cacheKey, domain, this.defaultTTL)
      }

      logger.info('Successfully found membership by Stripe subscription ID', {
        stripeSubscriptionId,
        membershipId: domain.id,
      })

      return domain
    } catch (error) {
      logger.error('Failed to find membership by Stripe subscription ID', {
        stripeSubscriptionId,
        error,
      })
      throw ErrorFactory.databaseError(
        'findByStripeSubscriptionId',
        'Failed to find membership by Stripe subscription ID',
        error,
      )
    }
  }

  async create(data: CreateMembershipDTO): Promise<MembershipDomain> {
    try {
      logger.info('Creating membership', { userId: data.userId })

      const membership = await this.prisma.membership.create({
        data: {
          userId: data.userId,
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          active: data.active ?? true,
          subscriptionStatus: data.subscriptionStatus ?? 'inactive',
          planType: data.planType ?? 'basic',
          // Date fields (subscriptionStartDate, subscriptionEndDate, lastPaymentDate)
          // are set later based on business events, not during creation
          createdAt: data.createdAt ?? new Date(),
          updatedAt: data.updatedAt ?? new Date(),
        },
      })

      const domain = MembershipMapper.fromDocument(membership)

      // Cache the new membership
      if (this.cache) {
        await this.cache.set(
          `${this.cacheKeyPrefix}:id:${domain.id}`,
          domain,
          this.defaultTTL,
        )
        await this.cache.set(
          `${this.cacheKeyPrefix}:userId:${domain.userId}`,
          domain,
          this.defaultTTL,
        )

        if (domain.stripeCustomerId) {
          await this.cache.set(
            `${this.cacheKeyPrefix}:stripeCustomerId:${domain.stripeCustomerId}`,
            domain,
            this.defaultTTL,
          )
        }

        if (domain.stripeSubscriptionId) {
          await this.cache.set(
            `${this.cacheKeyPrefix}:stripeSubscriptionId:${domain.stripeSubscriptionId}`,
            domain,
            this.defaultTTL,
          )
        }
      }

      logger.info('Successfully created membership', {
        membershipId: domain.id,
        userId: domain.userId,
      })

      return domain
    } catch (error) {
      logger.error('Failed to create membership', {
        userId: data.userId,
        error,
      })
      throw ErrorFactory.databaseError(
        'create',
        'Failed to create membership',
        error,
      )
    }
  }

  async update(
    id: string,
    data: UpdateMembershipDTO,
  ): Promise<MembershipDomain> {
    try {
      logger.info('Updating membership', { membershipId: id })

      const membership = await this.prisma.membership.update({
        where: { id },
        data: {
          stripeCustomerId: data.stripeCustomerId,
          stripeSubscriptionId: data.stripeSubscriptionId,
          active: data.active,
          subscriptionStatus: data.subscriptionStatus,
          planType: data.planType,
          lastPaymentDate: data.lastPaymentDate,
          // subscriptionStartDate and subscriptionEndDate are not in UpdateMembershipDTO
          // They are managed through Stripe webhooks and business events
          updatedAt: data.updatedAt ?? new Date(),
        },
      })

      const domain = MembershipMapper.fromDocument(membership)

      // Update cache
      if (this.cache) {
        await this.cache.set(
          `${this.cacheKeyPrefix}:id:${domain.id}`,
          domain,
          this.defaultTTL,
        )
        await this.cache.set(
          `${this.cacheKeyPrefix}:userId:${domain.userId}`,
          domain,
          this.defaultTTL,
        )

        if (domain.stripeCustomerId) {
          await this.cache.set(
            `${this.cacheKeyPrefix}:stripeCustomerId:${domain.stripeCustomerId}`,
            domain,
            this.defaultTTL,
          )
        }

        if (domain.stripeSubscriptionId) {
          await this.cache.set(
            `${this.cacheKeyPrefix}:stripeSubscriptionId:${domain.stripeSubscriptionId}`,
            domain,
            this.defaultTTL,
          )
        } else {
          // Remove subscription ID cache if subscription was removed
          // Note: Since we can't list keys, we'll just try to delete the specific key
          // if we know the old subscription ID
          const oldMembership = await this.findById(id)

          if (oldMembership?.stripeSubscriptionId) {
            await this.cache.del(
              `${this.cacheKeyPrefix}:stripeSubscriptionId:${oldMembership.stripeSubscriptionId}`,
            )
          }
        }
      }

      logger.info('Successfully updated membership', { membershipId: id })

      return domain
    } catch (error) {
      logger.error('Failed to update membership', { membershipId: id, error })
      throw ErrorFactory.databaseError(
        'update',
        'Failed to update membership',
        error,
      )
    }
  }

  async delete(id: string): Promise<void> {
    try {
      logger.info('Deleting membership', { membershipId: id })

      // Get membership first to clear cache properly
      const membership = await this.findById(id)

      await this.prisma.membership.delete({
        where: { id },
      })

      // Clear cache
      if (this.cache && membership) {
        await this.cache.del(`${this.cacheKeyPrefix}:id:${membership.id}`)
        await this.cache.del(
          `${this.cacheKeyPrefix}:userId:${membership.userId}`,
        )

        if (membership.stripeCustomerId) {
          await this.cache.del(
            `${this.cacheKeyPrefix}:stripeCustomerId:${membership.stripeCustomerId}`,
          )
        }

        if (membership.stripeSubscriptionId) {
          await this.cache.del(
            `${this.cacheKeyPrefix}:stripeSubscriptionId:${membership.stripeSubscriptionId}`,
          )
        }
      }

      logger.info('Successfully deleted membership', { membershipId: id })
    } catch (error) {
      logger.error('Failed to delete membership', { membershipId: id, error })
      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete membership',
        error,
      )
    }
  }
}
