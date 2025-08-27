import {
  AnalyticsEntity,
  AnalyticsDimension,
  AnalyticsMetric,
  ChartType,
  ExportFormat,
  Priority,
  ReportType,
  TimeGranularity,
  TrendDirection,
} from '@pika/types'
import { z } from 'zod'

import { openapi } from '../../common/utils/openapi.js'
import { createZodEnum } from '../../common/utils/zodEnum.js'
import { DateTime } from './primitives.js'

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
export const ReportTypeSchema = createZodEnum(ReportType)
export const ExportFormatSchema = createZodEnum(ExportFormat)
export const PrioritySchema = createZodEnum(Priority)

// ============= Query Parameters =============

/**
 * Generic analytics query (raw Zod) - Industry Standard Pattern
 */
export const AnalyticsQuery = z.object({
  entity: AnalyticsEntitySchema.describe('What to analyze'),
  metrics: z.array(AnalyticsMetricSchema).describe('What metrics to calculate'),
  dimensions: z.array(AnalyticsDimensionSchema).optional().describe('How to group/slice data'),
  filters: z.record(z.string(), z.any()).optional().describe('Data filters'),
  dateRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  }).optional().describe('Date range filter'),
  granularity: TimeGranularitySchema.default(TimeGranularity.DAY).describe('Time granularity'),
  limit: z.number().max(1000).default(100).describe('Result limit'),
  compareWith: z.enum(['previous_period', 'same_period_last_year']).optional().describe('Comparison period'),
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
 */
export const ReportRequest = z.object({
  reportType: z.enum(['overview', 'growth', 'performance', 'engagement', 'health']).describe('Report type'),
  entity: AnalyticsEntitySchema.describe('Entity to report on'),
  timeframe: z.string().default('30d').describe('Time period (7d, 30d, 90d, 1y)'),
  segments: z.array(z.string()).optional().describe('User/business segments to include'),
  breakdown: TimeGranularitySchema.optional().describe('Time breakdown'),
  includeComparison: z.boolean().default(true).describe('Include period comparison'),
  includeForecasting: z.boolean().default(false).describe('Include predictions'),
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
  trend: z.enum(['up', 'down', 'stable']).optional().describe('Trend direction'),
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
 * Analytics response (raw Zod) - Industry Standard
 */
export const AnalyticsResponse = z.object({
  query: AnalyticsQuery.describe('Original query parameters'),
  results: z.object({
    metrics: z.record(z.string(), MetricValue).describe('Calculated metrics'),
    dimensions: z.record(z.string(), z.array(DataPoint)).describe('Dimensional breakdowns'),
    timeSeries: z.array(TimeSeries).optional().describe('Time-based data'),
  }),
  metadata: z.object({
    generatedAt: DateTime,
    processingTime: z.number().describe('Query processing time (ms)'),
    dataFreshness: DateTime.describe('When data was last updated'),
    totalRows: z.number().describe('Total data points analyzed'),
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
    type: z.enum(['line', 'bar', 'pie', 'table']).describe('Chart type'),
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