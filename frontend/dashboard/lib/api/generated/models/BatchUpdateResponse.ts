/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Batch update result
 */
export type BatchUpdateResponse = {
  processed: number
  failed: number
  errors?: Array<{
    messageId: string
    error: string
  }>
}
