import { z } from 'zod'

import {
  AnalyticsDateRange,
  AnalyticsDateRangeSchema,
  analyticsResponse,
  ChartPoint,
  ChartPointSchema,
  MetricValue,
  MetricValueSchema,
  TopItem,
  TopItemSchema,
} from '../../shared/analytics.js'
import { UUID } from '../../shared/primitives.js'
import { paginatedResponse } from '../../shared/responses.js'

/**
 * Payment Service Analytics & Reporting Schemas
 * Focused on revenue, transaction, and financial metrics
 */

// ============= Query Parameters =============

/**
 * Payment analytics query parameters (raw Zod)
 */
export const PaymentAnalyticsQueryParams = AnalyticsDateRange.extend({
  businessId: UUID.optional().describe('Filter by specific business'),
  userId: UUID.optional().describe('Filter by specific user'),
  paymentMethod: z.string().optional().describe('Filter by payment method'),
  currency: z.string().default('PYG').describe('Currency filter'),
  minAmount: z.number().optional().describe('Minimum transaction amount'),
  maxAmount: z.number().optional().describe('Maximum transaction amount'),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional().describe('Payment status filter'),
  includeRefunds: z.boolean().default(true).describe('Include refunded transactions'),
})

/**
 * Payment analytics query parameters (OpenAPI documented)
 */
export const PaymentAnalyticsQueryParamsSchema = PaymentAnalyticsQueryParams.openapi(
  'PaymentAnalyticsQueryParams',
  {
    description: 'Query parameters for payment analytics endpoints',
  },
)

export type PaymentAnalyticsQueryParams = z.infer<typeof PaymentAnalyticsQueryParams>

/**
 * Revenue analysis query parameters (raw Zod)
 */
export const RevenueAnalysisQueryParams = AnalyticsDateRange.extend({
  includeProjections: z.boolean().default(false).describe('Include revenue projections'),
  groupBy: z.enum(['day', 'week', 'month', 'business', 'payment_method']).default('day').describe('Grouping dimension'),
  currency: z.string().default('PYG').describe('Currency for analysis'),
})

/**
 * Revenue analysis query parameters (OpenAPI documented)
 */
export const RevenueAnalysisQueryParamsSchema = RevenueAnalysisQueryParams.openapi(
  'RevenueAnalysisQueryParams',
  {
    description: 'Query parameters for revenue analysis',
  },
)

export type RevenueAnalysisQueryParams = z.infer<typeof RevenueAnalysisQueryParams>

// ============= Payment-Specific Metrics =============

/**
 * Transaction volume metrics (raw Zod)
 */
export const TransactionVolumeMetrics = z.object({
  totalTransactions: MetricValue.describe('Total number of transactions'),
  successfulTransactions: MetricValue.describe('Successful transactions'),
  failedTransactions: MetricValue.describe('Failed transactions'),
  refundedTransactions: MetricValue.describe('Refunded transactions'),
  successRate: z.number().min(0).max(1).describe('Transaction success rate'),
  averageTransactionValue: MetricValue.describe('Average transaction value'),
  totalVolume: MetricValue.describe('Total transaction volume'),
})

/**
 * Transaction volume metrics (OpenAPI documented)
 */
export const TransactionVolumeMetricsSchema = TransactionVolumeMetrics.openapi(
  'TransactionVolumeMetrics',
  {
    description: 'Transaction volume and performance metrics',
  },
)

export type TransactionVolumeMetrics = z.infer<typeof TransactionVolumeMetrics>

/**
 * Revenue metrics (raw Zod)
 */
