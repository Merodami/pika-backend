import { z } from 'zod'

import {
  analyticsResponse,
  AnalyticsDateRange,
  AnalyticsDateRangeSchema,
  Benchmark,
  BenchmarkSchema,
  BusinessPerformanceMetrics,
  BusinessPerformanceMetricsSchema,
  ChartPoint,
  ChartPointSchema,
  CohortData,
  CohortDataSchema,
  FunnelStep,
  FunnelStepSchema,
  GeoDistribution,
  GeoDistributionSchema,
  HealthScore,
  HealthScoreSchema,
  Metric,
  MetricSchema,
  Prediction,
  PredictionSchema,
  TopItem,
  TopItemSchema,
} from '../../shared/analytics.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'

/**
 * Business Service Analytics & Reporting Schemas
 * Focused on business ecosystem health and growth metrics
 */

// ============= Query Parameters =============

/**
 * Business analytics query parameters (raw Zod)
 */
export const BusinessAnalyticsQueryParams = AnalyticsDateRange.extend({
  businessId: UUID.optional().describe('Specific business to analyze'),
  categoryId: UUID.optional().describe('Filter by business category'),
  includeInactive: z.boolean().default(false).describe('Include inactive businesses'),
  includeUnverified: z.boolean().default(false).describe('Include unverified businesses'),
  region: z.string().optional().describe('Filter by geographic region'),
  minRating: z.number().min(0).max(5).optional().describe('Minimum rating filter'),
})

/**
 * Business analytics query parameters (OpenAPI documented)
 */
export const BusinessAnalyticsQueryParamsSchema = BusinessAnalyticsQueryParams.openapi(
  'BusinessAnalyticsQueryParams',
  {
    description: 'Query parameters for business analytics endpoints',
  },
)

export type BusinessAnalyticsQueryParams = z.infer<typeof BusinessAnalyticsQueryParams>

/**
 * Business growth analysis parameters (raw Zod)
 */
export const BusinessGrowthQueryParams = AnalyticsDateRange.extend({
  categoryId: UUID.optional().describe('Filter by business category'),
  cohortType: z.enum(['monthly', 'weekly']).default('monthly').describe('Cohort analysis period'),
})

/**
 * Business growth analysis parameters (OpenAPI documented)
 */
export const BusinessGrowthQueryParamsSchema = BusinessGrowthQueryParams.openapi(
  'BusinessGrowthQueryParams',
  {
    description: 'Query parameters for business growth analysis',
  },
)

export type BusinessGrowthQueryParams = z.infer<typeof BusinessGrowthQueryParams>

// ============= Business-Specific Metrics =============

/**
 * Business registration funnel (raw Zod)
 */
export const BusinessRegistrationFunnel = z.object({
  steps: z.array(FunnelStep).describe('Registration funnel steps'),
  overallConversion: z.number().min(0).max(1).describe('Overall registration conversion rate'),
  avgCompletionTime: Metric.describe('Average time to complete registration (hours)'),
  dropoffReasons: z.array(z.object({
    step: z.string().describe('Step where dropoff occurred'),
    reason: z.string().describe('Dropoff reason'),
    count: z.number().describe('Number of dropoffs'),
  })).describe('Analysis of dropoff reasons'),
})

/**
 * Business registration funnel (OpenAPI documented)
 */
export const BusinessRegistrationFunnelSchema = BusinessRegistrationFunnel.openapi(
  'BusinessRegistrationFunnel',
  {
    description: 'Business registration funnel analysis',
  },
)

export type BusinessRegistrationFunnel = z.infer<typeof BusinessRegistrationFunnel>

/**
 * Business success metrics (raw Zod)
 */
export const BusinessSuccessMetrics = z.object({
  onboardingSuccess: z.object({
    registrationCompletion: Metric.describe('Registration completion rate'),
    firstVoucherCreated: Metric.describe('First voucher creation rate'),
    verificationRequested: Metric.describe('Verification request rate'),
    activeAfter30Days: Metric.describe('Businesses active after 30 days'),
  }),
  engagementMetrics: z.object({
    avgVouchersCreated: Metric.describe('Average vouchers created per business'),
    avgVouchersActive: Metric.describe('Average active vouchers per business'),
    lastLoginDays: Metric.describe('Average days since last login'),
    featureUsage: z.record(z.string(), z.number()).describe('Feature usage rates'),
  }),
  healthScore: HealthScore.describe('Overall business ecosystem health'),
})

