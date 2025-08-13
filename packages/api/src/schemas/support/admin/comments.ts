import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'
import { createSearchSchema } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'

/**
 * Admin support comment schemas
 */

// ============= Request Schemas =============

/**
 * Admin create comment request (raw Zod)
 */
export const AdminCreateCommentRequest = z.object({
  problemId: UUID,
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().optional().default(false),
})

/**
 * Admin create comment request (OpenAPI documented)
 */
export const AdminCreateCommentRequestSchema = AdminCreateCommentRequest.openapi('AdminCreateCommentRequest', {
  description: 'Admin create support comment',
})

export type AdminCreateCommentRequest = z.infer<
  typeof AdminCreateCommentRequest
>

/**
 * Admin update comment request (raw Zod)
 */
export const AdminUpdateCommentRequest = z.object({
  content: z.string().min(1).max(5000),
  isInternal: z.boolean().optional(),
})

/**
 * Admin update comment request (OpenAPI documented)
 */
export const AdminUpdateCommentRequestSchema = AdminUpdateCommentRequest.openapi('AdminUpdateCommentRequest', {
  description: 'Admin update support comment',
})

export type AdminUpdateCommentRequest = z.infer<
  typeof AdminUpdateCommentRequest
>

// ============= Response Schemas =============

/**
 * Admin comment response (raw Zod)
 */
export const AdminCommentResponse = withTimestamps({
  id: UUID,
  problemId: UUID,
  userId: UserId,
  content: z.string(),
  isInternal: z.boolean(),
})

/**
 * Admin comment response (OpenAPI documented)
 */
export const AdminCommentResponseSchema = AdminCommentResponse.openapi('AdminCommentResponse', {
  description: 'Admin support comment',
})

export type AdminCommentResponse = z.infer<typeof AdminCommentResponse>

/**
 * Admin comment list response (raw Zod)
 */
export const AdminCommentListResponse = paginatedResponse(AdminCommentResponse)

/**
 * Admin comment list response (OpenAPI documented)
 */
export const AdminCommentListResponseSchema = AdminCommentListResponse.openapi('AdminCommentListResponse', {
  description: 'Paginated list of admin support comments',
})

export type AdminCommentListResponse = z.infer<typeof AdminCommentListResponse>

// ============= Search Parameters =============

// Sort fields for admin comments
const ADMIN_COMMENT_SORT_FIELDS = ['CREATED_AT', 'UPDATED_AT'] as const

/**
 * Admin comment search parameters (raw Zod)
 */
export const AdminCommentSearchParams = createSearchSchema({
  sortFields: ADMIN_COMMENT_SORT_FIELDS,
  includeRelations: ['user', 'problem'],
  defaultSortField: 'CREATED_AT',
  additionalParams: {
    isInternal: z.boolean().optional(),
    problemId: UUID.optional(),
    userId: UserId.optional(),
  },
})

/**
 * Admin comment search parameters (OpenAPI documented)
 */
export const AdminCommentSearchParamsSchema = AdminCommentSearchParams.openapi('AdminCommentSearchParams', {
  description: 'Admin comment search and filter parameters',
})

export type AdminCommentSearchParams = z.infer<typeof AdminCommentSearchParams>