export const RevenueMetrics = z.object({
  totalRevenue: MetricValue.describe('Total revenue generated'),
  netRevenue: MetricValue.describe('Net revenue after fees and refunds'),
  grossRevenue: MetricValue.describe('Gross revenue before deductions'),
  recurringRevenue: MetricValue.describe('Monthly recurring revenue (MRR)'),
  averageOrderValue: MetricValue.describe('Average order value'),
  revenuePerUser: MetricValue.describe('Average revenue per user'),
  revenueBySource: z.array(z.object({
    source: z.string().describe('Revenue source'),
    amount: z.number().describe('Revenue amount'),
    percentage: z.number().min(0).max(100).describe('Percentage of total'),
  })).describe('Revenue breakdown by source'),
})

/**
 * Revenue metrics (OpenAPI documented)
 */
export const RevenueMetricsSchema = RevenueMetrics.openapi('RevenueMetrics', {
  description: 'Comprehensive revenue metrics',
})

export type RevenueMetrics = z.infer<typeof RevenueMetrics>

/**
 * Payment method analytics (raw Zod)
 */
export const PaymentMethodAnalytics = z.object({
  paymentMethod: z.string().describe('Payment method name'),
  metrics: z.object({
    transactionCount: z.number().describe('Number of transactions'),
    successRate: z.number().min(0).max(1).describe('Success rate'),
    averageAmount: z.number().describe('Average transaction amount'),
    totalVolume: z.number().describe('Total transaction volume'),
    processingFees: z.number().describe('Total processing fees'),
  }),
  trends: z.array(ChartPoint).describe('Usage trends over time'),
  performance: z.object({
    averageProcessingTime: z.number().describe('Average processing time (seconds)'),
    errorRate: z.number().min(0).max(1).describe('Error rate'),
    chargebackRate: z.number().min(0).max(1).describe('Chargeback rate'),
  }),
})

/**
 * Payment method analytics (OpenAPI documented)
 */
export const PaymentMethodAnalyticsSchema = PaymentMethodAnalytics.openapi(
  'PaymentMethodAnalytics',
  {
    description: 'Analytics for individual payment methods',
  },
)

export type PaymentMethodAnalytics = z.infer<typeof PaymentMethodAnalytics>

/**
 * Customer payment behavior (raw Zod)
 */
export const CustomerPaymentBehavior = z.object({
  paymentFrequency: z.object({
    oneTime: z.number().describe('One-time payment customers'),
    recurring: z.number().describe('Recurring payment customers'),
    frequent: z.number().describe('Frequent payment customers'),
  }),
  paymentMethods: z.object({
    preferred: z.array(TopItem).describe('Most preferred payment methods'),
    adoption: z.record(z.string(), z.number()).describe('Payment method adoption rates'),
  }),
  transactionPatterns: z.object({
    peakHours: z.array(z.object({
      hour: z.number().min(0).max(23),
      transactionCount: z.number(),
    })),
    peakDays: z.array(z.object({
      day: z.string(),
      transactionCount: z.number(),
    })),
    seasonality: z.array(ChartPoint).describe('Seasonal payment patterns'),
  }),
  customerLifetimeValue: z.object({
    average: z.number().describe('Average customer lifetime value'),
    median: z.number().describe('Median customer lifetime value'),
    distribution: z.array(z.object({
      range: z.string().describe('Value range'),
      count: z.number().describe('Customer count'),
    })),
  }),
})

/**
 * Customer payment behavior (OpenAPI documented)
 */
export const CustomerPaymentBehaviorSchema = CustomerPaymentBehavior.openapi(
  'CustomerPaymentBehavior',
  {
    description: 'Customer payment behavior analysis',
  },
)

export type CustomerPaymentBehavior = z.infer<typeof CustomerPaymentBehavior>

/**
 * Financial health metrics (raw Zod)
 */
