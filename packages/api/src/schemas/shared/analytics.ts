import {
  AnalyticsEntity,
  AnalyticsDimension,
  AnalyticsMetric,
  AnalyticsReportType,
  ChartType,
  ExportFormat,
  Priority,
  TimeGranularity,
  TrendDirection,
} from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'
import { createZodEnum } from '../../common/utils/zodEnum.js'
import { SearchParams } from './pagination.js'
import { DateTime } from './primitives.js'
import { paginatedResponse } from './responses.js'

/**
 * Industry Standard Analytics API
 * Based on Google Analytics, Stripe, and Mixpanel patterns
 * Flexible, parameterized approach instead of specific endpoints
 */

// ============= Zod Schema Wrappers for @pika/types Enums =============

export const AnalyticsEntitySchema = createZodEnum(AnalyticsEntity)
export const AnalyticsMetricSchema = createZodEnum(AnalyticsMetric)
export const AnalyticsDimensionSchema = createZodEnum(AnalyticsDimension)
export const TimeGranularitySchema = createZodEnum(TimeGranularity)
export const ChartTypeSchema = createZodEnum(ChartType)
export const TrendDirectionSchema = createZodEnum(TrendDirection)
export const AnalyticsReportTypeSchema = createZodEnum(AnalyticsReportType)
export const ExportFormatSchema = createZodEnum(ExportFormat)
export const PrioritySchema = createZodEnum(Priority)

// ============= Query Parameters =============

/**
 * Generic analytics query (raw Zod) - Industry Standard Pattern
 * Extends SearchParams for consistency with rest of platform
 */
export const AnalyticsQuery = SearchParams.extend({
  // Core analytics parameters
  entity: AnalyticsEntitySchema.describe('What to analyze'),
  metrics: z.array(AnalyticsMetricSchema).min(1).describe('Metrics to calculate'),
  dimensions: z.array(AnalyticsDimensionSchema).optional().describe('Dimensions for grouping'),
  
  // Flexible filtering
  filters: z.record(z.string(), z.any()).optional().describe('Entity-specific filters'),
  dateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }).optional().describe('Date range filter'),
  
  // Analytics-specific options
  granularity: TimeGranularitySchema.default(TimeGranularity.DAY).describe('Time granularity'),
  compareWith: z.enum(['previous_period', 'same_period_last_year']).optional().describe('Comparison period'),
  includeProjections: z.boolean().default(false).describe('Include future projections'),
  format: z.enum(['summary', 'detailed', 'export']).default('summary').describe('Response format'),
})

/**
 * Generic analytics query (OpenAPI documented)
 */
export const AnalyticsQuerySchema = AnalyticsQuery.openapi('AnalyticsQuery', {
  description: 'Flexible analytics query parameters - industry standard pattern',
})

export type AnalyticsQuery = z.infer<typeof AnalyticsQuery>

/**
 * Report request (raw Zod) - Stripe/Mixpanel Pattern
 * Simpler pre-configured reports
 */
export const ReportRequest = z.object({
  reportType: AnalyticsReportTypeSchema.describe('Report type'),
  entity: AnalyticsEntitySchema.describe('Entity to report on'),
  timeframe: z.string().default('30d').describe('Time period (7d, 30d, 90d, 1y)'),
  filters: z.record(z.string(), z.any()).optional().describe('Report filters'),
  includeComparison: z.boolean().default(true).describe('Include period comparison'),
  format: ExportFormatSchema.default(ExportFormat.JSON).describe('Output format'),
})

/**
 * Report request (OpenAPI documented)
 */
export const ReportRequestSchema = ReportRequest.openapi('ReportRequest', {
  description: 'Generic report request - Stripe/Mixpanel pattern',
})

export type ReportRequest = z.infer<typeof ReportRequest>

// ============= Response Types =============

/**
 * Simple metric value (raw Zod)
 */
export const MetricValue = z.object({
  current: z.number().describe('Current value'),
  previous: z.number().optional().describe('Previous period value'),
  change: z.number().optional().describe('Percentage change'),
  trend: TrendDirectionSchema.optional().describe('Trend direction'),
})

export const MetricValueSchema = MetricValue.openapi('MetricValue', {
  description: 'Simple metric with comparison',
})

export type MetricValue = z.infer<typeof MetricValue>

/**
 * Data point (raw Zod)
 */
export const DataPoint = z.object({
  label: z.string().describe('Data point label'),
  value: z.number().describe('Data point value'),
  metadata: z.record(z.string(), z.any()).optional().describe('Additional metadata'),
})

export const DataPointSchema = DataPoint.openapi('DataPoint', {
  description: 'Generic data point',
})

export type DataPoint = z.infer<typeof DataPoint>

/**
 * Time series data (raw Zod)
 */
export const TimeSeries = z.object({
  name: z.string().describe('Series name'),
  data: z.array(z.object({
    date: z.string().describe('Date (ISO string)'),
    value: z.number().describe('Value'),
  })).describe('Time series points'),
})

export const TimeSeriesSchema = TimeSeries.openapi('TimeSeries', {
  description: 'Time series data',
})

export type TimeSeries = z.infer<typeof TimeSeries>

/**
 * Analytics result item for paginated responses (raw Zod)
 */
export const AnalyticsResultItem = z.object({
  entity: z.string().describe('Entity identifier'),
  metrics: z.record(z.string(), z.number()).describe('Metric values'),
  dimensions: z.record(z.string(), z.string()).optional().describe('Dimension values'),
  metadata: z.record(z.string(), z.any()).optional().describe('Additional metadata'),
})

export const AnalyticsResultItemSchema = AnalyticsResultItem.openapi('AnalyticsResultItem', {
  description: 'Individual analytics result item',
})

export type AnalyticsResultItem = z.infer<typeof AnalyticsResultItem>

