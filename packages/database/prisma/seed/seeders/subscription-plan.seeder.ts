import { logger } from '@pika/shared'
import type { PrismaClient } from '@prisma/client'

// Import constants directly instead of from subscription service
const LEGACY_STRIPE_PRICE_IDS = {
  OFF_PEAK: {
    LIMITED: 'price_1RNayg2c3Yc0do0QSdvLcQ9a',
    STANDARD: 'price_1RNaz42c3Yc0do0QobAhHxSz',
    UNLIMITED: 'price_1RNb032c3Yc0do0Q48LytFF0',
  },
  FULL_ACCESS: {
    LIMITED: 'price_1RNb0J2c3Yc0do0QVbjVxVHr',
    STANDARD: 'price_1RNb0U2c3Yc0do0QmnWsgFwU',
    UNLIMITED: 'price_1RNb0s2c3Yc0do0QtlgeUSqu',
  },
} as const

const DEFAULT_PLAN_CREDITS = {
  LIMITED: 10,
  STANDARD: 25,
  UNLIMITED: 50,
} as const

const DEFAULT_PLAN_PRICES = {
  OFF_PEAK: {
    LIMITED: 29.99,
    STANDARD: 49.99,
    UNLIMITED: 79.99,
  },
  FULL_ACCESS: {
    LIMITED: 39.99,
    STANDARD: 69.99,
    UNLIMITED: 99.99,
  },
} as const

const OFF_PEAK_ACCESS_TIMES = {
  weekdays: {
    start: '09:00',
    end: '16:00',
  },
  weekends: {
    start: '08:00',
    end: '20:00',
  },
} as const

const DEFAULT_FEATURES = {
  LIMITED: ['10 credits per month', 'Access to basic classes', 'Mobile app access'],
  STANDARD: ['25 credits per month', 'Access to all classes', 'Mobile app access', 'Guest passes'],
  UNLIMITED: ['50 credits per month', 'Access to all classes', 'Mobile app access', 'Unlimited guest passes', 'Priority booking'],
} as const

