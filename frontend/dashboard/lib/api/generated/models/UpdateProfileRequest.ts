/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Fields that can be updated by the user
 */
export type UpdateProfileRequest = {
  firstName?: string
  lastName?: string
  displayName?: string
  /**
   * Phone number in E.164 format
   */
  phoneNumber?: string
  bio?: string
  /**
   * Date in YYYY-MM-DD format
   */
  dateOfBirth?: string
  preferredLanguage?: string
}
