import { ExportFormat, Priority } from '@pika/types'
import { z } from 'zod'

import { createZodEnum } from '../../common/utils/zodEnum.js'
import {
  AnalyticsQuery,
  AnalyticsReportTypeSchema,
  AnalyticsResponseSchema,
  DashboardConfig,
  DashboardResponseSchema,
  ExportFormatSchema,
  ReportRequest,
  ReportResponseSchema,
} from '../shared/analytics.js'
import { UUID } from '../shared/primitives.js'
import { createIncludeParam } from '../shared/query.js'

/**
 * Admin Analytics & Reporting API Schemas
 * Simplified, flexible analytics endpoints - ONE endpoint handles everything
 */

const PrioritySchema = createZodEnum(Priority)

// Relations that can be included in analytics responses
const ANALYTICS_RELATIONS = [
  'details', // Detailed breakdown
  'comparisons', // Period comparisons
  'projections', // Future projections
  'segments', // User/business segments
] as const

// ============= Analytics Query Endpoint =============

/**
 * Admin analytics query - extends base with admin features (raw Zod)
 */
export const AdminAnalyticsQuery = AnalyticsQuery.extend({
  // Admin-specific options
  includeInactive: z
    .boolean()
    .default(false)
    .describe('Include inactive/deleted entities'),
  includeSystemMetrics: z
    .boolean()
    .default(false)
    .describe('Include system performance metrics'),
}).merge(createIncludeParam(ANALYTICS_RELATIONS))

/**
 * Admin analytics query (OpenAPI documented)
 */
export const AdminAnalyticsQuerySchema = AdminAnalyticsQuery.openapi(
  'AdminAnalyticsQuery',
  {
    description: 'Admin analytics query with full access',
  },
)

export type AdminAnalyticsQuery = z.infer<typeof AdminAnalyticsQuery>

// ============= Reports Endpoint =============

/**
 * Admin report types (use AnalyticsReportType from shared analytics)
 */
export const AdminReportType = AnalyticsReportTypeSchema

/**
 * Available report types for admin (OpenAPI documented)
 */
export const AdminReportTypeSchema = AdminReportType.openapi(
  'AdminReportType',
  {
    description: 'Available report types for admin users',
  },
)

export type AdminReportType = z.infer<typeof AdminReportType>

/**
 * Admin report request with additional parameters (raw Zod)
 */
export const AdminReportRequest = ReportRequest.extend({
  reportId: z.string().optional().describe('Specific report configuration ID'),
  exportFormat: ExportFormatSchema.default(ExportFormat.JSON).describe(
    'Export format',
  ),
  includeRawData: z
    .boolean()
    .default(false)
    .describe('Include raw data for analysis'),
  notifications: z
    .object({
      email: z
        .string()
        .email()
        .optional()
        .describe('Email for report delivery'),
      webhook: z
        .string()
        .url()
        .optional()
        .describe('Webhook URL for completion'),
    })
    .optional()
    .describe('Notification preferences'),
})

/**
 * Admin report request with additional parameters (OpenAPI documented)
 */
export const AdminReportRequestSchema = AdminReportRequest.openapi(
  'AdminReportRequest',
  {
    description: 'Admin report request with export and notification options',
  },
)

export type AdminReportRequest = z.infer<typeof AdminReportRequest>

// ============= Dashboard Endpoints =============

/**
 * Dashboard query parameters (raw Zod)
 */
export const DashboardQueryParams = z.object({
  layout: z
    .enum(['default', 'compact', 'detailed'])
    .default('default')
    .describe('Dashboard layout'),
  widgets: z
    .array(z.string())
    .optional()
    .describe('Specific widget IDs to include'),
  refresh: z.boolean().default(false).describe('Force refresh widget data'),
})

/**
 * Dashboard query parameters (OpenAPI documented)
 */
export const DashboardQueryParamsSchema = DashboardQueryParams.openapi(
  'DashboardQueryParams',
  {
    description: 'Query parameters for dashboard endpoint',
  },
)

