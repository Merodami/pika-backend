import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { SortOrder } from '../../shared/enums.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'

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

import { CommentSortBy } from '../common/enums.js'

// Search schema following standard pattern
export const SupportCommentSearchParams = SearchParams.extend({
  sortBy: CommentSortBy.default('createdAt'),
  sortOrder: SortOrder.default(SortOrder.enum.asc), // Comments should be chronological by default
})
export type SupportCommentSearchParams = z.infer<
  typeof SupportCommentSearchParams
>
