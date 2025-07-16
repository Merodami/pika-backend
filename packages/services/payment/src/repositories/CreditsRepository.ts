import type { PrismaClient } from '@prisma/client'
import type { ICacheService } from '@pika/redis'
import type {
  CreateCreditsDTO,
  CreateCreditsHistoryDTO,
  CreditsDomain,
  CreditsHistoryDomain,
  UpdateCreditsDTO,
} from '@pika
import { CreditsHistoryMapper, CreditsMapper } from '@pika
import { BaseError, ErrorFactory } from '@pika

export interface ICreditsRepository {
  findByUserId(userId: string): Promise<CreditsDomain | null>
  create(data: CreateCreditsDTO): Promise<CreditsDomain>
  update(id: string, data: UpdateCreditsDTO): Promise<CreditsDomain>
  delete(id: string): Promise<void>
  createHistoryEntry(
    data: CreateCreditsHistoryDTO,
  ): Promise<CreditsHistoryDomain>
  getHistoryByUserId(userId: string): Promise<CreditsHistoryDomain[]>
  addCredits(
    userId: string,
    amount: number,
    description: string,
    transactionId?: string,
  ): Promise<CreditsDomain>
  consumeCredits(
    userId: string,
    demandAmount: number,
    subAmount: number,
    description: string,
  ): Promise<CreditsDomain>
  consumeCreditsWithPriority(
    userId: string,
    totalAmount: number,
    description: string,
  ): Promise<CreditsDomain>
}

