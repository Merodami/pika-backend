import { SortOrder, TimestampSortBy } from '@pika/types'
import {
  AdminTicketSortBy,
  TicketPriority,
  TicketStatus,
  TicketType,
} from '@pika/types'
import { NUMERIC_CONSTRAINTS } from '@pika/types'
import { z } from 'zod'

import { SortOrderSchema, TimestampSortBySchema } from '../../common/enums.js'
import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { createIncludeParam } from '../../shared/query.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  AdminTicketSortBySchema,
  TicketPrioritySchema,
  TicketStatusSchema,
  TicketTypeSchema,
} from '../common/enums.js'

/**
 * Admin support ticket management schemas
 */

// ============= Constants =============

/**
 * Allowed relations for admin problem endpoints
 */
export const ADMIN_PROBLEM_RELATIONS = ['user', 'assignedUser'] as const

/**
 * Allowed relations for admin comment endpoints
 */
export const ADMIN_COMMENT_RELATIONS = ['user'] as const

// ============= Admin Ticket View =============

/**
 * Simplified ticket for admin (raw Zod)
 */
export const AdminTicketDetailResponse = withTimestamps({
  id: UUID,
  ticketNumber: z.string().optional(),
  userId: UserId,
  userName: z.string(),
  userEmail: z.string().email(),

  // Ticket details
  title: z.string(),
  description: z.string(),
  type: TicketTypeSchema,
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  resolvedAt: DateTime.optional(),

  // Essential admin fields
  assignedTo: UserId.optional(),
  assignedToName: z.string().optional(),

  // File attachments
  files: z.array(z.string()).default([]),
})

/**
 * Simplified ticket for admin (OpenAPI documented)
 */
export const AdminTicketDetailResponseSchema = AdminTicketDetailResponse.openapi('AdminTicketDetailResponse', {
  description: 'Support ticket for admin',
})

export type AdminTicketDetailResponse = z.infer<
  typeof AdminTicketDetailResponse
>

// ============= Ticket Search =============

/**
 * Admin ticket search parameters (raw Zod)
 */
export const AdminTicketQueryParams = z.object({
  search: z.string().optional().describe('Search in title, description'),
  ticketNumber: z.string().optional(),
  userId: UserId.optional(),
  assignedTo: UserId.optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  type: TicketTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: AdminTicketSortBySchema.default(AdminTicketSortBy.CREATED_AT),
  sortOrder: SortOrderSchema.default(SortOrder.DESC),
  ...createIncludeParam(ADMIN_PROBLEM_RELATIONS).shape,
})

/**
 * Admin ticket search parameters (OpenAPI documented)
 */
export const AdminTicketQueryParamsSchema = AdminTicketQueryParams.openapi('AdminTicketQueryParams', {
  description: 'Admin ticket search and filter parameters',
})

export type AdminTicketQueryParams = z.infer<typeof AdminTicketQueryParams>

/**
 * Admin ticket list response (raw Zod)
 */
export const AdminTicketListResponse = paginatedResponse(
  AdminTicketDetailResponse,
)

/**
 * Admin ticket list response (OpenAPI documented)
 */
export const AdminTicketListResponseSchema = AdminTicketListResponse.openapi('AdminTicketListResponse', {
  description: 'Paginated list of support tickets for admin management',
})

export type AdminTicketListResponse = z.infer<typeof AdminTicketListResponse>

// ============= Admin Problem Actions =============

/**
 * Admin update problem request (raw Zod)
 */
export const AdminUpdateProblemRequest = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  priority: TicketPrioritySchema.optional(),
  type: TicketTypeSchema.optional(),
  status: TicketStatusSchema.optional(),
  assignedTo: UserId.optional(),
  resolvedAt: DateTime.optional(),
  files: z.array(z.string()).optional(),
})

/**
 * Admin update problem request (OpenAPI documented)
 */
export const AdminUpdateProblemRequestSchema = AdminUpdateProblemRequest.openapi('AdminUpdateProblemRequest', {
  description: 'Admin update support problem',
})

export type AdminUpdateProblemRequest = z.infer<
  typeof AdminUpdateProblemRequest
>

// ============= Ticket Actions =============

/**
 * Assign ticket request (raw Zod)
 */
export const AdminAssignTicketRequest = z.object({
  assigneeId: UserId,
  note: z.string().max(500).optional(),
  priority: TicketPrioritySchema.optional(),
})

/**
 * Assign ticket request (OpenAPI documented)
 */
export const AdminAssignTicketRequestSchema = AdminAssignTicketRequest.openapi('AdminAssignTicketRequest', {
  description: 'Assign ticket to agent',
})

export type AdminAssignTicketRequest = z.infer<typeof AdminAssignTicketRequest>

/**
 * Update ticket status request (raw Zod)
 */
export const AdminUpdateTicketStatusRequest = z.object({
  status: TicketStatusSchema,
  note: z.string().max(1000).optional(),
  notifyUser: z.boolean().default(true),
})

