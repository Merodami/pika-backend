import type { CategorySearchQuery } from '@category-read/application/use_cases/queries/CategorySearchQuery.js'
import type { GetCategoryQuery } from '@category-read/application/use_cases/queries/GetCategoryQuery.js'
import { Category } from '@category-read/domain/entities/Category.js'
import { CategoryReadRepositoryPort } from '@category-read/domain/port/category/CategoryReadRepositoryPort.js'
import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { Prisma, PrismaClient } from '@prisma/client'

import {
  type CategoryDocument,
  CategoryDocumentMapper,
} from '../mappers/CategoryDocumentMapper.js'
import {
  CategoryInclude,
  CategoryOrderByInput,
  CategoryWhereInput,
} from '../types/PrismaTypes.js'

/**
 * Prisma implementation of the CategoryReadRepository interface
 * Following Admin Service gold standard pattern with comprehensive error handling
 * NO SDK dependencies - pure domain entities
 */
export class PrismaCategoryReadRepository
  implements CategoryReadRepositoryPort
{
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(params: CategorySearchQuery): CategoryWhereInput {
    const where: CategoryWhereInput = {
      // Always exclude E2E test categories from queries
      slug: {
        not: 'test-category-e2e',
      },
    }

    // Filter by parent ID (or root categories)
    if ('parentId' in params) {
      where.parentId = params.parentId as string
    }

    // Filter by level
    if (params.level !== undefined) {
      where.level = params.level
    }

    // Filter by active status
    if (params.active !== undefined) {
      where.active = params.active
    }

    // Filter by slug
    if (params.slug) {
      where.slug = params.slug as string
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
   * Builds a Prisma include clause for relations
   */
  private buildIncludeClause(includeChildren?: boolean): CategoryInclude {
    const include: CategoryInclude = {}

    if (includeChildren) {
      include.children = {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
      }
    }

    return include
  }

  /**
   * Builds a Prisma order by clause from sort parameters
   * Uses the standardized sort utility from shared package
   */
  private buildOrderByClause(
    params: CategorySearchQuery,
  ): CategoryOrderByInput {
    // Use toPrismaSort utility for consistent handling of sort parameters
    const { sortBy, sortOrder } = params

    // Default to sortOrder field if no sort is specified
    const sortField = sortBy || 'sortOrder'
    const direction = sortOrder || 'asc'

    // Create and return the orderBy object
    return { [sortField]: direction }
  }

  /**
   * Retrieves all categories with filtering, pagination and sorting
   * Following Admin Service pattern with proper domain entities
   */
  async getAllCategories(
    params: CategorySearchQuery,
  ): Promise<PaginatedResult<Category>> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    try {
      const where = this.buildWhereClause(params)
      const include = this.buildIncludeClause(params.includeChildren)
      const orderBy = this.buildOrderByClause(params)

      // Execute queries in a transaction for consistency
      const [total, categories] = await this.prisma.$transaction([
        this.prisma.category.count({ where }),
        this.prisma.category.findMany({
          where,
          include,
          orderBy,
          skip,
          take: limit,
        }),
      ])

      // Map database documents to domain entities using custom mapper
      const data = categories.map((document: any) =>
        CategoryDocumentMapper.mapDocumentToDomain(
          document as CategoryDocument,
        ),
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
          'query_categories',
          'Failed to query categories from database',
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaCategoryReadRepository.getAllCategories',
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
          'Invalid query parameters for category search',
          error,
          {
            severity: ErrorSeverity.WARNING,
            source: 'PrismaCategoryReadRepository.getAllCategories',
            metadata: { params },
            suggestion: 'Check the structure of the search parameters',
          },
        )
      }

      // Generic error fallback
      logger.error('Error retrieving categories:', error)
      throw ErrorFactory.fromError(
        error,
        'Failed to retrieve categories due to an unexpected error',
      )
    }
  }

  /**
   * Retrieves a single category by ID
   * Following Admin Service pattern with proper error handling
   */
  async getCategoryById(params: GetCategoryQuery): Promise<Category | null> {
    try {
      const include = this.buildIncludeClause(params.includeChildren)

      const category = await this.prisma.category.findUnique({
        where: { id: params.id },
        include,
      })

      if (!category) {
        return null
      }

      return CategoryDocumentMapper.mapDocumentToDomain(category)
    } catch (error) {
      // Use our advanced error handling
      if (error?.name === 'PrismaClientKnownRequestError') {
        // Handle common Prisma error codes
        if (error.code === 'P2023') {
          // Invalid UUID format
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format for category ID: ${params.id}`] },
            {
              source: 'PrismaCategoryReadRepository.getCategoryById',
              metadata: { categoryId: params.id },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Generic database error
        throw ErrorFactory.databaseError(
          'get_category',
          `Failed to retrieve category with ID ${params.id}`,
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaCategoryReadRepository.getCategoryById',
            metadata: {
              categoryId: params.id,
              includeChildren: params.includeChildren,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            retryable: true,
          },
        )
      }

      // Generic error fallback
      logger.error(`Error retrieving category with ID ${params.id}:`, error)
      throw ErrorFactory.fromError(
        error,
        `Failed to retrieve category with ID ${params.id}`,
      )
    }
  }

  /**
   * Get category by slug - Business logic method
   * Following Admin Service pattern
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { slug },
        include: { children: true },
      })

      if (!category) return null

      return CategoryDocumentMapper.mapDocumentToDomain(category)
    } catch (error) {
      throw this.handleDatabaseError(error, 'getCategoryBySlug', { slug })
    }
  }

  /**
   * Get categories by level - Business logic method
   */
  async getCategoriesByLevel(level: number): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: { level },
        orderBy: { sortOrder: 'asc' },
      })

      return CategoryDocumentMapper.mapDocumentsToDomain(categories)
    } catch (error) {
      throw this.handleDatabaseError(error, 'getCategoriesByLevel', { level })
    }
  }

  /**
   * Check if category has active children
   */
  async hasActiveChildren(categoryId: string): Promise<boolean> {
    try {
      const count = await this.prisma.category.count({
        where: {
          parentId: categoryId,
          active: true,
        },
      })

      return count > 0
    } catch (error) {
      throw this.handleDatabaseError(error, 'hasActiveChildren', { categoryId })
    }
  }

  /**
   * Get full category hierarchy from root to specified category
   */
  async getCategoryHierarchy(categoryId: string): Promise<Category[]> {
    try {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
      })

      if (!category) return []

      // Parse the path to get parent IDs
      const parentIds = category.path.split('/').filter((id) => id && id !== '')

      if (parentIds.length === 0) {
        return [CategoryDocumentMapper.mapDocumentToDomain(category)]
      }

      // Get all categories in the hierarchy
      const hierarchy = await this.prisma.category.findMany({
        where: {
          id: { in: [...parentIds, categoryId] },
        },
        orderBy: { level: 'asc' },
      })

      return CategoryDocumentMapper.mapDocumentsToDomain(hierarchy)
    } catch (error) {
      throw this.handleDatabaseError(error, 'getCategoryHierarchy', {
        categoryId,
      })
    }
  }

  /**
   * Get marketplace visible categories (active and level > 0)
   */
  async getMarketplaceCategories(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          active: true,
          level: { gt: 0 },
          slug: { not: 'test-category-e2e' },
        },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
        include: { children: true },
      })

      return CategoryDocumentMapper.mapDocumentsToDomain(categories)
    } catch (error) {
      throw this.handleDatabaseError(error, 'getMarketplaceCategories')
    }
  }

  /**
   * Get all root categories (no parent)
   */
  async getRootCategories(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          parentId: null,
          slug: { not: 'test-category-e2e' },
        },
        orderBy: { sortOrder: 'asc' },
        include: { children: true },
      })

      return CategoryDocumentMapper.mapDocumentsToDomain(categories)
    } catch (error) {
      throw this.handleDatabaseError(error, 'getRootCategories')
    }
  }

  /**
   * Get all active categories
   */
  async getActiveCategories(): Promise<Category[]> {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          active: true,
          slug: { not: 'test-category-e2e' },
        },
        orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
      })

      return CategoryDocumentMapper.mapDocumentsToDomain(categories)
    } catch (error) {
      throw this.handleDatabaseError(error, 'getActiveCategories')
    }
  }

  /**
   * Comprehensive error handling following Admin Service pattern
   */
  private handleDatabaseError(
    error: any,
    operation: string,
    metadata?: any,
  ): never {
    logger.error(`Database error in ${operation}:`, error)

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation
      if (error.code === 'P2002') {
        const field = (error.meta?.target as string[])?.join(', ') || 'unknown'

        throw ErrorFactory.uniqueConstraintViolation(
          'Category',
          field,
          'unknown',
          {
            source: `PrismaCategoryReadRepository.${operation}`,
            metadata,
          },
        )
      }

      // P2003: Foreign key constraint violation
      if (error.code === 'P2003') {
        throw ErrorFactory.validationError(
          { parentId: ['Parent category does not exist'] },
          {
            source: `PrismaCategoryReadRepository.${operation}`,
            metadata,
          },
        )
      }

      // P2023: Invalid ID format
      if (error.code === 'P2023') {
        throw ErrorFactory.validationError(
          { id: ['Invalid category ID format'] },
          {
            source: `PrismaCategoryReadRepository.${operation}`,
            metadata,
          },
        )
      }

      // P2025: Record not found
      if (error.code === 'P2025') {
        throw ErrorFactory.resourceNotFound(
          'Category',
          metadata?.categoryId || metadata?.id || 'unknown',
          {
            source: `PrismaCategoryReadRepository.${operation}`,
            metadata,
          },
        )
      }
    }

    // Handle validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw ErrorFactory.validationError(
        { query: ['Invalid query parameters'] },
        {
          source: `PrismaCategoryReadRepository.${operation}`,
          metadata,
          suggestion: 'Check the structure of your query parameters',
        },
      )
    }

    // Generic database error
    throw ErrorFactory.databaseError(
      operation,
      'Database operation failed',
      error,
      {
        source: `PrismaCategoryReadRepository.${operation}`,
        metadata,
        severity: ErrorSeverity.ERROR,
        retryable: true,
      },
    )
  }
}
