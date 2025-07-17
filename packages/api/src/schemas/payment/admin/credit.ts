import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Admin credit management schemas
 */

// ============= Admin Credit Operations =============

/**
 * Add credits to user request (admin only)
 */
export const AdminAddCreditsToUserRequest = openapi(
  z.object({
    amount: z.number().int().positive().describe('Amount of credits to add'),
    description: z.string().describe('Reason for adding credits'),
    promoCode: z.string().optional(),
    transactionId: z.string().optional(),
  }),
  {
    description: 'Admin add credits to user',
  },
)

export type AdminAddCreditsToUserRequest = z.infer<
  typeof AdminAddCreditsToUserRequest
>

/**
 * Create user credits request (admin only)
 */
export const AdminCreateUserCreditsRequest = openapi(
  z.object({
    userId: UserId,
    amountDemand: z.number().int().nonnegative().default(0),
    amountSub: z.number().int().nonnegative().default(0),
  }),
  {
    description: 'Admin create new user credits record',
  },
)

export type AdminCreateUserCreditsRequest = z.infer<
  typeof AdminCreateUserCreditsRequest
>

/**
 * Update user credits request (admin only)
 */
export const AdminUpdateUserCreditsRequest = openapi(
  z.object({
    amountDemand: z.number().int().nonnegative().optional(),
    amountSub: z.number().int().nonnegative().optional(),
  }),
  {
    description: 'Admin update user credits',
  },
)

export type AdminUpdateUserCreditsRequest = z.infer<
  typeof AdminUpdateUserCreditsRequest
>