/**
 * Analytics response (raw Zod) - Industry Standard
 * Uses standard pagination for consistency
 */
export const AnalyticsResponse = paginatedResponse(AnalyticsResultItem).extend({
  // Summary metrics (not paginated)
  summary: z.object({
    totals: z.record(z.string(), MetricValue).describe('Summary totals'),
    averages: z.record(z.string(), z.number()).optional().describe('Average values'),
    comparisons: z.record(z.string(), MetricValue).optional().describe('Period comparisons'),
  }).optional(),
  
  // Aggregated views (not paginated)
  aggregations: z.object({
    byDimension: z.record(z.string(), z.array(DataPoint)).optional().describe('Aggregated by dimension'),
    timeSeries: z.array(TimeSeries).optional().describe('Time series data'),
  }).optional(),
  
  // Query metadata
  metadata: z.object({
    query: z.object({
      entity: z.string(),
      dateRange: z.object({
        start: DateTime,
        end: DateTime,
      }).optional(),
    }),
    generatedAt: DateTime,
    processingTime: z.number().describe('Query processing time (ms)'),
    dataFreshness: DateTime.describe('When data was last updated'),
  }),
})

export const AnalyticsResponseSchema = AnalyticsResponse.openapi('AnalyticsResponse', {
  description: 'Flexible analytics response - industry standard',
})

export type AnalyticsResponse = z.infer<typeof AnalyticsResponse>

/**
 * Report response (raw Zod) - Generic Report Pattern
 */
export const ReportResponse = z.object({
  reportType: z.string().describe('Report type'),
  summary: z.record(z.string(), MetricValue).describe('Key metrics summary'),
  charts: z.array(z.object({
    type: ChartTypeSchema.describe('Chart type'),
    title: z.string().describe('Chart title'),
    data: z.array(DataPoint).describe('Chart data'),
  })).describe('Chart data for visualization'),
  insights: z.array(z.string()).describe('Key insights from the data'),
  recommendations: z.array(z.string()).optional().describe('Action recommendations'),
  metadata: z.object({
    generatedAt: DateTime,
    period: z.object({
      start: DateTime,
      end: DateTime,
    }),
    filters: z.record(z.string(), z.any()).optional(),
  }),
})

export const ReportResponseSchema = ReportResponse.openapi('ReportResponse', {
  description: 'Generic report response with insights',
})

export type ReportResponse = z.infer<typeof ReportResponse>

// ============= Dashboard Schema =============

/**
 * Dashboard widget (raw Zod)
 */
export const DashboardWidget = z.object({
  id: z.string().describe('Widget identifier'),
  type: z.enum(['metric', 'chart', 'table', 'insight']).describe('Widget type'),
  title: z.string().describe('Widget title'),
  config: z.object({
    entity: AnalyticsEntitySchema.optional(),
    metric: AnalyticsMetricSchema.optional(),
    timeframe: z.string().optional(),
    filters: z.record(z.string(), z.any()).optional(),
  }).describe('Widget configuration'),
  data: z.union([
    MetricValue,
    z.array(DataPoint),
    z.array(TimeSeries),
    z.string(),
  ]).describe('Widget data'),
  refreshedAt: DateTime.describe('When widget data was last refreshed'),
})

export const DashboardWidgetSchema = DashboardWidget.openapi('DashboardWidget', {
  description: 'Configurable dashboard widget',
})

export type DashboardWidget = z.infer<typeof DashboardWidget>

/**
 * Dashboard configuration (raw Zod)
 */
export const DashboardConfig = z.object({
  widgets: z.array(z.object({
    id: z.string(),
    type: z.string(),
    title: z.string(),
    entity: AnalyticsEntitySchema,
    metric: AnalyticsMetricSchema,
    timeframe: z.string().default('30d'),
    position: z.object({
      row: z.number(),
      col: z.number(),
      width: z.number().default(1),
      height: z.number().default(1),
    }).optional(),
  })).describe('Widget configurations'),
  refreshInterval: z.number().default(300).describe('Auto-refresh interval (seconds)'),
  defaultTimeframe: z.string().default('30d').describe('Default timeframe for widgets'),
})

export const DashboardConfigSchema = DashboardConfig.openapi('DashboardConfig', {
  description: 'Dashboard configuration schema',
})

export type DashboardConfig = z.infer<typeof DashboardConfig>

/**
 * Dashboard response (raw Zod)
 */
export const DashboardResponse = z.object({
  widgets: z.array(DashboardWidget).describe('Dashboard widgets with data'),
  metadata: z.object({
    generatedAt: DateTime,
    refreshInterval: z.number(),
    autoRefresh: z.boolean().default(true),
  }),
})

export const DashboardResponseSchema = DashboardResponse.openapi('DashboardResponse', {
  description: 'Complete dashboard with all widgets',
})

export type DashboardResponse = z.infer<typeof DashboardResponse>

// ============= Export Collections =============

export const analyticsSchemas = {
  // Query Schemas
  AnalyticsQuerySchema,
  ReportRequestSchema,
  DashboardConfigSchema,
  
  // Response Schemas
  MetricValueSchema,
  DataPointSchema,
  TimeSeriesSchema,
  AnalyticsResponseSchema,
  ReportResponseSchema,
  DashboardWidgetSchema,
  DashboardResponseSchema,
}

export type AnalyticsTypes = {
  AnalyticsQuery: AnalyticsQuery
  ReportRequest: ReportRequest
  MetricValue: MetricValue
  DataPoint: DataPoint
  TimeSeries: TimeSeries
  AnalyticsResponse: AnalyticsResponse
  ReportResponse: ReportResponse
  DashboardWidget: DashboardWidget
  DashboardConfig: DashboardConfig
  DashboardResponse: DashboardResponse
}