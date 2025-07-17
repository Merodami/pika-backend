import { ICacheService } from '@pika/redis'
import { ErrorFactory, ErrorSeverity, logger } from '@pika/shared'
import type { PaginatedResult } from '@pika/types-core'
import { PrismaClient } from '@prisma/client'
import type { GetUserQuery } from '@user-read/application/use_cases/queries/GetUserQuery.js'
import type { UserSearchQuery } from '@user-read/application/use_cases/queries/UserSearchQuery.js'
import { User } from '@user-read/domain/entities/User.js'
import { UserReadRepositoryPort } from '@user-read/domain/port/user/UserReadRepositoryPort.js'

import { UserDocumentMapper } from '../mappers/UserDocumentMapper.js'

/**
 * Prisma implementation of the UserReadRepository interface
 * Following Admin Service gold standard patterns
 * Uses domain entities instead of DTOs for proper business logic
 */
export class PrismaUserReadRepository implements UserReadRepositoryPort {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly cacheService?: ICacheService,
  ) {}

  /**
   * Builds a Prisma WHERE clause from search parameters
   */
  private buildWhereClause(params: UserSearchQuery): any {
    const where: any = {
      // Exclude soft-deleted users
      deletedAt: null,
    }

    // Filter by role
    if (params.role) {
      where.role = params.role
    }

    // Filter by status
    if (params.status) {
      where.status = params.status
    }

    // Filter by email
    if (params.email) {
      where.email = {
        contains: params.email,
        mode: 'insensitive',
      }
    }

    // Filter by email verification status
    if (params.emailVerified !== undefined) {
      where.emailVerified = params.emailVerified
    }

    // Filter by phone verification status
    if (params.phoneVerified !== undefined) {
      where.phoneVerified = params.phoneVerified
    }

    // Filter by firstName
    if (params.firstName) {
      where.firstName = {
        contains: params.firstName,
        mode: 'insensitive',
      }
    }

    // Filter by lastName
    if (params.lastName) {
      where.lastName = {
        contains: params.lastName,
        mode: 'insensitive',
      }
    }

    // Filter by phoneNumber
    if (params.phoneNumber) {
      where.phoneNumber = {
        contains: params.phoneNumber,
      }
    }

    // Filter by date ranges
    if (params.createdAtStart || params.createdAtEnd) {
      where.createdAt = {}
      if (params.createdAtStart) {
        where.createdAt.gte = params.createdAtStart
      }
      if (params.createdAtEnd) {
        where.createdAt.lte = params.createdAtEnd
      }
    }

    if (params.updatedAtStart || params.updatedAtEnd) {
      where.updatedAt = {}
      if (params.updatedAtStart) {
        where.updatedAt.gte = params.updatedAtStart
      }
      if (params.updatedAtEnd) {
        where.updatedAt.lte = params.updatedAtEnd
      }
    }

    if (params.lastLoginAtStart || params.lastLoginAtEnd) {
      where.lastLoginAt = {}
      if (params.lastLoginAtStart) {
        where.lastLoginAt.gte = params.lastLoginAtStart
      }
      if (params.lastLoginAtEnd) {
        where.lastLoginAt.lte = params.lastLoginAtEnd
      }
    }

    return where
  }

  /**
   * Builds a Prisma order by clause from sort parameters
   */
  private buildOrderByClause(params: UserSearchQuery): any {
    const { sortBy, sortOrder } = params

    // Default to createdAt field if no sort is specified
    const sortField = sortBy || 'createdAt'
    const direction = sortOrder || 'desc'

    // Create and return the orderBy object
    return { [sortField]: direction }
  }

  /**
   * Retrieves all users with filtering, pagination and sorting
   * Returns domain entities for proper business logic
   */
  async getAllUsers(params: UserSearchQuery): Promise<PaginatedResult<User>> {
    const page = params.page || 1
    const limit = params.limit || 20
    const skip = (page - 1) * limit

    try {
      const where = this.buildWhereClause(params)
      const orderBy = this.buildOrderByClause(params)

      // Execute queries in a transaction for consistency
      const [total, users] = await this.prisma.$transaction([
        this.prisma.user.count({ where }),
        this.prisma.user.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
      ])

      // Transform documents to domain entities using mapper
      const data = users.map((document: any) =>
        UserDocumentMapper.mapDocumentToDomain(document),
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
          'query_users',
          'Failed to query users from database',
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaUserReadRepository.getAllUsers',
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
          'Invalid query parameters for user search',
          error,
          {
            severity: ErrorSeverity.WARNING,
            source: 'PrismaUserReadRepository.getAllUsers',
            metadata: { params },
            suggestion: 'Check the structure of the search parameters',
          },
        )
      }

      // Generic error fallback
      logger.error('Error retrieving users:', error)
      throw ErrorFactory.fromError(
        error,
        'Failed to retrieve users due to an unexpected error',
      )
    }
  }

  /**
   * Retrieves a single user by ID
   * Returns domain entity for proper business logic
   */
  async getUserById(params: GetUserQuery): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: params.id,
          deletedAt: null, // Exclude soft-deleted users
        },
      })

      if (!user) {
        return null
      }

      // Transform document to domain entity using mapper
      return UserDocumentMapper.mapDocumentToDomain(user)
    } catch (error) {
      // Use our advanced error handling
      if (error?.name === 'PrismaClientKnownRequestError') {
        // Handle common Prisma error codes
        if (error.code === 'P2023') {
          // Invalid UUID format
          throw ErrorFactory.validationError(
            { id: [`Invalid UUID format for user ID: ${params.id}`] },
            {
              source: 'PrismaUserReadRepository.getUserById',
              metadata: { userId: params.id },
              suggestion: 'Ensure the ID is a valid UUID format',
            },
          )
        }

        // Generic database error
        throw ErrorFactory.databaseError(
          'get_user',
          `Failed to retrieve user with ID ${params.id}`,
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaUserReadRepository.getUserById',
            metadata: {
              userId: params.id,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            retryable: true,
          },
        )
      }

      // Generic error fallback
      logger.error(`Error retrieving user with ID ${params.id}:`, error)
      throw ErrorFactory.fromError(
        error,
        `Failed to retrieve user with ID ${params.id}`,
      )
    }
  }

  /**
   * Retrieves a single user by email
   * Returns domain entity for proper business logic
   */
  async getUserByEmail(params: { email: string }): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          email: params.email,
          deletedAt: null, // Exclude soft-deleted users
        },
      })

      if (!user) {
        return null
      }

      // Transform document to domain entity using mapper
      return UserDocumentMapper.mapDocumentToDomain(user)
    } catch (error) {
      // Use our advanced error handling
      if (error?.name === 'PrismaClientKnownRequestError') {
        // Generic database error
        throw ErrorFactory.databaseError(
          'get_user_by_email',
          `Failed to retrieve user with email ${params.email}`,
          error,
          {
            severity: ErrorSeverity.ERROR,
            source: 'PrismaUserReadRepository.getUserByEmail',
            metadata: {
              email: params.email,
              prismaErrorCode: error.code,
              prismaErrorMeta: error.meta,
            },
            retryable: true,
          },
        )
      }

      // Generic error fallback
      logger.error(`Error retrieving user with email ${params.email}:`, error)
      throw ErrorFactory.fromError(
        error,
        `Failed to retrieve user with email ${params.email}`,
      )
    }
  }
}
