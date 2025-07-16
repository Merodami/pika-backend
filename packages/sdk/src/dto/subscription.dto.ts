import type { BillingIntervalType } from '@pika/types'

// Subscription Plan DTOs
export interface CreateSubscriptionPlanDTO {
  name: string
  description?: string
  price: number
  currency?: string
  interval: BillingIntervalType
  intervalCount?: number
  creditsAmount: number
  trialPeriodDays?: number
  features: string[]
  isActive?: boolean
  metadata?: Record<string, any>
  // Gym-specific membership fields
  membershipType?: string // "FULL_ACCESS" | "OFF_PEAK" | null for non-gym plans
  membershipPackage?: string // "LIMITED" | "STANDARD" | "UNLIMITED" | null
  gymAccessTimes?: Record<string, any> // Time restrictions for OFF_PEAK access
}

export interface UpdateSubscriptionPlanDTO {
  name?: string
  description?: string
  price?: number
  creditsAmount?: number
  features?: string[]
  isActive?: boolean
  metadata?: Record<string, any>
  // Gym-specific membership fields
  membershipType?: string
  membershipPackage?: string
  gymAccessTimes?: Record<string, any>
}

export interface SubscriptionPlanDTO {
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
  membershipType?: string
  membershipPackage?: string
  gymAccessTimes?: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Subscription DTOs (moved from payment.dto.ts)
export interface CreateSubscriptionDTO {
  planId: string
  stripeCustomerId?: string
  trialEnd?: Date
  metadata?: Record<string, any>
}

// DTO for creating subscription from webhook (Payment Service → Subscription Service)
export interface CreateSubscriptionFromWebhookDTO {
  userId: string
  planId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd?: Date
}

export interface UpdateSubscriptionDTO {
  planId?: string
  status?: string
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd?: boolean
  cancelledAt?: Date
  metadata?: Record<string, any>
}

export interface SubscriptionDTO {
  id: string
  userId: string
  planId?: string
  planType: string
  status: string
  billingInterval: string
  currentPeriodStart?: string
  currentPeriodEnd?: string
  trialEnd?: string
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  stripePriceId?: string
  startDate?: string
  endDate?: string
  lastProcessedAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
}

// Extended DTOs
export interface SubscriptionWithPlanDTO extends SubscriptionDTO {
  plan?: SubscriptionPlanDTO
}
