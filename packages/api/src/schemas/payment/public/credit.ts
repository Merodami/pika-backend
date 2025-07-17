import { z } from 'zod'

import {
  Credits as CreditsType,
  Money,
  UserId,
} from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Credit management schemas for public API
 */

// ============= Enums =============

export const CreditOperation = z.enum(['INCREASE', 'DECREASE'])
export type CreditOperation = z.infer<typeof CreditOperation>

export const CreditType = z.enum(['DEMAND', 'SUBSCRIPTION'])
export type CreditType = z.infer<typeof CreditType>

export const CreditPackType = z.enum([
  'MONTHLY',
  'QUARTERLY',
  'ANNUAL',
  'ONE_TIME',
])
export type CreditPackType = z.infer<typeof CreditPackType>

// ============= User Credits =============

/**
 * User credit balance
 */
export const UserCreditsResponse = openapi(
  withTimestamps({
    id: UUID,
    userId: UserId,
    amountDemand: CreditsType.describe('On-demand credits balance'),
    amountSub: CreditsType.describe('Subscription credits balance'),
    totalCredits: CreditsType.describe('Total available credits'),
  }),
  {
    description: 'User credit balance information',
  },
)

export type UserCreditsResponse = z.infer<typeof UserCreditsResponse>

// ============= Credit History =============

/**
 * Credit transaction history entry
 */
export const CreditHistoryEntry = openapi(
  z.object({
    id: UUID,
    userId: UserId,
    creditsId: UUID,
    amount: CreditsType,
    description: z.string().max(500),
    operation: CreditOperation,
    type: CreditType,
    transactionId: z
      .string()
      .optional()
      .describe('External transaction reference'),
    date: DateTime,

    // Additional context
    sessionId: UUID.optional().describe(
      'Related session if credit was used for booking',
    ),
    creditPackId: UUID.optional().describe('Related credit pack if purchased'),
    expiresAt: DateTime.optional().describe('When these credits expire'),
  }),
  {
    description: 'Credit transaction history entry',
  },
)

export type CreditHistoryEntry = z.infer<typeof CreditHistoryEntry>

// ============= Credit Packs =============

/**
 * Available credit pack for purchase
 */
export const CreditPack = openapi(
  withTimestamps({
    id: UUID,
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    type: CreditPackType,
    amount: z.number().int().positive().describe('Number of credits in pack'),
    price: Money.describe('Price in cents'),
    currency: z.string().length(3).default('USD'),
    active: z.boolean().default(true),

    // Validity
    validityDays: z
      .number()
      .int()
      .positive()
      .optional()
      .describe('How long credits are valid'),

    // Restrictions
    maxPurchasesPerUser: z.number().int().positive().optional(),
    availableFrom: DateTime.optional(),
    availableUntil: DateTime.optional(),

    // Display
    featured: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    badge: z
      .string()
      .max(50)
      .optional()
      .describe('Special badge text like "Best Value"'),
  }),
  {
    description: 'Credit pack available for purchase',
  },
)

export type CreditPack = z.infer<typeof CreditPack>

// ============= Purchase Credit Pack =============

/**
 * Purchase credit pack request
 */
export const PurchaseCreditPackRequest = openapi(
  z.object({
    creditPackId: UUID,
    paymentMethodId: z.string().describe('Stripe payment method ID'),
    promoCode: z.string().optional(),
  }),
  {
    description: 'Purchase a credit pack',
  },
)

export type PurchaseCreditPackRequest = z.infer<
  typeof PurchaseCreditPackRequest
>

/**
 * Purchase credit pack response
 */
export const PurchaseCreditPackResponse = openapi(
  z.object({
    success: z.boolean(),
    creditsAdded: CreditsType,
    newBalance: UserCreditsResponse,
    transaction: CreditHistoryEntry,
    paymentId: z.string().describe('Payment transaction ID'),
    receipt: z
      .object({
        url: z.string().url(),
        number: z.string(),
      })
      .optional(),
  }),
  {
    description: 'Credit pack purchase confirmation',
  },
)

export type PurchaseCreditPackResponse = z.infer<
  typeof PurchaseCreditPackResponse
>

// ============= Credit Usage =============

/**
 * Use credits request
 */
export const UseCreditsRequest = openapi(
  z.object({
    amount: z.number().int().positive(),
    type: CreditType,
    sessionId: UUID.optional(),
    description: z.string().max(500),
  }),
  {
    description: 'Use credits for a service',
  },
)

export type UseCreditsRequest = z.infer<typeof UseCreditsRequest>

/**
 * Credit usage response
 */