/**
 * Business success metrics (OpenAPI documented)
 */
export const BusinessSuccessMetricsSchema = BusinessSuccessMetrics.openapi(
  'BusinessSuccessMetrics',
  {
    description: 'Business success and engagement metrics',
  },
)

export type BusinessSuccessMetrics = z.infer<typeof BusinessSuccessMetrics>

/**
 * Category performance analysis (raw Zod)
 */
export const CategoryPerformance = z.object({
  categoryId: UUID.describe('Category ID'),
  categoryName: z.string().describe('Category name'),
  metrics: z.object({
    businessCount: Metric.describe('Total businesses in category'),
    activeBusinesses: Metric.describe('Active businesses in category'),
    avgRating: Metric.describe('Average rating in category'),
    totalVouchers: Metric.describe('Total vouchers created'),
    redemptionRate: z.number().min(0).max(1).describe('Average redemption rate'),
    avgDiscountValue: Metric.describe('Average discount value'),
  }),
  trends: z.array(ChartPoint).describe('Category growth over time'),
  benchmarks: z.array(Benchmark).describe('Industry benchmarks'),
  insights: z.array(z.string()).describe('Key insights for this category'),
})

/**
 * Category performance analysis (OpenAPI documented)
 */
export const CategoryPerformanceSchema = CategoryPerformance.openapi(
  'CategoryPerformance',
  {
    description: 'Performance analysis for business categories',
  },
)

export type CategoryPerformance = z.infer<typeof CategoryPerformance>

/**
 * Business health assessment (raw Zod)
 */
export const BusinessHealthAssessment = z.object({
  businessId: UUID.describe('Business ID'),
  businessName: z.string().describe('Business name'),
  overallHealth: HealthScore.describe('Overall health score'),
  metrics: z.object({
    voucherActivity: z.number().min(0).max(100).describe('Voucher creation activity score'),
    customerEngagement: z.number().min(0).max(100).describe('Customer engagement score'),
    marketPresence: z.number().min(0).max(100).describe('Market presence score'),
    growthTrajectory: z.number().min(0).max(100).describe('Growth trajectory score'),
  }),
  riskFactors: z.array(z.object({
    factor: z.string().describe('Risk factor'),
    severity: z.enum(['low', 'medium', 'high', 'critical']).describe('Risk severity'),
    impact: z.string().describe('Potential impact'),
    recommendation: z.string().describe('Recommended action'),
  })).describe('Identified risk factors'),
  opportunities: z.array(z.string()).describe('Growth opportunities'),
  predictions: z.array(Prediction).describe('Future performance predictions'),
})

/**
 * Business health assessment (OpenAPI documented)
 */
export const BusinessHealthAssessmentSchema = BusinessHealthAssessment.openapi(
  'BusinessHealthAssessment',
  {
    description: 'Individual business health assessment',
  },
)

export type BusinessHealthAssessment = z.infer<typeof BusinessHealthAssessment>

// ============= Response Schemas =============

/**
 * Business analytics overview response (raw Zod)
 */
export const BusinessAnalyticsOverview = z.object({
  summary: BusinessPerformanceMetrics.describe('High-level business metrics'),
  trends: z.array(ChartPoint).describe('Business growth trends'),
  geography: z.array(GeoDistribution).describe('Geographic distribution'),
  categories: z.array(TopItem).describe('Top performing categories'),
  recentActivity: z.array(z.object({
    date: z.string().describe('Activity date'),
    registrations: z.number().describe('New registrations'),
    activations: z.number().describe('Business activations'),
    verifications: z.number().describe('Verifications completed'),
  })).describe('Recent activity summary'),
})

/**
 * Business analytics overview response (OpenAPI documented)
 */
export const BusinessAnalyticsOverviewSchema = BusinessAnalyticsOverview.openapi(
  'BusinessAnalyticsOverview',
  {
    description: 'Comprehensive business analytics overview',
  },
)

