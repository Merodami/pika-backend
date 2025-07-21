/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Create a new user (admin only)
 */
export type AdminCreateUserRequest = {
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  dateOfBirth: string
  role?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
  status?: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED'
  appVersion?: string
  alias?: string
}
