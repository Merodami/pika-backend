import { z } from 'zod'

import { GymId, Money, UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Admin payment and transaction schemas
 */

// ============= Enums =============

export const TransactionType = z.enum([
  'PAYMENT',
  'REFUND',
  'TRANSFER',
  'PAYOUT',
  'ADJUSTMENT',
  'FEE',
  'SUBSCRIPTION',
  'CREDIT_PURCHASE',
])
export type TransactionType = z.infer<typeof TransactionType>

export const TransactionStatus = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REFUNDED',
  'DISPUTED',
])
export type TransactionStatus = z.infer<typeof TransactionStatus>

export const PaymentMethod = z.enum([
  'CARD',
  'BANK_TRANSFER',
  'WALLET',
  'CREDIT',
  'CASH',
  'OTHER',
])
export type PaymentMethod = z.infer<typeof PaymentMethod>

// ============= Transaction Details =============

/**
 * Detailed transaction for admin
 */
export const AdminTransactionDetailResponse = openapi(
  withTimestamps({
    id: UUID,
    type: TransactionType,
    status: TransactionStatus,

    // Amount details
    amount: Money,
    currency: z.string().length(3),
    fee: Money.optional(),
    tax: Money.optional(),
    netAmount: Money,

    // Parties
    userId: UserId.optional(),
    userName: z.string().optional(),
    gymId: GymId.optional(),
    gymName: z.string().optional(),
    trainerId: UserId.optional(),
    trainerName: z.string().optional(),

    // Payment details
    paymentMethod: PaymentMethod,
    stripePaymentIntentId: z.string().optional(),
    stripeChargeId: z.string().optional(),
    stripeRefundId: z.string().optional(),

    // Reference
    referenceType: z.string().optional().describe('Type of related entity'),
    referenceId: z.string().optional().describe('ID of related entity'),
    description: z.string().optional(),

    // Processing
    processedAt: DateTime.optional(),
    failureReason: z.string().optional(),
    failureCode: z.string().optional(),

    // Dispute/Refund
    disputeStatus: z
      .enum(['WARNING', 'NEEDS_RESPONSE', 'UNDER_REVIEW', 'WON', 'LOST'])
      .optional(),
    disputeReason: z.string().optional(),
    refundReason: z.string().optional(),
    refundedAmount: Money.optional(),

    // Metadata
    metadata: z.record(z.any()).optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
  }),
  {
    description: 'Detailed transaction information for admin',
  },
)

export type AdminTransactionDetailResponse = z.infer<
  typeof AdminTransactionDetailResponse
>

// ============= Transaction Search =============

/**
 * Admin transaction search parameters
 */
