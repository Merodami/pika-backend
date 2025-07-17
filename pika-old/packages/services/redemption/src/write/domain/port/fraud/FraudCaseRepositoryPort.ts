import type { FraudCaseStatus } from '@prisma/client'

import type {
  CreateFraudCaseDTO,
  FraudCaseSearchDTO,
} from '../../dtos/FraudCaseDTO.js'
import type { FraudCase } from '../../entities/FraudCase.js'

/**
 * Repository interface for fraud case operations
 */
export interface FraudCaseRepositoryPort {
  /**
   * Create a new fraud case
   */
  createCase(dto: CreateFraudCaseDTO): Promise<FraudCase>

  /**
   * Get fraud case by ID
   */
  getCaseById(id: string): Promise<FraudCase | null>

  /**
   * Get fraud case by redemption ID
   */
  getCaseByRedemptionId(redemptionId: string): Promise<FraudCase | null>

  /**
   * Update fraud case
   */
  updateCase(fraudCase: FraudCase): Promise<FraudCase>

  /**
   * Search fraud cases
   */
  searchCases(criteria: FraudCaseSearchDTO): Promise<{
    data: FraudCase[]
    total: number
    page: number
    limit: number
  }>

  /**
   * Get next case number sequence
   */
  getNextCaseNumber(): Promise<number>

  /**
   * Get fraud statistics
   */
  getStatistics(
    providerId?: string,
    period?: 'day' | 'week' | 'month',
  ): Promise<{
    totalCases: number
    pendingCases: number
    casesByStatus: Record<FraudCaseStatus, number>
    averageRiskScore: number
    casesByType: Record<string, number>
    riskScoreDistribution: {
      low: number
      medium: number
      high: number
    }
    timeMetrics: {
      averageReviewTime: number
      casesLast24h: number
      casesLast7d: number
    }
  }>

  /**
   * Add history entry
   */
  addHistoryEntry(
    fraudCaseId: string,
    action: string,
    performedBy: string,
    notes?: string,
    metadata?: Record<string, any>,
  ): Promise<void>
}