export type BusinessAnalyticsOverview = z.infer<typeof BusinessAnalyticsOverview>

/**
 * Business analytics overview response wrapper
 */
export const BusinessAnalyticsOverviewResponse = analyticsResponse(
  BusinessAnalyticsOverview,
  {
    description: 'Business analytics overview with metadata',
  },
)

export type BusinessAnalyticsOverviewResponse = z.infer<typeof BusinessAnalyticsOverviewResponse>

/**
 * Business growth report response (raw Zod)
 */
export const BusinessGrowthReport = z.object({
  registrationFunnel: BusinessRegistrationFunnel.describe('Registration funnel analysis'),
  cohortAnalysis: z.array(CohortData).describe('Business cohort retention'),
  successMetrics: BusinessSuccessMetrics.describe('Business success indicators'),
  forecasting: z.array(Prediction).describe('Growth forecasting'),
})

/**
 * Business growth report response (OpenAPI documented)
 */
export const BusinessGrowthReportSchema = BusinessGrowthReport.openapi(
  'BusinessGrowthReport',
  {
    description: 'Comprehensive business growth analysis report',
  },
)

export type BusinessGrowthReport = z.infer<typeof BusinessGrowthReport>

/**
 * Business growth report response wrapper
 */
export const BusinessGrowthReportResponse = analyticsResponse(
  BusinessGrowthReport,
  {
    description: 'Business growth analysis with metadata',
  },
)

export type BusinessGrowthReportResponse = z.infer<typeof BusinessGrowthReportResponse>

/**
 * Category analytics response (raw Zod)
 */
export const CategoryAnalyticsResponse = analyticsResponse(
  z.array(CategoryPerformance),
  {
    description: 'Category performance analytics',
  },
)

export type CategoryAnalyticsResponse = z.infer<typeof CategoryAnalyticsResponse>

/**
 * Business health report response (raw Zod)
 */
export const BusinessHealthReportResponse = paginatedResponse(
  BusinessHealthAssessment,
  {
    description: 'Business health assessments with pagination',
  },
)

export type BusinessHealthReportResponse = z.infer<typeof BusinessHealthReportResponse>

/**
 * Individual business detailed analytics (raw Zod)
 */
export const IndividualBusinessAnalytics = z.object({
  basicInfo: z.object({
    businessId: UUID,
    businessName: z.string(),
    category: z.string(),
    registrationDate: z.string().datetime(),
    verifiedDate: z.string().datetime().nullable(),
    status: z.enum(['active', 'inactive', 'suspended']),
  }),
  performance: z.object({
    voucherMetrics: z.object({
      totalCreated: z.number(),
      currentlyActive: z.number(),
      totalRedemptions: z.number(),
      avgRedemptionTime: z.number().describe('Hours'),
    }),
    engagementMetrics: z.object({
      lastLoginDays: z.number(),
      loginFrequency: z.number().describe('Logins per month'),
      featureUsageScore: z.number().min(0).max(100),
    }),
    customerMetrics: z.object({
      uniqueCustomers: z.number(),
      repeatCustomers: z.number(),
      customerSatisfaction: z.number().min(0).max(5).nullable(),
    }),
  }),
  trends: z.object({
    voucherCreation: z.array(ChartPoint),
    customerAcquisition: z.array(ChartPoint),
    revenueImpact: z.array(ChartPoint),
  }),
  insights: z.object({
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    recommendations: z.array(z.string()),
    riskFactors: z.array(z.string()),
  }),
})

/**
 * Individual business detailed analytics (OpenAPI documented)
 */
export const IndividualBusinessAnalyticsSchema = IndividualBusinessAnalytics.openapi(
  'IndividualBusinessAnalytics',
  {
    description: 'Detailed analytics for a specific business',
  },
)

export type IndividualBusinessAnalytics = z.infer<typeof IndividualBusinessAnalytics>

/**
 * Individual business analytics response wrapper
 */
export const IndividualBusinessAnalyticsResponse = analyticsResponse(
  IndividualBusinessAnalytics,
  {
    description: 'Individual business analytics with metadata',
  },
)

export type IndividualBusinessAnalyticsResponse = z.infer<typeof IndividualBusinessAnalyticsResponse>