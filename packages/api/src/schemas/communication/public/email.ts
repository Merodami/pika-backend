import { z } from 'zod'

import { Email as EmailAddress } from '../../../common/schemas/branded.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Email communication schemas for public API
 */

// ============= Enums =============

export const EmailStatus = z.enum([
  'PENDING',
  'QUEUED',
  'SENT',
  'DELIVERED',
  'BOUNCED',
  'FAILED',
  'OPENED',
  'CLICKED',
])
export type EmailStatus = z.infer<typeof EmailStatus>

export const EmailPriority = z.enum(['LOW', 'NORMAL', 'HIGH'])
export type EmailPriority = z.infer<typeof EmailPriority>

// ============= Email Components =============

/**
 * Email recipient
 */
export const EmailRecipient = z.object({
  email: EmailAddress,
  name: z.string().max(255).optional(),
})
export type EmailRecipient = z.infer<typeof EmailRecipient>

/**
 * Email attachment
 */
export const EmailAttachment = z.object({
  filename: z.string().max(255).describe('Name of the attachment file'),
  content: z.string().describe('Base64 encoded content or URL'),
  contentType: z.string().optional().describe('MIME type of the attachment'),
  size: z.number().int().positive().optional().describe('File size in bytes'),
})
export type EmailAttachment = z.infer<typeof EmailAttachment>

// ============= Send Email =============

/**
 * Send email request
 */
export const SendEmailRequest = openapi(
  z
    .object({
      to: EmailAddress.or(z.array(EmailRecipient)).describe(
        'Primary recipient(s)',
      ),
      cc: z.array(EmailAddress).optional().describe('CC recipients'),
      bcc: z.array(EmailAddress).optional().describe('BCC recipients'),
      subject: z.string().max(255),

      // Template-based email
      templateId: z
        .string()
        .optional()
        .describe('Template ID to use for the email'),
      templateParams: z
        .record(z.any())
        .optional()
        .describe('Parameters to pass to the template'),
      variables: z
        .record(z.any())
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
      priority: EmailPriority.default('NORMAL'),

      // Tracking and metadata
      trackOpens: z.boolean().default(true),
      trackClicks: z.boolean().default(true),
      metadata: z
        .record(z.any())
        .optional()
        .describe('Additional metadata for tracking'),

      // Scheduling
      scheduledAt: DateTime.optional().describe('When to send the email'),

      // Headers
      headers: z.record(z.string()).optional().describe('Custom email headers'),
    })
    .refine(
      (data) =>
        data.templateId || data.htmlContent || data.textContent || data.body,
      { message: 'Either templateId or email content must be provided' },
    ),
  {
    description: 'Send an email',
  },
)

export type SendEmailRequest = z.infer<typeof SendEmailRequest>

/**
 * Send email response
 */
export const SendEmailResponse = openapi(
  z.object({
    messageId: z.string().describe('Unique identifier for the email'),
    status: EmailStatus,
    queuedAt: DateTime.optional(),
    scheduledAt: DateTime.optional(),
  }),
  {
    description: 'Email send confirmation',
  },
)

export type SendEmailResponse = z.infer<typeof SendEmailResponse>

// ============= Bulk Email =============

/**
 * Bulk email recipient
 */
export const BulkEmailRecipient = EmailRecipient.extend({
  variables: z
    .record(z.any())
    .optional()
    .describe('Recipient-specific template variables'),
  metadata: z.record(z.any()).optional(),
})
export type BulkEmailRecipient = z.infer<typeof BulkEmailRecipient>

/**
 * Send bulk email request
 */
export const SendBulkEmailRequest = openapi(
  z.object({
    recipients: z.array(BulkEmailRecipient).min(1).max(1000),
    subject: z.string().max(255),
    templateId: z.string().describe('Template ID for bulk emails'),

    // Global variables (can be overridden per recipient)
    globalVariables: z.record(z.any()).optional(),

    // Options
    priority: EmailPriority.default('NORMAL'),
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
  }),
  {
    description: 'Send emails to multiple recipients',
  },
)

export type SendBulkEmailRequest = z.infer<typeof SendBulkEmailRequest>

/**
 * Bulk email response
 */
export const SendBulkEmailResponse = openapi(
  z.object({
    batchId: z.string(),
    totalRecipients: z.number().int().nonnegative(),
    queued: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    failures: z
      .array(
        z.object({
          email: EmailAddress,
          reason: z.string(),
        }),
      )
      .optional(),
  }),
  {
    description: 'Bulk email send result',
  },
)

export type SendBulkEmailResponse = z.infer<typeof SendBulkEmailResponse>

// ============= Email History =============

/**
 * Email record
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
  bounceType: z.enum(['SOFT', 'HARD']).optional(),

  // Metadata
  metadata: z.record(z.any()).optional(),
})

export type EmailRecord = z.infer<typeof EmailRecord>

/**
 * Email search parameters
 */
export const EmailSearchParams = z.object({
  to: EmailAddress.optional(),
  subject: z.string().optional(),
  status: EmailStatus.optional(),
  templateId: z.string().optional(),
  fromDate: DateTime.optional(),
  toDate: DateTime.optional(),
  hasOpened: z.boolean().optional(),
  hasClicked: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z
    .enum(['SENT_AT', 'DELIVERED_AT', 'OPENED_AT', 'SUBJECT'])
    .default('SENT_AT'),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type EmailSearchParams = z.infer<typeof EmailSearchParams>

/**
 * Email history response
 */
export const EmailHistoryResponse = paginatedResponse(EmailRecord)

export type EmailHistoryResponse = z.infer<typeof EmailHistoryResponse>

// ============= Email Status Updates =============

/**
 * Email event (for webhooks)
 */
export const EmailEvent = z.object({
  messageId: z.string(),
  event: z.enum([
    'SENT',
    'DELIVERED',
    'OPENED',
    'CLICKED',
    'BOUNCED',
    'FAILED',
    'UNSUBSCRIBED',
  ]),
  timestamp: DateTime,
  recipient: EmailAddress,

  // Event-specific data
  url: z.string().url().optional().describe('For click events'),
  bounceType: z.enum(['SOFT', 'HARD']).optional(),
  failureReason: z.string().optional(),
  userAgent: z.string().optional().describe('For open/click events'),
  ipAddress: z.string().optional(),
})

export type EmailEvent = z.infer<typeof EmailEvent>

/**
 * Process email event request (webhook)
 */
export const ProcessEmailEventRequest = EmailEvent

export type ProcessEmailEventRequest = z.infer<typeof ProcessEmailEventRequest>
