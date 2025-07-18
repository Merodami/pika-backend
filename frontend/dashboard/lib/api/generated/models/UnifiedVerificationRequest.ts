/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UnifiedVerificationRequest = {
  type: 'EMAIL' | 'PHONE' | 'ACCOUNT_CONFIRMATION'
  token?: string
  code?: string
  userId?: string
  email?: string
  phoneNumber?: string
}