/**
 * Update ticket status request (OpenAPI documented)
 */
export const AdminUpdateTicketStatusRequestSchema = AdminUpdateTicketStatusRequest.openapi('AdminUpdateTicketStatusRequest', {
  description: 'Update ticket status',
})

export type AdminUpdateTicketStatusRequest = z.infer<
  typeof AdminUpdateTicketStatusRequest
>

/**
 * Escalate ticket request (raw Zod)
 */
export const AdminEscalateTicketRequest = z.object({
  reason: z.string().max(1000),
  priority: TicketPrioritySchema.optional(),
  assignToSupervisor: z.boolean().default(true),
})

/**
 * Escalate ticket request (OpenAPI documented)
 */
export const AdminEscalateTicketRequestSchema = AdminEscalateTicketRequest.openapi('AdminEscalateTicketRequest', {
  description: 'Escalate ticket',
})

export type AdminEscalateTicketRequest = z.infer<
  typeof AdminEscalateTicketRequest
>

/**
 * Admin comment on ticket (raw Zod)
 */
export const AdminTicketComment = z.object({
  content: z.string().max(5000),
  isInternal: z.boolean().default(false),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.string(),
        size: z.number().int().positive(),
      }),
    )
    .optional(),
})

/**
 * Admin comment on ticket (OpenAPI documented)
 */
export const AdminTicketCommentSchema = AdminTicketComment.openapi('AdminTicketComment', {
  description: 'Add admin comment to ticket',
})

export type AdminTicketComment = z.infer<typeof AdminTicketComment>

// ============= Ticket Metrics =============

/**
 * Support metrics (raw Zod)
 */
export const SupportMetrics = z.object({
  period: z.object({
    start: DateTime,
    end: DateTime,
  }),

  // Volume
  totalTickets: z.number().int().nonnegative(),
  newTickets: z.number().int().nonnegative(),
  resolvedTickets: z.number().int().nonnegative(),

  // Performance
  averageFirstResponseTime: z
    .number()
    .describe('Average time to first response in minutes'),
  averageResolutionTime: z
    .number()
    .describe('Average resolution time in hours'),

  // Status breakdown
  ticketsByStatus: z.object({
    [TicketStatus.OPEN]: z.number().int().nonnegative().optional(),
    [TicketStatus.ASSIGNED]: z.number().int().nonnegative().optional(),
    [TicketStatus.IN_PROGRESS]: z.number().int().nonnegative().optional(),
    [TicketStatus.WAITING_CUSTOMER]: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    [TicketStatus.WAITING_INTERNAL]: z
      .number()
      .int()
      .nonnegative()
      .optional(),
    [TicketStatus.RESOLVED]: z.number().int().nonnegative().optional(),
    [TicketStatus.CLOSED]: z.number().int().nonnegative().optional(),
  }),
  ticketsByPriority: z.object({
    [TicketPriority.LOW]: z.number().int().nonnegative().optional(),
    [TicketPriority.MEDIUM]: z.number().int().nonnegative().optional(),
    [TicketPriority.HIGH]: z.number().int().nonnegative().optional(),
    [TicketPriority.URGENT]: z.number().int().nonnegative().optional(),
    [TicketPriority.CRITICAL]: z.number().int().nonnegative().optional(),
  }),
  ticketsByType: z.object({
    [TicketType.BILLING]: z.number().int().nonnegative().optional(),
    [TicketType.TECHNICAL]: z.number().int().nonnegative().optional(),
    [TicketType.ACCOUNT]: z.number().int().nonnegative().optional(),
    [TicketType.GENERAL]: z.number().int().nonnegative().optional(),
    [TicketType.BUG_REPORT]: z.number().int().nonnegative().optional(),
    [TicketType.FEATURE_REQUEST]: z.number().int().nonnegative().optional(),
  }),

  // Agent performance
  agentStats: z
    .array(
      z.object({
        agentId: UserId,
        agentName: z.string(),
        ticketsHandled: z.number().int().nonnegative(),
        averageResponseTime: z.number(),
        averageResolutionTime: z.number(),
        satisfactionScore: z
          .number()
          .min(NUMERIC_CONSTRAINTS.RATING_MIN)
          .max(NUMERIC_CONSTRAINTS.RATING_MAX)
          .optional(),
      }),
    )
    .optional(),

  // Satisfaction
  averageSatisfaction: z
    .number()
    .min(NUMERIC_CONSTRAINTS.RATING_MIN)
    .max(NUMERIC_CONSTRAINTS.RATING_MAX)
    .optional(),
  satisfactionResponseRate: z.number().min(0).max(100).optional(),
})

/**
 * Support metrics (OpenAPI documented)
 */
export const SupportMetricsSchema = SupportMetrics.openapi('SupportMetrics', {
  description: 'Support ticket metrics',
})

export type SupportMetrics = z.infer<typeof SupportMetrics>

// ============= Bulk Operations =============

/**
 * Bulk ticket update request (raw Zod)
 */