export const UseCreditsResponse = openapi(
  z.object({
    success: z.boolean(),
    creditsUsed: CreditsType,
    remainingBalance: UserCreditsResponse,
    transaction: CreditHistoryEntry,
  }),
  {
    description: 'Credit usage confirmation',
  },
)

export type UseCreditsResponse = z.infer<typeof UseCreditsResponse>

// ============= Consume Credits =============

/**
 * Consume credits request (separate demand and subscription amounts)
 */
export const ConsumeCreditsRequest = openapi(
  z.object({
    demandAmount: z
      .number()
      .int()
      .nonnegative()
      .describe('Amount of demand credits to consume'),
    subAmount: z
      .number()
      .int()
      .nonnegative()
      .describe('Amount of subscription credits to consume'),
    description: z.string().max(500),
  }),
  {
    description: 'Consume specific amounts of demand and subscription credits',
  },
)

export type ConsumeCreditsRequest = z.infer<typeof ConsumeCreditsRequest>

/**
 * Smart consume credits request (auto-prioritize subscription credits)
 */
export const ConsumeCreditsSmartRequest = openapi(
  z.object({
    totalAmount: z
      .number()
      .int()
      .positive()
      .describe('Total credits to consume'),
    description: z.string().max(500),
  }),
  {
    description:
      'Consume credits with automatic prioritization (subscription first)',
  },
)

export type ConsumeCreditsSmartRequest = z.infer<
  typeof ConsumeCreditsSmartRequest
>

/**
 * Transfer credits request
 */
export const TransferCreditsRequest = openapi(
  z.object({
    toUserId: UserId.describe('Recipient user ID'),
    amount: z
      .number()
      .int()
      .positive()
      .describe('Amount of credits to transfer'),
    description: z.string().max(500),
  }),
  {
    description: 'Transfer credits to another user',
  },
)

export type TransferCreditsRequest = z.infer<typeof TransferCreditsRequest>

/**
 * Transfer credits response
 */
export const TransferCreditsResponse = openapi(
  z.object({
    from: UserCreditsResponse.describe("Sender's new balance"),
    to: UserCreditsResponse.describe("Recipient's new balance"),
    amount: z.number().int().positive().describe('Amount transferred'),
    transaction: CreditHistoryEntry,
  }),
  {
    description: 'Credit transfer confirmation',
  },
)

export type TransferCreditsResponse = z.infer<typeof TransferCreditsResponse>

// ============= Add Credits Service (Legacy) =============

/**
 * Add credits service request (legacy endpoint)
 */
export const AddCreditsServiceRequest = openapi(
  z.object({
    creditsObject: z
      .object({
        userId: UserId,
        amountDemand: z.number().int().nonnegative().default(0),
        amountSub: z.number().int().nonnegative().default(0),
      })
      .describe('Credits to add'),
    promoCode: z.string().optional().describe('Promotional code'),
    price: z.number().optional().describe('Price paid (for tracking)'),
  }),
  {
    description: 'Add credits to user account (legacy endpoint)',
  },
)

export type AddCreditsServiceRequest = z.infer<typeof AddCreditsServiceRequest>

// ============= Get Credit Information =============

/**
 * Get user credits response
 */
export const GetUserCreditsResponse = openapi(
  UserCreditsResponse.extend({
    history: z.array(CreditHistoryEntry).describe('Recent credit transactions'),
    expiringCredits: z
      .array(
        z.object({
          amount: CreditsType,
          expiresAt: DateTime,
          type: CreditType,
        }),
      )
      .describe('Credits expiring soon'),
  }),
  {
    description: 'User credit balance and history',
  },
)

export type GetUserCreditsResponse = z.infer<typeof GetUserCreditsResponse>

/**
 * Get available credit packs response
 */
