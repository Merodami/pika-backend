import { z } from 'zod'

import { openapi } from '../../../../common/utils/openapi.js'
import { GeoJSONPoint } from '../../../shared/geo.js'
import { DateTime, UUID } from '../../../shared/primitives.js'
import { VoucherDiscountTypeSchema } from '../../common/enums.js'

/**
 * Step-specific schemas for voucher wizard
 */

/**
 * Step 1: Business & Category selection (raw Zod)
 */
export const Step1Request = z.object({
  businessId: UUID.describe('Business creating the voucher'),
  categoryId: UUID.optional().describe(
    'Optional category for voucher classification',
  ),
})

/**
 * Step 1 request (OpenAPI documented)
 */
export const Step1RequestSchema = openapi(
  Step1Request,
  {
    description: 'Step 1: Business and category selection',
  },
)

export type Step1Request = z.infer<typeof Step1Request>

/**
 * Step 1 response (raw Zod)
 */
export const Step1Response = z.object({
  businessId: UUID,
  categoryId: UUID.nullable(),
})

/**
 * Step 1 response (OpenAPI documented)
 */
export const Step1ResponseSchema = openapi(
  Step1Response,
  {
    description: 'Step 1 response data',
  },
)

export type Step1Response = z.infer<typeof Step1Response>

/**
 * Step 2: Content (multilingual) (raw Zod)
 * Following the translation pattern - we accept multilingual content
 * but store only keys in the database
 */
export const Step2Request = z.object({
  title: z
    .record(z.string(), z.string().min(1).max(100))
    .describe('Title translations by language code (es, en, gn)'),
  description: z
    .record(z.string(), z.string().min(1).max(500))
    .describe('Description translations by language code'),
  termsAndConditions: z
    .record(z.string(), z.string().min(1).max(1000))
    .describe('Terms and conditions translations by language code'),
})

/**
 * Step 2 request (OpenAPI documented)
 */
export const Step2RequestSchema = openapi(
  Step2Request,
  {
    description: 'Step 2: Multilingual content',
  },
)

export type Step2Request = z.infer<typeof Step2Request>

/**
 * Step 2 response (raw Zod)
 */
export const Step2Response = z.object({
  // Return the submitted content for display (resolved translations)
  title: z.record(z.string(), z.string()),
  description: z.record(z.string(), z.string()),
  termsAndConditions: z.record(z.string(), z.string()),
  // Keys are stored internally but not exposed in responses
})

/**
 * Step 2 response (OpenAPI documented)
 */
export const Step2ResponseSchema = openapi(
  Step2Response,
  {
    description: 'Step 2 response data',
  },
)

export type Step2Response = z.infer<typeof Step2Response>

/**
 * Step 3: Discount configuration (raw Zod)
 */
export const Step3Request = z.object({
  discountType: VoucherDiscountTypeSchema,
  discountValue: z
    .number()
    .positive()
    .optional()
    .describe('Value for discount (percentage or fixed amount)'),
  currency: z
    .string()
    .default('PYG')
    .describe('Currency for fixed value discounts'),

  // Additional fields for specific discount types
  itemDescription: z.string().optional().describe('For FREE_ITEM type'),
  buyQuantity: z.number().int().positive().optional().describe('For BOGO type'),
  getQuantity: z.number().int().positive().optional().describe('For BOGO type'),
})

/**
 * Step 3 request (OpenAPI documented)
 */
export const Step3RequestSchema = openapi(
  Step3Request,
  {
    description: 'Step 3: Discount configuration',
  },
)

export type Step3Request = z.infer<typeof Step3Request>

/**
 * Step 3 response (raw Zod)
 */
export const Step3Response = z.object({
  discountType: VoucherDiscountTypeSchema,
  discountValue: z.number().nullable(),
  currency: z.string(),
  calculatedSavings: z
    .number()
    .optional()
    .describe('Estimated savings for customers'),
})

/**
 * Step 3 response (OpenAPI documented)
 */
export const Step3ResponseSchema = openapi(
  Step3Response,
  {
    description: 'Step 3 response data',
  },
)

export type Step3Response = z.infer<typeof Step3Response>

/**
 * Step 4: Validity & Limits (raw Zod)
 */
