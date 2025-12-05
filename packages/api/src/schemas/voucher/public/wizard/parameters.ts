import { z } from 'zod'

import { openapi } from '../../../../common/utils/openapi.js'

/**
 * Wizard-specific path parameters
 */

/**
 * Draft ID path parameter (raw Zod)
 */
export const DraftIdParam = z.object({
  draftId: z.string().describe('Draft identifier'),
})

/**
 * Draft ID path parameter (OpenAPI documented)
 */
export const DraftIdParamSchema = openapi(DraftIdParam, {
  description: 'Draft ID path parameter',
})

export type DraftIdParam = z.infer<typeof DraftIdParam>

/**
 * Update step path parameters (raw Zod)
 */
export const UpdateStepParams = z.object({
  draftId: z.string().describe('Draft identifier'),
  stepNumber: z.coerce.number().int().min(1).max(5),
})

/**
 * Update step path parameters (OpenAPI documented)
 */
export const UpdateStepParamsSchema = openapi(UpdateStepParams, {
  description: 'Update step path parameters',
})

export type UpdateStepParams = z.infer<typeof UpdateStepParams>

/**
 * Get step path parameters (raw Zod)
 */
export const GetStepParams = z.object({
  draftId: z.string().describe('Draft identifier'),
  stepNumber: z.coerce.number().int().min(1).max(5),
})

/**
 * Get step path parameters (OpenAPI documented)
 */
export const GetStepParamsSchema = openapi(GetStepParams, {
  description: 'Get step path parameters',
})

export type GetStepParams = z.infer<typeof GetStepParams>

/**
 * Validate step path parameters (raw Zod)
 */
export const ValidateStepParams = z.object({
  draftId: z.string().describe('Draft identifier'),
  stepNumber: z.coerce.number().int().min(1).max(5),
})

/**
 * Validate step path parameters (OpenAPI documented)
 */
export const ValidateStepParamsSchema = openapi(ValidateStepParams, {
  description: 'Validate step path parameters',
})

export type ValidateStepParams = z.infer<typeof ValidateStepParams>
