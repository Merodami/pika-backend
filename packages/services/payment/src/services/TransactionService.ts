import type { CreditsDomain, PromoCodeDomain } from '@pika/sdk'
import { ErrorFactory, logger } from '@pikad'
import type { PrismaClient } from '@prisma/client'

import type { IStripeService } from './StripeService.js'

export interface PaymentTransactionData {
  userId: string
  amount: number
  description: string
  promoCode?: string
  price?: number
  stripeMetadata?: Record<string, string>
}

export interface PaymentTransactionResult {
  credits: CreditsDomain
  paymentIntentId?: string
  promoCodeUsed?: PromoCodeDomain
  finalPrice: number
  discountAmount: number
}

export interface ITransactionService {
  executePaymentTransaction(
    data: PaymentTransactionData,
  ): Promise<PaymentTransactionResult>
  executePromoCodeTransaction(
    promoCode: string,
    userId: string,
    transactionId?: string,
  ): Promise<{ promoCode: PromoCodeDomain; used: boolean }>
  executeCreditsTransferTransaction(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
  ): Promise<{ from: CreditsDomain; to: CreditsDomain }>
}

export class TransactionService implements ITransactionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly stripeService: IStripeService,
  ) {}

  async executePaymentTransaction(
    data: PaymentTransactionData,
  ): Promise<PaymentTransactionResult> {
    try {
      logger.info('Starting payment transaction', {
        userId: data.userId,
        amount: data.amount,
        promoCode: data.promoCode,
        price: data.price,
      })

      return await this.prisma.$transaction(async (tx) => {
        let discount = 0
        let discountAmount = 0
        let finalPrice = data.price || 0
        let promoCodeData: PromoCodeDomain | null = null

        // Step 1: Validate and apply promo code if provided
        if (data.promoCode) {
          const promoCode = await tx.promoCode.findFirst({
            where: { code: data.promoCode },
          })

          if (!promoCode) {
            throw new Error('Promotional code does not exists.')
          }

          const now = new Date()
          const expirationDate = new Date(promoCode.expirationDate)

          if (
            !promoCode.active ||
            promoCode.amountAvailable === 0 ||
            expirationDate < now
          ) {
            throw new Error('Unavailable promotional code.')
          }

          discount = promoCode.discount
          discountAmount = Math.round((finalPrice * discount) / 100)
          finalPrice = finalPrice - discountAmount

          // Consume promo code atomically
          await tx.promoCode.update({
            where: { id: promoCode.id },
            data: {
              amountAvailable: promoCode.amountAvailable - 1,
            },
          })

          // Map to domain for result
          promoCodeData = {
            id: promoCode.id,
            code: promoCode.code,
            discount: promoCode.discount,
            amountAvailable: promoCode.amountAvailable - 1,
            active: promoCode.active,
            expirationDate: promoCode.expirationDate,
            allowedTimes: promoCode.allowedTimes,
            createdBy: promoCode.createdBy,
            createdAt: promoCode.createdAt,
            updatedAt: new Date(),
          }

          logger.info('Promo code applied in transaction', {
            promoCode: data.promoCode,
            discount,
            originalPrice: data.price,
            discountAmount,
            finalPrice,
          })
        }

        let paymentIntentId: string | undefined

        // Step 2: Process Stripe payment if there's a price
        if (finalPrice > 0) {
          try {
            const paymentIntent = await this.stripeService.createPaymentIntent(
              finalPrice,
              'gbp',
              {
                userId: data.userId,
                amount: data.amount.toString(),
                promoCode: data.promoCode || '',
                originalPrice: data.price?.toString() || '0',
                discountAmount: discountAmount.toString(),
                ...data.stripeMetadata,
              },
            )

            paymentIntentId = paymentIntent.id

            logger.info('Payment intent created in transaction', {
              paymentIntentId,
              amount: finalPrice,
              userId: data.userId,
            })
          } catch (error) {
            logger.error('Stripe payment failed in transaction', {
              finalPrice,
              userId: data.userId,
              error,
            })
            throw ErrorFactory.externalServiceError(
              'Payment',
              'Payment processing failed',
              error,
            )
          }
        }

        // Step 3: Find or create credits record
        let credits = await tx.credits.findUnique({
          where: { userId: data.userId },
        })

        if (!credits) {
          credits = await tx.credits.create({
            data: {
              userId: data.userId,
              amountDemand: data.amount,
              amountSub: 0,
            },
          })
        } else {
          credits = await tx.credits.update({
            where: { id: credits.id },
            data: {
              amountDemand: credits.amountDemand + data.amount,
            },
          })
        }

        // Step 4: Create credits history entry
        await tx.creditsHistory.create({
          data: {
            userId: data.userId,
            creditsId: credits.id,
            amount: data.amount,
            description: data.description,
            operation: 'increase',
            type: 'demand',
            transactionId: paymentIntentId,
            date: new Date(),
          },
        })

        // Map credits to domain
        const creditsDomain: CreditsDomain = {
          id: credits.id,
          userId: credits.userId,
          amountDemand: credits.amountDemand,
          amountSub: credits.amountSub,
          createdAt: credits.createdAt,
          updatedAt: credits.updatedAt,
        }

        logger.info('Payment transaction completed successfully', {
          userId: data.userId,
          creditsId: credits.id,
          amount: data.amount,
          paymentIntentId,
          promoCodeUsed: !!data.promoCode,
          finalPrice,
          discountAmount,
        })

        return {
          credits: creditsDomain,
          paymentIntentId,
          promoCodeUsed: promoCodeData || undefined,
          finalPrice,
          discountAmount,
        }
      })
    } catch (error) {
      logger.error('Payment transaction failed', {
        userId: data.userId,
        amount: data.amount,
        error,
      })

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

  async executePromoCodeTransaction(
    promoCode: string,
    userId: string,
    transactionId?: string,
  ): Promise<{ promoCode: PromoCodeDomain; used: boolean }> {
    try {
      logger.info('Starting promo code transaction', {
        promoCode,
        userId,
        transactionId,
      })

      return await this.prisma.$transaction(async (tx) => {
        const promoCodeRecord = await tx.promoCode.findFirst({
          where: { code: promoCode },
        })

        if (!promoCodeRecord) {
          throw new Error('Promotional code does not exists.')
        }

        const now = new Date()
        const expirationDate = new Date(promoCodeRecord.expirationDate)

        if (
          !promoCodeRecord.active ||
          promoCodeRecord.amountAvailable === 0 ||
          expirationDate < now
        ) {
          throw new Error('Unavailable promotional code.')
        }

        // Check if user has already used this promo code
        const existingUsage = await tx.promoCodeUsage.findFirst({
          where: {
            promoCodeId: promoCodeRecord.id,
            userId: userId,
          },
        })

        if (existingUsage) {
          // Return existing usage without consuming again
          const promoCodeDomain: PromoCodeDomain = {
            id: promoCodeRecord.id,
            code: promoCodeRecord.code,
            discount: promoCodeRecord.discount,
            amountAvailable: promoCodeRecord.amountAvailable,
            active: promoCodeRecord.active,
            expirationDate: promoCodeRecord.expirationDate,
            allowedTimes: promoCodeRecord.allowedTimes,
            createdBy: promoCodeRecord.createdBy,
            createdAt: promoCodeRecord.createdAt,
            updatedAt: promoCodeRecord.updatedAt,
          }

          return { promoCode: promoCodeDomain, used: false }
        }

        // Consume promo code
        const updatedPromoCode = await tx.promoCode.update({
          where: { id: promoCodeRecord.id },
          data: {
            amountAvailable: promoCodeRecord.amountAvailable - 1,
          },
        })

        // Record usage
        await tx.promoCodeUsage.create({
          data: {
            promoCodeId: promoCodeRecord.id,
            userId: userId,
            transactionId: transactionId,
            usedAt: new Date(),
          },
        })

        const promoCodeDomain: PromoCodeDomain = {
          id: updatedPromoCode.id,
          code: updatedPromoCode.code,
          discount: updatedPromoCode.discount,
          amountAvailable: updatedPromoCode.amountAvailable,
          active: updatedPromoCode.active,
          expirationDate: updatedPromoCode.expirationDate,
          allowedTimes: updatedPromoCode.allowedTimes,
          createdBy: updatedPromoCode.createdBy,
          createdAt: updatedPromoCode.createdAt,
          updatedAt: updatedPromoCode.updatedAt,
        }

        logger.info('Promo code transaction completed', {
          promoCode,
          userId,
          remainingUses: updatedPromoCode.amountAvailable,
        })

        return { promoCode: promoCodeDomain, used: true }
      })
    } catch (error) {
      logger.error('Promo code transaction failed', {
        promoCode,
        userId,
        error,
      })

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

  async executeCreditsTransferTransaction(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description: string,
  ): Promise<{ from: CreditsDomain; to: CreditsDomain }> {
    try {
      logger.info('Starting credits transfer transaction', {
        fromUserId,
        toUserId,
        amount,
      })

      if (fromUserId === toUserId) {
        throw ErrorFactory.businessRuleViolation(
          'Invalid transfer',
          'Cannot transfer credits to the same user',
        )
      }

      return await this.prisma.$transaction(async (tx) => {
        // Get source credits
        const fromCredits = await tx.credits.findUnique({
          where: { userId: fromUserId },
        })

        if (!fromCredits) {
          throw ErrorFactory.resourceNotFound('Credits', fromUserId)
        }

        if (fromCredits.amountDemand < amount) {
          throw ErrorFactory.businessRuleViolation(
            'Insufficient credits',
            `User has ${fromCredits.amountDemand} demand credits, but ${amount} is required`,
          )
        }

        // Update source credits (deduct)
        const updatedFromCredits = await tx.credits.update({
          where: { id: fromCredits.id },
          data: {
            amountDemand: fromCredits.amountDemand - amount,
          },
        })

        // Create history for source user
        await tx.creditsHistory.create({
          data: {
            userId: fromUserId,
            creditsId: fromCredits.id,
            amount: -amount,
            description: `${description} (transferred to user ${toUserId})`,
            operation: 'decrease',
            type: 'demand',
            date: new Date(),
          },
        })

        // Find or create destination credits
        let toCredits = await tx.credits.findUnique({
          where: { userId: toUserId },
        })

        if (!toCredits) {
          toCredits = await tx.credits.create({
            data: {
              userId: toUserId,
              amountDemand: amount,
              amountSub: 0,
            },
          })
        } else {
          toCredits = await tx.credits.update({
            where: { id: toCredits.id },
            data: {
              amountDemand: toCredits.amountDemand + amount,
            },
          })
        }

        // Create history for destination user
        await tx.creditsHistory.create({
          data: {
            userId: toUserId,
            creditsId: toCredits.id,
            amount: amount,
            description: `${description} (received from user ${fromUserId})`,
            operation: 'increase',
            type: 'demand',
            date: new Date(),
          },
        })

        const fromDomain: CreditsDomain = {
          id: updatedFromCredits.id,
          userId: updatedFromCredits.userId,
          amountDemand: updatedFromCredits.amountDemand,
          amountSub: updatedFromCredits.amountSub,
          createdAt: updatedFromCredits.createdAt,
          updatedAt: updatedFromCredits.updatedAt,
        }

        const toDomain: CreditsDomain = {
          id: toCredits.id,
          userId: toCredits.userId,
          amountDemand: toCredits.amountDemand,
          amountSub: toCredits.amountSub,
          createdAt: toCredits.createdAt,
          updatedAt: toCredits.updatedAt,
        }

        logger.info('Credits transfer transaction completed', {
          fromUserId,
          toUserId,
          amount,
          fromRemainingBalance:
            updatedFromCredits.amountDemand + updatedFromCredits.amountSub,
          toNewBalance: toCredits.amountDemand + toCredits.amountSub,
        })

        return { from: fromDomain, to: toDomain }
      })
    } catch (error) {
      logger.error('Credits transfer transaction failed', {
        fromUserId,
        toUserId,
        amount,
        error,
      })

      if (error instanceof ErrorFactory) {
        throw error
      }

      throw ErrorFactory.fromError(error)
    }
  }
}
