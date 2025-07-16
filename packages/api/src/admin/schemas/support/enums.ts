import { z } from 'zod'

/**
 * Admin-specific support enums
 */

export const AdminTicketSortBy = z.enum([
  'CREATED_AT',
  'UPDATED_AT',
  'RESOLVED_AT',
  'PRIORITY',
  'STATUS',
])
export type AdminTicketSortBy = z.infer<typeof AdminTicketSortBy>
