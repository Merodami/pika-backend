import type { FraudCaseAction, FraudFlag } from '@pika/types-core'
import type { FraudCaseStatus } from '@prisma/client'

/**
 * DTO for creating a fraud case
 */
export interface CreateFraudCaseDTO {
  redemptionId: string
  riskScore: number
  flags: FraudFlag[]
  customerId: string
  providerId: string
  voucherId: string
  detectionMetadata?: Record<string, any>
}

/**
 * DTO for reviewing a fraud case
 */
export interface ReviewFraudCaseDTO {
  status: 'APPROVED' | 'REJECTED' | 'FALSE_POSITIVE'
  notes?: string
  actions?: Array<{
    type:
      | 'block_customer'
      | 'void_redemption'
      | 'flag_provider'
      | 'whitelist_pattern'
    details?: Record<string, any>
  }>
}

/**
 * DTO for fraud case search
 */
export interface FraudCaseSearchDTO {
  status?: FraudCaseStatus
  providerId?: string
  customerId?: string
  fromDate?: Date
  toDate?: Date
  minRiskScore?: number
  page?: number
  limit?: number
}

/**
 * DTO for fraud case response
 */
export interface FraudCaseDTO {
  id: string
  caseNumber: string
  redemptionId: string
  detectedAt: string
  riskScore: number
  flags: FraudFlag[]
  customerId: string
  providerId: string
  voucherId: string
  status: FraudCaseStatus
  reviewedAt?: string
  reviewedBy?: string
  reviewNotes?: string
  actionsTaken?: FraudCaseAction[]
  createdAt: string
  updatedAt: string
}

/**
 * DTO for fraud statistics
 */
export interface FraudStatisticsDTO {
  totalCases: number
  pendingCases: number
  falsePositiveRate: number
  averageRiskScore: number
  topFraudTypes: Array<{
    type: string
    count: number
    percentage: number
  }>
  riskScoreDistribution: {
    low: number // 0-30
    medium: number // 31-70
    high: number // 71-100
  }
  timeMetrics: {
    averageReviewTime: number // hours
    casesLast24h: number
    casesLast7d: number
  }
}
