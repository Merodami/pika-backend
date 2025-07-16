import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Internal credit operation schemas for service-to-service communication
 */

// ============= Credit Operations =============

/**
 * Internal credit operation request
 */
export const InternalCreditOperationRequest = openapi(
  z.object({
    userId: UserId,
    operation: z.enum(['ADD', 'SUBTRACT', 'RESERVE', 'RELEASE', 'EXPIRE']),
    amount: z.number().int().positive(),

    // Operation details
    reason: z.enum([
      'SUBSCRIPTION_GRANT',
      'PURCHASE',
      'REFUND',
      'CANCELLATION',
      'MANUAL_ADJUSTMENT',
      'PROMOTION',
      'EXPIRATION',
      'SYSTEM_ERROR',
    ]),
    description: z.string(),

    // Reference
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),

    // Expiration
    expiresAt: DateTime.optional().describe('For ADD operations'),

    // Metadata
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Internal credit operation',
  },
)

export type InternalCreditOperationRequest = z.infer<
  typeof InternalCreditOperationRequest
>

/**
 * Internal credit operation response
 */
export const InternalCreditOperationResponse = openapi(
  z.object({
    operationId: UUID,
    userId: UserId,
    operation: z.string(),
    amount: z.number().int(),

    // Balances
    previousBalance: z.number().int().nonnegative(),
    newBalance: z.number().int().nonnegative(),

    // Reserved credits
    reservedCredits: z.number().int().nonnegative().optional(),

    // Result
    success: z.boolean(),
    errorMessage: z.string().optional(),

    timestamp: DateTime,
  }),
  {
    description: 'Credit operation result',
  },
)

export type InternalCreditOperationResponse = z.infer<
  typeof InternalCreditOperationResponse
>

// ============= Credit Balance =============

/**
 * Get credit balance request
 */
export const GetCreditBalanceRequest = openapi(
  z.object({
    userId: UserId,
    includeReserved: z.boolean().default(true),
    includeExpiring: z.boolean().default(true),
  }),
  {
    description: 'Get user credit balance',
  },
)

export type GetCreditBalanceRequest = z.infer<typeof GetCreditBalanceRequest>

/**
 * Credit balance response
 */
export const CreditBalanceResponse = openapi(
  z.object({
    userId: UserId,

    // Balances
    totalCredits: z.number().int().nonnegative(),
    availableCredits: z.number().int().nonnegative(),
    reservedCredits: z.number().int().nonnegative(),

    // Expiring credits
    expiringCredits: z
      .array(
        z.object({
          amount: z.number().int().positive(),
          expiresAt: DateTime,
        }),
      )
      .optional(),

    // Next expiration
    nextExpirationDate: DateTime.optional(),
    nextExpirationAmount: z.number().int().nonnegative().optional(),

    lastUpdated: DateTime,
  }),
  {
    description: 'User credit balance details',
  },
)

export type CreditBalanceResponse = z.infer<typeof CreditBalanceResponse>

// ============= Credit Reservation =============

/**
 * Reserve credits request
 */
export const ReserveCreditsRequest = openapi(
  z.object({
    userId: UserId,
    amount: z.number().int().positive(),
    reason: z.string(),
    referenceType: z.string(),
    referenceId: z.string(),
    expiresIn: z
      .number()
      .int()
      .positive()
      .describe('Reservation expiry in seconds'),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Reserve credits for future use',
  },
)

export type ReserveCreditsRequest = z.infer<typeof ReserveCreditsRequest>

/**
 * Reserve credits response
 */
export const ReserveCreditsResponse = openapi(
  z.object({
    reservationId: UUID,
    userId: UserId,
    amount: z.number().int().positive(),
    expiresAt: DateTime,
    success: z.boolean(),
    errorMessage: z.string().optional(),
  }),
  {
    description: 'Credit reservation result',
  },
)

export type ReserveCreditsResponse = z.infer<typeof ReserveCreditsResponse>

/**
 * Release reserved credits request
 */
export const ReleaseReservedCreditsRequest = openapi(
  z.object({
    reservationId: UUID,
    amountToConsume: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Amount to consume, remainder is released'),
  }),
  {
    description: 'Release or consume reserved credits',
  },
)

export type ReleaseReservedCreditsRequest = z.infer<
  typeof ReleaseReservedCreditsRequest
>

// ============= Credit Transfer =============

/**
 * Transfer credits request
 */
export const TransferCreditsRequest = openapi(
  z.object({
    fromUserId: UserId,
    toUserId: UserId,
    amount: z.number().int().positive(),
    reason: z.string(),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Transfer credits between users',
  },
)

export type TransferCreditsRequest = z.infer<typeof TransferCreditsRequest>

/**
 * Transfer credits response
 */
export const TransferCreditsResponse = openapi(
  z.object({
    transferId: UUID,
    fromUserId: UserId,
    toUserId: UserId,
    amount: z.number().int().positive(),

    // New balances
    fromUserBalance: z.number().int().nonnegative(),
    toUserBalance: z.number().int().nonnegative(),

    success: z.boolean(),
    errorMessage: z.string().optional(),

    timestamp: DateTime,
  }),
  {
    description: 'Credit transfer result',
  },
)

export type TransferCreditsResponse = z.infer<typeof TransferCreditsResponse>

// ============= Credit History =============

/**
 * Get credit history request
 */
export const GetCreditHistoryRequest = openapi(
  z.object({
    userId: UserId,
    fromDate: DateTime.optional(),
    toDate: DateTime.optional(),
    operations: z.array(z.string()).optional(),
    limit: z.number().int().positive().max(100).default(50),
    offset: z.number().int().nonnegative().default(0),
  }),
  {
    description: 'Get user credit history',
  },
)

export type GetCreditHistoryRequest = z.infer<typeof GetCreditHistoryRequest>

/**
 * Credit history entry
 */
export const CreditHistoryEntry = z.object({
  id: UUID,
  userId: UserId,
  operation: z.string(),
  amount: z.number().int(),
  balanceBefore: z.number().int().nonnegative(),
  balanceAfter: z.number().int().nonnegative(),
  reason: z.string(),
  description: z.string(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  createdAt: DateTime,
})

export type CreditHistoryEntry = z.infer<typeof CreditHistoryEntry>

/**
 * Credit history response
 */
export const CreditHistoryResponse = openapi(
  z.object({
    userId: UserId,
    entries: z.array(CreditHistoryEntry),
    hasMore: z.boolean(),
    total: z.number().int().nonnegative(),
  }),
  {
    description: 'User credit history',
  },
)

export type CreditHistoryResponse = z.infer<typeof CreditHistoryResponse>

// ============= Bulk Credit Operations =============

/**
 * Bulk credit grant request
 */
export const BulkCreditGrantRequest = openapi(
  z.object({
    userIds: z.array(UserId).min(1).max(1000),
    amount: z.number().int().positive(),
    reason: z.string(),
    expiresAt: DateTime.optional(),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Grant credits to multiple users',
  },
)

export type BulkCreditGrantRequest = z.infer<typeof BulkCreditGrantRequest>

/**
 * Bulk credit grant response
 */
export const BulkCreditGrantResponse = openapi(
  z.object({
    batchId: UUID,
    successful: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    totalCreditsGranted: z.number().int().nonnegative(),
    failures: z
      .array(
        z.object({
          userId: UserId,
          error: z.string(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Bulk credit grant result',
  },
)

export type BulkCreditGrantResponse = z.infer<typeof BulkCreditGrantResponse>
