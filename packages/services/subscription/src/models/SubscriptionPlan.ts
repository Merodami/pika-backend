import type { BillingInterval } from '@pika/types'

export interface SubscriptionPlan {
  id: string
  name: string
  description?: string
  price: number
  interval: BillingInterval
  intervalCount: number
  trialPeriodDays?: number
  features: string[]
  isActive: boolean
  metadata?: Record<string, any>
  stripeProductId?: string
  stripePriceId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSubscriptionPlanInput {
  name: string
  description?: string
  price: number
  interval: BillingInterval
  intervalCount: number
  trialPeriodDays?: number
  features: string[]
  isActive?: boolean
  metadata?: Record<string, any>
}

export interface UpdateSubscriptionPlanInput {
  name?: string
  description?: string
  price?: number
  features?: string[]
  isActive?: boolean
  metadata?: Record<string, any>
}
