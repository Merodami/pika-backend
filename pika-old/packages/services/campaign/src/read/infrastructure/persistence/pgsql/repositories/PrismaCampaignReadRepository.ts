import type { CampaignSearchQuery } from '@campaign-read/application/use_cases/queries/CampaignSearchQuery.js'
import type { GetCampaignQuery } from '@campaign-read/application/use_cases/queries/GetCampaignQuery.js'
import { Campaign } from '@campaign-read/domain/entities/Campaign.js'
import { CampaignReadRepositoryPort } from '@campaign-read/domain/port/campaign/CampaignReadRepositoryPort.js'
import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Prisma, PrismaClient } from '@prisma/client'

import { CampaignDocumentMapper } from '../mappers/CampaignDocumentMapper.js'

/**
 * Prisma implementation of the CampaignReadRepository interface
 * Includes caching strategies for performance optimization
 */
export class PrismaCampaignReadRepository
  implements CampaignReadRepositoryPort
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(
    params: CampaignSearchQuery,
  ): Prisma.CampaignWhereInput {
    const where: Prisma.CampaignWhereInput = {}

    // Filter by provider ID
    if (params.providerId) {
      where.providerId = params.providerId
    }

    // Filter by status - need to cast to proper enum type
    if (params.status) {
      where.status = params.status as Prisma.EnumCampaignStatusFilter
    }

    // Filter by active status
    if (params.active !== undefined) {
      where.active = params.active
    }

    // Filter by start date range
    if (params.startDateFrom || params.startDateTo) {
      where.startDate = {}
      if (params.startDateFrom) {
        where.startDate.gte = params.startDateFrom
      }
      if (params.startDateTo) {
        where.startDate.lte = params.startDateTo
      }
    }

    // Filter by end date range
    if (params.endDateFrom || params.endDateTo) {
      where.endDate = {}
      if (params.endDateFrom) {
        where.endDate.gte = params.endDateFrom
      }
      if (params.endDateTo) {
        where.endDate.lte = params.endDateTo
      }
    }

    // Filter by budget range
    if (params.minBudget !== undefined || params.maxBudget !== undefined) {
      where.budget = {}
      if (params.minBudget !== undefined) {
        where.budget.gte = params.minBudget
      }
      if (params.maxBudget !== undefined) {
        where.budget.lte = params.maxBudget
      }
    }

    // Filter by name - using JSON path for multilingual search
    if (params.name) {
      // This uses Postgres JSON containment to search in name fields
      where.name = {
        path: ['$[*]'],
        array_contains: params.name,
        mode: 'insensitive',
      }
    }

    return where
  }

  /**
   * Builds a Prisma order by clause from sort parameters
   * Uses the standardized sort utility from shared package
   */
  private buildOrderByClause(
    params: CampaignSearchQuery,
  ): Prisma.CampaignOrderByWithRelationInput {
    // Use toPrismaSort utility for consistent handling of sort parameters
    const { sortBy, sortOrder } = params

    // Default to created_at field if no sort is specified
    const sortField = sortBy || 'created_at'
    const direction = sortOrder || 'desc'

    // Create and return the orderBy object
    return { [sortField]: direction }
  }

  /**
   * Retrieves all campaigns with filtering, pagination and sorting
   * Uses caching to improve performance for common queries
   */
  // Repository-level caching removed as per MVP approach
  // Cache moved to controller level only
  async getAllCampaigns(
    params: CampaignSearchQuery,
  ): Promise<PaginatedResult<Campaign>> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    try {
      const where = this.buildWhereClause(params)
      const orderBy = this.buildOrderByClause(params)

      // Execute queries in a transaction for consistency
      const [total, campaigns] = await this.prisma.$transaction([
        this.prisma.campaign.count({ where }),
        this.prisma.campaign.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
      ])

      // Map database documents to domain entities using our mapper
      const data = campaigns.map((document: any) =>
        CampaignDocumentMapper.mapDocumentToDomain(document),
      )

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
      // Use our advanced error handling - detect and categorize database errors
      if (error?.name === 'PrismaClientKnownRequestError') {
        throw ErrorFactory.databaseError(
          'query_campaigns',
          'Failed to query campaigns from database',
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaCampaignReadRepository.getAllCampaigns',
            metadata: {
              params,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            suggestion: 'Check database connectivity and schema validity',
            retryable: true,
          },
        )
      }

      // Handle query parsing errors
      if (error?.name === 'PrismaClientValidationError') {
        throw ErrorFactory.databaseError(
          'validate_query',
          'Invalid query parameters for campaign search',
          error,
          {
            severity: ErrorSeverity.WARNING,
            source: 'PrismaCampaignReadRepository.getAllCampaigns',
            metadata: { params },
            suggestion: 'Check the structure of the search parameters',
          },
        )
      }

      // Generic error fallback
      logger.error('Error retrieving campaigns:', error)
      throw ErrorFactory.fromError(
        error,
        'Failed to retrieve campaigns due to an unexpected error',
      )
    }
  }

  /**
   * Retrieves a single campaign by ID
   * Uses caching to improve performance for individual campaign lookups
   */
  // Repository-level caching removed as per MVP approach
  // Cache moved to controller level only
  async getCampaignById(params: GetCampaignQuery): Promise<Campaign | null> {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: params.id },
      })

      if (!campaign) {
        return null
      }

      return CampaignDocumentMapper.mapDocumentToDomain(campaign as any)
    } catch (error) {
      // Use our advanced error handling
      if (error?.name === 'PrismaClientKnownRequestError') {
        // Handle common Prisma error codes
        if (error.code === 'P2023') {
          // Invalid UUID format
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format for campaign ID: ${params.id}`] },
            {
              source: 'PrismaCampaignReadRepository.getCampaignById',
              metadata: { campaignId: params.id },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Generic database error
        throw ErrorFactory.databaseError(
          'get_campaign',
          `Failed to retrieve campaign with ID ${params.id}`,
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaCampaignReadRepository.getCampaignById',
            metadata: {
              campaignId: params.id,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            retryable: true,
          },
        )
      }

      // Generic error fallback
      logger.error(`Error retrieving campaign with ID ${params.id}:`, error)
      throw ErrorFactory.fromError(
        error,
        `Failed to retrieve campaign with ID ${params.id}`,
      )
    }
  }
}
