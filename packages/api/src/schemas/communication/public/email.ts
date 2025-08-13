import {
  EmailSortBy as EmailSortByEnum,
  FIELD_LENGTH,
  MessagePriority,
} from '@pika/types'
import { z } from 'zod'

import { Email as EmailAddress } from '../../shared/branded.js'
import { withTimestamps } from '../../shared/metadata.js'
import { DateRangeParams, SearchParams } from '../../shared/pagination.js'
import { DateTime, UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'
import {
  BounceType,
  EmailEvent,
  EmailPriority,
  EmailSortBy,
  EmailStatus,
} from '../common/enums.js'
import { CommunicationLog } from './communicationLog.js'

/**
 * Email communication schemas for public API
 */

// ============= Email Components =============

/**
 * Email recipient (raw Zod)
 */
export const EmailRecipient = z.object({
  email: EmailAddress,
  name: z.string().max(FIELD_LENGTH.SLUG_MAX).optional(),
})

/**
 * Email recipient (OpenAPI documented)
 */
export const EmailRecipientSchema = EmailRecipient.openapi('EmailRecipient', {
  description: 'Email recipient with optional name',
})

export type EmailRecipient = z.infer<typeof EmailRecipient>

/**
 * Email attachment (raw Zod)
 */
export const EmailAttachment = z.object({
  filename: z
    .string()
    .max(FIELD_LENGTH.FILENAME_MAX)
    .describe('Name of the attachment file'),
  content: z.string().describe('Base64 encoded content or URL'),
  contentType: z.string().optional().describe('MIME type of the attachment'),
  size: z.number().int().positive().optional().describe('File size in bytes'),
})

/**
 * Email attachment (OpenAPI documented)
 */
export const EmailAttachmentSchema = EmailAttachment.openapi(
  'EmailAttachment',
  {
    description: 'Email attachment details',
  },
)

export type EmailAttachment = z.infer<typeof EmailAttachment>

// ============= Send Email =============

/**
 * Send email request (raw Zod)
 */
export const SendEmailRequest = z
  .object({
    to: EmailAddress.or(z.array(EmailRecipient)).describe(
      'Primary recipient(s)',
    ),
    cc: z.array(EmailAddress).optional().describe('CC recipients'),
    bcc: z.array(EmailAddress).optional().describe('BCC recipients'),
    subject: z.string().max(FIELD_LENGTH.SLUG_MAX),

    // Template-based email
    templateId: z
      .string()
      .optional()
      .describe('Template ID to use for the email'),
    templateParams: z
      .record(z.string(), z.any())
      .optional()
      .describe('Parameters to pass to the template'),
    variables: z
      .record(z.string(), z.any())
      .optional()
      .describe('Variables for template rendering'),

    // Direct content email
    body: z
      .string()
      .optional()
      .describe('Plain text content (deprecated, use textContent)'),
    htmlContent: z.string().optional().describe('HTML content of the email'),
    textContent: z
      .string()
      .optional()
      .describe('Plain text content of the email'),

    // Additional options
    isHtml: z
      .boolean()
      .default(false)
      .describe('Whether the content is HTML (deprecated)'),
    replyTo: EmailAddress.optional(),
    attachments: z.array(EmailAttachment).optional(),
    priority: EmailPriority.default(MessagePriority.NORMAL),

    // Tracking and metadata
    trackOpens: z.boolean().default(true),
    trackClicks: z.boolean().default(true),
    metadata: z
      .record(z.string(), z.any())
      .optional()
      .describe('Additional metadata for tracking'),

    // Scheduling
    scheduledAt: DateTime.optional().describe('When to send the email'),

    // Headers
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe('Custom email headers'),
  })
  .refine(
    (data) =>
      data.templateId || data.htmlContent || data.textContent || data.body,
    { message: 'Either templateId or email content must be provided' },
  )

/**
 * Send email request (OpenAPI documented)
 */
export const SendEmailRequestSchema = SendEmailRequest.openapi(
  'SendEmailRequest',
  {
    description: 'Send an email',
  },
)

export type SendEmailRequest = z.infer<typeof SendEmailRequest>

/**
 * Send email response (raw Zod)
 */
export const SendEmailResponse = z.object({
  messageId: z.string().describe('Unique identifier for the email'),
  status: EmailStatus,
  queuedAt: DateTime.optional(),
  scheduledAt: DateTime.optional(),
})

/**
 * Send email response (OpenAPI documented)
 */
export const SendEmailResponseSchema = SendEmailResponse.openapi(
  'SendEmailResponse',
  {
    description: 'Email send confirmation',
  },
)

export type SendEmailResponse = z.infer<typeof SendEmailResponse>

// ============= Bulk Email =============

/**
 * Bulk email recipient (raw Zod)
 */
export const BulkEmailRecipient = EmailRecipient.extend({
  variables: z
    .record(z.string(), z.any())
    .optional()
    .describe('Recipient-specific template variables'),
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * Bulk email recipient (OpenAPI documented)
 */
export const BulkEmailRecipientSchema = BulkEmailRecipient.openapi(
  'BulkEmailRecipient',
  {
    description: 'Bulk email recipient with custom variables',
  },
)

export type BulkEmailRecipient = z.infer<typeof BulkEmailRecipient>

/**
 * Send bulk email request (raw Zod)
 */
export const SendBulkEmailRequest = z.object({
  recipients: z.array(BulkEmailRecipient).min(1).max(1000),
  subject: z.string().max(255),
  templateId: z.string().describe('Template ID for bulk emails'),

  // Global variables (can be overridden per recipient)
  globalVariables: z.record(z.string(), z.any()).optional(),

  // Options
  priority: EmailPriority.default(MessagePriority.NORMAL),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true),

  // Scheduling
  scheduledAt: DateTime.optional(),
  batchSize: z.number().int().positive().max(100).default(50),
  delayBetweenBatches: z
    .number()
    .int()
    .nonnegative()
    .default(1000)
    .describe('Delay in milliseconds'),
})

/**
 * Send bulk email request (OpenAPI documented)
 */
export const SendBulkEmailRequestSchema = SendBulkEmailRequest.openapi(
  'SendBulkEmailRequest',
  {
    description: 'Send emails to multiple recipients',
  },
)

export type SendBulkEmailRequest = z.infer<typeof SendBulkEmailRequest>

/**
 * Bulk email response (raw Zod)
 */
export const SendBulkEmailResponse = z.object({
  sent: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  logs: z.array(CommunicationLog),
})

/**
 * Bulk email response (OpenAPI documented)
 */
export const SendBulkEmailResponseSchema = SendBulkEmailResponse.openapi(
  'SendBulkEmailResponse',
  {
    description: 'Bulk email send result',
  },
)

export type SendBulkEmailResponse = z.infer<typeof SendBulkEmailResponse>

// ============= Email History =============

/**
 * Email record (raw Zod)
 */
export const EmailRecord = withTimestamps({
  id: UUID,
  messageId: z.string(),
  to: z.array(EmailAddress),
  cc: z.array(EmailAddress).optional(),
  bcc: z.array(EmailAddress).optional(),
  subject: z.string(),
  status: EmailStatus,
  priority: EmailPriority,

  // Content info
  templateId: z.string().optional(),
  hasHtmlContent: z.boolean(),
  hasTextContent: z.boolean(),
  attachmentCount: z.number().int().nonnegative().default(0),

  // Tracking
  sentAt: DateTime.optional(),
  deliveredAt: DateTime.optional(),
  openedAt: DateTime.optional(),
  firstClickedAt: DateTime.optional(),
  openCount: z.number().int().nonnegative().default(0),
  clickCount: z.number().int().nonnegative().default(0),

  // Error info
  failedAt: DateTime.optional(),
  failureReason: z.string().optional(),
  bounceType: BounceType.optional(),

  // Metadata
  metadata: z.record(z.string(), z.any()).optional(),
})

/**
 * Email record (OpenAPI documented)
 */
export const EmailRecordSchema = EmailRecord.openapi('EmailRecord', {
  description: 'Email history record with tracking details',
})

export type EmailRecord = z.infer<typeof EmailRecord>

/**
 * Email search parameters (raw Zod)
 */
export const EmailSearchParams = SearchParams.merge(DateRangeParams).extend({
  to: EmailAddress.optional(),
  subject: z.string().optional(),
  status: EmailStatus.optional(),
  templateId: z.string().optional(),
  hasOpened: z.boolean().optional(),
  hasClicked: z.boolean().optional(),
  sortBy: EmailSortBy.default(EmailSortByEnum.CREATED_AT),
})

/**
 * Email search parameters (OpenAPI documented)
 */
export const EmailSearchParamsSchema = EmailSearchParams.openapi(
  'EmailSearchParams',
  {
    description: 'Email search and filter parameters',
  },
)

export type EmailSearchParams = z.infer<typeof EmailSearchParams>

/**
 * Email history response (raw Zod)
 */
export const EmailHistoryResponse = paginatedResponse(EmailRecord)

/**
 * Email history response (OpenAPI documented)
 */
export const EmailHistoryResponseSchema = EmailHistoryResponse.openapi(
  'EmailHistoryResponse',
  {
    description: 'Paginated email history',
  },
)

export type EmailHistoryResponse = z.infer<typeof EmailHistoryResponse>

// ============= Email Status Updates =============

/**
 * Email event (for webhooks) (raw Zod)
 */
export const EmailEventData = z.object({
  messageId: z.string(),
  event: EmailEvent,
  timestamp: DateTime,
  recipient: EmailAddress,

  // Event-specific data
  url: z.string().url().optional().describe('For click events'),
  bounceType: BounceType.optional(),
  failureReason: z.string().optional(),
  userAgent: z.string().optional().describe('For open/click events'),
  ipAddress: z.string().optional(),
})

/**
 * Email event (OpenAPI documented)
 */
export const EmailEventDataSchema = EmailEventData.openapi('EmailEventData', {
  description: 'Email event data for webhooks',
})

export type EmailEventData = z.infer<typeof EmailEventData>

/**
 * Process email event request (webhook) (raw Zod)
 */
export const ProcessEmailEventRequest = EmailEventData

/**
 * Process email event request (OpenAPI documented)
 */
export const ProcessEmailEventRequestSchema = ProcessEmailEventRequest.openapi(
  'ProcessEmailEventRequest',
  {
    description: 'Process email event from webhook',
  },
)

export type ProcessEmailEventRequest = z.infer<typeof ProcessEmailEventRequest>