export const FinancialHealthMetrics = z.object({
  cashflow: z.object({
    incoming: MetricValue.describe('Incoming cash flow'),
    outgoing: MetricValue.describe('Outgoing cash flow (refunds, fees)'),
    net: MetricValue.describe('Net cash flow'),
  }),
  fees: z.object({
    processingFees: MetricValue.describe('Payment processing fees'),
    platformFees: MetricValue.describe('Platform fees'),
    totalFees: MetricValue.describe('Total fees'),
    feePercentage: z.number().min(0).max(1).describe('Fees as percentage of revenue'),
  }),
  disputes: z.object({
    totalDisputes: MetricValue.describe('Total payment disputes'),
    disputeRate: z.number().min(0).max(1).describe('Dispute rate'),
    chargebacks: MetricValue.describe('Chargeback count'),
    chargebackRate: z.number().min(0).max(1).describe('Chargeback rate'),
  }),
  riskMetrics: z.object({
    fraudulentTransactions: MetricValue.describe('Fraudulent transactions detected'),
    fraudRate: z.number().min(0).max(1).describe('Fraud rate'),
    riskScore: z.number().min(0).max(100).describe('Overall risk score'),
  }),
})

/**
 * Financial health metrics (OpenAPI documented)
 */
export const FinancialHealthMetricsSchema = FinancialHealthMetrics.openapi(
  'FinancialHealthMetrics',
  {
    description: 'Financial health and risk metrics',
  },
)

export type FinancialHealthMetrics = z.infer<typeof FinancialHealthMetrics>

// ============= Response Schemas =============

/**
 * Payment analytics overview (raw Zod)
 */
export const PaymentAnalyticsOverview = z.object({
  summary: z.object({
    transactionMetrics: TransactionVolumeMetrics.describe('Transaction volume metrics'),
    revenueMetrics: RevenueMetrics.describe('Revenue performance metrics'),
    financialHealth: FinancialHealthMetrics.describe('Financial health indicators'),
  }),
  trends: z.object({
    transactionVolume: z.array(ChartPoint).describe('Transaction volume over time'),
    revenue: z.array(ChartPoint).describe('Revenue trends'),
    successRate: z.array(ChartPoint).describe('Success rate trends'),
  }),
  breakdowns: z.object({
    paymentMethods: z.array(PaymentMethodAnalytics).describe('Payment method breakdown'),
    topBusinesses: z.array(TopItem).describe('Top businesses by revenue'),
    geographicRevenue: z.array(z.object({
      region: z.string().describe('Geographic region'),
      revenue: z.number().describe('Revenue from region'),
      transactionCount: z.number().describe('Transaction count'),
    })).describe('Revenue by geographic region'),
  }),
})

/**
 * Payment analytics overview (OpenAPI documented)
 */
export const PaymentAnalyticsOverviewSchema = PaymentAnalyticsOverview.openapi(
  'PaymentAnalyticsOverview',
  {
    description: 'Comprehensive payment analytics overview',
  },
)

export type PaymentAnalyticsOverview = z.infer<typeof PaymentAnalyticsOverview>

/**
 * Payment analytics overview response wrapper
 */
export const PaymentAnalyticsOverviewResponse = analyticsResponse(
  PaymentAnalyticsOverview,
  {
    description: 'Payment analytics overview with metadata',
  },
)

export type PaymentAnalyticsOverviewResponse = z.infer<typeof PaymentAnalyticsOverviewResponse>

/**
 * Revenue analysis report (raw Zod)
 */
export const RevenueAnalysisReport = z.object({
  revenueMetrics: RevenueMetrics.describe('Core revenue metrics'),
  revenueStreams: z.array(z.object({
    stream: z.string().describe('Revenue stream name'),
    amount: z.number().describe('Revenue amount'),
    growth: z.number().describe('Growth percentage'),
    contribution: z.number().min(0).max(1).describe('Contribution to total revenue'),
  })).describe('Revenue stream analysis'),
  projections: z.array(ChartPoint).optional().describe('Revenue projections'),
  insights: z.array(z.string()).describe('Revenue insights'),
  recommendations: z.array(z.string()).describe('Revenue optimization recommendations'),
})

/**
 * Revenue analysis report (OpenAPI documented)
 */
