import type { ICacheService } from '@pika/redis'
import type {
  CreateCreditsDTO,
  CreditsDomain,
  CreditsHistoryDomain,
  UpdateCreditsDTO,
} from '@pika
import { ErrorFactory, logger } from '@pika
import { RequestContextStore } from '@pika
import { UserRole } from '@pika

import type { ICreditsRepository } from '../repositories/CreditsRepository.js'
import type { IPromoCodeRepository } from '../repositories/PromoCodeRepository.js'
import type { IStripeService } from './StripeService.js'
import type { ITransactionService } from './TransactionService.js'

export interface ICreditsService {
  getUserCredits(userId: string): Promise<CreditsDomain | null>
  getUserCreditsHistory(userId: string): Promise<CreditsHistoryDomain[]>
  createUserCredits(data: CreateCreditsDTO): Promise<CreditsDomain>
  updateUserCredits(id: string, data: UpdateCreditsDTO): Promise<CreditsDomain>
  deleteUserCredits(id: string): Promise<void>
  addCreditsToUser(
    userId: string,
    amount: number,
    description: string,
    promoCode?: string,
    transactionId?: string,
  ): Promise<CreditsDomain>
  addCreditsService(
    data: CreateCreditsDTO,
    promoCode?: string,
    price?: number,
  ): Promise<CreditsDomain> // Legacy-compatible with Stripe
  consumeUserCredits(
    userId: string,
    demandAmount: number,
    subAmount: number,
    description: string,
  ): Promise<CreditsDomain>
  consumeUserCreditsWithPriority(
    userId: string,
    totalAmount: number,
    description: string,
  ): Promise<CreditsDomain> // Smart consumption
  transferCredits(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
  ): Promise<{ from: CreditsDomain; to: CreditsDomain }>
}

export class CreditsService implements ICreditsService {
  constructor(
    private readonly creditsRepository: ICreditsRepository,
    private readonly promoCodeRepository: IPromoCodeRepository,
    private readonly cache: ICacheService,
    private readonly stripeService: IStripeService,
    private readonly transactionService: ITransactionService,
  ) {}