export const GetCreditPacksResponse = openapi(
  z.object({
    packs: z.array(CreditPack),
    userPurchaseHistory: z
      .array(
        z.object({
          creditPackId: UUID,
          purchaseCount: z.number().int().nonnegative(),
          lastPurchased: DateTime.optional(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Available credit packs for purchase',
  },
)

export type GetCreditPacksResponse = z.infer<typeof GetCreditPacksResponse>

/**
 * Credit history query parameters
 */
export const CreditHistoryParams = z.object({
  startDate: DateTime.optional(),
  endDate: DateTime.optional(),
  operation: CreditOperation.optional(),
  type: CreditType.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
})

export type CreditHistoryParams = z.infer<typeof CreditHistoryParams>

/**
 * Credit history response
 */
export const CreditHistoryResponse = paginatedResponse(CreditHistoryEntry)

export type CreditHistoryResponse = z.infer<typeof CreditHistoryResponse>

// ============= Path Parameters =============

/**
 * Credit pack ID parameter
 */
export const CreditPackIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Credit pack ID path parameter',
  },
)

export type CreditPackIdParam = z.infer<typeof CreditPackIdParam>

// ============= Query Parameters =============

/**
 * Get active credit packs query
 */
export const GetActiveCreditPacksQuery = openapi(
  z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    sort: z.enum(['price', 'credits', 'name']).optional().default('price'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
  {
    description: 'Query parameters for getting active credit packs',
  },
)

export type GetActiveCreditPacksQuery = z.infer<
  typeof GetActiveCreditPacksQuery
>

/**
 * Get all credit packs query (admin)
 */
export const GetAllCreditPacksQuery = openapi(
  z.object({
    isActive: z.coerce.boolean().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
  {
    description: 'Query parameters for getting all credit packs (admin)',
  },
)

export type GetAllCreditPacksQuery = z.infer<typeof GetAllCreditPacksQuery>

// ============= Missing Schemas for API Generator =============

/**
 * Credit balance response (focused on balance only)
 */
export const CreditBalanceResponse = openapi(
  z.object({
    userId: UserId,
    totalCredits: CreditsType.describe('Total available credits'),
    demandCredits: CreditsType.describe('On-demand credits balance'),
    subscriptionCredits: CreditsType.describe('Subscription credits balance'),

    // Next expiration info (if any)
    nextExpiration: z
      .object({
        amount: CreditsType,
        expiresAt: DateTime,
        type: CreditType,
      })
      .optional()
      .describe('Next credits expiring'),
  }),
  {
    description: 'User credit balance summary (balance-focused, no history)',
  },
)

export type CreditBalanceResponse = z.infer<typeof CreditBalanceResponse>

/**
 * Credit transaction list response
 */
export const CreditTransactionListResponse =
  paginatedResponse(CreditHistoryEntry)

export type CreditTransactionListResponse = z.infer<
  typeof CreditTransactionListResponse
>

/**
 * Purchase credits request (more general than pack-specific)
 */
export const PurchaseCreditsRequest = openapi(
  z.object({
    amount: z
      .number()
      .int()
      .positive()
      .describe('Number of credits to purchase'),
    paymentMethodId: z.string().optional().describe('Stripe payment method ID'),

    // Optional pack reference
    creditPackId: UUID.optional().describe('Use a predefined credit pack'),

    // Custom purchase details (if not using pack)
    priceOverride: Money.optional().describe('Custom price in cents'),

    // Metadata
    metadata: z.record(z.any()).optional(),
  }),
  {
    description:
      'Purchase credits (flexible - can use packs or custom amounts)',
  },
)

export type PurchaseCreditsRequest = z.infer<typeof PurchaseCreditsRequest>

/**
 * Purchase credits response (more general than pack-specific)
 */
export const PurchaseCreditsResponse = openapi(
  z.object({
    success: z.boolean(),
    creditsAdded: z.number().int().positive(),
    totalCredits: z.number().int().nonnegative(),
    amountPaid: Money.describe('Amount paid in cents'),
    currency: z.string().length(3).default('USD'),

    // Transaction details
    transactionId: z.string().describe('Payment transaction ID'),
    creditTransactionId: UUID.describe('Credit transaction record ID'),

    // Receipt info
    receipt: z
      .object({
        receiptUrl: z.string().url().optional(),
        receiptNumber: z.string(),
      })
      .optional(),
  }),
  {
    description: 'Purchase credits completion response',
  },
)

export type PurchaseCreditsResponse = z.infer<typeof PurchaseCreditsResponse>

/**
 * Credit package list response (available packages for purchase)
 */
export const CreditPackageListResponse = openapi(
  z.object({
    packages: z.array(CreditPack),
    featured: z.array(UUID).optional().describe('Featured package IDs'),
    totalCount: z.number().int().nonnegative(),
  }),
  {
    description: 'Available credit packages for purchase',
  },
)

export type CreditPackageListResponse = z.infer<
  typeof CreditPackageListResponse
>

/**
 * Credit transaction query parameters
 */
export const CreditTransactionQueryParams = openapi(
  z.object({
    operation: CreditOperation.optional(),
    type: CreditType.optional(),
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sort: z.enum(['date', 'amount', 'operation']).default('date'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),
  {
    description: 'Query parameters for credit transaction history',
  },
)

export type CreditTransactionQueryParams = z.infer<
  typeof CreditTransactionQueryParams
>

/**
 * Credits ID parameter
 */
export const CreditsIdParam = openapi(
  z.object({
    id: UUID,
  }),
  {
    description: 'Credits ID path parameter',
  },
)

export type CreditsIdParam = z.infer<typeof CreditsIdParam>
