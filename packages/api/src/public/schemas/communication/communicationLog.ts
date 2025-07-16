import { z } from 'zod'

import { UserId } from '../../../common/schemas/branded.js'
import { withTimestamps } from '../../../common/schemas/metadata.js'
import { DateTime, UUID } from '../../../common/schemas/primitives.js'
import { paginatedResponse } from '../../../common/schemas/responses.js'
import { openapi } from '../../../common/utils/openapi.js'

/**
 * Communication log schemas for public API
 */

// ============= Enums =============

export const CommunicationChannel = z.enum([
  'EMAIL',
  'SMS',
  'PUSH',
  'IN_APP',
  'WEBHOOK',
])
export type CommunicationChannel = z.infer<typeof CommunicationChannel>

export const CommunicationStatus = z.enum([
  'PENDING',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'OPENED',
  'CLICKED',
  'UNSUBSCRIBED',
])
export type CommunicationStatus = z.infer<typeof CommunicationStatus>

export const CommunicationDirection = z.enum(['INBOUND', 'OUTBOUND'])
export type CommunicationDirection = z.infer<typeof CommunicationDirection>

// ============= Communication Log =============

/**
 * Communication log entry
 */
export const CommunicationLog = openapi(
  withTimestamps({
    id: UUID,
    channel: CommunicationChannel,
    direction: CommunicationDirection,
    status: CommunicationStatus,

    // Parties involved
    userId: UserId.optional(),
    recipient: z.string().optional().describe('Email, phone, or device ID'),
    sender: z.string().optional(),

    // Content
    subject: z.string().max(255).optional(),
    templateId: UUID.optional(),
    templateName: z.string().optional(),
    content: z.string().optional().describe('Truncated content preview'),

    // Tracking
    messageId: z.string().optional().describe('External message ID'),
    conversationId: z.string().optional().describe('Thread/conversation ID'),
    referenceId: z.string().optional().describe('Related entity ID'),
    referenceType: z.string().optional().describe('Related entity type'),

    // Status timestamps
    sentAt: DateTime.optional(),
    deliveredAt: DateTime.optional(),
    openedAt: DateTime.optional(),
    clickedAt: DateTime.optional(),
    failedAt: DateTime.optional(),

    // Error information
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    bounceType: z.enum(['soft', 'hard']).optional(),

    // Metrics
    openCount: z.number().int().nonnegative().default(0),
    clickCount: z.number().int().nonnegative().default(0),

    // Provider information
    provider: z.string().optional().describe('Email/SMS provider'),
    cost: z.number().nonnegative().optional().describe('Cost in cents'),

    // Additional data
    metadata: z.record(z.any()).optional(),
    tags: z.array(z.string()).default([]),
  }),
  {
    description: 'Communication log entry',
  },
)

export type CommunicationLog = z.infer<typeof CommunicationLog>

// ============= Log Entry Creation =============

/**
 * Create communication log entry
 */
export const CreateCommunicationLogRequest = openapi(
  z.object({
    channel: CommunicationChannel,
    direction: CommunicationDirection.default('OUTBOUND'),
    status: CommunicationStatus.default('PENDING'),
    userId: UserId.optional(),
    recipient: z.string().optional(),
    sender: z.string().optional(),
    subject: z.string().max(255).optional(),
    templateId: UUID.optional(),
    templateName: z.string().optional(),
    content: z.string().optional(),
    messageId: z.string().optional(),
    conversationId: z.string().optional(),
    referenceId: z.string().optional(),
    referenceType: z.string().optional(),
    provider: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    tags: z.array(z.string()).optional(),
  }),
  {
    description: 'Log a communication event',
  },
)

export type CreateCommunicationLogRequest = z.infer<
  typeof CreateCommunicationLogRequest
>

// ============= Status Updates =============

/**
 * Update communication status
 */
export const UpdateCommunicationStatusRequest = openapi(
  z.object({
    status: CommunicationStatus,
    deliveredAt: DateTime.optional(),
    openedAt: DateTime.optional(),
    clickedAt: DateTime.optional(),
    failedAt: DateTime.optional(),
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    bounceType: z.enum(['soft', 'hard']).optional(),
    metadata: z.record(z.any()).optional(),
  }),
  {
    description: 'Update communication status',
  },
)

export type UpdateCommunicationStatusRequest = z.infer<
  typeof UpdateCommunicationStatusRequest
>

// ============= Event Tracking =============

/**
 * Track communication event
 */