export const AdminBulkTicketUpdateRequest = z.object({
  ticketIds: z.array(UUID).min(1).max(100),
  updates: z.object({
    status: TicketStatusSchema.optional(),
    priority: TicketPrioritySchema.optional(),
    assignedTo: UserId.optional(),
    tags: z.array(z.string()).optional(),
  }),
  note: z.string().max(500).optional(),
})

/**
 * Bulk ticket update request (OpenAPI documented)
 */
export const AdminBulkTicketUpdateRequestSchema = AdminBulkTicketUpdateRequest.openapi('AdminBulkTicketUpdateRequest', {
  description: 'Update multiple tickets',
})

export type AdminBulkTicketUpdateRequest = z.infer<
  typeof AdminBulkTicketUpdateRequest
>

// ============= Templates =============

/**
 * Response template (raw Zod)
 */
export const ResponseTemplate = z.object({
  id: UUID,
  name: z.string(),
  type: TicketType,
  subject: z.string(),
  content: z.string(),
  tags: z.array(z.string()).default([]),
  usageCount: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
})

/**
 * Response template (OpenAPI documented)
 */
export const ResponseTemplateSchema = ResponseTemplate.openapi('ResponseTemplate', {
  description: 'Response template for support tickets',
})

export type ResponseTemplate = z.infer<typeof ResponseTemplate>

/**
 * Template list response (raw Zod)
 */
export const TemplateListResponse = paginatedResponse(ResponseTemplate)

/**
 * Template list response (OpenAPI documented)
 */
export const TemplateListResponseSchema = TemplateListResponse.openapi('TemplateListResponse', {
  description: 'Paginated list of response templates',
})

export type TemplateListResponse = z.infer<typeof TemplateListResponse>

// Additional schemas for admin-api.ts
export const TicketStatsResponse = SupportMetrics
export type TicketStatsResponse = z.infer<typeof TicketStatsResponse>

/**
 * Agent performance response (raw Zod)
 */
const AgentPerformanceResponseBase = z.object({
  agentId: UserId,
  agentName: z.string(),
  period: z.object({
    start: DateTime,
    end: DateTime,
  }),
  ticketsHandled: z.number().int().nonnegative(),
  ticketsResolved: z.number().int().nonnegative(),
  averageResponseTime: z.number().describe('In minutes'),
  averageResolutionTime: z.number().describe('In hours'),
  satisfactionScore: z.number().min(0).max(5).optional(),
  firstContactResolutionRate: z.number().min(0).max(100),
})

/**
 * Agent performance response (OpenAPI documented)
 */
export const AgentPerformanceResponseSchema = AgentPerformanceResponseBase.openapi('AgentPerformanceResponse', {
  description: 'Individual agent performance metrics',
})

export const AgentPerformanceResponse = AgentPerformanceResponseBase

export type AgentPerformanceResponse = z.infer<typeof AgentPerformanceResponse>

// TicketIdParam is now imported from common/parameters.ts

// ============= Admin Comment Query Schemas =============

/**
 * Admin get all comments query parameters (raw Zod)
 */
export const AdminGetAllCommentsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: TimestampSortBySchema.default(TimestampSortBy.CREATED_AT),
  sortOrder: SortOrderSchema.default(SortOrder.DESC),
  search: z.string().optional(),
  problemId: z.string().optional(),
  isInternal: z.coerce.boolean().optional(),
  ...createIncludeParam(ADMIN_COMMENT_RELATIONS).shape,
})

/**
 * Admin get all comments query parameters (OpenAPI documented)
 */
export const AdminGetAllCommentsQuerySchema = AdminGetAllCommentsQuery.openapi('AdminGetAllCommentsQuery', {
  description: 'Query parameters for admin comment listing',
})

export type AdminGetAllCommentsQuery = z.infer<typeof AdminGetAllCommentsQuery>

/**
 * Admin get comments by problem query parameters (raw Zod)
 */
export const AdminCommentsByProblemQuery = SearchParams.extend({
  ...createIncludeParam(ADMIN_COMMENT_RELATIONS).shape,
})

/**
 * Admin get comments by problem query parameters (OpenAPI documented)
 */
export const AdminCommentsByProblemQuerySchema = AdminCommentsByProblemQuery.openapi('AdminCommentsByProblemQuery', {
  description: 'Query parameters for getting comments by problem ID with pagination',
})

export type AdminCommentsByProblemQuery = z.infer<
  typeof AdminCommentsByProblemQuery
>

/**
 * Admin get ticket by ID query parameters (raw Zod)
 */
export const AdminTicketByIdQuery = z.object({
  ...createIncludeParam(ADMIN_PROBLEM_RELATIONS).shape,
})

/**
 * Admin get ticket by ID query parameters (OpenAPI documented)
 */
export const AdminTicketByIdQuerySchema = AdminTicketByIdQuery.openapi('AdminTicketByIdQuery', {
  description: 'Query parameters for getting a single ticket',
})

export type AdminTicketByIdQuery = z.infer<typeof AdminTicketByIdQuery>
