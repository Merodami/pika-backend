import { z } from 'zod'

import { openapi } from '../../../common/utils/openapi.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  ProblemSortBy,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '../common/enums.js'

/**
 * Public support problem schemas
 */

// ============= Request Schemas =============

export const CreateSupportProblemRequest = openapi(
  z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    priority: TicketPriority.default('medium'),
    type: TicketType.default('general'),
    files: z.array(z.string()).default([]),
  }),
  {
    description: 'Create new support problem',
  },
)
export type CreateSupportProblemRequest = z.infer<
  typeof CreateSupportProblemRequest
>

export const UpdateSupportProblemRequest = openapi(
  z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(5000).optional(),
    priority: TicketPriority.optional(),
    type: TicketType.optional(),
    files: z.array(z.string()).optional(),
  }),
  {
    description: 'Update support problem',
  },
)
export type UpdateSupportProblemRequest = z.infer<
  typeof UpdateSupportProblemRequest
>

// ============= Response Schemas =============

export const SupportProblemResponse = openapi(
  withTimestamps({
    id: UUID,
    ticketNumber: z.string().optional(),
    userId: UserId,
    title: z.string(),
    description: z.string(),
    status: TicketStatus,
    priority: TicketPriority,
    type: TicketType,
    resolvedAt: DateTime.optional(),
    assignedTo: UserId.optional(),
    files: z.array(z.string()).default([]),
  }),
  {
    description: 'Support problem',
  },
)
export type SupportProblemResponse = z.infer<typeof SupportProblemResponse>

export const SupportProblemListResponse = paginatedResponse(
  SupportProblemResponse,
)
export type SupportProblemListResponse = z.infer<
  typeof SupportProblemListResponse
>

// ============= Parameters =============

// ProblemIdParam is now imported from common/parameters.ts

// Search schema following standard pattern
export const SupportProblemSearchParams = SearchParams.extend({
  status: TicketStatus.optional(),
  priority: TicketPriority.optional(),
  type: TicketType.optional(),
  sortBy: ProblemSortBy.default('createdAt'),
})
export type SupportProblemSearchParams = z.infer<
  typeof SupportProblemSearchParams
>
