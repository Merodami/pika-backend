import { ErrorFactory, logger } from '@pika/shared'
import type { FraudCaseStatus } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

import type {
  CreateFraudCaseDTO,
  FraudCaseSearchDTO,
} from '../../../../domain/dtos/FraudCaseDTO.js'
import { FraudCase } from '../../../../domain/entities/FraudCase.js'
import type { FraudCaseRepositoryPort } from '../../../../domain/port/fraud/FraudCaseRepositoryPort.js'

/**
 * Prisma implementation of FraudCaseRepository
 */
export class PrismaFraudCaseRepository implements FraudCaseRepositoryPort {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new fraud case
   */
  async createCase(dto: CreateFraudCaseDTO): Promise<FraudCase> {
    try {
      // Get next case number
      const caseNumber = await this.getNextCaseNumber()
      const caseNumberString = FraudCase.generateCaseNumber(caseNumber)

      const fraudCase = await this.prisma.fraudCase.create({
        data: {
          caseNumber: caseNumberString,
          redemptionId: dto.redemptionId,
          detectedAt: new Date(),
          riskScore: dto.riskScore,
          flags: (dto.flags || []) as any,
          detectionMetadata: (dto.detectionMetadata || {}) as any,
          customerId: dto.customerId,
          providerId: dto.providerId,
          voucherId: dto.voucherId,
          status: 'PENDING',
        },
      })

      // Add initial history entry
      // Note: Using a placeholder UUID for system actions since performedBy requires a valid user UUID
      // In production, this should be a dedicated system user
      const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000'

      await this.addHistoryEntry(
        fraudCase.id,
        'case_created',
        SYSTEM_USER_ID,
        'Fraud case created by detection system',
        { riskScore: dto.riskScore, flagCount: dto.flags.length },
      )

      return this.mapToDomain(fraudCase)
    } catch (error) {
      logger.error('Error creating fraud case', { error, dto })

      if (error.code === 'P2002') {
        throw ErrorFactory.resourceConflict(
          'FraudCase',
          'A fraud case already exists for this redemption',
          {
            source: 'PrismaFraudCaseRepository.createCase',
            metadata: {
              redemptionId: dto.redemptionId,
            },
          },
        )
      }

      throw ErrorFactory.databaseError(
        'create_fraud_case',
        'Failed to create fraud case',
        error,
        {
          source: 'PrismaFraudCaseRepository.createCase',
        },
      )
    }
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
          source: 'PrismaFraudCaseRepository.getCaseById',
        },
      )
    }
  }

  /**
   * Get fraud case by redemption ID
   */
  async getCaseByRedemptionId(redemptionId: string): Promise<FraudCase | null> {
    try {
      const fraudCase = await this.prisma.fraudCase.findUnique({
        where: { redemptionId },
      })

      return fraudCase ? this.mapToDomain(fraudCase) : null
    } catch (error) {
      logger.error('Error getting fraud case by redemption ID', {
        error,
        redemptionId,
      })

      throw ErrorFactory.databaseError(
        'get_fraud_case_by_redemption_id',
        'Failed to get fraud case',
        error,
        {
          source: 'PrismaFraudCaseRepository.getCaseByRedemptionId',
        },
      )
    }
  }

  /**
   * Update fraud case
   */
  async updateCase(fraudCase: FraudCase): Promise<FraudCase> {
    try {
      const updated = await this.prisma.fraudCase.update({
        where: { id: fraudCase.id },
        data: {
          status: fraudCase.status,
          reviewedAt: fraudCase.reviewedAt,
          reviewedBy: fraudCase.reviewedBy,
          reviewNotes: fraudCase.reviewNotes,
          actionsTaken: (fraudCase.actionsTaken || []) as any,
          updatedAt: new Date(),
        },
      })

      return this.mapToDomain(updated)
    } catch (error) {
      logger.error('Error updating fraud case', { error, caseId: fraudCase.id })

      throw ErrorFactory.databaseError(
        'update_fraud_case',
        'Failed to update fraud case',
        error,
        {
          source: 'PrismaFraudCaseRepository.updateCase',
        },
      )
    }
  }

  /**
   * Search fraud cases
   */
  async searchCases(criteria: FraudCaseSearchDTO): Promise<{
    data: FraudCase[]
    total: number
    page: number
    limit: number
  }> {
    try {
      const page = criteria.page || 1
      const limit = criteria.limit || 20
      const skip = (page - 1) * limit

      const where: any = {}

      if (criteria.status) {
        where.status = criteria.status
      }

      if (criteria.providerId) {
        where.providerId = criteria.providerId
      }

      if (criteria.customerId) {
        where.customerId = criteria.customerId
      }

      if (criteria.fromDate || criteria.toDate) {
        where.detectedAt = {
          ...(criteria.fromDate && { gte: criteria.fromDate }),
          ...(criteria.toDate && { lte: criteria.toDate }),
        }
      }

      if (criteria.minRiskScore !== undefined) {
        where.riskScore = { gte: criteria.minRiskScore }
      }

      const [fraudCases, total] = await Promise.all([
        this.prisma.fraudCase.findMany({
          where,
          skip,
          take: limit,
          orderBy: { detectedAt: 'desc' },
        }),
        this.prisma.fraudCase.count({ where }),
      ])

      return {
        data: fraudCases.map(this.mapToDomain.bind(this)),
        total,
        page,
        limit,
      }
    } catch (error) {
      logger.error('Error searching fraud cases', { error, criteria })

      throw ErrorFactory.databaseError(
        'search_fraud_cases',
        'Failed to search fraud cases',
        error,
        {
          source: 'PrismaFraudCaseRepository.searchCases',
        },
      )
    }
  }

  /**
   * Get next case number sequence
   */
  async getNextCaseNumber(): Promise<number> {
    try {
      const year = new Date().getFullYear()
      const pattern = `FRAUD-${year}-%`

      const lastCase = await this.prisma.fraudCase.findFirst({
        where: {
          caseNumber: {
            startsWith: pattern.replace('%', ''),
          },
        },
        orderBy: {
          caseNumber: 'desc',
        },
      })

      if (!lastCase) {
        return 1
      }

      const lastNumber = parseInt(lastCase.caseNumber.split('-')[2])

      return lastNumber + 1
    } catch (error) {
      logger.error('Error getting next case number', { error })

      return 1 // Fallback to 1 if error
    }
  }

  /**
   * Get fraud statistics
   */
  async getStatistics(
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
  }> {
    try {
      const where: any = {}

      if (providerId) {
        where.providerId = providerId
      }

      if (period) {
        const now = new Date()

        let startDate: Date

        switch (period) {
          case 'day':
            startDate = new Date(now.setDate(now.getDate() - 1))
            break
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7))
            break
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1))
            break
        }

        where.detectedAt = { gte: startDate }
      }

      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const [
        totalCases,
        pendingCases,
        casesByStatus,
        avgRiskScore,
        allCases,
        casesLast24h,
        casesLast7d,
        reviewedCases,
      ] = await Promise.all([
        this.prisma.fraudCase.count({ where }),
        this.prisma.fraudCase.count({
          where: { ...where, status: { in: ['PENDING', 'REVIEWING'] } },
        }),
        this.prisma.fraudCase.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
        this.prisma.fraudCase.aggregate({
          where,
          _avg: { riskScore: true },
        }),
        this.prisma.fraudCase.findMany({
          where,
          select: { riskScore: true, flags: true },
        }),
        this.prisma.fraudCase.count({
          where: {
            ...where,
            detectedAt: { gte: oneDayAgo },
          },
        }),
        this.prisma.fraudCase.count({
          where: {
            ...where,
            detectedAt: { gte: sevenDaysAgo },
          },
        }),
        this.prisma.fraudCase.findMany({
          where: {
            ...where,
            status: { in: ['APPROVED', 'REJECTED', 'FALSE_POSITIVE'] },
            reviewedAt: { not: null },
          },
          select: {
            detectedAt: true,
            reviewedAt: true,
          },
        }),
      ])

      // Process cases by type
      const casesByType: Record<string, number> = {}

      let low = 0,
        medium = 0,
        high = 0

      allCases.forEach((fraudCase) => {
        // Count risk score distribution
        if (fraudCase.riskScore <= 30) low++
        else if (fraudCase.riskScore <= 70) medium++
        else high++

        // Count fraud types
        const flags = fraudCase.flags as any[]

        flags.forEach((flag: any) => {
          casesByType[flag.type] = (casesByType[flag.type] || 0) + 1
        })
      })

      // Convert status grouping to record
      const statusRecord: Record<FraudCaseStatus, number> = {
        PENDING: 0,
        REVIEWING: 0,
        APPROVED: 0,
        REJECTED: 0,
        FALSE_POSITIVE: 0,
      }

      casesByStatus.forEach((group) => {
        statusRecord[group.status] = group._count
      })

      // Calculate average review time
      let averageReviewTime = 0

      if (reviewedCases.length > 0) {
        const reviewTimes = reviewedCases.map((c) => {
          const detected = new Date(c.detectedAt).getTime()
          const reviewed = new Date(c.reviewedAt!).getTime()

          return (reviewed - detected) / (1000 * 60 * 60) // Convert to hours
        })

        averageReviewTime =
          reviewTimes.reduce((a, b) => a + b, 0) / reviewTimes.length
      }

      return {
        totalCases,
        pendingCases,
        casesByStatus: statusRecord,
        averageRiskScore: avgRiskScore._avg.riskScore || 0,
        casesByType,
        riskScoreDistribution: { low, medium, high },
        timeMetrics: {
          averageReviewTime: Math.round(averageReviewTime * 10) / 10, // Round to 1 decimal
          casesLast24h,
          casesLast7d,
        },
      }
    } catch (error) {
      logger.error('Error getting fraud statistics', {
        error,
        providerId,
        period,
      })

      throw ErrorFactory.databaseError(
        'get_fraud_statistics',
        'Failed to get fraud statistics',
        error,
        {
          source: 'PrismaFraudCaseRepository.getStatistics',
        },
      )
    }
  }

  /**
   * Add history entry
   */
  async addHistoryEntry(
    fraudCaseId: string,
    action: string,
    performedBy: string,
    notes?: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.fraudCaseHistory.create({
        data: {
          fraudCaseId,
          action,
          performedBy,
          notes,
          metadata,
        },
      })
    } catch (error) {
      logger.error('Error adding fraud case history', {
        error,
        fraudCaseId,
        action,
      })
      // Don't throw - history is non-critical
    }
  }

  /**
   * Map Prisma result to domain entity
   */
  private mapToDomain(data: any): FraudCase {
    return new FraudCase(
      data.id,
      data.caseNumber,
      data.redemptionId,
      data.detectedAt,
      data.riskScore,
      data.flags as any,
      data.customerId,
      data.providerId,
      data.voucherId,
      data.status,
      data.createdAt,
      data.updatedAt,
      data.detectionMetadata as any,
      data.reviewedAt || undefined,
      data.reviewedBy || undefined,
      data.reviewNotes || undefined,
      data.actionsTaken as any,
    )
  }
}
