/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Update user information (admin)
 */
export type AdminUpdateUserRequest = {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  dateOfBirth?: string
  role?: 'ADMIN' | 'CUSTOMER' | 'BUSINESS'
  status?: 'ACTIVE' | 'SUSPENDED' | 'UNCONFIRMED'
  appVersion?: string
  alias?: string
  activeMembership?: boolean
  description?: string
  specialties?: Array<string>
}
