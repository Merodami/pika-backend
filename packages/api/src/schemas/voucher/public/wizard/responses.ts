import { z } from 'zod'

import { openapi } from '../../../../common/utils/openapi.js'
import { paginatedResponse } from '../../../shared/responses.js'
import { DateTime, UUID } from '../../../shared/primitives.js'
import { DraftStateResponse } from './draft.js'

/**
 * Additional wizard response schemas
 */

/**
 * Get draft response (alias for DraftStateResponse)
 */
export const GetDraftResponse = DraftStateResponse

/**
 * Get draft response (OpenAPI documented)
 */
export const GetDraftResponseSchema = openapi(
  GetDraftResponse,
  {
    description: 'Get draft details response',
  },
)

export type GetDraftResponse = z.infer<typeof GetDraftResponse>

/**
 * Draft list item for paginated responses
 */
const DraftListItem = z.object({
  draftId: z.string(),
  businessId: UUID,
  currentStep: z.number().int(),
  completedSteps: z.array(z.number().int()),
  isComplete: z.boolean(),
  createdAt: DateTime,
  expiresAt: DateTime,
})

/**
 * Get user drafts response (paginated - raw Zod)
 */
export const GetUserDraftsResponse = paginatedResponse(DraftListItem)

/**
 * Get user drafts response (OpenAPI documented)
 */
export const GetUserDraftsResponseSchema = openapi(
  GetUserDraftsResponse,
  {
    description: 'Paginated list of user drafts',
  },
)

export type GetUserDraftsResponse = z.infer<typeof GetUserDraftsResponse>

/**
 * Get step response (raw Zod)
 */
export const GetStepResponse = z.object({
  stepNumber: z.number().int(),
  data: z.record(z.string(), z.any()).nullable(),
})

/**
 * Get step response (OpenAPI documented)
 */
export const GetStepResponseSchema = openapi(
  GetStepResponse,
  {
    description: 'Step data response',
  },
)

export type GetStepResponse = z.infer<typeof GetStepResponse>


/**
 * Save draft response (raw Zod)
 */
export const SaveDraftResponse = z.object({
  draftId: z.string(),
  savedAt: DateTime,
  message: z.string(),
})

/**
 * Save draft response (OpenAPI documented)
 */
export const SaveDraftResponseSchema = openapi(
  SaveDraftResponse,
  {
    description: 'Draft save confirmation',
  },
)

export type SaveDraftResponse = z.infer<typeof SaveDraftResponse>

/**
 * Resume draft response (raw Zod)
 */
export const ResumeDraftResponse = z.object({
  draftId: z.string(),
  currentStep: z.number().int(),
  nextStep: z.number().int().nullable(),
  completedSteps: z.array(z.number().int()),
  isComplete: z.boolean(),
  sessionToken: z.string().nullable(),
})

/**
 * Resume draft response (OpenAPI documented)
 */
export const ResumeDraftResponseSchema = openapi(
  ResumeDraftResponse,
  {
    description: 'Draft resume information',
  },
)

export type ResumeDraftResponse = z.infer<typeof ResumeDraftResponse>