import { z } from 'zod'

import { openapi } from '../../../../common/utils/openapi.js'
import { DateTime } from '../../../shared/primitives.js'

/**
 * Validation schemas for voucher wizard
 */

/**
 * Step validation request (raw Zod)
 */
export const ValidateStepRequest = z.object({
  stepNumber: z.number().int().min(1).max(6),
  data: z.record(z.string(), z.any()).describe('Step data to validate'),
})

/**
 * Step validation request (OpenAPI documented)
 */
export const ValidateStepRequestSchema = openapi(
  ValidateStepRequest,
  {
    description: 'Request to validate a single step',
  },
)

export type ValidateStepRequest = z.infer<typeof ValidateStepRequest>

/**
 * Validation error detail (raw Zod)
 */
export const ValidationError = z.object({
  field: z.string().describe('Field name that has error'),
  code: z.string().describe('Error code for localization'),
  message: z.string().describe('Human-readable error message'),
  severity: z.enum(['error', 'warning']).default('error'),
})

/**
 * Validation error (OpenAPI documented)
 */
export const ValidationErrorSchema = openapi(
  ValidationError,
  {
    description: 'Validation error details',
  },
)

export type ValidationError = z.infer<typeof ValidationError>

/**
 * Step validation response (raw Zod)
 */
export const ValidateStepResponse = z.object({
  valid: z.boolean(),
  stepNumber: z.number().int(),
  errors: z.array(ValidationError),
  warnings: z.array(ValidationError).optional(),
  canProceed: z
    .boolean()
    .describe('Whether user can proceed to next step despite warnings'),
})

/**
 * Step validation response (OpenAPI documented)
 */
export const ValidateStepResponseSchema = openapi(
  ValidateStepResponse,
  {
    description: 'Step validation result',
  },
)

export type ValidateStepResponse = z.infer<typeof ValidateStepResponse>

/**
 * Full draft validation response (raw Zod)
 */
export const ValidateDraftResponse = z.object({
  valid: z.boolean(),
  canComplete: z.boolean(),
  stepValidation: z.record(
    z.string(),
    z.object({
      valid: z.boolean(),
      errors: z.array(ValidationError),
    }),
  ),
  missingSteps: z.array(z.number().int()),
  validatedAt: DateTime,
})

/**
 * Full draft validation response (OpenAPI documented)
 */
export const ValidateDraftResponseSchema = openapi(
  ValidateDraftResponse,
  {
    description: 'Complete draft validation results',
  },
)

export type ValidateDraftResponse = z.infer<typeof ValidateDraftResponse>

/**
 * Validation summary for draft state (raw Zod)
 */
export const ValidationSummary = z.object({
  totalSteps: z.number().int(),
  completedSteps: z.number().int(),
  validSteps: z.number().int(),
  hasErrors: z.boolean(),
  hasWarnings: z.boolean(),
  errorCount: z.number().int(),
  warningCount: z.number().int(),
  canComplete: z.boolean(),
})

/**
 * Validation summary (OpenAPI documented)
 */
export const ValidationSummarySchema = openapi(
  ValidationSummary,
  {
    description: 'Summary of validation state',
  },
)

export type ValidationSummary = z.infer<typeof ValidationSummary>
