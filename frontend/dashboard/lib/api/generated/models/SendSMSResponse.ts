/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * SMS send result
 */
export type SendSMSResponse = {
  messageId: string
  status: 'SENT' | 'FAILED' | 'QUEUED'
  errorMessage?: string
}
