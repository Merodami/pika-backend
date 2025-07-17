import type { PaginatedResult } from '@pika/types-core'
import type { FraudCaseStatus } from '@prisma/client'
import type { FraudCase } from '@redemption-write/domain/entities/FraudCase.js'

export interface FraudCaseSearchQuery {
  providerId?: string
  customerId?: string
  status?: FraudCaseStatus
  minRiskScore?: number
  maxRiskScore?: number
  fromDate?: Date
  toDate?: Date
  page?: number
  limit?: number
}

export interface FraudStatisticsQuery {
  providerId?: string
  period?: 'day' | 'week' | 'month' | 'year'
}

export interface FraudStatisticsResult {
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
  timeMetrics: {
    averageResolutionTime?: number
    oldestPendingCase?: Date
  }
}

/**
 * FraudCaseReadRepositoryPort defines the contract for fraud case data access in the read model.
 * Implementations of this interface handle retrieval operations for fraud cases.
 */
export interface FraudCaseReadRepositoryPort {
  /**
   * Retrieve fraud cases matching the provided search criteria
   *
   * @param query - Search parameters for filtering, pagination and sorting
   * @returns Promise with paginated fraud case results
   */
  searchCases(query: FraudCaseSearchQuery): Promise<PaginatedResult<FraudCase>>

  /**
   * Retrieve a single fraud case by its unique identifier
   *
   * @param id - Fraud case ID
   * @returns Promise with the fraud case or null if not found
   */
  getCaseById(id: string): Promise<FraudCase | null>

  /**
   * Get fraud statistics for the given criteria
   *
   * @param query - Statistics query parameters
   * @returns Promise with fraud statistics
   */
  getStatistics(query: FraudStatisticsQuery): Promise<FraudStatisticsResult>
}
