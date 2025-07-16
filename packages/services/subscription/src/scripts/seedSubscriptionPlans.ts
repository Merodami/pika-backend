#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import {
  DEFAULT_PLAN_CREDITS,
  LEGACY_STRIPE_PRICE_IDS,
  OFF_PEAK_ACCESS_TIMES,
} from '@subscription/types/constants.js'
import { MembershipPackage, MembershipType } from '@subscription/types/enums.js'

const prisma = new PrismaClient()

// Subscription plan configurations based on previous architecture
const SUBSCRIPTION_PLANS = [
  // OFF-PEAK Plans
  {
    name: 'Off-Peak Limited',
    description:
      'Limited access during off-peak hours. Perfect for flexible schedules.',
    price: 29.99,
    currency: 'gbp',
    interval: 'month',
    intervalCount: 1,
    creditsAmount: DEFAULT_PLAN_CREDITS.LIMITED,
    trialPeriodDays: 7,
    features: [
      'Off-peak gym access (9am-4pm weekdays, 8am-8pm weekends)',
      '10 session credits per month',
      'Basic equipment access',
      'Online booking system',
    ],
    membershipType: MembershipType.OFF_PEAK,
    membershipPackage: MembershipPackage.LIMITED,
    gymAccessTimes: OFF_PEAK_ACCESS_TIMES,
    stripeProductId: 'prod_off_peak_limited',
    stripePriceId: LEGACY_STRIPE_PRICE_IDS.OFF_PEAK.LIMITED,
    isActive: true,
  },
  {
    name: 'Off-Peak Standard',
    description: 'Standard access during off-peak hours with more credits.',
    price: 49.99,
    currency: 'gbp',
    interval: 'month',
    intervalCount: 1,
    creditsAmount: DEFAULT_PLAN_CREDITS.STANDARD,
    trialPeriodDays: 7,
    features: [
      'Off-peak gym access (9am-4pm weekdays, 8am-8pm weekends)',
      '25 session credits per month',
      'All equipment access',
      'Group class bookings',
      'Priority customer support',
    ],
    membershipType: MembershipType.OFF_PEAK,
    membershipPackage: MembershipPackage.STANDARD,
    gymAccessTimes: OFF_PEAK_ACCESS_TIMES,
    stripeProductId: 'prod_off_peak_standard',
    stripePriceId: LEGACY_STRIPE_PRICE_IDS.OFF_PEAK.STANDARD,
    isActive: true,
  },
  {
    name: 'Off-Peak Unlimited',
    description: 'Unlimited access during off-peak hours.',
    price: 79.99,
    currency: 'gbp',
    interval: 'month',
    intervalCount: 1,
    creditsAmount: DEFAULT_PLAN_CREDITS.UNLIMITED,
    trialPeriodDays: 7,
    features: [
      'Off-peak gym access (9am-4pm weekdays, 8am-8pm weekends)',
      '50 session credits per month',
      'All equipment access',
      'Unlimited group classes',
      'Personal trainer consultations',
      'Priority booking',
      'Premium customer support',
    ],
    membershipType: MembershipType.OFF_PEAK,
    membershipPackage: MembershipPackage.UNLIMITED,
    gymAccessTimes: OFF_PEAK_ACCESS_TIMES,
    stripeProductId: 'prod_off_peak_unlimited',
    stripePriceId: LEGACY_STRIPE_PRICE_IDS.OFF_PEAK.UNLIMITED,
    isActive: true,
  },

  // FULL ACCESS Plans
  {
    name: 'Full Access Limited',
    description: '24/7 gym access with limited monthly credits.',
    price: 49.99,
    currency: 'gbp',
    interval: 'month',
    intervalCount: 1,
    creditsAmount: DEFAULT_PLAN_CREDITS.LIMITED,
    trialPeriodDays: 7,
    features: [
      '24/7 gym access',
      '10 session credits per month',
      'Basic equipment access',
      'Online booking system',
      'Peak hour access',
    ],
    membershipType: MembershipType.FULL_ACCESS,
    membershipPackage: MembershipPackage.LIMITED,
    gymAccessTimes: null, // No restrictions for full access
    stripeProductId: 'prod_full_access_limited',
    stripePriceId: LEGACY_STRIPE_PRICE_IDS.FULL_ACCESS.LIMITED,
    isActive: true,
  },
  {
    name: 'Full Access Standard',
    description: '24/7 gym access with standard monthly credits.',
    price: 79.99,
    currency: 'gbp',
    interval: 'month',
    intervalCount: 1,
    creditsAmount: DEFAULT_PLAN_CREDITS.STANDARD,
    trialPeriodDays: 7,
    features: [
      '24/7 gym access',
      '25 session credits per month',
      'All equipment access',
      'Group class bookings',
      'Peak hour access',
      'Priority customer support',
    ],
    membershipType: MembershipType.FULL_ACCESS,
    membershipPackage: MembershipPackage.STANDARD,
    gymAccessTimes: null, // No restrictions for full access
    stripeProductId: 'prod_full_access_standard',
    stripePriceId: LEGACY_STRIPE_PRICE_IDS.FULL_ACCESS.STANDARD,
    isActive: true,
  },
  {
    name: 'Full Access Unlimited',
    description: '24/7 gym access with unlimited credits.',
    price: 119.99,
    currency: 'gbp',
    interval: 'month',
    intervalCount: 1,
    creditsAmount: DEFAULT_PLAN_CREDITS.UNLIMITED,
    trialPeriodDays: 7,
    features: [
      '24/7 gym access',
      '50 session credits per month',
      'All equipment access',
      'Unlimited group classes',
      'Personal trainer consultations',
      'Peak hour access',
      'Priority booking',
      'Premium customer support',
      'Guest passes',
    ],
    membershipType: MembershipType.FULL_ACCESS,
    membershipPackage: MembershipPackage.UNLIMITED,
    gymAccessTimes: null, // No restrictions for full access
    stripeProductId: 'prod_full_access_unlimited',
    stripePriceId: LEGACY_STRIPE_PRICE_IDS.FULL_ACCESS.UNLIMITED,
    isActive: true,
  },
] as const

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...')

  try {
    for (const planData of SUBSCRIPTION_PLANS) {
      console.log(`Creating plan: ${planData.name}`)

      // Check if plan already exists
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: {
          name: planData.name,
        },
      })

      if (existingPlan) {
        console.log(`  ⚠️  Plan "${planData.name}" already exists, skipping...`)
        continue
      }

      await prisma.subscriptionPlan.create({
        data: {
          name: planData.name,
          description: planData.description,
          price: planData.price,
          currency: planData.currency,
          interval: planData.interval,
          intervalCount: planData.intervalCount,
          creditsAmount: planData.creditsAmount,
          trialPeriodDays: planData.trialPeriodDays,
          features: [...planData.features],
          membershipType: planData.membershipType,
          membershipPackage: planData.membershipPackage,
          gymAccessTimes: planData.gymAccessTimes
            ? JSON.parse(JSON.stringify(planData.gymAccessTimes))
            : null,
          stripeProductId: planData.stripeProductId,
          stripePriceId: planData.stripePriceId,
          isActive: planData.isActive,
          metadata: {
            source: 'migration',
            createdBy: 'seed-script',
            version: '1.0',
          },
        },
      })

      console.log(`  ✅ Created plan: ${planData.name}`)
    }

    // Display summary
    const totalPlans = await prisma.subscriptionPlan.count()
    const activePlans = await prisma.subscriptionPlan.count({
      where: { isActive: true },
    })

    console.log('\n📊 Seeding Summary:')
    console.log(`  Total subscription plans: ${totalPlans}`)
    console.log(`  Active plans: ${activePlans}`)

    // Display plans by type
    const offPeakCount = await prisma.subscriptionPlan.count({
      where: { membershipType: MembershipType.OFF_PEAK },
    })
    const fullAccessCount = await prisma.subscriptionPlan.count({
      where: { membershipType: MembershipType.FULL_ACCESS },
    })

    console.log(`  Off-Peak plans: ${offPeakCount}`)
    console.log(`  Full Access plans: ${fullAccessCount}`)

    console.log('\n✅ Subscription plans seeded successfully!')
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding function
if (require.main === module) {
  seedSubscriptionPlans().catch((error) => {
    console.error('Failed to seed subscription plans:', error)
    process.exit(1)
  })
}

export { seedSubscriptionPlans }
