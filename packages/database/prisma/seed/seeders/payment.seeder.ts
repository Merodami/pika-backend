/**
 * Payment seeder - Creates subscription plans, credit packs, and subscriptions
 */

import { faker } from '@faker-js/faker'
import { PrismaClient, SubscriptionPlan,User } from '@prisma/client'

import { getSeedConfig } from '../config/seed.config.js'
import {
  generateCreditHistoryData,
  generateCreditPackData,
  generateCreditsData,
  generatePromoCodeData,
  generateSubscriptionData,
  generateSubscriptionPlanData} from '../data/payment.data.js'
import { logger } from '../utils/logger.js'

export interface PaymentSeederResult {
  subscriptionPlans: SubscriptionPlan[]
}

export async function seedPayments(
  prisma: PrismaClient,
  users: User[]
): Promise<PaymentSeederResult> {
  const config = getSeedConfig()
  const subscriptionPlans: SubscriptionPlan[] = []

  // Create subscription plans
  logger.info(`Creating ${config.subscriptionPlansCount} subscription plans...`)

  for (let i = 0; i < config.subscriptionPlansCount; i++) {
    try {
      const planData = generateSubscriptionPlanData(i)
      const plan = await prisma.subscriptionPlan.create({
        data: planData,
      })

      subscriptionPlans.push(plan)
    } catch (error) {
      logger.error('Failed to create subscription plan:', error)
    }
  }

  // Create credit packs
  logger.info(`Creating ${config.creditPacksCount} credit packs...`)

  for (let i = 0; i < config.creditPacksCount; i++) {
    try {
      const packData = generateCreditPackData(i)

      await prisma.creditsPack.create({
        data: packData,
      })
    } catch (error) {
      logger.error('Failed to create credit pack:', error)
    }
  }

  // Create promo codes
  logger.info(`Creating ${config.promoCodesCount} promo codes...`)

  for (let i = 0; i < config.promoCodesCount; i++) {
    try {
      const promoData = generatePromoCodeData(i)
      const promo = await prisma.promoCode.create({
        data: promoData,
      })

      // Add some usage for active promo codes
      if (promoData.active && faker.datatype.boolean(0.5)) {
        const usageCount = faker.number.int({ min: 1, max: 10 })
        const promoUsers = faker.helpers.arrayElements(users, usageCount)

        for (const user of promoUsers) {
          try {
            await prisma.promoCodeUsage.create({
              data: {
                promoCodeId: promo.id,
                userId: user.id,
                transactionId: faker.string.alphanumeric(12).toUpperCase(),
                usedAt: faker.date.recent({ days: 30 }),
              },
            })
          } catch {
            // Skip duplicates
          }
        }
      }
    } catch (error) {
      logger.error('Failed to create promo code:', error)
    }
  }

  // Create user credits and subscriptions
  logger.info('Creating user subscriptions and credits...')

  // Give subscriptions to 60% of users
  const subscribedUsers = faker.helpers.arrayElements(
    users.filter(u => u.role !== 'ADMIN'),
    Math.floor(users.length * 0.6)
  )

  for (const user of subscribedUsers) {
    try {
      // Create subscription
      const plan = faker.helpers.arrayElement(subscriptionPlans)
      const subscription = await prisma.subscription.create({
        data: generateSubscriptionData(user.id, plan.id),
      })

      // Create membership record
      await prisma.membership.create({
        data: {
          userId: user.id,
          stripeCustomerId: subscription.stripeCustomerId,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          active: subscription.status === 'active',
          subscriptionStatus: subscription.status,
          planType: subscription.planType,
          subscriptionStartDate: subscription.startDate,
          subscriptionEndDate: subscription.endDate,
          lastPaymentDate: subscription.status === 'active'
            ? faker.date.recent({ days: 30 })
            : null,
        },
      })
    } catch (error) {
      logger.error('Failed to create subscription:', error)
    }
  }

  // Create credits for all non-admin users
  const creditUsers = users.filter(u => u.role !== 'ADMIN')

  for (const user of creditUsers) {
    try {
      // Create credits record
      const creditsData = generateCreditsData(user.id)
      const credits = await prisma.credits.create({
        data: creditsData,
      })

      // Create credit history
      const historyCount = faker.number.int({ min: 5, max: 20 })

      for (let i = 0; i < historyCount; i++) {
        try {
          await prisma.creditsHistory.create({
            data: generateCreditHistoryData(user.id, credits.id),
          })
        } catch {
          // Skip errors
        }
      }
    } catch (error) {
      logger.error('Failed to create user credits:', error)
    }
  }

  logger.success('✅ Created payment data')

  return { subscriptionPlans }
}