export class CreditsRepository implements ICreditsRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cache?: ICacheService,
  ) {}

  async findByUserId(userId: string): Promise<CreditsDomain | null> {
    try {
      const cacheKey = `credits:user:${userId}`

      if (this.cache) {
        const cached = await this.cache.get<CreditsDomain>(cacheKey)

        if (cached) return cached
      }

      const credits = await this.prisma.credits.findUnique({
        where: { userId },
      })

      if (!credits) return null

      const domain = CreditsMapper.fromDocument(credits)

      if (this.cache) {
        await this.cache.set(cacheKey, domain, 300) // 5 minutes cache
      }

      return domain
    } catch (error) {
      throw ErrorFactory.databaseError(
        'findByUserId',
        'Failed to find credits by user ID',
        error,
      )
    }
  }

  async create(data: CreateCreditsDTO): Promise<CreditsDomain> {
    try {
      const credits = await this.prisma.credits.create({
        data: {
          userId: data.userId,
          amountDemand: data.amountDemand || 0,
          amountSub: data.amountSub || 0,
        },
      })

      // Clear cache for this user
      if (this.cache) {
        await this.cache.del(`credits:user:${data.userId}`)
      }

      return CreditsMapper.fromDocument(credits)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'create',
        'Failed to create credits',
        error,
      )
    }
  }

  async update(id: string, data: UpdateCreditsDTO): Promise<CreditsDomain> {
    try {
      const credits = await this.prisma.credits.update({
        where: { id },
        data: {
          amountDemand: data.amountDemand,
          amountSub: data.amountSub,
        },
      })

      // Clear cache for this user
      if (this.cache) {
        await this.cache.del(`credits:user:${credits.userId}`)
      }

      return CreditsMapper.fromDocument(credits)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'update',
        'Failed to update credits',
        error,
      )
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const credits = await this.prisma.credits.findUnique({ where: { id } })

      if (!credits) {
        throw ErrorFactory.resourceNotFound('Credits', id)
      }

      await this.prisma.credits.delete({
        where: { id },
      })

      // Clear cache for this user
      if (this.cache) {
        await this.cache.del(`credits:user:${credits.userId}`)
      }
    } catch (error) {
      throw ErrorFactory.databaseError(
        'delete',
        'Failed to delete credits',
        error,
      )
    }
  }

  async createHistoryEntry(
    data: CreateCreditsHistoryDTO,
  ): Promise<CreditsHistoryDomain> {
    try {
      const history = await this.prisma.creditsHistory.create({
        data: {
          userId: data.userId,
          creditsId: data.creditsId,
          amount: data.amount,
          description: data.description,
          operation: data.operation,
          type: data.type || 'demand',
          transactionId: data.transactionId,
        },
      })

      return CreditsHistoryMapper.fromDocument(history)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'createHistoryEntry',
        'Failed to create credits history entry',
        error,
      )
    }
  }

  async getHistoryByUserId(userId: string): Promise<CreditsHistoryDomain[]> {
    try {
      const history = await this.prisma.creditsHistory.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      })

      return history.map(CreditsHistoryMapper.fromDocument)
    } catch (error) {
      throw ErrorFactory.databaseError(
        'getHistoryByUserId',
        'Failed to get credits history',
        error,
      )
    }
  }

  async addCredits(
    userId: string,
    amount: number,
    description: string,
    transactionId?: string,
  ): Promise<CreditsDomain> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Find or create credits record
        let credits = await tx.credits.findUnique({
          where: { userId },
        })

        if (!credits) {
          credits = await tx.credits.create({
            data: {
              userId,
              amountDemand: amount,
              amountSub: 0,
            },
          })
        } else {
          credits = await tx.credits.update({
            where: { id: credits.id },
            data: {
              amountDemand: credits.amountDemand + amount,
            },
          })
        }

        // Create history entry
        await tx.creditsHistory.create({
          data: {
            userId,
            creditsId: credits.id,
            amount,
            description,
            operation: 'increase',
            type: 'demand',
            transactionId,
          },
        })

        // Clear cache
        if (this.cache) {
          await this.cache.del(`credits:user:${userId}`)
        }

        return CreditsMapper.fromDocument(credits)
      })
    } catch (error) {
      throw ErrorFactory.databaseError(
        'addCredits',
        'Failed to add credits',
        error,
      )
    }
  }

  async consumeCredits(
    userId: string,
    demandAmount: number,
    subAmount: number,
    description: string,
  ): Promise<CreditsDomain> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const credits = await tx.credits.findUnique({
          where: { userId },
        })

        if (!credits) {
          throw ErrorFactory.resourceNotFound('Credits', userId)
        }

        // Check if user has enough credits (legacy behavior for direct consumption)
        if (
          credits.amountDemand < demandAmount ||
          credits.amountSub < subAmount
        ) {
          throw ErrorFactory.businessRuleViolation(
            'Insufficient credits',
            `User has ${credits.amountDemand} demand credits and ${credits.amountSub} subscription credits`,
          )
        }

        // Update credits
        const updatedCredits = await tx.credits.update({
          where: { id: credits.id },
          data: {
            amountDemand: credits.amountDemand - demandAmount,
            amountSub: credits.amountSub - subAmount,
          },
        })

        // Create history entries for both types if consumed
        if (demandAmount > 0) {
          await tx.creditsHistory.create({
            data: {
              userId,
              creditsId: credits.id,
              amount: -demandAmount,
              description,
              operation: 'decrease',
              type: 'demand',
            },
          })
        }

        if (subAmount > 0) {
          await tx.creditsHistory.create({
            data: {
              userId,
              creditsId: credits.id,
              amount: -subAmount,
              description,
              operation: 'decrease',
              type: 'subscription',
            },
          })
        }

        // Clear cache
        if (this.cache) {
          await this.cache.del(`credits:user:${userId}`)
        }

        return CreditsMapper.fromDocument(updatedCredits)
      })
    } catch (error) {
      // Re-throw BaseError instances (including BusinessRuleViolationError)
      if (error instanceof BaseError) throw error
      throw ErrorFactory.databaseError(
        'consumeCredits',
        'Failed to consume credits',
        error,
      )
    }
  }

  // Smart credit consumption with subscription priority
  async consumeCreditsWithPriority(
    userId: string,
    totalAmount: number,
    description: string,
  ): Promise<CreditsDomain> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const credits = await tx.credits.findUnique({
          where: { userId },
        })

        if (!credits) {
          throw ErrorFactory.resourceNotFound('Credits', userId)
        }

        const totalAvailable = credits.amountDemand + credits.amountSub

        if (totalAvailable < totalAmount) {
          throw ErrorFactory.businessRuleViolation(
            'Insufficient credits',
            `User has ${totalAvailable} total credits, but ${totalAmount} is required`,
          )
        }

        // Priority logic: Use subscription credits first, then demand credits
        let remainingToConsume = totalAmount
        let subCreditsUsed = 0
        let demandCreditsUsed = 0

        // First, use subscription credits
        if (remainingToConsume > 0 && credits.amountSub > 0) {
          subCreditsUsed = Math.min(remainingToConsume, credits.amountSub)
          remainingToConsume -= subCreditsUsed
        }

        // Then, use demand credits for any remaining amount
        if (remainingToConsume > 0 && credits.amountDemand > 0) {
          demandCreditsUsed = Math.min(remainingToConsume, credits.amountDemand)
          remainingToConsume -= demandCreditsUsed
        }

        // Update credits
        const updatedCredits = await tx.credits.update({
          where: { id: credits.id },
          data: {
            amountDemand: credits.amountDemand - demandCreditsUsed,
            amountSub: credits.amountSub - subCreditsUsed,
          },
        })

        // Create history entries for each type consumed
        if (subCreditsUsed > 0) {
          await tx.creditsHistory.create({
            data: {
              userId,
              creditsId: credits.id,
              amount: -subCreditsUsed,
              description: `${description} (${subCreditsUsed} subscription credits)`,
              operation: 'decrease',
              type: 'subscription',
            },
          })
        }

        if (demandCreditsUsed > 0) {
          await tx.creditsHistory.create({
            data: {
              userId,
              creditsId: credits.id,
              amount: -demandCreditsUsed,
              description: `${description} (${demandCreditsUsed} demand credits)`,
              operation: 'decrease',
              type: 'demand',
            },
          })
        }

        // Clear cache
        if (this.cache) {
          await this.cache.del(`credits:user:${userId}`)
        }

        return CreditsMapper.fromDocument(updatedCredits)
      })
    } catch (error) {
      if (error instanceof ErrorFactory) throw error
      throw ErrorFactory.databaseError(
        'consumeCreditsWithPriority',
        'Failed to consume credits with priority',
        error,
      )
    }
  }
}