export const Step4Request = z.object({
  validFrom: DateTime.describe('Start date/time for voucher validity'),
  validUntil: DateTime.describe('Expiration date/time'),
  maxRedemptions: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional()
    .describe('Total redemption limit (null = unlimited)'),
  maxRedemptionsPerUser: z
    .number()
    .int()
    .positive()
    .default(1)
    .describe('Per-user redemption limit'),
  timezone: z.string().optional().describe('Timezone for date/time display'),
})

/**
 * Step 4 request (OpenAPI documented)
 */
export const Step4RequestSchema = openapi(
  Step4Request,
  {
    description: 'Step 4: Validity and limits',
  },
)

export type Step4Request = z.infer<typeof Step4Request>

/**
 * Step 4 response (raw Zod)
 */
export const Step4Response = z.object({
  validFrom: DateTime,
  validUntil: DateTime,
  maxRedemptions: z.number().nullable(),
  maxRedemptionsPerUser: z.number(),
  durationDays: z.number().describe('Validity duration in days'),
  estimatedRedemptions: z
    .number()
    .optional()
    .describe('Based on category averages'),
})

/**
 * Step 4 response (OpenAPI documented)
 */
export const Step4ResponseSchema = openapi(
  Step4Response,
  {
    description: 'Step 4 response data',
  },
)

export type Step4Response = z.infer<typeof Step4Response>

/**
 * Step 5: Media & Targeting (Optional) (raw Zod)
 */
export const Step5Request = z.object({
  imageUrl: z.string().url().optional().describe('Voucher image URL'),
  location: GeoJSONPoint.optional().describe(
    'Geographic location for targeting',
  ),
  locationRadius: z
    .number()
    .positive()
    .optional()
    .describe('Radius in meters for location targeting'),
  targetSegments: z
    .array(z.string())
    .optional()
    .describe('Customer segment IDs for targeting'),
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe('Additional metadata'),
})

/**
 * Step 5 request (OpenAPI documented)
 */
export const Step5RequestSchema = openapi(
  Step5Request,
  {
    description: 'Step 5: Media and targeting (optional)',
  },
)

export type Step5Request = z.infer<typeof Step5Request>

/**
 * Step 5 response (raw Zod)
 */
export const Step5Response = z.object({
  imageUrl: z.string().nullable(),
  location: GeoJSONPoint.nullable(),
  locationRadius: z.number().nullable(),
  targetSegments: z.array(z.string()),
  estimatedReach: z.number().optional().describe('Estimated customer reach'),
})

/**
 * Step 5 response (OpenAPI documented)
 */
export const Step5ResponseSchema = openapi(
  Step5Response,
  {
    description: 'Step 5 response data',
  },
)

export type Step5Response = z.infer<typeof Step5Response>

/**
 * Generic step update request/response (raw Zod)
 */
export const UpdateStepRequest = z.union([
  Step1Request,
  Step2Request,
  Step3Request,
  Step4Request,
  Step5Request,
])

/**
 * Update step request (OpenAPI documented)
 */
export const UpdateStepRequestSchema = openapi(
  UpdateStepRequest,
  {
    description: 'Generic step update request',
  },
)

export type UpdateStepRequest = z.infer<typeof UpdateStepRequest>

/**
 * Update step response (raw Zod)
 */
export const UpdateStepResponse = z.object({
  success: z.boolean(),
  currentStep: z.number().int(),
  nextStep: z.number().int().nullable(),
  completedSteps: z.array(z.number().int()),
  validationErrors: z.array(z.string()).optional(),
})

/**
 * Update step response (OpenAPI documented)
 */
export const UpdateStepResponseSchema = openapi(
  UpdateStepResponse,
  {
    description: 'Step update result',
  },
)

export type UpdateStepResponse = z.infer<typeof UpdateStepResponse>

/**
 * Navigation response (raw Zod)
 */
export const NavigationResponse = z.object({
  success: z.boolean(),
  currentStep: z.number().int(),
  canGoBack: z.boolean(),
  canGoForward: z.boolean(),
  canComplete: z.boolean(),
})

/**
 * Navigation response (OpenAPI documented)
 */
export const NavigationResponseSchema = openapi(
  NavigationResponse,
  {
    description: 'Wizard navigation state',
  },
)

export type NavigationResponse = z.infer<typeof NavigationResponse>
