// RedemptionMapper handles transformations without external dependencies

/**
 * Interface representing a Redemption view from the database
 */
export interface RedemptionView {
  id: string
  voucherId: string
  voucherTitle: Record<string, string>
  voucherDiscount: string
  customerId: string
  customerName?: string
  providerId: string
  providerName: string | Record<string, string>
  redeemedAt: Date
  location?: {
    lat: number
    lng: number
  }
}

/**
 * Interface representing a Fraud Case from the database
 */
export interface FraudCase {
  id: string
  caseNumber: string
  redemptionId: string
  detectedAt: Date
  riskScore: number
  flags: Array<{
    type: string
    severity: string
    message: string
  }>
  customerId: string
  providerId: string
  voucherId: string
  status: string
  reviewedAt?: Date
  reviewedBy?: string
  reviewNotes?: string
  actionsTaken?: any[]
  createdAt: Date
  updatedAt: Date
}

/**
 * Redemption mapper that handles transformations for redemption-related entities
 */
export class RedemptionMapper {
  /**
   * Maps a RedemptionView to an API DTO
   */
  static toRedemptionDTO(redemption: RedemptionView): any {
    return {
      id: redemption.id,
      voucher_id: redemption.voucherId,
      voucher_title: redemption.voucherTitle,
      voucher_discount: redemption.voucherDiscount,
      customer_id: redemption.customerId,
      customer_name: redemption.customerName,
      provider_id: redemption.providerId,
      provider_name: redemption.providerName,
      redeemed_at: redemption.redeemedAt.toISOString(),
      location: redemption.location,
    }
  }

  /**
   * Maps a FraudCase to an API DTO
   */
  static toFraudCaseDTO(fraudCase: FraudCase): any {
    return {
      id: fraudCase.id,
      case_number: fraudCase.caseNumber,
      redemption_id: fraudCase.redemptionId,
      detected_at: fraudCase.detectedAt.toISOString(),
      risk_score: fraudCase.riskScore,
      flags: fraudCase.flags,
      customer_id: fraudCase.customerId,
      provider_id: fraudCase.providerId,
      voucher_id: fraudCase.voucherId,
      status: fraudCase.status,
      reviewed_at: fraudCase.reviewedAt?.toISOString(),
      reviewed_by: fraudCase.reviewedBy,
      review_notes: fraudCase.reviewNotes,
      actions_taken: fraudCase.actionsTaken,
      created_at: fraudCase.createdAt.toISOString(),
      updated_at: fraudCase.updatedAt.toISOString(),
    }
  }

  /**
   * Maps fraud statistics to API DTO
   */
  static toFraudStatisticsDTO(stats: {
    totalCases: number
    pendingCases: number
    averageRiskScore: number
    casesByStatus: Record<string, number>
    casesByType: Record<string, number>
    riskScoreDistribution: {
      low: number
      medium: number
      high: number
    }
    timeMetrics: any
  }): any {
    // Calculate additional metrics
    const falsePositiveCount = stats.casesByStatus.FALSE_POSITIVE || 0
    const totalReviewed =
      (stats.casesByStatus.APPROVED || 0) +
      (stats.casesByStatus.REJECTED || 0) +
      falsePositiveCount

    const falsePositiveRate =
      totalReviewed > 0 ? (falsePositiveCount / totalReviewed) * 100 : 0

    // Format top fraud types
    const topFraudTypes = Object.entries(stats.casesByType)
      .map(([type, count]) => ({
        type,
        count,
        percentage: stats.totalCases > 0 ? (count / stats.totalCases) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total_cases: stats.totalCases,
      pending_cases: stats.pendingCases,
      false_positive_rate: Math.round(falsePositiveRate * 100) / 100,
      average_risk_score: Math.round(stats.averageRiskScore),
      top_fraud_types: topFraudTypes,
      risk_score_distribution: {
        low: stats.riskScoreDistribution.low,
        medium: stats.riskScoreDistribution.medium,
        high: stats.riskScoreDistribution.high,
      },
      time_metrics: stats.timeMetrics,
    }
  }

  /**
   * Maps fraud logs to API DTO
   */
  static toFraudLogsDTO(
    logs: Array<{
      voucherId: string
      customerId: string
      providerId: string
      location?: any
      timestamp: Date | string
      flags: any[]
      riskScore: number
    }>,
  ): any {
    return {
      logs: logs.map((log) => ({
        voucher_id: log.voucherId,
        customer_id: log.customerId,
        provider_id: log.providerId,
        location: log.location,
        timestamp:
          typeof log.timestamp === 'string'
            ? log.timestamp
            : log.timestamp.toISOString(),
        flags: log.flags,
        risk_score: log.riskScore,
      })),
    }
  }
}
