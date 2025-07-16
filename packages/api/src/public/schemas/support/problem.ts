import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import {
  ProblemSortBy,
  SortOrder,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '../../../common/schemas/enums.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Public support problem schemas
 */

// ============= Request Schemas =============

export const CreateSupportProblemRequest = openapi(
  z.object({
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(5000),
    priority: TicketPriority.default('MEDIUM'),
    type: TicketType.default('GENERAL'),
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

export const ProblemIdParam = z.object({
  id: UUID.describe('Problem ID'),
})
export type ProblemIdParam = z.infer<typeof ProblemIdParam>

// Search schema for public problems
export const SupportProblemSearchParams = z.object({
  search: z.string().optional(),
  status: TicketStatus.optional(),
  priority: TicketPriority.optional(),
  type: TicketType.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: ProblemSortBy.default('CREATED_AT'),
  sortOrder: SortOrder.default('DESC'),
})
export type SupportProblemSearchParams = z.infer<
  typeof SupportProblemSearchParams
>
