import { z } from 'zod'

import { Money } from '../../../common/schemas/branded.js'
import { DateTime } from '../../../common/schemas/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'
import { CreditPackType } from '../../../public/schemas/payment/credit.js'

/**
 * Admin credit pack management schemas
 */

// ============= Create Credit Pack =============

/**
 * Create credit pack request (admin)
 */
export const CreateCreditPackRequest = openapi(
  z.object({
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
    description: 'Create a new credit pack',
  },
)

export type CreateCreditPackRequest = z.infer<typeof CreateCreditPackRequest>

// ============= Update Credit Pack =============

/**
 * Update credit pack request (admin)
 */
export const UpdateCreditPackRequest = openapi(
  z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    type: CreditPackType.optional(),
    amount: z.number().int().positive().optional(),
    price: Money.optional(),
    currency: z.string().length(3).optional(),
    active: z.boolean().optional(),

    // Validity
    validityDays: z.number().int().positive().optional(),

    // Restrictions
    maxPurchasesPerUser: z.number().int().positive().optional(),
    availableFrom: DateTime.optional(),
    availableUntil: DateTime.optional(),

    // Display
    featured: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
    badge: z.string().max(50).optional(),
  }),
  {
    description: 'Update an existing credit pack',
  },
)

export type UpdateCreditPackRequest = z.infer<typeof UpdateCreditPackRequest>