export async function seedSubscriptionPlans(prisma: PrismaClient): Promise<void> {
  logger.info('Starting subscription plans seeding...')

  const subscriptionPlans = [
    // OFF-PEAK LIMITED
    {
      name: 'Off-Peak Limited',
      description: 'Limited credits with off-peak gym access',
      stripePriceId: LEGACY_STRIPE_PRICE_IDS.OFF_PEAK.LIMITED,
      membershipType: 'OFF_PEAK',
      membershipPackage: 'LIMITED',
      creditsAmount: DEFAULT_PLAN_CREDITS.LIMITED,
      price: DEFAULT_PLAN_PRICES.OFF_PEAK.LIMITED,
      currency: 'usd',
      interval: 'month',
      features: DEFAULT_FEATURES.LIMITED,
      trialPeriodDays: 7,
      gymAccessTimes: OFF_PEAK_ACCESS_TIMES,
      isActive: true,
    },
    // OFF-PEAK STANDARD
    {
      name: 'Off-Peak Standard',
      description: 'Standard credits with off-peak gym access',
      stripePriceId: LEGACY_STRIPE_PRICE_IDS.OFF_PEAK.STANDARD,
      membershipType: 'OFF_PEAK',
      membershipPackage: 'STANDARD',
      creditsAmount: DEFAULT_PLAN_CREDITS.STANDARD,
      price: DEFAULT_PLAN_PRICES.OFF_PEAK.STANDARD,
      currency: 'usd',
      interval: 'month',
      features: DEFAULT_FEATURES.STANDARD,
      trialPeriodDays: 7,
      gymAccessTimes: OFF_PEAK_ACCESS_TIMES,
      isActive: true,
    },
    // OFF-PEAK UNLIMITED
    {
      name: 'Off-Peak Unlimited',
      description: 'Unlimited credits with off-peak gym access',
      stripePriceId: LEGACY_STRIPE_PRICE_IDS.OFF_PEAK.UNLIMITED,
      membershipType: 'OFF_PEAK',
      membershipPackage: 'UNLIMITED',
      creditsAmount: DEFAULT_PLAN_CREDITS.UNLIMITED,
      price: DEFAULT_PLAN_PRICES.OFF_PEAK.UNLIMITED,
      currency: 'usd',
      interval: 'month',
      features: DEFAULT_FEATURES.UNLIMITED,
      trialPeriodDays: 7,
      gymAccessTimes: OFF_PEAK_ACCESS_TIMES,
      isActive: true,
    },
    // FULL_ACCESS LIMITED
    {
      name: 'Full Access Limited',
      description: 'Limited credits with 24/7 gym access',
      stripePriceId: LEGACY_STRIPE_PRICE_IDS.FULL_ACCESS.LIMITED,
      membershipType: 'FULL_ACCESS',
      membershipPackage: 'LIMITED',
      creditsAmount: DEFAULT_PLAN_CREDITS.LIMITED,
      price: DEFAULT_PLAN_PRICES.FULL_ACCESS.LIMITED,
      currency: 'usd',
      interval: 'month',
      features: DEFAULT_FEATURES.LIMITED,
      trialPeriodDays: 7,
      gymAccessTimes: null, // Full access = no time restrictions
      isActive: true,
    },
    // FULL_ACCESS STANDARD
    {
      name: 'Full Access Standard',
      description: 'Standard credits with 24/7 gym access',
      stripePriceId: LEGACY_STRIPE_PRICE_IDS.FULL_ACCESS.STANDARD,
      membershipType: 'FULL_ACCESS',
      membershipPackage: 'STANDARD',
      creditsAmount: DEFAULT_PLAN_CREDITS.STANDARD,
      price: DEFAULT_PLAN_PRICES.FULL_ACCESS.STANDARD,
      currency: 'usd',
      interval: 'month',
      features: DEFAULT_FEATURES.STANDARD,
      trialPeriodDays: 7,
      gymAccessTimes: null, // Full access = no time restrictions
      isActive: true,
    },
    // FULL_ACCESS UNLIMITED
    {
      name: 'Full Access Unlimited',
      description: 'Unlimited credits with 24/7 gym access',
      stripePriceId: LEGACY_STRIPE_PRICE_IDS.FULL_ACCESS.UNLIMITED,
      membershipType: 'FULL_ACCESS',
      membershipPackage: 'UNLIMITED',
      creditsAmount: DEFAULT_PLAN_CREDITS.UNLIMITED,
      price: DEFAULT_PLAN_PRICES.FULL_ACCESS.UNLIMITED,
      currency: 'usd',
      interval: 'month',
      features: DEFAULT_FEATURES.UNLIMITED,
      trialPeriodDays: 7,
      gymAccessTimes: null, // Full access = no time restrictions
      isActive: true,
    },
  ]

  try {
    for (const plan of subscriptionPlans) {
      // Check if plan already exists by Stripe price ID
      const existingPlan = await prisma.subscriptionPlan.findUnique({
        where: { stripePriceId: plan.stripePriceId },
      })

      if (existingPlan) {
        logger.info(`Subscription plan already exists: ${plan.name}`, {
          planId: existingPlan.id,
          stripePriceId: plan.stripePriceId,
        })
        continue
      }

      // Create the subscription plan
      const createdPlan = await prisma.subscriptionPlan.create({
        data: plan,
      })

      logger.info(`Created subscription plan: ${plan.name}`, {
        planId: createdPlan.id,
        stripePriceId: plan.stripePriceId,
        membershipType: plan.membershipType,
        membershipPackage: plan.membershipPackage,
        creditsAmount: plan.creditsAmount,
      })
    }

    logger.info('Subscription plans seeding completed successfully')
  } catch (error) {
    logger.error('Failed to seed subscription plans', { error })
    throw error
  }
}