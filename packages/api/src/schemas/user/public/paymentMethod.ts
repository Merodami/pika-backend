import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'

/**
 * User payment method schemas
 */

// ============= Payment Method Types =============

export const PaymentMethodType = z.enum([
  'CARD',
  'BANK_ACCOUNT',
  'PAYPAL',
  'APPLE_PAY',
  'GOOGLE_PAY',
  'WALLET',
])

export const PaymentMethodTypeSchema = PaymentMethodType.openapi(
  'PaymentMethodType',
  {
    description: 'Type of payment method',
    example: 'CARD',
  },
)

export type PaymentMethodType = z.infer<typeof PaymentMethodType>

export const CardBrand = z.enum([
  'VISA',
  'MASTERCARD',
  'AMEX',
  'DISCOVER',
  'DINERS',
  'JCB',
  'UNIONPAY',
  'UNKNOWN',
])

export const CardBrandSchema = CardBrand.openapi('CardBrand', {
  description: 'Card brand',
  example: 'VISA',
})

export type CardBrand = z.infer<typeof CardBrand>

// ============= Payment Method =============

/**
 * User payment method (raw Zod)
 */
export const PaymentMethod = withTimestamps({
  id: UUID,
  userId: UserId,

  // Stripe reference
  stripePaymentMethodId: z.string(),

  // Method details
  type: PaymentMethodTypeSchema,
  isDefault: z.boolean().default(false),

  // Card details (when type is CARD)
  card: z
    .object({
      brand: CardBrandSchema,
      last4: z.string().length(4),
      expMonth: z.number().int().min(1).max(12),
      expYear: z.number().int().min(new Date().getFullYear()),
      holderName: z.string().optional(),
      country: z.string().length(2).optional(),
      funding: z.enum(['CREDIT', 'DEBIT', 'PREPAID', 'UNKNOWN']).optional(),
    })
    .optional(),

  // Bank account details (when type is BANK_ACCOUNT)
  bankAccount: z
    .object({
      bankName: z.string().optional(),
      last4: z.string().length(4),
      accountHolderName: z.string(),
      accountHolderType: z.enum(['INDIVIDUAL', 'COMPANY']),
      country: z.string().length(2),
      currency: z.string().length(3),
    })
    .optional(),

  // Digital wallet details
  wallet: z
    .object({
      type: z.enum(['APPLE_PAY', 'GOOGLE_PAY', 'SAMSUNG_PAY']),
      dynamicLast4: z.string().length(4).optional(),
    })
    .optional(),

  // Billing address
  billingAddress: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().length(2).optional(),
    })
    .optional(),

  // Metadata
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * User payment method (OpenAPI documented)
 */
export const PaymentMethodSchema = PaymentMethod.openapi('PaymentMethod', {
  description: 'User payment method',
})

export type PaymentMethod = z.infer<typeof PaymentMethod>

// ============= Add Payment Method =============

/**
 * Add payment method request (raw Zod)
 */
export const AddPaymentMethodRequest = z.object({
  // Stripe payment method ID from frontend
  stripePaymentMethodId: z.string(),

  // Make default
  makeDefault: z.boolean().optional(),

  // Billing address (optional, can be set from Stripe)
  billingAddress: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      postalCode: z.string(),
      country: z.string().length(2),
    })
    .optional(),
})

/**
 * Add payment method request (OpenAPI documented)
 */
export const AddPaymentMethodRequestSchema = AddPaymentMethodRequest.openapi(
  'AddPaymentMethodRequest',
  {
    description: 'Add a payment method',
  },
)

export type AddPaymentMethodRequest = z.infer<typeof AddPaymentMethodRequest>

// ============= Update Payment Method =============

/**
 * Update payment method request (raw Zod)
 */
export const UpdatePaymentMethodRequest = z.object({
  isDefault: z.boolean().optional(),
  billingAddress: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().length(2).optional(),
    })
    .optional(),
})

/**
 * Update payment method request (OpenAPI documented)
 */
export const UpdatePaymentMethodRequestSchema =
  UpdatePaymentMethodRequest.openapi('UpdatePaymentMethodRequest', {
    description: 'Update payment method',
  })

export type UpdatePaymentMethodRequest = z.infer<
  typeof UpdatePaymentMethodRequest
>

// ============= Payment Method List =============

/**
 * User payment methods response (raw Zod)
 */
export const UserPaymentMethodsResponse = z.object({
  paymentMethods: z.array(PaymentMethod),
  defaultPaymentMethodId: UUID.optional(),
  hasValidPaymentMethod: z.boolean(),
})

/**
 * User payment methods response (OpenAPI documented)
 */
export const UserPaymentMethodsResponseSchema =
  UserPaymentMethodsResponse.openapi('UserPaymentMethodsResponse', {
    description: 'User payment methods list',
  })

export type UserPaymentMethodsResponse = z.infer<
  typeof UserPaymentMethodsResponse
>

// ============= Payment Method Verification =============

/**
 * Verify payment method request (for 3D Secure, etc.) (raw Zod)
 */
export const VerifyPaymentMethodRequest = z.object({
  paymentMethodId: UUID,
  amount: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('Amount in cents for verification'),
  returnUrl: z
    .string()
    .url()
    .optional()
    .describe('URL to return after verification'),
})

/**
 * Verify payment method request (OpenAPI documented)
 */
export const VerifyPaymentMethodRequestSchema =
  VerifyPaymentMethodRequest.openapi('VerifyPaymentMethodRequest', {
    description: 'Verify payment method',
  })

export type VerifyPaymentMethodRequest = z.infer<
  typeof VerifyPaymentMethodRequest
>

/**
 * Payment method verification response (raw Zod)
 */
export const PaymentMethodVerificationResponse = z.object({
  status: z.enum(['SUCCEEDED', 'REQUIRES_ACTION', 'FAILED']),
  clientSecret: z
    .string()
    .optional()
    .describe('Client secret for frontend verification'),
  redirectUrl: z
    .string()
    .url()
    .optional()
    .describe('URL for 3D Secure verification'),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
})

/**
 * Payment method verification response (OpenAPI documented)
 */
export const PaymentMethodVerificationResponseSchema =
  PaymentMethodVerificationResponse.openapi(
    'PaymentMethodVerificationResponse',
    {
      description: 'Payment method verification result',
    },
  )

export type PaymentMethodVerificationResponse = z.infer<
  typeof PaymentMethodVerificationResponse
>

// ============= Setup Intent =============

/**
 * Create setup intent request (raw Zod)
 */
export const CreateSetupIntentRequest = z.object({
  paymentMethodTypes: z.array(z.string()).optional().default(['card']),
  usage: z
    .enum(['ON_SESSION', 'OFF_SESSION'])
    .optional()
    .default('OFF_SESSION'),
})

/**
 * Create setup intent request (OpenAPI documented)
 */
export const CreateSetupIntentRequestSchema = CreateSetupIntentRequest.openapi(
  'CreateSetupIntentRequest',
  {
    description: 'Create Stripe Setup Intent for adding payment methods',
  },
)

export type CreateSetupIntentRequest = z.infer<typeof CreateSetupIntentRequest>

/**
 * Setup intent response (raw Zod)
 */
export const SetupIntentResponse = z.object({
  clientSecret: z.string(),
  setupIntentId: z.string(),
})

/**
 * Setup intent response (OpenAPI documented)
 */
export const SetupIntentResponseSchema = SetupIntentResponse.openapi(
  'SetupIntentResponse',
  {
    description: 'Stripe Setup Intent details',
  },
)

export type SetupIntentResponse = z.infer<typeof SetupIntentResponse>