export const TrackCommunicationEventRequest = openapi(
  z.object({
    messageId: z.string(),
    event: z.enum([
      'delivered',
      'opened',
      'clicked',
      'bounced',
      'failed',
      'unsubscribed',
    ]),
    timestamp: DateTime,

    // Event details
    url: z.string().url().optional().describe('For click events'),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),

    // Error details
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    bounceType: z.enum(['soft', 'hard']).optional(),
  }),
  {
    description: 'Track a communication event',
  },
)

export type TrackCommunicationEventRequest = z.infer<
  typeof TrackCommunicationEventRequest
>

// ============= Search and Analytics =============

/**
 * Communication log search parameters
 */
export const CommunicationLogSearchParams = z.object({
  channel: CommunicationChannel.optional(),
  direction: CommunicationDirection.optional(),
  status: CommunicationStatus.optional(),
  userId: UserId.optional(),
  recipient: z.string().optional(),
  templateId: UUID.optional(),
  conversationId: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  provider: z.string().optional(),
  tags: z.array(z.string()).optional(),
  fromDate: DateTime.optional(),
  toDate: DateTime.optional(),
  hasOpened: z.boolean().optional(),
  hasClicked: z.boolean().optional(),
  hasFailed: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z.enum(['createdAt', 'sentAt', 'deliveredAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export type CommunicationLogSearchParams = z.infer<
  typeof CommunicationLogSearchParams
>

/**
 * Communication log list response
 */
export const CommunicationLogListResponse = paginatedResponse(CommunicationLog)

export type CommunicationLogListResponse = z.infer<
  typeof CommunicationLogListResponse
>

// ============= Analytics =============

/**
 * Communication analytics request
 */
export const CommunicationAnalyticsRequest = z.object({
  channel: CommunicationChannel.optional(),
  fromDate: DateTime,
  toDate: DateTime,
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  userId: UserId.optional(),
  templateId: UUID.optional(),
  provider: z.string().optional(),
})

export type CommunicationAnalyticsRequest = z.infer<
  typeof CommunicationAnalyticsRequest
>

/**
 * Communication analytics response
 */
export const CommunicationAnalyticsResponse = openapi(
  z.object({
    summary: z.object({
      totalSent: z.number().int().nonnegative(),
      totalDelivered: z.number().int().nonnegative(),
      totalOpened: z.number().int().nonnegative(),
      totalClicked: z.number().int().nonnegative(),
      totalFailed: z.number().int().nonnegative(),
      totalBounced: z.number().int().nonnegative(),
      deliveryRate: z.number().min(0).max(100),
      openRate: z.number().min(0).max(100),
      clickRate: z.number().min(0).max(100),
      bounceRate: z.number().min(0).max(100),
    }),

    byChannel: z.array(
      z.object({
        channel: CommunicationChannel,
        sent: z.number().int().nonnegative(),
        delivered: z.number().int().nonnegative(),
        opened: z.number().int().nonnegative(),
        clicked: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
      }),
    ),

    timeline: z.array(
      z.object({
        date: z.string(),
        sent: z.number().int().nonnegative(),
        delivered: z.number().int().nonnegative(),
        opened: z.number().int().nonnegative(),
        clicked: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
      }),
    ),

    topTemplates: z
      .array(
        z.object({
          templateId: UUID,
          templateName: z.string(),
          sent: z.number().int().nonnegative(),
          openRate: z.number().min(0).max(100),
          clickRate: z.number().min(0).max(100),
        }),
      )
      .optional(),

    costs: z
      .object({
        total: z.number().nonnegative(),
        byChannel: z.record(z.number().nonnegative()),
      })
      .optional(),
  }),
  {
    description: 'Communication analytics data',
  },
)

export type CommunicationAnalyticsResponse = z.infer<
  typeof CommunicationAnalyticsResponse
>

// ============= Bulk Operations =============

/**
 * Bulk log creation
 */
export const BulkCreateCommunicationLogsRequest = openapi(
  z.object({
    logs: z.array(CreateCommunicationLogRequest).min(1).max(1000),
  }),
  {
    description: 'Create multiple communication logs',
  },
)

export type BulkCreateCommunicationLogsRequest = z.infer<
  typeof BulkCreateCommunicationLogsRequest
>

/**
 * Bulk log response
 */
export const BulkCommunicationLogResponse = z.object({
  created: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  errors: z
    .array(
      z.object({
        index: z.number().int().nonnegative(),
        error: z.string(),
      }),
    )
    .optional(),
})

export type BulkCommunicationLogResponse = z.infer<
  typeof BulkCommunicationLogResponse
>
