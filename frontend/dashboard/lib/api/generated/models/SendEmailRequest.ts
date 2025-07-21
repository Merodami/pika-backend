/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

/**
 * Send email request
 */
export type SendEmailRequest = {
  to: string
  /**
   * Optional when using templateId
   */
  subject?: string
  templateId?: string
  templateParams?: Record<string, any>
  body?: string
  isHtml?: boolean
  replyTo?: string
  cc?: Array<string>
  bcc?: Array<string>
}
