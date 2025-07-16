/**
 * Payment and subscription seed data
 */

import { faker } from '@faker-js/faker'

export const SUBSCRIPTION_PLANS = [
  {
    name: 'Basic Plan',
    description: 'Perfect for casual gym-goers',
    price: 29.99,
    interval: 'month',
    creditsAmount: 4,
    features: [
      '4 session credits per month',
      'Access to all partner gyms',
      'Book up to 2 weeks in advance',
      'Standard support',
    ],
  },
  {
    name: 'Pro Plan',
    description: 'Ideal for regular fitness enthusiasts',
    price: 79.99,
    interval: 'month',
    creditsAmount: 12,
    features: [
      '12 session credits per month',
      'Access to all partner gyms',
      'Book up to 4 weeks in advance',
      'Priority support',
      '10% discount on additional credits',
      'Guest passes (2 per month)',
    ],
  },
  {
    name: 'Premium Plan',
    description: 'Unlimited fitness experience',
    price: 149.99,
    interval: 'month',
    creditsAmount: 30,
    features: [
      '30 session credits per month',
      'Access to all partner gyms',
      'Book up to 8 weeks in advance',
      'VIP support',
      '20% discount on additional credits',
      'Unlimited guest passes',
      'Free merchandise',
      'Exclusive events access',
    ],
  },
]

export const CREDIT_PACKS = [
  { type: 'single', amount: 1, price: 25, frequency: 1 },
  { type: 'starter', amount: 5, price: 110, frequency: 5 },
  { type: 'standard', amount: 10, price: 200, frequency: 10 },
  { type: 'premium', amount: 20, price: 360, frequency: 20 },
  { type: 'ultimate', amount: 50, price: 800, frequency: 50 },
]

export function generateSubscriptionPlanData(index: number) {
  const plan = SUBSCRIPTION_PLANS[index % SUBSCRIPTION_PLANS.length]

  return {
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currency: 'usd',
    interval: plan.interval,
    intervalCount: 1,
    creditsAmount: plan.creditsAmount,
    trialPeriodDays: index === 0 ? 7 : null,
    features: plan.features,
    isActive: true,

    // Optional Stripe IDs
    stripeProductId: faker.datatype.boolean(0.8)
      ? `prod_${faker.string.alphanumeric(14)}`
      : null,
    stripePriceId: faker.datatype.boolean(0.8)
      ? `price_${faker.string.alphanumeric(24)}`
      : null,

    // Gym membership options (for future use)
    membershipType: null,
    membershipPackage: null,
    gymAccessTimes: null,

    // Metadata
    metadata: {
      color: index === 0 ? '#3B82F6' : index === 1 ? '#8B5CF6' : '#F59E0B',
      order: index,
      popular: index === 1,
    },
  }
}

export function generateCreditPackData(index: number) {
  const pack = CREDIT_PACKS[index % CREDIT_PACKS.length]

  return {
    type: pack.type,
    amount: pack.amount,
    frequency: pack.frequency,
    price: pack.price,
    active: true,
    createdBy: faker.string.uuid(),
  }
}

export function generatePromoCodeData(index: number) {
  const codes = [
    'WELCOME20',
    'SUMMER2024',
    'FITNESS30',
    'NEWYEAR50',
    'FRIEND15',
    'VIP25',
    'FLASH40',
    'MEMBER10',
    'TRIAL7',
    'BOOST20',
  ]

  const discount = faker.number.int({ min: 10, max: 50 })
  const totalUses = faker.number.int({ min: 50, max: 500 })
  const usedTimes = faker.number.int({ min: 0, max: Math.floor(totalUses * 0.7) })

  return {
    code: codes[index % codes.length] + (index >= codes.length ? index : ''),
    discount,
    active: faker.datatype.boolean(0.8),
    allowedTimes: totalUses,
    amountAvailable: totalUses - usedTimes,
    expirationDate: faker.date.future({ years: 0.5 }),
    createdBy: faker.string.uuid(),
  }
}

export function generateSubscriptionData(userId: string, planId: string) {
  const status = faker.helpers.weightedArrayElement([
    { weight: 70, value: 'active' },
    { weight: 10, value: 'canceled' },
    { weight: 5, value: 'past_due' },
    { weight: 5, value: 'unpaid' },
    { weight: 5, value: 'trialing' },
    { weight: 5, value: 'incomplete' },
  ])

  const startDate = faker.date.recent({ days: 90 })
  const currentPeriodStart = startDate
  const currentPeriodEnd = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

  return {
    userId,
    planId,
    planType: faker.helpers.arrayElement(['basic', 'pro', 'premium']),
    status,
    billingInterval: 'monthly',

    // Billing periods
    currentPeriodStart,
    currentPeriodEnd,
    startDate,

    // Trial
    trialEnd: status === 'trialing'
      ? faker.date.future({ years: 0.1 })
      : null,

    // Cancellation
    cancelAtPeriodEnd: status === 'active' && faker.datatype.boolean(0.1),
    cancelledAt: status === 'canceled'
      ? faker.date.recent({ days: 30 })
      : null,
    endDate: status === 'canceled'
      ? currentPeriodEnd
      : null,

    // Stripe data
    stripeCustomerId: `cus_${faker.string.alphanumeric(14)}`,
    stripeSubscriptionId: `sub_${faker.string.alphanumeric(24)}`,
    stripePriceId: `price_${faker.string.alphanumeric(24)}`,

    // Processing
    lastProcessedAt: faker.date.recent({ days: 7 }),
  }
}

export function generateMembershipData(userId: string, subscription: any) {
  return {
    userId,
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
  }
}

export function generateCreditsData(userId: string) {
  const amountDemand = faker.number.int({ min: 0, max: 50 })
  const amountSub = faker.number.int({ min: 0, max: 30 })

  return {
    userId,
    amountDemand,
    amountSub, // Deprecated but kept for compatibility
  }
}

export function generateCreditHistoryData(userId: string, creditId: string) {
  const operation = faker.helpers.arrayElement(['increase', 'decreased'])
  const type = faker.helpers.arrayElement(['demand', 'subscription'])

  const descriptions = {
    increase: {
      demand: [
        'Credit pack purchase',
        'Promotional credit',
        'Referral bonus',
        'Refund credit',
      ],
      subscription: [
        'Monthly subscription credits',
        'Subscription renewal',
        'Bonus credits',
      ],
    },
    decreased: {
      demand: [
        'Session booking',
        'Guest session booking',
        'Premium session booking',
      ],
      subscription: [
        'Session booking',
        'Group class booking',
      ],
    },
  }

  const amount = operation === 'increase'
    ? faker.number.int({ min: 1, max: 30 })
    : -faker.number.int({ min: 1, max: 3 })

  return {
    userId,
    creditsId: creditId,
    amount,
    description: faker.helpers.arrayElement(
      operation === 'increase'
        ? (type === 'demand' ? descriptions.increase.demand : descriptions.increase.subscription)
        : (type === 'demand' ? descriptions.decreased.demand : descriptions.decreased.subscription)
    ),
    operation,
    type,
    transactionId: faker.datatype.boolean(0.8)
      ? faker.string.alphanumeric(12).toUpperCase()
      : null,
    date: faker.date.recent({ days: 60 }),
  }
}

export function generatePromoCodeUsageData(promoCodeId: string, userId: string) {
  return {
    promoCodeId,
    userId,
    transactionId: faker.string.alphanumeric(12).toUpperCase(),
    usedAt: faker.date.recent({ days: 30 }),
  }
}