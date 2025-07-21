/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Change password for authenticated user
 */
export type ChangePasswordRequest = {
  /**
   * Current password for verification
   */
  currentPassword: string
  /**
   * New password meeting security requirements
   */
  newPassword: string
}
