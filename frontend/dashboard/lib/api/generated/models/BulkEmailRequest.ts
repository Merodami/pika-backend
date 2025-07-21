/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Send bulk emails request
 */
export type BulkEmailRequest = {
  templateId: string
  recipients: Array<{
    to: string
    variables?: Record<string, any>
  }>
}
