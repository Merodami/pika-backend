import { TicketPriority, TicketSortField, TicketType } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../../common/utils/zodEnum.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  TicketPrioritySchema,
  TicketStatusSchema,
  TicketTypeSchema,
} from '../common/enums.js'

/**
 * Public support problem schemas
 */

// ============= Request Schemas =============

/**
 * Create support problem request (raw Zod)
 */
export const CreateSupportProblemRequest = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  priority: TicketPrioritySchema.default(TicketPriority.MEDIUM),
  type: TicketTypeSchema.default(TicketType.GENERAL),
  files: z.array(z.string()).default([]),
})

/**
 * Create support problem request (OpenAPI documented)
 */
export const CreateSupportProblemRequestSchema =
  CreateSupportProblemRequest.openapi('CreateSupportProblemRequest', {
    description: 'Create new support problem',
  })

export type CreateSupportProblemRequest = z.infer<
  typeof CreateSupportProblemRequest
>

/**
 * Update support problem request (raw Zod)
 */
export const UpdateSupportProblemRequest = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  priority: TicketPrioritySchema.optional(),
  type: TicketTypeSchema.optional(),
  files: z.array(z.string()).optional(),
})

/**
 * Update support problem request (OpenAPI documented)
 */
export const UpdateSupportProblemRequestSchema =
  UpdateSupportProblemRequest.openapi('UpdateSupportProblemRequest', {
    description: 'Update support problem',
  })

export type UpdateSupportProblemRequest = z.infer<
  typeof UpdateSupportProblemRequest
>

// ============= Response Schemas =============

/**
 * Support problem response (raw Zod)
 */
export const SupportProblemResponse = withTimestamps({
  id: UUID,
  ticketNumber: z.string().optional(),
  userId: UserId,
  title: z.string(),
  description: z.string(),
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  type: TicketTypeSchema,
  resolvedAt: DateTime.optional(),
  assignedTo: UserId.optional(),
  files: z.array(z.string()).default([]),
})

/**
 * Support problem response (OpenAPI documented)
 */
export const SupportProblemResponseSchema = SupportProblemResponse.openapi(
  'SupportProblemResponse',
  {
    description: 'Support problem',
  },
)

export type SupportProblemResponse = z.infer<typeof SupportProblemResponse>

/**
 * Support problem list response (raw Zod)
 */
export const SupportProblemListResponse = paginatedResponse(
  SupportProblemResponse,
)

/**
 * Support problem list response (OpenAPI documented)
 */
export const SupportProblemListResponseSchema =
  SupportProblemListResponse.openapi('SupportProblemListResponse', {
    description: 'Paginated list of support problems',
  })

export type SupportProblemListResponse = z.infer<
  typeof SupportProblemListResponse
>

// ============= Parameters =============

// ProblemIdParam is now imported from common/parameters.ts

/**
 * Support problem search parameters (raw Zod)
 */
export const SupportProblemSearchParams = SearchParams.extend({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  type: TicketTypeSchema.optional(),
  sortBy: createZodEnum(TicketSortField).default(TicketSortField.CREATED_AT),
})

/**
 * Support problem search parameters (OpenAPI documented)
 */
export const SupportProblemSearchParamsSchema =
  SupportProblemSearchParams.openapi('SupportProblemSearchParams', {
    description: 'Search and filter parameters for support problems',
  })

export type SupportProblemSearchParams = z.infer<
  typeof SupportProblemSearchParams
>
