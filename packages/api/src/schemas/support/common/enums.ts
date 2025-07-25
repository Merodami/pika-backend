import { z } from 'zod'

/**
 * Support service enums
 */

export const AdminTicketSortBy = z.enum([
  'createdAt',
  'updatedAt',
  'resolvedAt',
  'priority',
  'status',
])
export type AdminTicketSortBy = z.infer<typeof AdminTicketSortBy>

export const TicketStatus = z.enum([
  'open',
  'assigned',
  'in_progress',
  'waiting_customer',
  'waiting_internal',
  'resolved',
  'closed',
])
export type TicketStatus = z.infer<typeof TicketStatus>

export const TicketPriority = z.enum([
  'low',
  'medium',
  'high',
  'urgent',
  'critical',
])
export type TicketPriority = z.infer<typeof TicketPriority>

export const TicketType = z.enum([
  'billing',
  'technical',
  'account',
  'general',
  'bug_report',
  'feature_request',
])
export type TicketType = z.infer<typeof TicketType>

export const ProblemSortBy = z.enum([
  'createdAt',
  'updatedAt',
  'priority',
  'status',
])
export type ProblemSortBy = z.infer<typeof ProblemSortBy>

export const CommentSortBy = z.enum([
  'createdAt',
  'updatedAt',
])
export type CommentSortBy = z.infer<typeof CommentSortBy>