export type DashboardQueryParams = z.infer<typeof DashboardQueryParams>

/**
 * Dashboard configuration update request (raw Zod)
 */
export const DashboardConfigUpdateRequest = DashboardConfig.extend({
  userId: UUID.optional().describe('User-specific dashboard config'),
  isDefault: z.boolean().default(false).describe('Set as default dashboard'),
})

/**
 * Dashboard configuration update request (OpenAPI documented)
 */
export const DashboardConfigUpdateRequestSchema =
  DashboardConfigUpdateRequest.openapi('DashboardConfigUpdateRequest', {
    description: 'Request to update dashboard configuration',
  })

export type DashboardConfigUpdateRequest = z.infer<
  typeof DashboardConfigUpdateRequest
>

// ============= Insights & Recommendations =============

/**
 * Analytics insights request (raw Zod)
 */
export const InsightsRequest = z.object({
  entity: z
    .enum(['users', 'businesses', 'vouchers', 'payments'])
    .describe('Entity to analyze'),
  timeframe: z.string().default('30d').describe('Analysis timeframe'),
  includeRecommendations: z
    .boolean()
    .default(true)
    .describe('Include actionable recommendations'),
  includeAnomalies: z
    .boolean()
    .default(true)
    .describe('Include anomaly detection'),
  minConfidence: z
    .number()
    .min(0)
    .max(1)
    .default(0.7)
    .describe('Minimum confidence threshold'),
})

/**
 * Analytics insights request (OpenAPI documented)
 */
export const InsightsRequestSchema = InsightsRequest.openapi(
  'InsightsRequest',
  {
    description: 'Request for AI-generated analytics insights',
  },
)

export type InsightsRequest = z.infer<typeof InsightsRequest>

/**
 * Analytics insights response (raw Zod)
 */
export const InsightsResponse = z.object({
  insights: z
    .array(
      z.object({
        type: z
          .enum(['trend', 'anomaly', 'opportunity', 'risk'])
          .describe('Insight type'),
        title: z.string().describe('Insight title'),
        description: z.string().describe('Detailed description'),
        confidence: z.number().min(0).max(1).describe('Confidence score'),
        impact: z
          .enum(['low', 'medium', 'high', 'critical'])
          .describe('Business impact'),
        data: z
          .record(z.string(), z.any())
          .optional()
          .describe('Supporting data'),
      }),
    )
    .describe('Generated insights'),
  recommendations: z
    .array(
      z.object({
        title: z.string().describe('Recommendation title'),
        description: z.string().describe('Detailed recommendation'),
        priority: z
          .enum(['low', 'medium', 'high', 'urgent'])
          .describe('Action priority'),
        estimatedImpact: z.string().describe('Expected business impact'),
        effort: z
          .enum(['low', 'medium', 'high'])
          .describe('Implementation effort'),
        timeline: z.string().describe('Recommended timeline'),
      }),
    )
    .describe('Actionable recommendations'),
  metadata: z.object({
    generatedAt: z.string().datetime(),
    analysisTimeframe: z.object({
      start: z.string().datetime(),
      end: z.string().datetime(),
    }),
    dataPoints: z.number().describe('Number of data points analyzed'),
    processingTime: z.number().describe('Processing time in milliseconds'),
  }),
})

/**
 * Analytics insights response (OpenAPI documented)
 */
export const InsightsResponseSchema = InsightsResponse.openapi(
  'InsightsResponse',
  {
    description: 'AI-generated analytics insights and recommendations',
  },
)

export type InsightsResponse = z.infer<typeof InsightsResponse>

// ============= Export & Scheduling =============

/**
 * Report export request (raw Zod)
 */