export const RevenueAnalysisReportSchema = RevenueAnalysisReport.openapi(
  'RevenueAnalysisReport',
  {
    description: 'Comprehensive revenue analysis report',
  },
)

export type RevenueAnalysisReport = z.infer<typeof RevenueAnalysisReport>

/**
 * Revenue analysis report response wrapper
 */
export const RevenueAnalysisReportResponse = analyticsResponse(
  RevenueAnalysisReport,
  {
    description: 'Revenue analysis report with metadata',
  },
)

export type RevenueAnalysisReportResponse = z.infer<typeof RevenueAnalysisReportResponse>

/**
 * Payment method performance report (raw Zod)
 */
export const PaymentMethodPerformanceReport = z.object({
  overview: z.object({
    totalMethods: z.number().describe('Number of payment methods'),
    mostUsed: z.string().describe('Most used payment method'),
    bestPerforming: z.string().describe('Best performing payment method'),
    averageSuccessRate: z.number().min(0).max(1).describe('Average success rate'),
  }),
  methodAnalytics: z.array(PaymentMethodAnalytics).describe('Detailed method analytics'),
  comparisons: z.array(z.object({
    method: z.string().describe('Payment method'),
    metrics: z.record(z.string(), z.number()).describe('Key metrics'),
    ranking: z.number().describe('Performance ranking'),
  })).describe('Payment method comparisons'),
  recommendations: z.array(z.object({
    method: z.string().describe('Payment method'),
    recommendation: z.string().describe('Optimization recommendation'),
    expectedImpact: z.string().describe('Expected impact'),
  })).describe('Optimization recommendations'),
})

/**
 * Payment method performance report (OpenAPI documented)
 */
export const PaymentMethodPerformanceReportSchema = PaymentMethodPerformanceReport.openapi(
  'PaymentMethodPerformanceReport',
  {
    description: 'Payment method performance analysis report',
  },
)

export type PaymentMethodPerformanceReport = z.infer<typeof PaymentMethodPerformanceReport>

/**
 * Payment method performance report response wrapper
 */
export const PaymentMethodPerformanceReportResponse = analyticsResponse(
  PaymentMethodPerformanceReport,
  {
    description: 'Payment method performance report with metadata',
  },
)

export type PaymentMethodPerformanceReportResponse = z.infer<typeof PaymentMethodPerformanceReportResponse>

/**
 * Customer payment behavior report response wrapper
 */
export const CustomerPaymentBehaviorReportResponse = analyticsResponse(
  CustomerPaymentBehavior,
  {
    description: 'Customer payment behavior analysis with metadata',
  },
)

export type CustomerPaymentBehaviorReportResponse = z.infer<typeof CustomerPaymentBehaviorReportResponse>

/**
 * Financial health report response wrapper
 */
export const FinancialHealthReportResponse = analyticsResponse(
  FinancialHealthMetrics,
  {
    description: 'Financial health metrics with metadata',
  },
)

export type FinancialHealthReportResponse = z.infer<typeof FinancialHealthReportResponse>

/**
 * Transaction details report (raw Zod)
 */
export const TransactionDetailsReport = paginatedResponse(
  z.object({
    transactionId: UUID.describe('Transaction identifier'),
    amount: z.number().describe('Transaction amount'),
    currency: z.string().describe('Currency code'),
    paymentMethod: z.string().describe('Payment method used'),
    status: z.enum(['pending', 'completed', 'failed', 'refunded']).describe('Transaction status'),
    businessName: z.string().describe('Business name'),
    customerEmail: z.string().email().describe('Customer email'),
    createdAt: z.string().datetime().describe('Transaction timestamp'),
    processingTime: z.number().describe('Processing time in seconds'),
    fees: z.number().describe('Processing fees'),
    metadata: z.record(z.string(), z.any()).optional().describe('Additional transaction metadata'),
  }),
  {
    description: 'Detailed transaction records with pagination',
  },
)

export type TransactionDetailsReport = z.infer<typeof TransactionDetailsReport>