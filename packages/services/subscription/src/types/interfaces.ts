import type { ICacheService } from '@pika/redis'
import type { PrismaClient } from '@prisma/client'
import type {
    CreditProcessingStatus,
    MembershipPackage,
    MembershipType,
    SubscriptionInterval,
    SubscriptionStatus,
} from '@subscription/types/enums.js'

// Service configuration interfaces
export interface SubscriptionServiceConfig {
  prisma: PrismaClient
  cacheService: ICacheService
}

// Plan configuration interfaces
export interface PlanConfiguration {
  membershipType: MembershipType
  membershipPackage: MembershipPackage
  creditsAmount: number
  features: string[]
  gymAccessTimes?: GymAccessTimes
}

export interface GymAccessTimes {
  weekdays?: TimeSlot
  weekends?: TimeSlot
  holidays?: TimeSlot
}

export interface TimeSlot {
  start: string // HH:MM format
  end: string // HH:MM format
}

// Credit processing interfaces
export interface CreditProcessingJob {
  subscriptionId: string
  userId: string
  creditsAmount: number
  status: CreditProcessingStatus
  attempts: number
  lastAttemptAt?: Date
  scheduledFor?: Date
  error?: string
}

export interface CreditProcessingResult {
  success: boolean
  creditsAdded?: number
  newBalance?: number
  error?: string
}

// Subscription management interfaces
export interface SubscriptionCreationData {
  userId: string
  planId: string
  stripeCustomerId?: string
  trialEnd?: Date
  metadata?: Record<string, any>
}

export interface SubscriptionUpdateData {
  planId?: string
  status?: SubscriptionStatus
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  trialEnd?: Date
  cancelAtPeriodEnd?: boolean
  cancelledAt?: Date
  metadata?: Record<string, any>
}

// Plan management interfaces
export interface PlanCreationData {
  name: string
  description?: string
  price: number
  currency: string
  interval: SubscriptionInterval
  intervalCount: number
  creditsAmount: number
  trialPeriodDays?: number
  features: string[]
  membershipType?: MembershipType
  membershipPackage?: MembershipPackage
  gymAccessTimes?: GymAccessTimes
  metadata?: Record<string, any>
}

export interface PlanUpdateData {
  name?: string
  description?: string
  price?: number
  creditsAmount?: number
  features?: string[]
  isActive?: boolean
  membershipType?: MembershipType
  membershipPackage?: MembershipPackage
  gymAccessTimes?: GymAccessTimes
  metadata?: Record<string, any>
}

// Search and filtering interfaces
export interface SubscriptionSearchParams {
  page?: number
  limit?: number
  status?: SubscriptionStatus
  userId?: string
  planId?: string
  cancelAtPeriodEnd?: boolean
  fromDate?: Date
  toDate?: Date
}

export interface PlanSearchParams {
  page?: number
  limit?: number
  isActive?: boolean
  membershipType?: MembershipType
  membershipPackage?: MembershipPackage
  interval?: SubscriptionInterval
}

// User membership status interface
export interface UserMembershipStatus {
  hasActiveSubscription: boolean
  subscription?: {
    id: string
    status: SubscriptionStatus
    planId: string
    planName: string
    membershipType?: MembershipType
    membershipPackage?: MembershipPackage
    currentPeriodEnd?: Date
    cancelAtPeriodEnd: boolean
  }
  creditBalance?: {
    total: number
    demand: number
    subscription: number
  }
}
