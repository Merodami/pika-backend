/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminTicketQueryParams = {
  /**
   * Search in title, description
   */
  search?: string
  ticketNumber?: string
  userId?: string
  assignedTo?: string
  status?:
    | 'OPEN'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'WAITING_CUSTOMER'
    | 'WAITING_INTERNAL'
    | 'RESOLVED'
    | 'CLOSED'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  type?:
    | 'BILLING'
    | 'TECHNICAL'
    | 'ACCOUNT'
    | 'GENERAL'
    | 'BUG_REPORT'
    | 'FEATURE_REQUEST'
  page?: number
  limit?: number
  sortBy?: 'CREATED_AT' | 'UPDATED_AT' | 'RESOLVED_AT' | 'PRIORITY' | 'STATUS'
  sortOrder?: 'asc' | 'desc'
  /**
   * Comma-separated relations: user,assignedUser
   */
  include?: string
}
