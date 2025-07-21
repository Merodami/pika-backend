/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Password reset initiated
 */
export type PasswordResetResponse = {
  resetToken: string
  /**
   * ISO 8601 datetime with timezone
   */
  expiresAt: string
  emailSent: boolean
}
