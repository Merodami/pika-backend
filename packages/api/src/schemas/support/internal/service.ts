import { z } from 'zod'

import { UserId } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { UUID } from '../../shared/primitives.js'
import { openapi } from '../../../common/utils/openapi.js'
import { TicketStatus, TicketPriority, TicketCategory } from '../common/index.js'

/**
 * Internal support service schemas for service-to-service communication
 */

// ============= Service Health =============

export const SupportServiceHealthCheck = openapi(
  z.object({
    service: z.literal('support'),
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    timestamp: z.string().datetime(),
    activeTickets: z.number().int().nonnegative(),
    pendingEscalations: z.number().int().nonnegative(),
  }),
  {
    description: 'Support service health status',
  },
)
export type SupportServiceHealthCheck = z.infer<typeof SupportServiceHealthCheck>

// ============= Ticket Notifications =============

export const NotifyTicketUpdate = openapi(
  z.object({
    ticketId: UUID,
    userId: UserId,
    updateType: z.enum(['status_change', 'new_comment', 'assigned', 'escalated']),
    oldStatus: TicketStatus.optional(),
    newStatus: TicketStatus.optional(),
    assignedToId: UserId.optional(),
    message: z.string().optional(),
  }),
  {
    description: 'Internal notification for ticket updates',
  },
)
export type NotifyTicketUpdate = z.infer<typeof NotifyTicketUpdate>

// ============= User Ticket Summary =============

export const GetUserTicketSummaryRequest = openapi(
  z.object({
    userId: UserId,
  }),
  {
    description: 'Request user ticket summary',
  },
)
export type GetUserTicketSummaryRequest = z.infer<typeof GetUserTicketSummaryRequest>

export const UserTicketSummaryResponse = openapi(
  z.object({
    userId: UserId,
    totalTickets: z.number().int().nonnegative(),
    openTickets: z.number().int().nonnegative(),
    resolvedTickets: z.number().int().nonnegative(),
    averageResolutionTime: z.number().optional().describe('In hours'),
    lastTicketDate: z.string().datetime().optional(),
    ticketsByCategory: z.record(TicketCategory, z.number().int().nonnegative()),
  }),
  {
    description: 'User ticket summary',
  },
)
export type UserTicketSummaryResponse = z.infer<typeof UserTicketSummaryResponse>

// ============= Bulk Operations =============

export const BulkCreateTicketsRequest = openapi(
  z.object({
    tickets: z.array(
      z.object({
        userId: UserId,
        title: z.string(),
        description: z.string(),
        category: TicketCategory,
        priority: TicketPriority.default('MEDIUM'),
        metadata: z.record(z.unknown()).optional(),
      }),
    ).min(1).max(100),
  }),
  {
    description: 'Bulk create support tickets',
  },
)
export type BulkCreateTicketsRequest = z.infer<typeof BulkCreateTicketsRequest>

export const BulkCreateTicketsResponse = openapi(
  z.object({
    created: z.array(UUID),
    failed: z.array(
      z.object({
        index: z.number(),
        error: z.string(),
      }),
    ),
  }),
  {
    description: 'Bulk create tickets response',
  },
)
export type BulkCreateTicketsResponse = z.infer<typeof BulkCreateTicketsResponse>

// ============= Escalation Management =============

export const EscalateTicketInternalRequest = openapi(
  z.object({
    ticketId: UUID,
    escalationType: z.enum(['priority', 'sla_breach', 'customer_request', 'system']),
    reason: z.string(),
    targetPriority: TicketPriority,
    notifyManagement: z.boolean().default(true),
  }),
  {
    description: 'Internal ticket escalation request',
  },
)
export type EscalateTicketInternalRequest = z.infer<typeof EscalateTicketInternalRequest>

// ============= Analytics Data =============

export const GetTicketAnalyticsRequest = openapi(
  z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    groupBy: z.enum(['day', 'week', 'month']).optional(),
  }),
  {
    description: 'Request ticket analytics data',
  },
)
export type GetTicketAnalyticsRequest = z.infer<typeof GetTicketAnalyticsRequest>

export const TicketAnalyticsResponse = openapi(
  z.object({
    period: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    volumeMetrics: z.object({
      total: z.number().int().nonnegative(),
      created: z.number().int().nonnegative(),
      resolved: z.number().int().nonnegative(),
      escalated: z.number().int().nonnegative(),
    }),
    performanceMetrics: z.object({
      averageFirstResponseTime: z.number().describe('In minutes'),
      averageResolutionTime: z.number().describe('In hours'),
      firstContactResolutionRate: z.number().min(0).max(100),
    }),
    distribution: z.object({
      byPriority: z.record(TicketPriority, z.number().int().nonnegative()),
      byCategory: z.record(TicketCategory, z.number().int().nonnegative()),
      byStatus: z.record(TicketStatus, z.number().int().nonnegative()),
    }),
  }),
  {
    description: 'Ticket analytics data',
  },
)
export type TicketAnalyticsResponse = z.infer<typeof TicketAnalyticsResponse>