import { z } from 'zod'

/**
 * Support service enums
 */

export const AdminTicketSortBy = z.enum([
  'CREATED_AT',
  'UPDATED_AT',
  'RESOLVED_AT',
  'PRIORITY',
  'STATUS',
])
export type AdminTicketSortBy = z.infer<typeof AdminTicketSortBy>

export const TicketStatus = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
export type TicketStatus = z.infer<typeof TicketStatus>

export const TicketPriority = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
export type TicketPriority = z.infer<typeof TicketPriority>

export const TicketCategory = z.enum(['GENERAL', 'TECHNICAL', 'BILLING', 'ACCOUNT', 'OTHER'])
export type TicketCategory = z.infer<typeof TicketCategory>