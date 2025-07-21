/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Token validation result
 */
export type TokenValidationResponse = {
  valid: boolean
  userId?: string
  email?: string
  roles: Array<string>
  permissions: Array<string>
  /**
   * ISO 8601 datetime with timezone
   */
  expiresAt?: string
  metadata?: Record<string, any>
}
