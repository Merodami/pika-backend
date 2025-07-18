/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User verification response
 */
export type VerifyUserResponse = {
  userId: string
  exists: boolean
  isActive: boolean
  isVerified: boolean
  verificationLevel: 'NONE' | 'EMAIL' | 'PHONE' | 'FULL'
}
