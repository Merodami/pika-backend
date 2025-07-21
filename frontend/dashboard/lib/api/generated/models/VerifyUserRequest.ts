/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Verify user for internal services
 */
export type VerifyUserRequest = {
  userId: string
  verificationType: 'EMAIL' | 'PHONE' | 'IDENTITY'
}
