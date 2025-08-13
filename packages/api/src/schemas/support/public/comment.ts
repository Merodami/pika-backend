import { CommentSortBy, SortOrder } from '@pika/types'
import { z } from 'zod'

import { SortOrderSchema } from '../../common/enums.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import { CommentSortBySchema } from '../common/enums.js'

/**
 * Public support comment schemas
 */

// ============= Request Schemas =============

/**
 * Create support comment request (raw Zod)
 */
export const CreateSupportCommentRequest = z.object({
  problemId: UUID,
  content: z.string().min(1).max(5000),
})

/**
 * Create support comment request (OpenAPI documented)
 */
export const CreateSupportCommentRequestSchema =
  CreateSupportCommentRequest.openapi('CreateSupportCommentRequest', {
    description: 'Create new support comment',
  })

export type CreateSupportCommentRequest = z.infer<
  typeof CreateSupportCommentRequest
>

/**
 * Update support comment request (raw Zod)
 */
export const UpdateSupportCommentRequest = z.object({
  content: z.string().min(1).max(5000),
})

/**
 * Update support comment request (OpenAPI documented)
 */
export const UpdateSupportCommentRequestSchema =
  UpdateSupportCommentRequest.openapi('UpdateSupportCommentRequest', {
    description: 'Update support comment',
  })

export type UpdateSupportCommentRequest = z.infer<
  typeof UpdateSupportCommentRequest
>

// ============= Response Schemas =============

/**
 * Support comment response (raw Zod)
 */
export const SupportCommentResponse = withTimestamps({
  id: UUID,
  problemId: UUID,
  userId: UserId,
  content: z.string(),
  isInternal: z.boolean().default(false),
})

/**
 * Support comment response (OpenAPI documented)
 */
export const SupportCommentResponseSchema = SupportCommentResponse.openapi(
  'SupportCommentResponse',
  {
    description: 'Support comment',
  },
)

export type SupportCommentResponse = z.infer<typeof SupportCommentResponse>

/**
 * Support comment list response (raw Zod)
 */
export const SupportCommentListResponse = paginatedResponse(
  SupportCommentResponse,
)

/**
 * Support comment list response (OpenAPI documented)
 */
export const SupportCommentListResponseSchema =
  SupportCommentListResponse.openapi('SupportCommentListResponse', {
    description: 'Paginated list of support comments',
  })

export type SupportCommentListResponse = z.infer<
  typeof SupportCommentListResponse
>

// ============= Parameters =============

// SupportCommentIdParam is now imported from common/parameters.ts

// ProblemIdForCommentsParam is now imported from common/parameters.ts

/**
 * Support comment search parameters (raw Zod)
 */
export const SupportCommentSearchParams = SearchParams.extend({
  sortBy: CommentSortBySchema.default(CommentSortBy.CREATED_AT),
  sortOrder: SortOrderSchema.default(SortOrder.ASC), // Comments should be chronological by default
})

/**
 * Support comment search parameters (OpenAPI documented)
 */
export const SupportCommentSearchParamsSchema =
  SupportCommentSearchParams.openapi('SupportCommentSearchParams', {
    description: 'Search and filter parameters for support comments',
  })

export type SupportCommentSearchParams = z.infer<
  typeof SupportCommentSearchParams
>
