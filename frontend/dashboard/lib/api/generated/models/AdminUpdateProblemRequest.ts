/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Admin update support problem
 */
export type AdminUpdateProblemRequest = {
  title?: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL'
  type?:
    | 'BILLING'
    | 'TECHNICAL'
    | 'ACCOUNT'
    | 'GENERAL'
    | 'BUG_REPORT'
    | 'FEATURE_REQUEST'
  status?:
    | 'OPEN'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'WAITING_CUSTOMER'
    | 'WAITING_INTERNAL'
    | 'RESOLVED'
    | 'CLOSED'
  assignedTo?: string
  /**
   * ISO 8601 datetime with timezone
   */
  resolvedAt?: string
  files?: Array<string>
}