export const ReportExportRequest = z.object({
  reportType: AdminReportType.describe('Report type to export'),
  format: ExportFormatSchema.describe('Export format'),
  filters: z.record(z.string(), z.any()).optional().describe('Report filters'),
  schedule: z
    .object({
      frequency: z
        .enum(['once', 'daily', 'weekly', 'monthly'])
        .describe('Export frequency'),
      time: z.string().optional().describe('Scheduled time (HH:MM)'),
      dayOfWeek: z
        .number()
        .int()
        .min(0)
        .max(6)
        .optional()
        .describe('Day of week (0=Sunday)'),
      dayOfMonth: z
        .number()
        .int()
        .min(1)
        .max(31)
        .optional()
        .describe('Day of month'),
    })
    .optional()
    .describe('Export schedule'),
  delivery: z
    .object({
      email: z.string().email().optional().describe('Email delivery'),
      webhook: z.string().url().optional().describe('Webhook delivery'),
      storage: z
        .enum(['s3', 'gcs', 'azure'])
        .optional()
        .describe('Cloud storage'),
    })
    .optional()
    .describe('Delivery options'),
})

/**
 * Report export request (OpenAPI documented)
 */
export const ReportExportRequestSchema = ReportExportRequest.openapi(
  'ReportExportRequest',
  {
    description: 'Request to export report with scheduling options',
  },
)

export type ReportExportRequest = z.infer<typeof ReportExportRequest>

/**
 * Export status response (raw Zod)
 */
export const ExportStatusResponse = z.object({
  exportId: UUID.describe('Export job identifier'),
  status: z
    .enum(['pending', 'processing', 'completed', 'failed'])
    .describe('Export status'),
  progress: z.number().min(0).max(100).describe('Progress percentage'),
  downloadUrl: z
    .string()
    .url()
    .optional()
    .describe('Download URL when completed'),
  error: z.string().optional().describe('Error message if failed'),
  createdAt: z.string().datetime().describe('Export creation time'),
  completedAt: z
    .string()
    .datetime()
    .optional()
    .describe('Export completion time'),
  expiresAt: z
    .string()
    .datetime()
    .optional()
    .describe('Download URL expiration'),
})

/**
 * Export status response (OpenAPI documented)
 */
export const ExportStatusResponseSchema = ExportStatusResponse.openapi(
  'ExportStatusResponse',
  {
    description: 'Status of report export job',
  },
)

export type ExportStatusResponse = z.infer<typeof ExportStatusResponse>

// ============= Response Schemas =============

/**
 * Standard analytics query response
 */
export const AdminAnalyticsResponse = AnalyticsResponseSchema

export type AdminAnalyticsResponse = z.infer<typeof AdminAnalyticsResponse>

/**
 * Standard report response
 */
export const AdminReportResponse = ReportResponseSchema

export type AdminReportResponse = z.infer<typeof AdminReportResponse>

/**
 * Standard dashboard response
 */
export const AdminDashboardResponse = DashboardResponseSchema

export type AdminDashboardResponse = z.infer<typeof AdminDashboardResponse>

// ============= Export Collections =============

export const adminReportSchemas = {
  // Request Schemas
  AdminAnalyticsQuerySchema,
  AdminReportRequestSchema,
  DashboardConfigUpdateRequestSchema,
  InsightsRequestSchema,
  ReportExportRequestSchema,

  // Query Parameter Schemas
  DashboardQueryParamsSchema,

  // Response Schemas
  AdminAnalyticsResponse,
  AdminReportResponse,
  AdminDashboardResponse,
  InsightsResponseSchema,
  ExportStatusResponseSchema,

  // Enum Schemas
  AdminReportTypeSchema,
}

export type AdminReportTypes = {
  AdminAnalyticsQuery: AdminAnalyticsQuery
  AdminReportType: AdminReportType
  AdminReportRequest: AdminReportRequest
  DashboardQueryParams: DashboardQueryParams
  DashboardConfigUpdateRequest: DashboardConfigUpdateRequest
  InsightsRequest: InsightsRequest
  InsightsResponse: InsightsResponse
  ReportExportRequest: ReportExportRequest
  ExportStatusResponse: ExportStatusResponse
}
