/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminUserQueryParams = {
  /**
   * Search in name, email, phone
   */
  search?: string
  email?: string
  status?: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED'
  role?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
  flags?: Array<'VERIFIED' | 'PREMIUM' | 'SUSPICIOUS' | 'REPORTED' | 'VIP'>
  emailVerified?: boolean
  phoneVerified?: boolean
  identityVerified?: boolean
  /**
   * ISO 8601 datetime with timezone
   */
  registeredFrom?: string
  /**
   * ISO 8601 datetime with timezone
   */
  registeredTo?: string
  /**
   * ISO 8601 datetime with timezone
   */
  lastLoginFrom?: string
  /**
   * ISO 8601 datetime with timezone
   */
  lastLoginTo?: string
  minSpent?: number
  maxSpent?: number
  hasReports?: boolean
  page?: number
  limit?: number
  sortBy?: 'CREATED_AT' | 'LAST_LOGIN_AT' | 'TOTAL_SPENT' | 'EMAIL'
  sortOrder?: 'ASC' | 'DESC'
}
