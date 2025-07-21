/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * User data for authentication
 */
export type UserAuthData = {
  id: string
  email: string
  password?: string
  firstName: string
  lastName: string
  phoneNumber?: string
  role: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
  status: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED'
  emailVerified: boolean
  /**
   * ISO 8601 datetime with timezone
   */
  createdAt: string
  /**
   * ISO 8601 datetime with timezone
   */
  lastLoginAt?: string
}
