import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Prisma, PrismaClient } from '@prisma/client'
import type {
  FraudCaseReadRepositoryPort,
  FraudCaseSearchQuery,
  FraudStatisticsQuery,
  FraudStatisticsResult,
} from '@redemption-read/domain/port/fraud/FraudCaseReadRepositoryPort.js'
import { FraudCase } from '@redemption-write/domain/entities/FraudCase.js'
import { get } from 'lodash-es'

/**
 * Prisma implementation of the FraudCaseReadRepository interface
 * Handles read operations for fraud cases
 */
export class PrismaFraudCaseReadRepository
  implements FraudCaseReadRepositoryPort
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(
    params: FraudCaseSearchQuery,
  ): Prisma.FraudCaseWhereInput {
    const where: Prisma.FraudCaseWhereInput = {}

    if (params.status) {
      where.status = params.status
    }

    if (params.providerId) {
      where.providerId = params.providerId
    }

    if (params.customerId) {
      where.customerId = params.customerId
    }

    if (params.fromDate || params.toDate) {
      where.detectedAt = {
        ...(params.fromDate && { gte: params.fromDate }),
        ...(params.toDate && { lte: params.toDate }),
      }
    }

    if (
      params.minRiskScore !== undefined ||
      params.maxRiskScore !== undefined
    ) {
      where.riskScore = {
        ...(params.minRiskScore !== undefined && { gte: params.minRiskScore }),
        ...(params.maxRiskScore !== undefined && { lte: params.maxRiskScore }),
      }
    }

    return where
  }

  /**
   * Maps Prisma fraud case to domain entity
   */
  private mapToDomain(fraudCase: any): FraudCase {
    return new FraudCase(
      fraudCase.id,
      fraudCase.caseNumber,
      fraudCase.redemptionId,
      fraudCase.detectedAt,
      fraudCase.riskScore,
      fraudCase.flags as any[],
      fraudCase.customerId,
      fraudCase.providerId,
      fraudCase.voucherId,
      fraudCase.status,
      fraudCase.createdAt,
      fraudCase.updatedAt,
      fraudCase.detectionMetadata,
      fraudCase.reviewedAt,
      fraudCase.reviewedBy,
      fraudCase.reviewNotes,
      fraudCase.actionsTaken as any[],
    )
  }

  /**
   * Get fraud case by ID
   */
  async getCaseById(id: string): Promise<FraudCase | null> {
    try {
      const fraudCase = await this.prisma.fraudCase.findUnique({
        where: { id },
      })

      return fraudCase ? this.mapToDomain(fraudCase) : null
    } catch (error) {
      logger.error('Error getting fraud case by ID', { error, id })

      throw ErrorFactory.databaseError(
        'get_fraud_case_by_id',
        'Failed to get fraud case',
        error,
        {
          source: 'PrismaFraudCaseReadRepository.getCaseById',
          severity: ErrorSeverity.ERROR,
        },
      )
    }
  }

  /**
   * Search fraud cases with filtering and pagination
   */
  async searchCases(
    params: FraudCaseSearchQuery,
  ): Promise<PaginatedResult<FraudCase>> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    try {
      const where = this.buildWhereClause(params)

      // Execute queries in a transaction for consistency
      const [total, fraudCases] = await this.prisma.$transaction([
        this.prisma.fraudCase.count({ where }),
        this.prisma.fraudCase.findMany({
          where,
          orderBy: { detectedAt: 'desc' },
          skip,
          take: limit,
        }),
      ])

      // Map database documents to domain entities
      const data = fraudCases.map(this.mapToDomain.bind(this))

      // Calculate pagination metadata
      const pages = Math.max(1, Math.ceil(total / limit))

      return {
        data,
        pagination: {
          total,
          page,
          limit,
          pages,
          has_next: page < pages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      logger.error('Error searching fraud cases', { error, params })

      throw ErrorFactory.databaseError(
        'search_fraud_cases',
        'Failed to search fraud cases',
        error,
        {
          source: 'PrismaFraudCaseReadRepository.searchCases',
          severity: ErrorSeverity.ERROR,
          metadata: { params },
        },
      )
    }
  }

  /**
   * Get fraud statistics
   */
  async getStatistics(
    query: FraudStatisticsQuery,
  ): Promise<FraudStatisticsResult> {
    try {
      const where: Prisma.FraudCaseWhereInput = {}

      if (query.providerId) {
        where.providerId = query.providerId
      }

      if (query.period) {
        const now = new Date()

        let fromDate: Date

        switch (query.period) {
          case 'day':
            fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
            break
          case 'week':
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case 'year':
            fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
            break
          default:
            fromDate = new Date(0)
        }

        where.detectedAt = { gte: fromDate }
      }

      // Get all fraud cases for the period
      const fraudCases = await this.prisma.fraudCase.findMany({
        where,
        select: {
          status: true,
          riskScore: true,
          flags: true,
          detectedAt: true,
          reviewedAt: true,
        },
      })

      // Calculate statistics
      const totalCases = fraudCases.length
      const pendingCases = fraudCases.filter(
        (c) => c.status === 'PENDING',
      ).length
      const averageRiskScore =
        totalCases > 0
          ? fraudCases.reduce((sum, c) => sum + c.riskScore, 0) / totalCases
          : 0

      // Group by status
      const casesByStatus = fraudCases.reduce(
        (acc, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1

          return acc
        },
        {} as Record<string, number>,
      )

      // Group by fraud type (from flags)
      const casesByType = fraudCases.reduce(
        (acc, c) => {
          const flags = c.flags as any[]

          flags.forEach((flag) => {
            const type = flag.type || 'UNKNOWN'

            // Using lodash get to avoid object injection
            const currentCount = get(acc, type, 0)

            acc = { ...acc, [type]: currentCount + 1 }
          })

          return acc
        },
        {} as Record<string, number>,
      )

      // Risk score distribution
      const riskScoreDistribution = {
        low: fraudCases.filter((c) => c.riskScore < 40).length,
        medium: fraudCases.filter((c) => c.riskScore >= 40 && c.riskScore < 70)
          .length,
        high: fraudCases.filter((c) => c.riskScore >= 70).length,
      }

      // Time metrics
      const reviewedCases = fraudCases.filter((c) => c.reviewedAt)
      const averageResolutionTime =
        reviewedCases.length > 0
          ? reviewedCases.reduce((sum, c) => {
              const resolutionTime =
                c.reviewedAt!.getTime() - c.detectedAt.getTime()

              return sum + resolutionTime
            }, 0) /
            reviewedCases.length /
            (1000 * 60 * 60) // Convert to hours
          : undefined

      const pendingCasesDates = fraudCases
        .filter((c) => c.status === 'PENDING')
        .map((c) => c.detectedAt)
        .sort((a, b) => a.getTime() - b.getTime())

      const oldestPendingCase =
        pendingCasesDates.length > 0 ? pendingCasesDates[0] : undefined

      return {
        totalCases,
        pendingCases,
        averageRiskScore,
        casesByStatus,
        casesByType,
        riskScoreDistribution,
        timeMetrics: {
          averageResolutionTime,
          oldestPendingCase,
        },
      }
    } catch (error) {
      logger.error('Error getting fraud statistics', { error, query })

      throw ErrorFactory.databaseError(
        'get_fraud_statistics',
        'Failed to get fraud statistics',
        error,
        {
          source: 'PrismaFraudCaseReadRepository.getStatistics',
          severity: ErrorSeverity.ERROR,
          metadata: { query },
        },
      )
    }
  }
}
