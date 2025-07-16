// Subscription Plan Domain
export interface SubscriptionPlanDomain {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  interval: string
  intervalCount: number
  creditsAmount: number
  trialPeriodDays?: number
  features: string[]
  isActive: boolean
  metadata?: Record<string, any>
  stripeProductId?: string
  stripePriceId?: string
  // Gym-specific membership fields
  membershipType?: string // "FULL_ACCESS" | "OFF_PEAK" | null for non-gym plans
  membershipPackage?: string // "LIMITED" | "STANDARD" | "UNLIMITED" | null
  gymAccessTimes?: Record<string, any> // Time restrictions for OFF_PEAK access
  createdAt: Date
  updatedAt: Date
}

// Subscription Domain (moved from payment.ts)
export interface SubscriptionDomain {
  id: string
  userId: string
  planId?: string
  planType: string // Keep for backward compatibility
  status: string
  billingInterval: string // Keep for backward compatibility
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  startDate?: Date
  endDate?: Date
  lastProcessedAt?: Date
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}

// Extended interfaces with relations
export interface SubscriptionWithPlanDomain extends SubscriptionDomain {
  plan?: SubscriptionPlanDomain
}

export interface SubscriptionPlanWithSubscriptionsDomain
  extends SubscriptionPlanDomain {
  subscriptions: SubscriptionDomain[]
}