export const AdminTransactionQueryParams = z.object({
  type: TransactionType.optional(),
  status: TransactionStatus.optional(),
  paymentMethod: PaymentMethod.optional(),
  userId: UserId.optional(),
  gymId: GymId.optional(),
  trainerId: UserId.optional(),
  stripePaymentIntentId: z.string().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  hasDispute: z.boolean().optional(),
  fromDate: DateTime.optional(),
  toDate: DateTime.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z.enum(['CREATED_AT', 'AMOUNT', 'PROCESSED_AT']).default('CREATED_AT'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type AdminTransactionQueryParams = z.infer<
  typeof AdminTransactionQueryParams
>

/**
 * Admin transaction list response
 */
export const AdminTransactionListResponse = paginatedResponse(
  AdminTransactionDetailResponse,
)

export type AdminTransactionListResponse = z.infer<
  typeof AdminTransactionListResponse
>

// ============= Financial Summary =============

/**
 * Financial summary
 */
export const FinancialSummary = openapi(
  z.object({
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),

    // Totals
    totalRevenue: Money,
    totalRefunds: Money,
    totalFees: Money,
    netRevenue: Money,

    // By type
    revenueByType: z.record(TransactionType, Money),

    // By payment method
    revenueByPaymentMethod: z.record(PaymentMethod, Money),

    // Counts
    transactionCount: z.number().int().nonnegative(),
    successfulCount: z.number().int().nonnegative(),
    failedCount: z.number().int().nonnegative(),
    disputeCount: z.number().int().nonnegative(),

    // Averages
    averageTransactionAmount: Money,

    // Top performers
    topGyms: z
      .array(
        z.object({
          gymId: GymId,
          gymName: z.string(),
          revenue: Money,
          transactionCount: z.number().int().nonnegative(),
        }),
      )
      .optional(),

    topUsers: z
      .array(
        z.object({
          userId: UserId,
          userName: z.string(),
          spent: Money,
          transactionCount: z.number().int().nonnegative(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Financial summary for a period',
  },
)

export type FinancialSummary = z.infer<typeof FinancialSummary>

// ============= Transaction Actions =============

/**
 * Refund transaction request
 */
export const RefundTransactionRequest = openapi(
  z.object({
    amount: Money.optional().describe('Partial refund amount'),
    reason: z.enum(['DUPLICATE', 'FRAUDULENT', 'CUSTOMER_REQUEST', 'OTHER']),
    description: z.string().max(500),
    notifyUser: z.boolean().default(true),
  }),
  {
    description: 'Refund a transaction',
  },
)

export type RefundTransactionRequest = z.infer<typeof RefundTransactionRequest>

/**
 * Manual adjustment request
 */
export const ManualAdjustmentRequest = openapi(
  z.object({
    userId: UserId,
    amount: Money,
    type: z.enum(['CREDIT', 'DEBIT']),
    reason: z.enum(['COMPENSATION', 'CORRECTION', 'PROMOTIONAL', 'OTHER']),
    description: z.string().max(500),
    notifyUser: z.boolean().default(true),
  }),
  {
    description: 'Create manual adjustment',
  },
)

export type ManualAdjustmentRequest = z.infer<typeof ManualAdjustmentRequest>

// ============= Payout Management =============

/**
 * Payout details
 */
export const PayoutDetail = z.object({
  id: UUID,
  gymId: GymId,
  amount: Money,
  currency: z.string().length(3),
  status: z.enum([
    'SCHEDULED',
    'PROCESSING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
  ]),
  scheduledFor: DateTime,
  processedAt: DateTime.optional(),
  bankAccountId: z.string().optional(),
  stripeTransferId: z.string().optional(),
  failureReason: z.string().optional(),
})

export type PayoutDetail = z.infer<typeof PayoutDetail>

/**
 * Payout list response
 */
export const PayoutListResponse = paginatedResponse(PayoutDetail)

export type PayoutListResponse = z.infer<typeof PayoutListResponse>

/**
 * Process payout request
 */
export const ProcessPayoutRequest = openapi(
  z.object({
    payoutIds: z.array(UUID).min(1).max(100),
    action: z.enum(['APPROVE', 'REJECT', 'DELAY']),
    reason: z.string().max(500).optional(),
    delayUntil: DateTime.optional(),
  }),
  {
    description: 'Process pending payouts',
  },
)

export type ProcessPayoutRequest = z.infer<typeof ProcessPayoutRequest>

// ============= Dispute Management =============

/**
 * Update dispute request
 */
export const UpdateDisputeRequest = openapi(
  z.object({
    status: z.enum(['ACCEPT', 'CHALLENGE']),
    evidence: z
      .array(
        z.object({
          type: z.string(),
          description: z.string(),
          url: z.string().url().optional(),
        }),
      )
      .optional(),
    notes: z.string().max(2000).optional(),
  }),
  {
    description: 'Update dispute status',
  },
)

export type UpdateDisputeRequest = z.infer<typeof UpdateDisputeRequest>

// ============= Promo Code Management =============

/**
 * Admin promo code details
 */
export const AdminPromoCodeDetail = openapi(
  withTimestamps({
    id: UUID,
    code: z.string().toUpperCase(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_CREDITS']),
    value: z.number().positive(),
    description: z.string().optional(),

    // Usage limits
    maxUses: z.number().int().positive().optional(),
    usedCount: z.number().int().nonnegative().default(0),
    maxUsesPerUser: z.number().int().positive().optional(),

    // Date restrictions
    validFrom: DateTime,
    validUntil: DateTime.optional(),

    // Conditions
    minPurchaseAmount: Money.optional(),
    applicableToGyms: z.array(GymId).optional(),
    applicableToUserTiers: z.array(z.string()).optional(),
    firstTimeOnly: z.boolean().default(false),

    // Status
    isActive: z.boolean().default(true),

    // Stats
    totalDiscountGiven: Money.default(0),

    // Admin
    createdBy: UserId,
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Detailed promo code information for admin',
  },
)

export type AdminPromoCodeDetail = z.infer<typeof AdminPromoCodeDetail>

/**
 * Create promo code request
 */
export const CreatePromoCodeRequest = openapi(
  z.object({
    code: z.string().min(3).max(20).toUpperCase(),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_CREDITS']),
    value: z.number().positive(),
    description: z.string().max(500).optional(),

    // Usage limits
    maxUses: z.number().int().positive().optional(),
    maxUsesPerUser: z.number().int().positive().default(1),

    // Date restrictions
    validFrom: DateTime,
    validUntil: DateTime.optional(),

    // Conditions
    minPurchaseAmount: Money.optional(),
    applicableToGyms: z.array(GymId).optional(),
    applicableToUserTiers: z.array(z.string()).optional(),
    firstTimeOnly: z.boolean().default(false),

    // Admin
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Create a new promo code',
  },
)

export type CreatePromoCodeRequest = z.infer<typeof CreatePromoCodeRequest>

/**
 * Update promo code request
 */
export const UpdatePromoCodeRequest = openapi(
  z.object({
    description: z.string().max(500).optional(),

    // Usage limits
    maxUses: z.number().int().positive().optional(),
    maxUsesPerUser: z.number().int().positive().optional(),

    // Date restrictions
    validFrom: DateTime.optional(),
    validUntil: DateTime.optional(),

    // Conditions
    minPurchaseAmount: Money.optional(),
    applicableToGyms: z.array(GymId).optional(),
    applicableToUserTiers: z.array(z.string()).optional(),
    firstTimeOnly: z.boolean().optional(),

    // Status
    isActive: z.boolean().optional(),

    // Admin
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Update promo code',
  },
)

export type UpdatePromoCodeRequest = z.infer<typeof UpdatePromoCodeRequest>

/**
 * Promo code search parameters
 */
export const PromoCodeSearchParams = z.object({
  search: z.string().optional().describe('Search in code or description'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_CREDITS']).optional(),
  isActive: z.boolean().optional(),
  hasExpired: z.boolean().optional(),
  createdBy: UserId.optional(),
  createdFrom: DateTime.optional(),
  createdTo: DateTime.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z
    .enum(['CODE', 'CREATED_AT', 'USED_COUNT', 'VALID_UNTIL'])
    .default('CREATED_AT'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type PromoCodeSearchParams = z.infer<typeof PromoCodeSearchParams>

/**
 * Promo code list response
 */
export const PromoCodeListResponse = paginatedResponse(AdminPromoCodeDetail)

export type PromoCodeListResponse = z.infer<typeof PromoCodeListResponse>

// ============= Subscription Plan Management =============

/**
 * Admin subscription plan details
 */
export const AdminSubscriptionPlanDetail = openapi(
  withTimestamps({
    id: UUID,
    name: z.string(),
    description: z.string(),

    // Pricing
    price: Money,
    currency: z.string().length(3).default('USD'),
    billingInterval: z.enum(['MONTH', 'YEAR']),
    trialPeriodDays: z.number().int().nonnegative().default(0),

    // Features
    features: z.array(z.string()),
    creditAllowance: z.number().int().nonnegative().optional(),
    gymAccessLevel: z.enum(['BASIC', 'PREMIUM', 'UNLIMITED']),

    // Limits
    maxGymsPerMonth: z.number().int().positive().optional(),
    maxSessionsPerMonth: z.number().int().positive().optional(),
    maxTrainersAccess: z.number().int().positive().optional(),

    // Status
    isActive: z.boolean().default(true),
    isPublic: z.boolean().default(true),

    // Stripe
    stripePriceId: z.string().optional(),
    stripeProductId: z.string().optional(),

    // Stats
    activeSubscriptions: z.number().int().nonnegative().default(0),
    totalSubscriptions: z.number().int().nonnegative().default(0),
    monthlyRevenue: Money.default(0),

    // Admin
    createdBy: UserId,
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Detailed subscription plan for admin',
  },
)

export type AdminSubscriptionPlanDetail = z.infer<
  typeof AdminSubscriptionPlanDetail
>

/**
 * Create subscription plan request
 */
export const CreateSubscriptionPlanRequest = openapi(
  z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000),

    // Pricing
    price: Money,
    currency: z.string().length(3).default('USD'),
    billingInterval: z.enum(['MONTH', 'YEAR']),
    trialPeriodDays: z.number().int().nonnegative().default(0),

    // Features
    features: z.array(z.string()),
    creditAllowance: z.number().int().nonnegative().optional(),
    gymAccessLevel: z.enum(['BASIC', 'PREMIUM', 'UNLIMITED']),

    // Limits
    maxGymsPerMonth: z.number().int().positive().optional(),
    maxSessionsPerMonth: z.number().int().positive().optional(),
    maxTrainersAccess: z.number().int().positive().optional(),

    // Status
    isActive: z.boolean().default(true),
    isPublic: z.boolean().default(true),

    // Admin
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Create a new subscription plan',
  },
)

export type CreateSubscriptionPlanRequest = z.infer<
  typeof CreateSubscriptionPlanRequest
>

/**
 * Update subscription plan request
 */
export const UpdateSubscriptionPlanRequest = openapi(
  z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional(),

    // Features (price cannot be changed)
    features: z.array(z.string()).optional(),
    creditAllowance: z.number().int().nonnegative().optional(),
    gymAccessLevel: z.enum(['BASIC', 'PREMIUM', 'UNLIMITED']).optional(),

    // Limits
    maxGymsPerMonth: z.number().int().positive().optional(),
    maxSessionsPerMonth: z.number().int().positive().optional(),
    maxTrainersAccess: z.number().int().positive().optional(),

    // Status
    isActive: z.boolean().optional(),
    isPublic: z.boolean().optional(),

    // Admin
    adminNotes: z.string().optional(),
  }),
  {
    description: 'Update subscription plan',
  },
)

export type UpdateSubscriptionPlanRequest = z.infer<
  typeof UpdateSubscriptionPlanRequest
>

/**
 * Subscription plan search parameters
 */
export const SubscriptionPlanSearchParams = z.object({
  search: z.string().optional().describe('Search in name or description'),
  billingInterval: z.enum(['MONTH', 'YEAR']).optional(),
  gymAccessLevel: z.enum(['BASIC', 'PREMIUM', 'UNLIMITED']).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  createdBy: UserId.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z
    .enum(['NAME', 'PRICE', 'CREATED_AT', 'ACTIVE_SUBSCRIPTIONS'])
    .default('CREATED_AT'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type SubscriptionPlanSearchParams = z.infer<
  typeof SubscriptionPlanSearchParams
>

/**
 * Subscription plan list response
 */
export const SubscriptionPlanListResponse = paginatedResponse(
  AdminSubscriptionPlanDetail,
)

export type SubscriptionPlanListResponse = z.infer<
  typeof SubscriptionPlanListResponse
>

// ============= Financial Reports =============

/**
 * Financial report request
 */
export const FinancialReportRequest = z.object({
  reportType: z.enum([
    'REVENUE',
    'TRANSACTIONS',
    'PAYOUTS',
    'DISPUTES',
    'SUMMARY',
  ]),
  period: z.enum(['7d', '30d', '90d', '1y', 'custom']),
  startDate: DateTime.optional(),
  endDate: DateTime.optional(),
  groupBy: z.enum(['DAY', 'WEEK', 'MONTH']).optional(),
  includeDetails: z.boolean().default(false),
  format: z.enum(['JSON', 'CSV', 'PDF']).default('JSON'),
})

export type FinancialReportRequest = z.infer<typeof FinancialReportRequest>

/**
 * Financial report response
 */
export const FinancialReportResponse = openapi(
  z.object({
    reportType: z.enum([
      'REVENUE',
      'TRANSACTIONS',
      'PAYOUTS',
      'DISPUTES',
      'SUMMARY',
    ]),
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    generatedAt: DateTime,

    // Summary data
    summary: FinancialSummary,

    // Time series data
    timeSeries: z
      .array(
        z.object({
          date: z.string(),
          revenue: Money,
          transactions: z.number().int().nonnegative(),
          refunds: Money,
          disputes: z.number().int().nonnegative(),
        }),
      )
      .optional(),

    // Download URL for CSV/PDF
    downloadUrl: z.string().url().optional(),
  }),
  {
    description: 'Financial report data',
  },
)

export type FinancialReportResponse = z.infer<typeof FinancialReportResponse>

// PaymentStatsResponse
export const PaymentStatsResponse = FinancialSummary
export type PaymentStatsResponse = z.infer<typeof PaymentStatsResponse>

// CreatePayoutRequest
export const CreatePayoutRequest = ProcessPayoutRequest
export type CreatePayoutRequest = z.infer<typeof CreatePayoutRequest>

// PayoutIdParam
export const PayoutIdParam = z.object({ id: UUID })
export type PayoutIdParam = z.infer<typeof PayoutIdParam>