  async getUserCredits(userId: string): Promise<CreditsDomain | null> {
    try {
      logger.info('Getting user credits', { userId })

      this.validateUserId(userId)

      const credits = await this.creditsRepository.findByUserId(userId)

      logger.info('Successfully retrieved user credits', {
        userId,
        hasCredits: !!credits,
        demandCredits: credits?.amountDemand,
        subCredits: credits?.amountSub,
      })

      return credits
    } catch (error) {
      logger.error('Failed to get user credits', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async getUserCreditsHistory(userId: string): Promise<CreditsHistoryDomain[]> {
    try {
      logger.info('Getting user credits history', { userId })

      this.validateUserId(userId)

      const history = await this.creditsRepository.getHistoryByUserId(userId)

      logger.info('Successfully retrieved user credits history', {
        userId,
        historyCount: history.length,
      })

      return history
    } catch (error) {
      logger.error('Failed to get user credits history', { userId, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async createUserCredits(data: CreateCreditsDTO): Promise<CreditsDomain> {
    try {
      logger.info('Creating user credits', { userId: data.userId })

      this.validateCreateCreditsData(data)

      const existingCredits = await this.creditsRepository.findByUserId(
        data.userId,
      )

      if (existingCredits) {
        throw ErrorFactory.businessRuleViolation(
          'User already has credits',
          'Cannot create new credits for user who already has credits',
        )
      }

      const credits = await this.creditsRepository.create(data)

      logger.info('Successfully created user credits', {
        userId: data.userId,
        creditsId: credits.id,
        demandCredits: credits.amountDemand,
        subCredits: credits.amountSub,
      })

      return credits
    } catch (error) {
      logger.error('Failed to create user credits', {
        userId: data.userId,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async updateUserCredits(
    id: string,
    data: UpdateCreditsDTO,
  ): Promise<CreditsDomain> {
    try {
      logger.info('Updating user credits', { creditsId: id })

      this.validateCreditsId(id)
      this.validateUpdateCreditsData(data)

      const credits = await this.creditsRepository.update(id, data)

      logger.info('Successfully updated user credits', {
        creditsId: id,
        demandCredits: credits.amountDemand,
        subCredits: credits.amountSub,
      })

      return credits
    } catch (error) {
      logger.error('Failed to update user credits', { creditsId: id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async deleteUserCredits(id: string): Promise<void> {
    try {
      logger.info('Deleting user credits', { creditsId: id })

      this.validateCreditsId(id)

      await this.creditsRepository.delete(id)

      logger.info('Successfully deleted user credits', { creditsId: id })
    } catch (error) {
      logger.error('Failed to delete user credits', { creditsId: id, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async addCreditsToUser(
    userId: string,
    amount: number,
    description: string,
    promoCode?: string,
    transactionId?: string,
  ): Promise<CreditsDomain> {
    try {
      logger.info('Adding credits to user', {
        userId,
        amount,
        promoCode,
        transactionId,
      })

      this.validateUserId(userId)
      this.validateAmount(amount)
      this.validateDescription(description)

      let finalAmount = amount
      let finalDescription = description

      if (promoCode) {
        const validation = await this.promoCodeRepository.isCodeValidForUser(
          promoCode,
          userId,
        )

        if (!validation.valid) {
          throw ErrorFactory.businessRuleViolation(
            'Invalid promo code',
            validation.reason || 'Promo code is not valid',
          )
        }

        const { promoCode: usedPromoCode } =
          await this.promoCodeRepository.usePromoCode(
            promoCode,
            userId,
            transactionId,
          )

        const discountAmount = Math.floor(
          (amount * usedPromoCode.discount) / 100,
        )

        finalAmount = amount + discountAmount
        finalDescription = `${description} (with ${usedPromoCode.discount}% bonus from promo code ${promoCode})`

        logger.info('Applied promo code discount', {
          userId,
          promoCode,
          originalAmount: amount,
          bonusAmount: discountAmount,
          finalAmount,
        })
      }

      const credits = await this.creditsRepository.addCredits(
        userId,
        finalAmount,
        finalDescription,
        transactionId,
      )

      logger.info('Successfully added credits to user', {
        userId,
        addedAmount: finalAmount,
        newBalance: credits.amountDemand + credits.amountSub,
        transactionId,
      })

      return credits
    } catch (error) {
      logger.error('Failed to add credits to user', { userId, amount, error })
      throw ErrorFactory.fromError(error)
    }
  }

  async consumeUserCredits(
    userId: string,
    demandAmount: number,
    subAmount: number,
    description: string,
  ): Promise<CreditsDomain> {
    try {
      logger.info('Consuming user credits', { userId, demandAmount, subAmount })

      this.validateUserId(userId)
      this.validateAmount(demandAmount)
      this.validateAmount(subAmount)
      this.validateDescription(description)

      if (demandAmount === 0 && subAmount === 0) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid credit consumption',
          'At least one of demand or subscription credits must be greater than 0',
        )
      }

      const credits = await this.creditsRepository.consumeCredits(
        userId,
        demandAmount,
        subAmount,
        description,
      )

      logger.info('Successfully consumed user credits', {
        userId,
        consumedDemand: demandAmount,
        consumedSub: subAmount,
        remainingDemand: credits.amountDemand,
        remainingSub: credits.amountSub,
      })

      return credits
    } catch (error) {
      logger.error('Failed to consume user credits', {
        userId,
        demandAmount,
        subAmount,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async consumeUserCreditsWithPriority(
    userId: string,
    totalAmount: number,
    description: string,
  ): Promise<CreditsDomain> {
    try {
      logger.info('Consuming user credits with priority (subscription first)', {
        userId,
        totalAmount,
      })

      this.validateUserId(userId)
      this.validateAmount(totalAmount)
      this.validateDescription(description)

      if (totalAmount === 0) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid credit consumption',
          'Total amount must be greater than 0',
        )
      }

      const credits = await this.creditsRepository.consumeCreditsWithPriority(
        userId,
        totalAmount,
        description,
      )

      logger.info('Successfully consumed user credits with priority', {
        userId,
        totalConsumed: totalAmount,
        remainingDemand: credits.amountDemand,
        remainingSub: credits.amountSub,
        totalRemaining: credits.amountDemand + credits.amountSub,
      })

      return credits
    } catch (error) {
      logger.error('Failed to consume user credits with priority', {
        userId,
        totalAmount,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  async transferCredits(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
  ): Promise<{ from: CreditsDomain; to: CreditsDomain }> {
    try {
      logger.info(
        'Transferring credits between users using transaction service',
        { fromUserId, toUserId, amount },
      )

      this.validateUserId(fromUserId)
      this.validateUserId(toUserId)
      this.validateAmount(amount)
      this.validateDescription(description)

      // Validate user role - only members and professionals can transfer credits
      const user = RequestContextStore.getUser()

      if (
        user &&
        ![UserRole.MEMBER, UserRole.PROFESSIONAL, UserRole.ADMIN].includes(
          user.roles?.[0] as UserRole,
        )
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid user role for credit transfer',
          'Only members and professionals can transfer credits',
        )
      }

      // Role-specific transfer limits
      if (user?.roles?.[0] === UserRole.MEMBER && amount > 50) {
        throw ErrorFactory.businessRuleViolation(
          'Transfer limit exceeded',
          'Members can only transfer up to 50 credits at a time',
        )
      }

      // Use TransactionService for atomic transfer processing
      const result =
        await this.transactionService.executeCreditsTransferTransaction(
          fromUserId,
          toUserId,
          amount,
          description,
        )

      // Clear cache for both users after successful transaction
      if (this.cache) {
        await this.cache.del(`credits:user:${fromUserId}`)
        await this.cache.del(`credits:user:${toUserId}`)
      }

      logger.info(
        'Successfully transferred credits using transaction service',
        {
          fromUserId,
          toUserId,
          amount,
          fromRemainingBalance:
            result.from.amountDemand + result.from.amountSub,
          toNewBalance: result.to.amountDemand + result.to.amountSub,
        },
      )

      return result
    } catch (error) {
      logger.error('Failed to transfer credits using transaction service', {
        fromUserId,
        toUserId,
        amount,
        error,
      })
      throw ErrorFactory.fromError(error)
    }
  }

  // Legacy-compatible addCreditsService with Stripe integration and atomic transactions
  async addCreditsService(
    data: CreateCreditsDTO,
    promoCode?: string,
    price?: number,
  ): Promise<CreditsDomain> {
    try {
      logger.info(
        'Adding credits with Stripe payment using transaction service',
        {
          userId: data.userId,
          amount: data.amountDemand,
          promoCode,
          price,
        },
      )

      // Validate user role - only members and professionals can purchase credits
      const user = RequestContextStore.getUser()

      if (
        user &&
        ![UserRole.MEMBER, UserRole.PROFESSIONAL, UserRole.ADMIN].includes(
          user.roles?.[0] as UserRole,
        )
      ) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid user role for credit purchase',
          'Only members and professionals can purchase credits',
        )
      }

      // Role-specific validation
      if (
        user?.roles?.[0] === UserRole.PROFESSIONAL &&
        data.amountDemand &&
        data.amountDemand > 100
      ) {
        logger.warn('Professional purchasing large amount of credits', {
          userId: data.userId,
          amount: data.amountDemand,
          userRole: user.roles?.[0],
        })
      }

      const amount = data.amountDemand || 0
      const promoCodeText = promoCode ? ` (with promo code ${promoCode})` : ''
      const description = `Added ${amount} on demand credits.${promoCodeText}`

      // Use TransactionService for atomic payment processing
      const result = await this.transactionService.executePaymentTransaction({
        userId: data.userId,
        amount,
        description,
        promoCode,
        price,
        stripeMetadata: {
          amountDemand: data.amountDemand?.toString() || '0',
          amountSub: data.amountSub?.toString() || '0',
        },
      })

      // Clear cache for this user after successful transaction
      if (this.cache) {
        await this.cache.del(`credits:user:${data.userId}`)
      }

      logger.info('Successfully added credits using transaction service', {
        userId: data.userId,
        creditsId: result.credits.id,
        amount,
        paymentIntentId: result.paymentIntentId,
        promoCodeUsed: !!result.promoCodeUsed,
        finalPrice: result.finalPrice,
        discountAmount: result.discountAmount,
      })

      return result.credits
    } catch (error) {
      logger.error(
        'Failed to add credits with payment using transaction service',
        {
          userId: data.userId,
          amount: data.amountDemand,
          error,
        },
      )

      // Re-throw promo code errors exactly as they are
      if (
        error instanceof Error &&
        (error.message === 'Promotional code does not exists.' ||
          error.message === 'Unavailable promotional code.')
      ) {
        throw error
      }

      throw ErrorFactory.fromError(error)
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

  private validateCreditsId(creditsId: string): void {
    if (!creditsId || typeof creditsId !== 'string') {
      throw ErrorFactory.validationError({
        creditsId: ['Credits ID is required and must be a string'],
      })
    }
  }

  private validateAmount(amount: number): void {
    if (typeof amount !== 'number' || amount < 0 || !Number.isInteger(amount)) {
      throw ErrorFactory.validationError({
        amount: ['Amount must be a non-negative integer'],
      })
    }
  }

  private validateDescription(description: string): void {
    if (
      !description ||
      typeof description !== 'string' ||
      description.trim().length === 0
    ) {
      throw ErrorFactory.validationError({
        description: ['Description is required and must be a non-empty string'],
      })
    }

    if (description.length > 255) {
      throw ErrorFactory.validationError({
        description: ['Description must be 255 characters or less'],
      })
    }
  }

  private validateCreateCreditsData(data: CreateCreditsDTO): void {
    this.validateUserId(data.userId)

    if (data.amountDemand !== undefined) {
      this.validateAmount(data.amountDemand)
    }

    if (data.amountSub !== undefined) {
      this.validateAmount(data.amountSub)
    }
  }

  private validateUpdateCreditsData(data: UpdateCreditsDTO): void {
    if (data.amountDemand !== undefined) {
      this.validateAmount(data.amountDemand)
    }

    if (data.amountSub !== undefined) {
      this.validateAmount(data.amountSub)
    }

    if (data.amountDemand === undefined && data.amountSub === undefined) {
      throw ErrorFactory.validationError({
        update: ['At least one field must be provided for update'],
      })
    }
  }
}
