/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Account deletion request
 */
export type DeleteAccountRequest = {
  /**
   * Current password for verification
   */
  password: string
  /**
   * Optional reason for account deletion
   */
  reason?: string
  /**
   * Must be true to confirm deletion
   */
  confirmDeletion: boolean
}
