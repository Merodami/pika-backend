import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UUID } from '../../shared/primitives.js'

/**
 * Support service path parameters
 */

// Raw Zod schemas
export const TicketIdParamSchema = z.object({ id: UUID })
export type TicketIdParamSchema = z.infer<typeof TicketIdParamSchema>

export const ProblemIdParamSchema = z.object({ id: UUID })
export type ProblemIdParamSchema = z.infer<typeof ProblemIdParamSchema>

export const SupportCommentIdParamSchema = z.object({ id: UUID })
export type SupportCommentIdParamSchema = z.infer<
  typeof SupportCommentIdParamSchema
>

export const ProblemIdForCommentsParamSchema = z.object({ problemId: UUID })
export type ProblemIdForCommentsParamSchema = z.infer<
  typeof ProblemIdForCommentsParamSchema
>

// OpenAPI wrapped versions
export const TicketIdParam = openapi(TicketIdParamSchema, {
  description: 'Ticket ID path parameter',
})
export type TicketIdParam = z.infer<typeof TicketIdParam>

export const ProblemIdParam = openapi(ProblemIdParamSchema, {
  description: 'Problem ID path parameter',
})
export type ProblemIdParam = z.infer<typeof ProblemIdParam>

export const SupportCommentIdParam = openapi(SupportCommentIdParamSchema, {
  description: 'Comment ID path parameter',
})
export type SupportCommentIdParam = z.infer<typeof SupportCommentIdParam>

export const ProblemIdForCommentsParam = openapi(
  ProblemIdForCommentsParamSchema,
  { description: 'Problem ID for comments path parameter' },
)
export type ProblemIdForCommentsParam = z.infer<
  typeof ProblemIdForCommentsParam
>
