/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Support problem
 */
export type SupportProblemResponse = {
  /**
   * Universally Unique Identifier
   */
  id: string
  ticketNumber?: string
  userId: string
  title: string
  description: string
  status:
    | 'OPEN'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'WAITING_CUSTOMER'
    | 'WAITING_INTERNAL'
    | 'RESOLVED'
    | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  type:
    | 'BILLING'
    | 'TECHNICAL'
    | 'ACCOUNT'
    | 'GENERAL'
    | 'BUG_REPORT'
    | 'FEATURE_REQUEST'
  /**
   * ISO 8601 datetime with timezone
   */
  resolvedAt?: string
  assignedTo?: string
  files?: Array<string>
  /**
   * When the record was created
   */
  createdAt: string
  /**
   * When the record was last updated
   */
  updatedAt: string
}
