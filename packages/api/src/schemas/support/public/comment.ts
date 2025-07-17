import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'
import { createSearchSchema } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import { openapi } from '../../../common/utils/openapi.js'
import { SupportCommentIdParam, ProblemIdForCommentsParam } from '../common/index.js'

/**
 * Public support comment schemas
 */

// ============= Request Schemas =============

export const CreateSupportCommentRequest = openapi(
  z.object({
    problemId: UUID,
    content: z.string().min(1).max(5000),
  }),
  {
    description: 'Create new support comment',
  },
)
export type CreateSupportCommentRequest = z.infer<
  typeof CreateSupportCommentRequest
>

export const UpdateSupportCommentRequest = openapi(
  z.object({
    content: z.string().min(1).max(5000),
  }),
  {
    description: 'Update support comment',
  },
)
export type UpdateSupportCommentRequest = z.infer<
  typeof UpdateSupportCommentRequest
>

// ============= Response Schemas =============

export const SupportCommentResponse = openapi(
  withTimestamps({
    id: UUID,
    problemId: UUID,
    userId: UserId,
    content: z.string(),
    isInternal: z.boolean().default(false),
  }),
  {
    description: 'Support comment',
  },
)
export type SupportCommentResponse = z.infer<typeof SupportCommentResponse>

export const SupportCommentListResponse = paginatedResponse(
  SupportCommentResponse,
)
export type SupportCommentListResponse = z.infer<
  typeof SupportCommentListResponse
>

// ============= Parameters =============

// SupportCommentIdParam is now imported from common/parameters.ts

// ProblemIdForCommentsParam is now imported from common/parameters.ts

// Sort fields for comments
const COMMENT_SORT_FIELDS = ['CREATED_AT', 'UPDATED_AT'] as const

// Search schema using common utilities
export const SupportCommentSearchParams = createSearchSchema({
  sortFields: COMMENT_SORT_FIELDS,
  includeRelations: [], // Public users don't get includes
  defaultSortField: 'CREATED_AT',
})
export type SupportCommentSearchParams = z.infer<
  typeof SupportCommentSearchParams
>
