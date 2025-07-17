import { REDIS_DEFAULT_TTL } from '@pika/environment'
import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Prisma, PrismaClient } from '@prisma/client'
import type { GetProviderQuery } from '@provider-read/application/use_cases/queries/GetProviderQuery.js'
import type { ProviderSearchQuery } from '@provider-read/application/use_cases/queries/ProviderSearchQuery.js'
import { Provider } from '@provider-read/domain/entities/Provider.js'
import { ProviderReadRepositoryPort } from '@provider-read/domain/port/provider/ProviderReadRepositoryPort.js'

import { ProviderDocumentMapper } from '../mappers/ProviderDocumentMapper.js'

/**
 * Prisma implementation of the ProviderReadRepository interface
 * Includes caching strategies for performance optimization
 */
export class PrismaProviderReadRepository
  implements ProviderReadRepositoryPort
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(params: ProviderSearchQuery): any {
    const where: any = {
      deletedAt: null, // Only fetch non-deleted providers
    }

    // Filter by user ID
    if (params.userId) {
      where.userId = params.userId
    }

    // Filter by category ID
    if (params.categoryId) {
      where.categoryId = params.categoryId
    }

    // Filter by verification status
    if (params.verified !== undefined) {
      where.verified = params.verified
    }

    // Filter by active status
    if (params.active !== undefined) {
      where.active = params.active
    }

    // Search by business name (multilingual support)
    if (params.businessName) {
      const searchTerm = params.businessName.toLowerCase()

      where.OR = [
        { businessName: { path: ['en'], string_contains: searchTerm } },
        { businessName: { path: ['es'], string_contains: searchTerm } },
        { businessName: { path: ['gn'], string_contains: searchTerm } },
      ]
    }

    // Filter by rating range
    if (params.minRating !== undefined || params.maxRating !== undefined) {
      where.avgRating = {}
      if (params.minRating !== undefined) {
        where.avgRating.gte = params.minRating
      }
      if (params.maxRating !== undefined) {
        where.avgRating.lte = params.maxRating
      }
    }

    return where
  }

  /**
   * Builds the ORDER BY clause from query parameters
   */
  private buildOrderByClause(params: ProviderSearchQuery): any {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = params

    switch (sortBy) {
      case 'businessName':
        // Sort by default language (en)
        return { businessName: sortOrder }
      case 'avgRating':
        return { avgRating: sortOrder }
      case 'updatedAt':
        return { updatedAt: sortOrder }
      case 'createdAt':
      default:
        return { createdAt: sortOrder }
    }
  }

  /**
   * Maps Prisma provider to domain entity
   * Now using local domain entity and mapper
   */
  private mapToDomain(provider: any): Provider {
    return ProviderDocumentMapper.mapDocumentToDomain({
      id: provider.id,
      user_id: provider.userId,
      business_name: provider.businessName,
      business_description: provider.businessDescription,
      category_id: provider.categoryId,
      verified: provider.verified,
      active: provider.active,
      avg_rating: provider.avgRating,
      created_at: provider.createdAt,
      updated_at: provider.updatedAt,
      deleted_at: provider.deletedAt,
      user: provider.user,
    })
  }

  /**
   * Retrieve all providers matching the provided search criteria
   */
  async getAllProviders(
    query: ProviderSearchQuery,
  ): Promise<PaginatedResult<Provider>> {
    try {
      const { page = 1, limit = 20 } = query
      const skip = (page - 1) * limit

      // Build WHERE and ORDER BY clauses
      const where = this.buildWhereClause(query)
      const orderBy = this.buildOrderByClause(query)

      // Execute count and find queries in parallel
      const [totalCount, providers] = await Promise.all([
        this.prisma.provider.count({ where }),
        this.prisma.provider.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            category: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
        }),
      ])

      // Map to domain entities
      const domainProviders = providers.map((provider) =>
        this.mapToDomain(provider),
      )

      const totalPages = Math.ceil(totalCount / limit)

      return {
        data: domainProviders,
        pagination: {
          total: totalCount,
          page,
          limit,
          pages: totalPages,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      }
    } catch (error) {
      // Use comprehensive error handling following Admin pattern
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw ErrorFactory.resourceNotFound('Providers', 'query', {
            source: 'PrismaProviderReadRepository.getAllProviders',
            metadata: { query },
          })
        }
      }

      logger.error('Error fetching providers:', error)
      throw ErrorFactory.databaseError(
        'getAllProviders',
        'Failed to fetch providers from database',
        error,
        {
          source: 'PrismaProviderReadRepository.getAllProviders',
          severity: ErrorSeverity.ERROR,
          metadata: { query },
        },
      )
    }
  }

  /**
   * Retrieve a single provider by its unique identifier
   */
  async getProviderById(query: GetProviderQuery): Promise<Provider | null> {
    try {
      // Try to get from cache first
      const cacheKey = `provider:${query.id}`

      if (this.cacheService) {
        const cached = await this.cacheService.get<string>(cacheKey)

        if (cached) {
          logger.debug(`Cache hit for provider ${query.id}`)

          // Reconstruct domain entity from cached data
          const cachedData = JSON.parse(cached)

          return Provider.create(cachedData)
        }
      }

      const provider = await this.prisma.provider.findFirst({
        where: {
          id: query.id,
          deletedAt: null,
        },
        include: {
          user: query.includeUser
            ? {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  phoneNumber: true,
                  role: true,
                  status: true,
                  avatarUrl: true,
                },
              }
            : false,
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      })

      if (!provider) {
        return null
      }

      const domainProvider = this.mapToDomain(provider)

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          JSON.stringify(domainProvider.toObject()),
          REDIS_DEFAULT_TTL,
        )
      }

      return domainProvider
    } catch (error) {
      logger.error(`Error fetching provider ${query.id}:`, error)

      throw ErrorFactory.databaseError(
        'getProviderById',
        'Failed to fetch provider from database',
        error,
        {
          source: 'PrismaProviderReadRepository.getProviderById',
          severity: ErrorSeverity.ERROR,
          metadata: { providerId: query.id },
        },
      )
    }
  }

  /**
   * Retrieve a provider by user ID
   */
  async getProviderByUserId(userId: string): Promise<Provider | null> {
    try {
      // Try to get from cache first
      const cacheKey = `provider:user:${userId}`

      if (this.cacheService) {
        const cached = await this.cacheService.get<string>(cacheKey)

        if (cached) {
          logger.debug(`Cache hit for provider by user ${userId}`)

          // Reconstruct domain entity from cached data
          const cachedData = JSON.parse(cached)

          return Provider.create(cachedData)
        }
      }

      const provider = await this.prisma.provider.findFirst({
        where: {
          userId,
          deletedAt: null,
        },
        include: {
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
            },
          },
        },
      })

      if (!provider) {
        return null
      }

      const domainProvider = this.mapToDomain(provider)

      // Cache the result
      if (this.cacheService) {
        await this.cacheService.set(
          cacheKey,
          JSON.stringify(domainProvider.toObject()),
          REDIS_DEFAULT_TTL,
        )
      }

      return domainProvider
    } catch (error) {
      logger.error(`Error fetching provider by user ${userId}:`, error)

      throw ErrorFactory.databaseError(
        'getProviderByUserId',
        'Failed to fetch provider from database',
        error,
        {
          source: 'PrismaProviderReadRepository.getProviderByUserId',
          severity: ErrorSeverity.ERROR,
          metadata: { userId },
        },
      )
    }
  }
}
