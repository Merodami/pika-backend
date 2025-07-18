/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Registration success response
 */
export type RegisterResponse = {
  message?: string
  /**
   * Newly created user ID
   */
  userId: string
  /**
   * Whether verification email was sent successfully
   */
  emailSent: boolean
}
